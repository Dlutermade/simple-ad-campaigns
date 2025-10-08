import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@src/db/schema';

export const DRIZZLE_PROVIDER = Symbol('DRIZZLE_PROVIDER');

export type DrizzleProviderType = NodePgDatabase<typeof schema>;

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: DRIZZLE_PROVIDER,
      useFactory(configService: ConfigService) {
        const dbUrl = configService.get<string>('DATABASE_URL');
        return drizzle(dbUrl!, {
          schema: {
            ...schema,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE_PROVIDER],
})
export class DrizzleModule {}
