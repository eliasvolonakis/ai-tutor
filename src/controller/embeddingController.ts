import { CreateEmbeddingDto, EmbeddingModel } from '../models/embedding'
import {
    generateCombinedEmbedding
} from '../services/embeddingService'
import { HttpStatusCode } from '../utils'
import {
    EmbeddingError
} from '../utils/error/customEmbeddingError'

export const createEmbedding = async ({ body }: { body: any }) => {
    try {
        const validatedData: CreateEmbeddingDto = body

        if (!validatedData.question || !validatedData.answer) {
            return {
                statusCode: HttpStatusCode.BADREQUEST,
                error: 'Question and answer are required',
                code: 'VALIDATION_ERROR',
                retryable: false,
            }
        }

        const embedding = await generateCombinedEmbedding(
            validatedData.question,
            validatedData.answer
        )

        // Store in database using the model directly
        const newQuestion = await EmbeddingModel.create(
            validatedData.question,
            validatedData.answer,
            embedding
        )

        return {
            statusCode: HttpStatusCode.CREATED,
            data: {
                id: newQuestion.id,
                question: newQuestion.question,
                answer: newQuestion.answer,
                embedding: newQuestion.embedding,
                createdAt: newQuestion.createdAt ?? new Date(),
            },
            message: 'Question and answer embedding created successfully',
        }
    } catch (error) {
        console.error('Error creating embeddings:', error)

        if (error instanceof EmbeddingError) {
            return {
                statusCode: error.statusCode,
                error: error.message,
                code: error.code,
                retryable: error.retryable,
            }
        }

        if (error instanceof Error) {
            return {
                statusCode: HttpStatusCode.BADREQUEST,
                error: error.message,
                code: 'VALIDATION_ERROR',
                retryable: false,
            }
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

        const results = await EmbeddingModel.findAll(limit, offset)

        return {
            statusCode: HttpStatusCode.SUCCESSWITHBODY,
            data: results.data,
            pagination: results.pagination,
        }
    } catch (error) {
        console.error('Error fetching embeddings:', error)

        if (error instanceof EmbeddingError) {
            return {
                statusCode: error.statusCode,
                error: error.message,
                code: error.code,
                retryable: error.retryable,
            }
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
        const question = await EmbeddingModel.findById(params.id)

        return {
            statusCode: HttpStatusCode.SUCCESSWITHBODY,
            data: {
                id: question.id,
                question: question.question,
                answer: question.answer,
                embedding: question.embedding,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
            },
        }
    } catch (error) {
        console.error('Error fetching embedding:', error)

        if (error instanceof EmbeddingError) {
            return {
                statusCode: error.statusCode,
                error: error.message,
                code: error.code,
                retryable: error.retryable,
            }
        }

        return {
            statusCode: HttpStatusCode.INTERNALSERVERERROR,
            error: 'Failed to fetch embedding',
            code: 'FETCH_ERROR',
            retryable: false,
        }
    }
}

export const updateEmbedding = async ({ params, body }: { params: any; body: any }) => {
    try {
        const { id } = params
        const updates: Partial<CreateEmbeddingDto> = body

        if (!id) {
            return {
                statusCode: HttpStatusCode.BADREQUEST,
                error: 'Embedding ID is required',
                code: 'MISSING_ID',
                retryable: false,
            }
        }

        if (updates.question || updates.answer) {
            const currentEmbedding = await EmbeddingModel.findById(id)

            const question = updates.question || currentEmbedding.question
            const answer = updates.answer || currentEmbedding.answer

            const embedding = await generateCombinedEmbedding(question, answer)

            const updatedEmbedding = await EmbeddingModel.update(id, {
                question,
                answer,
            })

            return {
                statusCode: HttpStatusCode.SUCCESSWITHBODY,
                data: {
                    id: updatedEmbedding.id,
                    question: updatedEmbedding.question,
                    answer: updatedEmbedding.answer,
                    createdAt: updatedEmbedding.createdAt,
                    updatedAt: updatedEmbedding.updatedAt,
                },
                message: 'Embedding updated successfully',
            }
        } else {
            const updatedEmbedding = await EmbeddingModel.update(id, updates)

            return {
                statusCode: HttpStatusCode.SUCCESSWITHBODY,
                data: {
                    id: updatedEmbedding.id,
                    question: updatedEmbedding.question,
                    answer: updatedEmbedding.answer,
                    createdAt: updatedEmbedding.createdAt,
                    updatedAt: updatedEmbedding.updatedAt,
                },
                message: 'Embedding updated successfully',
            }
        }
    } catch (error) {
        console.error('Error updating embedding:', error)

        if (error instanceof EmbeddingError) {
            return {
                statusCode: error.statusCode,
                error: error.message,
                code: error.code,
                retryable: error.retryable,
            }
        }

        return {
            statusCode: HttpStatusCode.INTERNALSERVERERROR,
            error: 'Failed to update embedding',
            code: 'UPDATE_ERROR',
            retryable: false,
        }
    }
}

export const deleteEmbedding = async ({ params }: { params: any }) => {
    try {
        const { id } = params

        if (!id) {
            return {
                statusCode: HttpStatusCode.BADREQUEST,
                error: 'Embedding ID is required',
                code: 'MISSING_ID',
                retryable: false,
            }
        }

        await EmbeddingModel.delete(id)

        return {
            statusCode: HttpStatusCode.SUCCESSWITHBODY,
            message: 'Embedding deleted successfully',
        }
    } catch (error) {
        console.error('Error deleting embedding:', error)

        if (error instanceof EmbeddingError) {
            return {
                statusCode: error.statusCode,
                error: error.message,
                code: error.code,
                retryable: error.retryable,
            }
        }

        return {
            statusCode: HttpStatusCode.INTERNALSERVERERROR,
            error: 'Failed to delete embedding',
            code: 'DELETE_ERROR',
            retryable: false,
        }
    }
}