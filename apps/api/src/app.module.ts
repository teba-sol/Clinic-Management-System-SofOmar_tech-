import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PatientsModule } from './patients/patients.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppointmentsModule } from './appointments/appointments.module';


@Module({
  imports: [ ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule, 
    AuthModule, PatientsModule, SchedulesModule, AppointmentsModule],
  
})
export class AppModule {}
