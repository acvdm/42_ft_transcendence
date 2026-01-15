export class ValidationError extends Error {
    statusCode = 400;
}

export class NotFoundError extends Error {
    statusCode = 404;
}

export class UnauthorizedError extends Error {
    statusCode = 401;
}

export class ForbiddenError extends Error {
    statusCode = 403;
}

export class ConflictError extends Error {
    statusCode = 409;
}

export class ServiceUnavailableError extends Error {
    statusCode = 503;
}

export class BadGatewayError extends Error {
    statusCode = 502;
}