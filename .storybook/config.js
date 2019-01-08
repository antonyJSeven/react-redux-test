import { configure, setAddon, addDecorator } from '@storybook/react';
import JSXAddon from 'storybook-addon-jsx';
import withThemes from "storybook-addon-themes";
import { withInfo } from '@storybook/addon-info';

setAddon(JSXAddon);

function requireAll(requireContext) {
    return requireContext.keys().map(requireContext);
}

function loadStories() {
    // withInfo should be the first one only if documentation about new addon says opposite.
    addDecorator(withInfo({
        header: false,
        inline: true,
    }));
    addDecorator(withThemes([
        { name: "day", class: "theme-day", color: "#c7e7ed", default: true },
        { name: "night", class: "theme-night", color: "#080509" },
    ]));
    requireAll(require.context("..", true, /_story\.jsx?$/));
}

configure(loadStories, module);
