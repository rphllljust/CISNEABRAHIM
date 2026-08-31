import { HttpStatus } from '@nestjs/common';

export function mapValidationCodeToStatus(code: string): HttpStatus {
  switch (code) {
    case 'TAX_ID_INVALID':
    case 'LEGAL_NAME_REQUIRED':
    case 'CONTACT_REQUIRED':
    case 'CONTACT_NOT_USABLE':
    case 'VERSION_INVALID':
    case 'DEACTIVATION_REASON_REQUIRED':
      return HttpStatus.BAD_REQUEST;
    default:
      return HttpStatus.BAD_REQUEST;
  }
}