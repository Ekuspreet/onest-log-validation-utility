import { DOMAIN, VERSION } from './constants'

export const onestOnSelectSchema = {
  $id: 'onestOnSelectSchema',
  type: 'object',
  additionalProperties: false,
  properties: {
    additionalProperties: false,
    context: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: DOMAIN,
        },
        action: {
          type: 'string',
          const: 'on_select',
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
        bpp_id: {
          type: 'string',
        },
        bpp_uri: {
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
        },
      },
      required: [
        'domain',
        'action',
        'version',
        'bap_id',
        'bap_uri',
        'bpp_id',
        'bpp_uri',
        'transaction_id',
        'message_id',
        'location',
        'timestamp',
        'ttl',
      ],
    },
    message: {
      type: 'object',
      additionalProperties: false,
      properties: {
        order: {
          type: 'object',
          additionalProperties: false,
          properties: {
            provider: {
              type: 'object',
              additionalProperties: false,
              properties: { id: { type: 'string' } },
              required: ['id'],
            },
            fulfillments: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['id', 'type'],
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: { type: 'string' },
                  fulfillment_ids: { type: 'array', items: { type: 'string' } },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        descriptor: {
                          type: 'object',
                          additionalProperties: false,
                          properties: { code: { type: 'string' } },
                          required: ['code'],
                        },
                        list: {
                          type: 'array',
                          items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                              code: { type: 'string' },
                              value: { type: 'string' },
                            },
                            required: ['code', 'value'],
                          },
                        },
                      },
                      required: ['descriptor', 'list'],
                    },
                  },
                },
                required: ['id', 'fulfillment_ids', 'tags'],
              },
            },
            quote: {
              type: 'object',
              additionalProperties: false,
              properties: {
                price: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    currency: { type: 'string' },
                    value: { type: 'string' },
                  },
                  required: ['currency', 'value'],
                },
                breakup: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      item: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                          id: { type: 'string' },
                          price: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                              currency: { type: 'string' },
                              value: { type: 'string' },
                            },
                            required: ['currency', 'value'],
                          },
                          title: { type: 'string' },
                        },
                        required: ['id', 'price', 'title'],
                      },
                    },
                    required: ['item'],
                  },
                },
                ttl: { type: 'string' },
              },
              required: ['price', 'breakup', 'ttl'],
            },
          },
          required: ['provider', 'fulfillments', 'items', 'quote'],
        },
      },
      required: ['order'],
    },
  },
  required: ['context', 'message'],
}
