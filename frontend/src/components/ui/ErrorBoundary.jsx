import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-red-950/20 border-red-500/20 p-6 flex flex-col items-center justify-center text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-400">Something went wrong</h3>
            <p className="text-sm text-red-400/70 mt-1 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}
