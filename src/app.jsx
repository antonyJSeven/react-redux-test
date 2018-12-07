// import hello from './hello.jsx'
import React from 'react';
import ReactDOM from 'react-dom';
import Hello from './Hello';



function renderApp (container) {
  ReactDOM.render(
    <Hello />,
    container
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  renderApp(container);
});

export default renderApp;
