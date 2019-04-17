/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext, BuilderOutput, BuilderRun, createBuilder } from '@angular-devkit/architect';
import { Observable, from } from 'rxjs';
import {catchError, mapTo, switchMap} from 'rxjs/operators';
import { Schema as NgPackagrBuilderOptions } from './schema';

async function scheduleBuildNgPackagr(
  options: NgPackagrBuilderOptions,
  context: BuilderContext,
): Promise<BuilderRun> {
  const buildNgPackagrOptions = {
    project: options.project,
    tsConfig: options.tsConfig,
    watch: options.watch
  };

  return context.scheduleBuilder('@angular-devkit/build-ng-packagr:build', buildNgPackagrOptions);
}

export function execute(
  options: NgPackagrBuilderOptions,
  context: BuilderContext,
): Observable<BuilderOutput> {
  return from(scheduleBuildNgPackagr(options, context)).pipe(
    switchMap(buildNgPackagr => buildNgPackagr.result),
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);

      return [{ success: false }];
    }),
  );
}

export { NgPackagrBuilderOptions };
export default createBuilder<Record<string, string> & NgPackagrBuilderOptions>(execute);
