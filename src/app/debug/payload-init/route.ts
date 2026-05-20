import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export const GET = async () => {
  try {
    const payload = await getPayload({
      config: configPromise,
    })

    return Response.json({
      collections: Object.keys(payload.config.collections),
      ok: true,
    })
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        ok: false,
      },
      {
        status: 500,
      },
    )
  }
}
