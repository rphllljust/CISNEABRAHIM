type MeasurementVersionConflictBannerProps = {
  onReload: () => void;
};

export function MeasurementVersionConflictBanner({ onReload }: MeasurementVersionConflictBannerProps) {
  return (
    <div className="measurement-version-conflict" role="alert" aria-live="assertive">
      <p>
        <strong>Medição desatualizada.</strong> Outra pessoa alterou esta medição. As ações críticas
        estão bloqueadas até você recarregar e revisar os dados atuais.
      </p>
      <button type="button" className="measurement-version-conflict__reload" onClick={onReload}>
        Recarregar medição
      </button>
    </div>
  );
}
