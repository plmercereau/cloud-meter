// TODO move into something like @nhost/functions-utils
export type FileRecord = {
  id: string
  created_at: string
  updated_at: string
  size: number
  is_uploaded: boolean
  uploaded_by_user_id: string
  bucket_id: string
  name: string
  mime_type: string
  etag: string
}
