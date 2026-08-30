import { SERVICE_ORDER_STATUSES } from '../types/service-order.types';

const STATUS_LABELS: Record<string, string> = {
  [SERVICE_ORDER_STATUSES.Draft]: 'Rascunho',
  [SERVICE_ORDER_STATUSES.Prepared]: 'Preparada',
  [SERVICE_ORDER_STATUSES.Released]: 'Liberada',
  [SERVICE_ORDER_STATUSES.InExecution]: 'Em execução',
  [SERVICE_ORDER_STATUSES.Paused]: 'Pausada',
  [SERVICE_ORDER_STATUSES.Completed]: 'Concluída',
  [SERVICE_ORDER_STATUSES.Cancelled]: 'Cancelada',
};

type ExecutionHeaderProps = {
  orderNumber: string;
  status: string;
  serviceName: string;
  clientLabel: string | null;
  locationLabel: string | null;
  scheduleLabel: string | null;
  equipmentLabel: string | null;
  operatorLabel: string;
};

export function ExecutionHeader({
  orderNumber,
  status,
  serviceName,
  clientLabel,
  locationLabel,
  scheduleLabel,
  equipmentLabel,
  operatorLabel,
}: ExecutionHeaderProps) {
  const statusLabel = STATUS_LABELS[status] ?? status;

  return (
    <header className="execution-header" aria-labelledby="execution-header-title">
      <div className="execution-header__top">
        <p className="execution-header__eyebrow">Ordem de serviço</p>
        <span className={`execution-status execution-status--${status.toLowerCase()}`}>{statusLabel}</span>
      </div>
      <h1 id="execution-header-title" className="execution-header__title">
        {orderNumber}
      </h1>
      <dl className="execution-header__facts">
        <div>
          <dt>Serviço</dt>
          <dd>{serviceName}</dd>
        </div>
        {clientLabel ? (
          <div>
            <dt>Cliente</dt>
            <dd>{clientLabel}</dd>
          </div>
        ) : null}
        {locationLabel ? (
          <div>
            <dt>Local</dt>
            <dd>{locationLabel}</dd>
          </div>
        ) : null}
        {scheduleLabel ? (
          <div>
            <dt>Horário</dt>
            <dd>{scheduleLabel}</dd>
          </div>
        ) : null}
        {equipmentLabel ? (
          <div>
            <dt>Equipamento</dt>
            <dd>{equipmentLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>Função</dt>
          <dd>{operatorLabel}</dd>
        </div>
      </dl>
    </header>
  );
}
