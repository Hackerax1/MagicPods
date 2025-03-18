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

# Initialize rate limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
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

# Active scanning sessions
active_sessions = {}

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            logger.warn("missing_auth_header")
            return jsonify({'error': 'Authorization header is missing'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            logger.warn("expired_token", token=token[:10])
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            logger.warn("invalid_token", token=token[:10])
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            logger.error("auth_error", error=str(e))
            return jsonify({'error': 'Invalid authorization header'}), 401
            
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
        
    def start(self):
        try:
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                logger.error("camera_error", user_id=self.user_id)
                return False
            
            self.thread = threading.Thread(target=self._scan_loop)
            self.thread.daemon = True
            self.thread.start()
            return True
        except Exception as e:
            logger.error("session_start_error", user_id=self.user_id, error=str(e))
            return False
        
    def _scan_loop(self):
        while self.active:
            try:
                ret, frame = self.cap.read()
                if not ret:
                    logger.error("frame_capture_error", user_id=self.user_id)
                    break
                    
                self.last_frame = frame.copy()
                
                if time.time() - self.last_activity >= 1.0:
                    self._process_frame(frame)
                    self.last_activity = time.time()
                    
                time.sleep(0.1)
            except Exception as e:
                logger.error("scan_loop_error", user_id=self.user_id, error=str(e))
                break
            
        if self.cap:
            self.cap.release()
            
    def _process_frame(self, frame):
        try:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            text = pytesseract.image_to_string(img)
            
            if text and text.strip():
                self.last_scan_result = text.strip()
                self.scan_count += 1
                logger.info(
                    "live_scan_success",
                    user_id=self.user_id,
                    scan_count=self.scan_count,
                    text_preview=text[:30]
                )
        except Exception as e:
            logger.error("frame_processing_error", user_id=self.user_id, error=str(e))
            
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
        
    def stop(self):
        self.active = False
        if self.thread:
            self.thread.join(timeout=1.0)

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
        logger.error(
            "card_scan_error",
            user_id=request.user.get('id'),
            error=str(e)
        )
        return jsonify({'error': 'Failed to process image'}), 500

@app.route('/scan/live/start', methods=['POST'])
@require_auth
@limiter.limit("5 per minute")
@metrics.counter('live_scan_sessions_total', 'Number of live scanning sessions started')
def start_live_scan():
    user_id = request.user.get('id')
    
    if user_id in active_sessions:
        active_sessions[user_id].stop()
    
    session = LiveScannerSession(user_id)
    if not session.start():
        return jsonify({'error': 'Failed to start camera'}), 500
        
    active_sessions[user_id] = session
    
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
    
    if user_id not in active_sessions:
        return jsonify({'error': 'No active scanning session'}), 404
        
    session = active_sessions[user_id]
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
    
    if user_id in active_sessions:
        active_sessions[user_id].stop()
        del active_sessions[user_id]
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
        'active_sessions': len(active_sessions)
    })

@app.errorhandler(429)
def ratelimit_handler(e):
    logger.warn("rate_limit_exceeded", user_id=request.user.get('id') if hasattr(request, 'user') else None)
    return jsonify({'error': 'Rate limit exceeded'}), 429

@app.teardown_appcontext
def cleanup(exception=None):
    for user_id, session in list(active_sessions.items()):
        session.stop()
    active_sessions.clear()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)