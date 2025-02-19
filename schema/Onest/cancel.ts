import { DOMAIN, VERSION } from "./constants";

export const onestCancelSchema = {
	$id: "onestCancelSchema",
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
				version: {
					type: "string",
					const: VERSION,
				},
				action: {
					type: "string",
					const: "cancel",
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
						},
						country: {
							type: "object",
							properties: {
								code: {
									type: "string",
								},
							},
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
				},
			},
			required: [
				"domain",
				"version",
				"action",
				"bap_id",
				"bap_uri",
				"bpp_id",
				"bpp_uri",
				"transaction_id",
				"message_id",
				"location",
				"timestamp",
				"ttl",
			],
		},
		message: {
			additionalProperties: false,
			type: "object",
			properties: {
				order_id: {
					type: "string",
				},
				cancellation_reason_id: {
					type: "string",
				},
			},
			required: ["order_id", "cancellation_reason_id"],
		},
	},
	required: ["context", "message"],
};
