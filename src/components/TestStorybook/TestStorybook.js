import React from 'react'
import PropTypes from 'prop-types'

export const TestStorybook = ({color, title, border}) => (
    <button style={{background:color, border: border ? '3px solid black' : null}}>
        {title}
    </button>
);

TestStorybook.propTypes = {
    background: PropTypes.string,
    title: PropTypes.string,
    border: PropTypes.bool
};

TestStorybook.defaultProps = {
    title: 'No title has been received'
};

