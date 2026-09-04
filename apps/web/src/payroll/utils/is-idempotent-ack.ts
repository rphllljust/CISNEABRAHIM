/**
 * Reconhece uma resposta 200 de registro de evento que o servidor marcou como
 * idempotente (`idempotent: true`): o evento já havia sido registrado para a
 * mesma chave e nenhuma duplicata foi criada. Aceita PayrollEventResponse
 * (que expõe a flag idempotent) ou qualquer payload com a mesma flag.
 */
export function isIdempotentAck(response: { idempotent?: boolean } | null | undefined): boolean {
  return Boolean(response && response.idempotent === true);
}
