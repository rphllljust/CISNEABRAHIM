type BillingVersionConflictBannerProps = {
  onReload: () => void;
};

export function BillingVersionConflictBanner({ onReload }: BillingVersionConflictBannerProps) {
  return (
    <div className="billing-conflict" role="alert">
      <p>
        <strong>Registro desatualizado.</strong> Outra pessoa alterou este faturamento. Recarregue para
        continuar com os dados atuais.
      </p>
      <button type="button" className="billing-button" onClick={onReload}>
        Recarregar faturamento
      </button>
    </div>
  );
}
