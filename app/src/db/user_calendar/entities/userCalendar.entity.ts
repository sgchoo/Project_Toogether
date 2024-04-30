import { Calendar } from "src/calendar/entities/calendar.entity";
import { User } from "src/db/user/entities/user.entity";
import { Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_calendar')
export class UserCalendar {
    @PrimaryGeneratedColumn('uuid')
    userCalendarId: string;
    
    @OneToOne(() => User, user => user.userCalendars)
    @JoinColumn({ name: 'userId'})
    user: User

    @OneToMany(() => Calendar, calendar => calendar.author )
    @JoinColumn({ name: 'userCalendars'})
    groupCalendar: Calendar[];
}
