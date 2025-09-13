#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'
import { db } from '../db'
import { questions } from '../db/schema'
import { generateEmbeddings } from '../services/embeddingService'

interface QuestionAnswerPair {
    question: string
    answer: string
    unit: string
    questionNumber: string
}

/**
 * Database health check function
 */
async function checkDatabaseHealth(): Promise<boolean> {
    try {
        await db.execute('SELECT 1')
        return true
    } catch (error) {
        console.error('Database health check failed:', error)
        return false
    }
}

/**
 * Generate combined embedding for question and answer
 */
async function generateCombinedEmbedding(question: string, answer: string) {
    const combinedText = `Question: ${question}\nAnswer: ${answer}`
    const embedding = await generateEmbeddings(combinedText)
    return embedding
}

/**
 * Parse the qa_latex.txt file to extract question-answer pairs
 */
function parseLatexFile(filePath: string): QuestionAnswerPair[] {
    const content = fs.readFileSync(filePath, 'utf8')
    const pairs: QuestionAnswerPair[] = []

    // Split by pair separators
    const pairSections = content.split('=== PAIR')

    for (let i = 1; i < pairSections.length; i++) {
        const section = pairSections[i].trim()
        const lines = section.split('\n')

        let unit = ''
        let questionNumber = ''
        let question = ''
        let answer = ''
        let currentField = ''

        for (const line of lines) {
            if (line.startsWith('Unit:')) {
                unit = line.replace('Unit:', '').trim()
            } else if (line.startsWith('Question Number:')) {
                questionNumber = line.replace('Question Number:', '').trim()
            } else if (line.startsWith('Question:')) {
                currentField = 'question'
                question = line.replace('Question:', '').trim()
            } else if (line.startsWith('Answer:')) {
                currentField = 'answer'
                answer = line.replace('Answer:', '').trim()
            } else if (line.trim() && currentField) {
                // Continue building the current field
                if (currentField === 'question') {
                    question += '\n' + line.trim()
                } else if (currentField === 'answer') {
                    answer += '\n' + line.trim()
                }
            }
        }

        if (unit && questionNumber && question && answer) {
            pairs.push({
                unit,
                questionNumber,
                question: question.trim(),
                answer: answer.trim()
            })
        }
    }

    return pairs
}

/**
 * Seed the database with embeddings from LaTeX file
 */
async function seedEmbeddings() {
    console.log('🔍 Checking database connection...')

    const isHealthy = await checkDatabaseHealth()
    if (!isHealthy) {
        console.error('💥 Exiting due to health check failure')
        process.exit(1)
    }

    console.log('✅ Database connection established')

    const qaDir = path.join(process.cwd(), 'src', 'qa')
    const latexFile = path.join(qaDir, 'qa_latex.txt')

    console.log('🔍 Looking for qa_latex.txt file...')

    if (!fs.existsSync(latexFile)) {
        console.error(`❌ LaTeX file not found: ${latexFile}`)
        console.log('Please run the convertImagesToLatex script first.')
        process.exit(1)
    }

    console.log('📖 Parsing LaTeX file...')
    const pairs = parseLatexFile(latexFile)

    if (pairs.length === 0) {
        console.error('❌ No question-answer pairs found in LaTeX file')
        process.exit(1)
    }

    console.log(`📊 Found ${pairs.length} question-answer pairs`)

    let successCount = 0
    let errorCount = 0
    const BATCH_SIZE = 5 // Process 5 embeddings concurrently to avoid rate limits

    for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
        const batch = pairs.slice(i, i + BATCH_SIZE)
        console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pairs.length / BATCH_SIZE)}`)

        const batchPromises = batch.map(async (pair) => {
            try {
                console.log(`Creating embedding for ${pair.unit} Q${pair.questionNumber}...`)

                // Generate combined embedding using the service
                const embedding = await generateCombinedEmbedding(pair.question, pair.answer)

                // Insert directly into database
                const result = await db.insert(questions).values({
                    question: pair.question,
                    answer: pair.answer,
                    embedding: embedding, // Store combined embedding as number array
                    createdAt: new Date(),
                    updatedAt: new Date()
                }).returning({ id: questions.id })

                console.log(`✅ Created question with ID: ${result[0].id}`)
                return true
            } catch (error) {
                console.error(`❌ Error creating embedding for ${pair.unit} Q${pair.questionNumber}:`, error)
                return false
            }
        })

        const batchResults = await Promise.all(batchPromises)

        batchResults.forEach(success => {
            if (success) {
                successCount++
            } else {
                errorCount++
            }
        })

        // Small delay between batches to avoid rate limits
        if (i + BATCH_SIZE < pairs.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    console.log(`\n🎉 Seeding complete!`)
    console.log(`✅ Successfully created: ${successCount} embeddings`)
    console.log(`❌ Failed: ${errorCount} embeddings`)
    console.log(`📊 Total processed: ${pairs.length} pairs`)
}

// Run the seeding if this script is executed directly
if (import.meta.main) {
    seedEmbeddings().catch((error) => {
        console.error('💥 Fatal error during seeding:', error)
        process.exit(1)
    })
}

export { seedEmbeddings }
