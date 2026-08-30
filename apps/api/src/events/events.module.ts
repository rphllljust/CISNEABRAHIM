import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { DomainEventsRepository } from './repositories/domain-events.repository';
import { DomainEventsRecorderService } from './services/domain-events-recorder.service';

@Module({
  imports: [DatabaseModule],
  providers: [DomainEventsRepository, DomainEventsRecorderService],
  exports: [DomainEventsRepository, DomainEventsRecorderService],
})
export class EventsModule {}
