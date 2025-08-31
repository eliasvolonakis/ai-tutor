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
  question_embedding TEXT NOT NULL,
  answer_embedding TEXT NOT NULL,
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

### Usage Examples

#### Basic Error Handling

```typescript
import { generateEmbeddings, QuotaExceededError, RateLimitError } from '../services/embeddingService'

try {
    const embedding = await generateEmbeddings("Hello world")
    console.log("Embedding generated successfully")
} catch (error) {
    if (error instanceof QuotaExceededError) {
        console.error("Quota exceeded - check billing")
        // Handle quota exceeded
    } else if (error instanceof RateLimitError) {
        console.error("Rate limited - retry after delay")
        // Implement retry logic with exponential backoff
    } else {
        console.error("Other error:", error.message)
    }
}
```

#### Retry Logic Example

```typescript
import { generateEmbeddings, RateLimitError, NetworkError } from '../services/embeddingService'

async function generateEmbeddingsWithRetry(text: string, maxRetries: number = 3): Promise<number[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await generateEmbeddings(text)
        } catch (error) {
            if (error instanceof RateLimitError || error instanceof NetworkError) {
                if (attempt === maxRetries) {
                    throw error
                }
                
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000
                console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
            } else {
                // Non-retryable error, throw immediately
                throw error
            }
        }
    }
    
    throw new Error('Max retries exceeded')
}
```

## HTTP Status Codes

The API uses standardized HTTP status codes:

```typescript
export enum HttpStatusCode {
  // Success responses
  SUCCESSWITHBODY = 200,
  CREATED = 201,
  SUCCESSWITHOUTBODY = 204,
  
  // Client error responses
  BADREQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOTFOUND = 404,
  METHODNOTALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLEENTITY = 422,
  TOOMANYREQUESTS = 429,
  
  // Server error responses
  INTERNALSERVERERROR = 500,
  BADGATEWAY = 502,
  SERVICEUNAVAILABLE = 503,
  GATEWAYTIMEOUT = 504,
}
```

## Implementation Details

### Error Classes

All error classes extend `EmbeddingError` and include:
- `code`: Unique error identifier
- `statusCode`: HTTP status code
- `retryable`: Whether the error can be retried
- `message`: Human-readable error message

### Controller Integration

The embedding controller automatically handles all error types and returns appropriate HTTP responses with structured error data.

### Logging

All errors are logged with detailed information for debugging:
- Error code and message
- HTTP status
- Retryable status
- Full error context

## Best Practices

1. **Always check if errors are retryable** before implementing retry logic
2. **Use exponential backoff** for retryable errors
3. **Log errors appropriately** for debugging
4. **Provide user-friendly messages** while keeping technical details for logs
5. **Handle quota exceeded errors** by notifying users to check their billing

## Monitoring

Monitor these error types in your application:
- High `QUOTA_EXCEEDED` errors indicate billing issues
- High `RATE_LIMIT` errors suggest need for rate limiting
- High `NETWORK_ERROR` errors indicate connectivity issues

## Future Enhancements

Potential improvements:
- Circuit breaker pattern for repeated failures
- Automatic fallback to alternative embedding providers
- Metrics collection for error rates
- Alerting for critical error thresholds
