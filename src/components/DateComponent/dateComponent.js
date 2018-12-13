import React from 'react';
import './style.css'

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/coral-input'; // Element
import '@elf/elf-theme-elemental/light/coral-button';
// import '@elf/elf-theme-elemental/light/coral-input';

export default class DateComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            time: new Date().toLocaleTimeString()
        };
        this.startTimer();
    }

    startTimer = () => {
        console.log('props in DateComponent',this.props);
        // console.log(this.props.store.getState());
        setInterval( () => {
            this.setState({time : new Date().toLocaleTimeString()});
        }, 1000)
    };

    render() {
        return (
            <div className="date">
                <input type="text" placeholder={this.state.time}/>
                <coral-input icon="bubble" placeholder={this.state.time}></coral-input>
                <coral-button>try try try</coral-button>
            </div>
        );
    }
}