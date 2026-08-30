import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { SearchExceptionFilter } from '../errors/search-exception.filter';
import { SearchAccessService } from '../services/search-access.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
@UseFilters(SearchExceptionFilter)
export class SearchController {
  constructor(private readonly accessService: SearchAccessService) {}

  @Get()
  search(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('q') q?: string,
    @Query('types') types?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('serviceDefinitionId') serviceDefinitionId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.accessService.search(
      { identityId: auth.sub, sessionId: auth.sid },
      { q, types, status, clientId, serviceDefinitionId, from, to, limit, offset },
    );
  }
}
