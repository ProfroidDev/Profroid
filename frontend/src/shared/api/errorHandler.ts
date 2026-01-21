import axios from 'axios';
import i18next from 'i18next';

export class APIError extends Error {
  statusCode?: number;
  backendMessage?: string;

  constructor(message: string, statusCode?: number, backendMessage?: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.backendMessage = backendMessage;
  }
}

export function handleAPIError(error: unknown): APIError {
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

  // Handle 401 Unauthorized
  if (statusCode === 401) {
    return new APIError(
      'Your session has expired. Please log in again.',
      401,
      'Authentication required'
    );
  }

  // Handle 403 Forbidden
  if (statusCode === 403) {
    return new APIError(
      'You do not have permission to perform this action.',
      403,
      'Permission denied'
    );
  }

  // Try to extract message from various backend response formats
  let backendMessage: string | undefined;

  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>;
    backendMessage =
      (data.message as string) || (data.error as string) || (data.errorMessage as string);
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
    return translateErrorMessage(error.message);
  }

  // Handles both Axios errors and generic errors
  if (typeof error === 'string') {
    // Direct string error (rare, but possible)
    return translateErrorMessage(error);
  }
  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (response) {
      if (response.data) {
        if (typeof response.data === 'string') {
          // Plain string error from backend
          return translateErrorMessage(response.data);
        } else if (typeof response.data === 'object' && response.data.message) {
          // JSON error with message property
          return translateErrorMessage(response.data.message);
        }
      }
      // Fallback to status text if no message
      return translateErrorMessage(response.statusText || 'An error occurred');
    }
    // Fallback to error.message if no response
    return translateErrorMessage(error.message || 'An error occurred');
  }

  if (error instanceof Error && error.message) {
    return translateErrorMessage(error.message);
  }
  return 'An error occurred';
}

function translateErrorMessage(message: string): string {
  const t = i18next.t.bind(i18next);

  // Check for known error patterns and translate them
  if (message.includes('Cannot convert customer to employee') && message.includes('appointment')) {
    // Extract the appointment count from the message
    const match = message.match(/(\d+)\s+appointment/);
    const count = match ? parseInt(match[1], 10) : 1;
    return t('error.employee.cannotConvertCustomerWithAppointments', { count });
  }

  // Return original message if no translation pattern matched
  return message;
}
