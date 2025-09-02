import { pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'

export const questions = pgTable('questions', {
    id: uuid('id').primaryKey().defaultRandom(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})

export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
