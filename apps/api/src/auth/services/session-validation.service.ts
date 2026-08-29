import { HttpStatus, Injectable } from '@nestjs/common';
import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import { IdentityAuthRepository } from '../repositories/identity-auth.repository';

@Injectable()
export class SessionValidationService {
  constructor(private readonly repository: IdentityAuthRepository) {}

  async assertActiveSession(identityId: string, sessionId: string): Promise<void> {
    const session = await this.repository.getSessionById(sessionId);
    if (!session || session.identity_id !== identityId || session.status !== 'active') {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.UNAUTHORIZED,
        'Session is not valid.',
      );
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.SESSION_EXPIRED,
        'Session expired.',
      );
    }

    const identityStatus = await this.repository.getIdentityStatus(identityId);
    if (identityStatus !== 'active') {
      throw new AuthHttpException(
        HttpStatus.FORBIDDEN,
        AUTH_ERROR_CODES.ACCOUNT_DISABLED,
        'Account is not active.',
      );
    }
  }
}
