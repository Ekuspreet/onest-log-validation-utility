import { DOMAIN, VERSION } from "./constants";

export const onestSearchIncSchema = {
	$id: "onestSearchIncSchema",
	type: "object",
	additionalProperties: false,
	properties: {
		context: {
			additionalProperties: false,
			type: "object",
			properties: {
				domain: {
					type: "string",
					enum: DOMAIN,
				},
				action: {
					type: "string",
					const: "search",
				},
				version: {
					type: "string",
					const: VERSION,
				},
				bap_id: {
					type: "string",
				},
				bap_uri: {
					type: "string",
				},
				bpp_id: {
					type: 'string',
				  },
				  bpp_uri: {
					type: 'string',
				  },
				transaction_id: {
					type: "string",
				},
				message_id: {
					type: "string",
				},
				location: {
					type: "object",
					properties: {
						city: {
							type: "object",
							properties: {
								code: {
									type: "string",
									const: "*"
								},
							},
							required: ["code"],
						},
						country: {
							type: "object",
							properties: {
								code: {
									type: "string",
								},
							},
							required: ["code"],
						},
					},
					required: ["city", "country"],
				},
				timestamp: {
					type: "string",
					format: "date-time",
				},
				ttl: {
					type: "string",
					const: "PT30S",
				},
			},
			required: [
				"domain",
				"location",
				"action",
				"version",
				"bap_id",
				"bap_uri",
				"bpp_id",
				"bpp_uri",
				"transaction_id",
				"message_id",
				"timestamp",
				"ttl",
			],
		},
		message: {
			additionalProperties: false,
			type: "object",
			properties: {
				intent: {
					type: "object",
					properties: {
						payment: {
							type: "object",
							properties: {
								descriptor: {
									type: "object",
									properties: {
										code: {
											type: "string",
										},
									},
									required: ["code"],
								},
								list: {
									type: "array",
									items: {
										type: "object",
										properties: {
											code: {
												type: "string",
											},
											value: {
												type: "string",
											},
										},
										required: ["code", "value"],
									},
								},
							},
							required: ["descriptor", "list"],
						},
						tags: {
							type: "array",
							items: {
								type: "object",
								properties: {
									descriptor: {
										type: "object",
										properties: {
											code: {
												type: "string",
												const: "CATALOG_INC",
											},
										},
										required: ["code"],
									},
									list: {
										type: "array",
										items: {
											type: "object",
											properties: {
												descriptor: {
													type: "object",
													properties: {
														code: {
															type: "string",
															const: "MODE",
														},
													},
													required: ["code"],
												},
												value: {
													type: "string",
													enum: ["start", "stop"],
												},
											},
											required: ["descriptor", "value"],
										},
									},
								},
								required: ["descriptor", "list"],
							},
						},
					},
					required: ["payment", "tags"],
				},
			},
			required: ["intent"],
		},
	},
	required: ["context", "message"],
};
