import React from 'react';
import ReactDOM from 'react-dom';
import Hello from '../Hello';
import App from '../App';

jest.mock('react-dom', () => ({
  render: jest.fn(),
}));

// global.document.addEventListener = jest.fn();
// const DOMContentLoaded_event = document.createEvent('Event')
// DOMContentLoaded_event.initEvent('DOMContentLoaded', true, true);
// window.document.dispatchEvent(DOMContentLoaded_event);
// INIT EVENT IS DEPRECIATED
// window.document.dispatchEvent(new Event("DOMContentLoaded", {
//   bubbles: true,
//   cancelable: true
// }));

// mockFn.mockClear()

// beforeEach(() => {
//   console.log('beforeEach');
// });

describe('App', () => {
  const root = document.createElement('root');
  window.domNode = root;
  document.body.appendChild(root);
  App(root);
  it('should call ReactDOM.render', () => {
    expect(ReactDOM.render).toBeCalled();
    expect(ReactDOM.render.mock.calls.length).toBe(1);
  });

  it('should call it with the correct React Element', () => {
    expect(ReactDOM.render).toBeCalledWith(<Hello />, root);
  });

  it('can also be triggered by a DOMContentLoaded', () => {
    ReactDOM.render.mockClear();
    window.document.dispatchEvent(new Event('DOMContentLoaded', {
      bubbles: true,
      cancelable: true
    }));
    expect(ReactDOM.render.mock.calls.length).toBe(1);
  });
});
