import { convertMathImageToLatex } from '../services/mathImageService'
import { HttpStatusCode } from '../utils'
import { EmbeddingError } from '../utils/error/customEmbeddingError'

/**
 * Convert math image to LaTeX
 */
export const convertImageToLatex = async ({ body }: { body: any }) => {
    try {
        // Validate request body
        if (!body || !body.image) {
            return {
                statusCode: HttpStatusCode.BADREQUEST,
                error: 'Image data is required',
                code: 'VALIDATION_ERROR',
                retryable: false,
            }
        }

        // Convert base64 string to buffer if needed
        let imageBuffer: Buffer
        if (typeof body.image === 'string') {
            // Remove data URL prefix if present
            const base64Data = body.image.replace(/^data:image\/[a-z]+;base64,/, '')
            imageBuffer = Buffer.from(base64Data, 'base64')
        } else if (Buffer.isBuffer(body.image)) {
            imageBuffer = body.image
        } else {
            return {
                statusCode: HttpStatusCode.BADREQUEST,
                error: 'Invalid image format. Expected base64 string or buffer',
                code: 'VALIDATION_ERROR',
                retryable: false,
            }
        }

        // Convert image to LaTeX
        const latexOutput = await convertMathImageToLatex(imageBuffer)

        return {
            statusCode: HttpStatusCode.SUCCESSWITHBODY,
            data: {
                latex: latexOutput,
                originalImageSize: imageBuffer.length,
                processedAt: new Date().toISOString(),
            },
            message: 'Math image successfully converted to LaTeX',
        }

    } catch (error) {
        console.error('Error converting math image to LaTeX:', error)

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
