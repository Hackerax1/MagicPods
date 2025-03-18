# Card Scanning Microservice using Tesseract OCR

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import pytesseract
from PIL import Image
import io
import jwt
from functools import wraps
import os
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

# Initialize metrics
metrics = PrometheusMetrics(app)
metrics.info('card_scanner_app_info', 'Card Scanner Application Info')

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

# Initialize rate limiter with Redis backend for production
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv('REDIS_URL', "memory://")
)

# Initialize structured logging
logger = structlog.get_logger()

# Load environment variables
load_dotenv()

# Get JWT secret
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    logger.error("missing_jwt_secret", error="JWT_SECRET environment variable is not set!")
    raise ValueError("JWT_SECRET environment variable must be set")

# Active scanning sessions with automatic cleanup
class SessionManager:
    def __init__(self):
        self.sessions = {}
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
    
    def add_session(self, user_id: str, session: 'LiveScannerSession'):
        self.sessions[user_id] = session
        ACTIVE_SESSIONS.inc()
    
    def remove_session(self, user_id: str):
        if user_id in self.sessions:
            self.sessions[user_id].stop()
            del self.sessions[user_id]
            ACTIVE_SESSIONS.dec()
    
    def _cleanup_loop(self):
        while True:
            current_time = time.time()
            to_remove = []
            for user_id, session in self.sessions.items():
                if current_time - session.last_activity > 300:  # 5 minute timeout
                    to_remove.append(user_id)
            
            for user_id in to_remove:
                logger.info("session_timeout", user_id=user_id)
                self.remove_session(user_id)
            
            time.sleep(60)

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
            logger.error("session_start_error", user_id=self.user_id, error=str(e))
            SCAN_ERRORS.labels(error_type='session_start').inc()
            return False

    @SCAN_DURATION.labels(method='live').time()
    def _process_frame(self, frame):
        try:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            text = pytesseract.image_to_string(img)
            
            if text and text.strip():
                self.last_scan_result = text.strip()
                self.scan_count += 1
                self.error_count = 0  # Reset error count on success
                logger.info(
                    "live_scan_success",
                    user_id=self.user_id,
                    scan_count=self.scan_count,
                    text_preview=text[:30]
                )
        except Exception as e:
            self.error_count += 1
            logger.error(
                "frame_processing_error", 
                user_id=self.user_id, 
                error=str(e),
                error_count=self.error_count
            )
            SCAN_ERRORS.labels(error_type='frame_processing').inc()
            
            if self.error_count > 10:  # Stop session if too many errors
                self.stop()
                
    def _scan_loop(self):
        while self.active:
            try:
                ret, frame = self.cap.read()
                if not ret:
                    logger.error("frame_capture_error", user_id=self.user_id)
                    SCAN_ERRORS.labels(error_type='frame_capture').inc()
                    break
                    
                self.last_frame = frame.copy()
                self.last_activity = time.time()
                
                if time.time() - self.last_activity >= 1.0:
                    self._process_frame(frame)
                    
                time.sleep(0.1)
            except Exception as e:
                logger.error("scan_loop_error", user_id=self.user_id, error=str(e))
                SCAN_ERRORS.labels(error_type='scan_loop').inc()
                break
            
        if self.cap:
            self.cap.release()

    def stop(self):
        self.active = False
        if self.thread:
            self.thread.join(timeout=1.0)
            
    def get_current_frame_base64(self):
        if self.last_frame is not None:
            try:
                _, buffer = cv2.imencode('.jpg', self.last_frame)
                return base64.b64encode(buffer).decode('utf-8')
            except Exception as e:
                logger.error("frame_encoding_error", user_id=self.user_id, error=str(e))
        return None
        
    def get_scan_result(self):
        result = self.last_scan_result
        self.last_scan_result = None
        return result

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
            text = pytesseract.image_to_string(image)

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
    
    if user_id not in session_manager.sessions:
        return jsonify({'error': 'No active scanning session'}), 404
        
    session = session_manager.sessions[user_id]
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
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'active_sessions': len(session_manager.sessions)
    })

@app.errorhandler(429)
def ratelimit_handler(e):
    logger.warn("rate_limit_exceeded", 
               user_id=getattr(request, 'user', {}).get('id'),
               endpoint=request.endpoint)
    return jsonify({'error': 'Rate limit exceeded'}), 429

@app.teardown_appcontext
def cleanup(exception=None):
    for user_id, session in list(session_manager.sessions.items()):
        session.stop()
    session_manager.sessions.clear()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)