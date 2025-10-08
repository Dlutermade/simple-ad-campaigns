import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/singlestore/driver';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '@db/schema';

export const DRIZZLE_PROVIDER = Symbol('DRIZZLE_PROVIDER');

export type DrizzleProviderType = NodePgDatabase<typeof sc>;

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: DRIZZLE_PROVIDER,
      useFactory(configService: ConfigService) {
        const dbUrl = configService.get<string>('DATABASE_URL');
        return drizzle({ url: dbUrl });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE_PROVIDER],
})
export class DrizzleModule {}
