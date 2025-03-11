
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import _ from 'lodash'
import { getValue, setValue } from '../../../shared/dao'
import {
  FULFILLMENT_STATE
} from '../../../schema/Onest/constants'

export function checkOnInit(data: any, msgIdSet: Set<string>, actionCall: string) {
  const errorObj: any = {}
  try {

    const init = getValue(`${actions.INIT}`)
    if(!init){
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_INIT] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actionCall, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }
    }
    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_INIT, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    const onInit = data;
    const onSelectQuote = getValue(`${actions.ON_SELECT}`).message.order.quote;
   
    try {

      // Check provider equality
      if (!_.isEqual(onInit.message.order.provider, init.message.order.provider)) {
        errorObj[`incorrect_provider_error`] = `Provider ${onInit.message.order.provider.id} does not match with selected provider.`;
        return Object.keys(errorObj).length > 0 && errorObj;
      }

      //  item.id must be a valid item for that provider
      // Currently this flag is being used for ITEM.
      let hasIdMismatch = false;
      onInit.message.order.items.forEach((item: any) => {
        const initItem = init.message.order.items.find((initItem: any) => initItem.id === item.id)
        if (!initItem) {
          errorObj[`invalid_item_error`] = `Item with id ${item.id} does not exist in items in Init.`;
          hasIdMismatch = true;
          return;
        }
        const toMatch = [`fulfillment_ids`, `tags`];
        toMatch.forEach((feild: string) => {
          if (!_.isEqual(item[feild], initItem[feild])) {
            errorObj[`${feild}_mismatch_error_${item.id}`] = `${feild} in on_init for item ${item.id}, do not match with init.`;
          }
        })
      })

      // Checking for the Quote Trail.
      if (!_.isEqual(onInit.message.order.quote, onSelectQuote)) {
        errorObj[`quote_mismatch_error`] = `Quote in on_init does not match with quote trail.`;
      }

      // Checking for the payments object
      if (!_.isEqual(onInit.message.order.payments, init.message.order.payments)) {
        errorObj[`payments_mismatch_error`] = `Payments in on_init must match to the payments in init.`;
      }
      // Now using the hasIdMismatch FLAG for FULFILLMENTS Now.

      onInit.message.order.fulfillments.forEach((fulfillment: any) => {
        const initFulfillment = init.message.order.fulfillments.find((initFulfillment: any) => initFulfillment.id === fulfillment.id)
        if (!initFulfillment) {
          errorObj[`invalid_fulfillment_error`] = `Fulfillment with id ${fulfillment.id} does not exist in Fulfillments in Init.`;
          hasIdMismatch = true;
          return;
        }
        const toMatch = [`type`, `customer.contact`, `customer.person.name`, `customer.person.gender`, `customer.person.age`, `customer.person.skills`, `customer.person.languages`, 'customer.person.creds'];

        toMatch.forEach((field: string) => {
          if (!_.isEqual(_.get(fulfillment, field), _.get(initFulfillment, field))) {
            errorObj[`${field}_mismatch_error_${fulfillment.id}`] = `${field} in on_init for fulfillment ${fulfillment.id} does not match with init.`;
          }
        });

        if (actionCall === actions.ON_INIT && !(fulfillment.state?.descriptor?.code as string === FULFILLMENT_STATE.APPLICATION_IN_PROGRESS)) {
          errorObj[`incorrect_fulfillment_state_error`] = `the correct fulfillment State in ${actionCall} should be ${FULFILLMENT_STATE.APPLICATION_IN_PROGRESS}`;
        }
        if (actionCall === actions.ON_INIT_XINPUT && !(fulfillment.state?.descriptor?.code as string === FULFILLMENT_STATE.APPLICATION_FILLED)) {
          errorObj[`incorrect_fulfillment_state_error`] = `the correct fulfillment State in ${actionCall} should be ${FULFILLMENT_STATE.APPLICATION_FILLED}`;
        }

        if(!(fulfillment.state.updated_at === onInit.context.timestamp)){
          errorObj[`incorrect_updated_timestamp_error`] = `the correct updated_at in ${actionCall} should be context.timestamp.`;
        }
      })

      if (hasIdMismatch) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }
      setValue(`${actionCall}`, data);
    } catch (error: any) {
      logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_INIT}: ${error.stack}`)
      return {
        error: `Error while checking for JSON structure and required fields for ${actions.ON_INIT}: ${error.stack}`,
      }
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_INIT}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_INIT}: ${error.stack}`,
    }
  }
}
