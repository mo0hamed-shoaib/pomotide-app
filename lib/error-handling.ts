// Centralized error handling utilities

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high';
  context?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Map common error codes to user-friendly messages
  private getErrorMapping(error: unknown): AppError {
    // Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as { code: string; message: string };
      
      switch (supabaseError.code) {
        case 'PGRST116':
          return {
            code: 'NOT_FOUND',
            message: supabaseError.message,
            userMessage: 'No data found. This might be your first time using this feature.',
            severity: 'low',
            context: 'database'
          };
        case '23505':
          return {
            code: 'DUPLICATE_ENTRY',
            message: supabaseError.message,
            userMessage: 'This item already exists. Please try again.',
            severity: 'medium',
            context: 'database'
          };
        case '23503':
          return {
            code: 'FOREIGN_KEY_VIOLATION',
            message: supabaseError.message,
            userMessage: 'Cannot perform this action due to related data.',
            severity: 'high',
            context: 'database'
          };
        case '42501':
          return {
            code: 'INSUFFICIENT_PRIVILEGE',
            message: supabaseError.message,
            userMessage: 'You don\'t have permission to perform this action.',
            severity: 'high',
            context: 'auth'
          };
        default:
          return {
            code: supabaseError.code,
            message: supabaseError.message,
            userMessage: 'Something went wrong. Please try again.',
            severity: 'medium',
            context: 'database'
          };
      }
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        severity: 'high',
        context: 'network'
      };
    }

    // Generic errors
    if (error instanceof Error) {
      return {
        code: 'GENERIC_ERROR',
        message: error.message,
        userMessage: 'Something went wrong. Please try again.',
        severity: 'medium',
        context: 'unknown'
      };
    }

    // Unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'high',
      context: 'unknown'
    };
  }

  // Handle and log errors
  handleError(error: unknown, context?: string): AppError {
    const appError = this.getErrorMapping(error);
    
    // Add context if provided
    if (context) {
      appError.context = context;
    }

    // Log error for debugging
    console.error(`[${appError.context || 'unknown'}] ${appError.code}:`, {
      message: appError.message,
      userMessage: appError.userMessage,
      severity: appError.severity,
      originalError: error
    });

    return appError;
  }

  // Show user-friendly error message
  async showErrorToast(error: unknown, context?: string): Promise<void> {
    const appError = this.handleError(error, context);
    
    try {
      const { toast } = await import("sonner");
      
      if (appError.severity === 'high') {
        toast.error(appError.userMessage);
      } else if (appError.severity === 'medium') {
        toast.error(appError.userMessage);
      } else {
        toast(appError.userMessage);
      }
    } catch (toastError) {
      // Fallback if toast system fails
      console.error('Failed to show error toast:', toastError);
      console.error('Original error:', appError);
    }
  }

  // Show success message
  async showSuccessToast(message: string): Promise<void> {
    try {
      const { toast } = await import("sonner");
      toast.success(message);
    } catch (error) {
      console.error('Failed to show success toast:', error);
    }
  }

  // Show info message
  async showInfoToast(message: string): Promise<void> {
    try {
      const { toast } = await import("sonner");
      toast(message);
    } catch (error) {
      console.error('Failed to show info toast:', error);
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: unknown, context?: string) => 
  errorHandler.handleError(error, context);

export const showErrorToast = (error: unknown, context?: string) => 
  errorHandler.showErrorToast(error, context);

export const showSuccessToast = (message: string) => 
  errorHandler.showSuccessToast(message);

export const showInfoToast = (message: string) => 
  errorHandler.showInfoToast(message);
