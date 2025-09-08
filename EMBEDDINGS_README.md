# Embeddings API Documentation

This document describes the embedding functionality for the AI Math Tutoring Platform, including comprehensive error handling and API endpoints.

## Overview

The embeddings system allows you to:
- Generate OpenAI embeddings for questions and answers
- Store embeddings in the database
- Retrieve and search through stored embeddings
- Calculate similarity between embeddings
- Handle errors gracefully with specific error types

## Database Schema

### Questions Table
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_embedding vector(1536) NOT NULL,
  answer_embedding vector(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### POST /embeddings
Create embeddings for a question-answer pair.

**Request Body:**
```json
{
  "question": "What is the derivative of x²?",
  "answer": "The derivative of x² is 2x. This can be found using the power rule: d/dx(x^n) = n*x^(n-1)."
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid-here",
    "question": "What is the derivative of x²?",
    "answer": "The derivative of x² is 2x. This can be found using the power rule: d/dx(x^n) = n*x^(n-1).",
    "questionEmbedding": [...],
    "answerEmbedding": [...],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Question and answer embeddings created successfully"
}
```

### GET /embeddings
Retrieve all embeddings with pagination.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 10)
- `offset` (optional): Number of results to skip (default: 0)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-here",
      "question": "What is the derivative of x²?",
      "answer": "The derivative of x² is 2x.",
      "questionEmbedding": [...],
      "answerEmbedding": [...],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### GET /embeddings/:id
Retrieve a specific embedding by ID.

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-here",
    "question": "What is the derivative of x²?",
    "answer": "The derivative of x² is 2x.",
    "questionEmbedding": [...],
    "answerEmbedding": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "error": "Question not found"
}
```

## Error Handling

The embedding service includes comprehensive error handling for various scenarios that can occur when generating embeddings using the OpenAI API.

### Error Types

#### 1. QuotaExceededError
- **Trigger**: When OpenAI quota is exceeded
- **HTTP Status**: 429 (Too Many Requests)
- **Retryable**: No
- **Message**: "OpenAI quota exceeded. Please check your billing and plan."

#### 2. APIKeyError
- **Trigger**: When API key is invalid or missing
- **HTTP Status**: 401 (Unauthorized)
- **Retryable**: No
- **Message**: "Invalid or missing OpenAI API key."

#### 3. RateLimitError
- **Trigger**: When rate limit is exceeded
- **HTTP Status**: 429 (Too Many Requests)
- **Retryable**: Yes
- **Message**: "Rate limit exceeded. Please try again later."

#### 4. NetworkError
- **Trigger**: When network issues occur
- **HTTP Status**: 503 (Service Unavailable)
- **Retryable**: Yes
- **Message**: "Network error occurred while generating embeddings."

#### 5. ValidationError
- **Trigger**: When input validation fails
- **HTTP Status**: 400 (Bad Request)
- **Retryable**: No
- **Message**: "Invalid input data provided."

#### 6. DatabaseError
- **Trigger**: When database operations fail
- **HTTP Status**: 500 (Internal Server Error)
- **Retryable**: Yes
- **Message**: "Database operation failed."

### Error Response Format

When errors occur, the API returns structured error responses:

```json
{
  "statusCode": 429,
  "error": "OpenAI quota exceeded. Please check your billing and plan.",
  "code": "QUOTA_EXCEEDED",
  "retryable": false
}
```
