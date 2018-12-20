import {
    GET_APP_ENGINE_TABLE_FAILURE,
    GET_APP_ENGINE_TABLE_STARTED,
    GET_APP_ENGINE_TABLE_SUCCESS,
    GET_APP_ENGINE_USER_STARTED,
    POST_EXCEL_FAILURE,
    POST_EXCEL_STARTED,
    POST_EXCEL_SUCCESS
} from "../constants/action-types";
import {requestService} from "../services/request";
import {ADCRequest} from "../services/requestData";

const request = new requestService();

export const startFetchAppEngineTable = () => {
    return dispatch => {
        dispatch(getAppEngineTable());

        const requestData = ADCRequest('TR.F.ASRIncomeStatement', 'CAIV.VI', 'Row,  LiName');

        // request.fetchUserById('PAXTRA80584');

        // request.postExcel().then(res => console.log(res));


        return request.sendRequest(requestData)
            .then(res => dispatch(getAppEngineTableSuccess(res)))
            .catch(err => dispatch(getAppEngineTableFailure(err)));
    }
};

export const postExcel = () => dispatch => {
    dispatch(postExcelStarted());

    return request.postExcel()
        .then(res => dispatch(postExcelSuccess(res)))
        .catch(err => dispatch(postExcelFailure(err)))
};

export const getUser = id => dispatch => {
    dispatch(getAppEngineUserStarted());

    return request.fetchUserById(id) // 'PAXTRA80584'
        .then(res => getAppEngineUserSuccess(res))
        .catch(err => getAppEngineUserFailure(err))
};


const getAppEngineTableFailure = err => ({
    type: GET_APP_ENGINE_TABLE_FAILURE,
    payload: err
});

const getAppEngineTableSuccess = data => ({
    type: GET_APP_ENGINE_TABLE_SUCCESS,
    payload: data
});

const getAppEngineTable = () => ({
    type: GET_APP_ENGINE_TABLE_STARTED
});

const postExcelStarted = () => ({
    type: POST_EXCEL_STARTED
});

const postExcelSuccess = data => ({
    type: POST_EXCEL_SUCCESS,
    payload: data
});

const postExcelFailure = err => ({
    type: POST_EXCEL_FAILURE,
    payload: err
});

const getAppEngineUserStarted = () => ({
    type: GET_APP_ENGINE_USER_STARTED
});

const getAppEngineUserSuccess = data => ({
    type: GET_APP_ENGINE_USER_STARTED,
    payload: data
});

const getAppEngineUserFailure = err => ({
    type: GET_APP_ENGINE_USER_STARTED,
    payload: err
});