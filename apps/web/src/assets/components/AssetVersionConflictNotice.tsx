import { VERSION_CONFLICT_MESSAGE } from '../api/asset-error-messages';

type AssetVersionConflictNoticeProps = {
  onReload: () => void;
};

export function AssetVersionConflictNotice({ onReload }: AssetVersionConflictNoticeProps) {
  return (
    <div className="form-notice assets-conflict-notice" role="alert">
      <p>{VERSION_CONFLICT_MESSAGE}</p>
      <button type="button" onClick={onReload}>
        Recarregar dados atuais
      </button>
    </div>
  );
}
