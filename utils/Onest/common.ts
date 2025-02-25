import { actions, ONEST_CONTEXT_TTL } from "../../constants/onest";
import _ from "lodash";
import { getValue, setValue } from "../../shared/dao";

// Message ID Map
const messageIdMap = {
  [actions.ON_SEARCH]: actions.SEARCH,
  [actions.ON_SEARCH_INC]: actions.SEARCH_INC,
  [actions.ON_SELECT]: actions.SELECT,
  [actions.ON_INIT]: actions.INIT,
  [actions.ON_INIT_XINPUT]: "",
  [actions.ON_CONFIRM]: actions.CONFIRM,
  [actions.ON_STATUS]: actions.STATUS,
  [actions.ON_UPDATE]: actions.UPDATE,
  [actions.ON_UPDATE_UNSOLICITED]: "",
};

// Action Map
const actionMap = {
  [actions.ON_SEARCH]: actions.ON_SEARCH,
  [actions.ON_SEARCH_INC]: actions.ON_SEARCH,
  [actions.ON_SELECT]: actions.ON_SELECT,
  [actions.ON_INIT]: actions.ON_INIT,
  [actions.ON_INIT_XINPUT]: actions.ON_INIT,
  [actions.ON_CONFIRM]: actions.ON_CONFIRM,
  [actions.ON_STATUS]: actions.ON_STATUS,
  [actions.ON_UPDATE]: actions.ON_UPDATE,
  [actions.ON_UPDATE_UNSOLICITED]: actions.ON_UPDATE,
  [actions.SEARCH]: actions.SEARCH,
  [actions.SEARCH_INC]: actions.SEARCH,
  [actions.SELECT]: actions.SELECT,
  [actions.INIT]: actions.INIT,
  [actions.CONFIRM]: actions.CONFIRM,
  [actions.STATUS]: actions.STATUS,
  [actions.UPDATE]: actions.UPDATE,
};

export const checkOnestContext = (
  context: {
    transaction_id: string;
    message_id: string;
    action: string;
    ttl?: string;
    timestamp: string;
    domain: string;
    version: string;
    bap_id: string;
    bap_uri: string;
    bpp_id?: string;
    bpp_uri?: string;
  },
  action: string,
  msgIdSet: Set<string>
): {
  isValid: boolean;
  errors?: Record<string, string>;
} => {
  if (!context) {
    return {
      isValid: false,
      errors: { missing_context: `context for ${action} is missing.` },
    };
  }

  const validationResult: { isValid: boolean; errors: Record<string, string> } = { isValid: false, errors: {} };

  function checkMissingField(field: keyof typeof context, errorKey: string): boolean {
    if (!context[field]) {
      validationResult.errors[errorKey] = `${field} is missing.`;
      return true;
    }
    return false;
  }

  // Check for missing fields
  ["domain", "version", "transaction_id", "message_id", "action", "bap_uri", "bap_id"].forEach((field) =>
    checkMissingField(field as keyof typeof context, `${_.snakeCase(field)}_missing`)
  );

  if (!validationResult.errors.domain_missing && !_.isEqual(context.domain.split(":")[1], getValue("domain"))) {
    validationResult.errors.flow_error = "Invalid domain in context.";
  }

  if (!validationResult.errors.version_missing && !_.isEqual(context.version, getValue("version"))) {
    validationResult.errors.version_error = "Invalid version in context.";
  }

  if (!validationResult.errors.transaction_id_missing) {
    if (context.transaction_id === context.message_id) {
      validationResult.errors.transaction_id_error = "Transaction ID and message ID can't be the same.";
    }
    if (action === actions.SEARCH) {
      setValue("transaction_id", context.transaction_id);
    } else if (context.transaction_id !== getValue("transaction_id")) {
      validationResult.errors.transaction_id_mismatch_error = "Transaction ID does not match or is invalid.";
    }
  }

  if (!validationResult.errors.timestamp_missing && context.action !== actions.SEARCH) {
    if (new Date(getValue("latest_ts")) > new Date(context.timestamp)) {
      validationResult.errors.time_error = "Timestamps are not in correct order.";
    }
  }
  setValue("latest_ts", context.timestamp);

  if (!validationResult.errors.message_id_missing) {
    if (!_.startsWith(context.action, "on")) {
      if (msgIdSet.has(context.message_id)) {
        validationResult.errors.duplicate_message_id_error = "Duplicate Message IDs are not allowed.";
      } else {
        msgIdSet.add(context.message_id);
      }
      setValue(`message_id_${action}`, context.message_id);
    } else {
      if (messageIdMap[action] !== "") {
        if (!_.isEqual(context.message_id, getValue(`message_id_${messageIdMap[action]}`))) {
          validationResult.errors.message_id_mismatch_error = `Message ID Mismatch. ID for ${action} should be equal to the ID of ${messageIdMap[action]}`;
        }
      }
    }
  }

  setValue(`${context.action}_message_id`, context.message_id);

  if (!validationResult.errors.action_missing && context.action !== actionMap[action]) {
    validationResult.errors.invalid_action_error = `context.action should be ${action}.`;
  }

  if (!validationResult.errors.bap_uri_missing && !validationResult.errors.bap_id_missing) {
    if (!isIdExistInUri(context.bap_uri, context.bap_id)) {
      validationResult.errors.bap_id_mismatch_error = "BAP URI and ID don't match.";
    }
  }

  if (!validationResult.errors.bpp_uri_missing && !validationResult.errors.bpp_id_missing) {
    if (action !== actions.SEARCH && context.bpp_uri && context.bpp_id && !isIdExistInUri(context.bpp_uri, context.bpp_id)) {
      validationResult.errors.bpp_id_mismatch_error = "BPP URI and ID don't match.";
    }
  }

  if (!_.startsWith(context.action, "on")) {
    if (!validationResult.errors.ttl_missing) {
      if (context.ttl !== ONEST_CONTEXT_TTL) {
        validationResult.errors.ttl_mismatch_error = `TTL must be ${ONEST_CONTEXT_TTL} as per API contract.`;
      }
    }
  }

  if (_.isEmpty(validationResult.errors)) {
    validationResult.isValid = true;
  }

  return validationResult;
};

function isIdExistInUri(uri: string, id: string): boolean {
  return uri.includes(id);
}
