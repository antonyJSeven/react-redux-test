import {
    ADD_ARTICLE,
    FETCH_DATA_STARTED, FETCH_DATA_SUCCESS, FETCH_DATA_FAILURE,
    GET_APP_ENGINE_TABLE_STARTED, GET_APP_ENGINE_TABLE_SUCCESS, GET_APP_ENGINE_TABLE_FAILURE, POST_EXCEL_STARTED
} from "../constants/action-types";
import {requestService} from "../services/request";
import {ADCRequest} from "../services/requestData";

import * as appEngineAction from './appEngine';
import * as commonAction from './common';

export {
    appEngineAction,
    commonAction

}

// export const addArticle = article => ({ type: ADD_ARTICLE, payload: article });

// export const startFetchFakeData = (number) => {
//     return dispatch => {
//         dispatch(startFetchData());
//
//         fetch('https://jsonplaceholder.typicode.com/todos/' + number)
//             .then(res => res.json())
//             .then(res => dispatch(fetchDataSuccess(res)))
//             .catch(err => dispatch(fetchDataFailure(err)))
//     };
// };
//
// export const startFetchAppEngineTable = () => {
//     return dispatch => {
//         dispatch(getAppEngineTable);
//         const request = new requestService();
//
//         const requestData = ADCRequest('TR.F.ASRIncomeStatement', 'CAIV.VI', 'Row,  LiName');
//
//         request.fetchUserById('PAXTRA80584');
//
//         // request.postExcel().then(res => console.log(res));
//
//         // request.sendRequest(requestData).then(res => console.log('this is the res--->',res));
//
//         return request.sendRequest(requestData)
//             .then(res => dispatch(getAppEngineTableSuccess(res)))
//             .catch(err => dispatch(getAppEngineTableFailure(err)));
//     }
// };
//
// const fetchDataSuccess = todo => ({
//     type: FETCH_DATA_SUCCESS,
//     payload: todo
// });
//
// const startFetchData = () => ({
//     type: FETCH_DATA_STARTED
// });
//
// const fetchDataFailure = error => ({
//     type: FETCH_DATA_FAILURE,
//     payload: {
//         error
//     }
// });
//
// const getAppEngineTableFailure = err => ({
//     type: GET_APP_ENGINE_TABLE_FAILURE,
//     payload: err
// });
//
// const getAppEngineTableSuccess = data => ({
//     type: GET_APP_ENGINE_TABLE_SUCCESS,
//     payload: data
// });
//
// const getAppEngineTable = () => ({
//     type: GET_APP_ENGINE_TABLE_STARTED
// });
//
// const startPostExcel = () => ({
//     type: POST_EXCEL_STARTED
// });