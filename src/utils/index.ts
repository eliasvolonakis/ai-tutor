/**
 * HTTP Status Codes Enum
 * 
 * This enum provides standardized HTTP status codes for consistent
 * response handling across the application.
 */
export enum HttpStatusCode {
    // Success responses
    SUCCESSWITHBODY = 200,
    CREATED = 201,
    SUCCESSWITHOUTBODY = 204,

    // Client error responses
    BADREQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOTFOUND = 404,
    METHODNOTALLOWED = 405,
    CONFLICT = 409,
    UNPROCESSABLEENTITY = 422,
    TOOMANYREQUESTS = 429,

    // Server error responses
    INTERNALSERVERERROR = 500,
    BADGATEWAY = 502,
    SERVICEUNAVAILABLE = 503,
    GATEWAYTIMEOUT = 504,
}

/**
 * HTTP Status Messages
 * 
 * Provides human-readable messages for each status code
 */
export const HttpStatusMessage: Record<HttpStatusCode, string> = {
    [HttpStatusCode.SUCCESSWITHBODY]: 'OK',
    [HttpStatusCode.CREATED]: 'Created',
    [HttpStatusCode.SUCCESSWITHOUTBODY]: 'No Content',
    [HttpStatusCode.BADREQUEST]: 'Bad Request',
    [HttpStatusCode.UNAUTHORIZED]: 'Unauthorized',
    [HttpStatusCode.FORBIDDEN]: 'Forbidden',
    [HttpStatusCode.NOTFOUND]: 'Not Found',
    [HttpStatusCode.METHODNOTALLOWED]: 'Method Not Allowed',
    [HttpStatusCode.CONFLICT]: 'Conflict',
    [HttpStatusCode.UNPROCESSABLEENTITY]: 'Unprocessable Entity',
    [HttpStatusCode.TOOMANYREQUESTS]: 'Too Many Requests',
    [HttpStatusCode.INTERNALSERVERERROR]: 'Internal Server Error',
    [HttpStatusCode.BADGATEWAY]: 'Bad Gateway',
    [HttpStatusCode.SERVICEUNAVAILABLE]: 'Service Unavailable',
    [HttpStatusCode.GATEWAYTIMEOUT]: 'Gateway Timeout',
}

/**
 * Helper function to get status message for a status code
 */
export const getStatusMessage = (statusCode: HttpStatusCode): string => {
    return HttpStatusMessage[statusCode] || 'Unknown Status'
}

/**
 * Helper function to check if status code is a success response
 */
export const isSuccessStatus = (statusCode: HttpStatusCode): boolean => {
    return statusCode >= 200 && statusCode < 300
}

/**
 * Helper function to check if status code is a client error
 */
export const isClientError = (statusCode: HttpStatusCode): boolean => {
    return statusCode >= 400 && statusCode < 500
}

/**
 * Helper function to check if status code is a server error
 */
export const isServerError = (statusCode: HttpStatusCode): boolean => {
    return statusCode >= 500 && statusCode < 600
}
