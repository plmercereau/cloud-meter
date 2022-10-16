CREATE TABLE "public"."measurement" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "image_processing_id" uuid NOT NULL, "value" float8 NOT NULL, PRIMARY KEY ("id") );
CREATE EXTENSION IF NOT EXISTS pgcrypto;
