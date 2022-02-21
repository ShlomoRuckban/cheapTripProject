import {combineReducers} from 'redux';
import appStateReducer from './AppStateReducer/AppStateReducer'
export default combineReducers({
   appState:appStateReducer
});