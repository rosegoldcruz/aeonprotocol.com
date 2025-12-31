"""Custom exceptions for the AEON Protocol API."""


class ConfigError(Exception):
    """Raised when required configuration is missing or invalid."""
    
    def __init__(self, missing_vars: list[str]) -> None:
        """Initialize ConfigError with missing variables.
        
        Args:
            missing_vars: List of missing environment variable names
        """
        self.missing_vars = missing_vars
        var_list = ", ".join(missing_vars)
        super().__init__(f"Missing required environment variables: {var_list}")


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


class AuthorizationError(Exception):
    """Raised when user lacks required permissions."""
    pass


class ProviderError(Exception):
    """Raised when AI provider operations fail."""
    
    def __init__(self, provider: str, message: str, status_code: int | None = None) -> None:
        """Initialize ProviderError.
        
        Args:
            provider: Name of the AI provider
            message: Error message
            status_code: HTTP status code if applicable
        """
        self.provider = provider
        self.status_code = status_code
        super().__init__(f"{provider}: {message}")


class CreditError(Exception):
    """Raised when credit operations fail."""
    pass


class JobError(Exception):
    """Raised when job operations fail."""
    pass


class StorageError(Exception):
    """Raised when storage operations fail."""
    pass