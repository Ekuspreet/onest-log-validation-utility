import { onestFlows, flowOrder, actions } from '../constants/onest'
import _ from 'lodash'
import { logger } from './logger'
import { dropDB, setValue } from './dao'
import * as Onest from '../utils/Onest'

export const validateOnestLogs = async (payload: any, domain: string, flow: string, version: string) => {
  try {
    const msgIdSet = new Set<string>()
    // const quoteTrailItemsSet = new Set<object>()
    // const settlementDetatilSet = new Set<object>()
    // const fulfillmentsItemsSet = new Set<object>()

    setValue('flow', flow)
    setValue('domain', domain.split(':')[1])
    setValue('version', version)

     try {
        dropDB()
      } catch (error) {
        logger.error('!!Error while removing LMDB', error)
      }

    let logReport: any = {}

    function processApiFlow(payload: any, flow: string, logReport: any, msgIdSet: Set<string>) {
      // Checking if the flow is a valid flow.
      // flowOrder returns the array of action suquences based on the flow. Returns empty array if the flow doesn't exist.
      const apiSequence = flowOrder(flow)
      logger.info(`API Sequence of Flow ${flow} for Onest : [${apiSequence}]`)
      apiSequence.forEach((actionCall: any) => {
        // Checking if payload is not present
        if (!payload[actionCall]) {
          payload[actionCall] = null;
          logReport = { ...logReport, [actionCall]: `Missing required data of : ${actionCall}` }
          return;
        }
        // response contains the errors in the payload.
        const response = getResponse(actionCall, payload[actionCall], msgIdSet, flow)

        if (!_.isEmpty(response)) {
          logReport = { ...logReport, [actionCall]: response }
        }
      })
      
      // logger.info(logReport, 'Report Generated Successfully!!')
      return logReport

    }

    const getResponse = (actionCall: any, data: any, msgIdSet: any, flow: string) => {
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
          return Onest.checkSelect(data, msgIdSet)
        case actions.ON_SELECT:
          return Onest.checkOnSelect(data, msgIdSet)
        case actions.INIT:
          return Onest.checkInit(data, msgIdSet)
        case actions.ON_INIT:
        case actions.ON_INIT_XINPUT:
          return Onest.checkOnInit(data, msgIdSet, actionCall)
        case actions.CONFIRM:
          return Onest.checkConfirm(data, msgIdSet)
        case actions.ON_CONFIRM:
          return Onest.checkOnConfirm(data, msgIdSet)
        // case actions.CANCEL:
        //   return checkCancel(data, msgIdSet, flow, )
        // case actions.ON_CANCEL:
        //   return checkOnCancel(data, msgIdSet, flow,)
        case actions.STATUS:
          return Onest.checkStatus(data, msgIdSet, flow)
        case actions.ON_STATUS:
          return Onest.checkOnStatus(data, msgIdSet, flow, actionCall)
        case actions.UPDATE:
          return Onest.checkUpdate(data, msgIdSet)
        case actions.ON_UPDATE:
        case actions.ON_UPDATE_UNSOLICITED:
          return Onest.checkOnUpdate(data, msgIdSet, actionCall)
        default:
          return null
      }
    }
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
        logger.info(`Invalid Flow for ONEST : ${flow}`)
        return { invalidFlow: 'Provided flow is invalid' }
    }
    return logReport
  } catch (error: any) {
    logger.error(error.message)
    return error.message
  }
}
