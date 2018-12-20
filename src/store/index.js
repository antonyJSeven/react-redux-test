import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { rootReducer } from './reducers';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

export const configureStore = () => {
    return createStoreWithMiddleware(
        rootReducer,
        window.__REDUX_DEVTOOLS_EXTENSION__&&  window.__REDUX_DEVTOOLS_EXTENSION__()
    );
};
