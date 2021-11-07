#!/bin/bash

rm -rf dist/packages/builders

npx tsc -p packages/builders/tsconfig.json

rsync -a packages/builders/. dist/packages/builders --exclude *.ts --exclude tsconfig.json

cp LICENSE dist/packages/builders/src/build-ng-packagr/LICENSE
cp README.md dist/packages/builders/src/build-ng-packagr/README.md

echo "Build of builders finished"
