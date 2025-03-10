
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'

export function checkUpdate(data: any, msgIdSet: Set<string>) {
  const errorObj: any = {}
  try {
    

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.UPDATE] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actions.UPDATE, msgIdSet)
       if(!contextRes.isValid) {
         Object.assign(errorObj, contextRes.errors)
         if ( contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
           return errorObj;
         }
       }
    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.UPDATE, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.UPDATE}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.UPDATE}: ${error.stack}`,
    }
  }
}
