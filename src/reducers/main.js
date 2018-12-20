import {
    ADD_ARTICLE, GET_APP_ENGINE_TABLE_FAILURE,
    GET_APP_ENGINE_TABLE_STARTED, GET_APP_ENGINE_TABLE_SUCCESS,
    FETCH_DATA_FAILURE,
    FETCH_DATA_STARTED,
    FETCH_DATA_SUCCESS
} from "../constants/action-types";

const initialState = {
    articles: [],
    clickText: 'Click me',
    response: '',
    loading: false,
    profile: {
        name: 'Antony',
        age: 26
    }
};

export const mainReducer = (state = initialState, action) => {
    switch (action.type) {
        case ADD_ARTICLE:
            return {...state, articles: [...state.articles, action.payload]};
        case FETCH_DATA_STARTED:
            return {
                ...state,
                loading: true
            };
        case FETCH_DATA_SUCCESS:
            return {
                ...state,
                loading: false,
                error: null,
                response: action.payload
            };
        case FETCH_DATA_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error
            };
        // case GET_APP_ENGINE_TABLE_STARTED:
        //     return {
        //         ...state,
        //         loading: true
        //     };
        // case GET_APP_ENGINE_TABLE_FAILURE:
        //     return {
        //         ...state,
        //         loading: false,
        //         error: action.payload.error
        //     };
        // case GET_APP_ENGINE_TABLE_SUCCESS:
        //     return {
        //         ...state,
        //         loading: false,
        //         error: null,
        //         appEngine: action.payload
        //     };
        default:
            return state;
    }
};