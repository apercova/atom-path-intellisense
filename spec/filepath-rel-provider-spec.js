const consts = require('../lib/config/consts'),
  utils = require('./utils'),
  path = require('path'),
  process = require('process'),
  selectors = require('atom-selectors-plus');

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
        atom.workspace.open(path.join(process.cwd(), 'spec', '_assets', 'files', 'sample.js')).then(e => editor = e),
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

  it('can resolve scopes at cursor', () => {
    editor.setText("import fs from '';");
    editor.setCursorBufferPosition([0, 16]);
    let scopesAtCursor = editor.getLastCursor().getScopeDescriptor().scopes;
    expect(scopesAtCursor).toBeInstanceOf(Array);
    expect(scopesAtCursor).toHaveLength(2);
    let validScopes = selectors.selectorMatchesAllScopes('.source.js .string.quoted', scopesAtCursor);
    expect(validScopes).toEqual(true);
  });

  it('can resolve filepath-relative suggestions (./)', () => {
    editor.setText("import fs from './';");
    editor.setCursorBufferPosition([0, 18]);
    expect(editor.getTextInBufferRange([[0, 0], editor.getLastCursor().getBufferPosition()])).toEqual(
      "import fs from './"
    );

    waitsForPromise(() =>
      utils.getSuggestions(provider, editor).then(suggestions => {
        expect(suggestions).toBeInstanceOf(Array);
        expect(suggestions).toHaveLength(5);
        expect(suggestions[0].displayText).toEqual('../');
        expect(suggestions[1].displayText).toEqual('sample.coffee');
        expect(suggestions[2].displayText).toEqual('sample.js');
        expect(suggestions[3].displayText).toEqual('sample.ts');
        expect(suggestions[4].displayText).toEqual('sample.xml');
      })
    );
  });

  it('can resolve filepath-relative suggestions (../)', () => {
    editor.setText("import fs from '../';");
    editor.setCursorBufferPosition([0, 19]);
    expect(editor.getTextInBufferRange([[0, 0], editor.getLastCursor().getBufferPosition()])).toEqual(
      "import fs from '../"
    );

    waitsForPromise(() =>
      utils.getSuggestions(provider, editor).then(suggestions => {
        expect(suggestions).toBeInstanceOf(Array);
        expect(suggestions).toHaveLength(3);
        expect(suggestions[0].displayText).toEqual('../');
        expect(suggestions[1].displayText).toEqual("esca'ped_dir/");
        expect(suggestions[2].displayText).toEqual('files/');
      })
    );
  });

  it("can resolve filepath-relative suggestions (../esca'ped_dir/)", () => {
    editor.setText("import fs from ('../esca\\'ped_dir/');");
    editor.setCursorBufferPosition([0, 34]);
    expect(editor.getTextInBufferRange([[0, 0], editor.getLastCursor().getBufferPosition()])).toEqual(
      "import fs from ('../esca\\'ped_dir/"
    );

    waitsForPromise(() =>
      utils.getSuggestions(provider, editor).then(suggestions => {
        expect(suggestions).toBeInstanceOf(Array);
        expect(suggestions).toHaveLength(3);
        expect(suggestions[0].displayText).toEqual('../');
        expect(suggestions[1].displayText).toEqual("esca'ped_file01.js");
        expect(suggestions[2].displayText).toEqual("esca'ped_file02.js");
      })
    );
  });

  it('can resolve on xml files', () => {
    let xmlEditor;
    waitsForPromise(() =>
      atom.workspace.open(path.join(process.cwd(), 'spec', '_assets', 'files', 'sample.xml')).then(e => {
        xmlEditor = e;
        xmlEditor.setText('<root path="./"></root>');
        xmlEditor.setCursorBufferPosition([0, 14]);
        expect(xmlEditor.getTextInBufferRange([[0, 0], xmlEditor.getLastCursor().getBufferPosition()])).toEqual(
          '<root path="./'
        );

        let scopesAtCursor = xmlEditor.getLastCursor().getScopeDescriptor().scopes;
        expect(scopesAtCursor).toBeInstanceOf(Array);
        expect(scopesAtCursor).toHaveLength(4);
        let validScopes = selectors.selectorMatchesAnyScope('.text.xml .string.quoted.double', scopesAtCursor);
        expect(validScopes).toEqual(true);
      })
    );

    waitsForPromise(() =>
      utils.getSuggestions(provider, xmlEditor).then(suggestions => {
        expect(suggestions).toBeInstanceOf(Array);
        expect(suggestions).toHaveLength(5);
        expect(suggestions[0].displayText).toEqual('../');
        expect(suggestions[1].displayText).toEqual('sample.coffee');
        expect(suggestions[2].displayText).toEqual('sample.js');
        expect(suggestions[3].displayText).toEqual('sample.ts');
        expect(suggestions[4].displayText).toEqual('sample.xml');
      })
    );
  });
});
