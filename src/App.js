import React, { Component } from 'react';
import logo from './logo.svg';
import DateComponent from './components/DateComponent/dateComponent'
import './App.css';
import ProfileComponent from './components/ProfileComponent'
import AppEngineComponent from './components/AppEngineComponent'

import 'jet-api';

export const JET = window.JET;


export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {count: 0};
    }

    startJet = () => new Promise((res, rej) => {
        console.log(JET);
        JET.init({ID: 'TestAZ'});
        JET.onLoad(() => {
            alert('JET HAS BEEN SUCCESSFULLY LOADED');
            JET.getUserInfo().then(res => console.log(res));
        });
        res();
    });

    componentDidMount() {
        this.startJet()
            .then(res => console.log('>>>>>>>>>>>>>>>EVERYTHING HAS STARTED<<<<<<<<<<<<<<<'))
            .catch(err => console.log('>>>>>>>>>>>>>>>ERROR OCCURED<<<<<<<<<<<<<<<', err))
    }

  render() {
    return (
      <div className="App">
          <DateComponent
              plusCount={() => this.setState({count: this.state.count + 1 },
                  () => console.log('the new value is ', this.state.count))}
              minusCount={() => this.setState({count: this.state.count - 1 },
                  () => console.log('the new value is ', this.state.count))}
              count={this.state.count}
          >
              <h1>H1 test</h1>
              <h2>H2 test</h2>
          </DateComponent>
          <ProfileComponent/>
          <AppEngineComponent/>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}
