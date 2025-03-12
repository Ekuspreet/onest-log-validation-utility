
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'
import { FULFILLMENT_STATE, STATUS } from '../../../schema/Onest/constants'
export function checkOnUpdate(data: any, msgIdSet: Set<string>, actionCall: string) {
  const errorObj: any = {}
  try {


    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_UPDATE] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actions.ON_UPDATE, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_UPDATE, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    const on_update = data;
    const order_id = getValue(`order_id`);

    if (_.isEqual(order_id, on_update.message.order.id)) {
      errorObj[`invalid_order_id_error`] = `order id provided here is invalid and should match with confirm call.`
      return Object.keys(errorObj).length > 0 && errorObj
    }

    if (actionCall === actions.ON_UPDATE_UNSOLICITED) {
      if (on_update.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.OFFER_EXTENDED) {
        if (!(on_update.message.order.status === STATUS.ACTIVE)) {
        errorObj[`invalid_status_error`] = `Status in ${actions.ON_UPDATE} for ${FULFILLMENT_STATE.OFFER_EXTENDED} must be ${STATUS.ACTIVE}.`
        }
      }
    }

    if (actionCall === actions.ON_UPDATE) {
      if ((on_update.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_ACCEPTED) || (on_update.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_REJECTED)) {
        if (!(on_update.message.order.status === STATUS.COMPLETED)) {
          errorObj[`invalid_status_error`] = `Status in ${actions.ON_UPDATE} for ${FULFILLMENT_STATE.APPLICATION_REJECTED} must be ${STATUS.COMPLETED}.`
        }
      }
    }

    setValue(`${actionCall}`, data)
    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_UPDATE}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_UPDATE}: ${error.stack}`,
    }
  }
}
