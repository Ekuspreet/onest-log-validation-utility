import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import {  isObjectEmpty, validateOnestSchema } from '../../index'
import { checkOnestContext } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'

export function checkSearch(data: any, msgIdSet: any) {
  const errorObj: any = {}
  try {
    logger.info(`Checking JSON structure and required fields for ${actions.SEARCH} API`)

    if (!data || isObjectEmpty(data)) {
      console.log("Search Is Empty");
      errorObj[actions.SEARCH] = 'JSON cannot be empty'
      return errorObj
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.SEARCH, data)
    console.log( "From Search" ,schemaValidation);
    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }

    try {
      logger.info(`Adding Message Id /${actions.SEARCH}`)
      msgIdSet.add(data.context.message_id)
      setValue(`${actions.SEARCH}_msgId`, data.context.message_id)
    } catch (error: any) {
      logger.error(`!!Error while checking message id for /${actions.SEARCH}, ${error.stack}`)
    }

    if (!_.isEqual(data.context.domain.split(':')[1], getValue(`domain`))) {
      errorObj[`Domain[${data.context.action}]`] = `Domain should be same in each action`
    }

    try {
      logger.info(`Checking for context in /context for ${actions.SEARCH} API`)
      const contextRes: any = checkOnestContext(data.context, actions.SEARCH, msgIdSet)
      setValue(`${actions.SEARCH}_context`, data.context)

      if (!contextRes?.valid) {
        Object.assign(errorObj, contextRes.ERRORS)
      }
    } catch (error: any) {
      logger.error(`Error in checking context for ${actions.SEARCH}: ${error.stack}`)
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.SEARCH}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.SEARCH}: ${error.stack}`,
    }
  }
}
