// Sample Context
// "context": {
//     "domain": "ONDC:ONEST10",
//     "action": "search",
//     "version": "2.0.0",
//     "bap_id": "worker-hub.bap.io",
//     "bap_uri": "https://worker-hub.bap.io/",
    // "transaction_id": "a9aaecca-10b7-4d19-b640-b047a7c62195",
//     "message_id": "$89bdae17-9942-40c8-869a-5bd413356407",
//     "location": {
//       "city": {
//         "code": "std:080"
//       },
//       "country": {
//         "code": "IND"
//       }
//     },
//     "timestamp": "2022-10-11T09:55:41.161Z",
//     "ttl": "PT30S" : done
//   }

import { ONEST_CONTEXT_TTL } from "constants/onest";
import _ from "lodash";
import { getValue } from "shared/dao";

// This function performs all the context checks on API calls of ONEST.
export const checkOnestContext = (context: {
  transaction_id: string;
  message_id: string;
  action: string;
  ttl: string;
  timestamp: string,
}, action: string): {
  isValid: boolean,
  errors?: any
} => {
  if (!context) return { isValid: false , errors : { missingContext : `Context for ${action} is missing.` }}
  // Object to store the validationResult.
  const validationResult: any = {}
  validationResult.isValid = false;

  // Transaction Id should exist!
  if(_.isEmpty(context.transaction_id)) validationResult.errors.idError =  `transaction_id should always exist`
  // Transaction Id should be consistent
  if(!(context.transaction_id === getValue(`transaction_id_${context.transaction_id}`))) validationResult.errors.idError = "transaction_id does not match or is invalid."
  // Transaction Id cant be equal to message Id.
  if (context.transaction_id === context.message_id) validationResult.errors.idError = "transaction_id and message id can't be same"
  // Message Id Check
  if(!_.startsWith("on", context.action) ){
  }
  // Invalid action
  if (context.action != action) validationResult.errors.invalidAction = `context.action should be ${action}`
  
  // TTL is mandatory in action calls, but optional in on_action calls.
  if(!_.startsWith("on", context.action) ){
    if(!context.ttl) validationResult.errors.ttlError = "TTL must be present for action calls."
    if(context.ttl && !(context.ttl == ONEST_CONTEXT_TTL)) validationResult.errors.ttlError = `ttl = ${ONEST_CONTEXT_TTL} as per the API Contract`
  }
  if (_.isEmpty(validationResult.errors)) validationResult.isValid = true;
  return validationResult
}
