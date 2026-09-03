import { Alert } from '../ui';

export function ProcessingBanner({ message }: { message?: string }) {
  return (
    <Alert tone="info" title="Processando" role="status">
      {message ?? 'Aguarde. A operação está em andamento no servidor.'}
    </Alert>
  );
}
