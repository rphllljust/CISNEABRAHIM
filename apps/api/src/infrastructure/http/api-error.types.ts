export type ApiErrorBody = {
  code: string;
  message: string;
  correlationId?: string;
};

export type ApiErrorResponse = {
  error: ApiErrorBody;
};