import { Module } from '@nestjs/common';
import { AdModule } from './Ad/ad.module';
import { AdSetModule } from './AdSet/ad-set.module';
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
    AdModule,
    AdSetModule,
    CampaignModule,
    DrizzleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
