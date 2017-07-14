import path from 'path';
import fs from 'fs';
import { launchServer } from 'bundle-buddy/server';
import { processSourceMaps } from 'bundle-buddy/process';
import { formatProcessedSourceMaps, getWritePathForSerializedData } from 'bundle-buddy/utils';
import logoLogger from './utils';

export default class BundleBuddyWebpackPlugin {
  constructor(options) {
    const pluginOptions = Object.assign({}, options, { sam: true });
    this.sam = pluginOptions.sam;
  }
  apply(compiler) { // eslint-disable-line
    const getOutDirFor = (compilation) => {
      const { options } = compilation;
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
      // debugger;
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
