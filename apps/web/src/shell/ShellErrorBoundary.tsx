import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../ui/ErrorState';
import { Button } from '../ui/Button';

type ShellErrorBoundaryProps = {
  children: ReactNode;
};

type ShellErrorBoundaryState = {
  hasError: boolean;
};

export class ShellErrorBoundary extends Component<
  ShellErrorBoundaryProps,
  ShellErrorBoundaryState
> {
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
        <main id="main-content" className="shell-page">
          <ErrorState
            kind="generic"
            title="Erro inesperado"
            message="Algo deu errado ao carregar esta página."
            onRetry={() => this.setState({ hasError: false })}
            retryLabel="Tentar novamente"
            action={
              <Button type="button" variant="secondary" onClick={() => window.location.assign('/app')}>
                Voltar ao painel
              </Button>
            }
          />
        </main>
      );
    }

    return this.props.children;
  }
}
