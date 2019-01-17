#!/bin/bash

npm run build
npx jasmine dist/packages/builders/**/*.spec.js

echo "Test of builders finished"
