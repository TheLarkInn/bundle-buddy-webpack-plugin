import path from 'path';
import fs from 'fs';
import { launchServer } from 'bundle-buddy/server';
import { processSourceMaps } from 'bundle-buddy/process';
import { formatProcessedSourceMaps, getWritePathForSerializedData } from 'bundle-buddy/utils';
import chalk from 'chalk';
import logoLogger from './utils';

const INVALID_SOURCEMAP_WARNING = chalk.yellow(`[BundleBuddyWebpackPlugin] WARNING: config.options.devtool was not set to 'source-map'. Enabling full sourcemaps for bundle-buddy.
  To hide this warning set {warnings: false} inside the BundleBuddyWebpackPlugin configuration options.
`);

export default class BundleBuddyWebpackPlugin {
  constructor(options) {
    const pluginOptions = Object.assign({}, options, { sam: false, warnings: true });
    this.sam = pluginOptions.sam;
    this.warnings = pluginOptions.warnings;
  }
  apply(compiler) { // eslint-disable-line
    const getUserConfigOptions = () => compiler.options;
    const isFullSourceMap = () => getUserConfigOptions().devtool === 'source-map';

    if (!isFullSourceMap()) {
      if (this.warnings) {
        console.log(INVALID_SOURCEMAP_WARNING); //eslint-disable-line
      }

      compiler.options.devtool = 'source-map'; // eslint-disable-line
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

    compiler.plugin('after-emit', (compilation, cb) => {
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

    compiler.plugin('done', () => {
      if (this.sam) {
        process.nextTick(() => {
          logoLogger();
        });
      }
      launchServer(dataPath, context);
    });
  }
}
