import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import _ from 'lodash'
import { setValue, getValue } from '../../../shared/dao'

export function checkInit(data: any, msgIdSet: Set<string>) {
  const errorObj: any = {}
  try {
    

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.INIT] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actions.ON_SEARCH_INC, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return errorObj;
      }
    }
    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.INIT, data)

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

    } catch (error: any) {
      logger.error(`Error in checking context for ${actions.SEARCH}: ${error.stack}`)
    }

    try {
      logger.info(`Checking for buyer app finder fee amount for ${actions.SEARCH}`)
      const buyerFF = parseFloat(data.message.intent?.payment?.['@ondc/org/buyer_app_finder_fee_amount'])

      if (!isNaN(buyerFF)) {
        setValue(`${actions.SEARCH}_buyerFF`, buyerFF)
      } else {
        errorObj['payment'] = 'payment should have a key @ondc/org/buyer_app_finder_fee_amount'
      }
    } catch (error: any) {
      logger.error(`Error in checking buyer app finder fee amount: ${error.stack}`)
    }

    // try {
    //   logger.info(`Checking for fulfillment/end/location/gps for ${actions.SEARCH}`)
    //   const fulfillment = data.message.intent && data.message.intent?.fulfillment
    //   if (fulfillment && fulfillment.end) {
    //     const gps = fulfillment.end?.location?.gps
    //     if (gps) {
    //       if (!checkGpsPrecision(gps)) {
    //         errorObj['gpsPrecision'] =
    //           'fulfillment/end/location/gps coordinates must be specified with at least six decimal places of precision.'
    //       }
    //     } else {
    //       errorObj['fulfillmentLocation'] = 'fulfillment/end/location should have a required property gps'
    //     }
    //   }
    // } catch (error: any) {
    //   logger.error(`Error in checking fulfillment/end/location/gps: ${error.stack}`)
    // }

    // try {
    //   logger.info(`Checking for item and category in /message/intent for ${actions.SEARCH} API`)
    //   if (hasProperty(data.message.intent, 'item') && hasProperty(data.message.intent, 'category')) {
    //     if (!errorObj.intent) {
    //       errorObj.intent = {}
    //     }
    //     errorObj.intent.category_or_item = '/message/intent cannot have both properties item and category'
    //   }
    // } catch (error: any) {
    //   logger.error(`Error in checking item and category in /message/intent: ${error.stack}`)
    // }

    // try {
    //   logger.info(`Checking for tags in /message/intent for ${actions.SEARCH} API`)
    //   if (data.message.intent?.tags) {
    //     const tagErrors = checkTagConditions(data.message, data.context, actions.SEARCH)
    //     tagErrors?.length ? (errorObj.intent = { ...errorObj.intent, tags: tagErrors }) : null
    //   }
    // } catch (error: any) {
    //   logger.error(`Error in checking tags in /message/intent: ${error.stack}`)
    // }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.INIT}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.INIT}: ${error.stack}`,
    }
  }
}
