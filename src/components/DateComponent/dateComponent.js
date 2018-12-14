import React from 'react';
import './style.css'

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/coral-input'; // Element
import '@elf/elf-theme-elemental/light/coral-button';
import '@elf/elf-theme-elemental/light/coral-input';

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
        setInterval( () => {
            this.setState({time : new Date().toLocaleTimeString()});
        }, 1000)
    };

    render() {
        return (
            <div className="test">
                <h3>This is test react component</h3>
                <coral-input icon="bubble" placeholder={this.state.time}></coral-input>
            </div>
        );
    }
}