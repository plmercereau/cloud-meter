// TODO move into something like @nhost/functions-utils and/or @nhost/hasura-utils
export type EventPayload<
  T extends {},
  U extends 'INSERT' | 'UPDATE' | 'DELETE' | 'UNKNOWN' = 'UNKNOWN'
> = {
  event: {
    op: U
    data: {
      old: U extends 'UNKNOWN' ? T | null : U extends 'INSERT' ? null : T
      new: U extends 'UNKNOWN' ? T | null : U extends 'DELETE' ? null : T
    }
    trace_context: {
      trace_id: string
      span_id: string
    }
  }
  created_at: string //'2022-10-16T14:43:49.644Z'
  id: string //'2c173942-a860-4a4c-ab71-9a29e2384d54'
  delivery_info: {
    max_retries: number
    current_retry: number
  }
  trigger: {
    name: string
  }
  table: {
    schema: string
    name: string
  }
}
