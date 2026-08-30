import { Injectable } from '@nestjs/common';
import {
  buildStructuredLogEntry,
  serializeStructuredLog,
  type StructuredLogInput,
} from './structured-log';

@Injectable()
export class StructuredLoggerService {
  write(input: StructuredLogInput): void {
    const entry = buildStructuredLogEntry(input);
    const line = serializeStructuredLog(entry);
    if (input.level === 'error') {
      console.error(line);
      return;
    }
    if (input.level === 'warn') {
      console.warn(line);
      return;
    }
    console.log(line);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.write({ level: 'info', message, metadata });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.write({ level: 'warn', message, metadata });
  }

  error(message: string, errorCode?: string, metadata?: Record<string, unknown>): void {
    this.write({
      level: 'error',
      message,
      errorCode,
      result: 'failure',
      metadata,
    });
  }

  operation(input: StructuredLogInput): void {
    this.write(input);
  }
}
