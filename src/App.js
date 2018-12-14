import React, { Component } from 'react';
import logo from './logo.svg';
import DateComponent from './components/DateComponent/dateComponent'
import './App.css';
import ProfileComponent from './components/ProfileComponent'
import AppEngineComponent from './components/AppEngineComponent'
import { connect } from 'react-redux'

// import '@elf/elf-theme-elemental/light';


export default class App extends Component {
    constructor(props) {
        super(props);
    }

  render() {
    return (
      <div className="App">
          <DateComponent/>
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

// function mapStateToProps (state) {
//     return {
//         data: state
//     }
// }
//
// export default connect(mapStateToProps)(App);
