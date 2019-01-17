# Angular Build Architect for ng-packagr with asset handling

The default Angular build architect for libraries uses ng-packagr. But ng-packagr doesn't copy assets of libraries.
Most library projects have assets which was mentioned here
[/angular/angular-cli/issues/11071](https://github.com/angular/angular-cli/issues/11071#issuecomment-451271094) by @filipesilva by saying:

> I agree this is a desirable feature and that many libraries, like @angular/material, have assets and need to build them using custom code. It is reasonable to expect the feature to exist.

He also mentioned that a simple copy is not enough:

> Although it sounds like an easy thing, it's not necessarily as easy as just copying some files over. Especially if we're talking about sass files, or other files that are meant to be consumed in specific ways. Often you'll find special instructions in libraries about how the assets must be used.

But often it is enough to copy some asset sources into the package.
In my companie's library build step we are simply copying assets like sass files, fonts and so on.
Because our angular related project build systems consume these files as they are.
And this has been enough for us since the final release of Angular in 2016.

I will simply say, that this Angular Build Architect solves the known issue of ng-packagr even if you only copy assets.

## How to use it

1. Simply install `@linnenschmidt/build-ng-packagr` into your angular project.
    ```bash
    npm install @linnenschmidt/build-ng-packagr --save-dev
    ```
2. Replace the build architect of your libraries by  `@linnenschmidt/build-ng-packagr:build`.
    ```json
   "targets": {
     "build": {
       "builder": "@linnenschmidt/build-ng-packagr:build",
    ```
3. Add your assets glob rules to the options section like as you normally do for apps
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
      "targets": {
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
npm test
```

**Build package**
```bash
npm run build
```

## Two of the known issues

- [angular/angular-cli/issues/11071](https://github.com/angular/angular-cli/issues/11071)
- [ng-packagr/ng-packagr/issues/1092](https://github.com/ng-packagr/ng-packagr/issues/1092)

