import { Request, Response } from 'express'
import { GraphQLClient } from 'graphql-request'
import axios from 'axios'
import FormData from 'form-data'

import { EventPayload, FileRecord, getSdk } from './_utils'

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

  const client = new GraphQLClient(
    `${process.env.NHOST_BACKEND_URL}/v1/graphql`,
    {
      headers: {
        'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET!
      }
    }
  )
  const sdk = getSdk(client)
  const { id: fileId, created_at: time } = req.body.event.data.new

  // * Get the image from the Nhost storage
  const { data: file } = await axios.get(
    `${process.env.NHOST_BACKEND_URL}/v1/storage/files/${fileId}`,
    {
      responseType: 'stream',
      headers: {
        'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET
      }
    }
  )

  var data = new FormData()
  data.append('apikey', process.env.OCR_SPACE_API_KEY)
  data.append('language', 'eng')
  data.append('OCREngine', '2')
  data.append('filetype', 'jpg')
  data.append('detectOrientation', 'false')
  data.append('isOverlayRequired', 'true')
  data.append('detectCheckbox', 'false')
  data.append('checkboxTemplate', '0 ')
  data.append('IsCreateSearchablePDF', 'false')
  data.append('isSearchablePdfHideTextLayer', 'false')
  data.append('isTable', 'false')
  data.append('scale', 'true')
  data.append('file', file)
  try {
    const {
      data: {
        ParsedResults: [{ ParsedText }]
      }
    } = await axios.post(
      'https://api.ocr.space/parse/image?OCREngine=2&filetype=jpg',
      data,
      {
        headers: {
          apikey: process.env.OCR_SPACE_API_KEY,
          ...data.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    const stringValue: string = ParsedText.split('\n')[0].replace(/[^\d]/g, '')

    // TODO explain the followwing lines
    if (stringValue.length <= 6) {
      await sdk.insertImageProcessing({
        fileId,
        status: 10,
        message: `incorrect number of digits: ${stringValue}`
      })
    } else {
      const value = parseFloat(
        stringValue.slice(0, 5) + '.' + stringValue.slice(5)
      )
      console.log('Value is', value)
      const { result } = await sdk.insertImageProcessing({
        fileId,
        status: 0,
        message: ParsedText
      })
      const imageProcessingId = result!.id
      const { lastMeasurement } = await sdk.lastMeasurement()
      await sdk.insertMeasurement({
        // * the previous value can be higher than the current one when we didn't get the last digit
        value: Math.max(lastMeasurement?.[0].value || 0, value),
        imageProcessingId,
        time
      })
    }
  } catch (e) {
    const error = e as Error
    await sdk.insertImageProcessing({
      fileId,
      status: 1,
      message: error.message
    })
  }
  return res.status(200).json('OK')
}
