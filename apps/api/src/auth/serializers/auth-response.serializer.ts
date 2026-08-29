export type SessionView = {
  id: string;
  expiresAt: string;
  status: 'active';
};

export type AuthTokenResponseV1 = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  session: SessionView;
};

export type CurrentSessionResponseV1 = {
  identityId: string;
  session: SessionView;
};

export function toAuthTokenResponse(input: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  sessionExpiresAt: string;
}): AuthTokenResponseV1 {
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    tokenType: 'Bearer',
    expiresIn: input.expiresIn,
    session: {
      id: input.sessionId,
      expiresAt: input.sessionExpiresAt,
      status: 'active',
    },
  };
}

export function toCurrentSessionResponse(input: {
  identityId: string;
  sessionId: string;
  sessionExpiresAt: string;
}): CurrentSessionResponseV1 {
  return {
    identityId: input.identityId,
    session: {
      id: input.sessionId,
      expiresAt: input.sessionExpiresAt,
      status: 'active',
    },
  };
}
