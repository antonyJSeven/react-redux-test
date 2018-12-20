import {FETCH_DATA_FAILURE, FETCH_DATA_STARTED, FETCH_DATA_SUCCESS} from "../constants/action-types";

export const startFetchFakeData = (number) => {
    return dispatch => {
        dispatch(startFetchData());

        fetch('https://jsonplaceholder.typicode.com/todos/' + number)
            .then(res => res.json())
            .then(res => dispatch(fetchDataSuccess(res)))
            .catch(err => dispatch(fetchDataFailure(err)))
    };
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