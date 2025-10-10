import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type {
  NodePgDatabase,
  NodePgTransaction,
} from 'drizzle-orm/node-postgres';
import * as schema from '@src/db/schema';
import type { ExtractTablesWithRelations } from 'drizzle-orm';

export const DRIZZLE_PROVIDER = Symbol('DRIZZLE_PROVIDER');

export type PgDatabase = NodePgDatabase<typeof schema>;

export type PgTransactionClient = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

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
