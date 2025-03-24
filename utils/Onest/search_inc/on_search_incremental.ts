import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import {
  compareSTDwithArea,
  isObjectEmpty,
  validateOnestSchema,
} from '../..'
import { getValue, setValue } from '../../../shared/dao'
import _ from 'lodash'
import { checkOnestContext, skipErrors } from '../common'

export function checkOnSearchIncremental(data: any, msgIdSet: any) {
  try {

    // Currently not in use.
    let errorObj: any = {}
    

    if (!data || isObjectEmpty(data)) {
      errorObj[actions.ON_SEARCH_INC] = 'JSON cannot be empty'
      return errorObj
    }

    const { message, context } = data

    if (!message || !context || !message.catalog || isObjectEmpty(message) || isObjectEmpty(message.catalog)) {
      return { missingFields: '/context, /message, /catalog or /message/catalog is missing or empty' }
    }

    const contextRes: any = checkOnestContext(data.context, actions.ON_SEARCH_INC, msgIdSet)
    if (!contextRes.isValid) {
      Object.assign(errorObj, contextRes.errors)
      if (contextRes.errors && skipErrors.some(error => contextRes.errors.hasOwnProperty(error))) {
        return Object.keys(errorObj).length > 0 && errorObj;
      }
    }

    const schemaValidation = validateOnestSchema(data.context.domain.split(':')[1], actions.ON_SEARCH_INC, data)

    if (schemaValidation !== 'success') {
      Object.assign(errorObj, schemaValidation)
    }
    // Storing the payload for future refrences.
    setValue(`${actions.ON_SEARCH_INC}`, data)
    const onSearchData = getValue(`${actions.ON_SEARCH}`)

    const providerIds = new Set()

    try {
      const providers = data.message.catalog.providers;

      providers.forEach((provider: any, index: number) => {
        const onSearchProvider = onSearchData.message.catalog.providers.filter((value: any) => value.id === provider.id);
        if (_.isEmpty(onSearchProvider)) {
          errorObj.provider_id_invalid_error = `provider id in ON_SEARCH_INCREMENTAL must exist in ON_SEARCH. Invalid ID : ${provider.id}`
          return;
        }
        const providerChild = Object.keys(provider)
        
        const changedValues = providerChild.filter(key => key !== 'id');

        // Gathering information about provider.
        let selectedFulfillmentIds = new Set();
        let selectedLocationIds = new Set();

        // Variable in provider context.
        let fulfillmentIds = new Set();
        let locationIds = new Set();
        const itemIds = new Set();

        // Retrieve stored values
        const storedFulfillmentIds = new Set(getValue(`${actions.ON_SEARCH}_${provider.id}_fulfillments`) || []);
        const storedSelectedFulfillmentIds = new Set(getValue(`${actions.ON_SEARCH}_${provider.id}_selected_fulfillments`) || []);
        const storedLocationIds = new Set(getValue(`${actions.ON_SEARCH}_${provider.id}_locations`) || []);
        const storedSelectedLocationIds = new Set(getValue(`${actions.ON_SEARCH}_${provider.id}_selected_locations`) || []);

        // Merge existing values with stored values
        fulfillmentIds = new Set([...fulfillmentIds, ...storedFulfillmentIds]);
        selectedFulfillmentIds = new Set([...selectedFulfillmentIds, ...storedSelectedFulfillmentIds]);
        locationIds = new Set([...locationIds, ...storedLocationIds]);
        selectedLocationIds = new Set([...selectedLocationIds, ...storedSelectedLocationIds]);
        // Unique provider id's

        if (providerIds.has(provider.id)) {
          errorObj.provider_id_duplicate_error = `provider id must be unique. Duplicate : ${provider.id}`
          return;
        }
        providerIds.add(provider.id)

        // Check fulfillment ID uniqueness
        if (changedValues.includes('fulfillments')) {
          provider.fulfillments.forEach((fulfillment: any, fIndex: number) => {
            if (fulfillmentIds.has(fulfillment.id)) {
              console.log("DUPLICATE HAPPENED");
              errorObj[`fulfillment_id_duplicate_error_${index}_${fIndex}`] =
                `Duplicate fulfillment ID found: ${fulfillment.id} in provider ${provider.id}`;
            }
            fulfillmentIds.add(fulfillment.id);
          });
        }

        // Check location ID uniqueness
        if (changedValues.includes('locations')) {
          provider.locations.forEach((location: any, j: number) => {
            if (location) {
              if (locationIds.has(location.id)) {
                errorObj[`location_id_duplicate_error_${index}_${j}`] =
                  `Duplicate location ID found: ${location.id} in provider ${provider.id}`;
              }
              locationIds.add(location.id);
            }
          });
        };

        // check if Std code matches with the area_code.
        if (changedValues.includes('locations')) {
          provider.locations.forEach((location: any, j: number) => {
            if (location) {
              const area_code = Number.parseInt(location?.area_code?.code)
              const std = location?.city?.code.split(':')[1]
              if (area_code && std) {
                const areaWithSTD = compareSTDwithArea(area_code, std)
                if (!areaWithSTD) {
                  logger.error(`STD code does not match with given area_code on /${actions.ON_SEARCH_INC}`)
                  errorObj[`invldAreaCode${index}${j}`] =
                    `STD code does not match with given area_code on /${actions.ON_SEARCH_INC}`
                }
              }
            }
          });
        }

        if (changedValues.includes('items')) {
          provider.items.forEach((item: any, k: number) => {
            if (item) {
              // Check item ID uniqueness
              if (itemIds.has(item.id)) {
                errorObj[`item_id_duplicate_error_${index}_${k}`] =
                  `Duplicate item ID found: ${item.id} in provider ${provider.id}`;
              }
              itemIds.add(item.id);

              // Ensure item location_ids exist in provider.locations
              item.location_ids.forEach((locationId: string) => {
                if (!locationIds.has(locationId)) {
                  errorObj[`item_location_mapping_error_${index}_${k}`] =
                    `Item location ID ${locationId} is not found in provider ${provider.id}'s locations`;
                } else {
                  selectedLocationIds.add(locationId);
                }
              });

              // Ensure item fulfillment_ids exist in provider.fulfillments
              item.fulfillment_ids.forEach((fulfillmentId: string) => {
                if (!fulfillmentIds.has(fulfillmentId)) {
                  errorObj[`item_fulfillment_mapping_error_${index}_${k}`] =
                    `Item fulfillment ID ${fulfillmentId} is not found in provider ${provider.id}'s fulfillments`;
                } else {
                  selectedFulfillmentIds.add(fulfillmentId);
                }
              });
            }
          });
        }

        // Ensuring that no obsolete fulfillments remain.

        console.log("Merged Fulfillment IDs:", fulfillmentIds);
        console.log("Merged Selected Fulfillment IDs:", selectedFulfillmentIds);
        console.log("Merged Location IDs:", locationIds);
        console.log("Merged Selected Location IDs:", selectedLocationIds);
        // Compute unselected fulfillments and locations
        // const unSelectedFulfillments = setDifference(fulfillmentIds, selectedFulfillmentIds);
        // const unSelectedLocations = setDifference(locationIds, selectedLocationIds);

        // if (!_.isEmpty(unSelectedFulfillments)) {
        //   errorObj[`unused_fulfillment_id_error_${index}`] =
        //     `Unused fulfillment IDs found in provider ${provider.id}: ${unSelectedFulfillments.join(", ")}`;
        // }


        // // Ensuring that no obsolete locations remain.
        // if (!_.isEmpty(unSelectedLocations)) {
        //   errorObj[`unused_location_id_error_${index}`] =
        //     `Unused location IDs found in provider ${provider.id}: ${unSelectedLocations.join(", ")}`;
        // }
      })


      return Object.keys(errorObj).length > 0 && errorObj
    } catch (error) {
      console.log(error);
    }
  } catch (error: any) {
    logger.error(`Error while checking for JSON structure and required fields for ${actions.ON_SEARCH_INC}: ${error.stack}`)
    return {
      error: `Error while checking for JSON structure and required fields for ${actions.ON_SEARCH_INC}: ${error.stack}`,
    }
  }
}


