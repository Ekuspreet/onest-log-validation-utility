
import { actions, onestFlows } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, comparePayments, paymentTagsOne, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import { FULFILLMENT_STATE, STATUS } from '../../../schema/Onest/constants'
import _ from 'lodash'
// import { STATUS } from 'schema/Onest/constants'

export function checkOnConfirm(data: any, msgIdSet: Set<string>, flow: string) {
  const errorObj: any = {}
  try {
        if (flow === onestFlows.flowThree && !_.isEqual(data.message.order.fulfillments[0].state.descriptor.code, FULFILLMENT_STATE.APPLICATION_ACCEPTED)) {
          errorObj.invalid_fulfillment_state = `fulfillment state in ${actions.ON_CONFIRM} for ${flow} should be ${FULFILLMENT_STATE.APPLICATION_ACCEPTED}`
          return Object.keys(errorObj).length > 0 && errorObj;
        }
    

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_CONFIRM] = 'JSON cannot be empty'
      return
    }
    const confirm = getValue(`${actions.CONFIRM}`)
    if (!confirm) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }
    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actions.ON_CONFIRM, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_CONFIRM, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    const onConfirm = data;
    try {
      // Matching Order Id
      const order_id = getValue(`order_id`);
      // const latest_fulfillment = getValue(`latest_fulfillment`);
      if (!_.isEqual(order_id, onConfirm.message.order.id)) {
        errorObj[`invalid_order_id_error`] = `order id provided here is invalid and should match with confirm call.`
        return Object.keys(errorObj).length > 0 && errorObj
      }
      if (onConfirm.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_FILLED) {

        if (!(onConfirm.message.order.status === STATUS.CREATED)) {
          errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} must be ${STATUS.CREATED}.`
        }
      }
      if (onConfirm.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_ACCEPTED) {
        if (!(onConfirm.message.order.status === STATUS.CREATED)) {
          errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} must be ${STATUS.CREATED}.`
        }
      }
      
      const provider = getValue(`provider`);
      if (!_.isEqual(onConfirm.message.order.provider, provider)) {
        errorObj[`incorrect_provider_error`] = `Provider ${onConfirm.message.order.provider.id} does not match with selected provider.`;
      }
      let hasIdMismatch = false;
      onConfirm.message.order.items.forEach((item: any) => {
        // Find corresponding item in onConfirm
        const confirmItem = onConfirm.message.order.items.find((c_item: any) => c_item.id === item.id);
        if (!confirmItem) {
          errorObj[`invalid_item_error`] = `Item with id ${item.id} does not exist in ${actions.CONFIRM}.`;
          hasIdMismatch = true;
          return;
        }

        // Check fulfillment_ids (Strict Match)
        if (!_.isEqual(item.fulfillment_ids.sort(), confirmItem.fulfillment_ids.sort())) {
          errorObj[`fulfillment_ids_mismatch_error_${item.id}`] = `fulfillment_ids in ${actions.CONFIRM} for item ${item.id} do not match.`;
        }

        // Extract NP_FEES tags from both confirm and onConfirm
        const onConfirmNPFees = item.tags.filter((tag: any) => tag.descriptor.code === "NP_FEES");
        const confirmNPFees = confirmItem.tags.filter((tag: any) => tag.descriptor.code === "NP_FEES");

        // Compare the two arrays for strict equality
        if (!_.isEqual(onConfirmNPFees, confirmNPFees)) {
          errorObj[`np_fees_mismatch_${item.id}`] = `NP_FEES tags in ${actions.CONFIRM} for item ${item.id} do not match exactly.`;
        }
      });
      if (hasIdMismatch) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }

      // Quote match
      if (!_.isEqual(onConfirm.message.order.quote, confirm.message.order.quote)) {
        errorObj[`quote_mismatch_error`] = `Quote in ${actions.ON_CONFIRM} does not match with quote trail.`;
      }

      // Fulfillments match
      onConfirm.message.order.fulfillments.forEach((fulfillment: any) => {
        const confirmFulfillment = confirm.message.order.fulfillments.find((c_fulfillment: any) => c_fulfillment.id === fulfillment.id);

        if (!confirmFulfillment) {
          errorObj[`invalid_fulfillment_error`] = `Fulfillment with id ${fulfillment.id} does not exist in Fulfillments in ${actions.ON_CONFIRM}.`;
          hasIdMismatch = true;
          return;
        }

        const toMatch = [`type`, `customer.contact`, `customer.person.name`, `customer.person.gender`, `customer.person.age`, `customer.person.skills`, `customer.person.languages`, 'customer.person.creds'];

        toMatch.forEach((field: string) => {
          if (!_.isEqual(_.get(fulfillment, field), _.get(confirmFulfillment, field))) {
            errorObj[`${field}_mismatch_error_${fulfillment.id}`] = `${field} in ${actions.ON_CONFIRM} for fulfillment ${fulfillment.id} does not match with ${actions.CONFIRM}.`;
          }
        });
        if ([FULFILLMENT_STATE.APPLICATION_ACCEPTED, FULFILLMENT_STATE.APPLICATION_FILLED].includes(fulfillment.state.descriptor.code)) {
          setValue(`latest_fulfillment`, fulfillment.state.descriptor.code);
        }

        // Validate updated_at timestamp
        if (!(fulfillment.state.updated_at === onConfirm.context.timestamp)) {
          errorObj[`incorrect_updated_timestamp_error`] = `The correct updated_at in ${actions.ON_CONFIRM} should be context.timestamp.`;
        }
      });
      
      // Payments object check
      comparePayments(onConfirm.message.order.payments[0],
        confirm.message.order.payments[0],
        actions.ON_CONFIRM,
        actions.CONFIRM,
        errorObj,
        paymentTagsOne,
        ["collected_by", "type","params.currency", "params.transaction_id", "params.amount"]
      )

      if (hasIdMismatch) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }
      setValue(`${actions.ON_CONFIRM}`, data)

    } catch (error: any) {
      logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`)
      return {
        error: `Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`,
      }
    }
    setValue(`${actions.ON_CONFIRM}`, data);
    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`,
    }
  }
}
