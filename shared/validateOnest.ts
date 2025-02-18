import { onestFlows,flowOrder,actions } from "../constants/onest"
import _ from "lodash"
import { logger } from "./logger";
import { setValue } from "./dao";
import * as Onest from '../utils/Onest';


// flowOrder returns the order of a valid flow.
export const validateOnestLogs = async (payload: any, domain: string, flow: string) => {
    const msgIdSet = new Set<string>()
    // const quoteTrailItemsSet = new Set<object>()
    // const settlementDetatilSet = new Set<object>()
    // const fulfillmentsItemsSet = new Set<object>()

    setValue('flow', flow)
    setValue('domain', domain.split(':')[1])
    let logReport: any = {}

    function processApiFlow(payload: any, flow: string, logReport: any, msgIdSet: Set<string>) {
        if (!_.isEmpty(flowOrder(flow))) {
               const apiSequence = flowOrder(flow);
               console.log(apiSequence);
               apiSequence.forEach((actionCall: any) => {
                 if (payload[actionCall]) {
                   const response = getResponse(actionCall, payload[actionCall], msgIdSet)
                   if (!_.isEmpty(response)) {
                     logReport = { ...logReport, [actionCall]: response }
                   }
                 } else {
                   logReport = { ...logReport, [actionCall]: `Missing required data of : ${actionCall}` }
                 }
               })
               logger.info(logReport, 'Report Generated Successfully!!')
               return logReport
             } else {
               return { invalidFlow: 'Provided flow is invalid' }
           }
   }
   
    const getResponse = (actionCall: any, _data: any, _msgIdSet: any) => {
         switch (actionCall) {
           case actions.SEARCH:
             return Onest.checkSearch()
           case actions.ON_SEARCH:
             return Onest.checkOnSearch()
           case actions.SEARCH_INC:
             return Onest.checkSearchIncremental()
           case actions.ON_SEARCH_INC:
             return Onest.checkOnSearchIncremental()
           // case actions.SELECT:
           //   return checkSelect(data,msgIdSet)
           // case actions.ON_SELECT:
           //   return checkOnSelect(data)
           // case actions.INIT:
           //   return checkInit(data, msgIdSet)
           // case actions.ON_INIT:
           //   return checkOnInit(data)
           // case actions.CONFIRM:
           //   return checkConfirm(data, msgIdSet)
           // case actions.ON_CONFIRM:
           //   return checkOnConfirm(data, fulfillmentsItemsSet)
           // case actions.CANCEL:
           //   return checkCancel(data, msgIdSet)
           // case actions.ON_CANCEL:
           //   return checkOnCancel(data, msgIdSet)
           // case actions.STATUS:
           //   return checkStatus(data)
           // case actions.ON_STATUS:
           //   return checkOnStatus(data, 'pending', msgIdSet, fulfillmentsItemsSet)
           // case actions.UPDATE:
           //   return checkUpdate(data, msgIdSet, actions.ON_UPDATE_PART_CANCEL, settlementDetatilSet, quoteTrailItemsSet, fulfillmentsItemsSet, "6-a")
           // case actions.ON_UPDATE:
           //   return checkOnUpdate(data, msgIdSet, actions.ON_UPDATE_INTERIM_REVERSE_QC, settlementDetatilSet, quoteTrailItemsSet, fulfillmentsItemsSet, '6-b')
           default:
             return null
         }
   }
   logger.info(`${flow}`)
    switch (flow) {
        case onestFlows.Flow_1:
            logReport = processApiFlow( payload, onestFlows.Flow_1,  logReport, msgIdSet)
            break
        case onestFlows.Flow_2:
            logReport = processApiFlow( payload, onestFlows.Flow_1,  logReport, msgIdSet)
            break
        case onestFlows.Flow_3:
            logReport = processApiFlow( payload, onestFlows.Flow_1,  logReport, msgIdSet)
            break
        default:
          return { invalidFlow: 'Provided flow is invalid' }
    }

    return logReport
}