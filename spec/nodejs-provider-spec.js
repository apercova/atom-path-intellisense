const process = require('process'),
  path = require('path'),
  consts = require('../lib/config/consts');

const getSuggestions = (provider, editor) => {
  const cursor = editor.getLastCursor();
  const start = cursor.getBeginningOfCurrentWordBufferPosition();
  const end = cursor.getBufferPosition();
  const prefix = editor.getTextInRange([start, end]);
  const request = {
    'editor': editor,
    'bufferPosition': end,
    'scopeDescriptor': cursor.getScopeDescriptor(),
    prefix
  };
  return provider.getSuggestions(request);
};

describe(consts['PACKAGE_NAME'], () => {
  let [editor, provider] = [];
  beforeEach(() => {
    /*Turn manual suggestions off*/
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_MANUAL_SUGGEST']}`, false);
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_ENABLE_DEBUG']}`, true);

    let workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    waitsForPromise(() =>
      Promise.all([
        atom.workspace.open(path.join(process.cwd(), 'assets', 'files', 'sample.js')).then(e => editor = e),
        atom.packages.activatePackage('language-javascript'),
        atom.packages.activatePackage('language-xml'),
        atom.packages.activatePackage('autocomplete-plus'),
        atom.packages.activatePackage('atom-path-intellisense')
      ])
    );

    runs(() => {
      provider = atom.packages.getActivePackage('atom-path-intellisense').mainModule.getProvider();
    });
  });

  it('can resolve builtin suggestions', () => {
    editor.setText("import fs from 'fs';");
    editor.setCursorBufferPosition([0, 18]);
    expect(editor.getTextInBufferRange([[0, 0], editor.getLastCursor().getBufferPosition()])).toEqual(
      "import fs from 'fs"
    );
    waitsForPromise(() =>
      getSuggestions(provider, editor).then(suggestions => {
        expect(suggestions).toBeInstanceOf(Array);
        let found = suggestions.find(s => s.displayText === 'fs');
        expect(found.displayText === 'fs');
      })
    );

    editor.setText("const path = require('path');';");
    editor.setCursorBufferPosition([0, 26]);
    expect(editor.getTextInBufferRange([[0, 0], editor.getLastCursor().getBufferPosition()])).toEqual(
      "const path = require('path"
    );

    waitsForPromise(() =>
      getSuggestions(provider, editor).then(suggestions => {
        expect(suggestions).toBeInstanceOf(Array);
        let found = suggestions.find(s => s.displayText === 'path');
        expect(found.displayText === 'path');
      })
    );
  });

  it('can resolve relative modules', () => {
    editor.setText("const sample = require('./sam');");
    editor.setCursorBufferPosition([0, 29]);
    expect(editor.getTextInBufferRange([[0, 0], editor.getLastCursor().getBufferPosition()])).toEqual(
      "const sample = require('./sam"
    );

    waitsForPromise(() =>
      getSuggestions(provider, editor).then(suggestions => {
        expect(suggestions).toBeInstanceOf(Array);
        expect(suggestions).toHaveLength(2);
        expect(suggestions[0].displayText).toEqual('..');
        expect(suggestions[1].displayText).toEqual('sample');
      })
    );
  });
});
