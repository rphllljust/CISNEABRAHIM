import { Alert } from './Alert';
import { Button } from './Button';

export type VersionConflictBannerProps = {
  message: string;
  onReload: () => void;
  reloadLabel?: string;
};

export function VersionConflictBanner({
  message,
  onReload,
  reloadLabel = 'Recarregar dados atuais',
}: VersionConflictBannerProps) {
  return (
    <Alert tone="error" title="Conflito de versão">
      <p>{message}</p>
      <Button type="button" variant="secondary" className="mt-3" onClick={onReload}>
        {reloadLabel}
      </Button>
    </Alert>
  );
}
