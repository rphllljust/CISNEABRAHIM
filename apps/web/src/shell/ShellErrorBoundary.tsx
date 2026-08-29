import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ShellErrorBoundaryProps = {
  children: ReactNode;
};

type ShellErrorBoundaryState = {
  hasError: boolean;
};

export class ShellErrorBoundary extends Component<ShellErrorBoundaryProps, ShellErrorBoundaryState> {
  state: ShellErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ShellErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally no console logging — avoid leaking unexpected error details.
  }

  render() {
    if (this.state.hasError) {
      return (
        <main id="main-content" className="shell-page" role="alert">
          <h1>Unexpected error</h1>
          <p>Something went wrong while loading this page.</p>
          <p>
            <button type="button" onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </p>
          <p>
            <Link to="/app">Return to home</Link>
          </p>
        </main>
      );
    }

    return this.props.children;
  }
}
