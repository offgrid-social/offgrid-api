import { ZodError } from 'zod';

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, statusCode: number, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ErrorCodes = {
  Unauthorized: 'UNAUTHORIZED',
  Forbidden: 'FORBIDDEN',
  Validation: 'VALIDATION_ERROR',
  NotFound: 'NOT_FOUND',
  Internal: 'INTERNAL_ERROR',
  BadRequest: 'BAD_REQUEST'
} as const;

export function toErrorResponse(error: unknown, requestId: string) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: buildErrorBody(error.code, error.message, requestId)
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: buildErrorBody(ErrorCodes.Validation, error.message, requestId)
    };
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';

  return {
    statusCode: 500,
    body: buildErrorBody(ErrorCodes.Internal, message, requestId)
  };
}

export function buildErrorBody(code: string, message: string, requestId: string): ApiErrorResponse {
  return { error: { code, message, requestId } };
}
