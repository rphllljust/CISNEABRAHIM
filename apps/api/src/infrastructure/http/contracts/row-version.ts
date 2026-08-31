import { assertRecordBody } from './body-parsers';

export function parseLenientRowVersionBody(body: unknown): { rowVersion: number } {
  const record = assertRecordBody(body);
  return { rowVersion: Number(record['rowVersion']) };
}