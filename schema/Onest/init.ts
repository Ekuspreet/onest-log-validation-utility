import { DOMAIN, JOBS_TYPE, PAYMENTS, VERSION } from './constants'

export const onestInitSchema = {
  $id: 'onestInitSchema',
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
          const: 'init',
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
      additionalProperties: false,
      type: 'object',
      properties: {
        order: {
          type: 'object',
          properties: {
            provider: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
              },
              required: ['id'],
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
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
                            code: {
                              type: 'string',
                            },
                            name: {
                              type: 'string',
                            },
                          },
                          required: ['code'],
                        },
                        list: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              code: {
                                type: 'string',
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
                  },
                },
                required: ['id', 'fulfillment_ids', 'tags'],
              },
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
                  customer: {
                    type: 'object',
                    properties: {
                      person: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                          },
                          gender: {
                            type: 'string',
                          },
                          age: {
                            type: 'string',
                          },
                          skills: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: {
                                  type: 'string',
                                },
                              },
                              required: ['name'],
                            },
                          },
                          languages: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: {
                                  type: 'string',
                                },
                              },
                              required: ['name'],
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
                                    code: {
                                      type: 'string',
                                    },
                                    name: {
                                      type: 'string',
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
                                          },
                                          name: {
                                            type: 'string',
                                          },
                                        },
                                        required: ['code'],
                                      },
                                      value: {
                                        type: 'string',
                                      },
                                    },
                                    required: ['descriptor', 'value'],
                                  },
                                },
                              },
                              required: ['descriptor', 'list'],
                            },
                          },
                        },
                        required: ['name', 'gender', 'age', 'skills', 'languages', 'tags'],
                      },
                      contact: {
                        type: 'object',
                        properties: {
                          phone: {
                            type: 'string',
                          },
                          email: {
                            type: 'string',
                          },
                        },
                        required: ['phone', 'email'],
                      },
                    },
                    required: ['person', 'contact'],
                  },
                },
                required: ['id', 'type', 'customer'],
              },
            },
            payments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    const: PAYMENTS['status'][0],
                  },
                  type: {
                    type: 'string',
                    enum: PAYMENTS['order_status'],
                  },
                  collected_by: {
                    type: 'string',
                    enum: PAYMENTS['collected_by'],
                  },
                  tags: {
                    type: 'object',
                    properties: {
                      descriptor: {
                        type: 'object',
                        properties: {
                          code: {
                            type: 'string',
                            enum: ['SETTLEMENT_DETAILS'], // Adjust based on valid codes
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
                                  enum: [
                                    'SETTLEMENT_COUNTERPARTY',
                                    'SETTLEMENT_BANK_ACCOUNT_NO',
                                    'SETTLEMENT_IFSC_CODE',
                                    'BENEFICIARY_NAME',
                                    'BANK_NAME',
                                    'BRANCH_NAME',
                                  ],
                                },
                              },
                              required: ['code'],
                            },
                            value: {
                              type: 'string',
                            },
                          },
                          required: ['descriptor', 'value'],
                        },
                      },
                    },
                    required: ['descriptor', 'list'],
                  },
                },
                required: ['status', 'type', 'collected_by', 'tags'],
              },
            },
          },
          required: ['provider', 'items', 'fulfillments', 'payments'],
        },
      },
      required: ['order'],
    },
  },
  required: ['context', 'message'],
}
