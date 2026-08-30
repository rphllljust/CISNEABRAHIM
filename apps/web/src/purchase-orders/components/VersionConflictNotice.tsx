import { PURCHASE_ORDER_VERSION_CONFLICT_MESSAGE } from '../api/purchase-order-error-messages';

type VersionConflictNoticeProps = {
  onReload: () => void;
};

export function VersionConflictNotice({ onReload }: VersionConflictNoticeProps) {
  return (
    <div className="version-conflict-banner" role="alert">
      <p>{PURCHASE_ORDER_VERSION_CONFLICT_MESSAGE}</p>
      <button type="button" onClick={onReload}>
        Recarregar dados
      </button>
    </div>
  );
}
