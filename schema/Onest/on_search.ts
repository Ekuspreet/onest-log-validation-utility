import { DOMAIN, JOBS_TYPE, VERSION } from './constants'

export const onestOnSearchSchema = {
  $id: 'onestOnSearchSchema',
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
        action: {
          type: 'string',
          const: 'on_search',
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
        catalog: {
          type: 'object',
          properties: {
            descriptor: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
              required: ['name'],
            },
            providers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                  },
                  descriptor: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                      short_desc: {
                        type: 'string',
                      },
                      images: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            url: {
                              type: 'string',
                            },
                          },
                          required: ['url'],
                        },
                      },
                    },
                    required: ['name', 'short_desc', 'images'],
                  },
                  fulfillments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                        },
                        type: {
                          type: 'string',
                          enum: JOBS_TYPE,
                        },
                      },
                      required: ['id', 'type'],
                    },
                  },
                  locations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                        },
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
                          additionalProperties: false,
                        },
                      },
                      required: ['id', 'city', 'state'],
                      
                    },
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                        },
                        category_ids: {
                          type: 'array',
                          items: {
                            type: 'string',
                          },
                          minItems: 1,
                          uniqueItems: true,
                        },
                        descriptor: {
                          type: 'object',
                          properties: {
                            name: {
                              type: 'string',
                            },
                            long_desc: {
                              type: 'string',
                            },
                            media: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  mimetype: {
                                    type: 'string',
                                  },
                                  url: {
                                    type: 'string',
                                  },
                                },
                                required: ['mimetype', 'url'],
                              },
                            },
                          },
                          required: ['name', 'long_desc', 'media'],
                        },
                        quantity: {
                          type: 'object',
                          properties: {
                            available: {
                              type: 'object',
                              properties: {
                                count: {
                                  type: 'integer',
                                },
                              },
                              required: ['count'],
                            },
                          },
                          required: ['available'],
                        },
                        time: {
                          type: 'object',
                          properties: {
                            label: {
                              type: 'string',
                              enum: ['enable', 'disable'],
                            },
                            timestamp: {
                              type: 'string',
                              format: 'date-time',
                            },
                            range: {
                              type: 'object',
                              properties: {
                                start: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                                end: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                              },
                              required: ['start', 'end'],
                            },
                          },
                          required: ['range', 'label', 'timestamp'],
                        },
                        creator: {
                          type: 'object',
                          additionalProperties: false,
                          properties: {
                            descriptor: {
                              type: 'object',
                              properties: {
                                name: { type: 'string' },
                                code: { type: 'string' },
                                short_desc: { type: 'string' },
                                long_desc: { type: 'string' },
                                media: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      mimetype: { type: 'string' },
                                      url: { type: 'string' },
                                    },
                                    required: ['mimetype', 'url'],
                                  },
                                },
                                images: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      url: { type: 'string' },
                                    },
                                    required: ['url'],
                                  },
                                },
                              },
                              required: ['name', 'code', 'short_desc', 'long_desc'],
                            },
                            address: { type: 'string' },
                            state: {
                              type: 'object',
                              properties: {
                                code: { type: 'string' },
                              },
                              required: ['code'],
                            },
                            city: {
                              type: 'object',
                              properties: {
                                code: { type: 'string' },
                              },
                              required: ['code'],
                            },
                            contact: {
                              type: 'object',
                              properties: {
                                phone: { type: 'string' },
                                email: { type: 'string', format: 'email' },
                              },
                              required: ['phone', 'email'],
                            },
                          },
                          required: ['descriptor', 'address', 'state', 'city', 'contact'],
                        },
                        location_ids: {
                          type: 'array',
                          items: {
                            type: 'string',
                          },
                        },
                        fulfillment_ids: {
                          type: 'array',
                          items: {
                            type: 'string',
                          },
                        },
                        tags: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              descriptor: {
                                type: 'object',
                                properties: {
                                  code: { type: 'string' },
                                },
                                required: ['code'],
                              },
                              list: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  oneOf: [
                                    {
                                      properties: {
                                        descriptor: {
                                          type: 'object',
                                          properties: {
                                            code: { type: 'string' },
                                          },
                                          required: ['code'],
                                        },
                                        value: { type: 'string' },
                                      },
                                      required: ['descriptor', 'value'],
                                    },
                                    {
                                      properties: {
                                        code: { type: 'string' },
                                        value: { type: 'string' },
                                      },
                                      required: ['code', 'value'],
                                    },
                                  ],
                                },
                              },
                            },
                            required: ['descriptor', 'list'],
                          },
                        },
                        price: {
                          type: 'object',
                          properties: {
                            currency: {
                              type: 'string',
                            },
                            value: {
                              type: 'string',
                            },
                            maximum_value: {
                              type: 'string',
                            },
                          },
                          required: ['currency', 'value'],
                        },
                      },
                      required: [
                        'id',
                        'category_ids',
                        'descriptor',
                        'quantity',
                        'location_ids',
                        'fulfillment_ids',
                        'price',
                        'creator',
                      ],
                    },
                  },
                },
                required: ['id', 'descriptor', 'fulfillments', 'locations', 'items'],
              },
            },
          },
          required: ['descriptor', 'providers'],
        },
      },
      required: ['catalog'],
    },
  },
  required: ['context', 'message'],
}
