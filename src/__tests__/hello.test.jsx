import { shallow } from 'enzyme';
import React from 'react';
import Hello from '../Hello';

describe('Hello', () => {
  it('should render with the prop', () => {
    const wrapper = shallow(<Hello name="World" />);
    expect(wrapper.text()).toEqual('Hello World');
  });

  it('should render without a prop', () => {
    const wrapper = shallow(<Hello />);
    expect(wrapper.text()).toEqual('Hello');
  });
});
