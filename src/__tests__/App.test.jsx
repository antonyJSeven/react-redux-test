import React from 'react';
import ReactDOM from 'react-dom';
import Hello from '../Hello';
import App from '../App';

jest.mock('react-dom', () => ({
  render: jest.fn(),
}));

// These tests aren't very good... but it gets 100% coverage. App file isn't the most testable
// because all of the functions have a lot of side effects or don't return things
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
    expect(ReactDOM.render).toBeCalledWith(<Hello name="World" />, root);
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
