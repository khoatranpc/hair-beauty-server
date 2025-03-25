export interface IBaseResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface IPaginationResponse<T = any> {
    data: {
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        success: boolean;
        message: string;
        error?: string;
    };
}

export interface IErrorResponse {
    success: false;
    message: string;
    error: string;
    statusCode?: number;
}