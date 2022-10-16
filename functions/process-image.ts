import { Request, Response } from 'express'
import { GraphQLClient } from 'graphql-request'
import axios from 'axios'
import FormData from 'form-data'

// TODO move into something like @nhost/functions-utils
type FileRecord = {
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

// TODO move into something like @nhost/functions-utils and/or @nhost/hasura-utils
type EventPayload<
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

export default async (
  req: Request<{}, {}, EventPayload<FileRecord, 'INSERT'>>,
  res: Response
) => {
  const webhookSecret = req.headers['nhost-webhook-secret']
  if (
    process.env.NHOST_BACKEND_URL?.indexOf('http://localhost:1337') === -1 &&
    webhookSecret !== process.env.NHOST_WEBHOOK_SECRET
  ) {
    console.log('unauthorized attempt to run the webhook')
    return res.status(401).send('unauthorized')
  }

  // * Get the image from the Nhost storage

  const { data } = await axios.get(
    `${process.env.NHOST_BACKEND_URL}/v1/storage/files/${req.body.event.data.new.id}`,
    {
      headers: {
        'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET
      }
    }
  )
  var form = new FormData()
  form.append('filename', 'file.jpg')
  form.append('file', data)

  try {
    const ocr = await axios.post(
      'https://api.ocr.space/parse',
      { file: form, detectOrientation: true, OCREngine: 2 },
      {
        headers: {
          apikey: process.env.OCR_SPACE_API_KEY
        }
      }
    )
    console.log(ocr.data)
  } catch (e) {
    console.log(e)
  }
  // const client = new GraphQLClient(
  //   `${process.env.NHOST_BACKEND_URL}/v1/graphql`,
  //   {
  //     headers: {
  //       'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET!
  //     }
  //   }
  // )
}
