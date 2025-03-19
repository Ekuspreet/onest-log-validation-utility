
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, comparePayments, paymentTagsTwo, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'
import { FULFILLMENT_STATE, STATUS } from '../../../schema/Onest/constants'
export function checkOnUpdate(data: any, msgIdSet: Set<string>, actionCall: string) {
  const errorObj: any = {}
  try {

    const latestFulfillment = getValue("latest_fulfillment");
    // Previous calls exist error
    if (actionCall === actions.ON_UPDATE_EXTENDED && !(latestFulfillment === FULFILLMENT_STATE.ASSESSMENT_IN_PROGRESS)) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    if (actionCall === actions.ON_UPDATE) {
      const update = getValue(`${actions.UPDATE}`)
      if (!update) {
        errorObj.critical_error = `errors need to be resolved in previous calls first.`
        return Object.keys(errorObj).length > 0 && errorObj;
      }
    }

    // Fulfillment state check
    if (actionCall === actions.ON_UPDATE_EXTENDED && !_.isEqual(data.message.order.fulfillments[0].state.descriptor.code, FULFILLMENT_STATE.OFFER_EXTENDED)) {
      errorObj.invalid_fulfillment_state = `fulfillment state in ${actions.ON_UPDATE_EXTENDED} should be ${FULFILLMENT_STATE.OFFER_EXTENDED}`
      return Object.keys(errorObj).length > 0 && errorObj;
    }
    if (actionCall === actions.ON_UPDATE && !_.isEqual(data.message.order.fulfillments[0].state.descriptor.code, FULFILLMENT_STATE.OFFER_ACCEPTED)) {
      errorObj.invalid_fulfillment_state = `fulfillment state in ${actions.ON_UPDATE} should be ${FULFILLMENT_STATE.OFFER_ACCEPTED}`
      return Object.keys(errorObj).length > 0 && errorObj;
    }


    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_UPDATE] = 'JSON cannot be empty'
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
        return errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_UPDATE, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    const onUpdate = data;
    const onConfirm = getValue(`${actions.ON_CONFIRM}`)
    const order_id = getValue(`order_id`);

    if (!_.isEqual(order_id, onUpdate.message.order.id)) {
      errorObj[`invalid_order_id_error`] = `order id provided here is invalid and should match with confirm call.`
      return Object.keys(errorObj).length > 0 && errorObj
    }

    if (actionCall === actions.ON_UPDATE_EXTENDED) {
      if (onUpdate.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.OFFER_EXTENDED) {
        if (!(onUpdate.message.order.status === STATUS.ACTIVE)) {
          errorObj[`invalid_status_error`] = `Status in ${actions.ON_UPDATE} for ${FULFILLMENT_STATE.OFFER_EXTENDED} must be ${STATUS.ACTIVE}.`
        }
      }
    }

    if (actionCall === actions.ON_UPDATE) {
      if ((onUpdate.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_ACCEPTED) || (onUpdate.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_REJECTED)) {
        if (!(onUpdate.message.order.status === STATUS.COMPLETED)) {
          errorObj[`invalid_status_error`] = `Status in ${actions.ON_UPDATE} for ${FULFILLMENT_STATE.APPLICATION_REJECTED} must be ${STATUS.COMPLETED}.`
        }
      }
    }

    const provider = getValue(`provider`);
    if (!_.isEqual(onUpdate.message.order.provider, provider)) {
      errorObj[`incorrect_provider_error`] = `Provider ${onUpdate.message.order.provider.id} does not match with selected provider.`;
    }


    comparePayments(onUpdate.message.order.payments[0],
      onConfirm.message.order.payments[0],
      actionCall,
      actions.ON_CONFIRM,
      errorObj,
      paymentTagsTwo,
      ["collected_by", "type","params.currency", "params.transaction_id", "params.amount"]
    )


    let hasIdMismatch = false;
    onUpdate.message.order.items.forEach((item: any) => {
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

    hasIdMismatch = false;
    onUpdate.message.order.fulfillments.forEach((fulfillment: any) => {
      const confirmFulfillment = onConfirm.message.order.fulfillments.find((c_fulfillment: any) => c_fulfillment.id === fulfillment.id);
      if (!confirmFulfillment) {
        errorObj[`invalid_fulfillment_error_${fulfillment.id}`] = `Fulfillment with id ${fulfillment.id} does not exist in ${actions.ON_CONFIRM}.`;
        hasIdMismatch = true;
        return;
      }
      const toMatch = [`type`];

      toMatch.forEach((field: string) => {
        if (!_.isEqual(_.get(fulfillment, field), _.get(confirmFulfillment, field))) {
          errorObj[`${field}_mismatch_error_${fulfillment.id}`] = `${field} in ${actionCall} for fulfillment ${fulfillment.id} does not match with ${actions.ON_CONFIRM}.`;
        }
      });
      // Validate updated_at timestamp
      if (!(fulfillment.state.updated_at === onUpdate.context.timestamp)) {
        errorObj[`incorrect_updated_timestamp_error_${fulfillment.id}`] = `The correct updated_at in ${actionCall} should be context.timestamp.`;
      }
      setValue(`latest_fulfillment`, fulfillment.state.descriptor.code)
    });
    if (hasIdMismatch) {
      return Object.keys(errorObj).length > 0 && errorObj
    }


    // Quote match
    if (!_.isEqual(onUpdate.message.order.quote, onConfirm.message.order.quote)) {
      errorObj[`quote_mismatch_error`] = `Quote in ${actions.ON_CONFIRM} does not match with quote trail.`;
    }

    // updated_at 
    // if (!(onUpdate.order.updated_at === onUpdate.context.timestamp)) {
    //   errorObj[`incorrect_updated_timestamp_error`] = `The correct updated_at in ${actionCall} should be context.timestamp.`;
    // }
    // Ensure order.updated_at is <= context.timestamp
if (!(_.get(onUpdate.order, "updated_at") <= _.get(onUpdate, "context.timestamp"))) {
  errorObj[`incorrect_updated_timestamp_error`] = `The updated_at in ${actionCall} should be less than or equal to context.timestamp.`;
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
