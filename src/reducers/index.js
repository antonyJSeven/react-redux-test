import { mainReducer as common }  from "./main";
import { appEngineReducer as appEngine } from './appEngine'
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
    common,
    appEngine,
});

export default rootReducer