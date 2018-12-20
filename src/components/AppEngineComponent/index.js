import React, { Component } from 'react';
import { connect } from 'react-redux';
import './index.css';

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/elf-theme-elemental/light/coral-button';
import {appEngineAction, commonAction} from "../../actions";

class AppEngineComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userIdValue: ''
        }
    }

    updateUserIdValue = e => {
        this.setState({userIdValue: e.target.value})
    };

    render() {
        return (
            <div className="appEngine">
                <h3>Hello from App Engine Component</h3>
                <coral-button onClick={this.props.fetchAppEngineTable}>
                    {this.props.appEngine.table.loading ? 'Loading' : 'send request to AppEngine'}
                </coral-button>
                {this.props.appEngine.table.data && <p>the list of 'LiName' from 'CAIV.VI'</p>}
                {this.props.appEngine.table.data && this.props.appEngine.table.data.r[0].map((elem, i) => {
                    return <span key={i}>{elem.v}</span>
                })}
                <coral-button onClick={this.props.postExcel}>{this.props.appEngine.excel.loading ? 'Loading' : 'post Excel'}</coral-button>
                <div>
                    <input onChange={this.updateUserIdValue} type="text"/>
                    <coral-button onCLick={() => this.props.getUser(this.state.userIdValue)}> get User</coral-button>
                </div>
            </div>
        )
    }
}

const mapStateToProps = function(state) {
    return {
        appEngine: state.appEngine
    }
};

const mapDispatchToProps = dispatch => {
    return {
        fetchFakeData:  () => dispatch(commonAction.startFetchFakeData(Math.round((Math.random() * 10) + 1))),
        fetchAppEngineTable: () => dispatch(appEngineAction.startFetchAppEngineTable()),
        postExcel:      () => dispatch(appEngineAction.postExcel()),
        getUser:        id => dispatch(appEngineAction.getUser(id))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(AppEngineComponent);
