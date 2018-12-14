import {
    ADD_ARTICLE,
    FETCH_DATA_STARTED,
    FETCH_DATA_SUCCESS,
    FETCH_DATA_FAILURE, FETCH_APP_ENGINE_STARTED, FETCH_APP_ENGINE_FAILURE, FETCH_APP_ENGINE_SUCCESS
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

const rootReducer = (state = initialState, action) => {
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
        case FETCH_APP_ENGINE_STARTED:
            return {
                ...state,
                loading: true
            };
        case FETCH_APP_ENGINE_FAILURE:
                return {
                    ...state,
                    loading: false,
                    error: action.payload.error
                };
        case FETCH_APP_ENGINE_SUCCESS:
            return {
                ...state,
                loading: false,
                error: null,
                appEngine: action.payload
            };
        default:
            return state;
    }
};
export default rootReducer