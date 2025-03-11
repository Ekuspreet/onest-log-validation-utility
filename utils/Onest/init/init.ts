import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, setDifference, skipErrors } from '../common'
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

    const onSelect = getValue(`${actions.ON_SELECT}`);
    if (!onSelect) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }
    const init = data;

    const contextRes: any = checkOnestContext(data.context, actions.INIT, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.INIT, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
      

    try {
      // Check provider equality
      if (!_.isEqual(init.message.order.provider, onSelect.message.order.provider)) {
        errorObj[`incorrect_provider_error`] = `Provider ${onSelect.message.order.provider.id} does not match with selected provider.`;
        return Object.keys(errorObj).length > 0 && errorObj;
      }
      
      //  item.id must be a valid item for that provider
      if (!_.isEqual(onSelect.message.order.items, init.message.order.items)){
        errorObj[`incorrect_items_error`] = `Items do not match between ${actions.INIT} and ${actions.ON_SELECT}.`;
        return Object.keys(errorObj).length > 0 && errorObj;
      }
      
      // Fulfillment selected must be present in on_search for that item
      const availibleFulfillments = new Set(onSelect.message.order.fulfillments.map((fulfillment: any) => fulfillment.id));
      const initFulfillments = new Set(init.message.order.fulfillments.map((fulfillment: any) => fulfillment.id))
      const incorrect = setDifference(availibleFulfillments,initFulfillments)
      if(!_.isEmpty(incorrect)){
        errorObj[`incorrect_fulfillments_error`] = `Fulfillments of ${actions.INIT} does not match with selected fulfillments.`;
      }

      init.message.order.items.forEach((item: any) => {
        item.fulfillment_ids.forEach((id: string) => {
            if (!availibleFulfillments.has(id)) {
              errorObj[`item_fulfillment_invalid_error_${id}`] =
                `Item fulfillment ID ${id} is not found in order`;
            }
          })
      });
      if (_.isEmpty(init.message.order.payments)) {
        errorObj[`payments_missing_error`] =
          `Payments is necessary for ${actions.INIT} call.`;
        return Object.keys(errorObj).length > 0 && errorObj;
      }
      setValue(`${actions.INIT}`, data)
      return Object.keys(errorObj).length > 0 && errorObj

    } catch (error: any) {

    }
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.INIT}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.INIT}: ${error.stack}`,
    }
  }
}