import { Module } from '@nestjs/common';
import { CampaignModule } from './Campaign/campaign.module';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './libs/drizzle.module';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DrizzleModule,
    CampaignModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
