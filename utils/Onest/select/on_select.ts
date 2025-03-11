
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'

import _ from 'lodash'

export function checkOnSelect(data: any, msgIdSet: Set<string>) {
  const errorObj: any = {}
  try {


    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_SELECT] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }

    const select = getValue(`${actions.SELECT}`);
    if (!select) {
      errorObj.critical_error = `errors need to be resolved in previous calls first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }
    const onSelect = data;
    const contextRes: any = checkOnestContext(data.context, actions.ON_SELECT, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_SELECT, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }

    // --------------------------------------------------------------------------
    // Checks that are needed to performed in Onselect API Body.
    // Check if order matches with select call. - done
    // Check if quote trail is present and store it. - done
    // --------------------------------------------------------------------------
    const availibleFulfillments = new Set(select.message.order.fulfillments.map((fulfillment: any) => fulfillment.id));

    // Check provider equality
    if (!_.isEqual(select.message.order.provider, onSelect.message.order.provider)) {
      errorObj[`incorrect_provider_error`] = `Provider ${onSelect.message.order.provider.id} does not match with ${actions.SELECT} provider.`;
      return Object.keys(errorObj).length > 0 && errorObj;

    }

    // Check fulfillments equality
    if (!_.isEqual(select.message.order.fulfillments, onSelect.message.order.fulfillments)) {
      errorObj[`incorrect_fulfillments_error`] = `Fulfillments do not match between ${actions.SELECT} and ${actions.ON_SELECT}.`;
      return Object.keys(errorObj).length > 0 && errorObj;

    }


    // Check items array
    onSelect.message.order.items.forEach((item: any) => {
      const selectItem = select.message.order.items.find((selectItem: any) => selectItem.id === item.id)
      if (!_.isEqual(
        { id: item.id, tags: item.tags },
        selectItem
      )) {
        errorObj[`incorrect_items_error`] = `Items mismatch between ${actions.SELECT} and ${actions.ON_SELECT}.`;
      };

      item.fulfillment_ids.forEach((id: string) => {
        if (!availibleFulfillments.has(id)) {
          errorObj[`item_fulfillment_invalid_error_${id}`] =
            `Item fulfillment ID ${id} is not found in order`;
        }
      })
    });
    if (_.isEmpty(onSelect.message.order.quote)) {
      errorObj[`quote_missing_error`] =
        `Quote is necessary for ${actions.ON_SELECT} call.`;
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    setValue(`${actions.ON_SELECT}`, data);
    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_SELECT}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_SELECT}: ${error.stack}`,
    }
  }
}
