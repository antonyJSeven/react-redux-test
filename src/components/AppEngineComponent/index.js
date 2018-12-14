import React, { Component } from 'react';
import { connect } from 'react-redux';
import './index.css';

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/elf-theme-elemental/light/coral-button';
import {startFetchFakeData, startFetchAppEngineData} from "../../actions";

class AppEngineComponent extends Component {

    render() {
        return (
            <div className="appEngine">
                <h3>Hello from App Engine Component</h3>
                <coral-button onClick={this.props.fetchAppEngine}>send request to AppEngine</coral-button>
                {this.props.appEngine && <p>the list of 'LiName' from 'CAIV.VI'</p>}
                {this.props.appEngine && this.props.appEngine.r[0].map((elem, i) => {
                    return <span key={i}>{elem.v}</span>
                })}
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
        fetchFakeData: () => {
            dispatch(startFetchFakeData(Math.round((Math.random() * 10) + 1)));
        },
        fetchAppEngine: () => { dispatch(startFetchAppEngineData())}
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(AppEngineComponent);
