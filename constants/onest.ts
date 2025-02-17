export const action = {
    SEARCH: "Search",
    SEARCH_INC: "Search_Inc",
    SELECT: "Select",
    INIT: "Init",
    CONFIRM: "Confirm",
    UPDATE: "Update"
};

export const onAction = {
    ON_SEARCH: "On_Search",
    ON_SEARCH_INC: "On_Search_Inc",
    ON_SELECT: "On_Select",
    ON_INIT: "On_Init",
    ON_CONFIRM: "On_Confirm",
    ON_STATUS: "On_Status",
    ON_UPDATE: "On_Update"
};

// This will store all the error reason codes for ONEST.
export const reasonCodes = {
}

// This will include all the valid flows
export const onestFlows = {
    Flow_1: 'Flow_1',
    Flow_2: 'Flow_2',
    Flow_3: 'Flow_3',
}

export function flowOrder(flow: string): string[] {
    switch (flow) {
        case onestFlows.Flow_1:
            return [
                action.SEARCH,
                onAction.ON_SEARCH,
                action.SEARCH_INC,
                onAction.ON_SEARCH_INC
            ];
        case onestFlows.Flow_2:
            return [
                action.SEARCH,
                onAction.ON_SEARCH,
                action.SELECT,
                onAction.ON_SELECT,
                action.INIT,
                onAction.ON_INIT,
                action.CONFIRM,
                onAction.ON_CONFIRM,
                onAction.ON_STATUS,
                onAction.ON_STATUS,
                onAction.ON_STATUS,
                onAction.ON_UPDATE,
                action.UPDATE,
                onAction.ON_UPDATE
            ];
        case onestFlows.Flow_3:
            return [
                action.SEARCH,
                onAction.ON_SEARCH,
                action.SELECT,
                onAction.ON_SELECT,
                action.INIT,
                onAction.ON_INIT,
                action.CONFIRM,
                onAction.ON_CONFIRM,
                onAction.ON_STATUS
            ];
        default:
            throw new Error('Flow for onest does not exist!');
    }
}
