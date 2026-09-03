import { Alert } from '../ui';

export function ClosedPeriodBanner({ message }: { message?: string }) {
  return (
    <Alert tone="warning" title="Período fechado" role="alert">
      {message ??
        'Este período está fechado. O backend rejeita novos lançamentos até uma reabertura autorizada.'}
    </Alert>
  );
}
