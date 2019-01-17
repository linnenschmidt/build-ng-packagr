import { TargetSpecifier } from '@angular-devkit/architect';
import {
  TestProjectHost,
  runTargetSpec,
} from '@angular-devkit/architect/testing';
import { join, normalize, virtualFs } from '@angular-devkit/core';
import {debounceTime, map, take, tap} from 'rxjs/operators';
import * as path from 'path';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;

const devkitRoot: any = path.resolve(__dirname, '../../../../../../../');
const workspaceRoot = join(devkitRoot, 'tests/build_ng_packagr/ng-packaged/');
export const host = new TestProjectHost(workspaceRoot);

describe('NgPackagr Builder', () => {
  beforeEach(done =>
    host
      .initialize()
      .toPromise()
      .then(done, done.fail),
  );

  afterEach(done =>
    host
      .restore()
      .toPromise()
      .then(done, done.fail),
  );

  it('works', done => {
    const targetSpec: TargetSpecifier = { project: 'lib', target: 'build' };

    runTargetSpec(host, targetSpec)
      .pipe(
        tap(buildEvent => expect(buildEvent.success).toBe(true)),
        map(() => {
          const assetFile = './dist/lib/assets/main.scss';
          const exists = host.scopedSync().exists(normalize(assetFile));

          return exists;
        }),
        tap(exists => {
          expect(exists).toBe(true);
        }),
        map(() => {
          const assetFile = './dist/lib/assets/_lib.scss';
          const exists = host.scopedSync().exists(normalize(assetFile));

          return exists;
        }),
        tap(exists => {
          expect(exists).toBe(true);
        }),
        map(() => {
          const assetFile = './dist/lib/assets/some-assets/some-asset.css';
          const exists = host.scopedSync().exists(normalize(assetFile));

          return exists;
        }),
        tap(exists => {
          expect(exists).toBe(true);
        }),
        map(() => {
          const nonAssetFile = './dist/lib/assets/some-assets/some-file.txt';
          const exists = host.scopedSync().exists(normalize(nonAssetFile));

          return exists;
        }),
        tap(exists => {
          expect(exists).toBe(false);
        }),
      )
      .toPromise()
      .then(done, done.fail);
  });

  it('rebuilds on TS file changes', done => {
    const targetSpec: TargetSpecifier = { project: 'lib', target: 'build' };

    const goldenValueFiles: { [path: string]: string } = {
      'projects/lib/src/lib/lib.component.ts': `
      import { Component } from '@angular/core';
      @Component({
        selector: 'lib',
        template: 'lib update works!'
      })
      export class LibComponent { }
      `,
    };

    const overrides = { watch: true };

    let buildNumber = 0;

    runTargetSpec(host, targetSpec, overrides)
      .pipe(
        // We must debounce on watch mode because file watchers are not very accurate.
        // Changes from just before a process runs can be picked up and cause rebuilds.
        // In this case, cleanup from the test right before this one causes a few rebuilds.
        debounceTime(1000),
        tap(buildEvent => expect(buildEvent.success).toBe(true)),
        map(() => {
          const fileName = './dist/lib/fesm5/lib.js';
          const content = virtualFs.fileBufferToString(
            host.scopedSync().read(normalize(fileName)),
          );

          return content;
        }),
        tap(content => {
          buildNumber += 1;
          switch (buildNumber) {
            case 1:
              expect(content).toMatch(/lib works/);
              host.writeMultipleFiles(goldenValueFiles);
              break;

            case 2:
              expect(content).toMatch(/lib update works/);
              break;
            default:
              break;
          }
        }),
        take(2),
      )
      .toPromise()
      .then(done, done.fail);
  });

});
