import { eq } from 'drizzle-orm'
import { t } from 'elysia'
import { db } from '../db'
import { questions } from '../db/schema'
import {
    generateQuestionAnswerEmbeddings
} from '../services/embeddingService'
import { embeddingRequestSchema } from '../types/embeddings'
import { HttpStatusCode } from '../utils'
import {
    EmbeddingError
} from '../utils/error/customEmbeddingError'

/**
 * Helper function to format error responses consistently
 */
const formatErrorResponse = (error: Error, defaultCode: string = 'UNKNOWN_ERROR', defaultStatusCode: HttpStatusCode = HttpStatusCode.INTERNALSERVERERROR, defaultRetryable: boolean = false) => {
    if (error instanceof EmbeddingError) {
        return {
            statusCode: error.statusCode as HttpStatusCode,
            error: error.message,
            code: error.code,
            retryable: error.retryable,
        }
    }

    return {
        statusCode: defaultStatusCode,
        error: error.message,
        code: defaultCode,
        retryable: defaultRetryable,
    }
}

export const createEmbedding = async ({ body }: { body: any }) => {
    try {
        // Validate request body
        const validatedData = embeddingRequestSchema.parse(body)

        // Generate embeddings for question and answer
        const { questionEmbedding, answerEmbedding } =
            await generateQuestionAnswerEmbeddings(
                validatedData.question,
                validatedData.answer
            )

        // No need for conversion or validation functions, as the Drizzle `vector` type
        // handles the `number[]` array directly.

        // Store in database
        const [newQuestion] = await db
            .insert(questions)
            .values({
                question: validatedData.question,
                answer: validatedData.answer,
                questionEmbedding: questionEmbedding, // Pass the array directly
                answerEmbedding: answerEmbedding, // Pass the array directly
            })
            .returning()

        return {
            statusCode: HttpStatusCode.CREATED,
            data: {
                id: newQuestion.id,
                question: newQuestion.question,
                answer: newQuestion.answer,
                questionEmbedding: newQuestion.questionEmbedding,
                answerEmbedding: newQuestion.answerEmbedding,
                createdAt: newQuestion.createdAt ?? new Date(),
            },
            message: 'Question and answer embeddings created successfully',
        }
    } catch (error) {
        console.error('Error creating embeddings:', error)

        if (error instanceof Error) {
            return formatErrorResponse(error, 'EMBEDDING_ERROR', HttpStatusCode.INTERNALSERVERERROR, false)
        }

        return {
            statusCode: HttpStatusCode.INTERNALSERVERERROR,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            retryable: false,
        }
    }
}

export const getEmbeddings = async ({ query }: { query: any }) => {
    try {
        const limit = query.limit ? parseInt(query.limit) : 10
        const offset = query.offset ? parseInt(query.offset) : 0

        const results = await db
            .select()
            .from(questions)
            .limit(limit)
            .offset(offset)
            .orderBy(questions.createdAt)

        return {
            statusCode: HttpStatusCode.SUCCESSWITHBODY,
            data: results.map(q => ({
                id: q.id,
                question: q.question,
                answer: q.answer,
                questionEmbedding: q.questionEmbedding,
                answerEmbedding: q.answerEmbedding,
                createdAt: q.createdAt,
            })),
            pagination: {
                limit,
                offset,
                total: results.length,
            },
        }
    } catch (error) {
        console.error('Error fetching embeddings:', error)
        if (error instanceof Error) {
            return formatErrorResponse(error, 'FETCH_ERROR', HttpStatusCode.INTERNALSERVERERROR, false)
        }
        return {
            statusCode: HttpStatusCode.INTERNALSERVERERROR,
            error: 'Failed to fetch embeddings',
            code: 'FETCH_ERROR',
            retryable: false,
        }
    }
}

export const getEmbeddingById = async ({ params }: { params: any }) => {
    try {
        const [question] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, params.id))

        if (!question) {
            return {
                statusCode: HttpStatusCode.NOTFOUND,
                error: 'Question not found',
            }
        }

        return {
            statusCode: HttpStatusCode.SUCCESSWITHBODY,
            data: {
                id: question.id,
                question: question.question,
                answer: question.answer,
                questionEmbedding: question.questionEmbedding,
                answerEmbedding: question.answerEmbedding,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
            },
        }
    } catch (error) {
        console.error('Error fetching embedding:', error)
        if (error instanceof Error) {
            return formatErrorResponse(error, 'FETCH_ERROR', HttpStatusCode.INTERNALSERVERERROR, false)
        }
        return {
            statusCode: HttpStatusCode.INTERNALSERVERERROR,
            error: 'Failed to fetch embedding',
            code: 'FETCH_ERROR',
            retryable: false,
        }
    }
}