#!/bin/bash

rm -rf dist/packages/builders

tsc -p packages/builders/tsconfig.json

rsync -a packages/builders/. dist/packages/builders --exclude *.ts --exclude tsconfig.json

echo "Build of builders finished"
