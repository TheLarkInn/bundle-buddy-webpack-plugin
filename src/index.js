import path from 'path';
import fs from 'fs';
import { launchServer } from 'bundle-buddy/server';
import { processSourceMaps } from 'bundle-buddy/process';
import { formatProcessedSourceMaps, getWritePathForSerializedData } from 'bundle-buddy/utils';
import chalk from 'chalk';
import logoLogger from './utils';

const HIDDEN_WARNING_INFO_FOOTER = 'To hide this warning set {warnings: false} inside the BundleBuddyWebpackPlugin configuration options.';
const INVALID_SOURCEMAP_WARNING = chalk.yellow(`[BundleBuddyWebpackPlugin] WARNING: config.options.devtool was not set to 'source-map'. Enabling full sourcemaps for bundle-buddy.
  ${HIDDEN_WARNING_INFO_FOOTER}
`);
const UGLIFYJS_WEBPACK_PLUGIN_WARNING = chalk.yellow(`[BundleBuddyWebpackPlugin] WARNING: UglifyJsWebpackPlugin has been detected.
  Setting {sourceMap: true} for UglifyJsWebpackPlugin options to ensure that sourcemaps are generated. bundle-buddy will fail if it this setting is not enabled.
  ${HIDDEN_WARNING_INFO_FOOTER}
`);

const UGLIFY_NAME_REGEX = /uglify/i;

export default class BundleBuddyWebpackPlugin {
  constructor(options) {
    const pluginOptions = Object.assign({ sam: false, warnings: true }, options);
    this.sam = pluginOptions.sam;
    this.warnings = pluginOptions.warnings;
  }

  apply(compiler) { // eslint-disable-line
    const getUserConfigOptions = () => compiler.options;
    const isFullSourceMap = () => getUserConfigOptions().devtool === 'source-map';
    const hasUglyJsPlugin = () => getUserConfigOptions().plugins.some(plugin => UGLIFY_NAME_REGEX.test(plugin.constructor.name));

    if (!isFullSourceMap()) {
      if (this.warnings) {
        console.log(INVALID_SOURCEMAP_WARNING); //eslint-disable-line
      }

      compiler.options.devtool = 'source-map'; // eslint-disable-line
    }

    if (hasUglyJsPlugin()) {
      const uglifyPluginOptions = getUserConfigOptions().plugins.find(plugin => UGLIFY_NAME_REGEX.test(plugin.constructor.name)).options;
      const { sourceMap } = uglifyPluginOptions;
      if (!sourceMap && this.warnings) {
        console.log(UGLIFYJS_WEBPACK_PLUGIN_WARNING); // eslint-disable-line
        uglifyPluginOptions.sourceMap = true;
      }
    }

    const getOutDirFor = () => {
      const options = getUserConfigOptions();
      const outDir = options.output.path;
      return outDir;
    };

    const ensureDirectoryExistence = (filePath) => {
      const dirname = path.dirname(filePath);
      if (fs.existsSync(dirname)) {
        return true;
      }

      ensureDirectoryExistence(dirname);
      fs.mkdirSync(dirname);
      return true;
    };

    const getSourceMapNamesFrom = (compilation) => {
      const { assets } = compilation;
      const outDir = getOutDirFor(compilation);

      return Object.keys(assets)
        .filter(assetName => assetName.endsWith('.map'))
        .map(assetName => `${outDir}/${assetName}`);
    };

    let stringifedData;
    let dataPath;
    let context;

    const hookAfterEmit = compiler.hooks ? cb => compiler.hooks.afterEmit.tapAsync('BundleBuddyWebpackPlugin', cb) : cb => compiler.plugin('after-emit', cb);

    hookAfterEmit((compilation, cb) => {
      const maps = getSourceMapNamesFrom(compilation);
      const processed = processSourceMaps(maps);
      stringifedData = formatProcessedSourceMaps(processed);
      dataPath = `data_${Date.now()}`;
      context = path.resolve('./', 'node_modules', 'bundle-buddy');
      const writePath = getWritePathForSerializedData(dataPath, context);

      ensureDirectoryExistence(writePath);
      fs.writeFileSync(writePath, stringifedData);
      cb();
    });

    const hookDone = compiler.hooks ? cb => compiler.hooks.done.tap('BundleBuddyWebpackServer', cb) : cb => compiler.plugin('done', cb);

    hookDone(() => {
      if (this.sam) {
        process.nextTick(() => {
          logoLogger();
        });
      }
      launchServer(dataPath, context);
    });
  }
}
