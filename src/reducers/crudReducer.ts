import { fetchHelper } from "../helpers/fetchHelper.ts";


interface Action {
    type: string,
    payload: {
        url: string,
        data: object,
    }
}

export const crudReducer = async (initState: object[], action: Action): Promise<object[]> => {
    let result;
    switch (action.type) {
        case 'get':
            result = fetchHelper(action.payload.url);
            return ([...initState, result]);
            break;
        default:
            return initState;
    }
}