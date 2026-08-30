import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../../clients/components/ConfirmDialog';
import { formatMoneyBrl } from '../utils/measurement-format';
import type { MeasurementComparisonRow } from '../utils/measurement-variance';
import { hasBlockingVariances } from '../utils/measurement-comparison';
import { VARIANCE_LABELS, type VarianceKind } from '../utils/measurement-variance';

type MeasurementApprovalDialogProps = {
  open: boolean;
  rows: MeasurementComparisonRow[];
  itemCount: number;
  totalAmount: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MeasurementApprovalDialog({
  open,
  rows,
  itemCount,
  totalAmount,
  submitting,
  onCancel,
  onConfirm,
}: MeasurementApprovalDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
    }
  }, [open]);
  const blocking = hasBlockingVariances(rows);
  const divergences = rows.flatMap((row) =>
    row.variances.filter((variance) => variance !== 'aligned'),
  );

  return (
    <ConfirmDialog
      open={open}
      title="Confirmar aprovação da medição"
      description="Revise o resumo abaixo antes de aprovar. Esta ação não deve ser acionada sem conferência completa."
      confirmLabel={submitting ? 'Aprovando…' : 'Aprovar medição'}
      cancelLabel="Voltar à conferência"
      confirmDisabled={submitting || blocking || !acknowledged}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="measurement-approval">

        <dl className="measurement-approval__facts">
          <div>
            <dt>Itens</dt>
            <dd className="measurement-amount">{itemCount}</dd>
          </div>
          <div>
            <dt>Valor total</dt>
            <dd className="measurement-amount">{formatMoneyBrl(totalAmount)}</dd>
          </div>
          <div>
            <dt>Divergências</dt>
            <dd className="measurement-amount">{divergences.length}</dd>
          </div>
        </dl>

        {divergences.length > 0 ? (
          <ul className="measurement-approval__list">
            {divergences.map((variance, index) => (
              <li key={`${variance}-${index}`}>
                <span
                  className={`measurement-variance measurement-variance--${(variance as VarianceKind).replace(/_/g, '-')}`}
                >
                  {VARIANCE_LABELS[variance as VarianceKind]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="measurement-hint">Nenhuma divergência registrada nos itens.</p>
        )}

        {blocking ? (
          <p className="measurement-feedback measurement-feedback--error" role="alert">
            Existem pendências bloqueantes. Resolva antes de aprovar.
          </p>
        ) : null}

        <label className="measurement-approval__ack">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          Confirmo que revisei planejado, realizado e medido, e autorizo a aprovação desta medição.
        </label>
      </div>
    </ConfirmDialog>
  );
}
