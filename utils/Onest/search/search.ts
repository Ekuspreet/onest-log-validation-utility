import { setValue } from '../../../shared/dao'
import { actions } from '../../../constants/onest'
import { logger } from '../../../shared/logger'
import { isObjectEmpty, validateOnestSchema } from '../../index'
import { checkOnestContext, skipErrors } from '../common'
import _ from 'lodash'


export function checkSearch(data: any, msgIdSet: Set<string>): any {
  const errorObj: Record<string, string> = {};
  try {
    if (!data || typeof data !== 'object' || isObjectEmpty(data)) {
      return { missing_data: 'JSON cannot be empty' };
    }

    if (!data?.message || isObjectEmpty(data.message) || !data?.context || isObjectEmpty(data.context)) {
      errorObj['missing_fields'] = '/context, /message is missing or empty';
      return errorObj;
    }

    try {
      const contextRes: any = checkOnestContext(data.context, actions.SEARCH, msgIdSet);
      if (!contextRes?.isValid) {
        Object.assign(errorObj, contextRes?.errors || {});
        if (skipErrors.some(error => contextRes?.errors?.hasOwnProperty(error))) {
          return errorObj;
        }
      }
    } catch (error: any) {
      logger.error(`Error validating context: ${error.stack || error.message}`);
      return { error: `Error validating context` };
    }

    try {
      const domain: string | undefined = data?.context?.domain?.split(':')[1];
      if (domain) {
        const schemaValidation: any = validateOnestSchema(domain, actions.SEARCH, data);
        if (schemaValidation !== 'success') {
          Object.assign(errorObj, schemaValidation || {});
        }
      } else {
        errorObj['invalid_domain'] = 'context.domain is missing or malformed';
      }
    } catch (error: any) {
      logger.error(`Error validating schema: ${error.stack || error.message}`);
      return { error: `Error validating schema` };
    }

    try {
      setValue(`${actions.SEARCH}`, data);
    } catch (error: any) {
      logger.error(`Error setting value: ${error.stack || error.message}`);
      return { error: `Error setting value` };
    }

    return Object.keys(errorObj).length > 0 ? errorObj : null;
  } catch (error: any) {
    logger.error(`Unexpected error: ${error.stack || error.message}`);
    return { error: `Unexpected error` };
  }
}

