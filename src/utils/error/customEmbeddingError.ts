import { HttpStatusCode } from '..'

/**
 * Custom Error Types for Embedding Service
 * 
 * This file contains all custom error classes for embedding-related operations.
 * These errors provide specific handling for different scenarios that can occur
 * when generating embeddings using the OpenAI API.
 */

// Custom error types for better error handling
export class EmbeddingError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: HttpStatusCode = HttpStatusCode.INTERNALSERVERERROR,
        public retryable: boolean = false
    ) {
        super(message)
        this.name = 'EmbeddingError'
    }
}

export class QuotaExceededError extends EmbeddingError {
    constructor(message: string = 'OpenAI quota exceeded. Please check your billing and plan.') {
        super(message, 'QUOTA_EXCEEDED', HttpStatusCode.TOOMANYREQUESTS, false)
        this.name = 'QuotaExceededError'
    }
}

export class APIKeyError extends EmbeddingError {
    constructor(message: string = 'Invalid or missing OpenAI API key.') {
        super(message, 'INVALID_API_KEY', HttpStatusCode.UNAUTHORIZED, false)
        this.name = 'APIKeyError'
    }
}

export class RateLimitError extends EmbeddingError {
    constructor(message: string = 'Rate limit exceeded. Please try again later.') {
        super(message, 'RATE_LIMIT', HttpStatusCode.TOOMANYREQUESTS, true)
        this.name = 'RateLimitError'
    }
}

export class NetworkError extends EmbeddingError {
    constructor(message: string = 'Network error occurred while generating embeddings.') {
        super(message, 'NETWORK_ERROR', HttpStatusCode.SERVICEUNAVAILABLE, true)
        this.name = 'NetworkError'
    }
}

export class ValidationError extends EmbeddingError {
    constructor(message: string = 'Invalid input data provided.') {
        super(message, 'VALIDATION_ERROR', HttpStatusCode.BADREQUEST, false)
        this.name = 'ValidationError'
    }
}

export class DatabaseError extends EmbeddingError {
    constructor(message: string = 'Database operation failed.') {
        super(message, 'DATABASE_ERROR', HttpStatusCode.INTERNALSERVERERROR, true)
        this.name = 'DatabaseError'
    }
}
