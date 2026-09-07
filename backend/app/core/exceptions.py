"""Domain-level exceptions raised by services and translated to HTTP by controllers."""


class AppError(Exception):
    """Base class for all application (business-logic) errors."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""


class ConflictError(AppError):
    """Raised when an operation would violate a uniqueness/state constraint."""


class ValidationError(AppError):
    """Raised when input fails a business-rule validation (beyond schema validation)."""


class UnauthorizedError(AppError):
    """Raised when authentication is missing or invalid."""


class FileTooLargeError(AppError):
    """Raised when an uploaded file exceeds the configured size limit."""
