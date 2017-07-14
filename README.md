# bundle-buddy-webpack-plugin
[![npm](https://badge.fury.io/js/bundle-buddy-webpack-plugin.svg)](https://badge.fury.io/js/bundle-buddy-webpack-plugin)
[![dependencies](https://david-dm.org/TheLarkInn/bundle-buddy-webpack-plugin.svg)](https://david-dm.org/thelarkinn/bundle-buddy-webpack-plugin)
[![devDependencies Status](https://david-dm.org/thelarkinn/bundle-buddy-webpack-plugin/dev-status.svg)](https://david-dm.org/thelarkinn/bundle-buddy-webpack-plugin?type=dev)
<a href="https://medium.com/friendship-dot-js/i-peeked-into-my-node-modules-directory-and-you-wont-believe-what-happened-next-b89f63d21558"><img alt="Business Strategy Status" src="https://img.shields.io/badge/business%20model-flavortown-green.svg"></a>

Your favorite [bundle-buddy](https://github.com/samccone/bundle-buddy) duplication analyzer, made as a webpack plugin.

## Installation

### Yarn

```bash
yarn add bundle-buddy-webpack-plugin --dev
```

### npm

```bash
npm install bundle-buddy-webpack-plugin --save-dev
```

## Usage
Just require the plugin into your webpack configuration, and pass it to the `plugins` array.

**webpack.config.js**

```javascript
const BundleBuddyWebpackPlugin = require("bundle-buddy-webpack-plugin");

module.exports = {
  // ...
  plugins: [
    new BundleBuddyWebpackPlugin({sam: true})
  ]

};
```

<h2 align="center">Options</h2>

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| warnings | boolean | true | Show/Hide warnings. BundleBuddyWebpackPlugin will emit a warning when you do not have the `devtool` property set in your configuration. And will notify you that it is setting it to "source-map". |


## Bugs
If you believe there is an issue with the plugin itself, by all mean submit an issue!!! However this directly uses [bundle-buddy](https://github.com/samccone/bundle-buddy) and I would also verify that it is not an issue reported there first.
