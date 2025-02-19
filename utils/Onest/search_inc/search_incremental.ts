import { ApiSequence } from '../../../constants'
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'

export function checkSearchIncremental(data: any, _msgIdSet: any) {
  const errorObj: any = {}
  try {
    logger.info(`Checking JSON structure and required fields for ${ApiSequence.INC_SEARCH} API`)

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.SEARCH_INC] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.SEARCH_INC, data)

    if (schemaValidation !== 'error') {
      Object.assign(errorObj, schemaValidation)
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(
      `Error while checking for JSON structure and required fields for ${actions.SEARCH_INC}: ${error.stack}`,
    )
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.SEARCH_INC}: ${error.stack}`,
    }
  }
}
