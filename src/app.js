// import hello from './hello.jsx'
import React from 'react';
import ReactDOM from 'react-dom';
import Hello from './hello';

document.addEventListener('DOMContentLoaded',() => {
  ReactDOM.render(
    <Hello />,
    document.getElementById('root')
  );
});
