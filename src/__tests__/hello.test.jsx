// setup file
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import Hello from '../Hello';

configure({ adapter: new Adapter() });

describe('Hello', () => {
  it('should render with the prop', () => {
    const wrapper = shallow(<Hello name="World" />);
    expect(wrapper.text()).toEqual('Hello World');
  });
});
