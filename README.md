This is the start of the Hello World repository for EM Luna aka Eikon Messenger 2.0.

# Instructions

1. clone the repo locally
2. npm install
3. npm run build

This repo does not CURRENTLY require any server. It is simply a flat file execution.
file://em-luna/index.html

# Decisions Making Process
This is designed to be the simplest, dependency free, version of the client we can come up with. The javascript community moves very quickly with lots opinions and we have our own. We are trying to keep things simple with pieces we understand and with as few black boxes as possible. In certain instances this might result in additional developer overhead but will give us more flexibility in the future.

# Explaining dependencies
* Babel and its plugins: Convert modern (ES6+ javascript) and JSX code to ES5 for native support.
* ESLint: The defactor linting tool for JS. Used to make sure we all follow the same JS style guides (semicolons, prefer const, etc)
* Flow: Our currently suggested strong typing check. This will make catching bugs easier and help make Pull Requests more legible. We like that it doesn't add another language to our project and is just for the type checking.
* Husky: Normalize git hooks across a team. Allows us to add pre-commit and pre-push hooks to run tests, lint, etc
* Jest: Our preferred testing library for testing all JS including React
* Enzyme: A nice compliment to Jest for testing React components
* React: Our UI Library of choice
* Redux: Our State library of choice
* React-Redux: Stitch together React and Redux!
* Webpack: Used to bundle all of our JS into a single file. Trying to keep its responsibilities to the minimum.
* Watch: Run npm tasks when source files change.
Less: Out CSS extensions of choice. Mostly because our internal (Refinitiv) Element Library is built using it.

# Questions
* Q: Why no webpack-dev-server?
* A: We don't need it. Webpack is an excellent tool for bundling javascript but we don't want to put too many eggs in one basket. See old build tools such as grunt, gulp and the world of plugins that had to be kept up to date.
* 

