import { DOMAIN, VERSION } from './constants'

export const onestStatusSchema = {
  $id: 'onestStatusSchema',
  type: 'object',
  additionalProperties: false,

  properties: {
    context: {
      additionalProperties: false,

      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: DOMAIN,
        },
        action: {
          type: 'string',
          const: 'status',
        },
        version: {
          type: 'string',
          const: VERSION,
        },
        bap_id: {
          type: 'string',
        },
        bap_uri: {
          type: 'string',
        },
        transaction_id: {
          type: 'string',
        },
        message_id: {
          type: 'string',
        },
        location: {
          type: 'object',
          properties: {
            city: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
              },
              required: ['code'],
            },
            country: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
              },
              required: ['code'],
            },
          },
          required: ['city', 'country'],
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
        ttl: {
          type: 'string',
          const: 'PT30S',
        },
      },
      required: [
        'domain',
        'location',
        'action',
        'version',
        'bap_id',
        'bap_uri',
        'transaction_id',
        'message_id',
        'timestamp',
        'ttl',
      ],
    },
    message: {
      additionalProperties: false,
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
        },
      },
      required: ['order_id'],
    },
  },
  required: ['context', 'message'],
}
