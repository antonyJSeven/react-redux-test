import React, { Children } from 'react';
import './style.css'

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/coral-input'; // Element
import '@elf/elf-theme-elemental/light/coral-button';
import '@elf/elf-theme-elemental/light/coral-input';

import ChartComponent from '../ChartComponent'

export default class DateComponent extends React.Component {

    constructor(props) {
        super(props);

        console.log('this.props.children', this.props.children);

        this.state = {
            time: new Date().toLocaleTimeString(),
            chartConfig: {
                type: 'line',
                data: {
                    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                    datasets: [{
                        label: 'Price',
                        data: [37.4, 36.6, 40.48, 41.13, 42.05, 40.42, 43.09]
                    }]
                },
                options: {
                    title: {
                        text: 'Line chart'
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        yAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: 'Price ($)'
                            }
                        }]
                    },
                    tooltips: {
                        callbacks: {
                            label: function (tooltipItem, data) {
                                return tooltipItem.yLabel + ' $';
                            }
                        }
                    }
                }
            }
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
        const { count, plusCount, minusCount } = this.props;
        const mapChildren = (<div className="azaza">
            {Children.map(this.props.children, elem => (<elem.type>{elem.props.children}</elem.type>))}
        </div>);
        return (
            <div className="test">
                <ChartComponent chartConfig={this.state.chartConfig}/>
                <h3>This is test react component</h3>
                <div>
                    {mapChildren}
                    {this.props.children}
                </div>
                <div>
                    <button onClick={plusCount}>plusCount</button>
                    <span>{count}</span>
                    <button onClick={minusCount}>minusCount</button>
                </div>
                <coral-input icon="bubble" placeholder={this.state.time}></coral-input>
            </div>
        );
    }
}