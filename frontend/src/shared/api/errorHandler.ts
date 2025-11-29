import axios from 'axios';

/**
 * Custom API Error class for consistent error handling
 */
export class APIError extends Error {
  statusCode?: number;
  backendMessage?: string;

  constructor(
    message: string,
    statusCode?: number,
    backendMessage?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.backendMessage = backendMessage;
  }
}

export function handleAPIError(error: unknown): APIError {
  // Log the full error to debug
  console.log('Full error object:', error);
  
  interface AxiosErrorResponse {
    response?: {
      status?: number;
      statusText?: string;
      data?: unknown;
    };
    message?: string;
  }

  const axiosError = error as AxiosErrorResponse;
  const statusCode = axiosError?.response?.status;
  const statusText = axiosError?.response?.statusText;
  const responseData = axiosError?.response?.data;
  
  console.log('Status Code:', statusCode);
  console.log('Status Text:', statusText);
  console.log('Response Data:', responseData);
  
  // Try to extract message from various backend response formats
  let backendMessage: string | undefined;
  
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>;
    backendMessage = 
      (data.message as string) || 
      (data.error as string) ||
      (data.errorMessage as string);
  } else if (typeof responseData === 'string') {
    backendMessage = responseData;
  }
  
  // Build display message
  let displayMessage: string;
  if (backendMessage) {
    displayMessage = backendMessage;
  } else if (statusCode && statusText) {
    displayMessage = `Request failed with status code ${statusCode}: ${statusText}`;
  } else if (statusCode) {
    displayMessage = `Request failed with status code ${statusCode}`;
  } else {
    displayMessage = axiosError?.message || 'An error occurred. Please try again.';
  }
  
  console.log('Display Message:', displayMessage);
  
  return new APIError(displayMessage, statusCode, backendMessage);
}

export function getErrorMessage(error: unknown): string {
  // Check if it's our custom APIError first
  if (error instanceof APIError) {
    return error.message;
  }
  
  // Handles both Axios errors and generic errors
  if (typeof error === 'string') {
    // Direct string error (rare, but possible)
    return error;
  }
  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (response) {
      if (response.data) {
        if (typeof response.data === 'string') {
          // Plain string error from backend
          return response.data;
        } else if (typeof response.data === 'object' && response.data.message) {
          // JSON error with message property
          return response.data.message;
        }
      }
      // Fallback to status text if no message
      return response.statusText || 'An error occurred';
    }
    // Fallback to error.message if no response
    return error.message || 'An error occurred';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'An error occurred';
}
