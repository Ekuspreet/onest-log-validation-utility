import { onestFlows, flowOrder, actions } from '../constants/onest'
import _ from 'lodash'
import { logger } from './logger'
import { setValue } from './dao'
import * as Onest from '../utils/Onest'

// flowOrder returns the order of a valid flow.
export const validateOnestLogs = async (payload: any, domain: string, flow: string) => {
  try {
    const msgIdSet = new Set<string>()
    // const quoteTrailItemsSet = new Set<object>()
    // const settlementDetatilSet = new Set<object>()
    // const fulfillmentsItemsSet = new Set<object>()

    setValue('flow', flow)
    setValue('domain', domain.split(':')[1])
    let logReport: any = {}

    function processApiFlow(payload: any, flow: string, logReport: any, msgIdSet: Set<string>) {
      if (!_.isEmpty(flowOrder(flow))) {
        const apiSequence = flowOrder(flow)
        console.log(apiSequence, "apiSequence")
        apiSequence.forEach((actionCall: any) => {
          console.log("actionCall", actionCall, payload[actionCall])
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

    const getResponse = (actionCall: any, data: any, msgIdSet: any) => {
      switch (actionCall) {
        case actions.SEARCH:
          return Onest.checkSearch(data, msgIdSet)
        case actions.ON_SEARCH:
          return Onest.checkOnSearch(data, msgIdSet)
        case actions.SEARCH_INC:
          return Onest.checkSearchIncremental(data, msgIdSet)
        case actions.ON_SEARCH_INC:
          return Onest.checkOnSearchIncremental(data, msgIdSet)
        case actions.SELECT:
          return Onest.checkSelect(data)
        case actions.ON_SELECT:
          return Onest.checkOnSelect(data)
        case actions.INIT:
          return Onest.checkInit(data)
        case actions.ON_INIT:
        case actions.ON_INIT_XINPUT:
          return Onest.checkOnInit(data)
        case actions.CONFIRM:
          return Onest.checkConfirm(data)
        case actions.ON_CONFIRM:
          return Onest.checkOnConfirm(data)
        // case actions.CANCEL:
        //   return checkCancel(data, )
        // case actions.ON_CANCEL:
        //   return checkOnCancel(data,)
        case actions.STATUS:
          return Onest.checkStatus(data)
        case actions.ON_STATUS:
          return Onest.checkOnStatus(data)
        case actions.UPDATE:
          return Onest.checkUpdate(data)
        case actions.ON_UPDATE:
        case actions.ON_UPDATE_UNSOLICITED:
          return Onest.checkOnUpdate(data)
        default:
          return null
      }
    }
    logger.info(`${flow}`)
    switch (flow) {
      case onestFlows.flowOne:
        logReport = processApiFlow(payload, onestFlows.flowOne, logReport, msgIdSet)
        break
      case onestFlows.flowTwo:
        logReport = processApiFlow(payload, onestFlows.flowTwo, logReport, msgIdSet)
        break
      case onestFlows.flowThree:
        logReport = processApiFlow(payload, onestFlows.flowThree, logReport, msgIdSet)
        break
      default:
        return { invalidFlow: 'Provided flow is invalid' }
    }

    return logReport
  } catch (error: any) {
    logger.error(error.message)
    return error.message
  }
}
