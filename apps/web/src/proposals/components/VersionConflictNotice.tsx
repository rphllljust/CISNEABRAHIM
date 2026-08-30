import { PROPOSAL_VERSION_CONFLICT_MESSAGE } from '../api/proposal-error-messages';

type VersionConflictNoticeProps = {
  onReload: () => void;
};

export function VersionConflictNotice({ onReload }: VersionConflictNoticeProps) {
  return (
    <div className="version-conflict-banner" role="alert">
      <p>{PROPOSAL_VERSION_CONFLICT_MESSAGE}</p>
      <button type="button" onClick={onReload}>
        Recarregar dados
      </button>
    </div>
  );
}
