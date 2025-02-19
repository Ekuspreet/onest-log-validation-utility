import { ApiSequence } from '../../../constants'
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'

export function checkOnSelect(data: any) {
  const errorObj: any = {}
  try {
    logger.info(`Checking JSON structure and required fields for ${ApiSequence.ON_SELECT} API`)

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_SELECT] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_SELECT, data)

    if (schemaValidation !== 'error') {
      Object.assign(errorObj, schemaValidation)
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_SELECT}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_SELECT}: ${error.stack}`,
    }
  }
}
