# Angular Build Architect for ng-packagr with asset handling

The default Angular build architect _@angular-devkit/build-ng-packagr_ for ng-packagr doesn't copy assets of libraries.
Most library projects have assets which was mentioned here
[/angular/angular-cli/issues/11071](https://github.com/angular/angular-cli/issues/11071#issuecomment-451271094).

This Angular Build Architect solves the known issue of _@angular-devkit/build-ng-packagr_ even if you only copy assets.

## How to install

Install `@linnenschmidt/build-ng-packagr` into your angular project.
```bash
npm install @linnenschmidt/build-ng-packagr --save-dev
```
or
```bash
yarn add @linnenschmidt/build-ng-packagr --dev
```

## How to use

1. Replace the build architect of your libraries by  `@linnenschmidt/build-ng-packagr:build`.
    ```json
   "architect": {
     "build": {
       "builder": "@linnenschmidt/build-ng-packagr:build",
    ```
2. Add your assets glob rules to the options section like as you normally do for apps
    ```json
   "options": {
     "project": "projects/lib/ng-package.json",
     "tsConfig": "projects/lib/tsconfig.lib.json",
     "assets": [
       "src/assets",
       {
         "glob": "**/*.css",
         "input": "src/some-assets",
         "output": "assets/some-assets"
       }
     ]
   }
    ```
    
A final angular.json file could look like the following example:
```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "projects": {
    "lib": {
      "root": "projects/lib",
      "projectType": "library",
      "architect": {
        "build": {
          "builder": "@linnenschmidt/build-ng-packagr:build",
          "options": {
            "project": "projects/lib/ng-package.json",
            "tsConfig": "projects/lib/tsconfig.lib.json",
            "assets": [
              "src/assets",
              {
                "glob": "**/*.css",
                "input": "src/some-assets",
                "output": "assets/some-assets"
              }
            ]
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "projects/lib/src/test.ts",
            "tsConfig": "projects/lib/tsconfig.spec.json",
            "karmaConfig": "projects/lib/karma.conf.js"
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "projects/lib/tsconfig.lib.json",
              "projects/lib/tsconfig.spec.json"
            ],
            "exclude": ["**/node_modules/**"]
          }
        }
      }
    }
  }
}

```
## CLI commands for development

**Test package**
```bash
yarn test
```

**Build package**
```bash
yarn build
```

## Two of the known issues

- [angular/angular-cli/issues/11071](https://github.com/angular/angular-cli/issues/11071)
- [ng-packagr/ng-packagr/issues/1092](https://github.com/ng-packagr/ng-packagr/issues/1092)

