import { actions, ONEST_CONTEXT_TTL } from "../../constants/onest";
import _ from "lodash";
import { getValue, setValue } from "../../shared/dao";

export function setDifference(a: Set<any>, b: Set<any>): Array<any> {
  return [...a].filter((value) => !b.has(value));
}
// setDifference(new Set(['a','b','c']) , new Set(['b','c']))
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

  const missingFields = new Set();
  function checkMissingField(field: keyof typeof context, errorKey: string): boolean {
    if (!context[field]) {
      validationResult.errors[errorKey] = `${field} is missing.`;
      missingFields.add(field);
      return true;
    }
    return false;
  }

  let requiredFields;
  switch(action) {
    case  actions.SEARCH:
      requiredFields = ["domain", "version", "transaction_id", "message_id", "action", "bap_uri", "bap_id"]
      break;
    case actions.ON_SEARCH:
      requiredFields = ["domain", "version", "transaction_id", "message_id", "action", "bap_uri", "bap_id","bpp_uri","bpp_id"]
      break;
    default:
      requiredFields = ["domain", "version", "transaction_id", "message_id", "action", "bap_uri", "bap_id","bpp_uri","bpp_id"]
      break;
    }
  requiredFields.forEach((field) =>
    checkMissingField(field as keyof typeof context, `${_.snakeCase(field)}_missing`)
  );


  // Checks start from here.

  if(action === actions.SEARCH) {
    if (!missingFields.has("transaction_id")) {
      setValue("transaction_id", context.transaction_id);      
    }
  }else{
    if (getValue("transaction_id") === undefined) {
      validationResult.errors.transaction_id_error = "Transaction ID was missing in SEARCH and is required for subsequent calls.";
      return validationResult;
    }else{
      if (!missingFields.has("transaction_id")) {
        if(context.transaction_id !== getValue("transaction_id")){
          validationResult.errors.transaction_id_mismatch_error = "Transaction ID does not match or is invalid.";
          return validationResult;
        }
      }
    }
  }




  if (!missingFields.has("domain") && context.domain.split(":")[1] !== getValue("domain")) {
    validationResult.errors.flow_error = "Invalid domain in context.";
  }

  if (!missingFields.has("version") && context.version !== getValue("version")) {
    validationResult.errors.version_error = "Invalid version in context.";
  }



  if (!missingFields.has("timestamp") && context.action !== actions.SEARCH) {
    if (new Date(getValue("latest_ts")) > new Date(context.timestamp)) {
      validationResult.errors.time_error = "Timestamps are not in correct order.";
    }
  }
  setValue("latest_ts", context.timestamp);

  if (!missingFields.has("message_id")) {
    if (!_.startsWith(context.action, "on")) {
      if (msgIdSet.has(context.message_id)) {
        validationResult.errors.duplicate_message_id_error = "Duplicate Message IDs are not allowed.";
      } else {
        msgIdSet.add(context.message_id);
      }
      setValue(`message_id_${action}`, context.message_id);
    } else if (messageIdMap[action] && getValue(`message_id_${messageIdMap[action]}`) !== context.message_id) {
      validationResult.errors.message_id_mismatch_error = `Message ID Mismatch. ID for ${action} should be equal to the ID of ${messageIdMap[action]}`;
    }
  }

  if (!missingFields.has("action") && context.action !== actionMap[action]) {
    validationResult.errors.invalid_action_error = `context.action should be ${action}.`;
  }

  // if (!missingFields.has("bap_uri") && !missingFields.has("bap_id")) {
  //   if (!isIdExistInUri(context.bap_uri, context.bap_id)) {
  //     validationResult.errors.bap_id_mismatch_error = "BAP URI and ID don't match.";
  //   }
  // }

  // if (!missingFields.has("bpp_uri") && !missingFields.has("bpp_id")) {
  //   if (action !== actions.SEARCH && context.bpp_uri && context.bpp_id && !isIdExistInUri(context.bpp_uri, context.bpp_id)) {
  //     validationResult.errors.bpp_id_mismatch_error = "BPP URI and ID don't match.";
  //   }
  // }

  if (!_.startsWith(context.action, "on") && !missingFields.has("ttl")) {
    if (context.ttl !== ONEST_CONTEXT_TTL) {
      validationResult.errors.ttl_mismatch_error = `TTL must be ${ONEST_CONTEXT_TTL} as per API contract.`;
    }
  }

  validationResult.isValid = _.isEmpty(validationResult.errors);
  return validationResult;

};

// function isIdExistInUri(uri: string, id: string): boolean {
//   return uri.includes(id);
// }

export const skipErrors = [
      "missing_context",
      "domain_missing",
      "version_missing",
      "transaction_id_missing",
      "message_id_missing",
      "action_missing",
      "bap_uri_missing",
      "bap_id_missing",
      "bpp_uri_missing",
      "bpp_id_missing",
      "transaction_id_error",
      "transaction_id_mismatch_error",
      "message_id_mismatch_error",
      "invalid_action_error",
      "ttl_mismatch_error"
    ];