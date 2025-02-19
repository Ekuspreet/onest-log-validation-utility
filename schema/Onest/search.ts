import { DOMAIN, VERSION } from './constants'

export const onestSearchSchema = {
  $id: 'onestSearchSchema',
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
          const: 'search',
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
        'bpp_id',
        'bpp_uri',
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
        intent: {
          type: 'object',
          properties: {
            payment: {
              type: 'object',
              properties: {
                descriptor: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'string',
                      const: 'NP_FEES',
                    },
                  },
                },
                list: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        enum: [
                          'ID',
                          'COMMERCIAL_TYPE',
                          'COMMERCIAL_VALUE',
                          'COMMERCIAL_NAME',
                          'COMMERCIAL_TRIGGERING_STATE',
                          'COMPENSATION_TYPE',
                          'COMPENSATION_TRANSFER_PERIOD',
                          'COMPENSATION_PERCENTAGE_SPLIT',
                        ],
                      },
                      value: {
                        type: 'string',
                      },
                    },
                    required: ['code', 'value'],
                  },
                },
              },
              required: ['descriptor', 'list'],
            },
            item: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          descriptor: {
                            type: 'object',
                            properties: {
                              code: { type: 'string' },
                            },
                            required: ['code'],
                          },
                        },
                        required: ['descriptor'],
                      },
                      {
                        type: 'object',
                        properties: {
                          tags: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                descriptor: {
                                  type: 'object',
                                  properties: {
                                    code: { enum: ['JOB_DETAILS'] },
                                  },
                                  required: ['code'],
                                },
                                list: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      descriptor: {
                                        type: 'object',
                                        properties: {
                                          code: {
                                            enum: ['INDUSTRY_TYPE'],
                                          },
                                        },
                                        required: ['code'],
                                      },
                                      value: { type: 'string' },
                                    },
                                    required: ['descriptor', 'value'],
                                  },
                                },
                              },
                              required: ['descriptor', 'list'],
                            },
                          },
                        },
                        required: ['tags'],
                      },
                    ],
                  },
                },
              },
            },
            provider: {
              type: 'object',
              properties: {
                locations: {
                  type: 'array',
                  items: {
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
                      state: {
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
                    required: ['city', 'state', 'country'],
                  },
                },
              },
              required: [],
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  descriptor: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',

                        enum: ['BAP_TERMS'],
                      },
                    },
                    required: ['code'],
                  },
                  list: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        descriptor: {
                          type: 'object',
                          properties: {
                            code: {
                              type: 'string',
                              enum: ['STATIC_TERMS', 'STATIC_TERMS_NEW', 'EFFECTIVE_DATE'],
                            },
                          },
                          required: ['code'],
                        },
                        value: { type: 'string' },
                      },
                      required: ['descriptor', 'value'],
                    },
                    minItems: 1,
                  },
                },
                required: ['descriptor', 'list'],
              },
              minItems: 1,
            },
          },
          required: ['payment', 'tags'],
        },
      },
      required: ['intent'],
    },
  },
  required: ['context', 'message'],
}
