// import hello from './hello.jsx'
import React from 'react';
import ReactDOM from 'react-dom';
import Hello from './Hello';

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Hello name="Lex" />,
    document.getElementById('root')
  );
});
