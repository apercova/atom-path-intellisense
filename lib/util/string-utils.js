'use babel'

export default {
  unescapeStringQuote: (str) => {
    str = str.replace(new RegExp(/\\\'/, 'g'), "\'");
    str = str.replace(new RegExp(/\\\"/, 'g'), "\"");
    return str;
  },
  escapeStringQuote: (str) => {
    str = str.replace(new RegExp(/\'/, 'g'), "\\\'");
    str = str.replace(new RegExp(/\"/, 'g'), "\\\"");
    return str;
  }
}
