import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux'
import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk';
import rootReducer from "./reducers";

import { composeWithDevTools } from 'redux-devtools-extension';

import App from './App';

// import registerServiceWorker from './registerServiceWorker';

const middleware = () => applyMiddleware(thunk);

 // const store = compose(window.devToolsExtension ? window.devToolsExtension() : f => f)(createStore)(rootReducer)(middleware);
// const store = createStore(rootReducer, applyMiddleware(thunk));

const store = createStore(rootReducer, composeWithDevTools(
    applyMiddleware(thunk),
    // other store enhancers if any
));

ReactDOM.render(<Provider store={store}>
        <App/>
    </Provider>
    , document.getElementById('root'));
// registerServiceWorker();