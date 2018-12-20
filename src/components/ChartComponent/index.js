import './index.css';
import '@elf/polyfills';
import React, { Component } from 'react';
import '@elf/sapphire-chart';

export default class ChartComponent extends Component {

    constructor(props) {
        super(props);
        this.chartRef = React.createRef();
    }

    componentDidMount () {
        this.chartRef.current['config'] = {...this.props.chartConfig};
    }

    render() {
        return <sapphire-chart ref={this.chartRef} ></sapphire-chart>;
    }
}