# Card Scanning Microservice using Tesseract OCR

from flask import Flask, request, jsonify, Response
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

# Initialize Flask first so we can use app.logger
app = Flask(__name__)

# Load environment variables
load_dotenv()

# Get JWT secret from environment variable
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    app.logger.error("JWT_SECRET environment variable is not set!")
    raise ValueError("JWT_SECRET environment variable must be set")
else:
    # Log first few characters of secret for debugging (never log the full secret)
    app.logger.info(f"JWT_SECRET loaded successfully (starts with: {JWT_SECRET[:3]}...)")

# Dictionary to store active scanning sessions
active_sessions = {}

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
            # Verify the token
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            # Add user info to request context
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception:
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
        
    def start(self):
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            app.logger.error(f"Failed to open camera for user {self.user_id}")
            return False
        
        self.thread = threading.Thread(target=self._scan_loop)
        self.thread.daemon = True
        self.thread.start()
        return True
        
    def _scan_loop(self):
        while self.active:
            ret, frame = self.cap.read()
            if not ret:
                app.logger.error(f"Failed to capture frame for user {self.user_id}")
                break
                
            self.last_frame = frame.copy()
            
            # Process the frame for OCR every few frames
            if time.time() - self.last_activity >= 1.0:  # Process every second
                self._process_frame(frame)
                self.last_activity = time.time()
                
            time.sleep(0.1)  # Short sleep to prevent high CPU usage
            
        # Clean up resources
        if self.cap:
            self.cap.release()
            
    def _process_frame(self, frame):
        try:
            # Convert to PIL Image for tesseract
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            text = pytesseract.image_to_string(img)
            
            if text and text.strip():
                self.last_scan_result = text
                app.logger.info(f"Live scan result for user {self.user_id}: {text[:30]}...")
        except Exception as e:
            app.logger.error(f"Error processing frame: {e}")
            
    def get_current_frame_base64(self):
        if self.last_frame is not None:
            _, buffer = cv2.imencode('.jpg', self.last_frame)
            return base64.b64encode(buffer).decode('utf-8')
        return None
        
    def get_scan_result(self):
        result = self.last_scan_result
        self.last_scan_result = None  # Clear after reading
        return result
        
    def stop(self):
        self.active = False
        if self.thread:
            self.thread.join(timeout=1.0)

@app.route('/scan', methods=['POST'])
@require_auth
def scan_card():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    image = Image.open(io.BytesIO(image_file.read()))
    text = pytesseract.image_to_string(image)

    # Log the scan attempt with user information
    user_id = request.user.get('id')
    app.logger.info(f"Card scan attempt by user {user_id}")

    return jsonify({
        'text': text,
        'userId': user_id
    })

@app.route('/scan/live/start', methods=['POST'])
@require_auth
def start_live_scan():
    user_id = request.user.get('id')
    
    # Check if session already exists
    if user_id in active_sessions:
        # Close existing session
        active_sessions[user_id].stop()
    
    # Create new session
    session = LiveScannerSession(user_id)
    if not session.start():
        return jsonify({'error': 'Failed to start camera'}), 500
        
    active_sessions[user_id] = session
    
    app.logger.info(f"Live scanning session started for user {user_id}")
    return jsonify({
        'message': 'Live scanning session started',
        'userId': user_id
    })

@app.route('/scan/live/frame', methods=['GET'])
@require_auth
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
        app.logger.info(f"Live scanning session stopped for user {user_id}")
    
    return jsonify({
        'message': 'Live scanning session stopped',
        'userId': user_id
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

# Clean up function to be called when the application shuts down
@app.teardown_appcontext
def cleanup(exception=None):
    for user_id, session in list(active_sessions.items()):
        session.stop()
    active_sessions.clear()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)