import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'

export function checkSelect(data: any, msgIdSet: Set<string>) {
  const errorObj: any = {}
  try {


    if (!data || isObjectEmpty(data)) {
      errorObj[actions.SELECT] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    // Dependencies Must Be Resolved. Displaying Cascading Errors.
    const onSearch = getValue(`${actions.ON_SEARCH}`);
    if (!onSearch) {
      errorObj.critical_error = `errors need to be resolved in ${actions.ON_SEARCH} first.`
      return Object.keys(errorObj).length > 0 && errorObj;
    }

    const contextRes: any = checkOnestContext(data.context, actions.SELECT, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.SELECT, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }

    try {
      const select = data;

      // --------------------------------------------------------------------------
      // Checks that are needed to performed in Select API Body.
      // Provider.id must be a valid on_search provider id - done
      // item.id must be a valid item for that provider - done
      // Fulfillment selected must be present in on_search. - done
      // tags should match with the selected item. - pending
      // --------------------------------------------------------------------------

      // Provider.id must be a valid on_search provider id 
      const selectedProviderId = select.message.order.provider.id;
      const selectedProvider = onSearch.message.catalog.providers.find((provider: any) => provider.id === selectedProviderId)
      if (_.isEmpty(selectedProvider)) {
        errorObj.invalid_provider = `Selected provider with id : ${selectedProviderId} is not availible.`
        return Object.keys(errorObj).length > 0 && errorObj
      }

      // item.id must be a valid item for that provider.
      select.message.order.items.forEach((item: any) => {
        const selectedItemId = item.id;
        const selectedItem = selectedProvider.items.find((item: any) => item.id === selectedItemId);
        if (_.isEmpty(selectedItem)) {
          errorObj.invalid_item = `Selected item with provider_id : ${selectedProviderId} and item id ${item.id} is not availible.`
          return Object.keys(errorObj).length > 0 && errorObj
        }
      });

      // Fulfillment selected must be present in on_search.
      const availibleFulfillmentsForItem = new Set(getValue(`${actions.ON_SEARCH}_${selectedProviderId}_${select.message.order.items[0].id}_fulfillments`))
      select.message.order.fulfillments.forEach((fulfillment: any) => {
        if (!availibleFulfillmentsForItem.has(fulfillment.id)) {
          errorObj[`item_fulfillment_not_availible_error_${fulfillment.id}`] =
            `Item fulfillment ID ${fulfillment.id} is not found in provider ${selectedProviderId}'s item ${select.message.order.items[0].id}'s fulfillments`;
        }
      }
      );
      
      setValue(`${actions.SELECT}`, data);
      return Object.keys(errorObj).length > 0 && errorObj
    } catch (error) {
      console.log(error);
    }

  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.SELECT}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.SELECT}: ${error.stack}`,
    }
  }
}
