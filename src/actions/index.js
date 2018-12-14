import axios from 'axios'
import {
    ADD_ARTICLE,
    FETCH_DATA_STARTED,
    FETCH_DATA_SUCCESS,
    FETCH_DATA_FAILURE, FETCH_APP_ENGINE_STARTED, FETCH_APP_ENGINE_SUCCESS, FETCH_APP_ENGINE_FAILURE
} from "../constants/action-types";
import {requestService} from "../services/request";
import {ADCRequest} from "../services/requestData";

export const addArticle = article => ({ type: ADD_ARTICLE, payload: article });

export const startFetchFakeData = (number) => {
    return dispatch => {
        dispatch(startFetchData());

        fetch('https://jsonplaceholder.typicode.com/todos/' + number)
            .then(res => res.json())
            .then(res => dispatch(fetchDataSuccess(res)))
            .catch(err => dispatch(fetchDataFailure(err)))
    };
};

export const startFetchAppEngineData = () => {
    return dispatch => {
        dispatch(startFetchAppEngine);
        const request = new requestService();

        const requestData = ADCRequest('TR.F.ASRIncomeStatement', 'CAIV.VI', 'Row,  LiName');

        request.postExcel().then(res => console.log(res));

        // request.sendRequest(requestData).then(res => console.log('this is the res--->',res));

        return request.sendRequest(requestData)
            .then(res => dispatch(fetchAppEngineSuccess(res)))
            .catch(err => dispatch(fetchAppEngineFailure(err)));
    }
};

const fetchDataSuccess = todo => ({
    type: FETCH_DATA_SUCCESS,
    payload: todo
});

const startFetchData = () => ({
    type: FETCH_DATA_STARTED
});

const fetchDataFailure = error => ({
    type: FETCH_DATA_FAILURE,
    payload: {
        error
    }
});

const fetchAppEngineFailure = err => ({
    type: FETCH_APP_ENGINE_FAILURE,
    payload: err
});

const fetchAppEngineSuccess = data => ({
    type: FETCH_APP_ENGINE_SUCCESS,
    payload: data
});

const startFetchAppEngine = () => ({
    type: FETCH_APP_ENGINE_STARTED
});