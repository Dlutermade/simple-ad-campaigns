CREATE TYPE "public"."service_status" AS ENUM('Active', 'Paused', 'Deleted');--> statement-breakpoint
CREATE TABLE "ad_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text NOT NULL,
	"budget" integer NOT NULL,
	"status" "service_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_set_id" uuid NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"status" "service_status" NOT NULL,
	"creative" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"budget" integer NOT NULL,
	"status" "service_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_ad_set_id_ad_sets_id_fk" FOREIGN KEY ("ad_set_id") REFERENCES "public"."ad_sets"("id") ON DELETE cascade ON UPDATE no action;