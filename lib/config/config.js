'use babel'

import consts from "./consts.js";
import settings from "./settings.js";

function isManualModeOn (){
  return (atom.config.get(`${consts.PACKAGE_NAME}.${consts.CG_MANUAL_SUGGEST}`) === true);
};
function getAllowedScopes(){
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
};
function getDisabledScopes(){
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_DISABLED_SCOPES}`);
};
function getSuggestionPriority(){
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_SG_PRIORITY}`);
};
function getInclusionPriority(){
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_INC_PRIORITY}`);
};
function excludeLowerPrioritySuggestions(){
  return (atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_EX_LOW_PRIORITY}`)  === true);
};
function filterSuggestions(){
  return (atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_SG_FILTER}`) === true);
};

export default {
  settings,
  isManualModeOn,
  getAllowedScopes,
  getDisabledScopes,
  getSuggestionPriority,
  getInclusionPriority,
  excludeLowerPrioritySuggestions,
  filterSuggestions
};
