import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '../db'
import { questions } from '../db/schema'
import { HttpStatusCode } from '../utils'
import { EmbeddingError } from '../utils/error/customEmbeddingError'

export interface CreateEmbeddingDto {
    question: string
    answer: string
}

export interface EmbeddingResponseDto {
    id: string
    question: string
    answer: string
    embedding: number[]
    createdAt: Date | null
    updatedAt: Date | null
}

export interface EmbeddingListResponseDto {
    id: string
    question: string
    answer: string
    createdAt: Date | null
}

export interface PaginationDto {
    limit: number
    offset: number
    total: number
}

export interface EmbeddingListDto {
    data: EmbeddingListResponseDto[]
    pagination: PaginationDto
}

export class EmbeddingModel {
    static async create(
        question: string,
        answer: string,
        embedding: number[]
    ): Promise<EmbeddingResponseDto> {
        try {
            const [newQuestion] = await db
                .insert(questions)
                .values({
                    question,
                    answer,
                    embedding,
                })
                .returning()

            return {
                id: newQuestion.id,
                question: newQuestion.question,
                answer: newQuestion.answer,
                embedding: newQuestion.embedding,
                createdAt: newQuestion.createdAt,
                updatedAt: newQuestion.updatedAt,
            }
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                    throw new EmbeddingError(
                        'Question already exists in the database',
                        'DUPLICATE_QUESTION',
                        HttpStatusCode.CONFLICT,
                        false
                    )
                }

                if (error.message.includes('foreign key') || error.message.includes('constraint')) {
                    throw new EmbeddingError(
                        'Database constraint violation',
                        'CONSTRAINT_VIOLATION',
                        HttpStatusCode.BADREQUEST,
                        false
                    )
                }
            }

            // For any other database errors, wrap them in a generic error
            throw new EmbeddingError(
                `Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DATABASE_ERROR',
                HttpStatusCode.INTERNALSERVERERROR,
                true
            )
        }
    }

    static async findAll(limit: number = 10, offset: number = 0): Promise<EmbeddingListDto> {
        try {
            const results = await db
                .select()
                .from(questions)
                .limit(limit)
                .offset(offset)
                .orderBy(questions.createdAt)

            const data: EmbeddingListResponseDto[] = results.map(q => ({
                id: q.id,
                question: q.question,
                answer: q.answer,
                createdAt: q.createdAt,
            }))

            return {
                data,
                pagination: {
                    limit,
                    offset,
                    total: data.length,
                },
            }
        } catch (error) {
            throw new EmbeddingError(
                `Failed to fetch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DATABASE_ERROR',
                HttpStatusCode.INTERNALSERVERERROR,
                true
            )
        }
    }

    static async findById(id: string): Promise<EmbeddingResponseDto> {
        try {
            const [question] = await db
                .select()
                .from(questions)
                .where(eq(questions.id, id))

            if (!question) {
                throw new EmbeddingError(
                    'Question not found',
                    'NOT_FOUND',
                    HttpStatusCode.NOTFOUND,
                    false
                )
            }

            return {
                id: question.id,
                question: question.question,
                answer: question.answer,
                embedding: question.embedding,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
            }
        } catch (error) {
            if (error instanceof EmbeddingError) {
                throw error
            }

            throw new EmbeddingError(
                `Failed to fetch embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DATABASE_ERROR',
                HttpStatusCode.INTERNALSERVERERROR,
                true
            )
        }
    }

    static async update(
        id: string,
        updates: Partial<Pick<CreateEmbeddingDto, 'question' | 'answer'>>
    ): Promise<EmbeddingResponseDto> {
        try {
            const [updatedQuestion] = await db
                .update(questions)
                .set({
                    ...updates,
                    updatedAt: new Date(),
                })
                .where(eq(questions.id, id))
                .returning()

            if (!updatedQuestion) {
                throw new EmbeddingError(
                    'Question not found',
                    'NOT_FOUND',
                    HttpStatusCode.NOTFOUND,
                    false
                )
            }

            return {
                id: updatedQuestion.id,
                question: updatedQuestion.question,
                answer: updatedQuestion.answer,
                embedding: updatedQuestion.embedding,
                createdAt: updatedQuestion.createdAt,
                updatedAt: updatedQuestion.updatedAt,
            }
        } catch (error) {
            if (error instanceof EmbeddingError) {
                throw error
            }

            throw new EmbeddingError(
                `Failed to update embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DATABASE_ERROR',
                HttpStatusCode.INTERNALSERVERERROR,
                true
            )
        }
    }

    static async delete(id: string): Promise<void> {
        try {
            const [deletedQuestion] = await db
                .delete(questions)
                .where(eq(questions.id, id))
                .returning()

            if (!deletedQuestion) {
                throw new EmbeddingError(
                    'Question not found',
                    'NOT_FOUND',
                    HttpStatusCode.NOTFOUND,
                    false
                )
            }
        } catch (error) {
            if (error instanceof EmbeddingError) {
                throw error
            }

            throw new EmbeddingError(
                `Failed to delete embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DATABASE_ERROR',
                HttpStatusCode.INTERNALSERVERERROR,
                true
            )
        }
    }

    static async count(): Promise<number> {
        try {
            const result = await db
                .select({ count: sql<number>`count(*)` })
                .from(questions)

            return result[0]?.count || 0
        } catch (error) {
            throw new EmbeddingError(
                `Failed to count embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DATABASE_ERROR',
                HttpStatusCode.INTERNALSERVERERROR,
                true
            )
        }
    }
}
