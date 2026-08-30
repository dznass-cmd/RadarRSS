/**
 * Utility for global error and notification handling.
 * Dispatches custom events to the app's toast notification system.
 * Keeps console.error only in development mode.
 */

export function showError(message: string, title: string = 'Erro') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('radar-app-toast', {
        detail: {
          title,
          message,
          type: 'warning',
        },
      })
    );
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.error(`[App Error] ${title}: ${message}`);
  }
}

export function showSuccess(message: string, title: string = 'Sucesso') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('radar-app-toast', {
        detail: {
          title,
          message,
          type: 'success',
        },
      })
    );
  }
}
