import React, { Component } from 'react';
import { connect } from 'react-redux';
import './index.css';

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/elf-theme-elemental/light/coral-button';
import {commonAction} from "../../actions";

class ProfileComponent extends Component {

    responseItems = () => this.props.response ? Object.values(this.props.response).map((elem, i) =>
        <span key={i}>{elem}</span>
    ) : null;

    render() {
        console.log('ProfileComponent props----->',this.props);
        return (
            <div className="profile">
                <h3>Hello from Profile Component</h3>
            <coral-button onClick={this.props.fetchFakeData}>send request to jsonplaceholder API</coral-button>
                {this.props.response && <div>response: {this.responseItems()}</div>}
           <pre>this.props.profile: {this.props.profile.name}</pre>
            </div>
        )
    }
}

const mapStateToProps = function(state) {
    return {
        profile: state.common.profile,
        response: state.common.response
    }
};

const mapDispatchToProps = dispatch => {
    return {
        fetchFakeData: () => {
            dispatch(commonAction.startFetchFakeData(Math.round((Math.random() * 10) + 1)));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfileComponent);
