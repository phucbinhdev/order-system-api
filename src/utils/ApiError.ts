export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public status: string;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Bad Request'): ApiError {
        return new ApiError(400, message);
    }

    static unauthorized(message = 'Unauthorized'): ApiError {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Forbidden'): ApiError {
        return new ApiError(403, message);
    }

    static notFound(message = 'Not Found'): ApiError {
        return new ApiError(404, message);
    }

    static conflict(message = 'Conflict'): ApiError {
        return new ApiError(409, message);
    }

    static internal(message = 'Internal Server Error'): ApiError {
        return new ApiError(500, message, false);
    }
}

export default ApiError;
