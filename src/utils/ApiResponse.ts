import { Response } from 'express';

export class ApiResponse<T = any> {
    public success: boolean;
    public statusCode: number;
    public message: string;
    public data: T;

    constructor(statusCode: number, data: T, message: string) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    static success<T>(data: T, message = 'Success'): ApiResponse<T> {
        return new ApiResponse(200, data, message);
    }

    static created<T>(data: T, message = 'Created successfully'): ApiResponse<T> {
        return new ApiResponse(201, data, message);
    }

    static noContent(message = 'Deleted successfully'): ApiResponse<null> {
        return new ApiResponse(204, null, message);
    }

    send(res: Response): Response {
        return res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            data: this.data,
        });
    }
}

export default ApiResponse;
