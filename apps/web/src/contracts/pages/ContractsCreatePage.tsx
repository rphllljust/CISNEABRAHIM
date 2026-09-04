import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
import { listClients } from '../../clients/api/clients-api';
import { ContractsApiError, createContract } from '../api/contracts-api';
import { mapContractErrorToMessage } from '../api/contracts-error-messages';
import { ContractFormFields, type ClientOption } from '../components/ContractFormFields';
import { useContractCapabilities } from '../hooks/useContractCapabilities';
import { Button, FieldError, PageHeader } from '../../ui';
import {
  buildCreateContractPayload,
  EMPTY_CONTRACT_FORM,
  validateContractCreateForm,
} from '../utils/contract-form-values';

export function ContractsCreatePage() {
  const navigate = useNavigate();
  const { capabilities, loading: capabilitiesLoading } = useContractCapabilities();
  const [values, setValues] = useState({ ...EMPTY_CONTRACT_FORM });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void listClients({ limit: 100, offset: 0 }, controller.signal)
      .then((response) => {
        setClients(
          response.items.map((client) => ({
            id: client.id,
            label: client.tradeName || client.legalName,
          })),
        );
      })
      .catch(() => setClients([]))
      .finally(() => {
        if (!controller.signal.aborted) {
          setClientsLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  if (capabilitiesLoading) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Verificando permissões…
        </p>
      </main>
    );
  }

  if (!capabilities.canCreate) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Novo contrato</h1>
        <p role="alert">Você não tem permissão para cadastrar contratos.</p>
        <Link to="/app/contracts">Voltar à lista</Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const errors = validateContractCreateForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const created = await createContract(buildCreateContractPayload(values));
      void navigate(`/app/contracts/${created.contract.id}`, { replace: true });
    } catch (error) {
      if (error instanceof ContractsApiError) {
        setSubmitError(mapContractErrorToMessage(error.code, error.status));
      } else {
        setSubmitError('Não foi possível cadastrar o contrato.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page">
      <PageHeader
        title="Novo contrato"
        actions={
          <Button type="button" variant="secondary" onClick={() => void navigate('/app/contracts')}>
            Cancelar
          </Button>
        }
      />
      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="max-w-3xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
        aria-describedby={submitError ? 'contract-create-error' : undefined}
      >
        {submitError ? (
          <div className="mb-4">
            <FieldError id="contract-create-error">{submitError}</FieldError>
          </div>
        ) : null}
        <ContractFormFields
          mode="create"
          values={values}
          clients={clients}
          clientsLoading={clientsLoading}
          disabled={submitting}
          fieldErrors={fieldErrors}
          onChange={setValues}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting} loading={submitting} loadingText="Cadastrando">
            Cadastrar contrato
          </Button>
          <Link
            to="/app/contracts"
            className="inline-flex min-h-9 items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 no-underline ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
