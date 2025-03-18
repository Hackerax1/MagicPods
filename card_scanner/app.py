# Card Scanning Microservice using Tesseract OCR

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import pytesseract
from PIL import Image
import io
import jwt
from functools import wraps
import os
import sys
from dotenv import load_dotenv
import cv2
import numpy as np
import threading
import time
import base64
import json
import structlog
from prometheus_flask_exporter import PrometheusMetrics
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import traceback
from prometheus_client import Counter, Histogram, Gauge
from werkzeug.exceptions import HTTPException
import socket
import platform
import psutil
import logging
import backoff

# Initialize Flask
app = Flask(__name__)

# Setup CORS
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
CORS(app, resources={
    r"/*": {
        "origins": CORS_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"],
        "expose_headers": ["X-RateLimit-Limit", "X-RateLimit-Remaining"]
    }
})

# Initialize logging
logging.basicConfig(level=logging.INFO)
log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
numeric_level = getattr(logging, log_level, None)
if not isinstance(numeric_level, int):
    raise ValueError(f'Invalid log level: {log_level}')
logging.getLogger().setLevel(numeric_level)

# Initialize structured logging
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

# Initialize metrics
metrics = PrometheusMetrics(app)
metrics.info('card_scanner_app_info', 'Card Scanner Application Info', 
             version=os.getenv('APP_VERSION', '1.0.0'))

# Custom metrics
SCAN_DURATION = Histogram(
    'card_scan_duration_seconds',
    'Time spent processing card scans',
    ['method']  # 'single' or 'live'
)
SCAN_ERRORS = Counter(
    'card_scan_errors_total',
    'Number of scanning errors',
    ['error_type']
)
ACTIVE_SESSIONS = Gauge(
    'active_scanning_sessions',
    'Number of active scanning sessions'
)
RETRY_ATTEMPTS = Counter(
    'retry_attempts_total',
    'Number of retry attempts',
    ['operation']
)

# Initialize rate limiter with Redis backend for production
REDIS_URL = os.getenv('REDIS_URL')
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=REDIS_URL if REDIS_URL else "memory://"
)

# Load environment variables
load_dotenv()

# Get JWT secret
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    logger.error("missing_jwt_secret", error="JWT_SECRET environment variable is not set!")
    raise ValueError("JWT_SECRET environment variable must be set")

# Retry configuration
MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))
RETRY_DELAY = float(os.getenv('RETRY_DELAY', '1.0'))
RETRY_MAX_DELAY = float(os.getenv('RETRY_MAX_DELAY', '10.0'))

# Session timeout configuration
SESSION_TIMEOUT = int(os.getenv('SESSION_TIMEOUT', '300'))  # 5 minutes default

# Active scanning sessions with automatic cleanup
class SessionManager:
    def __init__(self):
        self.sessions = {}
        self.lock = threading.RLock()
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
    
    def add_session(self, user_id: str, session: 'LiveScannerSession'):
        with self.lock:
            if user_id in self.sessions:
                self.sessions[user_id].stop()
            self.sessions[user_id] = session
            ACTIVE_SESSIONS.set(len(self.sessions))
    
    def remove_session(self, user_id: str):
        with self.lock:
            if user_id in self.sessions:
                self.sessions[user_id].stop()
                del self.sessions[user_id]
                ACTIVE_SESSIONS.set(len(self.sessions))
    
    def get_session(self, user_id: str):
        with self.lock:
            return self.sessions.get(user_id)
    
    def _cleanup_loop(self):
        while True:
            try:
                current_time = time.time()
                to_remove = []
                
                with self.lock:
                    for user_id, session in self.sessions.items():
                        if current_time - session.last_activity > SESSION_TIMEOUT:
                            to_remove.append(user_id)
                
                for user_id in to_remove:
                    logger.info("session_timeout", user_id=user_id)
                    self.remove_session(user_id)
                
                time.sleep(60)
            except Exception as e:
                logger.error("cleanup_loop_error", error=str(e), traceback=traceback.format_exc())
                time.sleep(60)  # Keep trying even if there's an error

session_manager = SessionManager()

# Authentication decorator with retry support
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warn("missing_auth_header")
            return jsonify({'error': 'Missing authentication'}), 401

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            logger.warn("expired_token")
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError as e:
            logger.warn("invalid_token", error=str(e))
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

class LiveScannerSession:
    def __init__(self, user_id):
        self.user_id = user_id
        self.active = True
        self.last_frame = None
        self.last_scan_result = None
        self.last_activity = time.time()
        self.thread = None
        self.cap = None
        self.scan_count = 0
        self.error_count = 0
        self.lock = threading.RLock()
        self.consecutive_frames_processed = 0
        
    def start(self):
        try:
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                logger.error("camera_error", user_id=self.user_id)
                SCAN_ERRORS.labels(error_type='camera_init').inc()
                return False
            
            self.thread = threading.Thread(target=self._scan_loop)
            self.thread.daemon = True
            self.thread.start()
            return True
        except Exception as e:
            logger.error("session_start_error", user_id=self.user_id, error=str(e), traceback=traceback.format_exc())
            SCAN_ERRORS.labels(error_type='session_start').inc()
            return False

    @SCAN_DURATION.labels(method='live').time()
    def _process_frame(self, frame):
        try:
            with self.lock:
                # Apply preprocessing to improve OCR quality
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
                
                # Apply OCR
                img = Image.fromarray(thresh)
                text = pytesseract.image_to_string(img)
                
                if text and text.strip():
                    self.last_scan_result = text.strip()
                    self.scan_count += 1
                    self.error_count = 0  # Reset error count on success
                    self.consecutive_frames_processed += 1
                    logger.info(
                        "live_scan_success",
                        user_id=self.user_id,
                        scan_count=self.scan_count,
                        consecutive_frames=self.consecutive_frames_processed,
                        text_preview=text[:30]
                    )
                else:
                    self.consecutive_frames_processed = 0
        except Exception as e:
            self.error_count += 1
            self.consecutive_frames_processed = 0
            logger.error(
                "frame_processing_error", 
                user_id=self.user_id, 
                error=str(e),
                traceback=traceback.format_exc(),
                error_count=self.error_count
            )
            SCAN_ERRORS.labels(error_type='frame_processing').inc()
            
            if self.error_count > 10:  # Stop session if too many errors
                self.stop()
                
    def _scan_loop(self):
        frame_interval = 0.2  # Process at most 5 frames per second
        last_processed = time.time()
        
        while self.active:
            try:
                with self.lock:
                    if not self.cap or not self.cap.isOpened():
                        logger.error("camera_closed", user_id=self.user_id)
                        break
                    
                    ret, frame = self.cap.read()
                    if not ret:
                        # Try to reinitialize the camera on failure
                        self._reinitialize_camera()
                        continue
                        
                    self.last_frame = frame.copy()
                    self.last_activity = time.time()
                
                # Process frame if enough time has passed
                current_time = time.time()
                if current_time - last_processed >= frame_interval:
                    self._process_frame(frame)
                    last_processed = current_time
                    
                time.sleep(0.05)
            except Exception as e:
                logger.error("scan_loop_error", user_id=self.user_id, error=str(e), traceback=traceback.format_exc())
                SCAN_ERRORS.labels(error_type='scan_loop').inc()
                time.sleep(1)  # Wait before retrying
            
        # Cleanup
        with self.lock:
            if self.cap:
                self.cap.release()
                self.cap = None

    def _reinitialize_camera(self):
        """Attempt to reinitialize the camera after a failure"""
        logger.info("reinitializing_camera", user_id=self.user_id)
        try:
            if self.cap:
                self.cap.release()
                
            time.sleep(1)  # Give the camera time to reset
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                logger.error("camera_reinit_failed", user_id=self.user_id)
                SCAN_ERRORS.labels(error_type='camera_reinit').inc()
                self.error_count += 1
                return False
            return True
        except Exception as e:
            logger.error("camera_reinit_error", user_id=self.user_id, error=str(e))
            SCAN_ERRORS.labels(error_type='camera_reinit').inc()
            self.error_count += 1
            return False

    def stop(self):
        self.active = False
        logger.info("stopping_session", user_id=self.user_id)
        
        with self.lock:
            if self.cap:
                try:
                    self.cap.release()
                except Exception as e:
                    logger.error("camera_release_error", user_id=self.user_id, error=str(e))
                finally:
                    self.cap = None
            
        if self.thread:
            try:
                self.thread.join(timeout=2.0)
            except Exception as e:
                logger.error("thread_join_error", user_id=self.user_id, error=str(e))
            
    def get_current_frame_base64(self):
        with self.lock:
            if self.last_frame is not None:
                try:
                    _, buffer = cv2.imencode('.jpg', self.last_frame)
                    return base64.b64encode(buffer).decode('utf-8')
                except Exception as e:
                    logger.error("frame_encoding_error", user_id=self.user_id, error=str(e))
        return None
        
    def get_scan_result(self):
        with self.lock:
            result = self.last_scan_result
            self.last_scan_result = None
            return result

# Retry decorator using backoff package
def with_retry(max_tries=MAX_RETRIES, operation_name="unknown"):
    def decorator(func):
        @wraps(func)
        @backoff.on_exception(
            backoff.expo,
            (IOError, ConnectionError, TimeoutError),
            max_tries=max_tries,
            max_time=30,  # Maximum 30 seconds of retrying
            on_backoff=lambda details: RETRY_ATTEMPTS.labels(operation=operation_name).inc()
        )
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

@app.route('/scan', methods=['POST'])
@require_auth
@limiter.limit("30 per minute")
@metrics.counter(
    'card_scans_total',
    'Number of card scan attempts',
    labels={'status': lambda r: r.status_code}
)
def scan_card():
    if 'image' not in request.files:
        logger.warn("missing_image", user_id=request.user.get('id'))
        return jsonify({'error': 'No image provided'}), 400

    with SCAN_DURATION.labels(method='single').time():
        try:
            image_file = request.files['image']
            image = Image.open(io.BytesIO(image_file.read()))
            
            # Apply image preprocessing for better OCR
            image_np = np.array(image)
            
            # If image is color, convert to grayscale
            if len(image_np.shape) > 2 and image_np.shape[2] == 3:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
                
            # Apply adaptive thresholding
            _, thresh = cv2.threshold(image_np, 150, 255, cv2.THRESH_BINARY)
            
            # Apply OCR to preprocessed image
            processed_image = Image.fromarray(thresh)
            text = pytesseract.image_to_string(processed_image)

            logger.info(
                "card_scan_success",
                user_id=request.user.get('id'),
                text_preview=text[:30]
            )

            return jsonify({
                'text': text,
                'userId': request.user.get('id')
            })
        except Exception as e:
            SCAN_ERRORS.labels(error_type='single_scan').inc()
            logger.error(
                "card_scan_error",
                user_id=request.user.get('id'),
                error=str(e),
                traceback=traceback.format_exc()
            )
            return jsonify({'error': 'Failed to process image'}), 500

@app.route('/scan/live/start', methods=['POST'])
@require_auth
@limiter.limit("5 per minute")
@metrics.counter('live_scan_sessions_total', 'Number of live scanning sessions started')
def start_live_scan():
    user_id = request.user.get('id')
    
    # Clean up existing session if any
    session_manager.remove_session(user_id)
    
    session = LiveScannerSession(user_id)
    if not session.start():
        return jsonify({'error': 'Failed to start camera'}), 500
        
    session_manager.add_session(user_id, session)
    
    logger.info("live_session_started", user_id=user_id)
    return jsonify({
        'message': 'Live scanning session started',
        'userId': user_id
    })

@app.route('/scan/live/frame', methods=['GET'])
@require_auth
@limiter.limit("60 per minute")
def get_live_frame():
    user_id = request.user.get('id')
    
    session = session_manager.get_session(user_id)
    if not session:
        return jsonify({'error': 'No active scanning session'}), 404
        
    frame_base64 = session.get_current_frame_base64()
    
    if not frame_base64:
        return jsonify({'error': 'No frame available'}), 404
        
    return jsonify({
        'frame': frame_base64,
        'result': session.get_scan_result()
    })

@app.route('/scan/live/stop', methods=['POST'])
@require_auth
def stop_live_scan():
    user_id = request.user.get('id')
    session_manager.remove_session(user_id)
    logger.info("live_session_stopped", user_id=user_id)
    
    return jsonify({
        'message': 'Live scanning session stopped',
        'userId': user_id
    })

@app.route('/metrics')
def metrics():
    return Response(metrics.generate_metrics(), mimetype='text/plain')

@app.route('/health')
def health_check():
    system_info = {
        'cpu_percent': psutil.cpu_percent(),
        'memory_percent': psutil.virtual_memory().percent,
        'hostname': socket.gethostname(),
        'platform': platform.platform(),
        'python_version': platform.python_version()
    }
    
    tessdata_dir = os.getenv('TESSDATA_PREFIX', '/usr/share/tessdata')
    has_tessdata = os.path.exists(tessdata_dir)
    
    health_status = {
        'status': 'healthy',
        'timestamp': time.time(),
        'active_sessions': len(session_manager.sessions),
        'tessdata_available': has_tessdata,
        'system': system_info,
        'version': os.getenv('APP_VERSION', '1.0.0')
    }
    
    # Check if any key system components are unhealthy
    if system_info['memory_percent'] > 95 or system_info['cpu_percent'] > 95:
        health_status['status'] = 'warning'
        
    if not has_tessdata:
        health_status['status'] = 'critical'
        
    status_code = 200
    if health_status['status'] == 'critical':
        status_code = 503  # Service Unavailable
    
    return jsonify(health_status), status_code

@app.errorhandler(429)
def ratelimit_handler(e):
    logger.warn("rate_limit_exceeded", 
               user_id=getattr(request, 'user', {}).get('id'),
               endpoint=request.endpoint)
    return jsonify({'error': 'Rate limit exceeded'}), 429

@app.errorhandler(Exception)
def handle_error(e):
    code = 500
    if isinstance(e, HTTPException):
        code = e.code
    
    error_id = str(time.time())
    logger.error(
        "unhandled_exception",
        error_id=error_id,
        error=str(e),
        traceback=traceback.format_exc()
    )
    
    return jsonify({
        'error': 'An unexpected error occurred',
        'error_id': error_id,
        'detail': str(e) if app.debug else 'Internal server error'
    }), code

@app.teardown_appcontext
def cleanup(exception=None):
    for user_id, session in list(session_manager.sessions.items()):
        session.stop()
    session_manager.sessions.clear()

if __name__ == '__main__':
    try:
        # Test Tesseract availability
        pytesseract.get_tesseract_version()
        logger.info("starting_server", host="0.0.0.0", port=5000, debug=app.debug)
        app.run(host='0.0.0.0', port=5000)
    except Exception as e:
        logger.error("startup_failed", error=str(e), traceback=traceback.format_exc())
        sys.exit(1)