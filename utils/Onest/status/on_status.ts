
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'

export function checkOnStatus(data: any, msgIdSet: Set<string>, _flow: string) {
  const errorObj: any = {}
  try {
    

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_STATUS] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actions.SEARCH_INC, msgIdSet)
       if(!contextRes.isValid) {
         Object.assign(errorObj, contextRes.errors)
         if ( contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
           return errorObj;
         }
       }
    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_STATUS, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_STATUS}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_STATUS}: ${error.stack}`,
    }
  }
}
