const config = require('../lib/config/config'),
  consts = require('../lib/config/consts'),
  AtomPathIntellisenseImpl = require('../lib/atom-path-intellisense-impl');

describe(consts['PACKAGE_NAME'], () => {
  let provider;
  beforeEach(() => {
    let workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    waitsForPromise(() =>
      Promise.all([
        atom.packages.activatePackage('autocomplete-plus'),
        atom.packages.activatePackage('atom-path-intellisense')
      ])
    );

    runs(() => {
      provider = atom.packages.getActivePackage('atom-path-intellisense').mainModule.getProvider();
    });
  });

  it('can initialize provider successfully', () => {
    expect(provider).toBeInstanceOf(AtomPathIntellisenseImpl);
  });

  it('can change config apropriately', () => {
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_MANUAL_SUGGEST']}`, false);
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_ENABLE_DEBUG']}`, true);
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_PROVIDER_STRATEGY_ALL']}`, true);
    atom.config.set(`${consts['PACKAGE_NAME']}.${consts['CF_ALLOWED_SCOPES']}`, '.text.plain');

    let status = config.isManualModeOn();
    expect(status).toEqual(false);
    status = config.isDebugEnabled();
    expect(status).toEqual(true);
    status = config.AllProvidersStrategyOn();
    expect(status).toEqual(true);
    status = config.getAllowedScopes();
    expect(status).toEqual('.text.plain');
  });
});
