import OpenAI from 'openai'
import { HttpStatusCode } from '../utils'
import {
    EmbeddingError,
    APIKeyError,
    RateLimitError,
    NetworkError,
    ValidationError
} from '../utils/error/customEmbeddingError'

const openai = new OpenAI()


const imageToBase64 = (imageBuffer: Buffer): string => {
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
}

const handleOpenAIError = (error: any): void => {
    console.error('OpenAI API Error:', {
        status: error.status,
        code: error.code,
        message: error.message,
        type: error.type
    })

    if (error.status === HttpStatusCode.UNAUTHORIZED) {
        throw new APIKeyError('Invalid or missing OpenAI API key')
    } else if (error.status === HttpStatusCode.TOOMANYREQUESTS) {
        if (error.code === 'insufficient_quota') {
            throw new EmbeddingError(
                'OpenAI quota exceeded. Please check your billing and plan.',
                'QUOTA_EXCEEDED',
                HttpStatusCode.TOOMANYREQUESTS,
                false
            )
        } else {
            throw new RateLimitError('Rate limit exceeded. Please try again later.')
        }
    } else if (error.status >= HttpStatusCode.INTERNALSERVERERROR) {
        throw new NetworkError('OpenAI service is temporarily unavailable')
    } else {
        throw new EmbeddingError(
            `OpenAI API error: ${error.message}`,
            'OPENAI_API_ERROR',
            error.status || HttpStatusCode.INTERNALSERVERERROR,
            true
        )
    }
}

/**
 * Convert math image to LaTeX string using OpenAI GPT-4o vision
 */
export const convertMathImageToLatex = async (imageBuffer: Buffer): Promise<string> => {
    try {
        // Validate image buffer
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new ValidationError('Image buffer is required and cannot be empty')
        }

        // Convert image to base64
        const base64Image = imageToBase64(imageBuffer)

        // Call OpenAI GPT-4o vision API
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract the math text and equations from this image. Convert all equations to LaTeX. Return only LaTeX code, no explanations."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64Image
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.1
        })

        const latexOutput = response.choices[0]?.message?.content

        if (!latexOutput) {
            throw new EmbeddingError(
                'No LaTeX output received from OpenAI',
                'NO_LATEX_OUTPUT',
                HttpStatusCode.INTERNALSERVERERROR,
                false
            )
        }

        return latexOutput.trim()

    } catch (error) {
        if (error instanceof EmbeddingError ||
            error instanceof ValidationError ||
            error instanceof APIKeyError ||
            error instanceof RateLimitError ||
            error instanceof NetworkError) {
            throw error
        }

        // Handle OpenAI specific errors
        if (error && typeof error === 'object' && ('status' in error || 'code' in error)) {
            handleOpenAIError(error)
        }

        // If we reach here, it's an unexpected error
        throw new EmbeddingError(
            `Failed to convert math image to LaTeX: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'MATH_IMAGE_CONVERSION_FAILED',
            HttpStatusCode.INTERNALSERVERERROR,
            true
        )
    }
}
