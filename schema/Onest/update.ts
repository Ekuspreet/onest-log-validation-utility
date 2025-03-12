import { DOMAIN, VERSION } from "./constants";

export const onestUpdateSchema = {
	$id: "onestUpdateSchema",
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
					const: "update",
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
					type: "string",
				},
				bpp_uri: {
					type: "string",
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
				update_target: {
					type: "string",
				},
				order: {
					type: "object",
					properties: {
						id: {
							type: "string",
						},
						fulfillments: {
							type: "array",
							items: {
								type: "object",
								properties: {
									state: {
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
										},
										required: ["descriptor"],
									},
									id: {
										type: "string",
									},
								},
								required: ["id", "state"],
							},
						},
					},
					required: ["id", "fulfillments"],
				},
			},
			required: ["order", "update_target"],
		},
	},
	required: ["context", "message"],
};
