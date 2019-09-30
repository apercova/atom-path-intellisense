'use babel'

export default class SearchPathDTO {
  constructor(basePath, searchPath, testPath) {
    this.basePath = basePath;
    this.searchPath = searchPath;
    this.testPath = testPath;
  }
}
