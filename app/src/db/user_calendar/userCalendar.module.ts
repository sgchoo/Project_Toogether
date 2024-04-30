import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCalendar } from './entities/userCalendar.entity';
import { UserCalendarService } from './userCalendar.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserCalendar])
  ],
  providers: [UserCalendarService],
  exports: [UserCalendarService]

})
export class UserCalendarModule {}
