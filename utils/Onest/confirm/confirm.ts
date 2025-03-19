
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, comparePayments, paymentTagsOne, skipErrors } from '../common'
import { getValue, setValue as _setValue, setValue } from '../../../shared/dao'
import { STATUS } from '../../../schema/Onest/constants'
import _ from 'lodash'

export function checkConfirm(data: any, msgIdSet: Set<string>) {
  const errorObj: any = {}
  try {

    

    const onInit = getValue(`${actions.ON_INIT_XINPUT}`)
    if (!onInit) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }
    if (!data || isObjectEmpty(data)) {
      errorObj[actions.CONFIRM] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }

    const contextRes: any = checkOnestContext(data.context, actions.CONFIRM, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.CONFIRM, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }

    const confirm = data;
    try {
      if(_.isEmpty(confirm.message.order.id)){
        return Object.keys(errorObj).length > 0 && errorObj;
      }
      setValue(`order_id`,confirm.message.order.id);

      if(!(confirm.message.order.status === STATUS.CREATED)){
        errorObj[`invalid_status_error`] = `Status in ${actions.CONFIRM} must be ${STATUS.CREATED}.`
     }
      // Check provider equality
      if (!_.isEqual(onInit.message.order.provider, confirm.message.order.provider)) {
        errorObj[`incorrect_provider_error`] = `Provider ${confirm.message.order.provider.id} does not match with selected provider.`;
        return Object.keys(errorObj).length > 0 && errorObj;
      }
      setValue(`provider`, confirm.message.order.provider)

      // Currently this flag is being used for ITEM.
      let hasIdMismatch = false;

      confirm.message.order.items.forEach((item: any) => {
        //  item.id must be a valid item for that provider
        const onInitItem = onInit.message.order.items.find((i_item: any) => i_item.id === item.id)
        if (!onInitItem) {
          errorObj[`invalid_item_error`] = `Item with id ${item.id} does not exist in items in ${actions.CONFIRM}.`;
          hasIdMismatch = true;
          return;
        }
        const toMatch = [`fulfillment_ids`, 'tags'];
        toMatch.forEach((feild: string) => {
          if (!_.isEqual(item[feild], onInitItem[feild])) {
            errorObj[`${feild}_mismatch_error_${item.id}`] = `${feild} in ${actions.CONFIRM} for item ${item.id}, do not match with ${actions.ON_INIT}.`;
          }
        })

      })

      // Checking for the Quote Trail.
      if (!_.isEqual(confirm.message.order.quote, onInit.message.order.quote)) {
        errorObj[`quote_mismatch_error`] = `Quote in ${actions.CONFIRM} does not match with quote trail.`;
      }


      // Payment Object Calculations
        comparePayments(confirm.message.order.payments[0],
                onInit.message.order.payments[0],
                actions.CONFIRM,
                actions.ON_INIT,
                errorObj,
                paymentTagsOne,
                ["collected_by", "type"]
              )

      confirm.message.order.fulfillments.forEach((fulfillment: any) => {
        const onInitFulfillment = onInit.message.order.fulfillments.find((oi_fulfillment: any) => oi_fulfillment.id === fulfillment.id)
        if (!onInitFulfillment) {
          errorObj[`invalid_fulfillment_error`] = `Fulfillment with id ${fulfillment.id} does not exist in Fulfillments in ${actions.ON_INIT}.`;
          hasIdMismatch = true;
          return;
        }
        const toMatch = [`type`, `customer.contact`, `customer.person.name`, `customer.person.gender`, `customer.person.age`, `customer.person.skills`, `customer.person.languages`, 'customer.person.creds'];

        toMatch.forEach((field: string) => {
          if (!_.isEqual(_.get(fulfillment, field), _.get(onInitFulfillment, field))) {
            errorObj[`${field}_mismatch_error_${fulfillment.id}`] = `${field} in ${actions.CONFIRM} for fulfillment ${fulfillment.id} does not match with ${actions.ON_INIT}.`;
          }

        });
        
        if(!(fulfillment.state.updated_at === confirm.context.timestamp)){
          errorObj[`incorrect_updated_timestamp_error`] = `the correct updated_at in ${actions.CONFIRM} should be context.timestamp.`;
        }
      });
      if (hasIdMismatch) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }

      setValue(`${actions.CONFIRM}`, data)
    } catch (error: any) {
      logger.error(`Error while checking for JSON structure and required fields for ${actions.CONFIRM}: ${error.stack}`)
      return {
        error: `Error while checking for JSON structure and required fields for ${actions.CONFIRM}: ${error.stack}`,
      }
    }


    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.CONFIRM}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.CONFIRM}: ${error.stack}`,
    }
  }
}
