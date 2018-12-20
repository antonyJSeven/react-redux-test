import {
    APP_ENGINE_CREATE_FOLDER_FAILURE,
    APP_ENGINE_CREATE_FOLDER_STARTED,
    APP_ENGINE_CREATE_FOLDER_SUCCESS, GET_APP_ENGINE_TABLE_FAILURE,
    GET_APP_ENGINE_TABLE_STARTED, GET_APP_ENGINE_TABLE_SUCCESS,
    POST_EXCEL_FAILURE,
    POST_EXCEL_STARTED,
    POST_EXCEL_SUCCESS
} from "../constants/action-types";

const initilStateAppEngine = {
    excel: {},
    user: {},
    table: {
        loading: false
    },
    loading: false,
};

export const appEngineReducer = (state = initilStateAppEngine, action) => {
    switch (action.type) {

        case APP_ENGINE_CREATE_FOLDER_STARTED:
            return {...state, loading: true};
        case APP_ENGINE_CREATE_FOLDER_SUCCESS:
            return {...state, folder: {...state.folder, error: null, data: action.payload}};
        case APP_ENGINE_CREATE_FOLDER_FAILURE:
            return {...state, folder: {...state.folder, error: action.payload.error}};

        case POST_EXCEL_STARTED:
            return {...state, excel:{...state.excel, loading: true}};
        case POST_EXCEL_SUCCESS:
            return {...state, excel:{...state.excel, error: null, data: action.payload, loading: false}};
        case POST_EXCEL_FAILURE:
            return {...state, excel: {...state.excel, error: action.payload.error, loading: false }};

        case GET_APP_ENGINE_TABLE_STARTED:
            return {...state, table: {...state.table, loading: true, data: null}};
        case GET_APP_ENGINE_TABLE_SUCCESS:
            return {...state, table: {...state.table, loading: false, error: null, data: action.payload}};
        case GET_APP_ENGINE_TABLE_FAILURE:
            return {...state,table: {...state.table, loading: false, error: action.payload.error}};
        default:
            return state;
    }
};