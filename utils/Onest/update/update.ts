
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../..'
import { checkOnestContext, skipErrors } from '../common'
import { getValue, setValue } from '../../../shared/dao'
import { FULFILLMENT_STATE, STATUS } from '../../../schema/Onest/constants'
import _ from 'lodash'
export function checkUpdate(data: any, msgIdSet: Set<string>) {
  const errorObj: any = {}
  try {
    const onUpdateUnsolicited = getValue(`${actions.ON_UPDATE_EXTENDED}`)
    if(!onUpdateUnsolicited){
        errorObj.critical_error = `errors need to be resolved in previous calls first.`
        return Object.keys(errorObj).length > 0 && errorObj;
      }    

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.UPDATE] = 'JSON cannot be empty'
      return
    }

    if (!data.message || !data.context || isObjectEmpty(data.message)) {
      errorObj['missingFields'] = '/context, /message is missing or empty'
      return Object.keys(errorObj).length > 0 && errorObj
    }
    const contextRes: any = checkOnestContext(data.context, actions.UPDATE, msgIdSet)
       if(!contextRes.isValid) {
         Object.assign(errorObj, contextRes.errors)
         if ( contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
           return errorObj;
         }
       }
    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.UPDATE, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    const update = data;
    const order_id = getValue(`order_id`);
    if(!_.isEqual(order_id, update.message.order.id)){
      errorObj[`invalid_order_id_error`] = `order id provided here is invalid and should match with confirm call.`
      return Object.keys(errorObj).length > 0 && errorObj
    }

    if ((update.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_ACCEPTED) || (update.message.order.fulfillments[0].state.descriptor.code === FULFILLMENT_STATE.APPLICATION_REJECTED)  ) {
      if (!(update.message.order.status === STATUS.COMPLETED)) {
        errorObj[`invalid_status_error`] = `Status in ${actions.UPDATE} for ${FULFILLMENT_STATE.APPLICATION_REJECTED} must be ${STATUS.ACTIVE}.`
      }
    }
    

    setValue(`${actions.UPDATE}`, data)
    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.UPDATE}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.UPDATE}: ${error.stack}`,
    }
  }
}
