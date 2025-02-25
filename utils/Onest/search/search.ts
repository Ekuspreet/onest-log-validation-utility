import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../../index'
import { checkOnestContext } from '../common'
// import { setValue } from '../../../shared/dao'
import _ from 'lodash'

export function checkSearch(data: any, msgIdSet: any) {
  const errorObj: any = {}
  try {
    logger.info(`Checking JSON structure and required fields for ${actions.SEARCH} API`)

    if (!data || isObjectEmpty(data)) {
      console.log("Search Is Empty");
      return { missing_data: 'JSON cannot be empty' }
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missing_feilds'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }

    const skipErrors = [
      "missing_context",
      "domain_missing",
      "version_missing",
      "transaction_id_missing",
      "message_id_missing",
      "action_missing",
      "bap_uri_missing",
      "bap_id_missing",
      "transaction_id_error",
      "transaction_id_mismatch_error",
      "message_id_mismatch_error",
      "invalid_action_error",
      "ttl_mismatch_error"
    ];
    
    const contextRes: any = checkOnestContext(data.context, actions.SEARCH, msgIdSet)
    if(!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if ( contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.SEARCH, data)
    console.log("From Search", schemaValidation);
    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.SEARCH}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.SEARCH}: ${error.stack}`,
    }
  }
}
