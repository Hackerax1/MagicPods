# Card Scanning Microservice using Tesseract OCR

from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import io

app = Flask(__name__)

@app.route('/scan', methods=['POST'])
def scan_card():
	if 'image' not in request.files:
		return jsonify({'error': 'No image provided'}), 400

	image_file = request.files['image']
	image = Image.open(io.BytesIO(image_file.read()))
	text = pytesseract.image_to_string(image)

	# Here you would implement logic to match the text to a card
	# For simplicity, we'll just return the extracted text

	return jsonify({'text': text})

if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000)