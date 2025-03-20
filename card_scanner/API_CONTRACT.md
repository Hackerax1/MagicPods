# Card Scanner Microservice API Contract

## Overview

This document defines the API contract for the Card Scanner microservice, which provides OCR functionality for Magic: The Gathering cards.

## Base URL

```
http://localhost:5000
```

In production environments, the base URL will be configurable through environment variables.

## Authentication

All endpoints require JWT authentication provided via an `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Scan Card Image

**Endpoint**: `POST /scan`

**Description**: Scans a card image and returns the recognized text.

**Request**:
- Content-Type: `multipart/form-data`
- Body:
  - `image`: The card image file (required)

**Response**:
- 200 OK:
  ```json
  {
    "text": "Card name and text recognized from the image",
    "userId": "user_id_from_token"
  }
  ```

- 400 Bad Request:
  ```json
  {
    "error": "No image provided"
  }
  ```

- 401 Unauthorized:
  ```json
  {
    "error": "Missing authentication" | "Token expired" | "Invalid token"
  }
  ```

- 429 Too Many Requests:
  ```json
  {
    "error": "Rate limit exceeded"
  }
  ```

- 500 Internal Server Error:
  ```json
  {
    "error": "Failed to process image"
  }
  ```

### 2. Start Live Scanning Session

**Endpoint**: `POST /scan/live/start`

**Description**: Starts a live card scanning session using the device camera.

**Request**:
- Content-Type: `application/json`
- Body: Empty (session is created based on the user ID in the JWT token)

**Response**:
- 200 OK:
  ```json
  {
    "message": "Live scanning session started",
    "userId": "user_id_from_token"
  }
  ```

- 401 Unauthorized: (same as above)
- 429 Too Many Requests: (same as above)
- 500 Internal Server Error:
  ```json
  {
    "error": "Failed to start camera"
  }
  ```

### 3. Get Live Frame

**Endpoint**: `GET /scan/live/frame`

**Description**: Gets the current frame and scan result from an active live scanning session.

**Response**:
- 200 OK:
  ```json
  {
    "frame": "base64_encoded_jpeg_image",
    "result": "Recognized card text (null if no new text since last call)"
  }
  ```

- 401 Unauthorized: (same as above)
- 404 Not Found:
  ```json
  {
    "error": "No active scanning session" | "No frame available"
  }
  ```
- 429 Too Many Requests: (same as above)

### 4. Stop Live Scanning Session

**Endpoint**: `POST /scan/live/stop`

**Description**: Stops an active live scanning session.

**Request**:
- Content-Type: `application/json`
- Body: Empty

**Response**:
- 200 OK:
  ```json
  {
    "message": "Live scanning session stopped",
    "userId": "user_id_from_token"
  }
  ```

- 401 Unauthorized: (same as above)

### 5. Health Check

**Endpoint**: `GET /health`

**Description**: Returns the health status of the service.

**Response**:
- 200 OK:
  ```json
  {
    "status": "healthy",
    "timestamp": 1234567890,
    "active_sessions": 2
  }
  ```

### 6. Metrics

**Endpoint**: `GET /metrics`

**Description**: Returns Prometheus metrics for monitoring.

**Response**:
- 200 OK: Prometheus metrics in text format

## Rate Limits

- Single image scanning: 30 requests per minute
- Starting live scan: 5 requests per minute
- Getting live frames: 60 requests per minute

## Error Handling

The service handles errors through appropriate HTTP status codes and JSON error responses. Each error response includes an `error` field with a descriptive message.

## Retries

The client should implement retry logic with exponential backoff for transient errors (5xx responses). Recommended retry parameters:
- Maximum retries: 3
- Initial delay: 1000ms
- Backoff factor: 2

## Timeouts

- Live sessions automatically expire after 5 minutes of inactivity
- API request timeout: 30 seconds