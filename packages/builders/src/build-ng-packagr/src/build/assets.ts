import { BuilderContext } from '@angular-devkit/architect';
import { getSystemPath, normalize, resolve, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import * as fs from 'fs';
import * as globby from 'globby';
import { discoverPackages } from 'ng-packagr/lib/ng-package/discover-packages';
import * as log from 'ng-packagr/lib/utils/log';
import * as path from 'path';
import { Observable, from } from 'rxjs';
import { AssetPattern, normalizeAssetPatterns } from './assets-patterns';
import { AssetPatternClass, Schema as NgPackagrBuilderOptions } from './schema';

export function handleAssets(
  context: BuilderContext,
  options: NgPackagrBuilderOptions,
): Observable<any> {
  const host = new NodeJsSyncHost();
  const projectPath = resolve(normalize(context.workspaceRoot), normalize(path.dirname(options.project)));
  const projectRoot = getSystemPath(projectPath);

  return from(discoverPackages({ project: projectRoot }).then(ngPackage => {
    log.info('Copying Assets');
    const syncHost = new virtualFs.SyncDelegateHost(host);

    if (options.assets.length === 0) {
      return Promise.resolve();
    }

    const assets = normalizeAssetPatterns(
      options.assets,
      syncHost,
      projectPath,
      projectPath,
      undefined,
    );

    return moveAssets(ngPackage.src, ngPackage.dest, assets);
  }));
}

/**
 *
 * @see https://github.com/angular/angular-cli/blob/29609fb0785646fdbb636b08853a13df65fac06a/packages/angular_devkit/build_angular/src/angular-cli-files/models/webpack-configs/common.ts#L160-L188
 */
function moveAssets(
  src: string,
  dest: string,
  assets: AssetPattern[],
): Promise<any> {
  try {
    const copyWebpackPluginPatterns = assets.map(
      (asset: AssetPatternClass) => {
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
