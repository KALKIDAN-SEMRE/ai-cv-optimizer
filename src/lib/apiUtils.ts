/**
 * Retry utility for API calls with exponential backoff
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (onRetry && attempt < maxRetries) {
        onRetry(attempt, lastError);
      }

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Network errors
  if (error.name === "NetworkError" || error.name === "TypeError") {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    // 429 (Rate limit), 500-599 (Server errors), 408 (Timeout)
    return status === 429 || status === 408 || (status >= 500 && status < 600);
  }

  // Error messages that indicate retryable issues
  const retryableMessages = [
    "timeout",
    "network",
    "connection",
    "rate limit",
    "server error",
    "service unavailable",
    "temporarily unavailable",
  ];

  const errorMessage = String(error.message || error).toLowerCase();
  return retryableMessages.some(msg => errorMessage.includes(msg));
}

/**
 * Parse error message for user-friendly display
 */
export function parseErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred";

  // Handle Supabase errors
  if (error.message) {
    const errorMsg = error.message.toLowerCase();
    
    // Edge Function specific errors
    if (errorMsg.includes("failed to send a request") || errorMsg.includes("edge function")) {
      return "Edge Function not accessible. The function may not be deployed or environment variables may be missing. Check the browser console and ensure the function is deployed.";
    }
    
    if (errorMsg.includes("function not found") || errorMsg.includes("404")) {
      return "Edge Function 'optimize-cv' not found. Please deploy it using: supabase functions deploy optimize-cv";
    }
    
    if (errorMsg.includes("unauthorized") || errorMsg.includes("401")) {
      return "Authentication error. Please check your Supabase credentials in .env file";
    }
    
    // Rate limit errors
    if (errorMsg.includes("rate limit") || errorMsg.includes("429")) {
      return "Rate limit exceeded. Please wait a moment and try again.";
    }

    // Network errors
    if (errorMsg.includes("network") || errorMsg.includes("fetch") || errorMsg.includes("failed to fetch")) {
      return "Network error. Please check your connection and try again.";
    }

    // Timeout errors
    if (errorMsg.includes("timeout")) {
      return "Request timed out. Please try again.";
    }

    // Payment/credit errors
    if (errorMsg.includes("payment") || errorMsg.includes("402") || errorMsg.includes("credit")) {
      return "API credits required. Please configure your AI provider API key.";
    }

    // Return the error message if it's user-friendly
    return error.message;
  }

  // Handle HTTP status codes
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    switch (status) {
      case 400:
        return "Invalid request. Please check your inputs.";
      case 401:
        return "Authentication failed. Please sign in again.";
      case 403:
        return "Access denied. You don't have permission for this action.";
      case 404:
        return "Resource not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return `Error ${status}: Please try again.`;
    }
  }

  return "An unexpected error occurred. Please try again.";
}


