import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import { getValue } from '../../../shared/dao'
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
      return
    }
    // Dependencies Must Be Resolved. Displaying Cascading Errors.
    const onSearch = getValue(`${actions.ON_SEARCH}`);
    if(!onSearch){
      errorObj.critical_error = `errors need to be resolved in ${actions.ON_SEARCH} first.`
      return
    }

    const contextRes: any = checkOnestContext(data.context, actions.SELECT, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return errorObj;
      }
    }
    
    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.SELECT, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }

    try{
      // On Search Payload For Reference

      const select = data;
      // --------------------------------------------------------------------------
      // Checks that are needed to performed in Select API Body.
      // Provider.id must be a valid on_search provider id
      // item.id must be a valid item for that provider.
      // Fulfillment selected must be present in on_search
      // tags should match with the selected item.
      // --------------------------------------------------------------------------
      
      // --------------------------------------------------------------------------
      // Gathering Information.
      const selectedProviderId = select.message.order.provider.id;
      const selectedProvider = onSearch.message.catalog.providers.find((provider:any) => provider.id  === selectedProviderId)
      if(_.isEmpty(selectedProvider)){
        errorObj.invalid_provider = `Selected provider with id : ${selectedProviderId} is not availible.`
        return Object.keys(errorObj).length > 0 && errorObj
      }
      // console.log(selectedProvider)
      // const availibleItem;
      // const selectedProvider;

      select.message.order.items.forEach((item: any) => {
        // Item level checks to be implemented here.
        const selectedItemId = item.id;
        const selectedItem = selectedProvider.items.find((item: any) => item.id === selectedItemId);
        if(_.isEmpty(selectedItem)){
          errorObj.invalid_item = `Selected item with provider_id : ${selectedProviderId} and item id ${item.id} is not availible.`
          return Object.keys(errorObj).length > 0 && errorObj
        }
      });

      return Object.keys(errorObj).length > 0 && errorObj
    } catch(error){
      console.log(error);
    }
  
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.SELECT}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.SELECT}: ${error.stack}`,
    }
  }
}
