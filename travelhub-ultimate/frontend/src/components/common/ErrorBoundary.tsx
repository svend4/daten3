import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for catching and handling React errors gracefully.
 * Prevents the entire app from crashing when an error occurs in a component.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // TODO: Send error to monitoring service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" aria-hidden="true" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Что-то пошло не так
            </h1>

            {/* Error Description */}
            <p className="text-gray-600 mb-6">
              Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу
              или вернуться на главную.
            </p>

            {/* Error Details - always show for debugging */}
            <div className="mb-6 text-left bg-gray-100 rounded-lg p-4 overflow-auto max-h-64">
              <p className="text-xs text-gray-500 mb-2">Debug info:</p>
              <p className="text-sm font-mono text-red-600 mb-2">
                {this.state.error ? this.state.error.toString() : 'Error object is null'}
              </p>
              <p className="text-xs text-gray-500 mb-1">Error name: {this.state.error?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500 mb-1">Error message: {this.state.error?.message || 'N/A'}</p>
              {this.state.errorInfo && (
                <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Попробовать снова
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                icon={<Home className="w-4 h-4" />}
              >
                На главную
              </Button>
            </div>

            {/* Support Link */}
            <p className="mt-6 text-sm text-gray-500">
              Если проблема повторяется, пожалуйста,{' '}
              <a
                href="/support"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                свяжитесь с поддержкой
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
