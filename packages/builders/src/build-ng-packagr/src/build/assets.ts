import {
  BuilderContext,
  BuilderConfiguration,
} from '@angular-devkit/architect';
import { resolve, virtualFs } from '@angular-devkit/core';
import * as fs from 'fs';
import * as globby from 'globby';
import { discoverPackages } from 'ng-packagr/lib/ng-v5/discover-packages';
import * as log from 'ng-packagr/lib/util/log';
import * as path from 'path';
import { NgPackagrBuilderOptions } from './index';
import {AssetPattern, AssetPatternObject, normalizeAssetPatterns} from './assets-patterns';

export function handleAssets(
  context: BuilderContext,
  packageJsonPath: string,
  builderConfig: BuilderConfiguration<NgPackagrBuilderOptions>,
): Promise<any> {
  return discoverPackages({ project: packageJsonPath }).then(ngPackage => {
    log.info('Copying Assets');

    const { options } = builderConfig;
    const projectRoot = resolve(context.workspace.root, builderConfig.root);
    const syncHost = new virtualFs.SyncDelegateHost(context.host);

    if (options.assets.length === 0) {
      return Promise.resolve();
    }

    const assets = normalizeAssetPatterns(
      options.assets,
      syncHost,
      projectRoot,
      projectRoot,
      undefined,
    );

    return moveAssets(ngPackage.src, ngPackage.dest, assets);
  });
}

/**
 *
 * @see https://github.com/angular/angular-cli/blob/18566b0442510e92ae6dcdd358a70e9cf213ddeb/packages/angular_devkit/build_angular/src/angular-cli-files/models/webpack-configs/common.ts#L121-L149
 */
function moveAssets(
  src: string,
  dest: string,
  assets: AssetPattern[],
): Promise<any> {
  try {
    const copyWebpackPluginPatterns = assets.map(
      (asset: AssetPatternObject) => {
        // Resolve input paths relative to workspace root and add slash at the end.
        asset.input = path.resolve(src, asset.input).replace(/\\/g, '/');
        asset.input = asset.input.endsWith('/')
          ? asset.input
          : asset.input + '/';
        asset.output = asset.output.endsWith('/')
          ? asset.output
          : asset.output + '/';

        if (asset.output.startsWith('..')) {
          const message =
            'An asset cannot be written to a location outside of the output path.';
          throw new Error(message);
        }

        return {
          context: asset.input,
          // Now we remove starting slash to make Webpack place it from the output root.
          to: asset.output.replace(/^\//, ''),
          ignore: asset.ignore,
          from: {
            glob: asset.glob,
            dot: true,
          },
        };
      },
    );

    const copyPromises = copyWebpackPluginPatterns.map(rule => {
      const pattern = rule.context + rule.from.glob;

      return globby(pattern, { dot: rule.from.dot }).then(entries => {
        entries.forEach(entry => {
          const cleanFilePath = entry.replace(rule.context, '');
          const to = path.resolve(dest, rule.to, cleanFilePath);
          const pathToFolder = path.dirname(to);
          pathToFolder.split(path.sep).reduce((p, folder) => {
            p += folder + path.sep;
            if (!fs.existsSync(p)) {
              fs.mkdirSync(p);
            }
            return p;
          }, '');

          fs.copyFileSync(entry, to);
          log.success(` - from: ${entry}`);
          log.success(` - to: ${to}`);
        });
      });
    });

    return Promise.all(copyPromises);
  } catch (e) {
    log.error(e.message);
    return Promise.resolve();
  }
}
