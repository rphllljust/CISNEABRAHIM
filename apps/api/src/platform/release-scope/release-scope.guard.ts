import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { isReleaseModuleEnabled } from './feature-flags';
import { matchGatedApiPath } from './release-1-scope';
import { ReleaseScopeHttpException } from './release-scope.http.exception';

type RequestWithUrl = {
  url?: string;
  raw?: { url?: string };
};

@Injectable()
export class ReleaseScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUrl>();
    const rawUrl = request.url ?? request.raw?.url ?? '';
    const moduleId = matchGatedApiPath(rawUrl);
    if (!moduleId) {
      return true;
    }
    if (isReleaseModuleEnabled(moduleId)) {
      return true;
    }
    throw new ReleaseScopeHttpException(moduleId);
  }
}
