'use babel'

export default {
  "patterns": {
    "pathregex": "(?:\\/|\\.\\/|\\.\\/\\/)(?<dirs>(?<parent>[^\\/]+\\/)*)(?<file>[^\\/]+)",
    "searchpatterns": {
      "import": {
        "type": "path",
        "pattern": "import.*?from.*?[\\\'\\\"](?<path>.*?)\\\""
      },
      "requirejs": {
        "type": "array",
        "arrayPattern": "requirejs\\(\\s*?\\[(?<paths>.*?)\\]",
        "pattern": "\\\"(?<path>.*?)\\\""
      }
    }
  }
};
