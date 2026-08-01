import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PatientsModule } from './patients/patients.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { VisitsModule } from './visits/visits.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { LabOrdersModule } from './lab-orders/lab-orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { VitalsModule } from './vitals/vitals.module';
import { ServicesModule } from './services/services.module';
import { DiagnosisCodesModule } from './diagnosis-codes/diagnosis-codes.module';
import { QueueDisplayModule } from './queue-display/queue-display.module';
import { BookingModule } from './booking/booking.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [ ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule, PatientsModule, SchedulesModule, AppointmentsModule, VisitsModule, PrescriptionsModule, LabOrdersModule, InvoicesModule, VitalsModule, ServicesModule, DiagnosisCodesModule, QueueDisplayModule, BookingModule, AnalyticsModule],
  
})
export class AppModule {}
