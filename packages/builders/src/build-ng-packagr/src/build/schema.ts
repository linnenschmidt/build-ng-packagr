export interface Schema {
  "assets": string[] | AssetPatternClass[],
  "project": string,
  "tsConfig": string,
  "watch": boolean
}

export interface AssetPatternClass {
  "glob": string,
  "input": string,
  "ignore"?: string[],
  "output": string
}
