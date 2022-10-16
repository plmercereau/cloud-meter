alter table "public"."image_processing" add column "created_at" timestamptz
 null default now();
