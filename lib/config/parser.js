'use babel'

export default {
  "patterns": {
    "pathregex": "(?:\\/|\\.\\/|\\.\\/\\/)(?<dirs>(?<parent>[^\\/]+\\/)*)(?<file>[^\\/]+)",
    "searchpatterns": {
      "default": {
        "pattern": "(?<path>.*)",
        "priority": 999,
        "scopeSelector": ".source .string, text",
        "type": "path"
      },
      "import": {
        "pattern": "import.*?from.*?[\\'\\\"](?<path>.*?)[\\'\\\"]",
        "priority": 1,
        "scopeSelector": ".source .string",
        "type": "path"
      },
      "require": {
        "pattern": "require\\([\\'\\\"](?<path>.*?)[\\'\\\"]\\)",
        "priority": 1,
        "scopeSelector": ".source .string",
        "type": "path"
      },
      "src": {
        "pattern": "src=[\\'\\\"](?<path>.*?)[\\'\\\"]",
        "priority": 1,
        "scopeSelector": ".source .string",
        "type": "path"
      },
      "href": {
        "pattern": "href=[\\'\\\"](?<path>.*?)[\\'\\\"]",
        "priority": 1,
        "scopeSelector": ".source .string",
        "type": "path"
      },
      "cssBgUrl": {
        "pattern": "url\\(\\\"(?<path>.*?)\\\"\\)",
        "priority": 1,
        "scopeSelector": ".source.css .string",
        "type": "path"
      },
      "requirejs": {
        "type": "array",
        "arraypattern": "requirejs\\(\\s*?\\[(?<paths>.*?)\\]",
        "pattern": "\\\"(?<path>.*?)\\\"",
        "priority": 1,
        "scopeSelector": ".source.js .string"
      }
    }
  },
  "activate": {
    "value": true,
    "scopeSelector": ".source .string, .text"
  }
};
