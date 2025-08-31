import z from "zod"

// Schema for embedding request
export const embeddingRequestSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
})

export type EmbeddingRequest = z.infer<typeof embeddingRequestSchema>

// Schema for embedding response
export const embeddingResponseSchema = z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
    questionEmbedding: z.string(),
    answerEmbedding: z.string(),
    createdAt: z.date(),
})

export type EmbeddingResponse = z.infer<typeof embeddingResponseSchema>