# Card Scanning Microservice using Tesseract OCR

from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import io
import jwt
from functools import wraps
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Get JWT secret from environment variable
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable must be set")

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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)