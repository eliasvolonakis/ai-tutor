import OpenAI from 'openai'
import { z } from 'zod'
import { HttpStatusCode } from '../utils'
import {
    EmbeddingError,
    QuotaExceededError,
    APIKeyError,
    RateLimitError,
    NetworkError
} from '../utils/error/customEmbeddingError'

/**
 * Embedding Service with Graceful Error Handling
 * 
 * This service provides embedding generation functionality with comprehensive error handling.
 * 
 * Error Types:
 * - QuotaExceededError: When OpenAI quota is exceeded (429, not retryable)
 * - APIKeyError: When API key is invalid or missing (401, not retryable)
 * - RateLimitError: When rate limit is exceeded (429, retryable)
 * - NetworkError: When network issues occur (503, retryable)
 * - EmbeddingError: Generic embedding errors (500, retryable)
 * 
 * Usage:
 * ```typescript
 * try {
 *   const embedding = await generateEmbeddings("Hello world");
 * } catch (error) {
 *   if (error instanceof QuotaExceededError) {
 *     // Handle quota exceeded
 *   } else if (error instanceof RateLimitError) {
 *     // Retry after delay
 *   }
 * }
 * ```
 */

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Handle OpenAI API errors and convert them to custom error types
 */
const handleOpenAIError = (error: any): void => {
    console.error('OpenAI API Error:', {
        code: error.code,
        message: error.message,
        status: error.status,
        type: error.type
    })

    // Handle specific OpenAI error codes
    if (error.code === 'insufficient_quota') {
        throw new QuotaExceededError()
    }

    if (error.code === 'invalid_api_key' || error.status === 401) {
        throw new APIKeyError()
    }

    if (error.code === 'rate_limit_exceeded' || error.status === 429) {
        throw new RateLimitError()
    }

    if (error.code === 'server_error' || error.status >= 500) {
        throw new NetworkError('OpenAI service is temporarily unavailable.')
    }

    // Handle network/timeout errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        throw new NetworkError()
    }

    // Generic error for unknown cases
    throw new EmbeddingError(
        `Failed to generate embeddings: ${error.message || 'Unknown error'}`,
        'EMBEDDING_GENERATION_FAILED',
        HttpStatusCode.INTERNALSERVERERROR,
        true
    )
}

/**
 * Generate embeddings for question and answer text
 */
export const generateEmbeddings = async (text: string): Promise<number[]> => {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float',
        })

        return response.data[0].embedding
    } catch (error: any) {
        handleOpenAIError(error)
        // This line should never be reached as handleOpenAIError always throws
        throw new Error('Unexpected error in embedding generation')
    }
}

/**
 * Generate embeddings for both question and answer
 */
export const generateQuestionAnswerEmbeddings = async (
    question: string,
    answer: string
): Promise<{
    questionEmbedding: number[]
    answerEmbedding: number[]
}> => {
    try {
        const [questionEmbedding, answerEmbedding] = await Promise.all([
            generateEmbeddings(question),
            generateEmbeddings(answer),
        ])

        return {
            questionEmbedding,
            answerEmbedding,
        }
    } catch (error) {
        // Re-throw the error as it's already handled by generateEmbeddings
        throw error
    }
}

/**
 * Convert embedding array to JSON string for storage
 */
export const embeddingToVector = (embedding: number[]): string => {
    return JSON.stringify(embedding)
}

/**
 * Convert JSON string back to array
 */
export const embeddingFromVector = (vectorString: string): number[] => {
    return JSON.parse(vectorString)
}

/**
 * Calculate cosine similarity between two embeddings using pgvector
 * This is now handled by the database for better performance
 */
export const calculateSimilarity = (embedding1: number[], embedding2: number[]): number => {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length')
    }

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0)
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0))
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0))

    return dotProduct / (magnitude1 * magnitude2)
}

/**
 * Validate embedding dimensions
 */
export const validateEmbeddingDimensions = (embedding: number[], expectedDimensions: number = 1536): void => {
    if (embedding.length !== expectedDimensions) {
        throw new Error(`Embedding must have ${expectedDimensions} dimensions, got ${embedding.length}`)
    }
}
