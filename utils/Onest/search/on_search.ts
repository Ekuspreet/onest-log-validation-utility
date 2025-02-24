import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import {
  areTimestampsLessThanOrEqualTo,
  checkBppIdOrBapId,
  checkContext,
  compareSTDwithArea,
  emailRegex,
  isObjectEmpty,
  isValidPhoneNumber,
  validateBapUri,
  validateBppUri,
  validateOnestSchema,
} from '../..'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'

export function checkOnSearch(data: any, _msgIdSet: any) {
  try {
    let errorObj: any = {}
    logger.info(`Checking JSON structure and required fields for ${actions.ON_SEARCH} API`)

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_SEARCH] = 'JSON cannot be empty'
      return errorObj
    }

    const { message, context } = data

    if (!message || !context || !message.catalog || isObjectEmpty(message) || isObjectEmpty(message.catalog)) {
      return { missingFields: '/context, /message, /catalog or /message/catalog is missing or empty' }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_SEARCH, data)

    if (schemaValidation !== 'error') {
      Object.assign(errorObj, schemaValidation)
    }

    setValue(`${actions.ON_SEARCH}_context`, context)
    setValue(`${actions.ON_SEARCH}_message`, message)

    if (schemaValidation !== 'error') {
      Object.assign(errorObj, schemaValidation)
    }

    validateBapUri(context.bap_uri, context.bap_id, errorObj)
    validateBppUri(context.bpp_uri, context.bpp_id, errorObj)
    if (context.transaction_id == context.message_id) {
      errorObj['on_search'] =
        `Context transaction_id (${context.transaction_id}) and message_id (${context.message_id}) can't be the same.`
    }
    try {
      logger.info(`Comparing Message Ids of /${actions.SEARCH} and /${actions.ON_SEARCH}`)
      if (!_.isEqual(getValue(`${actions.SEARCH}_msgId`), context.message_id)) {
        errorObj[`${actions.ON_SEARCH}_msgId`] =
          `Message Ids for /${actions.SEARCH} and /${actions.ON_SEARCH} api should be same`
      }
    } catch (error: any) {
      logger.error(`!!Error while checking message id for /${actions.ON_SEARCH}, ${error.stack}`)
    }

    if (!_.isEqual(data.context.domain.split(':')[1], getValue(`domain`))) {
      errorObj[`Domain[${data.context.action}]`] = `Domain should be same in each action`
    }

    const checkBap = checkBppIdOrBapId(context.bap_id)
    const checkBpp = checkBppIdOrBapId(context.bpp_id)

    if (checkBap) Object.assign(errorObj, { bap_id: 'context/bap_id should not be a url' })
    if (checkBpp) Object.assign(errorObj, { bpp_id: 'context/bpp_id should not be a url' })

    try {
      logger.info(`Checking for context in /${actions.ON_SEARCH}`)
      const contextRes: any = checkContext(context, actions.ON_SEARCH)
      if (!contextRes?.valid) {
        Object.assign(errorObj, contextRes.ERRORS)
      }
    } catch (error: any) {
      logger.error(`Error while checking for context in /${actions.ON_SEARCH}, ${error.stack}`)
    }

    setValue(`${actions.ON_SEARCH}`, data)

    const searchContext: any = getValue(`${actions.SEARCH}_context`)

    try {
      logger.info(`Storing BAP_ID and BPP_ID in /${actions.ON_SEARCH}`)
      setValue('bapId', context.bap_id)
      setValue('bppId', context.bpp_id)
    } catch (error: any) {
      logger.error(`!!Error while storing BAP and BPP Ids in /${actions.ON_SEARCH}, ${error.stack}`)
    }

    try {
      logger.info(`Comparing transaction Ids of /${actions.SEARCH} and /${actions.ON_SEARCH}`)
      if (!_.isEqual(searchContext.transaction_id, context.transaction_id)) {
        errorObj.transaction_id = `Transaction Id for /${actions.SEARCH} and /${actions.ON_SEARCH} api should be same`
      }
    } catch (error: any) {
      logger.info(
        `Error while comparing transaction ids for /${actions.SEARCH} and /${actions.ON_SEARCH} api, ${error.stack}`,
      )
    }

    try {
      logger.info(`Comparing Message Ids of /${actions.SEARCH} and /${actions.ON_SEARCH}`)
      if (!_.isEqual(searchContext.message_id, context.message_id)) {
        errorObj.message_id = `Message Id for /${actions.SEARCH} and /${actions.ON_SEARCH} api should be same`
      }
    } catch (error: any) {
      logger.info(
        `Error while comparing message ids for /${actions.SEARCH} and /${actions.ON_SEARCH} api, ${error.stack}`,
      )
    }

    try {
      const providers = data.message.catalog.providers
      providers.forEach((provider: any, i: number) => {
        provider.locations.forEach((location: any, j: number) => {
          if (location) {
            const area_code = Number.parseInt(location?.area_code?.code)
            const std = context?.city?.code.split(':')[1]

            logger.info(`Comparing area_code and STD Code for /${actions.ON_SEARCH}`)
            const areaWithSTD = compareSTDwithArea(area_code, std)
            if (!areaWithSTD) {
              logger.error(`STD code does not match with given area_code on /${actions.ON_SEARCH}`)
              errorObj[`invldAreaCode${i}${j}`] =
                `STD code does not match with given area_code on /${actions.ON_SEARCH}`
            }
          }
        })
      })
    } catch (error: any) {
      logger.error(
        `Error while matching area_code and std code for /${actions.SEARCH} and /${actions.ON_SEARCH} api, ${error.stack}`,
      )
    }

    const onSearchCatalog: any = message.catalog
    const onSearchFFIdsArray: any = []
    const prvdrsId = new Set()
    const prvdrLocId = new Set()
    const itemsId = new Set()
    const onSearchFFTypeSet = new Set()
    const itemsArray: any = []
    let itemIdList: any = []
    setValue('tmpstmp', context.timestamp)

    // Storing static fulfillment ids in onSearchFFIdsArray, OnSearchFFTypeSet
    try {
      logger.info(`Saving static fulfillment ids in /${actions.ON_SEARCH}`)

      onSearchCatalog['providers'].forEach((provider: any) => {
        const onSearchFFIds = new Set()
        const bppFF = provider.fulfillments
        const len = bppFF.length

        let i = 0
        while (i < len) {
          console.log(bppFF[i].type, bppFF[i].id, 'bppFF')
          onSearchFFTypeSet.add(bppFF[i].type)
          onSearchFFIds.add(bppFF[i].id)
          i++
        }
        onSearchFFIdsArray.push(onSearchFFIds)

        provider.locations.forEach((loc: any, iter: any) => {
          try {

            console.log("loc", loc)
            if (prvdrLocId.has(loc?.id)) {
              const key = `prvdr${i}${loc.id}${iter}`
              errorObj[key] = `duplicate location id: ${loc.id} in /bpp/providers[${i}]/locations[${iter}]`
            } else {
              prvdrLocId.add(loc.id)
            }

          } catch (error: any) {
            logger.error(`Validation error for frequency: ${error.stack}`)
          }
        })
      })

      setValue('onSearchFFIdsArray', onSearchFFIdsArray)
    } catch (error: any) {
      logger.info(`Error while saving static fulfillment ids in /${actions.ON_SEARCH}, ${error.stack}`)
    }

    // Storing items of providers in itemsArray and itemIdList
    try {
      logger.info(`Storing items of providers in itemsArray for  /${actions.ON_SEARCH}`)
      const providers = onSearchCatalog['providers']
      providers.forEach((provider: any) => {
        const items = provider.items
        itemsArray.push(items)
        items.forEach((item: any) => {
          itemIdList.push(item.id)
        })
      })
      setValue('ItemList', itemIdList)
      setValue('onSearchItems', itemsArray)
    } catch (error: any) {
      logger.error(`Error while storing items of providers in itemsArray for  /${actions.ON_SEARCH}, ${error.stack}`)
    }

    // Comparing valid timestamp in context.timestamp and providers/items/time/timestamp
    try {
      logger.info(`Comparing valid timestamp in context.timestamp and providers/items/time/timestamp`)
      const timestamp = context.timestamp
      for (let i in onSearchCatalog['providers']) {
        const items = onSearchCatalog['providers'][i].items
        items.forEach((item: any, index: number) => {
          const itemTimeStamp = item.time.timestamp
          const op = areTimestampsLessThanOrEqualTo(itemTimeStamp, timestamp)
          if (!op) {
            const key = `providers[${i}]/items/time/timestamp[${index}]`
            errorObj[key] = `Timestamp for item[${index}] can't be greater than context.timestamp`
            logger.error(`Timestamp for item[${index}] can't be greater than context.timestamp`)
          }
        })
      }
    } catch (error: any) {
      logger.error(
        `!!Errors while checking timestamp in context.timestamp and providers/items/time/timestamp, ${error.stack}`,
      )
    }

    // Checking for duplicate providerID in providers
    try {
      for (let i in onSearchCatalog['providers']) {
        logger.info(`Validating uniqueness for provider id in providers[${i}]...`)
        const prvdr = onSearchCatalog['providers'][i]
        if (prvdrsId.has(prvdr.id)) {
          const key = `prvdr${i}id`
          errorObj[key] = `duplicate provider id: ${prvdr.id} in providers`
        } else {
          prvdrsId.add(prvdr.id)
        }
      }
      setValue(`${actions.ON_SEARCH}prvdrsId`, prvdrsId)
    } catch (error: any) {
      logger.error(`!!Errors while checking provider id in providers, ${error.stack}`)
    }

    // Checking for long_desc and short_desc in providers/items/descriptor/
    try {
      logger.info(`Checking for long_desc and short_desc in providers/items/descriptor/`)
      for (let i in onSearchCatalog['providers']) {
        const items = onSearchCatalog['providers'][i].items
        items.forEach((item: any, index: number) => {
          if (!item.descriptor.short_desc || !item.descriptor.long_desc) {
            logger.error(
              `short_desc and long_desc should not be provided as empty string "" in /message/catalog/providers[${i}]/items[${index}]/descriptor`,
            )
            const key = `providers[${i}]/items[${index}]/descriptor`
            errorObj[key] =
              `short_desc and long_desc should not be provided as empty string "" in /message/catalog/providers[${i}]/items[${index}]/descriptor`
          }
        })
      }
    } catch (error: any) {
      logger.error(
        `!!Errors while checking timestamp in context.timestamp and providers/items/time/timestamp, ${error.stack}`,
      )
    }

    // Checking price of items in providers
    try {
      const providers = onSearchCatalog['providers']
      providers.forEach((provider: any, i: number) => {
        const items = provider.items
        items.forEach((item: any, j: number) => {
          if (item.price && item.price.value) {
            const priceValue = parseFloat(item.price.value)
            if (priceValue < 1) {
              const key = `prvdr${i}item${j}price`
              errorObj[key] = `item.price.value should be greater than 0`
            }
          }
        })
      })
    } catch (error: any) {
      logger.error(`Error while checking price of items in providers for /${actions.ON_SEARCH}, ${error.stack}`)
    }

    // Mapping items with thier respective providers
    try {
      const itemProviderMap: any = {}
      const providers = onSearchCatalog['providers']
      providers.forEach((provider: any) => {
        const items = provider.items
        const itemArray: any = []
        items.forEach((item: any) => {
          itemArray.push(item.id)
        })
        itemProviderMap[provider.id] = itemArray
      })

      setValue('itemProviderMap', itemProviderMap)
    } catch (e: any) {
      logger.error(`Error while mapping items with thier respective providers ${e.stack}`)
    }

    // Checking for quantity of items in providers
    try {
      logger.info(`Checking for quantity of items in providers for /${actions.ON_SEARCH}`)
      const providers = onSearchCatalog['providers']
      providers.forEach((provider: any, i: number) => {
        const items = provider.items
        items.forEach((item: any, j: number) => {
          if (item.quantity && item.quantity.available && typeof item.quantity.available.count === 'string') {
            const availCount = parseInt(item.quantity.available.count, 10)
            if (availCount < 1) {
              const key = `prvdr${i}item${j}unitized`
              errorObj[key] = `item.quantity.available.count should be greater than 0`
            }
          }
        })
      })
    } catch (error: any) {
      logger.error(`Error while checking quantity of items in providers for /${actions.ON_SEARCH}, ${error.stack}`)
    }

    try {
      logger.info(`Checking Providers info (providers) in /${actions.ON_SEARCH}`)
      let i = 0
      const bppPrvdrs = onSearchCatalog['providers']
      const len = bppPrvdrs.length
      while (i < len) {
        const prvdr = bppPrvdrs[i]

        try {
          logger.info(`Checking items for provider (${prvdr.id}) in providers[${i}]`)
          let j = 0
          const items = onSearchCatalog['providers'][i]['items']

          const iLen = items.length
          while (j < iLen) {
            logger.info(`Validating uniqueness for item id in providers[${i}].items[${j}]...`)
            const item = items[j]

            if (itemsId.has(item.id)) {
              const key = `prvdr${i}item${j}`
              errorObj[key] = `duplicate item id: ${item.id} in providers[${i}]`
            } else {
              itemsId.add(item.id)
            }

            try {
              if ('price' in item) {
                const sPrice = parseFloat(item.price.value)
                const maxPrice = parseFloat(item.price.maximum_value)

                if (sPrice > maxPrice) {
                  const key = `prvdr${i}item${j}Price`
                  errorObj[key] =
                    `selling price of item /price/value with id: (${item.id}) can't be greater than the maximum price /price/maximum_value in /providers[${i}]/items[${j}]/`
                }
              }
            } catch (error: any) {
              logger.error(
                `Error while checking selling price and maximum price for item id: ${item.id}, ${error.stack}`,
              )
            }

            try {
              if (item.fulfillment_ids[0] && !onSearchFFIdsArray[i].has(item.fulfillment_ids[0])) {
                const key = `prvdr${i}item${j}ff`
                errorObj[key] =
                  `fulfillment_ids in /providers[${i}]/items[${j}] should map to one of the fulfillments id in bpp/prvdr${i}/fulfillments`
              }
            } catch (error: any) {
              logger.error(`Error while checking fulfillment_ids for item id: ${item.id}, error: ${error.stack}`)
            }

            try {
              logger.info(`Checking location_id for item id: ${item.id}`)
              console.log('locationIds', item.location_ids[0], prvdrLocId)
              if (item.location_ids[0] && !prvdrLocId.has(item.location_ids[0])) {
                const key = `prvdr${i}item${j}loc`
                errorObj[key] =
                  `location_ids in /providers[${i}]/items[${j}] should be one of the locations id in /providers[${i}]/locations`
              }
            } catch (error: any) {
              logger.error(`Error while checking location_id for item id: ${item.id}, error: ${error.stack}`)
            }

            try {
              logger.info(`Checking creator details for item id: ${item.id}`)

              if ('creator' in item && 'contact' in item.creator) {
                const creatorContact = item.creator.contact
                const phone = creatorContact.phone?.trim()
                const email = creatorContact.email?.trim()

                // Validate phone number (should be 10 or 11 digits, no spaces/special characters)
                if (!isValidPhoneNumber(phone)) {
                  const key = `prvdr${i}items${j}`
                  errorObj[key] =
                    `contact number should be 10 or 11 digits without spaces or special characters in /providers[${i}]/items`
                }

                // Validate email format
                if (!emailRegex(email)) {
                  const key = `prvdr${i}consCare`
                  errorObj[key] = `email should be in a valid format in /providers[${i}]/items`
                }

                if (!creatorContact.phone || !creatorContact.email) {
                  const key = `prvdr${i}consCare`
                  errorObj[key] = `Contact details should be provided in /providers[${i}]/items`
                }
              }
            } catch (error: any) {
              logger.error(`Error while checking creator details for item id: ${item.id}, ${error.stack}`)
            }

            j++
          }
        } catch (error: any) {
          logger.error(`!!Errors while checking items in providers[${i}], ${error.stack}`)
        }

        i++
      }

      setValue(`${actions.ON_SEARCH}prvdrLocId`, prvdrLocId)
      setValue(`${actions.ON_SEARCH}itemsId`, itemsId)
    } catch (error: any) {
      logger.error(`!!Error while checking Providers info in /${actions.ON_SEARCH}, ${error.stack}`)
    }

    return Object.keys(errorObj).length > 0 && errorObj
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_SEARCH}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_SEARCH}: ${error.stack}`,
    }
  }
}
