import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeORMConfig : TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOSTNAME,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: true,
    // timezone: 'local',
}
