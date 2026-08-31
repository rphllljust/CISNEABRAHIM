import { HttpStatus, Injectable } from '@nestjs/common';
import { OperationalLaborTypesRepository } from '../../resources/repositories/operational-labor-types.repository';
import { PhysicalResourceTypesRepository } from '../../resources/repositories/physical-resource-types.repository';
import { normalizeUnitCode } from '../domain/unit-of-measure';
import { CATALOG_ERROR_CODES } from '../errors/catalog-error-codes';
import { CatalogHttpException } from '../errors/catalog-http.exception';
import { UnitsOfMeasureRepository } from '../repositories/units-of-measure.repository';

@Injectable()
export class ServiceCatalogReferenceValidationService {
  constructor(
    private readonly unitsRepository: UnitsOfMeasureRepository,
    private readonly resourceTypesRepository: PhysicalResourceTypesRepository,
    private readonly laborTypesRepository: OperationalLaborTypesRepository,
  ) {}

  async assertActiveUnitReferences(unitCodes: string[], defaultUnitCode?: string | null): Promise<void> {
    const normalizedDefault = defaultUnitCode ? normalizeUnitCode(defaultUnitCode) : undefined;
    const validation = await this.unitsRepository.validateUnitReferences(
      unitCodes.map((code) => normalizeUnitCode(code)),
      normalizedDefault,
      true,
    );
    if (validation === 'INVALID_UNIT') {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.INVALID_UNIT,
        'One or more unit codes are not registered in the catalog.',
      );
    }
    if (validation === 'INACTIVE_UNIT') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INACTIVE_UNIT,
        'One or more unit codes are inactive.',
      );
    }
  }

  async assertActiveResourceTypeReferences(typeCodes: string[]): Promise<void> {
    const validation = await this.resourceTypesRepository.validateTypeReferences(typeCodes, true);
    if (validation === 'INVALID_TYPE') {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.INVALID_RESOURCE_TYPE,
        'One or more resource type codes are not registered in the catalog.',
      );
    }
    if (validation === 'INACTIVE_TYPE') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INACTIVE_RESOURCE_TYPE,
        'One or more resource type codes are inactive.',
      );
    }
  }

  async assertActiveLaborTypeReferences(typeCodes: string[]): Promise<void> {
    const validation = await this.laborTypesRepository.validateTypeReferences(typeCodes, true);
    if (validation === 'INVALID_TYPE') {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.INVALID_LABOR_TYPE,
        'One or more labor type codes are not registered in the catalog.',
      );
    }
    if (validation === 'INACTIVE_TYPE') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INACTIVE_LABOR_TYPE,
        'One or more labor type codes are inactive.',
      );
    }
  }
}
