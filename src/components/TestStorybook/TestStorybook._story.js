import React from 'react';
import {TestStorybook} from "./TestStorybook";
import { storiesOf } from '@storybook/react';
import { withKnobs, boolean} from '@storybook/addon-knobs/react';

const stories = storiesOf('Test StoryBook component', module);
stories.addDecorator(withKnobs);

stories
    .addWithJSX('Empty component', () =>
        <TestStorybook></TestStorybook>
        )
    .addWithJSX('Red Component', () => (
        <TestStorybook color={'red'}
                       title={'Hello, background is red'}>
        </TestStorybook>
    ))
    .addWithJSX('Yellow component', () => (
        <TestStorybook color={'yellow'}
                       title={'Another hello and background is yellow'}
                       border={boolean('Show border', false)}>
        </TestStorybook>
    ));
