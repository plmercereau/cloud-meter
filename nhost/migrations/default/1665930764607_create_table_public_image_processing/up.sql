CREATE TABLE "public"."image_processing" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "image_id" uuid NOT NULL, "status" integer NOT NULL, "message" text, PRIMARY KEY ("id") );
CREATE EXTENSION IF NOT EXISTS pgcrypto;
