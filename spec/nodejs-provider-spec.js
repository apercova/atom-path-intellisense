const consts = require('../lib/config/consts'),
  utils = require('./utils'),
  path = require('path'),
  process = require('process'),
  selectors = require('atom-selectors-plus');

describe(consts['PACKAGE_NAME'], () => {
  let provider;
  beforeEach(() => {
    /*Turn manual suggestions off*/
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_MANUAL_SUGGEST']}`, false);
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_ENABLE_DEBUG']}`, true);

    let workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    waitsForPromise(() =>
      Promise.all([
        atom.packages.activatePackage('language-javascript'),
        atom.packages.activatePackage('language-coffee-script'),
        atom.packages.activatePackage('language-typescript'),
        atom.packages.activatePackage('language-xml'),
        atom.packages.activatePackage('autocomplete-plus'),
        atom.packages.activatePackage('atom-path-intellisense')
      ])
    );
    runs(() => {
      provider = atom.packages.getActivePackage('atom-path-intellisense').mainModule.getProvider();
    });
  });

  it('can resolve builtin suggestions on javascript files', () => {
    let jsEditor;
    waitsForPromise(() =>
      atom.workspace.open(path.join(process.cwd(), 'spec', '_assets', 'files', 'sample.js')).then(e => {
        jsEditor = e;
        jsEditor.setText("import fs from 'fs';");
        jsEditor.setCursorBufferPosition([0, 18]);
        expect(jsEditor.getTextInBufferRange([[0, 0], jsEditor.getLastCursor().getBufferPosition()])).toEqual(
          "import fs from 'fs"
        );

        let scopesAtCursor = jsEditor.getLastCursor().getScopeDescriptor().scopes;
        expect(scopesAtCursor).toBeInstanceOf(Array);
        expect(scopesAtCursor).toHaveLength(2);
        let validScopes = selectors.selectorMatchesAnyScope('.source.js .string.quoted', scopesAtCursor);
        expect(validScopes).toEqual(true);

        waitsForPromise(() =>
          utils.getSuggestions(provider, jsEditor).then(suggestions => {
            expect(suggestions).toBeInstanceOf(Array);
            expect(suggestions.filter(s => s.displayText === 'fs')).toHaveLength(1);
          })
        );

        jsEditor.setText("const path = require('path');';");
        jsEditor.setCursorBufferPosition([0, 26]);
        expect(jsEditor.getTextInBufferRange([[0, 0], jsEditor.getLastCursor().getBufferPosition()])).toEqual(
          "const path = require('path"
        );

        waitsForPromise(() =>
          utils.getSuggestions(provider, jsEditor).then(suggestions => {
            expect(suggestions).toBeInstanceOf(Array);
            expect(suggestions.filter(s => s.displayText === 'path')).toHaveLength(1);
          })
        );
      })
    );
  });

  it('can resolve builtin suggestions on coffee script files', () => {
    let coffeeEditor;
    waitsForPromise(() =>
      atom.workspace.open(path.join(process.cwd(), 'spec', '_assets', 'files', 'sample.coffee')).then(e => {
        coffeeEditor = e;
        coffeeEditor.setText('path = require("pa")');
        coffeeEditor.setCursorBufferPosition([0, 18]);
        expect(coffeeEditor.getTextInBufferRange([[0, 0], coffeeEditor.getLastCursor().getBufferPosition()])).toEqual(
          'path = require("pa'
        );

        let scopesAtCursor = coffeeEditor.getLastCursor().getScopeDescriptor().scopes;
        expect(scopesAtCursor).toBeInstanceOf(Array);
        expect(scopesAtCursor).toHaveLength(5);
        let validScopes = selectors.selectorMatchesAnyScope('.source.coffee .string.quoted.double', scopesAtCursor);
        expect(validScopes).toEqual(true);

        waitsForPromise(() =>
          utils.getSuggestions(provider, coffeeEditor).then(suggestions => {
            expect(suggestions).toBeInstanceOf(Array);
            expect(suggestions.filter(s => s.displayText === 'path')).toHaveLength(1);
          })
        );
      })
    );
  });

  it('can resolve builtin suggestions on typescript files', () => {
    let tsEditor;
    waitsForPromise(() =>
      atom.workspace.open(path.join(process.cwd(), 'spec', '_assets', 'files', 'sample.ts')).then(e => {
        tsEditor = e;
        tsEditor.setText("import process from 'proce'");
        tsEditor.setCursorBufferPosition([0, 26]);
        expect(tsEditor.getTextInBufferRange([[0, 0], tsEditor.getLastCursor().getBufferPosition()])).toEqual(
          "import process from 'proce"
        );

        let scopesAtCursor = tsEditor.getLastCursor().getScopeDescriptor().scopes;
        expect(scopesAtCursor).toBeInstanceOf(Array);
        expect(scopesAtCursor).toHaveLength(2);
        let validScopes = selectors.selectorMatchesAnyScope('.source.ts .string.quoted', scopesAtCursor);
        expect(validScopes).toEqual(true);

        waitsForPromise(() =>
          utils.getSuggestions(provider, tsEditor).then(suggestions => {
            expect(suggestions).toBeInstanceOf(Array);
            expect(suggestions.filter(s => s.displayText === 'process')).toHaveLength(1);
          })
        );
      })
    );
  });

  it('can resolve relative modules on javascript files', () => {
    let jsEditor;
    waitsForPromise(() =>
      atom.workspace.open(path.join(process.cwd(), 'spec', '_assets', 'files', 'sample.js')).then(e => {
        jsEditor = e;
        jsEditor.setText("const sample = require('./sam');");
        jsEditor.setCursorBufferPosition([0, 29]);
        expect(jsEditor.getTextInBufferRange([[0, 0], jsEditor.getLastCursor().getBufferPosition()])).toEqual(
          "const sample = require('./sam"
        );
        waitsForPromise(() =>
          utils.getSuggestions(provider, jsEditor).then(suggestions => {
            expect(suggestions).toBeInstanceOf(Array);
            expect(suggestions).toHaveLength(3);
            expect(suggestions[0].displayText).toEqual('..');
            expect(suggestions[0].filename).toEqual('..');
            expect(suggestions[1].displayText).toEqual('sample');
            expect(suggestions[1].filename).toEqual('sample.js');
            expect(suggestions[2].displayText).toEqual('sample');
            expect(suggestions[2].filename).toEqual('sample.ts');
          })
        );
      })
    );
  });

  it('can resolve relative modules on coffee script files', () => {
    let coffeeEditor;
    waitsForPromise(() =>
      atom.workspace.open(path.join(process.cwd(), 'spec', '_assets', 'files', 'sample.coffee')).then(e => {
        coffeeEditor = e;
        coffeeEditor.setText("sample = require('./sam');");
        coffeeEditor.setCursorBufferPosition([0, 23]);
        expect(coffeeEditor.getTextInBufferRange([[0, 0], coffeeEditor.getLastCursor().getBufferPosition()])).toEqual(
          "sample = require('./sam"
        );
        waitsForPromise(() =>
          utils.getSuggestions(provider, coffeeEditor).then(suggestions => {
            expect(suggestions).toBeInstanceOf(Array);
            expect(suggestions).toHaveLength(3);
            expect(suggestions[0].displayText).toEqual('..');
            expect(suggestions[0].filename).toEqual('..');
            expect(suggestions[1].displayText).toEqual('sample');
            expect(suggestions[1].filename).toEqual('sample.js');
            expect(suggestions[2].displayText).toEqual('sample');
            expect(suggestions[2].filename).toEqual('sample.ts');
          })
        );
      })
    );
  });
});
