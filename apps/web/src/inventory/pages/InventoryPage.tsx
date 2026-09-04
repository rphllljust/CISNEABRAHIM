import { useCallback, useState, type ReactNode } from 'react';
import { EmptyState, Field, Input, Select } from '../../ui';
import { ModulePage, ModulePageHeader } from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { CreateRecordForm } from '../../financial-ui/VersionedActionForm';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { BackofficeCapabilityRoute } from '../../financial-ui/BackofficeCapabilityRoute';
import {
  createInventoryItem,
  createWarehouse,
  createCostingRule,
  createCostingRuleVersion,
  getCostingRule,
  publishCostingRuleVersion,
  getStockBalance,
  mapInventoryErrorToMessage,
  postStockMovement,
  probeInventoryReadAccess,
  releaseReservation,
  reconcileInventoryCost,
  reconcileStockQuantity,
  reserveStock,
  reverseStockMovement,
  type CostingRule,
  type StockBalance,
} from '../api/inventory-api';
import { buildStockMovementPayload, type StockMovementType } from '../utils/movement-payload';

export function InventoryRoute({ children }: { children: ReactNode }) {
  return (
    <BackofficeCapabilityRoute probe={probeInventoryReadAccess} capabilityId="inventory:stock:read">
      {children}
    </BackofficeCapabilityRoute>
  );
}

export function InventoryPage() {
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [activeWarehouseId, setActiveWarehouseId] = useState('');
  const [activeItemId, setActiveItemId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType>('IN');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [adjustmentEffect, setAdjustmentEffect] = useState('INCREASE');
  const [quantity, setQuantity] = useState('');
  const [occurredOn, setOccurredOn] = useState('');
  const [description, setDescription] = useState('');
  const [createdIds, setCreatedIds] = useState<string | null>(null);
  const [movementNote, setMovementNote] = useState<string | null>(null);
  const [reservationNote, setReservationNote] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState('');
  const [commandKey, setCommandKey] = useState('');
  const [reversalKey, setReversalKey] = useState('');
  const [costingRuleId, setCostingRuleId] = useState('');
  const [costingCode, setCostingCode] = useState('');
  const [costingName, setCostingName] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [costingNote, setCostingNote] = useState<string | null>(null);
  const [costingVersionId, setCostingVersionId] = useState('');
  const [costingRowVersion, setCostingRowVersion] = useState('');

  const loader = useCallback(
    (signal?: AbortSignal) => getStockBalance(activeWarehouseId, activeItemId, signal),
    [activeItemId, activeWarehouseId],
  );
  const { state, reload } = useBackofficeQuery<StockBalance>({
    loader,
    mapError: mapInventoryErrorToMessage,
    enabled: Boolean(activeWarehouseId && activeItemId),
    autoLoad: Boolean(activeWarehouseId && activeItemId),
  });
  const costingLoader = useCallback(
    (signal?: AbortSignal) => getCostingRule(costingRuleId, signal),
    [costingRuleId],
  );
  const costing = useBackofficeQuery<CostingRule>({
    loader: costingLoader,
    mapError: mapInventoryErrorToMessage,
    enabled: Boolean(costingRuleId),
    autoLoad: Boolean(costingRuleId),
  });
  const stockReconcileLoader = useCallback(
    (signal?: AbortSignal) => reconcileStockQuantity(activeWarehouseId, activeItemId, signal),
    [activeItemId, activeWarehouseId],
  );
  const stockReconcile = useBackofficeQuery<{ matches: boolean; onHand: string; derivedOnHand: string }>({
    loader: stockReconcileLoader,
    mapError: mapInventoryErrorToMessage,
    enabled: Boolean(activeWarehouseId && activeItemId),
    autoLoad: Boolean(activeWarehouseId && activeItemId),
  });
  const reconcileLoader = useCallback(
    (signal?: AbortSignal) => reconcileInventoryCost(activeWarehouseId, activeItemId, signal),
    [activeItemId, activeWarehouseId],
  );
  const reconcile = useBackofficeQuery<{ matches: boolean; movementCount: number }>({
    loader: reconcileLoader,
    mapError: mapInventoryErrorToMessage,
    enabled: Boolean(activeWarehouseId && activeItemId),
    autoLoad: Boolean(activeWarehouseId && activeItemId),
  });
  const gate =
    activeWarehouseId && activeItemId
      ? renderQueryGate(
          'Estoque',
          'Carregando saldo…',
          'Você não tem permissão para consultar estoque.',
          state,
          () => void reload(),
        )
      : null;
  const movementQuantity = Number(quantity);
  const movementQuantityValid = quantity.trim() !== '' && Number.isFinite(movementQuantity) && movementQuantity > 0;
  const movementFieldsComplete =
    Boolean(unitId.trim() && warehouseId.trim() && itemId.trim() && occurredOn.trim() && description.trim()) &&
    (movementType !== 'TRANSFER' || Boolean(destinationWarehouseId.trim())) &&
    (movementType !== 'ADJUSTMENT' || adjustmentEffect === 'INCREASE' || adjustmentEffect === 'DECREASE');
  const movementDisabled = !movementQuantityValid || !movementFieldsComplete;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Estoque"
        description="Saldos e movimentos são os persistidos pelo servidor. Custo médio/FIFO permanece indeciso."
      />
      <RecordLookupCard
        fieldId="inventory-warehouse"
        label="Depósito"
        value={warehouseId}
        onChange={setWarehouseId}
        onSubmit={() => {
          setActiveWarehouseId(warehouseId.trim());
          setActiveItemId(itemId.trim());
        }}
        submitLabel="Consultar saldo"
      >
        <Field label="Item" htmlFor="inventory-item">
          <Input id="inventory-item" value={itemId} onChange={(event) => setItemId(event.target.value)} />
        </Field>
      </RecordLookupCard>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateRecordForm
          title="Criar depósito"
          description="Código e nome são validados pela API."
          submitLabel="Criar depósito"
          mapError={mapInventoryErrorToMessage}
          onSubmit={async () => {
            const created = await createWarehouse({ unitId: unitId.trim(), code: code.trim(), name: name.trim() });
            setCreatedIds(`Depósito ${created.id}`);
            setWarehouseId(created.id);
          }}
        >
          <Field label="Unidade" htmlFor="wh-unit" required>
            <Input id="wh-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} required />
          </Field>
          <Field label="Código" htmlFor="wh-code" required>
            <Input id="wh-code" value={code} onChange={(event) => setCode(event.target.value)} required />
          </Field>
          <Field label="Nome" htmlFor="wh-name" required>
            <Input id="wh-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
        </CreateRecordForm>
        <CreateRecordForm
          title="Criar item"
          description="SKU e nome são persistidos pelo servidor."
          submitLabel="Criar item"
          mapError={mapInventoryErrorToMessage}
          onSubmit={async () => {
            const created = await createInventoryItem({
              unitId: unitId.trim(),
              sku: sku.trim(),
              name: name.trim(),
            });
            setCreatedIds(`Item ${created.id}`);
            setItemId(created.id);
          }}
        >
          <Field label="SKU" htmlFor="item-sku" required>
            <Input id="item-sku" value={sku} onChange={(event) => setSku(event.target.value)} required />
          </Field>
          <Field label="Nome do item" htmlFor="item-name" required>
            <Input id="item-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
        </CreateRecordForm>
      </div>
      <CreateRecordForm
        title="Movimentar estoque"
        description="Entrada, saída, transferência e ajuste são validados pelo servidor."
        submitLabel="Lançar movimento"
        disabled={movementDisabled}
        mapError={mapInventoryErrorToMessage}
        onSubmit={async (idempotencyKey) => {
          const result = await postStockMovement(
            buildStockMovementPayload({
              unitId: unitId.trim(),
              warehouseId: warehouseId.trim(),
              inventoryItemId: itemId.trim(),
              movementType,
              quantity: quantity.trim(),
              occurredOn: occurredOn.trim(),
              description: description.trim(),
              idempotencyKey,
              destinationWarehouseId: destinationWarehouseId.trim() || null,
              adjustmentEffect,
            }),
          );
          setMovementNote(
            `Movimento lançado (${result.movements.map((movement) => movement.id).join(', ')}).`,
          );
          const movedWarehouseId = warehouseId.trim();
          const movedItemId = itemId.trim();
          if (activeWarehouseId === movedWarehouseId && activeItemId === movedItemId) {
            await reload();
          } else {
            setActiveWarehouseId(movedWarehouseId);
            setActiveItemId(movedItemId);
          }
        }}
      >
        <Field label="Tipo" htmlFor="move-type" required>
          <Select
            id="move-type"
            value={movementType}
            onChange={(event) => setMovementType(event.target.value as StockMovementType)}
          >
            <option value="IN">Entrada</option>
            <option value="OUT">Saída</option>
            <option value="TRANSFER">Transferência</option>
            <option value="ADJUSTMENT">Ajuste</option>
          </Select>
        </Field>
        {movementType === 'TRANSFER' ? (
          <Field label="Depósito de destino (id)" htmlFor="move-dest" required className="md:col-span-2">
            <Input
              id="move-dest"
              value={destinationWarehouseId}
              onChange={(event) => setDestinationWarehouseId(event.target.value)}
              required
            />
          </Field>
        ) : null}
        {movementType === 'ADJUSTMENT' ? (
          <Field label="Efeito do ajuste" htmlFor="move-effect" required className="md:col-span-2">
            <Select
              id="move-effect"
              value={adjustmentEffect}
              onChange={(event) => setAdjustmentEffect(event.target.value)}
            >
              <option value="INCREASE">Aumentar</option>
              <option value="DECREASE">Diminuir</option>
            </Select>
          </Field>
        ) : null}
        <Field label="Quantidade" htmlFor="move-qty" required>
          <Input id="move-qty" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </Field>
        <Field label="Data" htmlFor="move-on" required>
          <Input id="move-on" type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required />
        </Field>
        <Field label="Descrição" htmlFor="move-desc" required>
          <Input id="move-desc" value={description} onChange={(event) => setDescription(event.target.value)} required />
        </Field>
        {movementType === 'TRANSFER' && !destinationWarehouseId.trim() ? (
          <p className="text-sm text-red-700 md:col-span-2" role="alert">
            Informe o depósito de destino para lançar a transferência.
          </p>
        ) : null}
        {!movementQuantityValid ? (
          <p className="text-sm text-red-700 md:col-span-2" role="alert">
            Informe uma quantidade maior que zero.
          </p>
        ) : null}
        {movementType === 'ADJUSTMENT' ? (
          <p className="text-sm text-gray-600 md:col-span-2">
            Ajuste sempre usa quantidade positiva; o efeito (aumentar/diminuir) é enviado ao servidor.
          </p>
        ) : null}
      </CreateRecordForm>
      {movementNote ? <p className="mb-4 text-sm text-gray-600">{movementNote}</p> : null}
      <CreateRecordForm
        title="Reservar"
        description="A reserva reduz disponibilidade no servidor."
        submitLabel="Reservar"
        mapError={mapInventoryErrorToMessage}
        onSubmit={async (idempotencyKey) => {
          const reservation = await reserveStock({
            unitId: unitId.trim(),
            warehouseId: warehouseId.trim(),
            inventoryItemId: itemId.trim(),
            quantity: quantity.trim(),
            idempotencyKey,
          });
          setReservationId(reservation.id);
          setReservationNote(`Reserva ${reservation.id} criada (quantidade ${reservation.quantity}).`);
          const reservedWarehouseId = warehouseId.trim();
          const reservedItemId = itemId.trim();
          if (activeWarehouseId === reservedWarehouseId && activeItemId === reservedItemId) {
            await reload();
          } else {
            setActiveWarehouseId(reservedWarehouseId);
            setActiveItemId(reservedItemId);
          }
        }}
      >
        <Field label="Quantidade a reservar" htmlFor="reserve-qty" required className="md:col-span-2">
          <Input id="reserve-qty" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </Field>
      </CreateRecordForm>
      {reservationNote ? <p className="mb-4 text-sm text-gray-600">{reservationNote}</p> : null}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateRecordForm
          title="Liberar reserva"
          description="A liberação devolve disponibilidade no servidor."
          submitLabel="Liberar"
          mapError={mapInventoryErrorToMessage}
          onSubmit={async () => {
            await releaseReservation(reservationId.trim());
          }}
        >
          <Field label="Reserva" htmlFor="reserve-id" required className="md:col-span-2">
            <Input
              id="reserve-id"
              value={reservationId}
              onChange={(event) => setReservationId(event.target.value)}
              required
            />
          </Field>
        </CreateRecordForm>
        <CreateRecordForm
          title="Estornar movimento"
          description="O estorno usa a chave de idempotência original no servidor."
          submitLabel="Estornar"
          mapError={mapInventoryErrorToMessage}
          onSubmit={async () => {
            await reverseStockMovement({
              unitId: unitId.trim(),
              commandIdempotencyKey: commandKey.trim(),
              reversalKey: reversalKey.trim(),
            });
          }}
        >
          <Field label="Chave original" htmlFor="rev-cmd" required>
            <Input id="rev-cmd" value={commandKey} onChange={(event) => setCommandKey(event.target.value)} required />
          </Field>
          <Field label="Chave de estorno" htmlFor="rev-key" required>
            <Input id="rev-key" value={reversalKey} onChange={(event) => setReversalKey(event.target.value)} required />
          </Field>
        </CreateRecordForm>
      </div>
      <CreateRecordForm
        title="Regra de custeio"
        description="FIFO/média permanecem indecisos. O servidor só aceita método UNDECIDED."
        submitLabel="Criar regra"
        mapError={mapInventoryErrorToMessage}
        onSubmit={async () => {
          const created = await createCostingRule({
            unitId: unitId.trim(),
            code: costingCode.trim(),
            name: costingName.trim(),
          });
          setCostingRuleId(created.id);
          if (effectiveFrom.trim() && sourceReference.trim()) {
            const version = await createCostingRuleVersion(created.id, {
              effectiveFrom: effectiveFrom.trim(),
              sourceReference: sourceReference.trim(),
            });
            setCostingVersionId(version.id);
            setCostingRowVersion(String(version.rowVersion));
            setCostingNote(`Regra ${created.id}. Método informado pelo servidor: ${version.method}`);
          } else {
            setCostingNote(`Regra ${created.id}`);
          }
        }}
      >
        <Field label="Código" htmlFor="cost-code" required>
          <Input id="cost-code" value={costingCode} onChange={(event) => setCostingCode(event.target.value)} required />
        </Field>
        <Field label="Nome" htmlFor="cost-name" required>
          <Input id="cost-name" value={costingName} onChange={(event) => setCostingName(event.target.value)} required />
        </Field>
        <Field label="Vigência (consulta/versão)" htmlFor="cost-from">
          <Input
            id="cost-from"
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </Field>
        <Field label="Referência da fonte" htmlFor="cost-src">
          <Input
            id="cost-src"
            value={sourceReference}
            onChange={(event) => setSourceReference(event.target.value)}
          />
        </Field>
      </CreateRecordForm>
      {costingNote ? <p className="mb-4 text-sm text-gray-600">{costingNote}</p> : null}
      <CreateRecordForm
        title="Publicar versão de custeio"
        description="A publicação não escolhe FIFO ou média. O método permanece o persistido pelo servidor."
        submitLabel="Publicar versão"
        mapError={mapInventoryErrorToMessage}
        onSubmit={async () => {
          await publishCostingRuleVersion(costingVersionId.trim(), {
            rowVersion: Number(costingRowVersion),
          });
        }}
      >
        <Field label="Versão" htmlFor="cost-ver" required>
          <Input
            id="cost-ver"
            value={costingVersionId}
            onChange={(event) => setCostingVersionId(event.target.value)}
            required
          />
        </Field>
        <Field label="Row version" htmlFor="cost-rv" required>
          <Input
            id="cost-rv"
            inputMode="numeric"
            value={costingRowVersion}
            onChange={(event) => setCostingRowVersion(event.target.value)}
            required
          />
        </Field>
      </CreateRecordForm>
      {costing.state.phase === 'ready' ? (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <DefinitionList
            items={[
              { label: 'Regra', value: costing.state.data.code },
              { label: 'Nome', value: costing.state.data.name },
              { label: 'Status', value: costing.state.data.status },
            ]}
          />
        </div>
      ) : null}
      {createdIds ? <p className="mb-4 text-sm text-gray-600">{createdIds}</p> : null}
      {gate}
      {!activeWarehouseId ? (
        <EmptyState title="Nenhum saldo carregado" description="Informe depósito e item para consultar o servidor." />
      ) : null}
      {state.phase === 'ready' ? (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <DefinitionList
            items={[
              { label: 'Em mãos', value: state.data.onHand },
              { label: 'Reservado', value: state.data.reserved },
              { label: 'Disponível', value: state.data.available },
            ]}
          />
          {stockReconcile.state.phase === 'ready' ? (
            <p className="mt-4 text-sm text-gray-600">
              Conciliação de quantidade informada pelo servidor:{' '}
              {stockReconcile.state.data.matches ? 'coincide' : 'não coincide'} (em mãos{' '}
              {stockReconcile.state.data.onHand}, derivado {stockReconcile.state.data.derivedOnHand}).
            </p>
          ) : null}
          {reconcile.state.phase === 'ready' ? (
            <p className="mt-4 text-sm text-gray-600">
              Conciliação de custo informada pelo servidor: {reconcile.state.data.matches ? 'coincide' : 'não coincide'} (
              {reconcile.state.data.movementCount} movimentos).
            </p>
          ) : null}
        </div>
      ) : null}
    </ModulePage>
  );
}
