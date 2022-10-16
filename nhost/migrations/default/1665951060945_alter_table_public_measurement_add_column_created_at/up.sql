alter table "public"."measurement" add column "created_at" timestamptz
 null default now();
