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

const openai = new OpenAI()

const handleOpenAIError = (error: any): void => {
    console.error('OpenAI API Error:', {
        code: error.code,
        message: error.message,
        status: error.status,
        type: error.type
    })

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

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        throw new NetworkError()
    }

    throw new EmbeddingError(
        `Failed to generate embeddings: ${error.message || 'Unknown error'}`,
        'EMBEDDING_GENERATION_FAILED',
        HttpStatusCode.INTERNALSERVERERROR,
        true
    )
}

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
        throw new Error('Unexpected error in embedding generation')
    }
}

export const generateCombinedEmbedding = async (
    question: string,
    answer: string
): Promise<number[]> => {
    try {
        if (!question || !answer) {
            throw new EmbeddingError(
                'Question and answer are required',
                'VALIDATION_ERROR',
                HttpStatusCode.BADREQUEST,
                false
            )
        }

        const combinedText = `Question: ${question}\nAnswer: ${answer}`
        const embedding = await generateEmbeddings(combinedText)
        validateEmbeddingDimensions(embedding)

        return embedding
    } catch (error) {
        if (error instanceof EmbeddingError) {
            throw error
        }
        throw new EmbeddingError(
            `Failed to generate combined embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'EMBEDDING_GENERATION_FAILED',
            HttpStatusCode.INTERNALSERVERERROR,
            true
        )
    }
}

export const validateEmbeddingDimensions = (embedding: number[], expectedDimensions: number = 1536): void => {
    if (embedding.length !== expectedDimensions) {
        throw new EmbeddingError(
            `Embedding must have ${expectedDimensions} dimensions, got ${embedding.length}`,
            'VALIDATION_ERROR',
            HttpStatusCode.BADREQUEST,
            false
        )
    }
}
