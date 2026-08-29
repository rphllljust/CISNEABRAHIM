import { VERSION_CONFLICT_MESSAGE } from '../api/request-error-messages';

type VersionConflictNoticeProps = {
  onReload: () => void;
};

export function VersionConflictNotice({ onReload }: VersionConflictNoticeProps) {
  return (
    <div className="form-notice requests-conflict-notice" role="alert">
      <p>{VERSION_CONFLICT_MESSAGE}</p>
      <button type="button" onClick={onReload}>
        Recarregar dados atuais
      </button>
    </div>
  );
}
