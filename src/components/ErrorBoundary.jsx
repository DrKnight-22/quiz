import { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could log this to an error tracking service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                The application encountered an unexpected error. We apologize for the inconvenience.
              </p>
              <p className="text-sm text-gray-500">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-600 mb-2">
                Technical details
              </summary>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {this.state.error?.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
              
              <Link
                to="/"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;