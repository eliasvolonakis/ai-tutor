#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'
import { convertMathImageToLatex } from '../services/mathImageService'

interface QuestionAnswerPair {
    question: string
    answer: string
    unit: string
    questionNumber: string
}

/**
 * Parse filename to extract unit and question number
 * Format: p1_unitname_q1.png or p1_unitname_a1.png
 */
function parseFilename(filename: string): { unit: string; questionNumber: string; type: 'q' | 'a' } | null {
    const match = filename.match(/^p[12]_(.+)_([qa])(\d+)(?:_\d+)?\.png$/)
    if (!match) return null

    const [, unit, type, questionNumber] = match
    return {
        unit,
        questionNumber,
        type: type as 'q' | 'a'
    }
}

/**
 * Group files by unit and question number
 */
function groupFiles(files: string[]): Map<string, { question?: string; answer?: string }> {
    const groups = new Map<string, { question?: string; answer?: string }>()

    for (const file of files) {
        const parsed = parseFilename(file)
        if (!parsed) continue

        const key = `${parsed.unit}_${parsed.questionNumber}`
        if (!groups.has(key)) {
            groups.set(key, {})
        }

        const group = groups.get(key)!
        if (parsed.type === 'q') {
            group.question = file
        } else {
            group.answer = file
        }
    }

    return groups
}

/**
 * Convert image to LaTeX using OpenAI with retry logic
 */
async function convertImageToLatexText(imagePath: string, maxRetries = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Converting: ${imagePath} (attempt ${attempt}/${maxRetries})`)

            // Read the image file
            const imageBuffer = fs.readFileSync(imagePath)

            // Convert to LaTeX using the service
            const latexResult = await convertMathImageToLatex(imageBuffer)

            return latexResult
        } catch (error: any) {
            console.error(`Error converting ${imagePath} (attempt ${attempt}):`, error.message)

            // If it's a rate limit error and we have retries left, wait and retry
            if (error.statusCode === 429 && attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
                console.log(`Rate limited. Waiting ${waitTime}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
                continue
            }

            // If it's the last attempt or not a rate limit error, return error
            return `[Error converting image: ${error.message}]`
        }
    }

    return `[Error converting image: Max retries exceeded]`
}

/**
 * Process all images and create LaTeX text file
 */
async function processImagesToLatex() {
    const qaDir = path.join(process.cwd(), 'src', 'qa')
    const outputFile = path.join(qaDir, 'qa_latex.txt')
    const progressFile = path.join(qaDir, 'qa_progress.json')

    console.log('🔍 Scanning QA directory for image files...')

    // Load existing progress if resuming
    let processedKeys = new Set<string>()
    if (fs.existsSync(progressFile)) {
        try {
            const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'))
            processedKeys = new Set(progress.processedKeys || [])
            console.log(`📋 Resuming from previous run. Already processed: ${processedKeys.size} pairs`)
        } catch (error) {
            console.log('📋 Starting fresh (could not load progress file)')
        }
    }

    // Get all PNG files
    const files = fs.readdirSync(qaDir)
        .filter(file => file.endsWith('.png'))
        .sort()

    console.log(`📁 Found ${files.length} image files`)

    // Group files by unit and question number
    const groups = groupFiles(files)
    console.log(`📊 Grouped into ${groups.size} question-answer pairs`)

    const results: QuestionAnswerPair[] = []
    const BATCH_SIZE = 2 // Process 2 pairs concurrently (reduced for rate limits)
    const groupsArray = Array.from(groups.entries())

    for (let i = 0; i < groupsArray.length; i += BATCH_SIZE) {
        const batch = groupsArray.slice(i, i + BATCH_SIZE)
        console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(groupsArray.length / BATCH_SIZE)}`)

        const batchPromises = batch.map(async ([key, group]) => {
            // Skip if already processed
            if (processedKeys.has(key)) {
                console.log(`⏭️  Skipping already processed: ${key}`)
                return null
            }

            if (!group.question || !group.answer) {
                console.warn(`⚠️  Incomplete pair for ${key}:`, group)
                return null
            }

            try {
                const [unit, questionNumber] = key.split('_')

                // Convert both images in parallel
                const [questionLatex, answerLatex] = await Promise.all([
                    convertImageToLatexText(path.join(qaDir, group.question)),
                    convertImageToLatexText(path.join(qaDir, group.answer))
                ])

                // Mark as processed
                processedKeys.add(key)

                return {
                    question: questionLatex,
                    answer: answerLatex,
                    unit,
                    questionNumber
                }
            } catch (error) {
                console.error(`❌ Error processing ${key}:`, error)
                return null
            }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults.filter(Boolean) as QuestionAnswerPair[])

        // Save progress after each batch
        fs.writeFileSync(progressFile, JSON.stringify({
            processedKeys: Array.from(processedKeys),
            lastUpdated: new Date().toISOString()
        }), 'utf8')

        // Longer delay between batches to avoid rate limits
        if (i + BATCH_SIZE < groupsArray.length) {
            await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        }
    }

    // Write results to file
    console.log(`\n💾 Writing ${results.length} question-answer pairs to ${outputFile}`)

    const outputContent = results.map((pair, index) =>
        `=== PAIR ${index + 1} ===
Unit: ${pair.unit}
Question Number: ${pair.questionNumber}
Question: ${pair.question}
Answer: ${pair.answer}
`
    ).join('\n')

    fs.writeFileSync(outputFile, outputContent, 'utf8')

    console.log(`✅ Successfully processed ${results.length} question-answer pairs`)
    console.log(`📄 Results saved to: ${outputFile}`)

    // Clean up progress file on completion
    if (fs.existsSync(progressFile)) {
        fs.unlinkSync(progressFile)
        console.log('🧹 Cleaned up progress file')
    }
}

// Run the script if called directly
if (import.meta.main) {
    processImagesToLatex().catch(console.error)
}

export { processImagesToLatex }
