
import { actions, onestFlows } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'
import { FULFILLMENT_STATE, STATUS } from '../../../schema/Onest/constants'

export function checkOnStatus(data: any, msgIdSet: Set<string>, flow: string, actionCall: string) {
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
    const contextRes: any = checkOnestContext(data.context, actions.ON_STATUS, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return errorObj;
      }
    }
    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_STATUS, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    const on_status = data;
    const order_id = getValue(`order_id`);
    if (_.isEqual(order_id, on_status.message.order.id)) {
      errorObj[`invalid_order_id_error`] = `order id provided here is invalid and should match with confirm call.`
      return Object.keys(errorObj).length > 0 && errorObj
    }
    // Flow 2
    if (
      flow === onestFlows.flowTwo &&
      (on_status.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_ACCEPTED ||
        on_status.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.ASSESSMENT_IN_PROGRESS)
    ) {
      if (!(on_status.message.order.status === STATUS.ACTIVE)) {
        const currentFulfillmentState = on_status.message.order.fulfillments[0].state.descriptor.code;
        errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} for fulfillment state ${currentFulfillmentState} must be ${STATUS.ACTIVE}.`;
      }
    }
    // Flow 3
    if (flow === onestFlows.flowTwo && on_status.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_REJECTED) {
      if (!(on_status.message.order.status === STATUS.COMPLETED)) {
        errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} for ${FULFILLMENT_STATE.APPLICATION_REJECTED} must be ${STATUS.COMPLETED}.`
      }
    }
    
    setValue(`${actionCall}`, data)
    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_STATUS}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_STATUS}: ${error.stack}`,
    }
  }
}
