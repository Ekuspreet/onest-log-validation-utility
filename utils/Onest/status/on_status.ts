
import { actions, onestFlows } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, comparePayments, paymentTagsTwo, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'
import { FULFILLMENT_STATE, STATUS } from '../../../schema/Onest/constants'

export function checkOnStatus(data: any, msgIdSet: Set<string>, flow: string, actionCall: keyof typeof actions) {
  const errorObj: any = {}
  try {
    // Skips
    if(actionCall === actions.ON_STATUS_EXTENDED && (!data || isObjectEmpty(data))){
      return
    }
    if (!data || isObjectEmpty(data)) {
      errorObj['missing_data'] = 'JSON cannot be empty'
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actionCall, msgIdSet)
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


    const onConfirm = getValue(`${actions.ON_CONFIRM}`)
    if (!onConfirm) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }



    const latestFulfillment = getValue("latest_fulfillment");

    if (latestFulfillment === FULFILLMENT_STATE.APPLICATION_ACCEPTED && actionCall === actions.ON_STATUS_ACCEPTED) {
      errorObj[`unnecessary_call`] = `Since the offer is already accepted in ${actions.ON_CONFIRM}, This call is not needed for the flow.`
      return
    }
    
    if (actionCall === actions.ON_STATUS_ASSESSMENT && !(latestFulfillment === FULFILLMENT_STATE.APPLICATION_ACCEPTED)) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }
    if (actionCall === actions.ON_STATUS_REJECTED && !(latestFulfillment === FULFILLMENT_STATE.APPLICATION_ACCEPTED)) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    // Fulfillment state check
    if (actionCall === actions.ON_STATUS_ACCEPTED && !_.isEqual(data.message.order.fulfillments[0].state.descriptor.code, FULFILLMENT_STATE.APPLICATION_ACCEPTED)) {
      errorObj.invalid_fulfillment_state = `fulfillment state in ${actions.ON_STATUS_ACCEPTED} should be ${FULFILLMENT_STATE.APPLICATION_ACCEPTED}`
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    if (actionCall === actions.ON_STATUS_ASSESSMENT && !_.isEqual(data.message.order.fulfillments[0].state.descriptor.code, FULFILLMENT_STATE.ASSESSMENT_IN_PROGRESS)) {
      errorObj.invalid_fulfillment_state = `fulfillment state in ${actions.ON_STATUS_ASSESSMENT} should be ${FULFILLMENT_STATE.ASSESSMENT_IN_PROGRESS}`
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    if (actionCall === actions.ON_STATUS_REJECTED && !_.isEqual(data.message.order.fulfillments[0].state.descriptor.code, FULFILLMENT_STATE.APPLICATION_REJECTED)) {
      errorObj.invalid_fulfillment_state = `fulfillment state in ${actions.ON_STATUS_REJECTED} should be ${FULFILLMENT_STATE.APPLICATION_REJECTED}`
      return Object.keys(errorObj).length > 0 && errorObj;
    }


    const onStatus = data;
    const order_id = getValue(`order_id`);
    if (!_.isEqual(order_id, onStatus.message.order.id)) {
      errorObj[`invalid_order_id_error`] = `order id provided here is invalid and should match with confirm call.`
      return Object.keys(errorObj).length > 0 && errorObj
    }
    // Fulfillment Status Checks
    // Flow 2
    if (
      flow === onestFlows.flowTwo &&
      (onStatus.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_ACCEPTED ||
        onStatus.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.ASSESSMENT_IN_PROGRESS)
    ) {
      if (!(onStatus.message.order.status === STATUS.ACTIVE)) {
        const currentFulfillmentState = onStatus.message.order.fulfillments[0].state.descriptor.code;
        errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} for fulfillment state ${currentFulfillmentState} must be ${STATUS.ACTIVE}.`;
      }
    }
    // Flow 3
    if (flow === onestFlows.flowThree && onStatus.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_REJECTED) {
      if (!(onStatus.message.order.status === STATUS.COMPLETED)) {
        errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} for ${FULFILLMENT_STATE.APPLICATION_REJECTED} must be ${STATUS.COMPLETED}.`
      }
    }

    const provider = getValue(`provider`);
    if (!_.isEqual(onStatus.message.order.provider, provider)) {
      errorObj[`incorrect_provider_error`] = `Provider ${onStatus.message.order.provider.id} does not match with selected provider.`;
    }
    let hasIdMismatch = false;
    onStatus.message.order.items.forEach((item: any) => {
      // Find corresponding item in onConfirm
      const onConfirmItem = onConfirm.message.order.items.find((c_item: any) => c_item.id === item.id);
      if (!onConfirmItem) {
        errorObj[`invalid_item_error_${item.id}`] = `Item with id ${item.id} does not exist in ${actions.ON_CONFIRM}.`;
        hasIdMismatch = true;
        return;
      }

      // Check fulfillment_ids (Strict Match)
      if (!_.isEqual(item.fulfillment_ids.sort(), onConfirmItem.fulfillment_ids.sort())) {
        errorObj[`fulfillment_ids_mismatch_error_${item.id}`] = `fulfillment_ids in ${actionCall} for item ${item.id} do not match.`;
      }

      // Check for tags equality.
      if (!_.isEqual(item?.tags, onConfirm?.tags)) {
        errorObj[`tags_mismatch_${item.id}`] = `tags in ${actionCall} for item ${item.id} do not match.`;
      }


    });
    if (hasIdMismatch) {
      return Object.keys(errorObj).length > 0 && errorObj
    }
    // Compare Quote
    if (!_.isEqual(onStatus.message.order.quote, onConfirm.message.order.quote)) {
      errorObj[`quote_mismatch_error`] = `Quote in ${actions.ON_STATUS} does not match with ${actions.ON_CONFIRM}.`;
    }


    // Compare Fulfillments
    onStatus.message.order.fulfillments.forEach((fulfillment: any) => {
      const confirmFulfillment = onConfirm.message.order.fulfillments.find((c_fulfillment: any) => c_fulfillment.id === fulfillment.id);
      if (!confirmFulfillment) {
        errorObj[`invalid_fulfillment_error_${fulfillment.id}`] = `Fulfillment with id ${fulfillment.id} does not exist in ${actions.ON_CONFIRM}.`;
        hasIdMismatch = true;
        return;
      }
      const toMatch = [`type`];

      toMatch.forEach((field: string) => {
        if (!_.isEqual(_.get(fulfillment, field), _.get(confirmFulfillment, field))) {
          errorObj[`${field}_mismatch_error_${fulfillment.id}`] = `${field} in ${actions.ON_STATUS} for fulfillment ${fulfillment.id} does not match with ${actions.ON_CONFIRM}.`;
        }
      });

      // Validate updated_at timestamp
      if (!(fulfillment.state.updated_at === onStatus.context.timestamp)) {
        errorObj[`incorrect_updated_timestamp_error_${fulfillment.id}`] = `The correct updated_at in ${actions.ON_STATUS} should be context.timestamp.`;
      }
      setValue(`latest_fulfillment`, fulfillment.state.descriptor.code)
    });

     comparePayments(onStatus.message.order.payments[0],
            onConfirm.message.order.payments[0],
            actionCall,
            actions.ON_CONFIRM,
            errorObj,
            paymentTagsTwo,
            ["collected_by", "type","params.currency", "params.transaction_id", "params.amount"]
          )
          
    setValue(`${actionCall}`, data)
    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actionCall}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actionCall}: ${error.stack}`,
    }
  }
}
