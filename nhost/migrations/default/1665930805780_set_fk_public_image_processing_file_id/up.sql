alter table "public"."image_processing"
  add constraint "image_processing_file_id_fkey"
  foreign key ("file_id")
  references "storage"."files"
  ("id") on update restrict on delete restrict;
