import { actions, ONEST_CONTEXT_TTL } from "../../constants/onest";
import _ from "lodash";
import { getValue, setValue } from "../../shared/dao";

// Message Id Map
const messageIdMap = {
  [actions.ON_SEARCH]: actions.SEARCH,
  [actions.ON_SEARCH_INC]: actions.SEARCH_INC,
  [actions.ON_SELECT]: actions.SELECT,
  [actions.ON_INIT]: actions.INIT,
  [actions.ON_INIT_XINPUT]: undefined, // No direct base action
  [actions.ON_CONFIRM]: actions.CONFIRM,
  [actions.ON_STATUS]: actions.STATUS,
  [actions.ON_UPDATE]: actions.UPDATE,
  [actions.ON_UPDATE_UNSOLICITED]: undefined, // No direct base action
};


// This function performs all the context checks on API calls of ONEST.
export const checkOnestContext = (context: {
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
}, action: string, msgIdSet: any): {
  isValid: boolean;
  errors?: Record<string, string>;
} => {
  if (!context) {
    return {
      isValid: false,
      errors: { missingContext: `context for ${action} is missing.` }
    };
  }

  const validationResult: { isValid: boolean; errors: Record<string, string> } = { isValid: false, errors: {} };

  // Generic missing field checker
  function checkMissingField(field: keyof typeof context, errorKey: string): boolean {
    if (!context[field]) {
      validationResult.errors[errorKey] = `${field} is missing.`;
      return true;
    }
    return false;
  }

  // Check for missing fields first
  ["domain", "version", "transaction_id", "message_id", "action", "bap_uri", "bap_id"]
    .forEach(field => checkMissingField(field as keyof typeof context, `${field}Missing`));

  // Domain check
  if (!_.isEqual(context.domain, getValue("domain"))) {
    validationResult.errors.flowError = "Invalid domain in context.";
  }

  // Version check
  if (!_.isEqual(context.version, getValue("version"))) {
    validationResult.errors.versionError = "Invalid version in context.";
  }

  // Transaction ID checks
  if(!_.isEmpty(context.transaction_id)) {
    if (context.transaction_id === context.message_id) {
      validationResult.errors.idError = "Transaction ID and message ID can't be the same.";
    }
    if (action === actions.SEARCH){
      setValue("transaction_id", context.transaction_id)
    }else{
      if (context.transaction_id !== getValue(`transaction_id`)) {
        validationResult.errors.idError = "Transaction ID does not match or is invalid.";
      }
    }
  }

  //  Message Id Check
  if (!_.startsWith(context.action, "on")){
    if(msgIdSet.has(context.message_id)) {
      validationResult.errors.idError = "Duplicate Message Ids Not Allowed"
    }else{
      msgIdSet.add(context.message_id);
    }
  }else{
    if(messageIdMap[action]){
      if(!_.isEqual(context.message_id, getValue(messageIdMap[action]))){
        validationResult.errors.idError = `Message Id Mismatch. Id for ${action} should be equal to Id of ${messageIdMap[action]}`
      }
    }
  }
  setValue(`${action}_message_id`, context.message_id)
  
  // Action check
  if (context.action !== action) {
    validationResult.errors.invalidAction = `context.action should be ${action}.`;
  }

  // URI and ID checks
  if (!isIdExistInUri(context.bap_uri, context.bap_id)) {
    validationResult.errors.bapError = "BAP URI and ID don't match.";
  }
  if (action !== actions.SEARCH && context.bpp_uri && context.bpp_id && !isIdExistInUri(context.bpp_uri, context.bpp_id)) {
    validationResult.errors.bppError = "BPP URI and ID don't match.";
  }

  // TTL check (mandatory for action calls, optional for on_action calls)
  if (!_.startsWith(context.action, "on")) {
    if (checkMissingField("ttl", "ttlError")) {
      validationResult.errors.ttlError = "TTL must be present for action calls.";
    } else if (context.ttl !== ONEST_CONTEXT_TTL) {
      validationResult.errors.ttlError = `TTL must be ${ONEST_CONTEXT_TTL} as per API contract.`;
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
