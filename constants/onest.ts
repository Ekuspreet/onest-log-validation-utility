export const actions = {
    SEARCH: "search",
    SEARCH_INC: "search_inc",
    SELECT: "select",
    INIT: "init",
    CONFIRM: "confirm",
    UPDATE: "update",

    ON_SEARCH: "on_search",
    ON_SEARCH_INC: "on_search_inc",
    ON_SELECT: "on_select",
    ON_INIT: "on_init",
    ON_CONFIRM: "on_confirm",
    ON_STATUS: "on_status",
    ON_UPDATE: "on_update"
};

// This will store all the error reason codes for ONEST.
export const reasonCodes = {};

// This will include all the valid flows
export const onestFlows = {
    Flow_1: "Flow_1",
    Flow_2: "Flow_2",
    Flow_3: "Flow_3"
};

// Function to get the order of actions for each flow
export function flowOrder(flow: string): string[] {
    switch (flow) {
        case onestFlows.Flow_1:
            return [
                actions.SEARCH,
                actions.ON_SEARCH,
                actions.SEARCH_INC,
                actions.ON_SEARCH_INC
            ];
        case onestFlows.Flow_2:
            return [
                actions.SEARCH,
                actions.ON_SEARCH,
                actions.SELECT,
                actions.ON_SELECT,
                actions.INIT,
                actions.ON_INIT,
                actions.CONFIRM,
                actions.ON_CONFIRM,
                actions.ON_STATUS,
                actions.ON_STATUS,
                actions.ON_STATUS,
                actions.ON_UPDATE,
                actions.UPDATE,
                actions.ON_UPDATE
            ];
        case onestFlows.Flow_3:
            return [
                actions.SEARCH,
                actions.ON_SEARCH,
                actions.SELECT,
                actions.ON_SELECT,
                actions.INIT,
                actions.ON_INIT,
                actions.CONFIRM,
                actions.ON_CONFIRM,
                actions.ON_STATUS
            ];
        default:
            return [];
    }
}
