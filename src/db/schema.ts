import { relations } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';

export const serviceStatus = t.pgEnum('service_status', [
  'Active',
  'Paused',
  'Deleted',
]);

export const campaignsTable = t.pgTable('campaigns', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  name: t.text('name').notNull(),
  budget: t.integer('budget').notNull(),
  status: serviceStatus('status').notNull(),
  createdAt: t
    .timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  version: t.integer('version').default(1).notNull(),
});

export const campaignsRelations = relations(campaignsTable, ({ many }) => ({
  adSets: many(adSetsTable),
}));

export const adSetsTable = t.pgTable('ad_sets', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  campaignId: t
    .uuid('campaign_id')
    .notNull()
    .references(() => campaignsTable.id, { onDelete: 'cascade' }),
  name: t.text('name').notNull(),
  budget: t.integer('budget').notNull(),
  status: serviceStatus('status').notNull(),
});

export const adSetsRelations = relations(adSetsTable, ({ one, many }) => ({
  campaign: one(campaignsTable, {
    fields: [adSetsTable.campaignId],
    references: [campaignsTable.id],
  }),
  ads: many(adsTable),
}));

export const adsTable = t.pgTable('ads', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  adSetId: t
    .uuid('ad_set_id')
    .notNull()
    .references(() => adSetsTable.id, { onDelete: 'cascade' }),
  name: t.text('name').notNull(),
  content: t.text('content').notNull(),
  status: serviceStatus('status').notNull(),
  creative: t.text('creative').notNull(),
});

export const adsRelations = relations(adsTable, ({ one }) => ({
  adSet: one(adSetsTable, {
    fields: [adsTable.adSetId],
    references: [adSetsTable.id],
  }),
}));
