import { Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { BACKGROUND_JOB_KINDS } from '../domain/background-job-kind';
import type { BackgroundJobHandler, JobHandlerContext } from '../domain/job-handler.types';
import { PermanentJobError } from '../domain/job-errors';

@Injectable()
export class NotificationDispatchJobHandler implements BackgroundJobHandler {
  readonly jobKind = BACKGROUND_JOB_KINDS.Notification;
  private readonly logger = new Logger(NotificationDispatchJobHandler.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async handle(context: JobHandlerContext): Promise<void> {
    const notificationIntentId = context.payload['notificationIntentId'];
    if (typeof notificationIntentId !== 'string' || notificationIntentId.length === 0) {
      throw new PermanentJobError('NOTIFICATION_INTENT_ID_REQUIRED');
    }

    const pool = this.requirePool();
    const result = await pool.query(
      `UPDATE evt.notification_intents
       SET status = 'DISPATCHED'
       WHERE id = $1::uuid AND status = 'PENDING'`,
      [notificationIntentId],
    );
    if ((result.rowCount ?? 0) === 0) {
      const existing = await pool.query<{ status: string }>(
        `SELECT status FROM evt.notification_intents WHERE id = $1::uuid`,
        [notificationIntentId],
      );
      if (existing.rows[0]?.status === 'DISPATCHED') {
        this.logger.log(`Notification intent already dispatched id=${notificationIntentId}`);
        return;
      }
      throw new PermanentJobError('NOTIFICATION_INTENT_NOT_FOUND_OR_NOT_PENDING');
    }
    this.logger.log(`Notification intent dispatched id=${notificationIntentId}`);
  }

  private requirePool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new PermanentJobError('DATABASE_NOT_CONFIGURED');
    }
    return connection.pool;
  }
}
