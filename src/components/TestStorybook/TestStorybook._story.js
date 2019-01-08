import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, boolean } from '@storybook/addon-knobs/react';

import { TestStorybook } from './TestStorybook';

storiesOf('Test StoryBook component', module)
    .addDecorator(withKnobs)
    .addWithJSX('Empty component', () => <TestStorybook/>)
    .addWithJSX('Red Component', () => (
        <TestStorybook
            color={'red'}
            title={'Hello, background is red'}
        >
        </TestStorybook>
    ))
    .addWithJSX('Yellow component', () => (
        <TestStorybook
            color={'yellow'}
            title={'Another hello and background is yellow'}
            border={boolean('Show border', false)}
        >
        </TestStorybook>
    ));
