import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="card">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Что-то пошло не так
                </h1>
                
                <p className="text-gray-600 mb-6">
                  Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу или вернуться на главную.
                </p>

                {import.meta.env.DEV && this.state.error && (
                  <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                    <p className="text-sm font-mono text-red-800 break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-sm text-red-700 cursor-pointer">
                          Подробности
                        </summary>
                        <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={this.handleReset}
                    className="btn btn-primary flex items-center justify-center flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Попробовать снова
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="btn btn-secondary flex items-center justify-center flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    На главную
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
