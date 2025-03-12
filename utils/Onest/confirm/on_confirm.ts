
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import { getValue } from '../../../shared/dao'
import { FULFILLMENT_STATE, STATUS } from '../../../schema/Onest/constants'
import _ from 'lodash'
// import { STATUS } from 'schema/Onest/constants'

export function checkOnConfirm(data: any, msgIdSet: Set<string>) {
  const errorObj: any = {}
  try {
    

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_CONFIRM] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actions.ON_CONFIRM, msgIdSet)
       if(!contextRes.isValid) {
         Object.assign(errorObj, contextRes.errors)
         if ( contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
           return errorObj;
         }
       }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_CONFIRM, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    const on_confirm = data;
    try{
      // Matching Order Id
      const order_id = getValue(`order_id`);
      // const latest_fulfillment = getValue(`latest_fulfillment`);
      if(_.isEqual(order_id, on_confirm.message.order.id)){
        errorObj[`invalid_order_id_error`] = `order id provided here is invalid and should match with confirm call.`
        return Object.keys(errorObj).length > 0 && errorObj
      }
      if(on_confirm.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_FILLED){

        if(!(on_confirm.message.order.status === STATUS.CREATED)){
           errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} must be ${STATUS.CREATED}.`
        }
      }
      if(on_confirm.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_ACCEPTED){
        if(!(on_confirm.message.order.status === STATUS.CREATED)){
           errorObj[`invalid_status_error`] = `Status in ${actions.ON_CONFIRM} must be ${STATUS.CREATED}.`
        }
      }
    } catch(error:any){
      logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`)
      return {
        error: `Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`,
      }
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_CONFIRM}: ${error.stack}`,
    }
  }
}
