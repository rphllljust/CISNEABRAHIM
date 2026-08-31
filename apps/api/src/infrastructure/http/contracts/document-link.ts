import { assertRecordBody, parseRequiredStringField } from './body-parsers';

export type LinkDocumentInput = {
  documentId: string;
  linkPurpose: string;
};

export function parseLinkDocumentInput(body: unknown): LinkDocumentInput {
  const record = assertRecordBody(body);
  return {
    documentId: parseRequiredStringField(record, 'documentId'),
    linkPurpose: parseRequiredStringField(record, 'linkPurpose'),
  };
}

export type DocumentLinkResponse = {
  id: string;
  documentId: string;
  linkPurpose: string;
  createdAt: string;
};

export type DocumentLinkRowLike = {
  id: string;
  document_id: string;
  link_purpose: string;
  created_at: string;
};

export function toDocumentLinkResponse(row: DocumentLinkRowLike): DocumentLinkResponse {
  return {
    id: row.id,
    documentId: row.document_id,
    linkPurpose: row.link_purpose,
    createdAt: row.created_at,
  };
}