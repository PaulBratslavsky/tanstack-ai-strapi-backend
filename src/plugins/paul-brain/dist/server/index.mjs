import require$$1 from "crypto";
import require$$0$1 from "child_process";
import require$$0$2 from "os";
import require$$0$4 from "path";
import require$$0$3 from "fs";
import require$$0$5 from "assert";
import require$$2 from "events";
import require$$0$7 from "buffer";
import require$$0$6 from "stream";
import require$$2$1 from "util";
import "node:stream";
const PLUGIN_NAME$1 = "paul-brain";
const CONTENT_TYPES = ["note", "person", "project", "decision", "source", "retro", "gap", "capability", "rule", "todo", "goal", "goal-checkin"];
const getUid = (type) => `plugin::${PLUGIN_NAME$1}.${type}`;
const PERMISSIONS = [
  // Memory subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "memory",
    uid: "guide.read",
    displayName: "Read usage guide"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "memory",
    uid: "brief.read",
    displayName: "Read session briefing"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "memory",
    uid: "stats.read",
    displayName: "Read knowledge base statistics"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "memory",
    uid: "read",
    displayName: "Read memory"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "memory",
    uid: "note.write",
    displayName: "Write notes and links"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "memory",
    uid: "entity.write",
    displayName: "Upsert and update entities (person, source)"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "memory",
    uid: "decision.write",
    displayName: "Log decisions"
  },
  // Tasks and goals subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "tasks and goals",
    uid: "todo.write",
    displayName: "Manage to-dos"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "tasks and goals",
    uid: "goal.read",
    displayName: "Read goals"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "tasks and goals",
    uid: "goal.write",
    displayName: "Manage goals and check-ins"
  },
  // Diagnostics and ops subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "diagnostics and ops",
    uid: "health.read",
    displayName: "Run health checks"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "diagnostics and ops",
    uid: "meta.write",
    displayName: "Log retros and gaps"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "diagnostics and ops",
    uid: "retro.update",
    displayName: "Update retros"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "diagnostics and ops",
    uid: "gap.update",
    displayName: "Update gaps"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "diagnostics and ops",
    uid: "rule.write",
    displayName: "Manage routing rules"
  },
  // Administration subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME$1,
    subCategory: "administration",
    uid: "forget",
    displayName: "Delete records"
  }
];
const getActionId = (uid) => `plugin::${PLUGIN_NAME$1}.${uid}`;
const register$z = ({ strapi: strapi2 }) => {
  const actionProvider = strapi2.service("admin::permission").actionProvider;
  const existingActions = PERMISSIONS.filter(
    (permission) => actionProvider.has(`plugin::paul-brain.${permission.uid}`)
  );
  const newActions = PERMISSIONS.filter(
    (permission) => !actionProvider.has(`plugin::paul-brain.${permission.uid}`)
  );
  if (newActions.length > 0) {
    actionProvider.registerMany(newActions);
    strapi2.log.info(
      `[paul-brain] Registered ${newActions.length} new permission actions in register phase`
    );
  }
  if (existingActions.length > 0) {
    strapi2.log.debug(
      `[paul-brain] Skipped ${existingActions.length} already-registered permission actions`
    );
  }
  strapi2.log.debug("[paul-brain] Plugin registered");
};
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var lodash = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
lodash.exports;
(function(module, exports) {
  (function() {
    var undefined$1;
    var VERSION = "4.18.1";
    var LARGE_ARRAY_SIZE2 = 200;
    var CORE_ERROR_TEXT = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", FUNC_ERROR_TEXT2 = "Expected a function", INVALID_TEMPL_VAR_ERROR_TEXT = "Invalid `variable` option passed into `_.template`", INVALID_TEMPL_IMPORTS_ERROR_TEXT = "Invalid `imports` option passed into `_.template`";
    var HASH_UNDEFINED2 = "__lodash_hash_undefined__";
    var MAX_MEMOIZE_SIZE2 = 500;
    var PLACEHOLDER = "__lodash_placeholder__";
    var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4;
    var COMPARE_PARTIAL_FLAG2 = 1, COMPARE_UNORDERED_FLAG2 = 2;
    var WRAP_BIND_FLAG = 1, WRAP_BIND_KEY_FLAG = 2, WRAP_CURRY_BOUND_FLAG = 4, WRAP_CURRY_FLAG = 8, WRAP_CURRY_RIGHT_FLAG = 16, WRAP_PARTIAL_FLAG = 32, WRAP_PARTIAL_RIGHT_FLAG = 64, WRAP_ARY_FLAG = 128, WRAP_REARG_FLAG = 256, WRAP_FLIP_FLAG = 512;
    var DEFAULT_TRUNC_LENGTH = 30, DEFAULT_TRUNC_OMISSION = "...";
    var HOT_COUNT = 800, HOT_SPAN = 16;
    var LAZY_FILTER_FLAG = 1, LAZY_MAP_FLAG = 2, LAZY_WHILE_FLAG = 3;
    var INFINITY = 1 / 0, MAX_SAFE_INTEGER2 = 9007199254740991, MAX_INTEGER = 17976931348623157e292, NAN = 0 / 0;
    var MAX_ARRAY_LENGTH = 4294967295, MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1, HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;
    var wrapFlags = [
      ["ary", WRAP_ARY_FLAG],
      ["bind", WRAP_BIND_FLAG],
      ["bindKey", WRAP_BIND_KEY_FLAG],
      ["curry", WRAP_CURRY_FLAG],
      ["curryRight", WRAP_CURRY_RIGHT_FLAG],
      ["flip", WRAP_FLIP_FLAG],
      ["partial", WRAP_PARTIAL_FLAG],
      ["partialRight", WRAP_PARTIAL_RIGHT_FLAG],
      ["rearg", WRAP_REARG_FLAG]
    ];
    var argsTag2 = "[object Arguments]", arrayTag2 = "[object Array]", asyncTag2 = "[object AsyncFunction]", boolTag2 = "[object Boolean]", dateTag2 = "[object Date]", domExcTag = "[object DOMException]", errorTag2 = "[object Error]", funcTag2 = "[object Function]", genTag2 = "[object GeneratorFunction]", mapTag2 = "[object Map]", numberTag2 = "[object Number]", nullTag2 = "[object Null]", objectTag2 = "[object Object]", promiseTag2 = "[object Promise]", proxyTag2 = "[object Proxy]", regexpTag2 = "[object RegExp]", setTag2 = "[object Set]", stringTag2 = "[object String]", symbolTag2 = "[object Symbol]", undefinedTag2 = "[object Undefined]", weakMapTag2 = "[object WeakMap]", weakSetTag = "[object WeakSet]";
    var arrayBufferTag2 = "[object ArrayBuffer]", dataViewTag2 = "[object DataView]", float32Tag2 = "[object Float32Array]", float64Tag2 = "[object Float64Array]", int8Tag2 = "[object Int8Array]", int16Tag2 = "[object Int16Array]", int32Tag2 = "[object Int32Array]", uint8Tag2 = "[object Uint8Array]", uint8ClampedTag2 = "[object Uint8ClampedArray]", uint16Tag2 = "[object Uint16Array]", uint32Tag2 = "[object Uint32Array]";
    var reEmptyStringLeading = /\b__p \+= '';/g, reEmptyStringMiddle = /\b(__p \+=) '' \+/g, reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
    var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g, reUnescapedHtml = /[&<>"']/g, reHasEscapedHtml = RegExp(reEscapedHtml.source), reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
    var reEscape = /<%-([\s\S]+?)%>/g, reEvaluate = /<%([\s\S]+?)%>/g, reInterpolate = /<%=([\s\S]+?)%>/g;
    var reIsDeepProp2 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp2 = /^\w*$/, rePropName2 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reRegExpChar2 = /[\\^$.*+?()[\]{}|]/g, reHasRegExpChar = RegExp(reRegExpChar2.source);
    var reTrimStart = /^\s+/;
    var reWhitespace = /\s/;
    var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/, reSplitDetails = /,? & /;
    var reAsciiWord2 = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
    var reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;
    var reEscapeChar2 = /\\(\\)?/g;
    var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
    var reFlags = /\w*$/;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsHostCtor2 = /^\[object .+?Constructor\]$/;
    var reIsOctal = /^0o[0-7]+$/i;
    var reIsUint2 = /^(?:0|[1-9]\d*)$/;
    var reLatin2 = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
    var reNoMatch = /($^)/;
    var reUnescapedString = /['\n\r\u2028\u2029\\]/g;
    var rsAstralRange2 = "\\ud800-\\udfff", rsComboMarksRange2 = "\\u0300-\\u036f", reComboHalfMarksRange2 = "\\ufe20-\\ufe2f", rsComboSymbolsRange2 = "\\u20d0-\\u20ff", rsComboRange2 = rsComboMarksRange2 + reComboHalfMarksRange2 + rsComboSymbolsRange2, rsDingbatRange2 = "\\u2700-\\u27bf", rsLowerRange2 = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange2 = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange2 = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange2 = "\\u2000-\\u206f", rsSpaceRange2 = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange2 = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange2 = "\\ufe0e\\ufe0f", rsBreakRange2 = rsMathOpRange2 + rsNonCharRange2 + rsPunctuationRange2 + rsSpaceRange2;
    var rsApos2 = "['’]", rsAstral2 = "[" + rsAstralRange2 + "]", rsBreak2 = "[" + rsBreakRange2 + "]", rsCombo2 = "[" + rsComboRange2 + "]", rsDigits2 = "\\d+", rsDingbat2 = "[" + rsDingbatRange2 + "]", rsLower2 = "[" + rsLowerRange2 + "]", rsMisc2 = "[^" + rsAstralRange2 + rsBreakRange2 + rsDigits2 + rsDingbatRange2 + rsLowerRange2 + rsUpperRange2 + "]", rsFitz2 = "\\ud83c[\\udffb-\\udfff]", rsModifier2 = "(?:" + rsCombo2 + "|" + rsFitz2 + ")", rsNonAstral2 = "[^" + rsAstralRange2 + "]", rsRegional2 = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair2 = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper2 = "[" + rsUpperRange2 + "]", rsZWJ2 = "\\u200d";
    var rsMiscLower2 = "(?:" + rsLower2 + "|" + rsMisc2 + ")", rsMiscUpper2 = "(?:" + rsUpper2 + "|" + rsMisc2 + ")", rsOptContrLower2 = "(?:" + rsApos2 + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper2 = "(?:" + rsApos2 + "(?:D|LL|M|RE|S|T|VE))?", reOptMod2 = rsModifier2 + "?", rsOptVar2 = "[" + rsVarRange2 + "]?", rsOptJoin2 = "(?:" + rsZWJ2 + "(?:" + [rsNonAstral2, rsRegional2, rsSurrPair2].join("|") + ")" + rsOptVar2 + reOptMod2 + ")*", rsOrdLower2 = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper2 = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq2 = rsOptVar2 + reOptMod2 + rsOptJoin2, rsEmoji2 = "(?:" + [rsDingbat2, rsRegional2, rsSurrPair2].join("|") + ")" + rsSeq2, rsSymbol2 = "(?:" + [rsNonAstral2 + rsCombo2 + "?", rsCombo2, rsRegional2, rsSurrPair2, rsAstral2].join("|") + ")";
    var reApos2 = RegExp(rsApos2, "g");
    var reComboMark2 = RegExp(rsCombo2, "g");
    var reUnicode2 = RegExp(rsFitz2 + "(?=" + rsFitz2 + ")|" + rsSymbol2 + rsSeq2, "g");
    var reUnicodeWord2 = RegExp([
      rsUpper2 + "?" + rsLower2 + "+" + rsOptContrLower2 + "(?=" + [rsBreak2, rsUpper2, "$"].join("|") + ")",
      rsMiscUpper2 + "+" + rsOptContrUpper2 + "(?=" + [rsBreak2, rsUpper2 + rsMiscLower2, "$"].join("|") + ")",
      rsUpper2 + "?" + rsMiscLower2 + "+" + rsOptContrLower2,
      rsUpper2 + "+" + rsOptContrUpper2,
      rsOrdUpper2,
      rsOrdLower2,
      rsDigits2,
      rsEmoji2
    ].join("|"), "g");
    var reHasUnicode2 = RegExp("[" + rsZWJ2 + rsAstralRange2 + rsComboRange2 + rsVarRange2 + "]");
    var reHasUnicodeWord2 = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
    var contextProps = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ];
    var templateCounter = -1;
    var typedArrayTags2 = {};
    typedArrayTags2[float32Tag2] = typedArrayTags2[float64Tag2] = typedArrayTags2[int8Tag2] = typedArrayTags2[int16Tag2] = typedArrayTags2[int32Tag2] = typedArrayTags2[uint8Tag2] = typedArrayTags2[uint8ClampedTag2] = typedArrayTags2[uint16Tag2] = typedArrayTags2[uint32Tag2] = true;
    typedArrayTags2[argsTag2] = typedArrayTags2[arrayTag2] = typedArrayTags2[arrayBufferTag2] = typedArrayTags2[boolTag2] = typedArrayTags2[dataViewTag2] = typedArrayTags2[dateTag2] = typedArrayTags2[errorTag2] = typedArrayTags2[funcTag2] = typedArrayTags2[mapTag2] = typedArrayTags2[numberTag2] = typedArrayTags2[objectTag2] = typedArrayTags2[regexpTag2] = typedArrayTags2[setTag2] = typedArrayTags2[stringTag2] = typedArrayTags2[weakMapTag2] = false;
    var cloneableTags = {};
    cloneableTags[argsTag2] = cloneableTags[arrayTag2] = cloneableTags[arrayBufferTag2] = cloneableTags[dataViewTag2] = cloneableTags[boolTag2] = cloneableTags[dateTag2] = cloneableTags[float32Tag2] = cloneableTags[float64Tag2] = cloneableTags[int8Tag2] = cloneableTags[int16Tag2] = cloneableTags[int32Tag2] = cloneableTags[mapTag2] = cloneableTags[numberTag2] = cloneableTags[objectTag2] = cloneableTags[regexpTag2] = cloneableTags[setTag2] = cloneableTags[stringTag2] = cloneableTags[symbolTag2] = cloneableTags[uint8Tag2] = cloneableTags[uint8ClampedTag2] = cloneableTags[uint16Tag2] = cloneableTags[uint32Tag2] = true;
    cloneableTags[errorTag2] = cloneableTags[funcTag2] = cloneableTags[weakMapTag2] = false;
    var deburredLetters2 = {
      // Latin-1 Supplement block.
      "À": "A",
      "Á": "A",
      "Â": "A",
      "Ã": "A",
      "Ä": "A",
      "Å": "A",
      "à": "a",
      "á": "a",
      "â": "a",
      "ã": "a",
      "ä": "a",
      "å": "a",
      "Ç": "C",
      "ç": "c",
      "Ð": "D",
      "ð": "d",
      "È": "E",
      "É": "E",
      "Ê": "E",
      "Ë": "E",
      "è": "e",
      "é": "e",
      "ê": "e",
      "ë": "e",
      "Ì": "I",
      "Í": "I",
      "Î": "I",
      "Ï": "I",
      "ì": "i",
      "í": "i",
      "î": "i",
      "ï": "i",
      "Ñ": "N",
      "ñ": "n",
      "Ò": "O",
      "Ó": "O",
      "Ô": "O",
      "Õ": "O",
      "Ö": "O",
      "Ø": "O",
      "ò": "o",
      "ó": "o",
      "ô": "o",
      "õ": "o",
      "ö": "o",
      "ø": "o",
      "Ù": "U",
      "Ú": "U",
      "Û": "U",
      "Ü": "U",
      "ù": "u",
      "ú": "u",
      "û": "u",
      "ü": "u",
      "Ý": "Y",
      "ý": "y",
      "ÿ": "y",
      "Æ": "Ae",
      "æ": "ae",
      "Þ": "Th",
      "þ": "th",
      "ß": "ss",
      // Latin Extended-A block.
      "Ā": "A",
      "Ă": "A",
      "Ą": "A",
      "ā": "a",
      "ă": "a",
      "ą": "a",
      "Ć": "C",
      "Ĉ": "C",
      "Ċ": "C",
      "Č": "C",
      "ć": "c",
      "ĉ": "c",
      "ċ": "c",
      "č": "c",
      "Ď": "D",
      "Đ": "D",
      "ď": "d",
      "đ": "d",
      "Ē": "E",
      "Ĕ": "E",
      "Ė": "E",
      "Ę": "E",
      "Ě": "E",
      "ē": "e",
      "ĕ": "e",
      "ė": "e",
      "ę": "e",
      "ě": "e",
      "Ĝ": "G",
      "Ğ": "G",
      "Ġ": "G",
      "Ģ": "G",
      "ĝ": "g",
      "ğ": "g",
      "ġ": "g",
      "ģ": "g",
      "Ĥ": "H",
      "Ħ": "H",
      "ĥ": "h",
      "ħ": "h",
      "Ĩ": "I",
      "Ī": "I",
      "Ĭ": "I",
      "Į": "I",
      "İ": "I",
      "ĩ": "i",
      "ī": "i",
      "ĭ": "i",
      "į": "i",
      "ı": "i",
      "Ĵ": "J",
      "ĵ": "j",
      "Ķ": "K",
      "ķ": "k",
      "ĸ": "k",
      "Ĺ": "L",
      "Ļ": "L",
      "Ľ": "L",
      "Ŀ": "L",
      "Ł": "L",
      "ĺ": "l",
      "ļ": "l",
      "ľ": "l",
      "ŀ": "l",
      "ł": "l",
      "Ń": "N",
      "Ņ": "N",
      "Ň": "N",
      "Ŋ": "N",
      "ń": "n",
      "ņ": "n",
      "ň": "n",
      "ŋ": "n",
      "Ō": "O",
      "Ŏ": "O",
      "Ő": "O",
      "ō": "o",
      "ŏ": "o",
      "ő": "o",
      "Ŕ": "R",
      "Ŗ": "R",
      "Ř": "R",
      "ŕ": "r",
      "ŗ": "r",
      "ř": "r",
      "Ś": "S",
      "Ŝ": "S",
      "Ş": "S",
      "Š": "S",
      "ś": "s",
      "ŝ": "s",
      "ş": "s",
      "š": "s",
      "Ţ": "T",
      "Ť": "T",
      "Ŧ": "T",
      "ţ": "t",
      "ť": "t",
      "ŧ": "t",
      "Ũ": "U",
      "Ū": "U",
      "Ŭ": "U",
      "Ů": "U",
      "Ű": "U",
      "Ų": "U",
      "ũ": "u",
      "ū": "u",
      "ŭ": "u",
      "ů": "u",
      "ű": "u",
      "ų": "u",
      "Ŵ": "W",
      "ŵ": "w",
      "Ŷ": "Y",
      "ŷ": "y",
      "Ÿ": "Y",
      "Ź": "Z",
      "Ż": "Z",
      "Ž": "Z",
      "ź": "z",
      "ż": "z",
      "ž": "z",
      "Ĳ": "IJ",
      "ĳ": "ij",
      "Œ": "Oe",
      "œ": "oe",
      "ŉ": "'n",
      "ſ": "s"
    };
    var htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    var htmlUnescapes = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    };
    var stringEscapes = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    };
    var freeParseFloat = parseFloat, freeParseInt = parseInt;
    var freeGlobal2 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
    var freeSelf2 = typeof self == "object" && self && self.Object === Object && self;
    var root2 = freeGlobal2 || freeSelf2 || Function("return this")();
    var freeExports = exports && !exports.nodeType && exports;
    var freeModule = freeExports && true && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal2.process;
    var nodeUtil2 = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    }();
    var nodeIsArrayBuffer = nodeUtil2 && nodeUtil2.isArrayBuffer, nodeIsDate = nodeUtil2 && nodeUtil2.isDate, nodeIsMap = nodeUtil2 && nodeUtil2.isMap, nodeIsRegExp = nodeUtil2 && nodeUtil2.isRegExp, nodeIsSet = nodeUtil2 && nodeUtil2.isSet, nodeIsTypedArray2 = nodeUtil2 && nodeUtil2.isTypedArray;
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0:
          return func.call(thisArg);
        case 1:
          return func.call(thisArg, args[0]);
        case 2:
          return func.call(thisArg, args[0], args[1]);
        case 3:
          return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }
    function arrayAggregator(array2, setter, iteratee, accumulator) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        var value = array2[index2];
        setter(accumulator, value, iteratee(value), array2);
      }
      return accumulator;
    }
    function arrayEach(array2, iteratee) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        if (iteratee(array2[index2], index2, array2) === false) {
          break;
        }
      }
      return array2;
    }
    function arrayEachRight(array2, iteratee) {
      var length = array2 == null ? 0 : array2.length;
      while (length--) {
        if (iteratee(array2[length], length, array2) === false) {
          break;
        }
      }
      return array2;
    }
    function arrayEvery(array2, predicate) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        if (!predicate(array2[index2], index2, array2)) {
          return false;
        }
      }
      return true;
    }
    function arrayFilter2(array2, predicate) {
      var index2 = -1, length = array2 == null ? 0 : array2.length, resIndex = 0, result = [];
      while (++index2 < length) {
        var value = array2[index2];
        if (predicate(value, index2, array2)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    function arrayIncludes(array2, value) {
      var length = array2 == null ? 0 : array2.length;
      return !!length && baseIndexOf(array2, value, 0) > -1;
    }
    function arrayIncludesWith(array2, value, comparator) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        if (comparator(value, array2[index2])) {
          return true;
        }
      }
      return false;
    }
    function arrayMap2(array2, iteratee) {
      var index2 = -1, length = array2 == null ? 0 : array2.length, result = Array(length);
      while (++index2 < length) {
        result[index2] = iteratee(array2[index2], index2, array2);
      }
      return result;
    }
    function arrayPush2(array2, values) {
      var index2 = -1, length = values.length, offset = array2.length;
      while (++index2 < length) {
        array2[offset + index2] = values[index2];
      }
      return array2;
    }
    function arrayReduce2(array2, iteratee, accumulator, initAccum) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      if (initAccum && length) {
        accumulator = array2[++index2];
      }
      while (++index2 < length) {
        accumulator = iteratee(accumulator, array2[index2], index2, array2);
      }
      return accumulator;
    }
    function arrayReduceRight(array2, iteratee, accumulator, initAccum) {
      var length = array2 == null ? 0 : array2.length;
      if (initAccum && length) {
        accumulator = array2[--length];
      }
      while (length--) {
        accumulator = iteratee(accumulator, array2[length], length, array2);
      }
      return accumulator;
    }
    function arraySome2(array2, predicate) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        if (predicate(array2[index2], index2, array2)) {
          return true;
        }
      }
      return false;
    }
    var asciiSize = baseProperty2("length");
    function asciiToArray2(string2) {
      return string2.split("");
    }
    function asciiWords2(string2) {
      return string2.match(reAsciiWord2) || [];
    }
    function baseFindKey(collection, predicate, eachFunc) {
      var result;
      eachFunc(collection, function(value, key, collection2) {
        if (predicate(value, key, collection2)) {
          result = key;
          return false;
        }
      });
      return result;
    }
    function baseFindIndex(array2, predicate, fromIndex, fromRight) {
      var length = array2.length, index2 = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index2-- : ++index2 < length) {
        if (predicate(array2[index2], index2, array2)) {
          return index2;
        }
      }
      return -1;
    }
    function baseIndexOf(array2, value, fromIndex) {
      return value === value ? strictIndexOf(array2, value, fromIndex) : baseFindIndex(array2, baseIsNaN, fromIndex);
    }
    function baseIndexOfWith(array2, value, fromIndex, comparator) {
      var index2 = fromIndex - 1, length = array2.length;
      while (++index2 < length) {
        if (comparator(array2[index2], value)) {
          return index2;
        }
      }
      return -1;
    }
    function baseIsNaN(value) {
      return value !== value;
    }
    function baseMean(array2, iteratee) {
      var length = array2 == null ? 0 : array2.length;
      return length ? baseSum(array2, iteratee) / length : NAN;
    }
    function baseProperty2(key) {
      return function(object2) {
        return object2 == null ? undefined$1 : object2[key];
      };
    }
    function basePropertyOf2(object2) {
      return function(key) {
        return object2 == null ? undefined$1 : object2[key];
      };
    }
    function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
      eachFunc(collection, function(value, index2, collection2) {
        accumulator = initAccum ? (initAccum = false, value) : iteratee(accumulator, value, index2, collection2);
      });
      return accumulator;
    }
    function baseSortBy(array2, comparer) {
      var length = array2.length;
      array2.sort(comparer);
      while (length--) {
        array2[length] = array2[length].value;
      }
      return array2;
    }
    function baseSum(array2, iteratee) {
      var result, index2 = -1, length = array2.length;
      while (++index2 < length) {
        var current = iteratee(array2[index2]);
        if (current !== undefined$1) {
          result = result === undefined$1 ? current : result + current;
        }
      }
      return result;
    }
    function baseTimes2(n, iteratee) {
      var index2 = -1, result = Array(n);
      while (++index2 < n) {
        result[index2] = iteratee(index2);
      }
      return result;
    }
    function baseToPairs(object2, props) {
      return arrayMap2(props, function(key) {
        return [key, object2[key]];
      });
    }
    function baseTrim(string2) {
      return string2 ? string2.slice(0, trimmedEndIndex(string2) + 1).replace(reTrimStart, "") : string2;
    }
    function baseUnary2(func) {
      return function(value) {
        return func(value);
      };
    }
    function baseValues(object2, props) {
      return arrayMap2(props, function(key) {
        return object2[key];
      });
    }
    function cacheHas2(cache, key) {
      return cache.has(key);
    }
    function charsStartIndex(strSymbols, chrSymbols) {
      var index2 = -1, length = strSymbols.length;
      while (++index2 < length && baseIndexOf(chrSymbols, strSymbols[index2], 0) > -1) {
      }
      return index2;
    }
    function charsEndIndex(strSymbols, chrSymbols) {
      var index2 = strSymbols.length;
      while (index2-- && baseIndexOf(chrSymbols, strSymbols[index2], 0) > -1) {
      }
      return index2;
    }
    function countHolders(array2, placeholder) {
      var length = array2.length, result = 0;
      while (length--) {
        if (array2[length] === placeholder) {
          ++result;
        }
      }
      return result;
    }
    var deburrLetter2 = basePropertyOf2(deburredLetters2);
    var escapeHtmlChar = basePropertyOf2(htmlEscapes);
    function escapeStringChar(chr) {
      return "\\" + stringEscapes[chr];
    }
    function getValue2(object2, key) {
      return object2 == null ? undefined$1 : object2[key];
    }
    function hasUnicode2(string2) {
      return reHasUnicode2.test(string2);
    }
    function hasUnicodeWord2(string2) {
      return reHasUnicodeWord2.test(string2);
    }
    function iteratorToArray(iterator) {
      var data, result = [];
      while (!(data = iterator.next()).done) {
        result.push(data.value);
      }
      return result;
    }
    function mapToArray2(map2) {
      var index2 = -1, result = Array(map2.size);
      map2.forEach(function(value, key) {
        result[++index2] = [key, value];
      });
      return result;
    }
    function overArg2(func, transform2) {
      return function(arg) {
        return func(transform2(arg));
      };
    }
    function replaceHolders(array2, placeholder) {
      var index2 = -1, length = array2.length, resIndex = 0, result = [];
      while (++index2 < length) {
        var value = array2[index2];
        if (value === placeholder || value === PLACEHOLDER) {
          array2[index2] = PLACEHOLDER;
          result[resIndex++] = index2;
        }
      }
      return result;
    }
    function setToArray2(set2) {
      var index2 = -1, result = Array(set2.size);
      set2.forEach(function(value) {
        result[++index2] = value;
      });
      return result;
    }
    function setToPairs(set2) {
      var index2 = -1, result = Array(set2.size);
      set2.forEach(function(value) {
        result[++index2] = [value, value];
      });
      return result;
    }
    function strictIndexOf(array2, value, fromIndex) {
      var index2 = fromIndex - 1, length = array2.length;
      while (++index2 < length) {
        if (array2[index2] === value) {
          return index2;
        }
      }
      return -1;
    }
    function strictLastIndexOf(array2, value, fromIndex) {
      var index2 = fromIndex + 1;
      while (index2--) {
        if (array2[index2] === value) {
          return index2;
        }
      }
      return index2;
    }
    function stringSize(string2) {
      return hasUnicode2(string2) ? unicodeSize(string2) : asciiSize(string2);
    }
    function stringToArray2(string2) {
      return hasUnicode2(string2) ? unicodeToArray2(string2) : asciiToArray2(string2);
    }
    function trimmedEndIndex(string2) {
      var index2 = string2.length;
      while (index2-- && reWhitespace.test(string2.charAt(index2))) {
      }
      return index2;
    }
    var unescapeHtmlChar = basePropertyOf2(htmlUnescapes);
    function unicodeSize(string2) {
      var result = reUnicode2.lastIndex = 0;
      while (reUnicode2.test(string2)) {
        ++result;
      }
      return result;
    }
    function unicodeToArray2(string2) {
      return string2.match(reUnicode2) || [];
    }
    function unicodeWords2(string2) {
      return string2.match(reUnicodeWord2) || [];
    }
    var runInContext = function runInContext2(context) {
      context = context == null ? root2 : _2.defaults(root2.Object(), context, _2.pick(root2, contextProps));
      var Array2 = context.Array, Date2 = context.Date, Error2 = context.Error, Function2 = context.Function, Math2 = context.Math, Object2 = context.Object, RegExp2 = context.RegExp, String2 = context.String, TypeError2 = context.TypeError;
      var arrayProto2 = Array2.prototype, funcProto2 = Function2.prototype, objectProto2 = Object2.prototype;
      var coreJsData2 = context["__core-js_shared__"];
      var funcToString2 = funcProto2.toString;
      var hasOwnProperty2 = objectProto2.hasOwnProperty;
      var idCounter = 0;
      var maskSrcKey2 = function() {
        var uid = /[^.]+$/.exec(coreJsData2 && coreJsData2.keys && coreJsData2.keys.IE_PROTO || "");
        return uid ? "Symbol(src)_1." + uid : "";
      }();
      var nativeObjectToString2 = objectProto2.toString;
      var objectCtorString = funcToString2.call(Object2);
      var oldDash = root2._;
      var reIsNative2 = RegExp2(
        "^" + funcToString2.call(hasOwnProperty2).replace(reRegExpChar2, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      );
      var Buffer2 = moduleExports ? context.Buffer : undefined$1, Symbol2 = context.Symbol, Uint8Array2 = context.Uint8Array, allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : undefined$1, getPrototype = overArg2(Object2.getPrototypeOf, Object2), objectCreate = Object2.create, propertyIsEnumerable2 = objectProto2.propertyIsEnumerable, splice2 = arrayProto2.splice, spreadableSymbol = Symbol2 ? Symbol2.isConcatSpreadable : undefined$1, symIterator = Symbol2 ? Symbol2.iterator : undefined$1, symToStringTag2 = Symbol2 ? Symbol2.toStringTag : undefined$1;
      var defineProperty2 = function() {
        try {
          var func = getNative2(Object2, "defineProperty");
          func({}, "", {});
          return func;
        } catch (e) {
        }
      }();
      var ctxClearTimeout = context.clearTimeout !== root2.clearTimeout && context.clearTimeout, ctxNow = Date2 && Date2.now !== root2.Date.now && Date2.now, ctxSetTimeout = context.setTimeout !== root2.setTimeout && context.setTimeout;
      var nativeCeil = Math2.ceil, nativeFloor = Math2.floor, nativeGetSymbols2 = Object2.getOwnPropertySymbols, nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : undefined$1, nativeIsFinite = context.isFinite, nativeJoin = arrayProto2.join, nativeKeys2 = overArg2(Object2.keys, Object2), nativeMax = Math2.max, nativeMin = Math2.min, nativeNow = Date2.now, nativeParseInt = context.parseInt, nativeRandom = Math2.random, nativeReverse = arrayProto2.reverse;
      var DataView2 = getNative2(context, "DataView"), Map2 = getNative2(context, "Map"), Promise2 = getNative2(context, "Promise"), Set2 = getNative2(context, "Set"), WeakMap2 = getNative2(context, "WeakMap"), nativeCreate2 = getNative2(Object2, "create");
      var metaMap = WeakMap2 && new WeakMap2();
      var realNames = {};
      var dataViewCtorString2 = toSource2(DataView2), mapCtorString2 = toSource2(Map2), promiseCtorString2 = toSource2(Promise2), setCtorString2 = toSource2(Set2), weakMapCtorString2 = toSource2(WeakMap2);
      var symbolProto2 = Symbol2 ? Symbol2.prototype : undefined$1, symbolValueOf2 = symbolProto2 ? symbolProto2.valueOf : undefined$1, symbolToString2 = symbolProto2 ? symbolProto2.toString : undefined$1;
      function lodash2(value) {
        if (isObjectLike2(value) && !isArray2(value) && !(value instanceof LazyWrapper)) {
          if (value instanceof LodashWrapper) {
            return value;
          }
          if (hasOwnProperty2.call(value, "__wrapped__")) {
            return wrapperClone(value);
          }
        }
        return new LodashWrapper(value);
      }
      var baseCreate = /* @__PURE__ */ function() {
        function object2() {
        }
        return function(proto) {
          if (!isObject2(proto)) {
            return {};
          }
          if (objectCreate) {
            return objectCreate(proto);
          }
          object2.prototype = proto;
          var result2 = new object2();
          object2.prototype = undefined$1;
          return result2;
        };
      }();
      function baseLodash() {
      }
      function LodashWrapper(value, chainAll) {
        this.__wrapped__ = value;
        this.__actions__ = [];
        this.__chain__ = !!chainAll;
        this.__index__ = 0;
        this.__values__ = undefined$1;
      }
      lodash2.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        "escape": reEscape,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        "evaluate": reEvaluate,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        "interpolate": reInterpolate,
        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type {string}
         */
        "variable": "",
        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type {Object}
         */
        "imports": {
          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type {Function}
           */
          "_": lodash2
        }
      };
      lodash2.prototype = baseLodash.prototype;
      lodash2.prototype.constructor = lodash2;
      LodashWrapper.prototype = baseCreate(baseLodash.prototype);
      LodashWrapper.prototype.constructor = LodashWrapper;
      function LazyWrapper(value) {
        this.__wrapped__ = value;
        this.__actions__ = [];
        this.__dir__ = 1;
        this.__filtered__ = false;
        this.__iteratees__ = [];
        this.__takeCount__ = MAX_ARRAY_LENGTH;
        this.__views__ = [];
      }
      function lazyClone() {
        var result2 = new LazyWrapper(this.__wrapped__);
        result2.__actions__ = copyArray(this.__actions__);
        result2.__dir__ = this.__dir__;
        result2.__filtered__ = this.__filtered__;
        result2.__iteratees__ = copyArray(this.__iteratees__);
        result2.__takeCount__ = this.__takeCount__;
        result2.__views__ = copyArray(this.__views__);
        return result2;
      }
      function lazyReverse() {
        if (this.__filtered__) {
          var result2 = new LazyWrapper(this);
          result2.__dir__ = -1;
          result2.__filtered__ = true;
        } else {
          result2 = this.clone();
          result2.__dir__ *= -1;
        }
        return result2;
      }
      function lazyValue() {
        var array2 = this.__wrapped__.value(), dir = this.__dir__, isArr = isArray2(array2), isRight = dir < 0, arrLength = isArr ? array2.length : 0, view = getView(0, arrLength, this.__views__), start = view.start, end = view.end, length = end - start, index2 = isRight ? end : start - 1, iteratees = this.__iteratees__, iterLength = iteratees.length, resIndex = 0, takeCount = nativeMin(length, this.__takeCount__);
        if (!isArr || !isRight && arrLength == length && takeCount == length) {
          return baseWrapperValue(array2, this.__actions__);
        }
        var result2 = [];
        outer:
          while (length-- && resIndex < takeCount) {
            index2 += dir;
            var iterIndex = -1, value = array2[index2];
            while (++iterIndex < iterLength) {
              var data = iteratees[iterIndex], iteratee2 = data.iteratee, type = data.type, computed = iteratee2(value);
              if (type == LAZY_MAP_FLAG) {
                value = computed;
              } else if (!computed) {
                if (type == LAZY_FILTER_FLAG) {
                  continue outer;
                } else {
                  break outer;
                }
              }
            }
            result2[resIndex++] = value;
          }
        return result2;
      }
      LazyWrapper.prototype = baseCreate(baseLodash.prototype);
      LazyWrapper.prototype.constructor = LazyWrapper;
      function Hash2(entries) {
        var index2 = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index2 < length) {
          var entry = entries[index2];
          this.set(entry[0], entry[1]);
        }
      }
      function hashClear2() {
        this.__data__ = nativeCreate2 ? nativeCreate2(null) : {};
        this.size = 0;
      }
      function hashDelete2(key) {
        var result2 = this.has(key) && delete this.__data__[key];
        this.size -= result2 ? 1 : 0;
        return result2;
      }
      function hashGet2(key) {
        var data = this.__data__;
        if (nativeCreate2) {
          var result2 = data[key];
          return result2 === HASH_UNDEFINED2 ? undefined$1 : result2;
        }
        return hasOwnProperty2.call(data, key) ? data[key] : undefined$1;
      }
      function hashHas2(key) {
        var data = this.__data__;
        return nativeCreate2 ? data[key] !== undefined$1 : hasOwnProperty2.call(data, key);
      }
      function hashSet2(key, value) {
        var data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = nativeCreate2 && value === undefined$1 ? HASH_UNDEFINED2 : value;
        return this;
      }
      Hash2.prototype.clear = hashClear2;
      Hash2.prototype["delete"] = hashDelete2;
      Hash2.prototype.get = hashGet2;
      Hash2.prototype.has = hashHas2;
      Hash2.prototype.set = hashSet2;
      function ListCache2(entries) {
        var index2 = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index2 < length) {
          var entry = entries[index2];
          this.set(entry[0], entry[1]);
        }
      }
      function listCacheClear2() {
        this.__data__ = [];
        this.size = 0;
      }
      function listCacheDelete2(key) {
        var data = this.__data__, index2 = assocIndexOf2(data, key);
        if (index2 < 0) {
          return false;
        }
        var lastIndex = data.length - 1;
        if (index2 == lastIndex) {
          data.pop();
        } else {
          splice2.call(data, index2, 1);
        }
        --this.size;
        return true;
      }
      function listCacheGet2(key) {
        var data = this.__data__, index2 = assocIndexOf2(data, key);
        return index2 < 0 ? undefined$1 : data[index2][1];
      }
      function listCacheHas2(key) {
        return assocIndexOf2(this.__data__, key) > -1;
      }
      function listCacheSet2(key, value) {
        var data = this.__data__, index2 = assocIndexOf2(data, key);
        if (index2 < 0) {
          ++this.size;
          data.push([key, value]);
        } else {
          data[index2][1] = value;
        }
        return this;
      }
      ListCache2.prototype.clear = listCacheClear2;
      ListCache2.prototype["delete"] = listCacheDelete2;
      ListCache2.prototype.get = listCacheGet2;
      ListCache2.prototype.has = listCacheHas2;
      ListCache2.prototype.set = listCacheSet2;
      function MapCache2(entries) {
        var index2 = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index2 < length) {
          var entry = entries[index2];
          this.set(entry[0], entry[1]);
        }
      }
      function mapCacheClear2() {
        this.size = 0;
        this.__data__ = {
          "hash": new Hash2(),
          "map": new (Map2 || ListCache2)(),
          "string": new Hash2()
        };
      }
      function mapCacheDelete2(key) {
        var result2 = getMapData2(this, key)["delete"](key);
        this.size -= result2 ? 1 : 0;
        return result2;
      }
      function mapCacheGet2(key) {
        return getMapData2(this, key).get(key);
      }
      function mapCacheHas2(key) {
        return getMapData2(this, key).has(key);
      }
      function mapCacheSet2(key, value) {
        var data = getMapData2(this, key), size2 = data.size;
        data.set(key, value);
        this.size += data.size == size2 ? 0 : 1;
        return this;
      }
      MapCache2.prototype.clear = mapCacheClear2;
      MapCache2.prototype["delete"] = mapCacheDelete2;
      MapCache2.prototype.get = mapCacheGet2;
      MapCache2.prototype.has = mapCacheHas2;
      MapCache2.prototype.set = mapCacheSet2;
      function SetCache2(values2) {
        var index2 = -1, length = values2 == null ? 0 : values2.length;
        this.__data__ = new MapCache2();
        while (++index2 < length) {
          this.add(values2[index2]);
        }
      }
      function setCacheAdd2(value) {
        this.__data__.set(value, HASH_UNDEFINED2);
        return this;
      }
      function setCacheHas2(value) {
        return this.__data__.has(value);
      }
      SetCache2.prototype.add = SetCache2.prototype.push = setCacheAdd2;
      SetCache2.prototype.has = setCacheHas2;
      function Stack2(entries) {
        var data = this.__data__ = new ListCache2(entries);
        this.size = data.size;
      }
      function stackClear2() {
        this.__data__ = new ListCache2();
        this.size = 0;
      }
      function stackDelete2(key) {
        var data = this.__data__, result2 = data["delete"](key);
        this.size = data.size;
        return result2;
      }
      function stackGet2(key) {
        return this.__data__.get(key);
      }
      function stackHas2(key) {
        return this.__data__.has(key);
      }
      function stackSet2(key, value) {
        var data = this.__data__;
        if (data instanceof ListCache2) {
          var pairs = data.__data__;
          if (!Map2 || pairs.length < LARGE_ARRAY_SIZE2 - 1) {
            pairs.push([key, value]);
            this.size = ++data.size;
            return this;
          }
          data = this.__data__ = new MapCache2(pairs);
        }
        data.set(key, value);
        this.size = data.size;
        return this;
      }
      Stack2.prototype.clear = stackClear2;
      Stack2.prototype["delete"] = stackDelete2;
      Stack2.prototype.get = stackGet2;
      Stack2.prototype.has = stackHas2;
      Stack2.prototype.set = stackSet2;
      function arrayLikeKeys2(value, inherited) {
        var isArr = isArray2(value), isArg = !isArr && isArguments2(value), isBuff = !isArr && !isArg && isBuffer2(value), isType = !isArr && !isArg && !isBuff && isTypedArray2(value), skipIndexes = isArr || isArg || isBuff || isType, result2 = skipIndexes ? baseTimes2(value.length, String2) : [], length = result2.length;
        for (var key in value) {
          if ((inherited || hasOwnProperty2.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
          (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
          isIndex2(key, length)))) {
            result2.push(key);
          }
        }
        return result2;
      }
      function arraySample(array2) {
        var length = array2.length;
        return length ? array2[baseRandom(0, length - 1)] : undefined$1;
      }
      function arraySampleSize(array2, n) {
        return shuffleSelf(copyArray(array2), baseClamp(n, 0, array2.length));
      }
      function arrayShuffle(array2) {
        return shuffleSelf(copyArray(array2));
      }
      function assignMergeValue(object2, key, value) {
        if (value !== undefined$1 && !eq2(object2[key], value) || value === undefined$1 && !(key in object2)) {
          baseAssignValue2(object2, key, value);
        }
      }
      function assignValue(object2, key, value) {
        var objValue = object2[key];
        if (!(hasOwnProperty2.call(object2, key) && eq2(objValue, value)) || value === undefined$1 && !(key in object2)) {
          baseAssignValue2(object2, key, value);
        }
      }
      function assocIndexOf2(array2, key) {
        var length = array2.length;
        while (length--) {
          if (eq2(array2[length][0], key)) {
            return length;
          }
        }
        return -1;
      }
      function baseAggregator(collection, setter, iteratee2, accumulator) {
        baseEach(collection, function(value, key, collection2) {
          setter(accumulator, value, iteratee2(value), collection2);
        });
        return accumulator;
      }
      function baseAssign(object2, source2) {
        return object2 && copyObject(source2, keys2(source2), object2);
      }
      function baseAssignIn(object2, source2) {
        return object2 && copyObject(source2, keysIn(source2), object2);
      }
      function baseAssignValue2(object2, key, value) {
        if (key == "__proto__" && defineProperty2) {
          defineProperty2(object2, key, {
            "configurable": true,
            "enumerable": true,
            "value": value,
            "writable": true
          });
        } else {
          object2[key] = value;
        }
      }
      function baseAt(object2, paths) {
        var index2 = -1, length = paths.length, result2 = Array2(length), skip = object2 == null;
        while (++index2 < length) {
          result2[index2] = skip ? undefined$1 : get2(object2, paths[index2]);
        }
        return result2;
      }
      function baseClamp(number2, lower, upper) {
        if (number2 === number2) {
          if (upper !== undefined$1) {
            number2 = number2 <= upper ? number2 : upper;
          }
          if (lower !== undefined$1) {
            number2 = number2 >= lower ? number2 : lower;
          }
        }
        return number2;
      }
      function baseClone2(value, bitmask, customizer, key, object2, stack) {
        var result2, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
        if (customizer) {
          result2 = object2 ? customizer(value, key, object2, stack) : customizer(value);
        }
        if (result2 !== undefined$1) {
          return result2;
        }
        if (!isObject2(value)) {
          return value;
        }
        var isArr = isArray2(value);
        if (isArr) {
          result2 = initCloneArray(value);
          if (!isDeep) {
            return copyArray(value, result2);
          }
        } else {
          var tag = getTag2(value), isFunc = tag == funcTag2 || tag == genTag2;
          if (isBuffer2(value)) {
            return cloneBuffer(value, isDeep);
          }
          if (tag == objectTag2 || tag == argsTag2 || isFunc && !object2) {
            result2 = isFlat || isFunc ? {} : initCloneObject(value);
            if (!isDeep) {
              return isFlat ? copySymbolsIn(value, baseAssignIn(result2, value)) : copySymbols(value, baseAssign(result2, value));
            }
          } else {
            if (!cloneableTags[tag]) {
              return object2 ? value : {};
            }
            result2 = initCloneByTag(value, tag, isDeep);
          }
        }
        stack || (stack = new Stack2());
        var stacked = stack.get(value);
        if (stacked) {
          return stacked;
        }
        stack.set(value, result2);
        if (isSet(value)) {
          value.forEach(function(subValue) {
            result2.add(baseClone2(subValue, bitmask, customizer, subValue, value, stack));
          });
        } else if (isMap(value)) {
          value.forEach(function(subValue, key2) {
            result2.set(key2, baseClone2(subValue, bitmask, customizer, key2, value, stack));
          });
        }
        var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys2 : isFlat ? keysIn : keys2;
        var props = isArr ? undefined$1 : keysFunc(value);
        arrayEach(props || value, function(subValue, key2) {
          if (props) {
            key2 = subValue;
            subValue = value[key2];
          }
          assignValue(result2, key2, baseClone2(subValue, bitmask, customizer, key2, value, stack));
        });
        return result2;
      }
      function baseConforms(source2) {
        var props = keys2(source2);
        return function(object2) {
          return baseConformsTo(object2, source2, props);
        };
      }
      function baseConformsTo(object2, source2, props) {
        var length = props.length;
        if (object2 == null) {
          return !length;
        }
        object2 = Object2(object2);
        while (length--) {
          var key = props[length], predicate = source2[key], value = object2[key];
          if (value === undefined$1 && !(key in object2) || !predicate(value)) {
            return false;
          }
        }
        return true;
      }
      function baseDelay(func, wait, args) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        return setTimeout2(function() {
          func.apply(undefined$1, args);
        }, wait);
      }
      function baseDifference(array2, values2, iteratee2, comparator) {
        var index2 = -1, includes2 = arrayIncludes, isCommon = true, length = array2.length, result2 = [], valuesLength = values2.length;
        if (!length) {
          return result2;
        }
        if (iteratee2) {
          values2 = arrayMap2(values2, baseUnary2(iteratee2));
        }
        if (comparator) {
          includes2 = arrayIncludesWith;
          isCommon = false;
        } else if (values2.length >= LARGE_ARRAY_SIZE2) {
          includes2 = cacheHas2;
          isCommon = false;
          values2 = new SetCache2(values2);
        }
        outer:
          while (++index2 < length) {
            var value = array2[index2], computed = iteratee2 == null ? value : iteratee2(value);
            value = comparator || value !== 0 ? value : 0;
            if (isCommon && computed === computed) {
              var valuesIndex = valuesLength;
              while (valuesIndex--) {
                if (values2[valuesIndex] === computed) {
                  continue outer;
                }
              }
              result2.push(value);
            } else if (!includes2(values2, computed, comparator)) {
              result2.push(value);
            }
          }
        return result2;
      }
      var baseEach = createBaseEach(baseForOwn2);
      var baseEachRight = createBaseEach(baseForOwnRight, true);
      function baseEvery(collection, predicate) {
        var result2 = true;
        baseEach(collection, function(value, index2, collection2) {
          result2 = !!predicate(value, index2, collection2);
          return result2;
        });
        return result2;
      }
      function baseExtremum(array2, iteratee2, comparator) {
        var index2 = -1, length = array2.length;
        while (++index2 < length) {
          var value = array2[index2], current = iteratee2(value);
          if (current != null && (computed === undefined$1 ? current === current && !isSymbol2(current) : comparator(current, computed))) {
            var computed = current, result2 = value;
          }
        }
        return result2;
      }
      function baseFill(array2, value, start, end) {
        var length = array2.length;
        start = toInteger(start);
        if (start < 0) {
          start = -start > length ? 0 : length + start;
        }
        end = end === undefined$1 || end > length ? length : toInteger(end);
        if (end < 0) {
          end += length;
        }
        end = start > end ? 0 : toLength(end);
        while (start < end) {
          array2[start++] = value;
        }
        return array2;
      }
      function baseFilter(collection, predicate) {
        var result2 = [];
        baseEach(collection, function(value, index2, collection2) {
          if (predicate(value, index2, collection2)) {
            result2.push(value);
          }
        });
        return result2;
      }
      function baseFlatten(array2, depth, predicate, isStrict, result2) {
        var index2 = -1, length = array2.length;
        predicate || (predicate = isFlattenable);
        result2 || (result2 = []);
        while (++index2 < length) {
          var value = array2[index2];
          if (depth > 0 && predicate(value)) {
            if (depth > 1) {
              baseFlatten(value, depth - 1, predicate, isStrict, result2);
            } else {
              arrayPush2(result2, value);
            }
          } else if (!isStrict) {
            result2[result2.length] = value;
          }
        }
        return result2;
      }
      var baseFor2 = createBaseFor2();
      var baseForRight = createBaseFor2(true);
      function baseForOwn2(object2, iteratee2) {
        return object2 && baseFor2(object2, iteratee2, keys2);
      }
      function baseForOwnRight(object2, iteratee2) {
        return object2 && baseForRight(object2, iteratee2, keys2);
      }
      function baseFunctions(object2, props) {
        return arrayFilter2(props, function(key) {
          return isFunction3(object2[key]);
        });
      }
      function baseGet2(object2, path2) {
        path2 = castPath2(path2, object2);
        var index2 = 0, length = path2.length;
        while (object2 != null && index2 < length) {
          object2 = object2[toKey2(path2[index2++])];
        }
        return index2 && index2 == length ? object2 : undefined$1;
      }
      function baseGetAllKeys2(object2, keysFunc, symbolsFunc) {
        var result2 = keysFunc(object2);
        return isArray2(object2) ? result2 : arrayPush2(result2, symbolsFunc(object2));
      }
      function baseGetTag2(value) {
        if (value == null) {
          return value === undefined$1 ? undefinedTag2 : nullTag2;
        }
        return symToStringTag2 && symToStringTag2 in Object2(value) ? getRawTag2(value) : objectToString2(value);
      }
      function baseGt(value, other) {
        return value > other;
      }
      function baseHas2(object2, key) {
        return object2 != null && hasOwnProperty2.call(object2, key);
      }
      function baseHasIn2(object2, key) {
        return object2 != null && key in Object2(object2);
      }
      function baseInRange(number2, start, end) {
        return number2 >= nativeMin(start, end) && number2 < nativeMax(start, end);
      }
      function baseIntersection(arrays, iteratee2, comparator) {
        var includes2 = comparator ? arrayIncludesWith : arrayIncludes, length = arrays[0].length, othLength = arrays.length, othIndex = othLength, caches = Array2(othLength), maxLength = Infinity, result2 = [];
        while (othIndex--) {
          var array2 = arrays[othIndex];
          if (othIndex && iteratee2) {
            array2 = arrayMap2(array2, baseUnary2(iteratee2));
          }
          maxLength = nativeMin(array2.length, maxLength);
          caches[othIndex] = !comparator && (iteratee2 || length >= 120 && array2.length >= 120) ? new SetCache2(othIndex && array2) : undefined$1;
        }
        array2 = arrays[0];
        var index2 = -1, seen = caches[0];
        outer:
          while (++index2 < length && result2.length < maxLength) {
            var value = array2[index2], computed = iteratee2 ? iteratee2(value) : value;
            value = comparator || value !== 0 ? value : 0;
            if (!(seen ? cacheHas2(seen, computed) : includes2(result2, computed, comparator))) {
              othIndex = othLength;
              while (--othIndex) {
                var cache = caches[othIndex];
                if (!(cache ? cacheHas2(cache, computed) : includes2(arrays[othIndex], computed, comparator))) {
                  continue outer;
                }
              }
              if (seen) {
                seen.push(computed);
              }
              result2.push(value);
            }
          }
        return result2;
      }
      function baseInverter(object2, setter, iteratee2, accumulator) {
        baseForOwn2(object2, function(value, key, object3) {
          setter(accumulator, iteratee2(value), key, object3);
        });
        return accumulator;
      }
      function baseInvoke(object2, path2, args) {
        path2 = castPath2(path2, object2);
        object2 = parent(object2, path2);
        var func = object2 == null ? object2 : object2[toKey2(last(path2))];
        return func == null ? undefined$1 : apply(func, object2, args);
      }
      function baseIsArguments2(value) {
        return isObjectLike2(value) && baseGetTag2(value) == argsTag2;
      }
      function baseIsArrayBuffer(value) {
        return isObjectLike2(value) && baseGetTag2(value) == arrayBufferTag2;
      }
      function baseIsDate(value) {
        return isObjectLike2(value) && baseGetTag2(value) == dateTag2;
      }
      function baseIsEqual2(value, other, bitmask, customizer, stack) {
        if (value === other) {
          return true;
        }
        if (value == null || other == null || !isObjectLike2(value) && !isObjectLike2(other)) {
          return value !== value && other !== other;
        }
        return baseIsEqualDeep2(value, other, bitmask, customizer, baseIsEqual2, stack);
      }
      function baseIsEqualDeep2(object2, other, bitmask, customizer, equalFunc, stack) {
        var objIsArr = isArray2(object2), othIsArr = isArray2(other), objTag = objIsArr ? arrayTag2 : getTag2(object2), othTag = othIsArr ? arrayTag2 : getTag2(other);
        objTag = objTag == argsTag2 ? objectTag2 : objTag;
        othTag = othTag == argsTag2 ? objectTag2 : othTag;
        var objIsObj = objTag == objectTag2, othIsObj = othTag == objectTag2, isSameTag = objTag == othTag;
        if (isSameTag && isBuffer2(object2)) {
          if (!isBuffer2(other)) {
            return false;
          }
          objIsArr = true;
          objIsObj = false;
        }
        if (isSameTag && !objIsObj) {
          stack || (stack = new Stack2());
          return objIsArr || isTypedArray2(object2) ? equalArrays2(object2, other, bitmask, customizer, equalFunc, stack) : equalByTag2(object2, other, objTag, bitmask, customizer, equalFunc, stack);
        }
        if (!(bitmask & COMPARE_PARTIAL_FLAG2)) {
          var objIsWrapped = objIsObj && hasOwnProperty2.call(object2, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty2.call(other, "__wrapped__");
          if (objIsWrapped || othIsWrapped) {
            var objUnwrapped = objIsWrapped ? object2.value() : object2, othUnwrapped = othIsWrapped ? other.value() : other;
            stack || (stack = new Stack2());
            return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
          }
        }
        if (!isSameTag) {
          return false;
        }
        stack || (stack = new Stack2());
        return equalObjects2(object2, other, bitmask, customizer, equalFunc, stack);
      }
      function baseIsMap(value) {
        return isObjectLike2(value) && getTag2(value) == mapTag2;
      }
      function baseIsMatch2(object2, source2, matchData, customizer) {
        var index2 = matchData.length, length = index2, noCustomizer = !customizer;
        if (object2 == null) {
          return !length;
        }
        object2 = Object2(object2);
        while (index2--) {
          var data = matchData[index2];
          if (noCustomizer && data[2] ? data[1] !== object2[data[0]] : !(data[0] in object2)) {
            return false;
          }
        }
        while (++index2 < length) {
          data = matchData[index2];
          var key = data[0], objValue = object2[key], srcValue = data[1];
          if (noCustomizer && data[2]) {
            if (objValue === undefined$1 && !(key in object2)) {
              return false;
            }
          } else {
            var stack = new Stack2();
            if (customizer) {
              var result2 = customizer(objValue, srcValue, key, object2, source2, stack);
            }
            if (!(result2 === undefined$1 ? baseIsEqual2(srcValue, objValue, COMPARE_PARTIAL_FLAG2 | COMPARE_UNORDERED_FLAG2, customizer, stack) : result2)) {
              return false;
            }
          }
        }
        return true;
      }
      function baseIsNative2(value) {
        if (!isObject2(value) || isMasked2(value)) {
          return false;
        }
        var pattern = isFunction3(value) ? reIsNative2 : reIsHostCtor2;
        return pattern.test(toSource2(value));
      }
      function baseIsRegExp(value) {
        return isObjectLike2(value) && baseGetTag2(value) == regexpTag2;
      }
      function baseIsSet(value) {
        return isObjectLike2(value) && getTag2(value) == setTag2;
      }
      function baseIsTypedArray2(value) {
        return isObjectLike2(value) && isLength2(value.length) && !!typedArrayTags2[baseGetTag2(value)];
      }
      function baseIteratee2(value) {
        if (typeof value == "function") {
          return value;
        }
        if (value == null) {
          return identity2;
        }
        if (typeof value == "object") {
          return isArray2(value) ? baseMatchesProperty2(value[0], value[1]) : baseMatches2(value);
        }
        return property2(value);
      }
      function baseKeys2(object2) {
        if (!isPrototype2(object2)) {
          return nativeKeys2(object2);
        }
        var result2 = [];
        for (var key in Object2(object2)) {
          if (hasOwnProperty2.call(object2, key) && key != "constructor") {
            result2.push(key);
          }
        }
        return result2;
      }
      function baseKeysIn(object2) {
        if (!isObject2(object2)) {
          return nativeKeysIn(object2);
        }
        var isProto = isPrototype2(object2), result2 = [];
        for (var key in object2) {
          if (!(key == "constructor" && (isProto || !hasOwnProperty2.call(object2, key)))) {
            result2.push(key);
          }
        }
        return result2;
      }
      function baseLt(value, other) {
        return value < other;
      }
      function baseMap(collection, iteratee2) {
        var index2 = -1, result2 = isArrayLike2(collection) ? Array2(collection.length) : [];
        baseEach(collection, function(value, key, collection2) {
          result2[++index2] = iteratee2(value, key, collection2);
        });
        return result2;
      }
      function baseMatches2(source2) {
        var matchData = getMatchData2(source2);
        if (matchData.length == 1 && matchData[0][2]) {
          return matchesStrictComparable2(matchData[0][0], matchData[0][1]);
        }
        return function(object2) {
          return object2 === source2 || baseIsMatch2(object2, source2, matchData);
        };
      }
      function baseMatchesProperty2(path2, srcValue) {
        if (isKey2(path2) && isStrictComparable2(srcValue)) {
          return matchesStrictComparable2(toKey2(path2), srcValue);
        }
        return function(object2) {
          var objValue = get2(object2, path2);
          return objValue === undefined$1 && objValue === srcValue ? hasIn2(object2, path2) : baseIsEqual2(srcValue, objValue, COMPARE_PARTIAL_FLAG2 | COMPARE_UNORDERED_FLAG2);
        };
      }
      function baseMerge(object2, source2, srcIndex, customizer, stack) {
        if (object2 === source2) {
          return;
        }
        baseFor2(source2, function(srcValue, key) {
          stack || (stack = new Stack2());
          if (isObject2(srcValue)) {
            baseMergeDeep(object2, source2, key, srcIndex, baseMerge, customizer, stack);
          } else {
            var newValue = customizer ? customizer(safeGet(object2, key), srcValue, key + "", object2, source2, stack) : undefined$1;
            if (newValue === undefined$1) {
              newValue = srcValue;
            }
            assignMergeValue(object2, key, newValue);
          }
        }, keysIn);
      }
      function baseMergeDeep(object2, source2, key, srcIndex, mergeFunc, customizer, stack) {
        var objValue = safeGet(object2, key), srcValue = safeGet(source2, key), stacked = stack.get(srcValue);
        if (stacked) {
          assignMergeValue(object2, key, stacked);
          return;
        }
        var newValue = customizer ? customizer(objValue, srcValue, key + "", object2, source2, stack) : undefined$1;
        var isCommon = newValue === undefined$1;
        if (isCommon) {
          var isArr = isArray2(srcValue), isBuff = !isArr && isBuffer2(srcValue), isTyped = !isArr && !isBuff && isTypedArray2(srcValue);
          newValue = srcValue;
          if (isArr || isBuff || isTyped) {
            if (isArray2(objValue)) {
              newValue = objValue;
            } else if (isArrayLikeObject(objValue)) {
              newValue = copyArray(objValue);
            } else if (isBuff) {
              isCommon = false;
              newValue = cloneBuffer(srcValue, true);
            } else if (isTyped) {
              isCommon = false;
              newValue = cloneTypedArray(srcValue, true);
            } else {
              newValue = [];
            }
          } else if (isPlainObject2(srcValue) || isArguments2(srcValue)) {
            newValue = objValue;
            if (isArguments2(objValue)) {
              newValue = toPlainObject(objValue);
            } else if (!isObject2(objValue) || isFunction3(objValue)) {
              newValue = initCloneObject(srcValue);
            }
          } else {
            isCommon = false;
          }
        }
        if (isCommon) {
          stack.set(srcValue, newValue);
          mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
          stack["delete"](srcValue);
        }
        assignMergeValue(object2, key, newValue);
      }
      function baseNth(array2, n) {
        var length = array2.length;
        if (!length) {
          return;
        }
        n += n < 0 ? length : 0;
        return isIndex2(n, length) ? array2[n] : undefined$1;
      }
      function baseOrderBy(collection, iteratees, orders) {
        if (iteratees.length) {
          iteratees = arrayMap2(iteratees, function(iteratee2) {
            if (isArray2(iteratee2)) {
              return function(value) {
                return baseGet2(value, iteratee2.length === 1 ? iteratee2[0] : iteratee2);
              };
            }
            return iteratee2;
          });
        } else {
          iteratees = [identity2];
        }
        var index2 = -1;
        iteratees = arrayMap2(iteratees, baseUnary2(getIteratee()));
        var result2 = baseMap(collection, function(value, key, collection2) {
          var criteria = arrayMap2(iteratees, function(iteratee2) {
            return iteratee2(value);
          });
          return { "criteria": criteria, "index": ++index2, "value": value };
        });
        return baseSortBy(result2, function(object2, other) {
          return compareMultiple(object2, other, orders);
        });
      }
      function basePick(object2, paths) {
        return basePickBy(object2, paths, function(value, path2) {
          return hasIn2(object2, path2);
        });
      }
      function basePickBy(object2, paths, predicate) {
        var index2 = -1, length = paths.length, result2 = {};
        while (++index2 < length) {
          var path2 = paths[index2], value = baseGet2(object2, path2);
          if (predicate(value, path2)) {
            baseSet(result2, castPath2(path2, object2), value);
          }
        }
        return result2;
      }
      function basePropertyDeep2(path2) {
        return function(object2) {
          return baseGet2(object2, path2);
        };
      }
      function basePullAll(array2, values2, iteratee2, comparator) {
        var indexOf2 = comparator ? baseIndexOfWith : baseIndexOf, index2 = -1, length = values2.length, seen = array2;
        if (array2 === values2) {
          values2 = copyArray(values2);
        }
        if (iteratee2) {
          seen = arrayMap2(array2, baseUnary2(iteratee2));
        }
        while (++index2 < length) {
          var fromIndex = 0, value = values2[index2], computed = iteratee2 ? iteratee2(value) : value;
          while ((fromIndex = indexOf2(seen, computed, fromIndex, comparator)) > -1) {
            if (seen !== array2) {
              splice2.call(seen, fromIndex, 1);
            }
            splice2.call(array2, fromIndex, 1);
          }
        }
        return array2;
      }
      function basePullAt(array2, indexes) {
        var length = array2 ? indexes.length : 0, lastIndex = length - 1;
        while (length--) {
          var index2 = indexes[length];
          if (length == lastIndex || index2 !== previous) {
            var previous = index2;
            if (isIndex2(index2)) {
              splice2.call(array2, index2, 1);
            } else {
              baseUnset(array2, index2);
            }
          }
        }
        return array2;
      }
      function baseRandom(lower, upper) {
        return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
      }
      function baseRange(start, end, step, fromRight) {
        var index2 = -1, length = nativeMax(nativeCeil((end - start) / (step || 1)), 0), result2 = Array2(length);
        while (length--) {
          result2[fromRight ? length : ++index2] = start;
          start += step;
        }
        return result2;
      }
      function baseRepeat(string2, n) {
        var result2 = "";
        if (!string2 || n < 1 || n > MAX_SAFE_INTEGER2) {
          return result2;
        }
        do {
          if (n % 2) {
            result2 += string2;
          }
          n = nativeFloor(n / 2);
          if (n) {
            string2 += string2;
          }
        } while (n);
        return result2;
      }
      function baseRest(func, start) {
        return setToString(overRest(func, start, identity2), func + "");
      }
      function baseSample(collection) {
        return arraySample(values(collection));
      }
      function baseSampleSize(collection, n) {
        var array2 = values(collection);
        return shuffleSelf(array2, baseClamp(n, 0, array2.length));
      }
      function baseSet(object2, path2, value, customizer) {
        if (!isObject2(object2)) {
          return object2;
        }
        path2 = castPath2(path2, object2);
        var index2 = -1, length = path2.length, lastIndex = length - 1, nested = object2;
        while (nested != null && ++index2 < length) {
          var key = toKey2(path2[index2]), newValue = value;
          if (key === "__proto__" || key === "constructor" || key === "prototype") {
            return object2;
          }
          if (index2 != lastIndex) {
            var objValue = nested[key];
            newValue = customizer ? customizer(objValue, key, nested) : undefined$1;
            if (newValue === undefined$1) {
              newValue = isObject2(objValue) ? objValue : isIndex2(path2[index2 + 1]) ? [] : {};
            }
          }
          assignValue(nested, key, newValue);
          nested = nested[key];
        }
        return object2;
      }
      var baseSetData = !metaMap ? identity2 : function(func, data) {
        metaMap.set(func, data);
        return func;
      };
      var baseSetToString = !defineProperty2 ? identity2 : function(func, string2) {
        return defineProperty2(func, "toString", {
          "configurable": true,
          "enumerable": false,
          "value": constant(string2),
          "writable": true
        });
      };
      function baseShuffle(collection) {
        return shuffleSelf(values(collection));
      }
      function baseSlice2(array2, start, end) {
        var index2 = -1, length = array2.length;
        if (start < 0) {
          start = -start > length ? 0 : length + start;
        }
        end = end > length ? length : end;
        if (end < 0) {
          end += length;
        }
        length = start > end ? 0 : end - start >>> 0;
        start >>>= 0;
        var result2 = Array2(length);
        while (++index2 < length) {
          result2[index2] = array2[index2 + start];
        }
        return result2;
      }
      function baseSome(collection, predicate) {
        var result2;
        baseEach(collection, function(value, index2, collection2) {
          result2 = predicate(value, index2, collection2);
          return !result2;
        });
        return !!result2;
      }
      function baseSortedIndex(array2, value, retHighest) {
        var low = 0, high = array2 == null ? low : array2.length;
        if (typeof value == "number" && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
          while (low < high) {
            var mid = low + high >>> 1, computed = array2[mid];
            if (computed !== null && !isSymbol2(computed) && (retHighest ? computed <= value : computed < value)) {
              low = mid + 1;
            } else {
              high = mid;
            }
          }
          return high;
        }
        return baseSortedIndexBy(array2, value, identity2, retHighest);
      }
      function baseSortedIndexBy(array2, value, iteratee2, retHighest) {
        var low = 0, high = array2 == null ? 0 : array2.length;
        if (high === 0) {
          return 0;
        }
        value = iteratee2(value);
        var valIsNaN = value !== value, valIsNull = value === null, valIsSymbol = isSymbol2(value), valIsUndefined = value === undefined$1;
        while (low < high) {
          var mid = nativeFloor((low + high) / 2), computed = iteratee2(array2[mid]), othIsDefined = computed !== undefined$1, othIsNull = computed === null, othIsReflexive = computed === computed, othIsSymbol = isSymbol2(computed);
          if (valIsNaN) {
            var setLow = retHighest || othIsReflexive;
          } else if (valIsUndefined) {
            setLow = othIsReflexive && (retHighest || othIsDefined);
          } else if (valIsNull) {
            setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
          } else if (valIsSymbol) {
            setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
          } else if (othIsNull || othIsSymbol) {
            setLow = false;
          } else {
            setLow = retHighest ? computed <= value : computed < value;
          }
          if (setLow) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return nativeMin(high, MAX_ARRAY_INDEX);
      }
      function baseSortedUniq(array2, iteratee2) {
        var index2 = -1, length = array2.length, resIndex = 0, result2 = [];
        while (++index2 < length) {
          var value = array2[index2], computed = iteratee2 ? iteratee2(value) : value;
          if (!index2 || !eq2(computed, seen)) {
            var seen = computed;
            result2[resIndex++] = value === 0 ? 0 : value;
          }
        }
        return result2;
      }
      function baseToNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol2(value)) {
          return NAN;
        }
        return +value;
      }
      function baseToString2(value) {
        if (typeof value == "string") {
          return value;
        }
        if (isArray2(value)) {
          return arrayMap2(value, baseToString2) + "";
        }
        if (isSymbol2(value)) {
          return symbolToString2 ? symbolToString2.call(value) : "";
        }
        var result2 = value + "";
        return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
      }
      function baseUniq(array2, iteratee2, comparator) {
        var index2 = -1, includes2 = arrayIncludes, length = array2.length, isCommon = true, result2 = [], seen = result2;
        if (comparator) {
          isCommon = false;
          includes2 = arrayIncludesWith;
        } else if (length >= LARGE_ARRAY_SIZE2) {
          var set3 = iteratee2 ? null : createSet(array2);
          if (set3) {
            return setToArray2(set3);
          }
          isCommon = false;
          includes2 = cacheHas2;
          seen = new SetCache2();
        } else {
          seen = iteratee2 ? [] : result2;
        }
        outer:
          while (++index2 < length) {
            var value = array2[index2], computed = iteratee2 ? iteratee2(value) : value;
            value = comparator || value !== 0 ? value : 0;
            if (isCommon && computed === computed) {
              var seenIndex = seen.length;
              while (seenIndex--) {
                if (seen[seenIndex] === computed) {
                  continue outer;
                }
              }
              if (iteratee2) {
                seen.push(computed);
              }
              result2.push(value);
            } else if (!includes2(seen, computed, comparator)) {
              if (seen !== result2) {
                seen.push(computed);
              }
              result2.push(value);
            }
          }
        return result2;
      }
      function baseUnset(object2, path2) {
        path2 = castPath2(path2, object2);
        var index2 = -1, length = path2.length;
        if (!length) {
          return true;
        }
        while (++index2 < length) {
          var key = toKey2(path2[index2]);
          if (key === "__proto__" && !hasOwnProperty2.call(object2, "__proto__")) {
            return false;
          }
          if ((key === "constructor" || key === "prototype") && index2 < length - 1) {
            return false;
          }
        }
        var obj = parent(object2, path2);
        return obj == null || delete obj[toKey2(last(path2))];
      }
      function baseUpdate(object2, path2, updater, customizer) {
        return baseSet(object2, path2, updater(baseGet2(object2, path2)), customizer);
      }
      function baseWhile(array2, predicate, isDrop, fromRight) {
        var length = array2.length, index2 = fromRight ? length : -1;
        while ((fromRight ? index2-- : ++index2 < length) && predicate(array2[index2], index2, array2)) {
        }
        return isDrop ? baseSlice2(array2, fromRight ? 0 : index2, fromRight ? index2 + 1 : length) : baseSlice2(array2, fromRight ? index2 + 1 : 0, fromRight ? length : index2);
      }
      function baseWrapperValue(value, actions) {
        var result2 = value;
        if (result2 instanceof LazyWrapper) {
          result2 = result2.value();
        }
        return arrayReduce2(actions, function(result3, action) {
          return action.func.apply(action.thisArg, arrayPush2([result3], action.args));
        }, result2);
      }
      function baseXor(arrays, iteratee2, comparator) {
        var length = arrays.length;
        if (length < 2) {
          return length ? baseUniq(arrays[0]) : [];
        }
        var index2 = -1, result2 = Array2(length);
        while (++index2 < length) {
          var array2 = arrays[index2], othIndex = -1;
          while (++othIndex < length) {
            if (othIndex != index2) {
              result2[index2] = baseDifference(result2[index2] || array2, arrays[othIndex], iteratee2, comparator);
            }
          }
        }
        return baseUniq(baseFlatten(result2, 1), iteratee2, comparator);
      }
      function baseZipObject(props, values2, assignFunc) {
        var index2 = -1, length = props.length, valsLength = values2.length, result2 = {};
        while (++index2 < length) {
          var value = index2 < valsLength ? values2[index2] : undefined$1;
          assignFunc(result2, props[index2], value);
        }
        return result2;
      }
      function castArrayLikeObject(value) {
        return isArrayLikeObject(value) ? value : [];
      }
      function castFunction(value) {
        return typeof value == "function" ? value : identity2;
      }
      function castPath2(value, object2) {
        if (isArray2(value)) {
          return value;
        }
        return isKey2(value, object2) ? [value] : stringToPath2(toString2(value));
      }
      var castRest = baseRest;
      function castSlice2(array2, start, end) {
        var length = array2.length;
        end = end === undefined$1 ? length : end;
        return !start && end >= length ? array2 : baseSlice2(array2, start, end);
      }
      var clearTimeout2 = ctxClearTimeout || function(id) {
        return root2.clearTimeout(id);
      };
      function cloneBuffer(buffer, isDeep) {
        if (isDeep) {
          return buffer.slice();
        }
        var length = buffer.length, result2 = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
        buffer.copy(result2);
        return result2;
      }
      function cloneArrayBuffer(arrayBuffer) {
        var result2 = new arrayBuffer.constructor(arrayBuffer.byteLength);
        new Uint8Array2(result2).set(new Uint8Array2(arrayBuffer));
        return result2;
      }
      function cloneDataView(dataView, isDeep) {
        var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
        return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
      }
      function cloneRegExp(regexp) {
        var result2 = new regexp.constructor(regexp.source, reFlags.exec(regexp));
        result2.lastIndex = regexp.lastIndex;
        return result2;
      }
      function cloneSymbol(symbol) {
        return symbolValueOf2 ? Object2(symbolValueOf2.call(symbol)) : {};
      }
      function cloneTypedArray(typedArray, isDeep) {
        var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
        return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
      }
      function compareAscending(value, other) {
        if (value !== other) {
          var valIsDefined = value !== undefined$1, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol2(value);
          var othIsDefined = other !== undefined$1, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol2(other);
          if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
            return 1;
          }
          if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
            return -1;
          }
        }
        return 0;
      }
      function compareMultiple(object2, other, orders) {
        var index2 = -1, objCriteria = object2.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
        while (++index2 < length) {
          var result2 = compareAscending(objCriteria[index2], othCriteria[index2]);
          if (result2) {
            if (index2 >= ordersLength) {
              return result2;
            }
            var order = orders[index2];
            return result2 * (order == "desc" ? -1 : 1);
          }
        }
        return object2.index - other.index;
      }
      function composeArgs(args, partials, holders, isCurried) {
        var argsIndex = -1, argsLength = args.length, holdersLength = holders.length, leftIndex = -1, leftLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(leftLength + rangeLength), isUncurried = !isCurried;
        while (++leftIndex < leftLength) {
          result2[leftIndex] = partials[leftIndex];
        }
        while (++argsIndex < holdersLength) {
          if (isUncurried || argsIndex < argsLength) {
            result2[holders[argsIndex]] = args[argsIndex];
          }
        }
        while (rangeLength--) {
          result2[leftIndex++] = args[argsIndex++];
        }
        return result2;
      }
      function composeArgsRight(args, partials, holders, isCurried) {
        var argsIndex = -1, argsLength = args.length, holdersIndex = -1, holdersLength = holders.length, rightIndex = -1, rightLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(rangeLength + rightLength), isUncurried = !isCurried;
        while (++argsIndex < rangeLength) {
          result2[argsIndex] = args[argsIndex];
        }
        var offset = argsIndex;
        while (++rightIndex < rightLength) {
          result2[offset + rightIndex] = partials[rightIndex];
        }
        while (++holdersIndex < holdersLength) {
          if (isUncurried || argsIndex < argsLength) {
            result2[offset + holders[holdersIndex]] = args[argsIndex++];
          }
        }
        return result2;
      }
      function copyArray(source2, array2) {
        var index2 = -1, length = source2.length;
        array2 || (array2 = Array2(length));
        while (++index2 < length) {
          array2[index2] = source2[index2];
        }
        return array2;
      }
      function copyObject(source2, props, object2, customizer) {
        var isNew = !object2;
        object2 || (object2 = {});
        var index2 = -1, length = props.length;
        while (++index2 < length) {
          var key = props[index2];
          var newValue = customizer ? customizer(object2[key], source2[key], key, object2, source2) : undefined$1;
          if (newValue === undefined$1) {
            newValue = source2[key];
          }
          if (isNew) {
            baseAssignValue2(object2, key, newValue);
          } else {
            assignValue(object2, key, newValue);
          }
        }
        return object2;
      }
      function copySymbols(source2, object2) {
        return copyObject(source2, getSymbols2(source2), object2);
      }
      function copySymbolsIn(source2, object2) {
        return copyObject(source2, getSymbolsIn(source2), object2);
      }
      function createAggregator(setter, initializer2) {
        return function(collection, iteratee2) {
          var func = isArray2(collection) ? arrayAggregator : baseAggregator, accumulator = initializer2 ? initializer2() : {};
          return func(collection, setter, getIteratee(iteratee2, 2), accumulator);
        };
      }
      function createAssigner(assigner) {
        return baseRest(function(object2, sources) {
          var index2 = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : undefined$1, guard = length > 2 ? sources[2] : undefined$1;
          customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : undefined$1;
          if (guard && isIterateeCall(sources[0], sources[1], guard)) {
            customizer = length < 3 ? undefined$1 : customizer;
            length = 1;
          }
          object2 = Object2(object2);
          while (++index2 < length) {
            var source2 = sources[index2];
            if (source2) {
              assigner(object2, source2, index2, customizer);
            }
          }
          return object2;
        });
      }
      function createBaseEach(eachFunc, fromRight) {
        return function(collection, iteratee2) {
          if (collection == null) {
            return collection;
          }
          if (!isArrayLike2(collection)) {
            return eachFunc(collection, iteratee2);
          }
          var length = collection.length, index2 = fromRight ? length : -1, iterable = Object2(collection);
          while (fromRight ? index2-- : ++index2 < length) {
            if (iteratee2(iterable[index2], index2, iterable) === false) {
              break;
            }
          }
          return collection;
        };
      }
      function createBaseFor2(fromRight) {
        return function(object2, iteratee2, keysFunc) {
          var index2 = -1, iterable = Object2(object2), props = keysFunc(object2), length = props.length;
          while (length--) {
            var key = props[fromRight ? length : ++index2];
            if (iteratee2(iterable[key], key, iterable) === false) {
              break;
            }
          }
          return object2;
        };
      }
      function createBind(func, bitmask, thisArg) {
        var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
        function wrapper() {
          var fn = this && this !== root2 && this instanceof wrapper ? Ctor : func;
          return fn.apply(isBind ? thisArg : this, arguments);
        }
        return wrapper;
      }
      function createCaseFirst2(methodName) {
        return function(string2) {
          string2 = toString2(string2);
          var strSymbols = hasUnicode2(string2) ? stringToArray2(string2) : undefined$1;
          var chr = strSymbols ? strSymbols[0] : string2.charAt(0);
          var trailing = strSymbols ? castSlice2(strSymbols, 1).join("") : string2.slice(1);
          return chr[methodName]() + trailing;
        };
      }
      function createCompounder2(callback) {
        return function(string2) {
          return arrayReduce2(words2(deburr2(string2).replace(reApos2, "")), callback, "");
        };
      }
      function createCtor(Ctor) {
        return function() {
          var args = arguments;
          switch (args.length) {
            case 0:
              return new Ctor();
            case 1:
              return new Ctor(args[0]);
            case 2:
              return new Ctor(args[0], args[1]);
            case 3:
              return new Ctor(args[0], args[1], args[2]);
            case 4:
              return new Ctor(args[0], args[1], args[2], args[3]);
            case 5:
              return new Ctor(args[0], args[1], args[2], args[3], args[4]);
            case 6:
              return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
            case 7:
              return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          }
          var thisBinding = baseCreate(Ctor.prototype), result2 = Ctor.apply(thisBinding, args);
          return isObject2(result2) ? result2 : thisBinding;
        };
      }
      function createCurry(func, bitmask, arity) {
        var Ctor = createCtor(func);
        function wrapper() {
          var length = arguments.length, args = Array2(length), index2 = length, placeholder = getHolder(wrapper);
          while (index2--) {
            args[index2] = arguments[index2];
          }
          var holders = length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder ? [] : replaceHolders(args, placeholder);
          length -= holders.length;
          if (length < arity) {
            return createRecurry(
              func,
              bitmask,
              createHybrid,
              wrapper.placeholder,
              undefined$1,
              args,
              holders,
              undefined$1,
              undefined$1,
              arity - length
            );
          }
          var fn = this && this !== root2 && this instanceof wrapper ? Ctor : func;
          return apply(fn, this, args);
        }
        return wrapper;
      }
      function createFind(findIndexFunc) {
        return function(collection, predicate, fromIndex) {
          var iterable = Object2(collection);
          if (!isArrayLike2(collection)) {
            var iteratee2 = getIteratee(predicate, 3);
            collection = keys2(collection);
            predicate = function(key) {
              return iteratee2(iterable[key], key, iterable);
            };
          }
          var index2 = findIndexFunc(collection, predicate, fromIndex);
          return index2 > -1 ? iterable[iteratee2 ? collection[index2] : index2] : undefined$1;
        };
      }
      function createFlow(fromRight) {
        return flatRest(function(funcs) {
          var length = funcs.length, index2 = length, prereq = LodashWrapper.prototype.thru;
          if (fromRight) {
            funcs.reverse();
          }
          while (index2--) {
            var func = funcs[index2];
            if (typeof func != "function") {
              throw new TypeError2(FUNC_ERROR_TEXT2);
            }
            if (prereq && !wrapper && getFuncName(func) == "wrapper") {
              var wrapper = new LodashWrapper([], true);
            }
          }
          index2 = wrapper ? index2 : length;
          while (++index2 < length) {
            func = funcs[index2];
            var funcName = getFuncName(func), data = funcName == "wrapper" ? getData(func) : undefined$1;
            if (data && isLaziable(data[0]) && data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) && !data[4].length && data[9] == 1) {
              wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
            } else {
              wrapper = func.length == 1 && isLaziable(func) ? wrapper[funcName]() : wrapper.thru(func);
            }
          }
          return function() {
            var args = arguments, value = args[0];
            if (wrapper && args.length == 1 && isArray2(value)) {
              return wrapper.plant(value).value();
            }
            var index3 = 0, result2 = length ? funcs[index3].apply(this, args) : value;
            while (++index3 < length) {
              result2 = funcs[index3].call(this, result2);
            }
            return result2;
          };
        });
      }
      function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary2, arity) {
        var isAry = bitmask & WRAP_ARY_FLAG, isBind = bitmask & WRAP_BIND_FLAG, isBindKey = bitmask & WRAP_BIND_KEY_FLAG, isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG), isFlip = bitmask & WRAP_FLIP_FLAG, Ctor = isBindKey ? undefined$1 : createCtor(func);
        function wrapper() {
          var length = arguments.length, args = Array2(length), index2 = length;
          while (index2--) {
            args[index2] = arguments[index2];
          }
          if (isCurried) {
            var placeholder = getHolder(wrapper), holdersCount = countHolders(args, placeholder);
          }
          if (partials) {
            args = composeArgs(args, partials, holders, isCurried);
          }
          if (partialsRight) {
            args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
          }
          length -= holdersCount;
          if (isCurried && length < arity) {
            var newHolders = replaceHolders(args, placeholder);
            return createRecurry(
              func,
              bitmask,
              createHybrid,
              wrapper.placeholder,
              thisArg,
              args,
              newHolders,
              argPos,
              ary2,
              arity - length
            );
          }
          var thisBinding = isBind ? thisArg : this, fn = isBindKey ? thisBinding[func] : func;
          length = args.length;
          if (argPos) {
            args = reorder(args, argPos);
          } else if (isFlip && length > 1) {
            args.reverse();
          }
          if (isAry && ary2 < length) {
            args.length = ary2;
          }
          if (this && this !== root2 && this instanceof wrapper) {
            fn = Ctor || createCtor(fn);
          }
          return fn.apply(thisBinding, args);
        }
        return wrapper;
      }
      function createInverter(setter, toIteratee) {
        return function(object2, iteratee2) {
          return baseInverter(object2, setter, toIteratee(iteratee2), {});
        };
      }
      function createMathOperation(operator, defaultValue) {
        return function(value, other) {
          var result2;
          if (value === undefined$1 && other === undefined$1) {
            return defaultValue;
          }
          if (value !== undefined$1) {
            result2 = value;
          }
          if (other !== undefined$1) {
            if (result2 === undefined$1) {
              return other;
            }
            if (typeof value == "string" || typeof other == "string") {
              value = baseToString2(value);
              other = baseToString2(other);
            } else {
              value = baseToNumber(value);
              other = baseToNumber(other);
            }
            result2 = operator(value, other);
          }
          return result2;
        };
      }
      function createOver(arrayFunc) {
        return flatRest(function(iteratees) {
          iteratees = arrayMap2(iteratees, baseUnary2(getIteratee()));
          return baseRest(function(args) {
            var thisArg = this;
            return arrayFunc(iteratees, function(iteratee2) {
              return apply(iteratee2, thisArg, args);
            });
          });
        });
      }
      function createPadding(length, chars) {
        chars = chars === undefined$1 ? " " : baseToString2(chars);
        var charsLength = chars.length;
        if (charsLength < 2) {
          return charsLength ? baseRepeat(chars, length) : chars;
        }
        var result2 = baseRepeat(chars, nativeCeil(length / stringSize(chars)));
        return hasUnicode2(chars) ? castSlice2(stringToArray2(result2), 0, length).join("") : result2.slice(0, length);
      }
      function createPartial(func, bitmask, thisArg, partials) {
        var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
        function wrapper() {
          var argsIndex = -1, argsLength = arguments.length, leftIndex = -1, leftLength = partials.length, args = Array2(leftLength + argsLength), fn = this && this !== root2 && this instanceof wrapper ? Ctor : func;
          while (++leftIndex < leftLength) {
            args[leftIndex] = partials[leftIndex];
          }
          while (argsLength--) {
            args[leftIndex++] = arguments[++argsIndex];
          }
          return apply(fn, isBind ? thisArg : this, args);
        }
        return wrapper;
      }
      function createRange(fromRight) {
        return function(start, end, step) {
          if (step && typeof step != "number" && isIterateeCall(start, end, step)) {
            end = step = undefined$1;
          }
          start = toFinite(start);
          if (end === undefined$1) {
            end = start;
            start = 0;
          } else {
            end = toFinite(end);
          }
          step = step === undefined$1 ? start < end ? 1 : -1 : toFinite(step);
          return baseRange(start, end, step, fromRight);
        };
      }
      function createRelationalOperation(operator) {
        return function(value, other) {
          if (!(typeof value == "string" && typeof other == "string")) {
            value = toNumber(value);
            other = toNumber(other);
          }
          return operator(value, other);
        };
      }
      function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary2, arity) {
        var isCurry = bitmask & WRAP_CURRY_FLAG, newHolders = isCurry ? holders : undefined$1, newHoldersRight = isCurry ? undefined$1 : holders, newPartials = isCurry ? partials : undefined$1, newPartialsRight = isCurry ? undefined$1 : partials;
        bitmask |= isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG;
        bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);
        if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
          bitmask &= -4;
        }
        var newData = [
          func,
          bitmask,
          thisArg,
          newPartials,
          newHolders,
          newPartialsRight,
          newHoldersRight,
          argPos,
          ary2,
          arity
        ];
        var result2 = wrapFunc.apply(undefined$1, newData);
        if (isLaziable(func)) {
          setData(result2, newData);
        }
        result2.placeholder = placeholder;
        return setWrapToString(result2, func, bitmask);
      }
      function createRound(methodName) {
        var func = Math2[methodName];
        return function(number2, precision) {
          number2 = toNumber(number2);
          precision = precision == null ? 0 : nativeMin(toInteger(precision), 292);
          if (precision && nativeIsFinite(number2)) {
            var pair = (toString2(number2) + "e").split("e"), value = func(pair[0] + "e" + (+pair[1] + precision));
            pair = (toString2(value) + "e").split("e");
            return +(pair[0] + "e" + (+pair[1] - precision));
          }
          return func(number2);
        };
      }
      var createSet = !(Set2 && 1 / setToArray2(new Set2([, -0]))[1] == INFINITY) ? noop : function(values2) {
        return new Set2(values2);
      };
      function createToPairs(keysFunc) {
        return function(object2) {
          var tag = getTag2(object2);
          if (tag == mapTag2) {
            return mapToArray2(object2);
          }
          if (tag == setTag2) {
            return setToPairs(object2);
          }
          return baseToPairs(object2, keysFunc(object2));
        };
      }
      function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary2, arity) {
        var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
        if (!isBindKey && typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        var length = partials ? partials.length : 0;
        if (!length) {
          bitmask &= -97;
          partials = holders = undefined$1;
        }
        ary2 = ary2 === undefined$1 ? ary2 : nativeMax(toInteger(ary2), 0);
        arity = arity === undefined$1 ? arity : toInteger(arity);
        length -= holders ? holders.length : 0;
        if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
          var partialsRight = partials, holdersRight = holders;
          partials = holders = undefined$1;
        }
        var data = isBindKey ? undefined$1 : getData(func);
        var newData = [
          func,
          bitmask,
          thisArg,
          partials,
          holders,
          partialsRight,
          holdersRight,
          argPos,
          ary2,
          arity
        ];
        if (data) {
          mergeData(newData, data);
        }
        func = newData[0];
        bitmask = newData[1];
        thisArg = newData[2];
        partials = newData[3];
        holders = newData[4];
        arity = newData[9] = newData[9] === undefined$1 ? isBindKey ? 0 : func.length : nativeMax(newData[9] - length, 0);
        if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
          bitmask &= -25;
        }
        if (!bitmask || bitmask == WRAP_BIND_FLAG) {
          var result2 = createBind(func, bitmask, thisArg);
        } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
          result2 = createCurry(func, bitmask, arity);
        } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
          result2 = createPartial(func, bitmask, thisArg, partials);
        } else {
          result2 = createHybrid.apply(undefined$1, newData);
        }
        var setter = data ? baseSetData : setData;
        return setWrapToString(setter(result2, newData), func, bitmask);
      }
      function customDefaultsAssignIn(objValue, srcValue, key, object2) {
        if (objValue === undefined$1 || eq2(objValue, objectProto2[key]) && !hasOwnProperty2.call(object2, key)) {
          return srcValue;
        }
        return objValue;
      }
      function customDefaultsMerge(objValue, srcValue, key, object2, source2, stack) {
        if (isObject2(objValue) && isObject2(srcValue)) {
          stack.set(srcValue, objValue);
          baseMerge(objValue, srcValue, undefined$1, customDefaultsMerge, stack);
          stack["delete"](srcValue);
        }
        return objValue;
      }
      function customOmitClone(value) {
        return isPlainObject2(value) ? undefined$1 : value;
      }
      function equalArrays2(array2, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG2, arrLength = array2.length, othLength = other.length;
        if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
          return false;
        }
        var arrStacked = stack.get(array2);
        var othStacked = stack.get(other);
        if (arrStacked && othStacked) {
          return arrStacked == other && othStacked == array2;
        }
        var index2 = -1, result2 = true, seen = bitmask & COMPARE_UNORDERED_FLAG2 ? new SetCache2() : undefined$1;
        stack.set(array2, other);
        stack.set(other, array2);
        while (++index2 < arrLength) {
          var arrValue = array2[index2], othValue = other[index2];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, arrValue, index2, other, array2, stack) : customizer(arrValue, othValue, index2, array2, other, stack);
          }
          if (compared !== undefined$1) {
            if (compared) {
              continue;
            }
            result2 = false;
            break;
          }
          if (seen) {
            if (!arraySome2(other, function(othValue2, othIndex) {
              if (!cacheHas2(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
              result2 = false;
              break;
            }
          } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
            result2 = false;
            break;
          }
        }
        stack["delete"](array2);
        stack["delete"](other);
        return result2;
      }
      function equalByTag2(object2, other, tag, bitmask, customizer, equalFunc, stack) {
        switch (tag) {
          case dataViewTag2:
            if (object2.byteLength != other.byteLength || object2.byteOffset != other.byteOffset) {
              return false;
            }
            object2 = object2.buffer;
            other = other.buffer;
          case arrayBufferTag2:
            if (object2.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object2), new Uint8Array2(other))) {
              return false;
            }
            return true;
          case boolTag2:
          case dateTag2:
          case numberTag2:
            return eq2(+object2, +other);
          case errorTag2:
            return object2.name == other.name && object2.message == other.message;
          case regexpTag2:
          case stringTag2:
            return object2 == other + "";
          case mapTag2:
            var convert = mapToArray2;
          case setTag2:
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG2;
            convert || (convert = setToArray2);
            if (object2.size != other.size && !isPartial) {
              return false;
            }
            var stacked = stack.get(object2);
            if (stacked) {
              return stacked == other;
            }
            bitmask |= COMPARE_UNORDERED_FLAG2;
            stack.set(object2, other);
            var result2 = equalArrays2(convert(object2), convert(other), bitmask, customizer, equalFunc, stack);
            stack["delete"](object2);
            return result2;
          case symbolTag2:
            if (symbolValueOf2) {
              return symbolValueOf2.call(object2) == symbolValueOf2.call(other);
            }
        }
        return false;
      }
      function equalObjects2(object2, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG2, objProps = getAllKeys2(object2), objLength = objProps.length, othProps = getAllKeys2(other), othLength = othProps.length;
        if (objLength != othLength && !isPartial) {
          return false;
        }
        var index2 = objLength;
        while (index2--) {
          var key = objProps[index2];
          if (!(isPartial ? key in other : hasOwnProperty2.call(other, key))) {
            return false;
          }
        }
        var objStacked = stack.get(object2);
        var othStacked = stack.get(other);
        if (objStacked && othStacked) {
          return objStacked == other && othStacked == object2;
        }
        var result2 = true;
        stack.set(object2, other);
        stack.set(other, object2);
        var skipCtor = isPartial;
        while (++index2 < objLength) {
          key = objProps[index2];
          var objValue = object2[key], othValue = other[key];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, objValue, key, other, object2, stack) : customizer(objValue, othValue, key, object2, other, stack);
          }
          if (!(compared === undefined$1 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
            result2 = false;
            break;
          }
          skipCtor || (skipCtor = key == "constructor");
        }
        if (result2 && !skipCtor) {
          var objCtor = object2.constructor, othCtor = other.constructor;
          if (objCtor != othCtor && ("constructor" in object2 && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
            result2 = false;
          }
        }
        stack["delete"](object2);
        stack["delete"](other);
        return result2;
      }
      function flatRest(func) {
        return setToString(overRest(func, undefined$1, flatten), func + "");
      }
      function getAllKeys2(object2) {
        return baseGetAllKeys2(object2, keys2, getSymbols2);
      }
      function getAllKeysIn(object2) {
        return baseGetAllKeys2(object2, keysIn, getSymbolsIn);
      }
      var getData = !metaMap ? noop : function(func) {
        return metaMap.get(func);
      };
      function getFuncName(func) {
        var result2 = func.name + "", array2 = realNames[result2], length = hasOwnProperty2.call(realNames, result2) ? array2.length : 0;
        while (length--) {
          var data = array2[length], otherFunc = data.func;
          if (otherFunc == null || otherFunc == func) {
            return data.name;
          }
        }
        return result2;
      }
      function getHolder(func) {
        var object2 = hasOwnProperty2.call(lodash2, "placeholder") ? lodash2 : func;
        return object2.placeholder;
      }
      function getIteratee() {
        var result2 = lodash2.iteratee || iteratee;
        result2 = result2 === iteratee ? baseIteratee2 : result2;
        return arguments.length ? result2(arguments[0], arguments[1]) : result2;
      }
      function getMapData2(map3, key) {
        var data = map3.__data__;
        return isKeyable2(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
      }
      function getMatchData2(object2) {
        var result2 = keys2(object2), length = result2.length;
        while (length--) {
          var key = result2[length], value = object2[key];
          result2[length] = [key, value, isStrictComparable2(value)];
        }
        return result2;
      }
      function getNative2(object2, key) {
        var value = getValue2(object2, key);
        return baseIsNative2(value) ? value : undefined$1;
      }
      function getRawTag2(value) {
        var isOwn = hasOwnProperty2.call(value, symToStringTag2), tag = value[symToStringTag2];
        try {
          value[symToStringTag2] = undefined$1;
          var unmasked = true;
        } catch (e) {
        }
        var result2 = nativeObjectToString2.call(value);
        if (unmasked) {
          if (isOwn) {
            value[symToStringTag2] = tag;
          } else {
            delete value[symToStringTag2];
          }
        }
        return result2;
      }
      var getSymbols2 = !nativeGetSymbols2 ? stubArray2 : function(object2) {
        if (object2 == null) {
          return [];
        }
        object2 = Object2(object2);
        return arrayFilter2(nativeGetSymbols2(object2), function(symbol) {
          return propertyIsEnumerable2.call(object2, symbol);
        });
      };
      var getSymbolsIn = !nativeGetSymbols2 ? stubArray2 : function(object2) {
        var result2 = [];
        while (object2) {
          arrayPush2(result2, getSymbols2(object2));
          object2 = getPrototype(object2);
        }
        return result2;
      };
      var getTag2 = baseGetTag2;
      if (DataView2 && getTag2(new DataView2(new ArrayBuffer(1))) != dataViewTag2 || Map2 && getTag2(new Map2()) != mapTag2 || Promise2 && getTag2(Promise2.resolve()) != promiseTag2 || Set2 && getTag2(new Set2()) != setTag2 || WeakMap2 && getTag2(new WeakMap2()) != weakMapTag2) {
        getTag2 = function(value) {
          var result2 = baseGetTag2(value), Ctor = result2 == objectTag2 ? value.constructor : undefined$1, ctorString = Ctor ? toSource2(Ctor) : "";
          if (ctorString) {
            switch (ctorString) {
              case dataViewCtorString2:
                return dataViewTag2;
              case mapCtorString2:
                return mapTag2;
              case promiseCtorString2:
                return promiseTag2;
              case setCtorString2:
                return setTag2;
              case weakMapCtorString2:
                return weakMapTag2;
            }
          }
          return result2;
        };
      }
      function getView(start, end, transforms) {
        var index2 = -1, length = transforms.length;
        while (++index2 < length) {
          var data = transforms[index2], size2 = data.size;
          switch (data.type) {
            case "drop":
              start += size2;
              break;
            case "dropRight":
              end -= size2;
              break;
            case "take":
              end = nativeMin(end, start + size2);
              break;
            case "takeRight":
              start = nativeMax(start, end - size2);
              break;
          }
        }
        return { "start": start, "end": end };
      }
      function getWrapDetails(source2) {
        var match = source2.match(reWrapDetails);
        return match ? match[1].split(reSplitDetails) : [];
      }
      function hasPath2(object2, path2, hasFunc) {
        path2 = castPath2(path2, object2);
        var index2 = -1, length = path2.length, result2 = false;
        while (++index2 < length) {
          var key = toKey2(path2[index2]);
          if (!(result2 = object2 != null && hasFunc(object2, key))) {
            break;
          }
          object2 = object2[key];
        }
        if (result2 || ++index2 != length) {
          return result2;
        }
        length = object2 == null ? 0 : object2.length;
        return !!length && isLength2(length) && isIndex2(key, length) && (isArray2(object2) || isArguments2(object2));
      }
      function initCloneArray(array2) {
        var length = array2.length, result2 = new array2.constructor(length);
        if (length && typeof array2[0] == "string" && hasOwnProperty2.call(array2, "index")) {
          result2.index = array2.index;
          result2.input = array2.input;
        }
        return result2;
      }
      function initCloneObject(object2) {
        return typeof object2.constructor == "function" && !isPrototype2(object2) ? baseCreate(getPrototype(object2)) : {};
      }
      function initCloneByTag(object2, tag, isDeep) {
        var Ctor = object2.constructor;
        switch (tag) {
          case arrayBufferTag2:
            return cloneArrayBuffer(object2);
          case boolTag2:
          case dateTag2:
            return new Ctor(+object2);
          case dataViewTag2:
            return cloneDataView(object2, isDeep);
          case float32Tag2:
          case float64Tag2:
          case int8Tag2:
          case int16Tag2:
          case int32Tag2:
          case uint8Tag2:
          case uint8ClampedTag2:
          case uint16Tag2:
          case uint32Tag2:
            return cloneTypedArray(object2, isDeep);
          case mapTag2:
            return new Ctor();
          case numberTag2:
          case stringTag2:
            return new Ctor(object2);
          case regexpTag2:
            return cloneRegExp(object2);
          case setTag2:
            return new Ctor();
          case symbolTag2:
            return cloneSymbol(object2);
        }
      }
      function insertWrapDetails(source2, details) {
        var length = details.length;
        if (!length) {
          return source2;
        }
        var lastIndex = length - 1;
        details[lastIndex] = (length > 1 ? "& " : "") + details[lastIndex];
        details = details.join(length > 2 ? ", " : " ");
        return source2.replace(reWrapComment, "{\n/* [wrapped with " + details + "] */\n");
      }
      function isFlattenable(value) {
        return isArray2(value) || isArguments2(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
      }
      function isIndex2(value, length) {
        var type = typeof value;
        length = length == null ? MAX_SAFE_INTEGER2 : length;
        return !!length && (type == "number" || type != "symbol" && reIsUint2.test(value)) && (value > -1 && value % 1 == 0 && value < length);
      }
      function isIterateeCall(value, index2, object2) {
        if (!isObject2(object2)) {
          return false;
        }
        var type = typeof index2;
        if (type == "number" ? isArrayLike2(object2) && isIndex2(index2, object2.length) : type == "string" && index2 in object2) {
          return eq2(object2[index2], value);
        }
        return false;
      }
      function isKey2(value, object2) {
        if (isArray2(value)) {
          return false;
        }
        var type = typeof value;
        if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol2(value)) {
          return true;
        }
        return reIsPlainProp2.test(value) || !reIsDeepProp2.test(value) || object2 != null && value in Object2(object2);
      }
      function isKeyable2(value) {
        var type = typeof value;
        return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
      }
      function isLaziable(func) {
        var funcName = getFuncName(func), other = lodash2[funcName];
        if (typeof other != "function" || !(funcName in LazyWrapper.prototype)) {
          return false;
        }
        if (func === other) {
          return true;
        }
        var data = getData(other);
        return !!data && func === data[0];
      }
      function isMasked2(func) {
        return !!maskSrcKey2 && maskSrcKey2 in func;
      }
      var isMaskable = coreJsData2 ? isFunction3 : stubFalse2;
      function isPrototype2(value) {
        var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto2;
        return value === proto;
      }
      function isStrictComparable2(value) {
        return value === value && !isObject2(value);
      }
      function matchesStrictComparable2(key, srcValue) {
        return function(object2) {
          if (object2 == null) {
            return false;
          }
          return object2[key] === srcValue && (srcValue !== undefined$1 || key in Object2(object2));
        };
      }
      function memoizeCapped2(func) {
        var result2 = memoize2(func, function(key) {
          if (cache.size === MAX_MEMOIZE_SIZE2) {
            cache.clear();
          }
          return key;
        });
        var cache = result2.cache;
        return result2;
      }
      function mergeData(data, source2) {
        var bitmask = data[1], srcBitmask = source2[1], newBitmask = bitmask | srcBitmask, isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);
        var isCombo = srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_CURRY_FLAG || srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_REARG_FLAG && data[7].length <= source2[8] || srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG) && source2[7].length <= source2[8] && bitmask == WRAP_CURRY_FLAG;
        if (!(isCommon || isCombo)) {
          return data;
        }
        if (srcBitmask & WRAP_BIND_FLAG) {
          data[2] = source2[2];
          newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
        }
        var value = source2[3];
        if (value) {
          var partials = data[3];
          data[3] = partials ? composeArgs(partials, value, source2[4]) : value;
          data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source2[4];
        }
        value = source2[5];
        if (value) {
          partials = data[5];
          data[5] = partials ? composeArgsRight(partials, value, source2[6]) : value;
          data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source2[6];
        }
        value = source2[7];
        if (value) {
          data[7] = value;
        }
        if (srcBitmask & WRAP_ARY_FLAG) {
          data[8] = data[8] == null ? source2[8] : nativeMin(data[8], source2[8]);
        }
        if (data[9] == null) {
          data[9] = source2[9];
        }
        data[0] = source2[0];
        data[1] = newBitmask;
        return data;
      }
      function nativeKeysIn(object2) {
        var result2 = [];
        if (object2 != null) {
          for (var key in Object2(object2)) {
            result2.push(key);
          }
        }
        return result2;
      }
      function objectToString2(value) {
        return nativeObjectToString2.call(value);
      }
      function overRest(func, start, transform3) {
        start = nativeMax(start === undefined$1 ? func.length - 1 : start, 0);
        return function() {
          var args = arguments, index2 = -1, length = nativeMax(args.length - start, 0), array2 = Array2(length);
          while (++index2 < length) {
            array2[index2] = args[start + index2];
          }
          index2 = -1;
          var otherArgs = Array2(start + 1);
          while (++index2 < start) {
            otherArgs[index2] = args[index2];
          }
          otherArgs[start] = transform3(array2);
          return apply(func, this, otherArgs);
        };
      }
      function parent(object2, path2) {
        return path2.length < 2 ? object2 : baseGet2(object2, baseSlice2(path2, 0, -1));
      }
      function reorder(array2, indexes) {
        var arrLength = array2.length, length = nativeMin(indexes.length, arrLength), oldArray = copyArray(array2);
        while (length--) {
          var index2 = indexes[length];
          array2[length] = isIndex2(index2, arrLength) ? oldArray[index2] : undefined$1;
        }
        return array2;
      }
      function safeGet(object2, key) {
        if (key === "constructor" && typeof object2[key] === "function") {
          return;
        }
        if (key == "__proto__") {
          return;
        }
        return object2[key];
      }
      var setData = shortOut(baseSetData);
      var setTimeout2 = ctxSetTimeout || function(func, wait) {
        return root2.setTimeout(func, wait);
      };
      var setToString = shortOut(baseSetToString);
      function setWrapToString(wrapper, reference, bitmask) {
        var source2 = reference + "";
        return setToString(wrapper, insertWrapDetails(source2, updateWrapDetails(getWrapDetails(source2), bitmask)));
      }
      function shortOut(func) {
        var count = 0, lastCalled = 0;
        return function() {
          var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
          lastCalled = stamp;
          if (remaining > 0) {
            if (++count >= HOT_COUNT) {
              return arguments[0];
            }
          } else {
            count = 0;
          }
          return func.apply(undefined$1, arguments);
        };
      }
      function shuffleSelf(array2, size2) {
        var index2 = -1, length = array2.length, lastIndex = length - 1;
        size2 = size2 === undefined$1 ? length : size2;
        while (++index2 < size2) {
          var rand = baseRandom(index2, lastIndex), value = array2[rand];
          array2[rand] = array2[index2];
          array2[index2] = value;
        }
        array2.length = size2;
        return array2;
      }
      var stringToPath2 = memoizeCapped2(function(string2) {
        var result2 = [];
        if (string2.charCodeAt(0) === 46) {
          result2.push("");
        }
        string2.replace(rePropName2, function(match, number2, quote, subString) {
          result2.push(quote ? subString.replace(reEscapeChar2, "$1") : number2 || match);
        });
        return result2;
      });
      function toKey2(value) {
        if (typeof value == "string" || isSymbol2(value)) {
          return value;
        }
        var result2 = value + "";
        return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
      }
      function toSource2(func) {
        if (func != null) {
          try {
            return funcToString2.call(func);
          } catch (e) {
          }
          try {
            return func + "";
          } catch (e) {
          }
        }
        return "";
      }
      function updateWrapDetails(details, bitmask) {
        arrayEach(wrapFlags, function(pair) {
          var value = "_." + pair[0];
          if (bitmask & pair[1] && !arrayIncludes(details, value)) {
            details.push(value);
          }
        });
        return details.sort();
      }
      function wrapperClone(wrapper) {
        if (wrapper instanceof LazyWrapper) {
          return wrapper.clone();
        }
        var result2 = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
        result2.__actions__ = copyArray(wrapper.__actions__);
        result2.__index__ = wrapper.__index__;
        result2.__values__ = wrapper.__values__;
        return result2;
      }
      function chunk(array2, size2, guard) {
        if (guard ? isIterateeCall(array2, size2, guard) : size2 === undefined$1) {
          size2 = 1;
        } else {
          size2 = nativeMax(toInteger(size2), 0);
        }
        var length = array2 == null ? 0 : array2.length;
        if (!length || size2 < 1) {
          return [];
        }
        var index2 = 0, resIndex = 0, result2 = Array2(nativeCeil(length / size2));
        while (index2 < length) {
          result2[resIndex++] = baseSlice2(array2, index2, index2 += size2);
        }
        return result2;
      }
      function compact(array2) {
        var index2 = -1, length = array2 == null ? 0 : array2.length, resIndex = 0, result2 = [];
        while (++index2 < length) {
          var value = array2[index2];
          if (value) {
            result2[resIndex++] = value;
          }
        }
        return result2;
      }
      function concat() {
        var length = arguments.length;
        if (!length) {
          return [];
        }
        var args = Array2(length - 1), array2 = arguments[0], index2 = length;
        while (index2--) {
          args[index2 - 1] = arguments[index2];
        }
        return arrayPush2(isArray2(array2) ? copyArray(array2) : [array2], baseFlatten(args, 1));
      }
      var difference = baseRest(function(array2, values2) {
        return isArrayLikeObject(array2) ? baseDifference(array2, baseFlatten(values2, 1, isArrayLikeObject, true)) : [];
      });
      var differenceBy = baseRest(function(array2, values2) {
        var iteratee2 = last(values2);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined$1;
        }
        return isArrayLikeObject(array2) ? baseDifference(array2, baseFlatten(values2, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2)) : [];
      });
      var differenceWith = baseRest(function(array2, values2) {
        var comparator = last(values2);
        if (isArrayLikeObject(comparator)) {
          comparator = undefined$1;
        }
        return isArrayLikeObject(array2) ? baseDifference(array2, baseFlatten(values2, 1, isArrayLikeObject, true), undefined$1, comparator) : [];
      });
      function drop(array2, n, guard) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return [];
        }
        n = guard || n === undefined$1 ? 1 : toInteger(n);
        return baseSlice2(array2, n < 0 ? 0 : n, length);
      }
      function dropRight(array2, n, guard) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return [];
        }
        n = guard || n === undefined$1 ? 1 : toInteger(n);
        n = length - n;
        return baseSlice2(array2, 0, n < 0 ? 0 : n);
      }
      function dropRightWhile(array2, predicate) {
        return array2 && array2.length ? baseWhile(array2, getIteratee(predicate, 3), true, true) : [];
      }
      function dropWhile(array2, predicate) {
        return array2 && array2.length ? baseWhile(array2, getIteratee(predicate, 3), true) : [];
      }
      function fill(array2, value, start, end) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return [];
        }
        if (start && typeof start != "number" && isIterateeCall(array2, value, start)) {
          start = 0;
          end = length;
        }
        return baseFill(array2, value, start, end);
      }
      function findIndex2(array2, predicate, fromIndex) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return -1;
        }
        var index2 = fromIndex == null ? 0 : toInteger(fromIndex);
        if (index2 < 0) {
          index2 = nativeMax(length + index2, 0);
        }
        return baseFindIndex(array2, getIteratee(predicate, 3), index2);
      }
      function findLastIndex(array2, predicate, fromIndex) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return -1;
        }
        var index2 = length - 1;
        if (fromIndex !== undefined$1) {
          index2 = toInteger(fromIndex);
          index2 = fromIndex < 0 ? nativeMax(length + index2, 0) : nativeMin(index2, length - 1);
        }
        return baseFindIndex(array2, getIteratee(predicate, 3), index2, true);
      }
      function flatten(array2) {
        var length = array2 == null ? 0 : array2.length;
        return length ? baseFlatten(array2, 1) : [];
      }
      function flattenDeep(array2) {
        var length = array2 == null ? 0 : array2.length;
        return length ? baseFlatten(array2, INFINITY) : [];
      }
      function flattenDepth(array2, depth) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return [];
        }
        depth = depth === undefined$1 ? 1 : toInteger(depth);
        return baseFlatten(array2, depth);
      }
      function fromPairs(pairs) {
        var index2 = -1, length = pairs == null ? 0 : pairs.length, result2 = {};
        while (++index2 < length) {
          var pair = pairs[index2];
          baseAssignValue2(result2, pair[0], pair[1]);
        }
        return result2;
      }
      function head(array2) {
        return array2 && array2.length ? array2[0] : undefined$1;
      }
      function indexOf(array2, value, fromIndex) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return -1;
        }
        var index2 = fromIndex == null ? 0 : toInteger(fromIndex);
        if (index2 < 0) {
          index2 = nativeMax(length + index2, 0);
        }
        return baseIndexOf(array2, value, index2);
      }
      function initial(array2) {
        var length = array2 == null ? 0 : array2.length;
        return length ? baseSlice2(array2, 0, -1) : [];
      }
      var intersection2 = baseRest(function(arrays) {
        var mapped = arrayMap2(arrays, castArrayLikeObject);
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped) : [];
      });
      var intersectionBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays), mapped = arrayMap2(arrays, castArrayLikeObject);
        if (iteratee2 === last(mapped)) {
          iteratee2 = undefined$1;
        } else {
          mapped.pop();
        }
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, getIteratee(iteratee2, 2)) : [];
      });
      var intersectionWith = baseRest(function(arrays) {
        var comparator = last(arrays), mapped = arrayMap2(arrays, castArrayLikeObject);
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        if (comparator) {
          mapped.pop();
        }
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, undefined$1, comparator) : [];
      });
      function join(array2, separator) {
        return array2 == null ? "" : nativeJoin.call(array2, separator);
      }
      function last(array2) {
        var length = array2 == null ? 0 : array2.length;
        return length ? array2[length - 1] : undefined$1;
      }
      function lastIndexOf(array2, value, fromIndex) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return -1;
        }
        var index2 = length;
        if (fromIndex !== undefined$1) {
          index2 = toInteger(fromIndex);
          index2 = index2 < 0 ? nativeMax(length + index2, 0) : nativeMin(index2, length - 1);
        }
        return value === value ? strictLastIndexOf(array2, value, index2) : baseFindIndex(array2, baseIsNaN, index2, true);
      }
      function nth(array2, n) {
        return array2 && array2.length ? baseNth(array2, toInteger(n)) : undefined$1;
      }
      var pull = baseRest(pullAll);
      function pullAll(array2, values2) {
        return array2 && array2.length && values2 && values2.length ? basePullAll(array2, values2) : array2;
      }
      function pullAllBy(array2, values2, iteratee2) {
        return array2 && array2.length && values2 && values2.length ? basePullAll(array2, values2, getIteratee(iteratee2, 2)) : array2;
      }
      function pullAllWith(array2, values2, comparator) {
        return array2 && array2.length && values2 && values2.length ? basePullAll(array2, values2, undefined$1, comparator) : array2;
      }
      var pullAt = flatRest(function(array2, indexes) {
        var length = array2 == null ? 0 : array2.length, result2 = baseAt(array2, indexes);
        basePullAt(array2, arrayMap2(indexes, function(index2) {
          return isIndex2(index2, length) ? +index2 : index2;
        }).sort(compareAscending));
        return result2;
      });
      function remove(array2, predicate) {
        var result2 = [];
        if (!(array2 && array2.length)) {
          return result2;
        }
        var index2 = -1, indexes = [], length = array2.length;
        predicate = getIteratee(predicate, 3);
        while (++index2 < length) {
          var value = array2[index2];
          if (predicate(value, index2, array2)) {
            result2.push(value);
            indexes.push(index2);
          }
        }
        basePullAt(array2, indexes);
        return result2;
      }
      function reverse(array2) {
        return array2 == null ? array2 : nativeReverse.call(array2);
      }
      function slice(array2, start, end) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return [];
        }
        if (end && typeof end != "number" && isIterateeCall(array2, start, end)) {
          start = 0;
          end = length;
        } else {
          start = start == null ? 0 : toInteger(start);
          end = end === undefined$1 ? length : toInteger(end);
        }
        return baseSlice2(array2, start, end);
      }
      function sortedIndex(array2, value) {
        return baseSortedIndex(array2, value);
      }
      function sortedIndexBy(array2, value, iteratee2) {
        return baseSortedIndexBy(array2, value, getIteratee(iteratee2, 2));
      }
      function sortedIndexOf(array2, value) {
        var length = array2 == null ? 0 : array2.length;
        if (length) {
          var index2 = baseSortedIndex(array2, value);
          if (index2 < length && eq2(array2[index2], value)) {
            return index2;
          }
        }
        return -1;
      }
      function sortedLastIndex(array2, value) {
        return baseSortedIndex(array2, value, true);
      }
      function sortedLastIndexBy(array2, value, iteratee2) {
        return baseSortedIndexBy(array2, value, getIteratee(iteratee2, 2), true);
      }
      function sortedLastIndexOf(array2, value) {
        var length = array2 == null ? 0 : array2.length;
        if (length) {
          var index2 = baseSortedIndex(array2, value, true) - 1;
          if (eq2(array2[index2], value)) {
            return index2;
          }
        }
        return -1;
      }
      function sortedUniq(array2) {
        return array2 && array2.length ? baseSortedUniq(array2) : [];
      }
      function sortedUniqBy(array2, iteratee2) {
        return array2 && array2.length ? baseSortedUniq(array2, getIteratee(iteratee2, 2)) : [];
      }
      function tail(array2) {
        var length = array2 == null ? 0 : array2.length;
        return length ? baseSlice2(array2, 1, length) : [];
      }
      function take(array2, n, guard) {
        if (!(array2 && array2.length)) {
          return [];
        }
        n = guard || n === undefined$1 ? 1 : toInteger(n);
        return baseSlice2(array2, 0, n < 0 ? 0 : n);
      }
      function takeRight(array2, n, guard) {
        var length = array2 == null ? 0 : array2.length;
        if (!length) {
          return [];
        }
        n = guard || n === undefined$1 ? 1 : toInteger(n);
        n = length - n;
        return baseSlice2(array2, n < 0 ? 0 : n, length);
      }
      function takeRightWhile(array2, predicate) {
        return array2 && array2.length ? baseWhile(array2, getIteratee(predicate, 3), false, true) : [];
      }
      function takeWhile(array2, predicate) {
        return array2 && array2.length ? baseWhile(array2, getIteratee(predicate, 3)) : [];
      }
      var union2 = baseRest(function(arrays) {
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
      });
      var unionBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined$1;
        }
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2));
      });
      var unionWith = baseRest(function(arrays) {
        var comparator = last(arrays);
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), undefined$1, comparator);
      });
      function uniq(array2) {
        return array2 && array2.length ? baseUniq(array2) : [];
      }
      function uniqBy(array2, iteratee2) {
        return array2 && array2.length ? baseUniq(array2, getIteratee(iteratee2, 2)) : [];
      }
      function uniqWith(array2, comparator) {
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        return array2 && array2.length ? baseUniq(array2, undefined$1, comparator) : [];
      }
      function unzip(array2) {
        if (!(array2 && array2.length)) {
          return [];
        }
        var length = 0;
        array2 = arrayFilter2(array2, function(group) {
          if (isArrayLikeObject(group)) {
            length = nativeMax(group.length, length);
            return true;
          }
        });
        return baseTimes2(length, function(index2) {
          return arrayMap2(array2, baseProperty2(index2));
        });
      }
      function unzipWith(array2, iteratee2) {
        if (!(array2 && array2.length)) {
          return [];
        }
        var result2 = unzip(array2);
        if (iteratee2 == null) {
          return result2;
        }
        return arrayMap2(result2, function(group) {
          return apply(iteratee2, undefined$1, group);
        });
      }
      var without = baseRest(function(array2, values2) {
        return isArrayLikeObject(array2) ? baseDifference(array2, values2) : [];
      });
      var xor = baseRest(function(arrays) {
        return baseXor(arrayFilter2(arrays, isArrayLikeObject));
      });
      var xorBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined$1;
        }
        return baseXor(arrayFilter2(arrays, isArrayLikeObject), getIteratee(iteratee2, 2));
      });
      var xorWith = baseRest(function(arrays) {
        var comparator = last(arrays);
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        return baseXor(arrayFilter2(arrays, isArrayLikeObject), undefined$1, comparator);
      });
      var zip = baseRest(unzip);
      function zipObject(props, values2) {
        return baseZipObject(props || [], values2 || [], assignValue);
      }
      function zipObjectDeep(props, values2) {
        return baseZipObject(props || [], values2 || [], baseSet);
      }
      var zipWith = baseRest(function(arrays) {
        var length = arrays.length, iteratee2 = length > 1 ? arrays[length - 1] : undefined$1;
        iteratee2 = typeof iteratee2 == "function" ? (arrays.pop(), iteratee2) : undefined$1;
        return unzipWith(arrays, iteratee2);
      });
      function chain(value) {
        var result2 = lodash2(value);
        result2.__chain__ = true;
        return result2;
      }
      function tap(value, interceptor) {
        interceptor(value);
        return value;
      }
      function thru(value, interceptor) {
        return interceptor(value);
      }
      var wrapperAt = flatRest(function(paths) {
        var length = paths.length, start = length ? paths[0] : 0, value = this.__wrapped__, interceptor = function(object2) {
          return baseAt(object2, paths);
        };
        if (length > 1 || this.__actions__.length || !(value instanceof LazyWrapper) || !isIndex2(start)) {
          return this.thru(interceptor);
        }
        value = value.slice(start, +start + (length ? 1 : 0));
        value.__actions__.push({
          "func": thru,
          "args": [interceptor],
          "thisArg": undefined$1
        });
        return new LodashWrapper(value, this.__chain__).thru(function(array2) {
          if (length && !array2.length) {
            array2.push(undefined$1);
          }
          return array2;
        });
      });
      function wrapperChain() {
        return chain(this);
      }
      function wrapperCommit() {
        return new LodashWrapper(this.value(), this.__chain__);
      }
      function wrapperNext() {
        if (this.__values__ === undefined$1) {
          this.__values__ = toArray2(this.value());
        }
        var done = this.__index__ >= this.__values__.length, value = done ? undefined$1 : this.__values__[this.__index__++];
        return { "done": done, "value": value };
      }
      function wrapperToIterator() {
        return this;
      }
      function wrapperPlant(value) {
        var result2, parent2 = this;
        while (parent2 instanceof baseLodash) {
          var clone3 = wrapperClone(parent2);
          clone3.__index__ = 0;
          clone3.__values__ = undefined$1;
          if (result2) {
            previous.__wrapped__ = clone3;
          } else {
            result2 = clone3;
          }
          var previous = clone3;
          parent2 = parent2.__wrapped__;
        }
        previous.__wrapped__ = value;
        return result2;
      }
      function wrapperReverse() {
        var value = this.__wrapped__;
        if (value instanceof LazyWrapper) {
          var wrapped = value;
          if (this.__actions__.length) {
            wrapped = new LazyWrapper(this);
          }
          wrapped = wrapped.reverse();
          wrapped.__actions__.push({
            "func": thru,
            "args": [reverse],
            "thisArg": undefined$1
          });
          return new LodashWrapper(wrapped, this.__chain__);
        }
        return this.thru(reverse);
      }
      function wrapperValue() {
        return baseWrapperValue(this.__wrapped__, this.__actions__);
      }
      var countBy = createAggregator(function(result2, value, key) {
        if (hasOwnProperty2.call(result2, key)) {
          ++result2[key];
        } else {
          baseAssignValue2(result2, key, 1);
        }
      });
      function every(collection, predicate, guard) {
        var func = isArray2(collection) ? arrayEvery : baseEvery;
        if (guard && isIterateeCall(collection, predicate, guard)) {
          predicate = undefined$1;
        }
        return func(collection, getIteratee(predicate, 3));
      }
      function filter(collection, predicate) {
        var func = isArray2(collection) ? arrayFilter2 : baseFilter;
        return func(collection, getIteratee(predicate, 3));
      }
      var find = createFind(findIndex2);
      var findLast = createFind(findLastIndex);
      function flatMap(collection, iteratee2) {
        return baseFlatten(map2(collection, iteratee2), 1);
      }
      function flatMapDeep(collection, iteratee2) {
        return baseFlatten(map2(collection, iteratee2), INFINITY);
      }
      function flatMapDepth(collection, iteratee2, depth) {
        depth = depth === undefined$1 ? 1 : toInteger(depth);
        return baseFlatten(map2(collection, iteratee2), depth);
      }
      function forEach2(collection, iteratee2) {
        var func = isArray2(collection) ? arrayEach : baseEach;
        return func(collection, getIteratee(iteratee2, 3));
      }
      function forEachRight(collection, iteratee2) {
        var func = isArray2(collection) ? arrayEachRight : baseEachRight;
        return func(collection, getIteratee(iteratee2, 3));
      }
      var groupBy = createAggregator(function(result2, value, key) {
        if (hasOwnProperty2.call(result2, key)) {
          result2[key].push(value);
        } else {
          baseAssignValue2(result2, key, [value]);
        }
      });
      function includes(collection, value, fromIndex, guard) {
        collection = isArrayLike2(collection) ? collection : values(collection);
        fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
        var length = collection.length;
        if (fromIndex < 0) {
          fromIndex = nativeMax(length + fromIndex, 0);
        }
        return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
      }
      var invokeMap = baseRest(function(collection, path2, args) {
        var index2 = -1, isFunc = typeof path2 == "function", result2 = isArrayLike2(collection) ? Array2(collection.length) : [];
        baseEach(collection, function(value) {
          result2[++index2] = isFunc ? apply(path2, value, args) : baseInvoke(value, path2, args);
        });
        return result2;
      });
      var keyBy = createAggregator(function(result2, value, key) {
        baseAssignValue2(result2, key, value);
      });
      function map2(collection, iteratee2) {
        var func = isArray2(collection) ? arrayMap2 : baseMap;
        return func(collection, getIteratee(iteratee2, 3));
      }
      function orderBy(collection, iteratees, orders, guard) {
        if (collection == null) {
          return [];
        }
        if (!isArray2(iteratees)) {
          iteratees = iteratees == null ? [] : [iteratees];
        }
        orders = guard ? undefined$1 : orders;
        if (!isArray2(orders)) {
          orders = orders == null ? [] : [orders];
        }
        return baseOrderBy(collection, iteratees, orders);
      }
      var partition = createAggregator(function(result2, value, key) {
        result2[key ? 0 : 1].push(value);
      }, function() {
        return [[], []];
      });
      function reduce(collection, iteratee2, accumulator) {
        var func = isArray2(collection) ? arrayReduce2 : baseReduce, initAccum = arguments.length < 3;
        return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEach);
      }
      function reduceRight(collection, iteratee2, accumulator) {
        var func = isArray2(collection) ? arrayReduceRight : baseReduce, initAccum = arguments.length < 3;
        return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEachRight);
      }
      function reject(collection, predicate) {
        var func = isArray2(collection) ? arrayFilter2 : baseFilter;
        return func(collection, negate(getIteratee(predicate, 3)));
      }
      function sample(collection) {
        var func = isArray2(collection) ? arraySample : baseSample;
        return func(collection);
      }
      function sampleSize(collection, n, guard) {
        if (guard ? isIterateeCall(collection, n, guard) : n === undefined$1) {
          n = 1;
        } else {
          n = toInteger(n);
        }
        var func = isArray2(collection) ? arraySampleSize : baseSampleSize;
        return func(collection, n);
      }
      function shuffle(collection) {
        var func = isArray2(collection) ? arrayShuffle : baseShuffle;
        return func(collection);
      }
      function size(collection) {
        if (collection == null) {
          return 0;
        }
        if (isArrayLike2(collection)) {
          return isString(collection) ? stringSize(collection) : collection.length;
        }
        var tag = getTag2(collection);
        if (tag == mapTag2 || tag == setTag2) {
          return collection.size;
        }
        return baseKeys2(collection).length;
      }
      function some(collection, predicate, guard) {
        var func = isArray2(collection) ? arraySome2 : baseSome;
        if (guard && isIterateeCall(collection, predicate, guard)) {
          predicate = undefined$1;
        }
        return func(collection, getIteratee(predicate, 3));
      }
      var sortBy = baseRest(function(collection, iteratees) {
        if (collection == null) {
          return [];
        }
        var length = iteratees.length;
        if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
          iteratees = [];
        } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
          iteratees = [iteratees[0]];
        }
        return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
      });
      var now = ctxNow || function() {
        return root2.Date.now();
      };
      function after(n, func) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        n = toInteger(n);
        return function() {
          if (--n < 1) {
            return func.apply(this, arguments);
          }
        };
      }
      function ary(func, n, guard) {
        n = guard ? undefined$1 : n;
        n = func && n == null ? func.length : n;
        return createWrap(func, WRAP_ARY_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, n);
      }
      function before(n, func) {
        var result2;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        n = toInteger(n);
        return function() {
          if (--n > 0) {
            result2 = func.apply(this, arguments);
          }
          if (n <= 1) {
            func = undefined$1;
          }
          return result2;
        };
      }
      var bind = baseRest(function(func, thisArg, partials) {
        var bitmask = WRAP_BIND_FLAG;
        if (partials.length) {
          var holders = replaceHolders(partials, getHolder(bind));
          bitmask |= WRAP_PARTIAL_FLAG;
        }
        return createWrap(func, bitmask, thisArg, partials, holders);
      });
      var bindKey = baseRest(function(object2, key, partials) {
        var bitmask = WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG;
        if (partials.length) {
          var holders = replaceHolders(partials, getHolder(bindKey));
          bitmask |= WRAP_PARTIAL_FLAG;
        }
        return createWrap(key, bitmask, object2, partials, holders);
      });
      function curry2(func, arity, guard) {
        arity = guard ? undefined$1 : arity;
        var result2 = createWrap(func, WRAP_CURRY_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, undefined$1, arity);
        result2.placeholder = curry2.placeholder;
        return result2;
      }
      function curryRight(func, arity, guard) {
        arity = guard ? undefined$1 : arity;
        var result2 = createWrap(func, WRAP_CURRY_RIGHT_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, undefined$1, arity);
        result2.placeholder = curryRight.placeholder;
        return result2;
      }
      function debounce(func, wait, options2) {
        var lastArgs, lastThis, maxWait, result2, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        wait = toNumber(wait) || 0;
        if (isObject2(options2)) {
          leading = !!options2.leading;
          maxing = "maxWait" in options2;
          maxWait = maxing ? nativeMax(toNumber(options2.maxWait) || 0, wait) : maxWait;
          trailing = "trailing" in options2 ? !!options2.trailing : trailing;
        }
        function invokeFunc(time2) {
          var args = lastArgs, thisArg = lastThis;
          lastArgs = lastThis = undefined$1;
          lastInvokeTime = time2;
          result2 = func.apply(thisArg, args);
          return result2;
        }
        function leadingEdge(time2) {
          lastInvokeTime = time2;
          timerId = setTimeout2(timerExpired, wait);
          return leading ? invokeFunc(time2) : result2;
        }
        function remainingWait(time2) {
          var timeSinceLastCall = time2 - lastCallTime, timeSinceLastInvoke = time2 - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
          return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
        }
        function shouldInvoke(time2) {
          var timeSinceLastCall = time2 - lastCallTime, timeSinceLastInvoke = time2 - lastInvokeTime;
          return lastCallTime === undefined$1 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
        }
        function timerExpired() {
          var time2 = now();
          if (shouldInvoke(time2)) {
            return trailingEdge(time2);
          }
          timerId = setTimeout2(timerExpired, remainingWait(time2));
        }
        function trailingEdge(time2) {
          timerId = undefined$1;
          if (trailing && lastArgs) {
            return invokeFunc(time2);
          }
          lastArgs = lastThis = undefined$1;
          return result2;
        }
        function cancel() {
          if (timerId !== undefined$1) {
            clearTimeout2(timerId);
          }
          lastInvokeTime = 0;
          lastArgs = lastCallTime = lastThis = timerId = undefined$1;
        }
        function flush() {
          return timerId === undefined$1 ? result2 : trailingEdge(now());
        }
        function debounced() {
          var time2 = now(), isInvoking = shouldInvoke(time2);
          lastArgs = arguments;
          lastThis = this;
          lastCallTime = time2;
          if (isInvoking) {
            if (timerId === undefined$1) {
              return leadingEdge(lastCallTime);
            }
            if (maxing) {
              clearTimeout2(timerId);
              timerId = setTimeout2(timerExpired, wait);
              return invokeFunc(lastCallTime);
            }
          }
          if (timerId === undefined$1) {
            timerId = setTimeout2(timerExpired, wait);
          }
          return result2;
        }
        debounced.cancel = cancel;
        debounced.flush = flush;
        return debounced;
      }
      var defer = baseRest(function(func, args) {
        return baseDelay(func, 1, args);
      });
      var delay = baseRest(function(func, wait, args) {
        return baseDelay(func, toNumber(wait) || 0, args);
      });
      function flip(func) {
        return createWrap(func, WRAP_FLIP_FLAG);
      }
      function memoize2(func, resolver) {
        if (typeof func != "function" || resolver != null && typeof resolver != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        var memoized = function() {
          var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
          if (cache.has(key)) {
            return cache.get(key);
          }
          var result2 = func.apply(this, args);
          memoized.cache = cache.set(key, result2) || cache;
          return result2;
        };
        memoized.cache = new (memoize2.Cache || MapCache2)();
        return memoized;
      }
      memoize2.Cache = MapCache2;
      function negate(predicate) {
        if (typeof predicate != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        return function() {
          var args = arguments;
          switch (args.length) {
            case 0:
              return !predicate.call(this);
            case 1:
              return !predicate.call(this, args[0]);
            case 2:
              return !predicate.call(this, args[0], args[1]);
            case 3:
              return !predicate.call(this, args[0], args[1], args[2]);
          }
          return !predicate.apply(this, args);
        };
      }
      function once2(func) {
        return before(2, func);
      }
      var overArgs = castRest(function(func, transforms) {
        transforms = transforms.length == 1 && isArray2(transforms[0]) ? arrayMap2(transforms[0], baseUnary2(getIteratee())) : arrayMap2(baseFlatten(transforms, 1), baseUnary2(getIteratee()));
        var funcsLength = transforms.length;
        return baseRest(function(args) {
          var index2 = -1, length = nativeMin(args.length, funcsLength);
          while (++index2 < length) {
            args[index2] = transforms[index2].call(this, args[index2]);
          }
          return apply(func, this, args);
        });
      });
      var partial2 = baseRest(function(func, partials) {
        var holders = replaceHolders(partials, getHolder(partial2));
        return createWrap(func, WRAP_PARTIAL_FLAG, undefined$1, partials, holders);
      });
      var partialRight = baseRest(function(func, partials) {
        var holders = replaceHolders(partials, getHolder(partialRight));
        return createWrap(func, WRAP_PARTIAL_RIGHT_FLAG, undefined$1, partials, holders);
      });
      var rearg = flatRest(function(func, indexes) {
        return createWrap(func, WRAP_REARG_FLAG, undefined$1, undefined$1, undefined$1, indexes);
      });
      function rest(func, start) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        start = start === undefined$1 ? start : toInteger(start);
        return baseRest(func, start);
      }
      function spread(func, start) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        start = start == null ? 0 : nativeMax(toInteger(start), 0);
        return baseRest(function(args) {
          var array2 = args[start], otherArgs = castSlice2(args, 0, start);
          if (array2) {
            arrayPush2(otherArgs, array2);
          }
          return apply(func, this, otherArgs);
        });
      }
      function throttle(func, wait, options2) {
        var leading = true, trailing = true;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT2);
        }
        if (isObject2(options2)) {
          leading = "leading" in options2 ? !!options2.leading : leading;
          trailing = "trailing" in options2 ? !!options2.trailing : trailing;
        }
        return debounce(func, wait, {
          "leading": leading,
          "maxWait": wait,
          "trailing": trailing
        });
      }
      function unary(func) {
        return ary(func, 1);
      }
      function wrap(value, wrapper) {
        return partial2(castFunction(wrapper), value);
      }
      function castArray() {
        if (!arguments.length) {
          return [];
        }
        var value = arguments[0];
        return isArray2(value) ? value : [value];
      }
      function clone2(value) {
        return baseClone2(value, CLONE_SYMBOLS_FLAG);
      }
      function cloneWith(value, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return baseClone2(value, CLONE_SYMBOLS_FLAG, customizer);
      }
      function cloneDeep(value) {
        return baseClone2(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
      }
      function cloneDeepWith(value, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return baseClone2(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG, customizer);
      }
      function conformsTo(object2, source2) {
        return source2 == null || baseConformsTo(object2, source2, keys2(source2));
      }
      function eq2(value, other) {
        return value === other || value !== value && other !== other;
      }
      var gt = createRelationalOperation(baseGt);
      var gte = createRelationalOperation(function(value, other) {
        return value >= other;
      });
      var isArguments2 = baseIsArguments2(/* @__PURE__ */ function() {
        return arguments;
      }()) ? baseIsArguments2 : function(value) {
        return isObjectLike2(value) && hasOwnProperty2.call(value, "callee") && !propertyIsEnumerable2.call(value, "callee");
      };
      var isArray2 = Array2.isArray;
      var isArrayBuffer = nodeIsArrayBuffer ? baseUnary2(nodeIsArrayBuffer) : baseIsArrayBuffer;
      function isArrayLike2(value) {
        return value != null && isLength2(value.length) && !isFunction3(value);
      }
      function isArrayLikeObject(value) {
        return isObjectLike2(value) && isArrayLike2(value);
      }
      function isBoolean(value) {
        return value === true || value === false || isObjectLike2(value) && baseGetTag2(value) == boolTag2;
      }
      var isBuffer2 = nativeIsBuffer || stubFalse2;
      var isDate2 = nodeIsDate ? baseUnary2(nodeIsDate) : baseIsDate;
      function isElement(value) {
        return isObjectLike2(value) && value.nodeType === 1 && !isPlainObject2(value);
      }
      function isEmpty(value) {
        if (value == null) {
          return true;
        }
        if (isArrayLike2(value) && (isArray2(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer2(value) || isTypedArray2(value) || isArguments2(value))) {
          return !value.length;
        }
        var tag = getTag2(value);
        if (tag == mapTag2 || tag == setTag2) {
          return !value.size;
        }
        if (isPrototype2(value)) {
          return !baseKeys2(value).length;
        }
        for (var key in value) {
          if (hasOwnProperty2.call(value, key)) {
            return false;
          }
        }
        return true;
      }
      function isEqual(value, other) {
        return baseIsEqual2(value, other);
      }
      function isEqualWith(value, other, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        var result2 = customizer ? customizer(value, other) : undefined$1;
        return result2 === undefined$1 ? baseIsEqual2(value, other, undefined$1, customizer) : !!result2;
      }
      function isError(value) {
        if (!isObjectLike2(value)) {
          return false;
        }
        var tag = baseGetTag2(value);
        return tag == errorTag2 || tag == domExcTag || typeof value.message == "string" && typeof value.name == "string" && !isPlainObject2(value);
      }
      function isFinite(value) {
        return typeof value == "number" && nativeIsFinite(value);
      }
      function isFunction3(value) {
        if (!isObject2(value)) {
          return false;
        }
        var tag = baseGetTag2(value);
        return tag == funcTag2 || tag == genTag2 || tag == asyncTag2 || tag == proxyTag2;
      }
      function isInteger(value) {
        return typeof value == "number" && value == toInteger(value);
      }
      function isLength2(value) {
        return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
      }
      function isObject2(value) {
        var type = typeof value;
        return value != null && (type == "object" || type == "function");
      }
      function isObjectLike2(value) {
        return value != null && typeof value == "object";
      }
      var isMap = nodeIsMap ? baseUnary2(nodeIsMap) : baseIsMap;
      function isMatch(object2, source2) {
        return object2 === source2 || baseIsMatch2(object2, source2, getMatchData2(source2));
      }
      function isMatchWith(object2, source2, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return baseIsMatch2(object2, source2, getMatchData2(source2), customizer);
      }
      function isNaN2(value) {
        return isNumber(value) && value != +value;
      }
      function isNative(value) {
        if (isMaskable(value)) {
          throw new Error2(CORE_ERROR_TEXT);
        }
        return baseIsNative2(value);
      }
      function isNull(value) {
        return value === null;
      }
      function isNil(value) {
        return value == null;
      }
      function isNumber(value) {
        return typeof value == "number" || isObjectLike2(value) && baseGetTag2(value) == numberTag2;
      }
      function isPlainObject2(value) {
        if (!isObjectLike2(value) || baseGetTag2(value) != objectTag2) {
          return false;
        }
        var proto = getPrototype(value);
        if (proto === null) {
          return true;
        }
        var Ctor = hasOwnProperty2.call(proto, "constructor") && proto.constructor;
        return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString2.call(Ctor) == objectCtorString;
      }
      var isRegExp = nodeIsRegExp ? baseUnary2(nodeIsRegExp) : baseIsRegExp;
      function isSafeInteger(value) {
        return isInteger(value) && value >= -MAX_SAFE_INTEGER2 && value <= MAX_SAFE_INTEGER2;
      }
      var isSet = nodeIsSet ? baseUnary2(nodeIsSet) : baseIsSet;
      function isString(value) {
        return typeof value == "string" || !isArray2(value) && isObjectLike2(value) && baseGetTag2(value) == stringTag2;
      }
      function isSymbol2(value) {
        return typeof value == "symbol" || isObjectLike2(value) && baseGetTag2(value) == symbolTag2;
      }
      var isTypedArray2 = nodeIsTypedArray2 ? baseUnary2(nodeIsTypedArray2) : baseIsTypedArray2;
      function isUndefined(value) {
        return value === undefined$1;
      }
      function isWeakMap(value) {
        return isObjectLike2(value) && getTag2(value) == weakMapTag2;
      }
      function isWeakSet(value) {
        return isObjectLike2(value) && baseGetTag2(value) == weakSetTag;
      }
      var lt = createRelationalOperation(baseLt);
      var lte = createRelationalOperation(function(value, other) {
        return value <= other;
      });
      function toArray2(value) {
        if (!value) {
          return [];
        }
        if (isArrayLike2(value)) {
          return isString(value) ? stringToArray2(value) : copyArray(value);
        }
        if (symIterator && value[symIterator]) {
          return iteratorToArray(value[symIterator]());
        }
        var tag = getTag2(value), func = tag == mapTag2 ? mapToArray2 : tag == setTag2 ? setToArray2 : values;
        return func(value);
      }
      function toFinite(value) {
        if (!value) {
          return value === 0 ? value : 0;
        }
        value = toNumber(value);
        if (value === INFINITY || value === -INFINITY) {
          var sign = value < 0 ? -1 : 1;
          return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
      }
      function toInteger(value) {
        var result2 = toFinite(value), remainder = result2 % 1;
        return result2 === result2 ? remainder ? result2 - remainder : result2 : 0;
      }
      function toLength(value) {
        return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
      }
      function toNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol2(value)) {
          return NAN;
        }
        if (isObject2(value)) {
          var other = typeof value.valueOf == "function" ? value.valueOf() : value;
          value = isObject2(other) ? other + "" : other;
        }
        if (typeof value != "string") {
          return value === 0 ? value : +value;
        }
        value = baseTrim(value);
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
      }
      function toPlainObject(value) {
        return copyObject(value, keysIn(value));
      }
      function toSafeInteger(value) {
        return value ? baseClamp(toInteger(value), -MAX_SAFE_INTEGER2, MAX_SAFE_INTEGER2) : value === 0 ? value : 0;
      }
      function toString2(value) {
        return value == null ? "" : baseToString2(value);
      }
      var assign = createAssigner(function(object2, source2) {
        if (isPrototype2(source2) || isArrayLike2(source2)) {
          copyObject(source2, keys2(source2), object2);
          return;
        }
        for (var key in source2) {
          if (hasOwnProperty2.call(source2, key)) {
            assignValue(object2, key, source2[key]);
          }
        }
      });
      var assignIn = createAssigner(function(object2, source2) {
        copyObject(source2, keysIn(source2), object2);
      });
      var assignInWith = createAssigner(function(object2, source2, srcIndex, customizer) {
        copyObject(source2, keysIn(source2), object2, customizer);
      });
      var assignWith = createAssigner(function(object2, source2, srcIndex, customizer) {
        copyObject(source2, keys2(source2), object2, customizer);
      });
      var at = flatRest(baseAt);
      function create2(prototype, properties) {
        var result2 = baseCreate(prototype);
        return properties == null ? result2 : baseAssign(result2, properties);
      }
      var defaults = baseRest(function(object2, sources) {
        object2 = Object2(object2);
        var index2 = -1;
        var length = sources.length;
        var guard = length > 2 ? sources[2] : undefined$1;
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          length = 1;
        }
        while (++index2 < length) {
          var source2 = sources[index2];
          var props = keysIn(source2);
          var propsIndex = -1;
          var propsLength = props.length;
          while (++propsIndex < propsLength) {
            var key = props[propsIndex];
            var value = object2[key];
            if (value === undefined$1 || eq2(value, objectProto2[key]) && !hasOwnProperty2.call(object2, key)) {
              object2[key] = source2[key];
            }
          }
        }
        return object2;
      });
      var defaultsDeep = baseRest(function(args) {
        args.push(undefined$1, customDefaultsMerge);
        return apply(mergeWith, undefined$1, args);
      });
      function findKey(object2, predicate) {
        return baseFindKey(object2, getIteratee(predicate, 3), baseForOwn2);
      }
      function findLastKey(object2, predicate) {
        return baseFindKey(object2, getIteratee(predicate, 3), baseForOwnRight);
      }
      function forIn(object2, iteratee2) {
        return object2 == null ? object2 : baseFor2(object2, getIteratee(iteratee2, 3), keysIn);
      }
      function forInRight(object2, iteratee2) {
        return object2 == null ? object2 : baseForRight(object2, getIteratee(iteratee2, 3), keysIn);
      }
      function forOwn(object2, iteratee2) {
        return object2 && baseForOwn2(object2, getIteratee(iteratee2, 3));
      }
      function forOwnRight(object2, iteratee2) {
        return object2 && baseForOwnRight(object2, getIteratee(iteratee2, 3));
      }
      function functions(object2) {
        return object2 == null ? [] : baseFunctions(object2, keys2(object2));
      }
      function functionsIn(object2) {
        return object2 == null ? [] : baseFunctions(object2, keysIn(object2));
      }
      function get2(object2, path2, defaultValue) {
        var result2 = object2 == null ? undefined$1 : baseGet2(object2, path2);
        return result2 === undefined$1 ? defaultValue : result2;
      }
      function has2(object2, path2) {
        return object2 != null && hasPath2(object2, path2, baseHas2);
      }
      function hasIn2(object2, path2) {
        return object2 != null && hasPath2(object2, path2, baseHasIn2);
      }
      var invert = createInverter(function(result2, value, key) {
        if (value != null && typeof value.toString != "function") {
          value = nativeObjectToString2.call(value);
        }
        result2[value] = key;
      }, constant(identity2));
      var invertBy = createInverter(function(result2, value, key) {
        if (value != null && typeof value.toString != "function") {
          value = nativeObjectToString2.call(value);
        }
        if (hasOwnProperty2.call(result2, value)) {
          result2[value].push(key);
        } else {
          result2[value] = [key];
        }
      }, getIteratee);
      var invoke = baseRest(baseInvoke);
      function keys2(object2) {
        return isArrayLike2(object2) ? arrayLikeKeys2(object2) : baseKeys2(object2);
      }
      function keysIn(object2) {
        return isArrayLike2(object2) ? arrayLikeKeys2(object2, true) : baseKeysIn(object2);
      }
      function mapKeys2(object2, iteratee2) {
        var result2 = {};
        iteratee2 = getIteratee(iteratee2, 3);
        baseForOwn2(object2, function(value, key, object3) {
          baseAssignValue2(result2, iteratee2(value, key, object3), value);
        });
        return result2;
      }
      function mapValues2(object2, iteratee2) {
        var result2 = {};
        iteratee2 = getIteratee(iteratee2, 3);
        baseForOwn2(object2, function(value, key, object3) {
          baseAssignValue2(result2, key, iteratee2(value, key, object3));
        });
        return result2;
      }
      var merge2 = createAssigner(function(object2, source2, srcIndex) {
        baseMerge(object2, source2, srcIndex);
      });
      var mergeWith = createAssigner(function(object2, source2, srcIndex, customizer) {
        baseMerge(object2, source2, srcIndex, customizer);
      });
      var omit2 = flatRest(function(object2, paths) {
        var result2 = {};
        if (object2 == null) {
          return result2;
        }
        var isDeep = false;
        paths = arrayMap2(paths, function(path2) {
          path2 = castPath2(path2, object2);
          isDeep || (isDeep = path2.length > 1);
          return path2;
        });
        copyObject(object2, getAllKeysIn(object2), result2);
        if (isDeep) {
          result2 = baseClone2(result2, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
        }
        var length = paths.length;
        while (length--) {
          baseUnset(result2, paths[length]);
        }
        return result2;
      });
      function omitBy(object2, predicate) {
        return pickBy(object2, negate(getIteratee(predicate)));
      }
      var pick2 = flatRest(function(object2, paths) {
        return object2 == null ? {} : basePick(object2, paths);
      });
      function pickBy(object2, predicate) {
        if (object2 == null) {
          return {};
        }
        var props = arrayMap2(getAllKeysIn(object2), function(prop) {
          return [prop];
        });
        predicate = getIteratee(predicate);
        return basePickBy(object2, props, function(value, path2) {
          return predicate(value, path2[0]);
        });
      }
      function result(object2, path2, defaultValue) {
        path2 = castPath2(path2, object2);
        var index2 = -1, length = path2.length;
        if (!length) {
          length = 1;
          object2 = undefined$1;
        }
        while (++index2 < length) {
          var value = object2 == null ? undefined$1 : object2[toKey2(path2[index2])];
          if (value === undefined$1) {
            index2 = length;
            value = defaultValue;
          }
          object2 = isFunction3(value) ? value.call(object2) : value;
        }
        return object2;
      }
      function set2(object2, path2, value) {
        return object2 == null ? object2 : baseSet(object2, path2, value);
      }
      function setWith(object2, path2, value, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return object2 == null ? object2 : baseSet(object2, path2, value, customizer);
      }
      var toPairs = createToPairs(keys2);
      var toPairsIn = createToPairs(keysIn);
      function transform2(object2, iteratee2, accumulator) {
        var isArr = isArray2(object2), isArrLike = isArr || isBuffer2(object2) || isTypedArray2(object2);
        iteratee2 = getIteratee(iteratee2, 4);
        if (accumulator == null) {
          var Ctor = object2 && object2.constructor;
          if (isArrLike) {
            accumulator = isArr ? new Ctor() : [];
          } else if (isObject2(object2)) {
            accumulator = isFunction3(Ctor) ? baseCreate(getPrototype(object2)) : {};
          } else {
            accumulator = {};
          }
        }
        (isArrLike ? arrayEach : baseForOwn2)(object2, function(value, index2, object3) {
          return iteratee2(accumulator, value, index2, object3);
        });
        return accumulator;
      }
      function unset(object2, path2) {
        return object2 == null ? true : baseUnset(object2, path2);
      }
      function update(object2, path2, updater) {
        return object2 == null ? object2 : baseUpdate(object2, path2, castFunction(updater));
      }
      function updateWith(object2, path2, updater, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return object2 == null ? object2 : baseUpdate(object2, path2, castFunction(updater), customizer);
      }
      function values(object2) {
        return object2 == null ? [] : baseValues(object2, keys2(object2));
      }
      function valuesIn(object2) {
        return object2 == null ? [] : baseValues(object2, keysIn(object2));
      }
      function clamp(number2, lower, upper) {
        if (upper === undefined$1) {
          upper = lower;
          lower = undefined$1;
        }
        if (upper !== undefined$1) {
          upper = toNumber(upper);
          upper = upper === upper ? upper : 0;
        }
        if (lower !== undefined$1) {
          lower = toNumber(lower);
          lower = lower === lower ? lower : 0;
        }
        return baseClamp(toNumber(number2), lower, upper);
      }
      function inRange(number2, start, end) {
        start = toFinite(start);
        if (end === undefined$1) {
          end = start;
          start = 0;
        } else {
          end = toFinite(end);
        }
        number2 = toNumber(number2);
        return baseInRange(number2, start, end);
      }
      function random(lower, upper, floating) {
        if (floating && typeof floating != "boolean" && isIterateeCall(lower, upper, floating)) {
          upper = floating = undefined$1;
        }
        if (floating === undefined$1) {
          if (typeof upper == "boolean") {
            floating = upper;
            upper = undefined$1;
          } else if (typeof lower == "boolean") {
            floating = lower;
            lower = undefined$1;
          }
        }
        if (lower === undefined$1 && upper === undefined$1) {
          lower = 0;
          upper = 1;
        } else {
          lower = toFinite(lower);
          if (upper === undefined$1) {
            upper = lower;
            lower = 0;
          } else {
            upper = toFinite(upper);
          }
        }
        if (lower > upper) {
          var temp = lower;
          lower = upper;
          upper = temp;
        }
        if (floating || lower % 1 || upper % 1) {
          var rand = nativeRandom();
          return nativeMin(lower + rand * (upper - lower + freeParseFloat("1e-" + ((rand + "").length - 1))), upper);
        }
        return baseRandom(lower, upper);
      }
      var camelCase2 = createCompounder2(function(result2, word, index2) {
        word = word.toLowerCase();
        return result2 + (index2 ? capitalize2(word) : word);
      });
      function capitalize2(string2) {
        return upperFirst2(toString2(string2).toLowerCase());
      }
      function deburr2(string2) {
        string2 = toString2(string2);
        return string2 && string2.replace(reLatin2, deburrLetter2).replace(reComboMark2, "");
      }
      function endsWith(string2, target, position) {
        string2 = toString2(string2);
        target = baseToString2(target);
        var length = string2.length;
        position = position === undefined$1 ? length : baseClamp(toInteger(position), 0, length);
        var end = position;
        position -= target.length;
        return position >= 0 && string2.slice(position, end) == target;
      }
      function escape2(string2) {
        string2 = toString2(string2);
        return string2 && reHasUnescapedHtml.test(string2) ? string2.replace(reUnescapedHtml, escapeHtmlChar) : string2;
      }
      function escapeRegExp(string2) {
        string2 = toString2(string2);
        return string2 && reHasRegExpChar.test(string2) ? string2.replace(reRegExpChar2, "\\$&") : string2;
      }
      var kebabCase = createCompounder2(function(result2, word, index2) {
        return result2 + (index2 ? "-" : "") + word.toLowerCase();
      });
      var lowerCase = createCompounder2(function(result2, word, index2) {
        return result2 + (index2 ? " " : "") + word.toLowerCase();
      });
      var lowerFirst = createCaseFirst2("toLowerCase");
      function pad(string2, length, chars) {
        string2 = toString2(string2);
        length = toInteger(length);
        var strLength = length ? stringSize(string2) : 0;
        if (!length || strLength >= length) {
          return string2;
        }
        var mid = (length - strLength) / 2;
        return createPadding(nativeFloor(mid), chars) + string2 + createPadding(nativeCeil(mid), chars);
      }
      function padEnd(string2, length, chars) {
        string2 = toString2(string2);
        length = toInteger(length);
        var strLength = length ? stringSize(string2) : 0;
        return length && strLength < length ? string2 + createPadding(length - strLength, chars) : string2;
      }
      function padStart(string2, length, chars) {
        string2 = toString2(string2);
        length = toInteger(length);
        var strLength = length ? stringSize(string2) : 0;
        return length && strLength < length ? createPadding(length - strLength, chars) + string2 : string2;
      }
      function parseInt2(string2, radix, guard) {
        if (guard || radix == null) {
          radix = 0;
        } else if (radix) {
          radix = +radix;
        }
        return nativeParseInt(toString2(string2).replace(reTrimStart, ""), radix || 0);
      }
      function repeat(string2, n, guard) {
        if (guard ? isIterateeCall(string2, n, guard) : n === undefined$1) {
          n = 1;
        } else {
          n = toInteger(n);
        }
        return baseRepeat(toString2(string2), n);
      }
      function replace() {
        var args = arguments, string2 = toString2(args[0]);
        return args.length < 3 ? string2 : string2.replace(args[1], args[2]);
      }
      var snakeCase2 = createCompounder2(function(result2, word, index2) {
        return result2 + (index2 ? "_" : "") + word.toLowerCase();
      });
      function split2(string2, separator, limit) {
        if (limit && typeof limit != "number" && isIterateeCall(string2, separator, limit)) {
          separator = limit = undefined$1;
        }
        limit = limit === undefined$1 ? MAX_ARRAY_LENGTH : limit >>> 0;
        if (!limit) {
          return [];
        }
        string2 = toString2(string2);
        if (string2 && (typeof separator == "string" || separator != null && !isRegExp(separator))) {
          separator = baseToString2(separator);
          if (!separator && hasUnicode2(string2)) {
            return castSlice2(stringToArray2(string2), 0, limit);
          }
        }
        return string2.split(separator, limit);
      }
      var startCase = createCompounder2(function(result2, word, index2) {
        return result2 + (index2 ? " " : "") + upperFirst2(word);
      });
      function startsWith(string2, target, position) {
        string2 = toString2(string2);
        position = position == null ? 0 : baseClamp(toInteger(position), 0, string2.length);
        target = baseToString2(target);
        return string2.slice(position, position + target.length) == target;
      }
      function template(string2, options2, guard) {
        var settings = lodash2.templateSettings;
        if (guard && isIterateeCall(string2, options2, guard)) {
          options2 = undefined$1;
        }
        string2 = toString2(string2);
        options2 = assignWith({}, options2, settings, customDefaultsAssignIn);
        var imports = assignWith({}, options2.imports, settings.imports, customDefaultsAssignIn), importsKeys = keys2(imports), importsValues = baseValues(imports, importsKeys);
        arrayEach(importsKeys, function(key) {
          if (reForbiddenIdentifierChars.test(key)) {
            throw new Error2(INVALID_TEMPL_IMPORTS_ERROR_TEXT);
          }
        });
        var isEscaping, isEvaluating, index2 = 0, interpolate = options2.interpolate || reNoMatch, source2 = "__p += '";
        var reDelimiters = RegExp2(
          (options2.escape || reNoMatch).source + "|" + interpolate.source + "|" + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + "|" + (options2.evaluate || reNoMatch).source + "|$",
          "g"
        );
        var sourceURL = "//# sourceURL=" + (hasOwnProperty2.call(options2, "sourceURL") ? (options2.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++templateCounter + "]") + "\n";
        string2.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
          interpolateValue || (interpolateValue = esTemplateValue);
          source2 += string2.slice(index2, offset).replace(reUnescapedString, escapeStringChar);
          if (escapeValue) {
            isEscaping = true;
            source2 += "' +\n__e(" + escapeValue + ") +\n'";
          }
          if (evaluateValue) {
            isEvaluating = true;
            source2 += "';\n" + evaluateValue + ";\n__p += '";
          }
          if (interpolateValue) {
            source2 += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
          }
          index2 = offset + match.length;
          return match;
        });
        source2 += "';\n";
        var variable = hasOwnProperty2.call(options2, "variable") && options2.variable;
        if (!variable) {
          source2 = "with (obj) {\n" + source2 + "\n}\n";
        } else if (reForbiddenIdentifierChars.test(variable)) {
          throw new Error2(INVALID_TEMPL_VAR_ERROR_TEXT);
        }
        source2 = (isEvaluating ? source2.replace(reEmptyStringLeading, "") : source2).replace(reEmptyStringMiddle, "$1").replace(reEmptyStringTrailing, "$1;");
        source2 = "function(" + (variable || "obj") + ") {\n" + (variable ? "" : "obj || (obj = {});\n") + "var __t, __p = ''" + (isEscaping ? ", __e = _.escape" : "") + (isEvaluating ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n" : ";\n") + source2 + "return __p\n}";
        var result2 = attempt(function() {
          return Function2(importsKeys, sourceURL + "return " + source2).apply(undefined$1, importsValues);
        });
        result2.source = source2;
        if (isError(result2)) {
          throw result2;
        }
        return result2;
      }
      function toLower(value) {
        return toString2(value).toLowerCase();
      }
      function toUpper(value) {
        return toString2(value).toUpperCase();
      }
      function trim2(string2, chars, guard) {
        string2 = toString2(string2);
        if (string2 && (guard || chars === undefined$1)) {
          return baseTrim(string2);
        }
        if (!string2 || !(chars = baseToString2(chars))) {
          return string2;
        }
        var strSymbols = stringToArray2(string2), chrSymbols = stringToArray2(chars), start = charsStartIndex(strSymbols, chrSymbols), end = charsEndIndex(strSymbols, chrSymbols) + 1;
        return castSlice2(strSymbols, start, end).join("");
      }
      function trimEnd(string2, chars, guard) {
        string2 = toString2(string2);
        if (string2 && (guard || chars === undefined$1)) {
          return string2.slice(0, trimmedEndIndex(string2) + 1);
        }
        if (!string2 || !(chars = baseToString2(chars))) {
          return string2;
        }
        var strSymbols = stringToArray2(string2), end = charsEndIndex(strSymbols, stringToArray2(chars)) + 1;
        return castSlice2(strSymbols, 0, end).join("");
      }
      function trimStart(string2, chars, guard) {
        string2 = toString2(string2);
        if (string2 && (guard || chars === undefined$1)) {
          return string2.replace(reTrimStart, "");
        }
        if (!string2 || !(chars = baseToString2(chars))) {
          return string2;
        }
        var strSymbols = stringToArray2(string2), start = charsStartIndex(strSymbols, stringToArray2(chars));
        return castSlice2(strSymbols, start).join("");
      }
      function truncate(string2, options2) {
        var length = DEFAULT_TRUNC_LENGTH, omission = DEFAULT_TRUNC_OMISSION;
        if (isObject2(options2)) {
          var separator = "separator" in options2 ? options2.separator : separator;
          length = "length" in options2 ? toInteger(options2.length) : length;
          omission = "omission" in options2 ? baseToString2(options2.omission) : omission;
        }
        string2 = toString2(string2);
        var strLength = string2.length;
        if (hasUnicode2(string2)) {
          var strSymbols = stringToArray2(string2);
          strLength = strSymbols.length;
        }
        if (length >= strLength) {
          return string2;
        }
        var end = length - stringSize(omission);
        if (end < 1) {
          return omission;
        }
        var result2 = strSymbols ? castSlice2(strSymbols, 0, end).join("") : string2.slice(0, end);
        if (separator === undefined$1) {
          return result2 + omission;
        }
        if (strSymbols) {
          end += result2.length - end;
        }
        if (isRegExp(separator)) {
          if (string2.slice(end).search(separator)) {
            var match, substring = result2;
            if (!separator.global) {
              separator = RegExp2(separator.source, toString2(reFlags.exec(separator)) + "g");
            }
            separator.lastIndex = 0;
            while (match = separator.exec(substring)) {
              var newEnd = match.index;
            }
            result2 = result2.slice(0, newEnd === undefined$1 ? end : newEnd);
          }
        } else if (string2.indexOf(baseToString2(separator), end) != end) {
          var index2 = result2.lastIndexOf(separator);
          if (index2 > -1) {
            result2 = result2.slice(0, index2);
          }
        }
        return result2 + omission;
      }
      function unescape(string2) {
        string2 = toString2(string2);
        return string2 && reHasEscapedHtml.test(string2) ? string2.replace(reEscapedHtml, unescapeHtmlChar) : string2;
      }
      var upperCase = createCompounder2(function(result2, word, index2) {
        return result2 + (index2 ? " " : "") + word.toUpperCase();
      });
      var upperFirst2 = createCaseFirst2("toUpperCase");
      function words2(string2, pattern, guard) {
        string2 = toString2(string2);
        pattern = guard ? undefined$1 : pattern;
        if (pattern === undefined$1) {
          return hasUnicodeWord2(string2) ? unicodeWords2(string2) : asciiWords2(string2);
        }
        return string2.match(pattern) || [];
      }
      var attempt = baseRest(function(func, args) {
        try {
          return apply(func, undefined$1, args);
        } catch (e) {
          return isError(e) ? e : new Error2(e);
        }
      });
      var bindAll = flatRest(function(object2, methodNames) {
        arrayEach(methodNames, function(key) {
          key = toKey2(key);
          baseAssignValue2(object2, key, bind(object2[key], object2));
        });
        return object2;
      });
      function cond(pairs) {
        var length = pairs == null ? 0 : pairs.length, toIteratee = getIteratee();
        pairs = !length ? [] : arrayMap2(pairs, function(pair) {
          if (typeof pair[1] != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT2);
          }
          return [toIteratee(pair[0]), pair[1]];
        });
        return baseRest(function(args) {
          var index2 = -1;
          while (++index2 < length) {
            var pair = pairs[index2];
            if (apply(pair[0], this, args)) {
              return apply(pair[1], this, args);
            }
          }
        });
      }
      function conforms(source2) {
        return baseConforms(baseClone2(source2, CLONE_DEEP_FLAG));
      }
      function constant(value) {
        return function() {
          return value;
        };
      }
      function defaultTo(value, defaultValue) {
        return value == null || value !== value ? defaultValue : value;
      }
      var flow = createFlow();
      var flowRight = createFlow(true);
      function identity2(value) {
        return value;
      }
      function iteratee(func) {
        return baseIteratee2(typeof func == "function" ? func : baseClone2(func, CLONE_DEEP_FLAG));
      }
      function matches(source2) {
        return baseMatches2(baseClone2(source2, CLONE_DEEP_FLAG));
      }
      function matchesProperty(path2, srcValue) {
        return baseMatchesProperty2(path2, baseClone2(srcValue, CLONE_DEEP_FLAG));
      }
      var method = baseRest(function(path2, args) {
        return function(object2) {
          return baseInvoke(object2, path2, args);
        };
      });
      var methodOf = baseRest(function(object2, args) {
        return function(path2) {
          return baseInvoke(object2, path2, args);
        };
      });
      function mixin(object2, source2, options2) {
        var props = keys2(source2), methodNames = baseFunctions(source2, props);
        if (options2 == null && !(isObject2(source2) && (methodNames.length || !props.length))) {
          options2 = source2;
          source2 = object2;
          object2 = this;
          methodNames = baseFunctions(source2, keys2(source2));
        }
        var chain2 = !(isObject2(options2) && "chain" in options2) || !!options2.chain, isFunc = isFunction3(object2);
        arrayEach(methodNames, function(methodName) {
          var func = source2[methodName];
          object2[methodName] = func;
          if (isFunc) {
            object2.prototype[methodName] = function() {
              var chainAll = this.__chain__;
              if (chain2 || chainAll) {
                var result2 = object2(this.__wrapped__), actions = result2.__actions__ = copyArray(this.__actions__);
                actions.push({ "func": func, "args": arguments, "thisArg": object2 });
                result2.__chain__ = chainAll;
                return result2;
              }
              return func.apply(object2, arrayPush2([this.value()], arguments));
            };
          }
        });
        return object2;
      }
      function noConflict() {
        if (root2._ === this) {
          root2._ = oldDash;
        }
        return this;
      }
      function noop() {
      }
      function nthArg(n) {
        n = toInteger(n);
        return baseRest(function(args) {
          return baseNth(args, n);
        });
      }
      var over = createOver(arrayMap2);
      var overEvery = createOver(arrayEvery);
      var overSome = createOver(arraySome2);
      function property2(path2) {
        return isKey2(path2) ? baseProperty2(toKey2(path2)) : basePropertyDeep2(path2);
      }
      function propertyOf(object2) {
        return function(path2) {
          return object2 == null ? undefined$1 : baseGet2(object2, path2);
        };
      }
      var range = createRange();
      var rangeRight = createRange(true);
      function stubArray2() {
        return [];
      }
      function stubFalse2() {
        return false;
      }
      function stubObject() {
        return {};
      }
      function stubString() {
        return "";
      }
      function stubTrue() {
        return true;
      }
      function times(n, iteratee2) {
        n = toInteger(n);
        if (n < 1 || n > MAX_SAFE_INTEGER2) {
          return [];
        }
        var index2 = MAX_ARRAY_LENGTH, length = nativeMin(n, MAX_ARRAY_LENGTH);
        iteratee2 = getIteratee(iteratee2);
        n -= MAX_ARRAY_LENGTH;
        var result2 = baseTimes2(length, iteratee2);
        while (++index2 < n) {
          iteratee2(index2);
        }
        return result2;
      }
      function toPath(value) {
        if (isArray2(value)) {
          return arrayMap2(value, toKey2);
        }
        return isSymbol2(value) ? [value] : copyArray(stringToPath2(toString2(value)));
      }
      function uniqueId(prefix) {
        var id = ++idCounter;
        return toString2(prefix) + id;
      }
      var add = createMathOperation(function(augend, addend) {
        return augend + addend;
      }, 0);
      var ceil = createRound("ceil");
      var divide = createMathOperation(function(dividend, divisor) {
        return dividend / divisor;
      }, 1);
      var floor = createRound("floor");
      function max(array2) {
        return array2 && array2.length ? baseExtremum(array2, identity2, baseGt) : undefined$1;
      }
      function maxBy(array2, iteratee2) {
        return array2 && array2.length ? baseExtremum(array2, getIteratee(iteratee2, 2), baseGt) : undefined$1;
      }
      function mean(array2) {
        return baseMean(array2, identity2);
      }
      function meanBy(array2, iteratee2) {
        return baseMean(array2, getIteratee(iteratee2, 2));
      }
      function min(array2) {
        return array2 && array2.length ? baseExtremum(array2, identity2, baseLt) : undefined$1;
      }
      function minBy(array2, iteratee2) {
        return array2 && array2.length ? baseExtremum(array2, getIteratee(iteratee2, 2), baseLt) : undefined$1;
      }
      var multiply = createMathOperation(function(multiplier, multiplicand) {
        return multiplier * multiplicand;
      }, 1);
      var round = createRound("round");
      var subtract = createMathOperation(function(minuend, subtrahend) {
        return minuend - subtrahend;
      }, 0);
      function sum(array2) {
        return array2 && array2.length ? baseSum(array2, identity2) : 0;
      }
      function sumBy(array2, iteratee2) {
        return array2 && array2.length ? baseSum(array2, getIteratee(iteratee2, 2)) : 0;
      }
      lodash2.after = after;
      lodash2.ary = ary;
      lodash2.assign = assign;
      lodash2.assignIn = assignIn;
      lodash2.assignInWith = assignInWith;
      lodash2.assignWith = assignWith;
      lodash2.at = at;
      lodash2.before = before;
      lodash2.bind = bind;
      lodash2.bindAll = bindAll;
      lodash2.bindKey = bindKey;
      lodash2.castArray = castArray;
      lodash2.chain = chain;
      lodash2.chunk = chunk;
      lodash2.compact = compact;
      lodash2.concat = concat;
      lodash2.cond = cond;
      lodash2.conforms = conforms;
      lodash2.constant = constant;
      lodash2.countBy = countBy;
      lodash2.create = create2;
      lodash2.curry = curry2;
      lodash2.curryRight = curryRight;
      lodash2.debounce = debounce;
      lodash2.defaults = defaults;
      lodash2.defaultsDeep = defaultsDeep;
      lodash2.defer = defer;
      lodash2.delay = delay;
      lodash2.difference = difference;
      lodash2.differenceBy = differenceBy;
      lodash2.differenceWith = differenceWith;
      lodash2.drop = drop;
      lodash2.dropRight = dropRight;
      lodash2.dropRightWhile = dropRightWhile;
      lodash2.dropWhile = dropWhile;
      lodash2.fill = fill;
      lodash2.filter = filter;
      lodash2.flatMap = flatMap;
      lodash2.flatMapDeep = flatMapDeep;
      lodash2.flatMapDepth = flatMapDepth;
      lodash2.flatten = flatten;
      lodash2.flattenDeep = flattenDeep;
      lodash2.flattenDepth = flattenDepth;
      lodash2.flip = flip;
      lodash2.flow = flow;
      lodash2.flowRight = flowRight;
      lodash2.fromPairs = fromPairs;
      lodash2.functions = functions;
      lodash2.functionsIn = functionsIn;
      lodash2.groupBy = groupBy;
      lodash2.initial = initial;
      lodash2.intersection = intersection2;
      lodash2.intersectionBy = intersectionBy;
      lodash2.intersectionWith = intersectionWith;
      lodash2.invert = invert;
      lodash2.invertBy = invertBy;
      lodash2.invokeMap = invokeMap;
      lodash2.iteratee = iteratee;
      lodash2.keyBy = keyBy;
      lodash2.keys = keys2;
      lodash2.keysIn = keysIn;
      lodash2.map = map2;
      lodash2.mapKeys = mapKeys2;
      lodash2.mapValues = mapValues2;
      lodash2.matches = matches;
      lodash2.matchesProperty = matchesProperty;
      lodash2.memoize = memoize2;
      lodash2.merge = merge2;
      lodash2.mergeWith = mergeWith;
      lodash2.method = method;
      lodash2.methodOf = methodOf;
      lodash2.mixin = mixin;
      lodash2.negate = negate;
      lodash2.nthArg = nthArg;
      lodash2.omit = omit2;
      lodash2.omitBy = omitBy;
      lodash2.once = once2;
      lodash2.orderBy = orderBy;
      lodash2.over = over;
      lodash2.overArgs = overArgs;
      lodash2.overEvery = overEvery;
      lodash2.overSome = overSome;
      lodash2.partial = partial2;
      lodash2.partialRight = partialRight;
      lodash2.partition = partition;
      lodash2.pick = pick2;
      lodash2.pickBy = pickBy;
      lodash2.property = property2;
      lodash2.propertyOf = propertyOf;
      lodash2.pull = pull;
      lodash2.pullAll = pullAll;
      lodash2.pullAllBy = pullAllBy;
      lodash2.pullAllWith = pullAllWith;
      lodash2.pullAt = pullAt;
      lodash2.range = range;
      lodash2.rangeRight = rangeRight;
      lodash2.rearg = rearg;
      lodash2.reject = reject;
      lodash2.remove = remove;
      lodash2.rest = rest;
      lodash2.reverse = reverse;
      lodash2.sampleSize = sampleSize;
      lodash2.set = set2;
      lodash2.setWith = setWith;
      lodash2.shuffle = shuffle;
      lodash2.slice = slice;
      lodash2.sortBy = sortBy;
      lodash2.sortedUniq = sortedUniq;
      lodash2.sortedUniqBy = sortedUniqBy;
      lodash2.split = split2;
      lodash2.spread = spread;
      lodash2.tail = tail;
      lodash2.take = take;
      lodash2.takeRight = takeRight;
      lodash2.takeRightWhile = takeRightWhile;
      lodash2.takeWhile = takeWhile;
      lodash2.tap = tap;
      lodash2.throttle = throttle;
      lodash2.thru = thru;
      lodash2.toArray = toArray2;
      lodash2.toPairs = toPairs;
      lodash2.toPairsIn = toPairsIn;
      lodash2.toPath = toPath;
      lodash2.toPlainObject = toPlainObject;
      lodash2.transform = transform2;
      lodash2.unary = unary;
      lodash2.union = union2;
      lodash2.unionBy = unionBy;
      lodash2.unionWith = unionWith;
      lodash2.uniq = uniq;
      lodash2.uniqBy = uniqBy;
      lodash2.uniqWith = uniqWith;
      lodash2.unset = unset;
      lodash2.unzip = unzip;
      lodash2.unzipWith = unzipWith;
      lodash2.update = update;
      lodash2.updateWith = updateWith;
      lodash2.values = values;
      lodash2.valuesIn = valuesIn;
      lodash2.without = without;
      lodash2.words = words2;
      lodash2.wrap = wrap;
      lodash2.xor = xor;
      lodash2.xorBy = xorBy;
      lodash2.xorWith = xorWith;
      lodash2.zip = zip;
      lodash2.zipObject = zipObject;
      lodash2.zipObjectDeep = zipObjectDeep;
      lodash2.zipWith = zipWith;
      lodash2.entries = toPairs;
      lodash2.entriesIn = toPairsIn;
      lodash2.extend = assignIn;
      lodash2.extendWith = assignInWith;
      mixin(lodash2, lodash2);
      lodash2.add = add;
      lodash2.attempt = attempt;
      lodash2.camelCase = camelCase2;
      lodash2.capitalize = capitalize2;
      lodash2.ceil = ceil;
      lodash2.clamp = clamp;
      lodash2.clone = clone2;
      lodash2.cloneDeep = cloneDeep;
      lodash2.cloneDeepWith = cloneDeepWith;
      lodash2.cloneWith = cloneWith;
      lodash2.conformsTo = conformsTo;
      lodash2.deburr = deburr2;
      lodash2.defaultTo = defaultTo;
      lodash2.divide = divide;
      lodash2.endsWith = endsWith;
      lodash2.eq = eq2;
      lodash2.escape = escape2;
      lodash2.escapeRegExp = escapeRegExp;
      lodash2.every = every;
      lodash2.find = find;
      lodash2.findIndex = findIndex2;
      lodash2.findKey = findKey;
      lodash2.findLast = findLast;
      lodash2.findLastIndex = findLastIndex;
      lodash2.findLastKey = findLastKey;
      lodash2.floor = floor;
      lodash2.forEach = forEach2;
      lodash2.forEachRight = forEachRight;
      lodash2.forIn = forIn;
      lodash2.forInRight = forInRight;
      lodash2.forOwn = forOwn;
      lodash2.forOwnRight = forOwnRight;
      lodash2.get = get2;
      lodash2.gt = gt;
      lodash2.gte = gte;
      lodash2.has = has2;
      lodash2.hasIn = hasIn2;
      lodash2.head = head;
      lodash2.identity = identity2;
      lodash2.includes = includes;
      lodash2.indexOf = indexOf;
      lodash2.inRange = inRange;
      lodash2.invoke = invoke;
      lodash2.isArguments = isArguments2;
      lodash2.isArray = isArray2;
      lodash2.isArrayBuffer = isArrayBuffer;
      lodash2.isArrayLike = isArrayLike2;
      lodash2.isArrayLikeObject = isArrayLikeObject;
      lodash2.isBoolean = isBoolean;
      lodash2.isBuffer = isBuffer2;
      lodash2.isDate = isDate2;
      lodash2.isElement = isElement;
      lodash2.isEmpty = isEmpty;
      lodash2.isEqual = isEqual;
      lodash2.isEqualWith = isEqualWith;
      lodash2.isError = isError;
      lodash2.isFinite = isFinite;
      lodash2.isFunction = isFunction3;
      lodash2.isInteger = isInteger;
      lodash2.isLength = isLength2;
      lodash2.isMap = isMap;
      lodash2.isMatch = isMatch;
      lodash2.isMatchWith = isMatchWith;
      lodash2.isNaN = isNaN2;
      lodash2.isNative = isNative;
      lodash2.isNil = isNil;
      lodash2.isNull = isNull;
      lodash2.isNumber = isNumber;
      lodash2.isObject = isObject2;
      lodash2.isObjectLike = isObjectLike2;
      lodash2.isPlainObject = isPlainObject2;
      lodash2.isRegExp = isRegExp;
      lodash2.isSafeInteger = isSafeInteger;
      lodash2.isSet = isSet;
      lodash2.isString = isString;
      lodash2.isSymbol = isSymbol2;
      lodash2.isTypedArray = isTypedArray2;
      lodash2.isUndefined = isUndefined;
      lodash2.isWeakMap = isWeakMap;
      lodash2.isWeakSet = isWeakSet;
      lodash2.join = join;
      lodash2.kebabCase = kebabCase;
      lodash2.last = last;
      lodash2.lastIndexOf = lastIndexOf;
      lodash2.lowerCase = lowerCase;
      lodash2.lowerFirst = lowerFirst;
      lodash2.lt = lt;
      lodash2.lte = lte;
      lodash2.max = max;
      lodash2.maxBy = maxBy;
      lodash2.mean = mean;
      lodash2.meanBy = meanBy;
      lodash2.min = min;
      lodash2.minBy = minBy;
      lodash2.stubArray = stubArray2;
      lodash2.stubFalse = stubFalse2;
      lodash2.stubObject = stubObject;
      lodash2.stubString = stubString;
      lodash2.stubTrue = stubTrue;
      lodash2.multiply = multiply;
      lodash2.nth = nth;
      lodash2.noConflict = noConflict;
      lodash2.noop = noop;
      lodash2.now = now;
      lodash2.pad = pad;
      lodash2.padEnd = padEnd;
      lodash2.padStart = padStart;
      lodash2.parseInt = parseInt2;
      lodash2.random = random;
      lodash2.reduce = reduce;
      lodash2.reduceRight = reduceRight;
      lodash2.repeat = repeat;
      lodash2.replace = replace;
      lodash2.result = result;
      lodash2.round = round;
      lodash2.runInContext = runInContext2;
      lodash2.sample = sample;
      lodash2.size = size;
      lodash2.snakeCase = snakeCase2;
      lodash2.some = some;
      lodash2.sortedIndex = sortedIndex;
      lodash2.sortedIndexBy = sortedIndexBy;
      lodash2.sortedIndexOf = sortedIndexOf;
      lodash2.sortedLastIndex = sortedLastIndex;
      lodash2.sortedLastIndexBy = sortedLastIndexBy;
      lodash2.sortedLastIndexOf = sortedLastIndexOf;
      lodash2.startCase = startCase;
      lodash2.startsWith = startsWith;
      lodash2.subtract = subtract;
      lodash2.sum = sum;
      lodash2.sumBy = sumBy;
      lodash2.template = template;
      lodash2.times = times;
      lodash2.toFinite = toFinite;
      lodash2.toInteger = toInteger;
      lodash2.toLength = toLength;
      lodash2.toLower = toLower;
      lodash2.toNumber = toNumber;
      lodash2.toSafeInteger = toSafeInteger;
      lodash2.toString = toString2;
      lodash2.toUpper = toUpper;
      lodash2.trim = trim2;
      lodash2.trimEnd = trimEnd;
      lodash2.trimStart = trimStart;
      lodash2.truncate = truncate;
      lodash2.unescape = unescape;
      lodash2.uniqueId = uniqueId;
      lodash2.upperCase = upperCase;
      lodash2.upperFirst = upperFirst2;
      lodash2.each = forEach2;
      lodash2.eachRight = forEachRight;
      lodash2.first = head;
      mixin(lodash2, function() {
        var source2 = {};
        baseForOwn2(lodash2, function(func, methodName) {
          if (!hasOwnProperty2.call(lodash2.prototype, methodName)) {
            source2[methodName] = func;
          }
        });
        return source2;
      }(), { "chain": false });
      lodash2.VERSION = VERSION;
      arrayEach(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(methodName) {
        lodash2[methodName].placeholder = lodash2;
      });
      arrayEach(["drop", "take"], function(methodName, index2) {
        LazyWrapper.prototype[methodName] = function(n) {
          n = n === undefined$1 ? 1 : nativeMax(toInteger(n), 0);
          var result2 = this.__filtered__ && !index2 ? new LazyWrapper(this) : this.clone();
          if (result2.__filtered__) {
            result2.__takeCount__ = nativeMin(n, result2.__takeCount__);
          } else {
            result2.__views__.push({
              "size": nativeMin(n, MAX_ARRAY_LENGTH),
              "type": methodName + (result2.__dir__ < 0 ? "Right" : "")
            });
          }
          return result2;
        };
        LazyWrapper.prototype[methodName + "Right"] = function(n) {
          return this.reverse()[methodName](n).reverse();
        };
      });
      arrayEach(["filter", "map", "takeWhile"], function(methodName, index2) {
        var type = index2 + 1, isFilter = type == LAZY_FILTER_FLAG || type == LAZY_WHILE_FLAG;
        LazyWrapper.prototype[methodName] = function(iteratee2) {
          var result2 = this.clone();
          result2.__iteratees__.push({
            "iteratee": getIteratee(iteratee2, 3),
            "type": type
          });
          result2.__filtered__ = result2.__filtered__ || isFilter;
          return result2;
        };
      });
      arrayEach(["head", "last"], function(methodName, index2) {
        var takeName = "take" + (index2 ? "Right" : "");
        LazyWrapper.prototype[methodName] = function() {
          return this[takeName](1).value()[0];
        };
      });
      arrayEach(["initial", "tail"], function(methodName, index2) {
        var dropName = "drop" + (index2 ? "" : "Right");
        LazyWrapper.prototype[methodName] = function() {
          return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
        };
      });
      LazyWrapper.prototype.compact = function() {
        return this.filter(identity2);
      };
      LazyWrapper.prototype.find = function(predicate) {
        return this.filter(predicate).head();
      };
      LazyWrapper.prototype.findLast = function(predicate) {
        return this.reverse().find(predicate);
      };
      LazyWrapper.prototype.invokeMap = baseRest(function(path2, args) {
        if (typeof path2 == "function") {
          return new LazyWrapper(this);
        }
        return this.map(function(value) {
          return baseInvoke(value, path2, args);
        });
      });
      LazyWrapper.prototype.reject = function(predicate) {
        return this.filter(negate(getIteratee(predicate)));
      };
      LazyWrapper.prototype.slice = function(start, end) {
        start = toInteger(start);
        var result2 = this;
        if (result2.__filtered__ && (start > 0 || end < 0)) {
          return new LazyWrapper(result2);
        }
        if (start < 0) {
          result2 = result2.takeRight(-start);
        } else if (start) {
          result2 = result2.drop(start);
        }
        if (end !== undefined$1) {
          end = toInteger(end);
          result2 = end < 0 ? result2.dropRight(-end) : result2.take(end - start);
        }
        return result2;
      };
      LazyWrapper.prototype.takeRightWhile = function(predicate) {
        return this.reverse().takeWhile(predicate).reverse();
      };
      LazyWrapper.prototype.toArray = function() {
        return this.take(MAX_ARRAY_LENGTH);
      };
      baseForOwn2(LazyWrapper.prototype, function(func, methodName) {
        var checkIteratee = /^(?:filter|find|map|reject)|While$/.test(methodName), isTaker = /^(?:head|last)$/.test(methodName), lodashFunc = lodash2[isTaker ? "take" + (methodName == "last" ? "Right" : "") : methodName], retUnwrapped = isTaker || /^find/.test(methodName);
        if (!lodashFunc) {
          return;
        }
        lodash2.prototype[methodName] = function() {
          var value = this.__wrapped__, args = isTaker ? [1] : arguments, isLazy = value instanceof LazyWrapper, iteratee2 = args[0], useLazy = isLazy || isArray2(value);
          var interceptor = function(value2) {
            var result3 = lodashFunc.apply(lodash2, arrayPush2([value2], args));
            return isTaker && chainAll ? result3[0] : result3;
          };
          if (useLazy && checkIteratee && typeof iteratee2 == "function" && iteratee2.length != 1) {
            isLazy = useLazy = false;
          }
          var chainAll = this.__chain__, isHybrid = !!this.__actions__.length, isUnwrapped = retUnwrapped && !chainAll, onlyLazy = isLazy && !isHybrid;
          if (!retUnwrapped && useLazy) {
            value = onlyLazy ? value : new LazyWrapper(this);
            var result2 = func.apply(value, args);
            result2.__actions__.push({ "func": thru, "args": [interceptor], "thisArg": undefined$1 });
            return new LodashWrapper(result2, chainAll);
          }
          if (isUnwrapped && onlyLazy) {
            return func.apply(this, args);
          }
          result2 = this.thru(interceptor);
          return isUnwrapped ? isTaker ? result2.value()[0] : result2.value() : result2;
        };
      });
      arrayEach(["pop", "push", "shift", "sort", "splice", "unshift"], function(methodName) {
        var func = arrayProto2[methodName], chainName = /^(?:push|sort|unshift)$/.test(methodName) ? "tap" : "thru", retUnwrapped = /^(?:pop|shift)$/.test(methodName);
        lodash2.prototype[methodName] = function() {
          var args = arguments;
          if (retUnwrapped && !this.__chain__) {
            var value = this.value();
            return func.apply(isArray2(value) ? value : [], args);
          }
          return this[chainName](function(value2) {
            return func.apply(isArray2(value2) ? value2 : [], args);
          });
        };
      });
      baseForOwn2(LazyWrapper.prototype, function(func, methodName) {
        var lodashFunc = lodash2[methodName];
        if (lodashFunc) {
          var key = lodashFunc.name + "";
          if (!hasOwnProperty2.call(realNames, key)) {
            realNames[key] = [];
          }
          realNames[key].push({ "name": methodName, "func": lodashFunc });
        }
      });
      realNames[createHybrid(undefined$1, WRAP_BIND_KEY_FLAG).name] = [{
        "name": "wrapper",
        "func": undefined$1
      }];
      LazyWrapper.prototype.clone = lazyClone;
      LazyWrapper.prototype.reverse = lazyReverse;
      LazyWrapper.prototype.value = lazyValue;
      lodash2.prototype.at = wrapperAt;
      lodash2.prototype.chain = wrapperChain;
      lodash2.prototype.commit = wrapperCommit;
      lodash2.prototype.next = wrapperNext;
      lodash2.prototype.plant = wrapperPlant;
      lodash2.prototype.reverse = wrapperReverse;
      lodash2.prototype.toJSON = lodash2.prototype.valueOf = lodash2.prototype.value = wrapperValue;
      lodash2.prototype.first = lodash2.prototype.head;
      if (symIterator) {
        lodash2.prototype[symIterator] = wrapperToIterator;
      }
      return lodash2;
    };
    var _2 = runInContext();
    if (freeModule) {
      (freeModule.exports = _2)._ = _2;
      freeExports._ = _2;
    } else {
      root2._ = _2;
    }
  }).call(commonjsGlobal);
})(lodash, lodash.exports);
var lodashExports = lodash.exports;
const _ = /* @__PURE__ */ getDefaultExportFromCjs(lodashExports);
const TRUTHY_INPUTS = /* @__PURE__ */ new Set([
  "true",
  "t",
  "1",
  1
]);
const FALSY_INPUTS = /* @__PURE__ */ new Set([
  "false",
  "f",
  "0",
  0
]);
const isBooleanLike = (value) => {
  if (typeof value === "boolean") {
    return true;
  }
  if (typeof value === "string" || typeof value === "number") {
    return TRUTHY_INPUTS.has(value) || FALSY_INPUTS.has(value);
  }
  return false;
};
function envFn(key, defaultValue) {
  return _.has(process.env, key) ? process.env[key] : defaultValue;
}
function getKey(key) {
  return process.env[key] ?? "";
}
function int$1(key, defaultValue) {
  if (!_.has(process.env, key)) {
    return defaultValue;
  }
  return parseInt(getKey(key), 10);
}
function float(key, defaultValue) {
  if (!_.has(process.env, key)) {
    return defaultValue;
  }
  return parseFloat(getKey(key));
}
function bool(key, defaultValue) {
  if (!_.has(process.env, key)) {
    return defaultValue;
  }
  return getKey(key) === "true";
}
function json(key, defaultValue) {
  if (!_.has(process.env, key)) {
    return defaultValue;
  }
  try {
    return JSON.parse(getKey(key));
  } catch (error2) {
    if (error2 instanceof Error) {
      throw new Error(`Invalid json environment variable ${key}: ${error2.message}`);
    }
    throw error2;
  }
}
function array$2(key, defaultValue) {
  if (!_.has(process.env, key)) {
    return defaultValue;
  }
  let value = getKey(key);
  if (value.startsWith("[") && value.endsWith("]")) {
    value = value.substring(1, value.length - 1);
  }
  return value.split(",").map((v) => {
    return _.trim(_.trim(v, " "), '"');
  });
}
function date$3(key, defaultValue) {
  if (!_.has(process.env, key)) {
    return defaultValue;
  }
  return new Date(getKey(key));
}
function oneOf(key, expectedValues, defaultValue) {
  if (!expectedValues) {
    throw new Error(`env.oneOf requires expectedValues`);
  }
  if (defaultValue && !expectedValues.includes(defaultValue)) {
    throw new Error(`env.oneOf requires defaultValue to be included in expectedValues`);
  }
  const rawValue = env(key, defaultValue);
  if (rawValue !== void 0 && expectedValues.includes(rawValue)) {
    return rawValue;
  }
  return defaultValue;
}
const utils = {
  int: int$1,
  float,
  bool,
  json,
  array: array$2,
  date: date$3,
  oneOf
};
const env = Object.assign(envFn, utils);
const ID_ATTRIBUTE$2 = "id";
const DOC_ID_ATTRIBUTE$2 = "documentId";
const constants = {
  ID_ATTRIBUTE: ID_ATTRIBUTE$2,
  DOC_ID_ATTRIBUTE: DOC_ID_ATTRIBUTE$2
};
const storedPrivateAttributesCache = /* @__PURE__ */ new WeakMap();
const computeStoredPrivateAttributes = (model) => new Set(lodashExports.union(lodashExports.get(model, "options.privateAttributes", []), strapi?.config?.get("api.responses.privateAttributes", []) ?? []));
const getStoredPrivateAttributesSet = (model) => {
  const cacheable = typeof model === "object" && model !== null && strapi?.config != null;
  if (!cacheable) {
    return computeStoredPrivateAttributes(model);
  }
  let cached2 = storedPrivateAttributesCache.get(model);
  if (cached2 === void 0) {
    cached2 = computeStoredPrivateAttributes(model);
    storedPrivateAttributesCache.set(model, cached2);
  }
  return cached2;
};
const isPrivateAttribute = (model, attributeName) => {
  if (model?.attributes?.[attributeName]?.private === true) {
    return true;
  }
  const storedPrivateAttributes = getStoredPrivateAttributesSet(model);
  return storedPrivateAttributes.size !== 0 && storedPrivateAttributes.has(attributeName);
};
const isScalarAttribute = (attribute) => {
  return attribute && ![
    "media",
    "component",
    "relation",
    "dynamiczone"
  ].includes(attribute.type);
};
const isMediaAttribute = (attribute) => attribute?.type === "media";
const isRelationalAttribute = (attribute) => attribute?.type === "relation";
const isDynamicZoneAttribute = (attribute) => !!attribute && attribute.type === "dynamiczone";
const isMorphToRelationalAttribute = (attribute) => {
  return !!attribute && isRelationalAttribute(attribute) && attribute.relation?.startsWith?.("morphTo");
};
const curry = (fn, arity = fn.length) => {
  const curried = (...args) => {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...rest) => curried(...args, ...rest);
  };
  return curried;
};
const parallelWithOrderedErrors = async (promises) => {
  const results = await Promise.allSettled(promises);
  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    if (result.status === "rejected") {
      throw result.reason;
    }
  }
  return results.map((r) => r.value);
};
const traverseEntity$1 = async (visitor2, options2, entity) => {
  const { path: path2 = {
    raw: null,
    attribute: null,
    rawWithIndices: null
  }, schema: schema2, getModel, allowedExtraRootKeys } = options2;
  let parent = options2.parent;
  const traverseMorphRelationTarget = async (visitor3, path3, entry) => {
    const targetSchema = getModel(entry.__type);
    const traverseOptions = {
      schema: targetSchema,
      path: path3,
      getModel,
      parent,
      allowedExtraRootKeys
    };
    return traverseEntity$1(visitor3, traverseOptions, entry);
  };
  const traverseRelationTarget = (schema3) => async (visitor3, path3, entry) => {
    const traverseOptions = {
      schema: schema3,
      path: path3,
      getModel,
      parent,
      allowedExtraRootKeys
    };
    return traverseEntity$1(visitor3, traverseOptions, entry);
  };
  const traverseMediaTarget = async (visitor3, path3, entry) => {
    const targetSchemaUID = "plugin::upload.file";
    const targetSchema = getModel(targetSchemaUID);
    const traverseOptions = {
      schema: targetSchema,
      path: path3,
      getModel,
      parent,
      allowedExtraRootKeys
    };
    return traverseEntity$1(visitor3, traverseOptions, entry);
  };
  const traverseComponent = async (visitor3, path3, schema3, entry) => {
    const traverseOptions = {
      schema: schema3,
      path: path3,
      getModel,
      parent,
      allowedExtraRootKeys
    };
    return traverseEntity$1(visitor3, traverseOptions, entry);
  };
  const visitDynamicZoneEntry = async (visitor3, path3, entry) => {
    if (entry == null) {
      return entry;
    }
    const targetSchema = getModel(entry.__component);
    const traverseOptions = {
      schema: targetSchema,
      path: path3,
      getModel,
      parent,
      allowedExtraRootKeys
    };
    return traverseEntity$1(visitor3, traverseOptions, entry);
  };
  if (!lodashExports.isObject(entity) || schema2 == null) {
    return entity;
  }
  const copy = lodashExports.clone(entity);
  const visitorUtils = createVisitorUtils({
    data: copy
  });
  const keys2 = Object.keys(copy);
  for (let i = 0; i < keys2.length; i += 1) {
    const key = keys2[i];
    const attribute = schema2.attributes[key];
    const newPath = {
      ...path2
    };
    newPath.raw = path2.raw == null ? key : `${path2.raw}.${key}`;
    newPath.rawWithIndices = path2.rawWithIndices == null ? key : `${path2.rawWithIndices}.${key}`;
    if (attribute != null) {
      newPath.attribute = path2.attribute == null ? key : `${path2.attribute}.${key}`;
    }
    const visitorOptions = {
      data: copy,
      schema: schema2,
      key,
      value: copy[key],
      attribute,
      path: newPath,
      getModel,
      parent,
      allowedExtraRootKeys
    };
    const visited = visitor2(visitorOptions, visitorUtils);
    if (visited != null && typeof visited.then === "function") {
      await visited;
    }
    const value = copy[key];
    if (value == null || attribute == null) {
      continue;
    }
    if (isRelationalAttribute(attribute)) {
      parent = {
        schema: schema2,
        key,
        attribute,
        path: newPath
      };
      const isMorphRelation = attribute.relation.toLowerCase().startsWith("morph");
      const method = isMorphRelation ? traverseMorphRelationTarget : traverseRelationTarget(getModel(attribute.target));
      if (Array.isArray(value)) {
        copy[key] = await parallelWithOrderedErrors(value.map((item, i2) => {
          const arrayPath = {
            ...newPath,
            rawWithIndices: newPath.rawWithIndices == null ? `${i2}` : `${newPath.rawWithIndices}.${i2}`
          };
          return method(visitor2, arrayPath, item);
        }));
      } else {
        copy[key] = await method(visitor2, newPath, value);
      }
      continue;
    }
    if (isMediaAttribute(attribute)) {
      parent = {
        schema: schema2,
        key,
        attribute,
        path: newPath
      };
      if (Array.isArray(value)) {
        copy[key] = await parallelWithOrderedErrors(value.map((item, i2) => {
          const arrayPath = {
            ...newPath,
            rawWithIndices: newPath.rawWithIndices == null ? `${i2}` : `${newPath.rawWithIndices}.${i2}`
          };
          return traverseMediaTarget(visitor2, arrayPath, item);
        }));
      } else {
        copy[key] = await traverseMediaTarget(visitor2, newPath, value);
      }
      continue;
    }
    if (attribute.type === "component") {
      parent = {
        schema: schema2,
        key,
        attribute,
        path: newPath
      };
      const targetSchema = getModel(attribute.component);
      if (Array.isArray(value)) {
        copy[key] = await parallelWithOrderedErrors(value.map((item, i2) => {
          const arrayPath = {
            ...newPath,
            rawWithIndices: newPath.rawWithIndices == null ? `${i2}` : `${newPath.rawWithIndices}.${i2}`
          };
          return traverseComponent(visitor2, arrayPath, targetSchema, item);
        }));
      } else {
        copy[key] = await traverseComponent(visitor2, newPath, targetSchema, value);
      }
      continue;
    }
    if (attribute.type === "dynamiczone" && Array.isArray(value)) {
      parent = {
        schema: schema2,
        key,
        attribute,
        path: newPath
      };
      copy[key] = await parallelWithOrderedErrors(value.map((item, i2) => {
        const arrayPath = {
          ...newPath,
          rawWithIndices: newPath.rawWithIndices == null ? `${i2}` : `${newPath.rawWithIndices}.${i2}`
        };
        return visitDynamicZoneEntry(visitor2, arrayPath, item);
      }));
      continue;
    }
  }
  return copy;
};
const createVisitorUtils = ({ data }) => ({
  remove(key) {
    delete data[key];
  },
  set(key, value) {
    data[key] = value;
  }
});
curry(traverseEntity$1);
var dist = { exports: {} };
(function(module, exports) {
  !function(t, n) {
    module.exports = n(require$$0$1, require$$1);
  }(commonjsGlobal, function(t, n) {
    return function(t2) {
      function n2(e) {
        if (r[e]) return r[e].exports;
        var o = r[e] = { exports: {}, id: e, loaded: false };
        return t2[e].call(o.exports, o, o.exports, n2), o.loaded = true, o.exports;
      }
      var r = {};
      return n2.m = t2, n2.c = r, n2.p = "", n2(0);
    }([function(t2, n2, r) {
      t2.exports = r(34);
    }, function(t2, n2, r) {
      var e = r(29)("wks"), o = r(33), i = r(2).Symbol, c = "function" == typeof i, u = t2.exports = function(t3) {
        return e[t3] || (e[t3] = c && i[t3] || (c ? i : o)("Symbol." + t3));
      };
      u.store = e;
    }, function(t2, n2) {
      var r = t2.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")();
      "number" == typeof __g && (__g = r);
    }, function(t2, n2, r) {
      var e = r(9);
      t2.exports = function(t3) {
        if (!e(t3)) throw TypeError(t3 + " is not an object!");
        return t3;
      };
    }, function(t2, n2, r) {
      t2.exports = !r(24)(function() {
        return 7 != Object.defineProperty({}, "a", { get: function() {
          return 7;
        } }).a;
      });
    }, function(t2, n2, r) {
      var e = r(12), o = r(17);
      t2.exports = r(4) ? function(t3, n3, r2) {
        return e.f(t3, n3, o(1, r2));
      } : function(t3, n3, r2) {
        return t3[n3] = r2, t3;
      };
    }, function(t2, n2) {
      var r = t2.exports = { version: "2.4.0" };
      "number" == typeof __e && (__e = r);
    }, function(t2, n2, r) {
      var e = r(14);
      t2.exports = function(t3, n3, r2) {
        if (e(t3), void 0 === n3) return t3;
        switch (r2) {
          case 1:
            return function(r3) {
              return t3.call(n3, r3);
            };
          case 2:
            return function(r3, e2) {
              return t3.call(n3, r3, e2);
            };
          case 3:
            return function(r3, e2, o) {
              return t3.call(n3, r3, e2, o);
            };
        }
        return function() {
          return t3.apply(n3, arguments);
        };
      };
    }, function(t2, n2) {
      var r = {}.hasOwnProperty;
      t2.exports = function(t3, n3) {
        return r.call(t3, n3);
      };
    }, function(t2, n2) {
      t2.exports = function(t3) {
        return "object" == typeof t3 ? null !== t3 : "function" == typeof t3;
      };
    }, function(t2, n2) {
      t2.exports = {};
    }, function(t2, n2) {
      var r = {}.toString;
      t2.exports = function(t3) {
        return r.call(t3).slice(8, -1);
      };
    }, function(t2, n2, r) {
      var e = r(3), o = r(26), i = r(32), c = Object.defineProperty;
      n2.f = r(4) ? Object.defineProperty : function(t3, n3, r2) {
        if (e(t3), n3 = i(n3, true), e(r2), o) try {
          return c(t3, n3, r2);
        } catch (t4) {
        }
        if ("get" in r2 || "set" in r2) throw TypeError("Accessors not supported!");
        return "value" in r2 && (t3[n3] = r2.value), t3;
      };
    }, function(t2, n2, r) {
      var e = r(42), o = r(15);
      t2.exports = function(t3) {
        return e(o(t3));
      };
    }, function(t2, n2) {
      t2.exports = function(t3) {
        if ("function" != typeof t3) throw TypeError(t3 + " is not a function!");
        return t3;
      };
    }, function(t2, n2) {
      t2.exports = function(t3) {
        if (void 0 == t3) throw TypeError("Can't call method on  " + t3);
        return t3;
      };
    }, function(t2, n2, r) {
      var e = r(9), o = r(2).document, i = e(o) && e(o.createElement);
      t2.exports = function(t3) {
        return i ? o.createElement(t3) : {};
      };
    }, function(t2, n2) {
      t2.exports = function(t3, n3) {
        return { enumerable: !(1 & t3), configurable: !(2 & t3), writable: !(4 & t3), value: n3 };
      };
    }, function(t2, n2, r) {
      var e = r(12).f, o = r(8), i = r(1)("toStringTag");
      t2.exports = function(t3, n3, r2) {
        t3 && !o(t3 = r2 ? t3 : t3.prototype, i) && e(t3, i, { configurable: true, value: n3 });
      };
    }, function(t2, n2, r) {
      var e = r(29)("keys"), o = r(33);
      t2.exports = function(t3) {
        return e[t3] || (e[t3] = o(t3));
      };
    }, function(t2, n2) {
      var r = Math.ceil, e = Math.floor;
      t2.exports = function(t3) {
        return isNaN(t3 = +t3) ? 0 : (t3 > 0 ? e : r)(t3);
      };
    }, function(t2, n2, r) {
      var e = r(11), o = r(1)("toStringTag"), i = "Arguments" == e(/* @__PURE__ */ function() {
        return arguments;
      }()), c = function(t3, n3) {
        try {
          return t3[n3];
        } catch (t4) {
        }
      };
      t2.exports = function(t3) {
        var n3, r2, u;
        return void 0 === t3 ? "Undefined" : null === t3 ? "Null" : "string" == typeof (r2 = c(n3 = Object(t3), o)) ? r2 : i ? e(n3) : "Object" == (u = e(n3)) && "function" == typeof n3.callee ? "Arguments" : u;
      };
    }, function(t2, n2) {
      t2.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",");
    }, function(t2, n2, r) {
      var e = r(2), o = r(6), i = r(7), c = r(5), u = "prototype", s = function(t3, n3, r2) {
        var f, a, p, l = t3 & s.F, v = t3 & s.G, h = t3 & s.S, d = t3 & s.P, y = t3 & s.B, _2 = t3 & s.W, x = v ? o : o[n3] || (o[n3] = {}), m = x[u], w = v ? e : h ? e[n3] : (e[n3] || {})[u];
        v && (r2 = n3);
        for (f in r2) a = !l && w && void 0 !== w[f], a && f in x || (p = a ? w[f] : r2[f], x[f] = v && "function" != typeof w[f] ? r2[f] : y && a ? i(p, e) : _2 && w[f] == p ? function(t4) {
          var n4 = function(n5, r3, e2) {
            if (this instanceof t4) {
              switch (arguments.length) {
                case 0:
                  return new t4();
                case 1:
                  return new t4(n5);
                case 2:
                  return new t4(n5, r3);
              }
              return new t4(n5, r3, e2);
            }
            return t4.apply(this, arguments);
          };
          return n4[u] = t4[u], n4;
        }(p) : d && "function" == typeof p ? i(Function.call, p) : p, d && ((x.virtual || (x.virtual = {}))[f] = p, t3 & s.R && m && !m[f] && c(m, f, p)));
      };
      s.F = 1, s.G = 2, s.S = 4, s.P = 8, s.B = 16, s.W = 32, s.U = 64, s.R = 128, t2.exports = s;
    }, function(t2, n2) {
      t2.exports = function(t3) {
        try {
          return !!t3();
        } catch (t4) {
          return true;
        }
      };
    }, function(t2, n2, r) {
      t2.exports = r(2).document && document.documentElement;
    }, function(t2, n2, r) {
      t2.exports = !r(4) && !r(24)(function() {
        return 7 != Object.defineProperty(r(16)("div"), "a", { get: function() {
          return 7;
        } }).a;
      });
    }, function(t2, n2, r) {
      var e = r(28), o = r(23), i = r(57), c = r(5), u = r(8), s = r(10), f = r(45), a = r(18), p = r(52), l = r(1)("iterator"), v = !([].keys && "next" in [].keys()), h = "@@iterator", d = "keys", y = "values", _2 = function() {
        return this;
      };
      t2.exports = function(t3, n3, r2, x, m, w, g) {
        f(r2, n3, x);
        var b, O, j, S = function(t4) {
          if (!v && t4 in T) return T[t4];
          switch (t4) {
            case d:
              return function() {
                return new r2(this, t4);
              };
            case y:
              return function() {
                return new r2(this, t4);
              };
          }
          return function() {
            return new r2(this, t4);
          };
        }, E = n3 + " Iterator", P = m == y, M = false, T = t3.prototype, A = T[l] || T[h] || m && T[m], k = A || S(m), C = m ? P ? S("entries") : k : void 0, I = "Array" == n3 ? T.entries || A : A;
        if (I && (j = p(I.call(new t3())), j !== Object.prototype && (a(j, E, true), e || u(j, l) || c(j, l, _2))), P && A && A.name !== y && (M = true, k = function() {
          return A.call(this);
        }), e && !g || !v && !M && T[l] || c(T, l, k), s[n3] = k, s[E] = _2, m) if (b = { values: P ? k : S(y), keys: w ? k : S(d), entries: C }, g) for (O in b) O in T || i(T, O, b[O]);
        else o(o.P + o.F * (v || M), n3, b);
        return b;
      };
    }, function(t2, n2) {
      t2.exports = true;
    }, function(t2, n2, r) {
      var e = r(2), o = "__core-js_shared__", i = e[o] || (e[o] = {});
      t2.exports = function(t3) {
        return i[t3] || (i[t3] = {});
      };
    }, function(t2, n2, r) {
      var e, o, i, c = r(7), u = r(41), s = r(25), f = r(16), a = r(2), p = a.process, l = a.setImmediate, v = a.clearImmediate, h = a.MessageChannel, d = 0, y = {}, _2 = "onreadystatechange", x = function() {
        var t3 = +this;
        if (y.hasOwnProperty(t3)) {
          var n3 = y[t3];
          delete y[t3], n3();
        }
      }, m = function(t3) {
        x.call(t3.data);
      };
      l && v || (l = function(t3) {
        for (var n3 = [], r2 = 1; arguments.length > r2; ) n3.push(arguments[r2++]);
        return y[++d] = function() {
          u("function" == typeof t3 ? t3 : Function(t3), n3);
        }, e(d), d;
      }, v = function(t3) {
        delete y[t3];
      }, "process" == r(11)(p) ? e = function(t3) {
        p.nextTick(c(x, t3, 1));
      } : h ? (o = new h(), i = o.port2, o.port1.onmessage = m, e = c(i.postMessage, i, 1)) : a.addEventListener && "function" == typeof postMessage && !a.importScripts ? (e = function(t3) {
        a.postMessage(t3 + "", "*");
      }, a.addEventListener("message", m, false)) : e = _2 in f("script") ? function(t3) {
        s.appendChild(f("script"))[_2] = function() {
          s.removeChild(this), x.call(t3);
        };
      } : function(t3) {
        setTimeout(c(x, t3, 1), 0);
      }), t2.exports = { set: l, clear: v };
    }, function(t2, n2, r) {
      var e = r(20), o = Math.min;
      t2.exports = function(t3) {
        return t3 > 0 ? o(e(t3), 9007199254740991) : 0;
      };
    }, function(t2, n2, r) {
      var e = r(9);
      t2.exports = function(t3, n3) {
        if (!e(t3)) return t3;
        var r2, o;
        if (n3 && "function" == typeof (r2 = t3.toString) && !e(o = r2.call(t3))) return o;
        if ("function" == typeof (r2 = t3.valueOf) && !e(o = r2.call(t3))) return o;
        if (!n3 && "function" == typeof (r2 = t3.toString) && !e(o = r2.call(t3))) return o;
        throw TypeError("Can't convert object to primitive value");
      };
    }, function(t2, n2) {
      var r = 0, e = Math.random();
      t2.exports = function(t3) {
        return "Symbol(".concat(void 0 === t3 ? "" : t3, ")_", (++r + e).toString(36));
      };
    }, function(t2, n2, r) {
      function e(t3) {
        return t3 && t3.__esModule ? t3 : { default: t3 };
      }
      function o() {
        return "win32" !== process.platform ? "" : "ia32" === process.arch && process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432") ? "mixed" : "native";
      }
      function i(t3) {
        return (0, l.createHash)("sha256").update(t3).digest("hex");
      }
      function c(t3) {
        switch (h) {
          case "darwin":
            return t3.split("IOPlatformUUID")[1].split("\n")[0].replace(/\=|\s+|\"/gi, "").toLowerCase();
          case "win32":
            return t3.toString().split("REG_SZ")[1].replace(/\r+|\n+|\s+/gi, "").toLowerCase();
          case "linux":
            return t3.toString().replace(/\r+|\n+|\s+/gi, "").toLowerCase();
          case "freebsd":
            return t3.toString().replace(/\r+|\n+|\s+/gi, "").toLowerCase();
          default:
            throw new Error("Unsupported platform: " + process.platform);
        }
      }
      function u(t3) {
        var n3 = c((0, p.execSync)(y[h]).toString());
        return t3 ? n3 : i(n3);
      }
      function s(t3) {
        return new a.default(function(n3, r2) {
          return (0, p.exec)(y[h], {}, function(e2, o2, u2) {
            if (e2) return r2(new Error("Error while obtaining machine id: " + e2.stack));
            var s2 = c(o2.toString());
            return n3(t3 ? s2 : i(s2));
          });
        });
      }
      Object.defineProperty(n2, "__esModule", { value: true });
      var f = r(35), a = e(f);
      n2.machineIdSync = u, n2.machineId = s;
      var p = r(70), l = r(71), v = process, h = v.platform, d = { native: "%windir%\\System32", mixed: "%windir%\\sysnative\\cmd.exe /c %windir%\\System32" }, y = { darwin: "ioreg -rd1 -c IOPlatformExpertDevice", win32: d[o()] + "\\REG.exe QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid", linux: "( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :", freebsd: "kenv -q smbios.system.uuid || sysctl -n kern.hostuuid" };
    }, function(t2, n2, r) {
      t2.exports = { default: r(36), __esModule: true };
    }, function(t2, n2, r) {
      r(66), r(68), r(69), r(67), t2.exports = r(6).Promise;
    }, function(t2, n2) {
      t2.exports = function() {
      };
    }, function(t2, n2) {
      t2.exports = function(t3, n3, r, e) {
        if (!(t3 instanceof n3) || void 0 !== e && e in t3) throw TypeError(r + ": incorrect invocation!");
        return t3;
      };
    }, function(t2, n2, r) {
      var e = r(13), o = r(31), i = r(62);
      t2.exports = function(t3) {
        return function(n3, r2, c) {
          var u, s = e(n3), f = o(s.length), a = i(c, f);
          if (t3 && r2 != r2) {
            for (; f > a; ) if (u = s[a++], u != u) return true;
          } else for (; f > a; a++) if ((t3 || a in s) && s[a] === r2) return t3 || a || 0;
          return !t3 && -1;
        };
      };
    }, function(t2, n2, r) {
      var e = r(7), o = r(44), i = r(43), c = r(3), u = r(31), s = r(64), f = {}, a = {}, n2 = t2.exports = function(t3, n3, r2, p, l) {
        var v, h, d, y, _2 = l ? function() {
          return t3;
        } : s(t3), x = e(r2, p, n3 ? 2 : 1), m = 0;
        if ("function" != typeof _2) throw TypeError(t3 + " is not iterable!");
        if (i(_2)) {
          for (v = u(t3.length); v > m; m++) if (y = n3 ? x(c(h = t3[m])[0], h[1]) : x(t3[m]), y === f || y === a) return y;
        } else for (d = _2.call(t3); !(h = d.next()).done; ) if (y = o(d, x, h.value, n3), y === f || y === a) return y;
      };
      n2.BREAK = f, n2.RETURN = a;
    }, function(t2, n2) {
      t2.exports = function(t3, n3, r) {
        var e = void 0 === r;
        switch (n3.length) {
          case 0:
            return e ? t3() : t3.call(r);
          case 1:
            return e ? t3(n3[0]) : t3.call(r, n3[0]);
          case 2:
            return e ? t3(n3[0], n3[1]) : t3.call(r, n3[0], n3[1]);
          case 3:
            return e ? t3(n3[0], n3[1], n3[2]) : t3.call(r, n3[0], n3[1], n3[2]);
          case 4:
            return e ? t3(n3[0], n3[1], n3[2], n3[3]) : t3.call(r, n3[0], n3[1], n3[2], n3[3]);
        }
        return t3.apply(r, n3);
      };
    }, function(t2, n2, r) {
      var e = r(11);
      t2.exports = Object("z").propertyIsEnumerable(0) ? Object : function(t3) {
        return "String" == e(t3) ? t3.split("") : Object(t3);
      };
    }, function(t2, n2, r) {
      var e = r(10), o = r(1)("iterator"), i = Array.prototype;
      t2.exports = function(t3) {
        return void 0 !== t3 && (e.Array === t3 || i[o] === t3);
      };
    }, function(t2, n2, r) {
      var e = r(3);
      t2.exports = function(t3, n3, r2, o) {
        try {
          return o ? n3(e(r2)[0], r2[1]) : n3(r2);
        } catch (n4) {
          var i = t3.return;
          throw void 0 !== i && e(i.call(t3)), n4;
        }
      };
    }, function(t2, n2, r) {
      var e = r(49), o = r(17), i = r(18), c = {};
      r(5)(c, r(1)("iterator"), function() {
        return this;
      }), t2.exports = function(t3, n3, r2) {
        t3.prototype = e(c, { next: o(1, r2) }), i(t3, n3 + " Iterator");
      };
    }, function(t2, n2, r) {
      var e = r(1)("iterator"), o = false;
      try {
        var i = [7][e]();
        i.return = function() {
          o = true;
        }, Array.from(i, function() {
          throw 2;
        });
      } catch (t3) {
      }
      t2.exports = function(t3, n3) {
        if (!n3 && !o) return false;
        var r2 = false;
        try {
          var i2 = [7], c = i2[e]();
          c.next = function() {
            return { done: r2 = true };
          }, i2[e] = function() {
            return c;
          }, t3(i2);
        } catch (t4) {
        }
        return r2;
      };
    }, function(t2, n2) {
      t2.exports = function(t3, n3) {
        return { value: n3, done: !!t3 };
      };
    }, function(t2, n2, r) {
      var e = r(2), o = r(30).set, i = e.MutationObserver || e.WebKitMutationObserver, c = e.process, u = e.Promise, s = "process" == r(11)(c);
      t2.exports = function() {
        var t3, n3, r2, f = function() {
          var e2, o2;
          for (s && (e2 = c.domain) && e2.exit(); t3; ) {
            o2 = t3.fn, t3 = t3.next;
            try {
              o2();
            } catch (e3) {
              throw t3 ? r2() : n3 = void 0, e3;
            }
          }
          n3 = void 0, e2 && e2.enter();
        };
        if (s) r2 = function() {
          c.nextTick(f);
        };
        else if (i) {
          var a = true, p = document.createTextNode("");
          new i(f).observe(p, { characterData: true }), r2 = function() {
            p.data = a = !a;
          };
        } else if (u && u.resolve) {
          var l = u.resolve();
          r2 = function() {
            l.then(f);
          };
        } else r2 = function() {
          o.call(e, f);
        };
        return function(e2) {
          var o2 = { fn: e2, next: void 0 };
          n3 && (n3.next = o2), t3 || (t3 = o2, r2()), n3 = o2;
        };
      };
    }, function(t2, n2, r) {
      var e = r(3), o = r(50), i = r(22), c = r(19)("IE_PROTO"), u = function() {
      }, s = "prototype", f = function() {
        var t3, n3 = r(16)("iframe"), e2 = i.length, o2 = ">";
        for (n3.style.display = "none", r(25).appendChild(n3), n3.src = "javascript:", t3 = n3.contentWindow.document, t3.open(), t3.write("<script>document.F=Object<\/script" + o2), t3.close(), f = t3.F; e2--; ) delete f[s][i[e2]];
        return f();
      };
      t2.exports = Object.create || function(t3, n3) {
        var r2;
        return null !== t3 ? (u[s] = e(t3), r2 = new u(), u[s] = null, r2[c] = t3) : r2 = f(), void 0 === n3 ? r2 : o(r2, n3);
      };
    }, function(t2, n2, r) {
      var e = r(12), o = r(3), i = r(54);
      t2.exports = r(4) ? Object.defineProperties : function(t3, n3) {
        o(t3);
        for (var r2, c = i(n3), u = c.length, s = 0; u > s; ) e.f(t3, r2 = c[s++], n3[r2]);
        return t3;
      };
    }, function(t2, n2, r) {
      var e = r(55), o = r(17), i = r(13), c = r(32), u = r(8), s = r(26), f = Object.getOwnPropertyDescriptor;
      n2.f = r(4) ? f : function(t3, n3) {
        if (t3 = i(t3), n3 = c(n3, true), s) try {
          return f(t3, n3);
        } catch (t4) {
        }
        if (u(t3, n3)) return o(!e.f.call(t3, n3), t3[n3]);
      };
    }, function(t2, n2, r) {
      var e = r(8), o = r(63), i = r(19)("IE_PROTO"), c = Object.prototype;
      t2.exports = Object.getPrototypeOf || function(t3) {
        return t3 = o(t3), e(t3, i) ? t3[i] : "function" == typeof t3.constructor && t3 instanceof t3.constructor ? t3.constructor.prototype : t3 instanceof Object ? c : null;
      };
    }, function(t2, n2, r) {
      var e = r(8), o = r(13), i = r(39)(false), c = r(19)("IE_PROTO");
      t2.exports = function(t3, n3) {
        var r2, u = o(t3), s = 0, f = [];
        for (r2 in u) r2 != c && e(u, r2) && f.push(r2);
        for (; n3.length > s; ) e(u, r2 = n3[s++]) && (~i(f, r2) || f.push(r2));
        return f;
      };
    }, function(t2, n2, r) {
      var e = r(53), o = r(22);
      t2.exports = Object.keys || function(t3) {
        return e(t3, o);
      };
    }, function(t2, n2) {
      n2.f = {}.propertyIsEnumerable;
    }, function(t2, n2, r) {
      var e = r(5);
      t2.exports = function(t3, n3, r2) {
        for (var o in n3) r2 && t3[o] ? t3[o] = n3[o] : e(t3, o, n3[o]);
        return t3;
      };
    }, function(t2, n2, r) {
      t2.exports = r(5);
    }, function(t2, n2, r) {
      var e = r(9), o = r(3), i = function(t3, n3) {
        if (o(t3), !e(n3) && null !== n3) throw TypeError(n3 + ": can't set as prototype!");
      };
      t2.exports = { set: Object.setPrototypeOf || ("__proto__" in {} ? function(t3, n3, e2) {
        try {
          e2 = r(7)(Function.call, r(51).f(Object.prototype, "__proto__").set, 2), e2(t3, []), n3 = !(t3 instanceof Array);
        } catch (t4) {
          n3 = true;
        }
        return function(t4, r2) {
          return i(t4, r2), n3 ? t4.__proto__ = r2 : e2(t4, r2), t4;
        };
      }({}, false) : void 0), check: i };
    }, function(t2, n2, r) {
      var e = r(2), o = r(6), i = r(12), c = r(4), u = r(1)("species");
      t2.exports = function(t3) {
        var n3 = "function" == typeof o[t3] ? o[t3] : e[t3];
        c && n3 && !n3[u] && i.f(n3, u, { configurable: true, get: function() {
          return this;
        } });
      };
    }, function(t2, n2, r) {
      var e = r(3), o = r(14), i = r(1)("species");
      t2.exports = function(t3, n3) {
        var r2, c = e(t3).constructor;
        return void 0 === c || void 0 == (r2 = e(c)[i]) ? n3 : o(r2);
      };
    }, function(t2, n2, r) {
      var e = r(20), o = r(15);
      t2.exports = function(t3) {
        return function(n3, r2) {
          var i, c, u = String(o(n3)), s = e(r2), f = u.length;
          return s < 0 || s >= f ? t3 ? "" : void 0 : (i = u.charCodeAt(s), i < 55296 || i > 56319 || s + 1 === f || (c = u.charCodeAt(s + 1)) < 56320 || c > 57343 ? t3 ? u.charAt(s) : i : t3 ? u.slice(s, s + 2) : (i - 55296 << 10) + (c - 56320) + 65536);
        };
      };
    }, function(t2, n2, r) {
      var e = r(20), o = Math.max, i = Math.min;
      t2.exports = function(t3, n3) {
        return t3 = e(t3), t3 < 0 ? o(t3 + n3, 0) : i(t3, n3);
      };
    }, function(t2, n2, r) {
      var e = r(15);
      t2.exports = function(t3) {
        return Object(e(t3));
      };
    }, function(t2, n2, r) {
      var e = r(21), o = r(1)("iterator"), i = r(10);
      t2.exports = r(6).getIteratorMethod = function(t3) {
        if (void 0 != t3) return t3[o] || t3["@@iterator"] || i[e(t3)];
      };
    }, function(t2, n2, r) {
      var e = r(37), o = r(47), i = r(10), c = r(13);
      t2.exports = r(27)(Array, "Array", function(t3, n3) {
        this._t = c(t3), this._i = 0, this._k = n3;
      }, function() {
        var t3 = this._t, n3 = this._k, r2 = this._i++;
        return !t3 || r2 >= t3.length ? (this._t = void 0, o(1)) : "keys" == n3 ? o(0, r2) : "values" == n3 ? o(0, t3[r2]) : o(0, [r2, t3[r2]]);
      }, "values"), i.Arguments = i.Array, e("keys"), e("values"), e("entries");
    }, function(t2, n2) {
    }, function(t2, n2, r) {
      var e, o, i, c = r(28), u = r(2), s = r(7), f = r(21), a = r(23), p = r(9), l = (r(3), r(14)), v = r(38), h = r(40), d = (r(58).set, r(60)), y = r(30).set, _2 = r(48)(), x = "Promise", m = u.TypeError, w = u.process, g = u[x], w = u.process, b = "process" == f(w), O = function() {
      }, j = !!function() {
        try {
          var t3 = g.resolve(1), n3 = (t3.constructor = {})[r(1)("species")] = function(t4) {
            t4(O, O);
          };
          return (b || "function" == typeof PromiseRejectionEvent) && t3.then(O) instanceof n3;
        } catch (t4) {
        }
      }(), S = function(t3, n3) {
        return t3 === n3 || t3 === g && n3 === i;
      }, E = function(t3) {
        var n3;
        return !(!p(t3) || "function" != typeof (n3 = t3.then)) && n3;
      }, P = function(t3) {
        return S(g, t3) ? new M(t3) : new o(t3);
      }, M = o = function(t3) {
        var n3, r2;
        this.promise = new t3(function(t4, e2) {
          if (void 0 !== n3 || void 0 !== r2) throw m("Bad Promise constructor");
          n3 = t4, r2 = e2;
        }), this.resolve = l(n3), this.reject = l(r2);
      }, T = function(t3) {
        try {
          t3();
        } catch (t4) {
          return { error: t4 };
        }
      }, A = function(t3, n3) {
        if (!t3._n) {
          t3._n = true;
          var r2 = t3._c;
          _2(function() {
            for (var e2 = t3._v, o2 = 1 == t3._s, i2 = 0, c2 = function(n4) {
              var r3, i3, c3 = o2 ? n4.ok : n4.fail, u2 = n4.resolve, s2 = n4.reject, f2 = n4.domain;
              try {
                c3 ? (o2 || (2 == t3._h && I(t3), t3._h = 1), c3 === true ? r3 = e2 : (f2 && f2.enter(), r3 = c3(e2), f2 && f2.exit()), r3 === n4.promise ? s2(m("Promise-chain cycle")) : (i3 = E(r3)) ? i3.call(r3, u2, s2) : u2(r3)) : s2(e2);
              } catch (t4) {
                s2(t4);
              }
            }; r2.length > i2; ) c2(r2[i2++]);
            t3._c = [], t3._n = false, n3 && !t3._h && k(t3);
          });
        }
      }, k = function(t3) {
        y.call(u, function() {
          var n3, r2, e2, o2 = t3._v;
          if (C(t3) && (n3 = T(function() {
            b ? w.emit("unhandledRejection", o2, t3) : (r2 = u.onunhandledrejection) ? r2({ promise: t3, reason: o2 }) : (e2 = u.console) && e2.error && e2.error("Unhandled promise rejection", o2);
          }), t3._h = b || C(t3) ? 2 : 1), t3._a = void 0, n3) throw n3.error;
        });
      }, C = function(t3) {
        if (1 == t3._h) return false;
        for (var n3, r2 = t3._a || t3._c, e2 = 0; r2.length > e2; ) if (n3 = r2[e2++], n3.fail || !C(n3.promise)) return false;
        return true;
      }, I = function(t3) {
        y.call(u, function() {
          var n3;
          b ? w.emit("rejectionHandled", t3) : (n3 = u.onrejectionhandled) && n3({ promise: t3, reason: t3._v });
        });
      }, R = function(t3) {
        var n3 = this;
        n3._d || (n3._d = true, n3 = n3._w || n3, n3._v = t3, n3._s = 2, n3._a || (n3._a = n3._c.slice()), A(n3, true));
      }, F = function(t3) {
        var n3, r2 = this;
        if (!r2._d) {
          r2._d = true, r2 = r2._w || r2;
          try {
            if (r2 === t3) throw m("Promise can't be resolved itself");
            (n3 = E(t3)) ? _2(function() {
              var e2 = { _w: r2, _d: false };
              try {
                n3.call(t3, s(F, e2, 1), s(R, e2, 1));
              } catch (t4) {
                R.call(e2, t4);
              }
            }) : (r2._v = t3, r2._s = 1, A(r2, false));
          } catch (t4) {
            R.call({ _w: r2, _d: false }, t4);
          }
        }
      };
      j || (g = function(t3) {
        v(this, g, x, "_h"), l(t3), e.call(this);
        try {
          t3(s(F, this, 1), s(R, this, 1));
        } catch (t4) {
          R.call(this, t4);
        }
      }, e = function(t3) {
        this._c = [], this._a = void 0, this._s = 0, this._d = false, this._v = void 0, this._h = 0, this._n = false;
      }, e.prototype = r(56)(g.prototype, { then: function(t3, n3) {
        var r2 = P(d(this, g));
        return r2.ok = "function" != typeof t3 || t3, r2.fail = "function" == typeof n3 && n3, r2.domain = b ? w.domain : void 0, this._c.push(r2), this._a && this._a.push(r2), this._s && A(this, false), r2.promise;
      }, catch: function(t3) {
        return this.then(void 0, t3);
      } }), M = function() {
        var t3 = new e();
        this.promise = t3, this.resolve = s(F, t3, 1), this.reject = s(R, t3, 1);
      }), a(a.G + a.W + a.F * !j, { Promise: g }), r(18)(g, x), r(59)(x), i = r(6)[x], a(a.S + a.F * !j, x, { reject: function(t3) {
        var n3 = P(this), r2 = n3.reject;
        return r2(t3), n3.promise;
      } }), a(a.S + a.F * (c || !j), x, { resolve: function(t3) {
        if (t3 instanceof g && S(t3.constructor, this)) return t3;
        var n3 = P(this), r2 = n3.resolve;
        return r2(t3), n3.promise;
      } }), a(a.S + a.F * !(j && r(46)(function(t3) {
        g.all(t3).catch(O);
      })), x, { all: function(t3) {
        var n3 = this, r2 = P(n3), e2 = r2.resolve, o2 = r2.reject, i2 = T(function() {
          var r3 = [], i3 = 0, c2 = 1;
          h(t3, false, function(t4) {
            var u2 = i3++, s2 = false;
            r3.push(void 0), c2++, n3.resolve(t4).then(function(t5) {
              s2 || (s2 = true, r3[u2] = t5, --c2 || e2(r3));
            }, o2);
          }), --c2 || e2(r3);
        });
        return i2 && o2(i2.error), r2.promise;
      }, race: function(t3) {
        var n3 = this, r2 = P(n3), e2 = r2.reject, o2 = T(function() {
          h(t3, false, function(t4) {
            n3.resolve(t4).then(r2.resolve, e2);
          });
        });
        return o2 && e2(o2.error), r2.promise;
      } });
    }, function(t2, n2, r) {
      var e = r(61)(true);
      r(27)(String, "String", function(t3) {
        this._t = String(t3), this._i = 0;
      }, function() {
        var t3, n3 = this._t, r2 = this._i;
        return r2 >= n3.length ? { value: void 0, done: true } : (t3 = e(n3, r2), this._i += t3.length, { value: t3, done: false });
      });
    }, function(t2, n2, r) {
      r(65);
      for (var e = r(2), o = r(5), i = r(10), c = r(1)("toStringTag"), u = ["NodeList", "DOMTokenList", "MediaList", "StyleSheetList", "CSSRuleList"], s = 0; s < 5; s++) {
        var f = u[s], a = e[f], p = a && a.prototype;
        p && !p[c] && o(p, c, f), i[f] = i.Array;
      }
    }, function(t2, n2) {
      t2.exports = require$$0$1;
    }, function(t2, n2) {
      t2.exports = require$$1;
    }]);
  });
})(dist);
var map;
try {
  map = Map;
} catch (_2) {
}
var set;
try {
  set = Set;
} catch (_2) {
}
function baseClone(src, circulars, clones) {
  if (!src || typeof src !== "object" || typeof src === "function") {
    return src;
  }
  if (src.nodeType && "cloneNode" in src) {
    return src.cloneNode(true);
  }
  if (src instanceof Date) {
    return new Date(src.getTime());
  }
  if (src instanceof RegExp) {
    return new RegExp(src);
  }
  if (Array.isArray(src)) {
    return src.map(clone$1);
  }
  if (map && src instanceof map) {
    return new Map(Array.from(src.entries()));
  }
  if (set && src instanceof set) {
    return new Set(Array.from(src.values()));
  }
  if (src instanceof Object) {
    circulars.push(src);
    var obj = Object.create(src);
    clones.push(obj);
    for (var key in src) {
      var idx = circulars.findIndex(function(i) {
        return i === src[key];
      });
      obj[key] = idx > -1 ? clones[idx] : baseClone(src[key], circulars, clones);
    }
    return obj;
  }
  return src;
}
function clone$1(src) {
  return baseClone(src, [], []);
}
const toString$8 = Object.prototype.toString;
const errorToString$1 = Error.prototype.toString;
const regExpToString$1 = RegExp.prototype.toString;
const symbolToString$3 = typeof Symbol !== "undefined" ? Symbol.prototype.toString : () => "";
const SYMBOL_REGEXP$1 = /^Symbol\((.*)\)(.*)$/;
function printNumber$1(val) {
  if (val != +val) return "NaN";
  const isNegativeZero = val === 0 && 1 / val < 0;
  return isNegativeZero ? "-0" : "" + val;
}
function printSimpleValue$1(val, quoteStrings = false) {
  if (val == null || val === true || val === false) return "" + val;
  const typeOf = typeof val;
  if (typeOf === "number") return printNumber$1(val);
  if (typeOf === "string") return quoteStrings ? `"${val}"` : val;
  if (typeOf === "function") return "[Function " + (val.name || "anonymous") + "]";
  if (typeOf === "symbol") return symbolToString$3.call(val).replace(SYMBOL_REGEXP$1, "Symbol($1)");
  const tag = toString$8.call(val).slice(8, -1);
  if (tag === "Date") return isNaN(val.getTime()) ? "" + val : val.toISOString(val);
  if (tag === "Error" || val instanceof Error) return "[" + errorToString$1.call(val) + "]";
  if (tag === "RegExp") return regExpToString$1.call(val);
  return null;
}
function printValue$1(value, quoteStrings) {
  let result = printSimpleValue$1(value, quoteStrings);
  if (result !== null) return result;
  return JSON.stringify(value, function(key, value2) {
    let result2 = printSimpleValue$1(this[key], quoteStrings);
    if (result2 !== null) return result2;
    return value2;
  }, 2);
}
let mixed = {
  default: "${path} is invalid",
  required: "${path} is a required field",
  oneOf: "${path} must be one of the following values: ${values}",
  notOneOf: "${path} must not be one of the following values: ${values}",
  notType: ({
    path: path2,
    type,
    value,
    originalValue
  }) => {
    let isCast = originalValue != null && originalValue !== value;
    let msg = `${path2} must be a \`${type}\` type, but the final value was: \`${printValue$1(value, true)}\`` + (isCast ? ` (cast from the value \`${printValue$1(originalValue, true)}\`).` : ".");
    if (value === null) {
      msg += `
 If "null" is intended as an empty value be sure to mark the schema as \`.nullable()\``;
    }
    return msg;
  },
  defined: "${path} must be defined"
};
let string$2 = {
  length: "${path} must be exactly ${length} characters",
  min: "${path} must be at least ${min} characters",
  max: "${path} must be at most ${max} characters",
  matches: '${path} must match the following: "${regex}"',
  email: "${path} must be a valid email",
  url: "${path} must be a valid URL",
  uuid: "${path} must be a valid UUID",
  trim: "${path} must be a trimmed string",
  lowercase: "${path} must be a lowercase string",
  uppercase: "${path} must be a upper case string"
};
let number$2 = {
  min: "${path} must be greater than or equal to ${min}",
  max: "${path} must be less than or equal to ${max}",
  lessThan: "${path} must be less than ${less}",
  moreThan: "${path} must be greater than ${more}",
  positive: "${path} must be a positive number",
  negative: "${path} must be a negative number",
  integer: "${path} must be an integer"
};
let date$2 = {
  min: "${path} field must be later than ${min}",
  max: "${path} field must be at earlier than ${max}"
};
let boolean$2 = {
  isValue: "${path} field must be ${value}"
};
let object$1 = {
  noUnknown: "${path} field has unspecified keys: ${unknown}"
};
let array$1 = {
  min: "${path} field must have at least ${min} items",
  max: "${path} field must have less than or equal to ${max} items",
  length: "${path} must be have ${length} items"
};
const locale = Object.assign(/* @__PURE__ */ Object.create(null), {
  mixed,
  string: string$2,
  number: number$2,
  date: date$2,
  object: object$1,
  array: array$1,
  boolean: boolean$2
});
var objectProto$d = Object.prototype;
var hasOwnProperty$9 = objectProto$d.hasOwnProperty;
function baseHas$1(object2, key) {
  return object2 != null && hasOwnProperty$9.call(object2, key);
}
var _baseHas = baseHas$1;
var isArray$8 = Array.isArray;
var isArray_1 = isArray$8;
var freeGlobal$2 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
var _freeGlobal = freeGlobal$2;
var freeGlobal$1 = _freeGlobal;
var freeSelf$1 = typeof self == "object" && self && self.Object === Object && self;
var root$9 = freeGlobal$1 || freeSelf$1 || Function("return this")();
var _root = root$9;
var root$8 = _root;
var Symbol$6 = root$8.Symbol;
var _Symbol = Symbol$6;
var Symbol$5 = _Symbol;
var objectProto$c = Object.prototype;
var hasOwnProperty$8 = objectProto$c.hasOwnProperty;
var nativeObjectToString$1 = objectProto$c.toString;
var symToStringTag$1 = Symbol$5 ? Symbol$5.toStringTag : void 0;
function getRawTag$1(value) {
  var isOwn = hasOwnProperty$8.call(value, symToStringTag$1), tag = value[symToStringTag$1];
  try {
    value[symToStringTag$1] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}
var _getRawTag = getRawTag$1;
var objectProto$b = Object.prototype;
var nativeObjectToString = objectProto$b.toString;
function objectToString$2(value) {
  return nativeObjectToString.call(value);
}
var _objectToString = objectToString$2;
var Symbol$4 = _Symbol, getRawTag = _getRawTag, objectToString$1 = _objectToString;
var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
var symToStringTag = Symbol$4 ? Symbol$4.toStringTag : void 0;
function baseGetTag$5(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString$1(value);
}
var _baseGetTag = baseGetTag$5;
function isObjectLike$6(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_1 = isObjectLike$6;
var baseGetTag$4 = _baseGetTag, isObjectLike$5 = isObjectLike_1;
var symbolTag$2 = "[object Symbol]";
function isSymbol$4(value) {
  return typeof value == "symbol" || isObjectLike$5(value) && baseGetTag$4(value) == symbolTag$2;
}
var isSymbol_1 = isSymbol$4;
var isArray$7 = isArray_1, isSymbol$3 = isSymbol_1;
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
function isKey$3(value, object2) {
  if (isArray$7(value)) {
    return false;
  }
  var type = typeof value;
  if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol$3(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object2 != null && value in Object(object2);
}
var _isKey = isKey$3;
function isObject$5(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var isObject_1 = isObject$5;
var baseGetTag$3 = _baseGetTag, isObject$4 = isObject_1;
var asyncTag = "[object AsyncFunction]", funcTag$1 = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
function isFunction$2(value) {
  if (!isObject$4(value)) {
    return false;
  }
  var tag = baseGetTag$3(value);
  return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
}
var isFunction_1 = isFunction$2;
var root$7 = _root;
var coreJsData$1 = root$7["__core-js_shared__"];
var _coreJsData = coreJsData$1;
var coreJsData = _coreJsData;
var maskSrcKey = function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
}();
function isMasked$1(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var _isMasked = isMasked$1;
var funcProto$1 = Function.prototype;
var funcToString$1 = funcProto$1.toString;
function toSource$2(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var _toSource = toSource$2;
var isFunction$1 = isFunction_1, isMasked = _isMasked, isObject$3 = isObject_1, toSource$1 = _toSource;
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto = Function.prototype, objectProto$a = Object.prototype;
var funcToString = funcProto.toString;
var hasOwnProperty$7 = objectProto$a.hasOwnProperty;
var reIsNative = RegExp(
  "^" + funcToString.call(hasOwnProperty$7).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative$1(value) {
  if (!isObject$3(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction$1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource$1(value));
}
var _baseIsNative = baseIsNative$1;
function getValue$1(object2, key) {
  return object2 == null ? void 0 : object2[key];
}
var _getValue = getValue$1;
var baseIsNative = _baseIsNative, getValue = _getValue;
function getNative$7(object2, key) {
  var value = getValue(object2, key);
  return baseIsNative(value) ? value : void 0;
}
var _getNative = getNative$7;
var getNative$6 = _getNative;
var nativeCreate$4 = getNative$6(Object, "create");
var _nativeCreate = nativeCreate$4;
var nativeCreate$3 = _nativeCreate;
function hashClear$1() {
  this.__data__ = nativeCreate$3 ? nativeCreate$3(null) : {};
  this.size = 0;
}
var _hashClear = hashClear$1;
function hashDelete$1(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var _hashDelete = hashDelete$1;
var nativeCreate$2 = _nativeCreate;
var HASH_UNDEFINED$2 = "__lodash_hash_undefined__";
var objectProto$9 = Object.prototype;
var hasOwnProperty$6 = objectProto$9.hasOwnProperty;
function hashGet$1(key) {
  var data = this.__data__;
  if (nativeCreate$2) {
    var result = data[key];
    return result === HASH_UNDEFINED$2 ? void 0 : result;
  }
  return hasOwnProperty$6.call(data, key) ? data[key] : void 0;
}
var _hashGet = hashGet$1;
var nativeCreate$1 = _nativeCreate;
var objectProto$8 = Object.prototype;
var hasOwnProperty$5 = objectProto$8.hasOwnProperty;
function hashHas$1(key) {
  var data = this.__data__;
  return nativeCreate$1 ? data[key] !== void 0 : hasOwnProperty$5.call(data, key);
}
var _hashHas = hashHas$1;
var nativeCreate = _nativeCreate;
var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
function hashSet$1(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED$1 : value;
  return this;
}
var _hashSet = hashSet$1;
var hashClear = _hashClear, hashDelete = _hashDelete, hashGet = _hashGet, hashHas = _hashHas, hashSet = _hashSet;
function Hash$1(entries) {
  var index2 = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
Hash$1.prototype.clear = hashClear;
Hash$1.prototype["delete"] = hashDelete;
Hash$1.prototype.get = hashGet;
Hash$1.prototype.has = hashHas;
Hash$1.prototype.set = hashSet;
var _Hash = Hash$1;
function listCacheClear$1() {
  this.__data__ = [];
  this.size = 0;
}
var _listCacheClear = listCacheClear$1;
function eq$2(value, other) {
  return value === other || value !== value && other !== other;
}
var eq_1 = eq$2;
var eq$1 = eq_1;
function assocIndexOf$4(array2, key) {
  var length = array2.length;
  while (length--) {
    if (eq$1(array2[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var _assocIndexOf = assocIndexOf$4;
var assocIndexOf$3 = _assocIndexOf;
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete$1(key) {
  var data = this.__data__, index2 = assocIndexOf$3(data, key);
  if (index2 < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index2 == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index2, 1);
  }
  --this.size;
  return true;
}
var _listCacheDelete = listCacheDelete$1;
var assocIndexOf$2 = _assocIndexOf;
function listCacheGet$1(key) {
  var data = this.__data__, index2 = assocIndexOf$2(data, key);
  return index2 < 0 ? void 0 : data[index2][1];
}
var _listCacheGet = listCacheGet$1;
var assocIndexOf$1 = _assocIndexOf;
function listCacheHas$1(key) {
  return assocIndexOf$1(this.__data__, key) > -1;
}
var _listCacheHas = listCacheHas$1;
var assocIndexOf = _assocIndexOf;
function listCacheSet$1(key, value) {
  var data = this.__data__, index2 = assocIndexOf(data, key);
  if (index2 < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index2][1] = value;
  }
  return this;
}
var _listCacheSet = listCacheSet$1;
var listCacheClear = _listCacheClear, listCacheDelete = _listCacheDelete, listCacheGet = _listCacheGet, listCacheHas = _listCacheHas, listCacheSet = _listCacheSet;
function ListCache$4(entries) {
  var index2 = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
ListCache$4.prototype.clear = listCacheClear;
ListCache$4.prototype["delete"] = listCacheDelete;
ListCache$4.prototype.get = listCacheGet;
ListCache$4.prototype.has = listCacheHas;
ListCache$4.prototype.set = listCacheSet;
var _ListCache = ListCache$4;
var getNative$5 = _getNative, root$6 = _root;
var Map$4 = getNative$5(root$6, "Map");
var _Map = Map$4;
var Hash = _Hash, ListCache$3 = _ListCache, Map$3 = _Map;
function mapCacheClear$1() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash(),
    "map": new (Map$3 || ListCache$3)(),
    "string": new Hash()
  };
}
var _mapCacheClear = mapCacheClear$1;
function isKeyable$1(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
var _isKeyable = isKeyable$1;
var isKeyable = _isKeyable;
function getMapData$4(map2, key) {
  var data = map2.__data__;
  return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
var _getMapData = getMapData$4;
var getMapData$3 = _getMapData;
function mapCacheDelete$1(key) {
  var result = getMapData$3(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
var _mapCacheDelete = mapCacheDelete$1;
var getMapData$2 = _getMapData;
function mapCacheGet$1(key) {
  return getMapData$2(this, key).get(key);
}
var _mapCacheGet = mapCacheGet$1;
var getMapData$1 = _getMapData;
function mapCacheHas$1(key) {
  return getMapData$1(this, key).has(key);
}
var _mapCacheHas = mapCacheHas$1;
var getMapData = _getMapData;
function mapCacheSet$1(key, value) {
  var data = getMapData(this, key), size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
var _mapCacheSet = mapCacheSet$1;
var mapCacheClear = _mapCacheClear, mapCacheDelete = _mapCacheDelete, mapCacheGet = _mapCacheGet, mapCacheHas = _mapCacheHas, mapCacheSet = _mapCacheSet;
function MapCache$3(entries) {
  var index2 = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
MapCache$3.prototype.clear = mapCacheClear;
MapCache$3.prototype["delete"] = mapCacheDelete;
MapCache$3.prototype.get = mapCacheGet;
MapCache$3.prototype.has = mapCacheHas;
MapCache$3.prototype.set = mapCacheSet;
var _MapCache = MapCache$3;
var MapCache$2 = _MapCache;
var FUNC_ERROR_TEXT = "Expected a function";
function memoize$1(func, resolver) {
  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize$1.Cache || MapCache$2)();
  return memoized;
}
memoize$1.Cache = MapCache$2;
var memoize_1 = memoize$1;
var memoize = memoize_1;
var MAX_MEMOIZE_SIZE = 500;
function memoizeCapped$1(func) {
  var result = memoize(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });
  var cache = result.cache;
  return result;
}
var _memoizeCapped = memoizeCapped$1;
var memoizeCapped = _memoizeCapped;
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var reEscapeChar = /\\(\\)?/g;
var stringToPath$1 = memoizeCapped(function(string2) {
  var result = [];
  if (string2.charCodeAt(0) === 46) {
    result.push("");
  }
  string2.replace(rePropName, function(match, number2, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, "$1") : number2 || match);
  });
  return result;
});
var _stringToPath = stringToPath$1;
function arrayMap$1(array2, iteratee) {
  var index2 = -1, length = array2 == null ? 0 : array2.length, result = Array(length);
  while (++index2 < length) {
    result[index2] = iteratee(array2[index2], index2, array2);
  }
  return result;
}
var _arrayMap = arrayMap$1;
var Symbol$3 = _Symbol, arrayMap = _arrayMap, isArray$6 = isArray_1, isSymbol$2 = isSymbol_1;
var symbolProto$2 = Symbol$3 ? Symbol$3.prototype : void 0, symbolToString$2 = symbolProto$2 ? symbolProto$2.toString : void 0;
function baseToString$2(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray$6(value)) {
    return arrayMap(value, baseToString$2) + "";
  }
  if (isSymbol$2(value)) {
    return symbolToString$2 ? symbolToString$2.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
}
var _baseToString = baseToString$2;
var baseToString$1 = _baseToString;
function toString$7(value) {
  return value == null ? "" : baseToString$1(value);
}
var toString_1 = toString$7;
var isArray$5 = isArray_1, isKey$2 = _isKey, stringToPath = _stringToPath, toString$6 = toString_1;
function castPath$2(value, object2) {
  if (isArray$5(value)) {
    return value;
  }
  return isKey$2(value, object2) ? [value] : stringToPath(toString$6(value));
}
var _castPath = castPath$2;
var baseGetTag$2 = _baseGetTag, isObjectLike$4 = isObjectLike_1;
var argsTag$2 = "[object Arguments]";
function baseIsArguments$1(value) {
  return isObjectLike$4(value) && baseGetTag$2(value) == argsTag$2;
}
var _baseIsArguments = baseIsArguments$1;
var baseIsArguments = _baseIsArguments, isObjectLike$3 = isObjectLike_1;
var objectProto$7 = Object.prototype;
var hasOwnProperty$4 = objectProto$7.hasOwnProperty;
var propertyIsEnumerable$1 = objectProto$7.propertyIsEnumerable;
var isArguments$2 = baseIsArguments(/* @__PURE__ */ function() {
  return arguments;
}()) ? baseIsArguments : function(value) {
  return isObjectLike$3(value) && hasOwnProperty$4.call(value, "callee") && !propertyIsEnumerable$1.call(value, "callee");
};
var isArguments_1 = isArguments$2;
var MAX_SAFE_INTEGER$1 = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex$2(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
var _isIndex = isIndex$2;
var MAX_SAFE_INTEGER = 9007199254740991;
function isLength$3(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}
var isLength_1 = isLength$3;
var isSymbol$1 = isSymbol_1;
function toKey$4(value) {
  if (typeof value == "string" || isSymbol$1(value)) {
    return value;
  }
  var result = value + "";
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
}
var _toKey = toKey$4;
var castPath$1 = _castPath, isArguments$1 = isArguments_1, isArray$4 = isArray_1, isIndex$1 = _isIndex, isLength$2 = isLength_1, toKey$3 = _toKey;
function hasPath$2(object2, path2, hasFunc) {
  path2 = castPath$1(path2, object2);
  var index2 = -1, length = path2.length, result = false;
  while (++index2 < length) {
    var key = toKey$3(path2[index2]);
    if (!(result = object2 != null && hasFunc(object2, key))) {
      break;
    }
    object2 = object2[key];
  }
  if (result || ++index2 != length) {
    return result;
  }
  length = object2 == null ? 0 : object2.length;
  return !!length && isLength$2(length) && isIndex$1(key, length) && (isArray$4(object2) || isArguments$1(object2));
}
var _hasPath = hasPath$2;
var baseHas = _baseHas, hasPath$1 = _hasPath;
function has(object2, path2) {
  return object2 != null && hasPath$1(object2, path2, baseHas);
}
var has_1 = has;
const has$1 = /* @__PURE__ */ getDefaultExportFromCjs(has_1);
const isSchema = (obj) => obj && obj.__isYupSchema__;
class Condition {
  constructor(refs, options2) {
    this.refs = refs;
    this.refs = refs;
    if (typeof options2 === "function") {
      this.fn = options2;
      return;
    }
    if (!has$1(options2, "is")) throw new TypeError("`is:` is required for `when()` conditions");
    if (!options2.then && !options2.otherwise) throw new TypeError("either `then:` or `otherwise:` is required for `when()` conditions");
    let {
      is,
      then,
      otherwise
    } = options2;
    let check = typeof is === "function" ? is : (...values) => values.every((value) => value === is);
    this.fn = function(...args) {
      let options3 = args.pop();
      let schema2 = args.pop();
      let branch = check(...args) ? then : otherwise;
      if (!branch) return void 0;
      if (typeof branch === "function") return branch(schema2);
      return schema2.concat(branch.resolve(options3));
    };
  }
  resolve(base, options2) {
    let values = this.refs.map((ref) => ref.getValue(options2 == null ? void 0 : options2.value, options2 == null ? void 0 : options2.parent, options2 == null ? void 0 : options2.context));
    let schema2 = this.fn.apply(base, values.concat(base, options2));
    if (schema2 === void 0 || schema2 === base) return base;
    if (!isSchema(schema2)) throw new TypeError("conditions must return a schema object");
    return schema2.resolve(options2);
  }
}
function toArray(value) {
  return value == null ? [] : [].concat(value);
}
function _extends$4() {
  _extends$4 = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source2 = arguments[i];
      for (var key in source2) {
        if (Object.prototype.hasOwnProperty.call(source2, key)) {
          target[key] = source2[key];
        }
      }
    }
    return target;
  };
  return _extends$4.apply(this, arguments);
}
let strReg = /\$\{\s*(\w+)\s*\}/g;
let ValidationError$1 = class ValidationError extends Error {
  static formatError(message, params) {
    const path2 = params.label || params.path || "this";
    if (path2 !== params.path) params = _extends$4({}, params, {
      path: path2
    });
    if (typeof message === "string") return message.replace(strReg, (_2, key) => printValue$1(params[key]));
    if (typeof message === "function") return message(params);
    return message;
  }
  static isError(err) {
    return err && err.name === "ValidationError";
  }
  constructor(errorOrErrors, value, field, type) {
    super();
    this.name = "ValidationError";
    this.value = value;
    this.path = field;
    this.type = type;
    this.errors = [];
    this.inner = [];
    toArray(errorOrErrors).forEach((err) => {
      if (ValidationError.isError(err)) {
        this.errors.push(...err.errors);
        this.inner = this.inner.concat(err.inner.length ? err.inner : err);
      } else {
        this.errors.push(err);
      }
    });
    this.message = this.errors.length > 1 ? `${this.errors.length} errors occurred` : this.errors[0];
    if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
  }
};
const once = (cb) => {
  let fired = false;
  return (...args) => {
    if (fired) return;
    fired = true;
    cb(...args);
  };
};
function runTests(options2, cb) {
  let {
    endEarly,
    tests,
    args,
    value,
    errors,
    sort: sort2,
    path: path2
  } = options2;
  let callback = once(cb);
  let count = tests.length;
  const nestedErrors = [];
  errors = errors ? errors : [];
  if (!count) return errors.length ? callback(new ValidationError$1(errors, value, path2)) : callback(null, value);
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    test(args, function finishTestRun(err) {
      if (err) {
        if (!ValidationError$1.isError(err)) {
          return callback(err, value);
        }
        if (endEarly) {
          err.value = value;
          return callback(err, value);
        }
        nestedErrors.push(err);
      }
      if (--count <= 0) {
        if (nestedErrors.length) {
          if (sort2) nestedErrors.sort(sort2);
          if (errors.length) nestedErrors.push(...errors);
          errors = nestedErrors;
        }
        if (errors.length) {
          callback(new ValidationError$1(errors, value, path2), value);
          return;
        }
        callback(null, value);
      }
    });
  }
}
var getNative$4 = _getNative;
var defineProperty$1 = function() {
  try {
    var func = getNative$4(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
}();
var _defineProperty = defineProperty$1;
var defineProperty = _defineProperty;
function baseAssignValue$2(object2, key, value) {
  if (key == "__proto__" && defineProperty) {
    defineProperty(object2, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object2[key] = value;
  }
}
var _baseAssignValue = baseAssignValue$2;
function createBaseFor$1(fromRight) {
  return function(object2, iteratee, keysFunc) {
    var index2 = -1, iterable = Object(object2), props = keysFunc(object2), length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index2];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object2;
  };
}
var _createBaseFor = createBaseFor$1;
var createBaseFor = _createBaseFor;
var baseFor$1 = createBaseFor();
var _baseFor = baseFor$1;
function baseTimes$1(n, iteratee) {
  var index2 = -1, result = Array(n);
  while (++index2 < n) {
    result[index2] = iteratee(index2);
  }
  return result;
}
var _baseTimes = baseTimes$1;
var isBuffer$2 = { exports: {} };
function stubFalse() {
  return false;
}
var stubFalse_1 = stubFalse;
isBuffer$2.exports;
(function(module, exports) {
  var root2 = _root, stubFalse2 = stubFalse_1;
  var freeExports = exports && !exports.nodeType && exports;
  var freeModule = freeExports && true && module && !module.nodeType && module;
  var moduleExports = freeModule && freeModule.exports === freeExports;
  var Buffer2 = moduleExports ? root2.Buffer : void 0;
  var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
  var isBuffer2 = nativeIsBuffer || stubFalse2;
  module.exports = isBuffer2;
})(isBuffer$2, isBuffer$2.exports);
var isBufferExports = isBuffer$2.exports;
var baseGetTag$1 = _baseGetTag, isLength$1 = isLength_1, isObjectLike$2 = isObjectLike_1;
var argsTag$1 = "[object Arguments]", arrayTag$1 = "[object Array]", boolTag$1 = "[object Boolean]", dateTag$1 = "[object Date]", errorTag$1 = "[object Error]", funcTag = "[object Function]", mapTag$2 = "[object Map]", numberTag$1 = "[object Number]", objectTag$2 = "[object Object]", regexpTag$1 = "[object RegExp]", setTag$2 = "[object Set]", stringTag$1 = "[object String]", weakMapTag$1 = "[object WeakMap]";
var arrayBufferTag$1 = "[object ArrayBuffer]", dataViewTag$2 = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag$1] = typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] = typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] = typedArrayTags[errorTag$1] = typedArrayTags[funcTag] = typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] = typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$1] = typedArrayTags[setTag$2] = typedArrayTags[stringTag$1] = typedArrayTags[weakMapTag$1] = false;
function baseIsTypedArray$1(value) {
  return isObjectLike$2(value) && isLength$1(value.length) && !!typedArrayTags[baseGetTag$1(value)];
}
var _baseIsTypedArray = baseIsTypedArray$1;
function baseUnary$1(func) {
  return function(value) {
    return func(value);
  };
}
var _baseUnary = baseUnary$1;
var _nodeUtil = { exports: {} };
_nodeUtil.exports;
(function(module, exports) {
  var freeGlobal2 = _freeGlobal;
  var freeExports = exports && !exports.nodeType && exports;
  var freeModule = freeExports && true && module && !module.nodeType && module;
  var moduleExports = freeModule && freeModule.exports === freeExports;
  var freeProcess = moduleExports && freeGlobal2.process;
  var nodeUtil2 = function() {
    try {
      var types = freeModule && freeModule.require && freeModule.require("util").types;
      if (types) {
        return types;
      }
      return freeProcess && freeProcess.binding && freeProcess.binding("util");
    } catch (e) {
    }
  }();
  module.exports = nodeUtil2;
})(_nodeUtil, _nodeUtil.exports);
var _nodeUtilExports = _nodeUtil.exports;
var baseIsTypedArray = _baseIsTypedArray, baseUnary = _baseUnary, nodeUtil = _nodeUtilExports;
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
var isTypedArray$2 = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
var isTypedArray_1 = isTypedArray$2;
var baseTimes = _baseTimes, isArguments = isArguments_1, isArray$3 = isArray_1, isBuffer$1 = isBufferExports, isIndex = _isIndex, isTypedArray$1 = isTypedArray_1;
var objectProto$6 = Object.prototype;
var hasOwnProperty$3 = objectProto$6.hasOwnProperty;
function arrayLikeKeys$1(value, inherited) {
  var isArr = isArray$3(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer$1(value), isType = !isArr && !isArg && !isBuff && isTypedArray$1(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty$3.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
var _arrayLikeKeys = arrayLikeKeys$1;
var objectProto$5 = Object.prototype;
function isPrototype$1(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto$5;
  return value === proto;
}
var _isPrototype = isPrototype$1;
function overArg$1(func, transform2) {
  return function(arg) {
    return func(transform2(arg));
  };
}
var _overArg = overArg$1;
var overArg = _overArg;
var nativeKeys$1 = overArg(Object.keys, Object);
var _nativeKeys = nativeKeys$1;
var isPrototype = _isPrototype, nativeKeys = _nativeKeys;
var objectProto$4 = Object.prototype;
var hasOwnProperty$2 = objectProto$4.hasOwnProperty;
function baseKeys$1(object2) {
  if (!isPrototype(object2)) {
    return nativeKeys(object2);
  }
  var result = [];
  for (var key in Object(object2)) {
    if (hasOwnProperty$2.call(object2, key) && key != "constructor") {
      result.push(key);
    }
  }
  return result;
}
var _baseKeys = baseKeys$1;
var isFunction = isFunction_1, isLength = isLength_1;
function isArrayLike$1(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}
var isArrayLike_1 = isArrayLike$1;
var arrayLikeKeys = _arrayLikeKeys, baseKeys = _baseKeys, isArrayLike = isArrayLike_1;
function keys$3(object2) {
  return isArrayLike(object2) ? arrayLikeKeys(object2) : baseKeys(object2);
}
var keys_1 = keys$3;
var baseFor = _baseFor, keys$2 = keys_1;
function baseForOwn$2(object2, iteratee) {
  return object2 && baseFor(object2, iteratee, keys$2);
}
var _baseForOwn = baseForOwn$2;
var ListCache$2 = _ListCache;
function stackClear$1() {
  this.__data__ = new ListCache$2();
  this.size = 0;
}
var _stackClear = stackClear$1;
function stackDelete$1(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
var _stackDelete = stackDelete$1;
function stackGet$1(key) {
  return this.__data__.get(key);
}
var _stackGet = stackGet$1;
function stackHas$1(key) {
  return this.__data__.has(key);
}
var _stackHas = stackHas$1;
var ListCache$1 = _ListCache, Map$2 = _Map, MapCache$1 = _MapCache;
var LARGE_ARRAY_SIZE = 200;
function stackSet$1(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache$1) {
    var pairs = data.__data__;
    if (!Map$2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache$1(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
var _stackSet = stackSet$1;
var ListCache = _ListCache, stackClear = _stackClear, stackDelete = _stackDelete, stackGet = _stackGet, stackHas = _stackHas, stackSet = _stackSet;
function Stack$2(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}
Stack$2.prototype.clear = stackClear;
Stack$2.prototype["delete"] = stackDelete;
Stack$2.prototype.get = stackGet;
Stack$2.prototype.has = stackHas;
Stack$2.prototype.set = stackSet;
var _Stack = Stack$2;
var HASH_UNDEFINED = "__lodash_hash_undefined__";
function setCacheAdd$1(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}
var _setCacheAdd = setCacheAdd$1;
function setCacheHas$1(value) {
  return this.__data__.has(value);
}
var _setCacheHas = setCacheHas$1;
var MapCache = _MapCache, setCacheAdd = _setCacheAdd, setCacheHas = _setCacheHas;
function SetCache$1(values) {
  var index2 = -1, length = values == null ? 0 : values.length;
  this.__data__ = new MapCache();
  while (++index2 < length) {
    this.add(values[index2]);
  }
}
SetCache$1.prototype.add = SetCache$1.prototype.push = setCacheAdd;
SetCache$1.prototype.has = setCacheHas;
var _SetCache = SetCache$1;
function arraySome$1(array2, predicate) {
  var index2 = -1, length = array2 == null ? 0 : array2.length;
  while (++index2 < length) {
    if (predicate(array2[index2], index2, array2)) {
      return true;
    }
  }
  return false;
}
var _arraySome = arraySome$1;
function cacheHas$1(cache, key) {
  return cache.has(key);
}
var _cacheHas = cacheHas$1;
var SetCache = _SetCache, arraySome = _arraySome, cacheHas = _cacheHas;
var COMPARE_PARTIAL_FLAG$5 = 1, COMPARE_UNORDERED_FLAG$3 = 2;
function equalArrays$2(array2, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$5, arrLength = array2.length, othLength = other.length;
  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  var arrStacked = stack.get(array2);
  var othStacked = stack.get(other);
  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array2;
  }
  var index2 = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG$3 ? new SetCache() : void 0;
  stack.set(array2, other);
  stack.set(other, array2);
  while (++index2 < arrLength) {
    var arrValue = array2[index2], othValue = other[index2];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index2, other, array2, stack) : customizer(arrValue, othValue, index2, array2, other, stack);
    }
    if (compared !== void 0) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    if (seen) {
      if (!arraySome(other, function(othValue2, othIndex) {
        if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack["delete"](array2);
  stack["delete"](other);
  return result;
}
var _equalArrays = equalArrays$2;
var root$5 = _root;
var Uint8Array$1 = root$5.Uint8Array;
var _Uint8Array = Uint8Array$1;
function mapToArray$1(map2) {
  var index2 = -1, result = Array(map2.size);
  map2.forEach(function(value, key) {
    result[++index2] = [key, value];
  });
  return result;
}
var _mapToArray = mapToArray$1;
function setToArray$1(set2) {
  var index2 = -1, result = Array(set2.size);
  set2.forEach(function(value) {
    result[++index2] = value;
  });
  return result;
}
var _setToArray = setToArray$1;
var Symbol$2 = _Symbol, Uint8Array = _Uint8Array, eq = eq_1, equalArrays$1 = _equalArrays, mapToArray = _mapToArray, setToArray = _setToArray;
var COMPARE_PARTIAL_FLAG$4 = 1, COMPARE_UNORDERED_FLAG$2 = 2;
var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag$1 = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag$1 = "[object Set]", stringTag = "[object String]", symbolTag$1 = "[object Symbol]";
var arrayBufferTag = "[object ArrayBuffer]", dataViewTag$1 = "[object DataView]";
var symbolProto$1 = Symbol$2 ? Symbol$2.prototype : void 0, symbolValueOf = symbolProto$1 ? symbolProto$1.valueOf : void 0;
function equalByTag$1(object2, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag$1:
      if (object2.byteLength != other.byteLength || object2.byteOffset != other.byteOffset) {
        return false;
      }
      object2 = object2.buffer;
      other = other.buffer;
    case arrayBufferTag:
      if (object2.byteLength != other.byteLength || !equalFunc(new Uint8Array(object2), new Uint8Array(other))) {
        return false;
      }
      return true;
    case boolTag:
    case dateTag:
    case numberTag:
      return eq(+object2, +other);
    case errorTag:
      return object2.name == other.name && object2.message == other.message;
    case regexpTag:
    case stringTag:
      return object2 == other + "";
    case mapTag$1:
      var convert = mapToArray;
    case setTag$1:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4;
      convert || (convert = setToArray);
      if (object2.size != other.size && !isPartial) {
        return false;
      }
      var stacked = stack.get(object2);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG$2;
      stack.set(object2, other);
      var result = equalArrays$1(convert(object2), convert(other), bitmask, customizer, equalFunc, stack);
      stack["delete"](object2);
      return result;
    case symbolTag$1:
      if (symbolValueOf) {
        return symbolValueOf.call(object2) == symbolValueOf.call(other);
      }
  }
  return false;
}
var _equalByTag = equalByTag$1;
function arrayPush$1(array2, values) {
  var index2 = -1, length = values.length, offset = array2.length;
  while (++index2 < length) {
    array2[offset + index2] = values[index2];
  }
  return array2;
}
var _arrayPush = arrayPush$1;
var arrayPush = _arrayPush, isArray$2 = isArray_1;
function baseGetAllKeys$1(object2, keysFunc, symbolsFunc) {
  var result = keysFunc(object2);
  return isArray$2(object2) ? result : arrayPush(result, symbolsFunc(object2));
}
var _baseGetAllKeys = baseGetAllKeys$1;
function arrayFilter$1(array2, predicate) {
  var index2 = -1, length = array2 == null ? 0 : array2.length, resIndex = 0, result = [];
  while (++index2 < length) {
    var value = array2[index2];
    if (predicate(value, index2, array2)) {
      result[resIndex++] = value;
    }
  }
  return result;
}
var _arrayFilter = arrayFilter$1;
function stubArray$1() {
  return [];
}
var stubArray_1 = stubArray$1;
var arrayFilter = _arrayFilter, stubArray = stubArray_1;
var objectProto$3 = Object.prototype;
var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;
var nativeGetSymbols = Object.getOwnPropertySymbols;
var getSymbols$1 = !nativeGetSymbols ? stubArray : function(object2) {
  if (object2 == null) {
    return [];
  }
  object2 = Object(object2);
  return arrayFilter(nativeGetSymbols(object2), function(symbol) {
    return propertyIsEnumerable.call(object2, symbol);
  });
};
var _getSymbols = getSymbols$1;
var baseGetAllKeys = _baseGetAllKeys, getSymbols = _getSymbols, keys$1 = keys_1;
function getAllKeys$1(object2) {
  return baseGetAllKeys(object2, keys$1, getSymbols);
}
var _getAllKeys = getAllKeys$1;
var getAllKeys = _getAllKeys;
var COMPARE_PARTIAL_FLAG$3 = 1;
var objectProto$2 = Object.prototype;
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;
function equalObjects$1(object2, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3, objProps = getAllKeys(object2), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index2 = objLength;
  while (index2--) {
    var key = objProps[index2];
    if (!(isPartial ? key in other : hasOwnProperty$1.call(other, key))) {
      return false;
    }
  }
  var objStacked = stack.get(object2);
  var othStacked = stack.get(other);
  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object2;
  }
  var result = true;
  stack.set(object2, other);
  stack.set(other, object2);
  var skipCtor = isPartial;
  while (++index2 < objLength) {
    key = objProps[index2];
    var objValue = object2[key], othValue = other[key];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object2, stack) : customizer(objValue, othValue, key, object2, other, stack);
    }
    if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == "constructor");
  }
  if (result && !skipCtor) {
    var objCtor = object2.constructor, othCtor = other.constructor;
    if (objCtor != othCtor && ("constructor" in object2 && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack["delete"](object2);
  stack["delete"](other);
  return result;
}
var _equalObjects = equalObjects$1;
var getNative$3 = _getNative, root$4 = _root;
var DataView$1 = getNative$3(root$4, "DataView");
var _DataView = DataView$1;
var getNative$2 = _getNative, root$3 = _root;
var Promise$2 = getNative$2(root$3, "Promise");
var _Promise = Promise$2;
var getNative$1 = _getNative, root$2 = _root;
var Set$2 = getNative$1(root$2, "Set");
var _Set = Set$2;
var getNative = _getNative, root$1 = _root;
var WeakMap$2 = getNative(root$1, "WeakMap");
var _WeakMap = WeakMap$2;
var DataView = _DataView, Map$1 = _Map, Promise$1 = _Promise, Set$1 = _Set, WeakMap$1 = _WeakMap, baseGetTag = _baseGetTag, toSource = _toSource;
var mapTag = "[object Map]", objectTag$1 = "[object Object]", promiseTag = "[object Promise]", setTag = "[object Set]", weakMapTag = "[object WeakMap]";
var dataViewTag = "[object DataView]";
var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map$1), promiseCtorString = toSource(Promise$1), setCtorString = toSource(Set$1), weakMapCtorString = toSource(WeakMap$1);
var getTag$1 = baseGetTag;
if (DataView && getTag$1(new DataView(new ArrayBuffer(1))) != dataViewTag || Map$1 && getTag$1(new Map$1()) != mapTag || Promise$1 && getTag$1(Promise$1.resolve()) != promiseTag || Set$1 && getTag$1(new Set$1()) != setTag || WeakMap$1 && getTag$1(new WeakMap$1()) != weakMapTag) {
  getTag$1 = function(value) {
    var result = baseGetTag(value), Ctor = result == objectTag$1 ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag;
        case mapCtorString:
          return mapTag;
        case promiseCtorString:
          return promiseTag;
        case setCtorString:
          return setTag;
        case weakMapCtorString:
          return weakMapTag;
      }
    }
    return result;
  };
}
var _getTag = getTag$1;
var Stack$1 = _Stack, equalArrays = _equalArrays, equalByTag = _equalByTag, equalObjects = _equalObjects, getTag = _getTag, isArray$1 = isArray_1, isBuffer = isBufferExports, isTypedArray = isTypedArray_1;
var COMPARE_PARTIAL_FLAG$2 = 1;
var argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]";
var objectProto$1 = Object.prototype;
var hasOwnProperty = objectProto$1.hasOwnProperty;
function baseIsEqualDeep$1(object2, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray$1(object2), othIsArr = isArray$1(other), objTag = objIsArr ? arrayTag : getTag(object2), othTag = othIsArr ? arrayTag : getTag(other);
  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;
  var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
  if (isSameTag && isBuffer(object2)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack$1());
    return objIsArr || isTypedArray(object2) ? equalArrays(object2, other, bitmask, customizer, equalFunc, stack) : equalByTag(object2, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG$2)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object2, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object2.value() : object2, othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new Stack$1());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack$1());
  return equalObjects(object2, other, bitmask, customizer, equalFunc, stack);
}
var _baseIsEqualDeep = baseIsEqualDeep$1;
var baseIsEqualDeep = _baseIsEqualDeep, isObjectLike$1 = isObjectLike_1;
function baseIsEqual$2(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike$1(value) && !isObjectLike$1(other)) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual$2, stack);
}
var _baseIsEqual = baseIsEqual$2;
var Stack = _Stack, baseIsEqual$1 = _baseIsEqual;
var COMPARE_PARTIAL_FLAG$1 = 1, COMPARE_UNORDERED_FLAG$1 = 2;
function baseIsMatch$1(object2, source2, matchData, customizer) {
  var index2 = matchData.length, length = index2, noCustomizer = !customizer;
  if (object2 == null) {
    return !length;
  }
  object2 = Object(object2);
  while (index2--) {
    var data = matchData[index2];
    if (noCustomizer && data[2] ? data[1] !== object2[data[0]] : !(data[0] in object2)) {
      return false;
    }
  }
  while (++index2 < length) {
    data = matchData[index2];
    var key = data[0], objValue = object2[key], srcValue = data[1];
    if (noCustomizer && data[2]) {
      if (objValue === void 0 && !(key in object2)) {
        return false;
      }
    } else {
      var stack = new Stack();
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object2, source2, stack);
      }
      if (!(result === void 0 ? baseIsEqual$1(srcValue, objValue, COMPARE_PARTIAL_FLAG$1 | COMPARE_UNORDERED_FLAG$1, customizer, stack) : result)) {
        return false;
      }
    }
  }
  return true;
}
var _baseIsMatch = baseIsMatch$1;
var isObject$2 = isObject_1;
function isStrictComparable$2(value) {
  return value === value && !isObject$2(value);
}
var _isStrictComparable = isStrictComparable$2;
var isStrictComparable$1 = _isStrictComparable, keys = keys_1;
function getMatchData$1(object2) {
  var result = keys(object2), length = result.length;
  while (length--) {
    var key = result[length], value = object2[key];
    result[length] = [key, value, isStrictComparable$1(value)];
  }
  return result;
}
var _getMatchData = getMatchData$1;
function matchesStrictComparable$2(key, srcValue) {
  return function(object2) {
    if (object2 == null) {
      return false;
    }
    return object2[key] === srcValue && (srcValue !== void 0 || key in Object(object2));
  };
}
var _matchesStrictComparable = matchesStrictComparable$2;
var baseIsMatch = _baseIsMatch, getMatchData = _getMatchData, matchesStrictComparable$1 = _matchesStrictComparable;
function baseMatches$1(source2) {
  var matchData = getMatchData(source2);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable$1(matchData[0][0], matchData[0][1]);
  }
  return function(object2) {
    return object2 === source2 || baseIsMatch(object2, source2, matchData);
  };
}
var _baseMatches = baseMatches$1;
var castPath = _castPath, toKey$2 = _toKey;
function baseGet$2(object2, path2) {
  path2 = castPath(path2, object2);
  var index2 = 0, length = path2.length;
  while (object2 != null && index2 < length) {
    object2 = object2[toKey$2(path2[index2++])];
  }
  return index2 && index2 == length ? object2 : void 0;
}
var _baseGet = baseGet$2;
var baseGet$1 = _baseGet;
function get$1(object2, path2, defaultValue) {
  var result = object2 == null ? void 0 : baseGet$1(object2, path2);
  return result === void 0 ? defaultValue : result;
}
var get_1 = get$1;
function baseHasIn$1(object2, key) {
  return object2 != null && key in Object(object2);
}
var _baseHasIn = baseHasIn$1;
var baseHasIn = _baseHasIn, hasPath = _hasPath;
function hasIn$1(object2, path2) {
  return object2 != null && hasPath(object2, path2, baseHasIn);
}
var hasIn_1 = hasIn$1;
var baseIsEqual = _baseIsEqual, get = get_1, hasIn = hasIn_1, isKey$1 = _isKey, isStrictComparable = _isStrictComparable, matchesStrictComparable = _matchesStrictComparable, toKey$1 = _toKey;
var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
function baseMatchesProperty$1(path2, srcValue) {
  if (isKey$1(path2) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey$1(path2), srcValue);
  }
  return function(object2) {
    var objValue = get(object2, path2);
    return objValue === void 0 && objValue === srcValue ? hasIn(object2, path2) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}
var _baseMatchesProperty = baseMatchesProperty$1;
function identity$1(value) {
  return value;
}
var identity_1 = identity$1;
function baseProperty$1(key) {
  return function(object2) {
    return object2 == null ? void 0 : object2[key];
  };
}
var _baseProperty = baseProperty$1;
var baseGet = _baseGet;
function basePropertyDeep$1(path2) {
  return function(object2) {
    return baseGet(object2, path2);
  };
}
var _basePropertyDeep = basePropertyDeep$1;
var baseProperty = _baseProperty, basePropertyDeep = _basePropertyDeep, isKey = _isKey, toKey = _toKey;
function property$1(path2) {
  return isKey(path2) ? baseProperty(toKey(path2)) : basePropertyDeep(path2);
}
var property_1 = property$1;
var baseMatches = _baseMatches, baseMatchesProperty = _baseMatchesProperty, identity = identity_1, isArray = isArray_1, property = property_1;
function baseIteratee$2(value) {
  if (typeof value == "function") {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == "object") {
    return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
  }
  return property(value);
}
var _baseIteratee = baseIteratee$2;
var baseAssignValue$1 = _baseAssignValue, baseForOwn$1 = _baseForOwn, baseIteratee$1 = _baseIteratee;
function mapValues(object2, iteratee) {
  var result = {};
  iteratee = baseIteratee$1(iteratee);
  baseForOwn$1(object2, function(value, key, object3) {
    baseAssignValue$1(result, key, iteratee(value, key, object3));
  });
  return result;
}
var mapValues_1 = mapValues;
const mapValues$1 = /* @__PURE__ */ getDefaultExportFromCjs(mapValues_1);
function Cache(maxSize) {
  this._maxSize = maxSize;
  this.clear();
}
Cache.prototype.clear = function() {
  this._size = 0;
  this._values = /* @__PURE__ */ Object.create(null);
};
Cache.prototype.get = function(key) {
  return this._values[key];
};
Cache.prototype.set = function(key, value) {
  this._size >= this._maxSize && this.clear();
  if (!(key in this._values)) this._size++;
  return this._values[key] = value;
};
var SPLIT_REGEX = /[^.^\]^[]+|(?=\[\]|\.\.)/g, DIGIT_REGEX = /^\d+$/, LEAD_DIGIT_REGEX = /^\d/, SPEC_CHAR_REGEX = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g, CLEAN_QUOTES_REGEX = /^\s*(['"]?)(.*?)(\1)\s*$/, MAX_CACHE_SIZE = 512;
var pathCache = new Cache(MAX_CACHE_SIZE);
new Cache(MAX_CACHE_SIZE);
var getCache = new Cache(MAX_CACHE_SIZE);
var propertyExpr = {
  split,
  getter: function(path2, safe) {
    var parts = normalizePath(path2);
    return getCache.get(path2) || getCache.set(path2, function getter(data) {
      var index2 = 0, len = parts.length;
      while (index2 < len) {
        if (data != null || !safe) data = data[parts[index2++]];
        else return;
      }
      return data;
    });
  },
  forEach: function(path2, cb, thisArg) {
    forEach(Array.isArray(path2) ? path2 : split(path2), cb, thisArg);
  }
};
function normalizePath(path2) {
  return pathCache.get(path2) || pathCache.set(
    path2,
    split(path2).map(function(part) {
      return part.replace(CLEAN_QUOTES_REGEX, "$2");
    })
  );
}
function split(path2) {
  return path2.match(SPLIT_REGEX) || [""];
}
function forEach(parts, iter, thisArg) {
  var len = parts.length, part, idx, isArray2, isBracket;
  for (idx = 0; idx < len; idx++) {
    part = parts[idx];
    if (part) {
      if (shouldBeQuoted(part)) {
        part = '"' + part + '"';
      }
      isBracket = isQuoted(part);
      isArray2 = !isBracket && /^\d+$/.test(part);
      iter.call(thisArg, part, isBracket, isArray2, idx, parts);
    }
  }
}
function isQuoted(str) {
  return typeof str === "string" && str && ["'", '"'].indexOf(str.charAt(0)) !== -1;
}
function hasLeadingNumber(part) {
  return part.match(LEAD_DIGIT_REGEX) && !part.match(DIGIT_REGEX);
}
function hasSpecialChars(part) {
  return SPEC_CHAR_REGEX.test(part);
}
function shouldBeQuoted(part) {
  return !isQuoted(part) && (hasLeadingNumber(part) || hasSpecialChars(part));
}
const prefixes = {
  context: "$",
  value: "."
};
class Reference {
  constructor(key, options2 = {}) {
    if (typeof key !== "string") throw new TypeError("ref must be a string, got: " + key);
    this.key = key.trim();
    if (key === "") throw new TypeError("ref must be a non-empty string");
    this.isContext = this.key[0] === prefixes.context;
    this.isValue = this.key[0] === prefixes.value;
    this.isSibling = !this.isContext && !this.isValue;
    let prefix = this.isContext ? prefixes.context : this.isValue ? prefixes.value : "";
    this.path = this.key.slice(prefix.length);
    this.getter = this.path && propertyExpr.getter(this.path, true);
    this.map = options2.map;
  }
  getValue(value, parent, context) {
    let result = this.isContext ? context : this.isValue ? value : parent;
    if (this.getter) result = this.getter(result || {});
    if (this.map) result = this.map(result);
    return result;
  }
  /**
   *
   * @param {*} value
   * @param {Object} options
   * @param {Object=} options.context
   * @param {Object=} options.parent
   */
  cast(value, options2) {
    return this.getValue(value, options2 == null ? void 0 : options2.parent, options2 == null ? void 0 : options2.context);
  }
  resolve() {
    return this;
  }
  describe() {
    return {
      type: "ref",
      key: this.key
    };
  }
  toString() {
    return `Ref(${this.key})`;
  }
  static isRef(value) {
    return value && value.__isYupRef;
  }
}
Reference.prototype.__isYupRef = true;
function _extends$3() {
  _extends$3 = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source2 = arguments[i];
      for (var key in source2) {
        if (Object.prototype.hasOwnProperty.call(source2, key)) {
          target[key] = source2[key];
        }
      }
    }
    return target;
  };
  return _extends$3.apply(this, arguments);
}
function _objectWithoutPropertiesLoose(source2, excluded) {
  if (source2 == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source2);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source2[key];
  }
  return target;
}
function createValidation(config2) {
  function validate(_ref, cb) {
    let {
      value,
      path: path2 = "",
      label,
      options: options2,
      originalValue,
      sync: sync2
    } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]);
    const {
      name,
      test,
      params,
      message
    } = config2;
    let {
      parent,
      context
    } = options2;
    function resolve(item) {
      return Reference.isRef(item) ? item.getValue(value, parent, context) : item;
    }
    function createError(overrides = {}) {
      const nextParams = mapValues$1(_extends$3({
        value,
        originalValue,
        label,
        path: overrides.path || path2
      }, params, overrides.params), resolve);
      const error2 = new ValidationError$1(ValidationError$1.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);
      error2.params = nextParams;
      return error2;
    }
    let ctx = _extends$3({
      path: path2,
      parent,
      type: name,
      createError,
      resolve,
      options: options2,
      originalValue
    }, rest);
    if (!sync2) {
      try {
        Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => {
          if (ValidationError$1.isError(validOrError)) cb(validOrError);
          else if (!validOrError) cb(createError());
          else cb(null, validOrError);
        });
      } catch (err) {
        cb(err);
      }
      return;
    }
    let result;
    try {
      var _ref2;
      result = test.call(ctx, value, ctx);
      if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") {
        throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);
      }
    } catch (err) {
      cb(err);
      return;
    }
    if (ValidationError$1.isError(result)) cb(result);
    else if (!result) cb(createError());
    else cb(null, result);
  }
  validate.OPTIONS = config2;
  return validate;
}
let trim = (part) => part.substr(0, part.length - 1).substr(1);
function getIn(schema2, path2, value, context = value) {
  let parent, lastPart, lastPartDebug;
  if (!path2) return {
    parent,
    parentPath: path2,
    schema: schema2
  };
  propertyExpr.forEach(path2, (_part, isBracket, isArray2) => {
    let part = isBracket ? trim(_part) : _part;
    schema2 = schema2.resolve({
      context,
      parent,
      value
    });
    if (schema2.innerType) {
      let idx = isArray2 ? parseInt(part, 10) : 0;
      if (value && idx >= value.length) {
        throw new Error(`Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path2}. because there is no value at that index. `);
      }
      parent = value;
      value = value && value[idx];
      schema2 = schema2.innerType;
    }
    if (!isArray2) {
      if (!schema2.fields || !schema2.fields[part]) throw new Error(`The schema does not contain the path: ${path2}. (failed at: ${lastPartDebug} which is a type: "${schema2._type}")`);
      parent = value;
      value = value && value[part];
      schema2 = schema2.fields[part];
    }
    lastPart = part;
    lastPartDebug = isBracket ? "[" + _part + "]" : "." + _part;
  });
  return {
    schema: schema2,
    parent,
    parentPath: lastPart
  };
}
class ReferenceSet {
  constructor() {
    this.list = /* @__PURE__ */ new Set();
    this.refs = /* @__PURE__ */ new Map();
  }
  get size() {
    return this.list.size + this.refs.size;
  }
  describe() {
    const description = [];
    for (const item of this.list) description.push(item);
    for (const [, ref] of this.refs) description.push(ref.describe());
    return description;
  }
  toArray() {
    return Array.from(this.list).concat(Array.from(this.refs.values()));
  }
  add(value) {
    Reference.isRef(value) ? this.refs.set(value.key, value) : this.list.add(value);
  }
  delete(value) {
    Reference.isRef(value) ? this.refs.delete(value.key) : this.list.delete(value);
  }
  has(value, resolve) {
    if (this.list.has(value)) return true;
    let item, values = this.refs.values();
    while (item = values.next(), !item.done) if (resolve(item.value) === value) return true;
    return false;
  }
  clone() {
    const next = new ReferenceSet();
    next.list = new Set(this.list);
    next.refs = new Map(this.refs);
    return next;
  }
  merge(newItems, removeItems) {
    const next = this.clone();
    newItems.list.forEach((value) => next.add(value));
    newItems.refs.forEach((value) => next.add(value));
    removeItems.list.forEach((value) => next.delete(value));
    removeItems.refs.forEach((value) => next.delete(value));
    return next;
  }
}
function _extends$2() {
  _extends$2 = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source2 = arguments[i];
      for (var key in source2) {
        if (Object.prototype.hasOwnProperty.call(source2, key)) {
          target[key] = source2[key];
        }
      }
    }
    return target;
  };
  return _extends$2.apply(this, arguments);
}
class BaseSchema {
  constructor(options2) {
    this.deps = [];
    this.conditions = [];
    this._whitelist = new ReferenceSet();
    this._blacklist = new ReferenceSet();
    this.exclusiveTests = /* @__PURE__ */ Object.create(null);
    this.tests = [];
    this.transforms = [];
    this.withMutation(() => {
      this.typeError(mixed.notType);
    });
    this.type = (options2 == null ? void 0 : options2.type) || "mixed";
    this.spec = _extends$2({
      strip: false,
      strict: false,
      abortEarly: true,
      recursive: true,
      nullable: false,
      presence: "optional"
    }, options2 == null ? void 0 : options2.spec);
  }
  // TODO: remove
  get _type() {
    return this.type;
  }
  _typeCheck(_value) {
    return true;
  }
  clone(spec) {
    if (this._mutate) {
      if (spec) Object.assign(this.spec, spec);
      return this;
    }
    const next = Object.create(Object.getPrototypeOf(this));
    next.type = this.type;
    next._typeError = this._typeError;
    next._whitelistError = this._whitelistError;
    next._blacklistError = this._blacklistError;
    next._whitelist = this._whitelist.clone();
    next._blacklist = this._blacklist.clone();
    next.exclusiveTests = _extends$2({}, this.exclusiveTests);
    next.deps = [...this.deps];
    next.conditions = [...this.conditions];
    next.tests = [...this.tests];
    next.transforms = [...this.transforms];
    next.spec = clone$1(_extends$2({}, this.spec, spec));
    return next;
  }
  label(label) {
    var next = this.clone();
    next.spec.label = label;
    return next;
  }
  meta(...args) {
    if (args.length === 0) return this.spec.meta;
    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }
  // withContext<TContext extends AnyObject>(): BaseSchema<
  //   TCast,
  //   TContext,
  //   TOutput
  // > {
  //   return this as any;
  // }
  withMutation(fn) {
    let before = this._mutate;
    this._mutate = true;
    let result = fn(this);
    this._mutate = before;
    return result;
  }
  concat(schema2) {
    if (!schema2 || schema2 === this) return this;
    if (schema2.type !== this.type && this.type !== "mixed") throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this.type} and ${schema2.type}`);
    let base = this;
    let combined = schema2.clone();
    const mergedSpec = _extends$2({}, base.spec, combined.spec);
    combined.spec = mergedSpec;
    combined._typeError || (combined._typeError = base._typeError);
    combined._whitelistError || (combined._whitelistError = base._whitelistError);
    combined._blacklistError || (combined._blacklistError = base._blacklistError);
    combined._whitelist = base._whitelist.merge(schema2._whitelist, schema2._blacklist);
    combined._blacklist = base._blacklist.merge(schema2._blacklist, schema2._whitelist);
    combined.tests = base.tests;
    combined.exclusiveTests = base.exclusiveTests;
    combined.withMutation((next) => {
      schema2.tests.forEach((fn) => {
        next.test(fn.OPTIONS);
      });
    });
    return combined;
  }
  isType(v) {
    if (this.spec.nullable && v === null) return true;
    return this._typeCheck(v);
  }
  resolve(options2) {
    let schema2 = this;
    if (schema2.conditions.length) {
      let conditions = schema2.conditions;
      schema2 = schema2.clone();
      schema2.conditions = [];
      schema2 = conditions.reduce((schema3, condition) => condition.resolve(schema3, options2), schema2);
      schema2 = schema2.resolve(options2);
    }
    return schema2;
  }
  /**
   *
   * @param {*} value
   * @param {Object} options
   * @param {*=} options.parent
   * @param {*=} options.context
   */
  cast(value, options2 = {}) {
    let resolvedSchema = this.resolve(_extends$2({
      value
    }, options2));
    let result = resolvedSchema._cast(value, options2);
    if (value !== void 0 && options2.assert !== false && resolvedSchema.isType(result) !== true) {
      let formattedValue = printValue$1(value);
      let formattedResult = printValue$1(result);
      throw new TypeError(`The value of ${options2.path || "field"} could not be cast to a value that satisfies the schema type: "${resolvedSchema._type}". 

attempted value: ${formattedValue} 
` + (formattedResult !== formattedValue ? `result of cast: ${formattedResult}` : ""));
    }
    return result;
  }
  _cast(rawValue, _options) {
    let value = rawValue === void 0 ? rawValue : this.transforms.reduce((value2, fn) => fn.call(this, value2, rawValue, this), rawValue);
    if (value === void 0) {
      value = this.getDefault();
    }
    return value;
  }
  _validate(_value, options2 = {}, cb) {
    let {
      sync: sync2,
      path: path2,
      from = [],
      originalValue = _value,
      strict = this.spec.strict,
      abortEarly = this.spec.abortEarly
    } = options2;
    let value = _value;
    if (!strict) {
      value = this._cast(value, _extends$2({
        assert: false
      }, options2));
    }
    let args = {
      value,
      path: path2,
      options: options2,
      originalValue,
      schema: this,
      label: this.spec.label,
      sync: sync2,
      from
    };
    let initialTests = [];
    if (this._typeError) initialTests.push(this._typeError);
    if (this._whitelistError) initialTests.push(this._whitelistError);
    if (this._blacklistError) initialTests.push(this._blacklistError);
    runTests({
      args,
      value,
      path: path2,
      tests: initialTests,
      endEarly: abortEarly
    }, (err) => {
      if (err) return void cb(err, value);
      runTests({
        tests: this.tests,
        args,
        path: path2,
        sync: sync2,
        value,
        endEarly: abortEarly
      }, cb);
    });
  }
  validate(value, options2, maybeCb) {
    let schema2 = this.resolve(_extends$2({}, options2, {
      value
    }));
    return typeof maybeCb === "function" ? schema2._validate(value, options2, maybeCb) : new Promise((resolve, reject) => schema2._validate(value, options2, (err, value2) => {
      if (err) reject(err);
      else resolve(value2);
    }));
  }
  validateSync(value, options2) {
    let schema2 = this.resolve(_extends$2({}, options2, {
      value
    }));
    let result;
    schema2._validate(value, _extends$2({}, options2, {
      sync: true
    }), (err, value2) => {
      if (err) throw err;
      result = value2;
    });
    return result;
  }
  isValid(value, options2) {
    return this.validate(value, options2).then(() => true, (err) => {
      if (ValidationError$1.isError(err)) return false;
      throw err;
    });
  }
  isValidSync(value, options2) {
    try {
      this.validateSync(value, options2);
      return true;
    } catch (err) {
      if (ValidationError$1.isError(err)) return false;
      throw err;
    }
  }
  _getDefault() {
    let defaultValue = this.spec.default;
    if (defaultValue == null) {
      return defaultValue;
    }
    return typeof defaultValue === "function" ? defaultValue.call(this) : clone$1(defaultValue);
  }
  getDefault(options2) {
    let schema2 = this.resolve(options2 || {});
    return schema2._getDefault();
  }
  default(def) {
    if (arguments.length === 0) {
      return this._getDefault();
    }
    let next = this.clone({
      default: def
    });
    return next;
  }
  strict(isStrict = true) {
    var next = this.clone();
    next.spec.strict = isStrict;
    return next;
  }
  _isPresent(value) {
    return value != null;
  }
  defined(message = mixed.defined) {
    return this.test({
      message,
      name: "defined",
      exclusive: true,
      test(value) {
        return value !== void 0;
      }
    });
  }
  required(message = mixed.required) {
    return this.clone({
      presence: "required"
    }).withMutation((s) => s.test({
      message,
      name: "required",
      exclusive: true,
      test(value) {
        return this.schema._isPresent(value);
      }
    }));
  }
  notRequired() {
    var next = this.clone({
      presence: "optional"
    });
    next.tests = next.tests.filter((test) => test.OPTIONS.name !== "required");
    return next;
  }
  nullable(isNullable = true) {
    var next = this.clone({
      nullable: isNullable !== false
    });
    return next;
  }
  transform(fn) {
    var next = this.clone();
    next.transforms.push(fn);
    return next;
  }
  /**
   * Adds a test function to the schema's queue of tests.
   * tests can be exclusive or non-exclusive.
   *
   * - exclusive tests, will replace any existing tests of the same name.
   * - non-exclusive: can be stacked
   *
   * If a non-exclusive test is added to a schema with an exclusive test of the same name
   * the exclusive test is removed and further tests of the same name will be stacked.
   *
   * If an exclusive test is added to a schema with non-exclusive tests of the same name
   * the previous tests are removed and further tests of the same name will replace each other.
   */
  test(...args) {
    let opts;
    if (args.length === 1) {
      if (typeof args[0] === "function") {
        opts = {
          test: args[0]
        };
      } else {
        opts = args[0];
      }
    } else if (args.length === 2) {
      opts = {
        name: args[0],
        test: args[1]
      };
    } else {
      opts = {
        name: args[0],
        message: args[1],
        test: args[2]
      };
    }
    if (opts.message === void 0) opts.message = mixed.default;
    if (typeof opts.test !== "function") throw new TypeError("`test` is a required parameters");
    let next = this.clone();
    let validate = createValidation(opts);
    let isExclusive = opts.exclusive || opts.name && next.exclusiveTests[opts.name] === true;
    if (opts.exclusive) {
      if (!opts.name) throw new TypeError("Exclusive tests must provide a unique `name` identifying the test");
    }
    if (opts.name) next.exclusiveTests[opts.name] = !!opts.exclusive;
    next.tests = next.tests.filter((fn) => {
      if (fn.OPTIONS.name === opts.name) {
        if (isExclusive) return false;
        if (fn.OPTIONS.test === validate.OPTIONS.test) return false;
      }
      return true;
    });
    next.tests.push(validate);
    return next;
  }
  when(keys2, options2) {
    if (!Array.isArray(keys2) && typeof keys2 !== "string") {
      options2 = keys2;
      keys2 = ".";
    }
    let next = this.clone();
    let deps = toArray(keys2).map((key) => new Reference(key));
    deps.forEach((dep) => {
      if (dep.isSibling) next.deps.push(dep.key);
    });
    next.conditions.push(new Condition(deps, options2));
    return next;
  }
  typeError(message) {
    var next = this.clone();
    next._typeError = createValidation({
      message,
      name: "typeError",
      test(value) {
        if (value !== void 0 && !this.schema.isType(value)) return this.createError({
          params: {
            type: this.schema._type
          }
        });
        return true;
      }
    });
    return next;
  }
  oneOf(enums, message = mixed.oneOf) {
    var next = this.clone();
    enums.forEach((val) => {
      next._whitelist.add(val);
      next._blacklist.delete(val);
    });
    next._whitelistError = createValidation({
      message,
      name: "oneOf",
      test(value) {
        if (value === void 0) return true;
        let valids = this.schema._whitelist;
        return valids.has(value, this.resolve) ? true : this.createError({
          params: {
            values: valids.toArray().join(", ")
          }
        });
      }
    });
    return next;
  }
  notOneOf(enums, message = mixed.notOneOf) {
    var next = this.clone();
    enums.forEach((val) => {
      next._blacklist.add(val);
      next._whitelist.delete(val);
    });
    next._blacklistError = createValidation({
      message,
      name: "notOneOf",
      test(value) {
        let invalids = this.schema._blacklist;
        if (invalids.has(value, this.resolve)) return this.createError({
          params: {
            values: invalids.toArray().join(", ")
          }
        });
        return true;
      }
    });
    return next;
  }
  strip(strip = true) {
    let next = this.clone();
    next.spec.strip = strip;
    return next;
  }
  describe() {
    const next = this.clone();
    const {
      label,
      meta
    } = next.spec;
    const description = {
      meta,
      label,
      type: next.type,
      oneOf: next._whitelist.describe(),
      notOneOf: next._blacklist.describe(),
      tests: next.tests.map((fn) => ({
        name: fn.OPTIONS.name,
        params: fn.OPTIONS.params
      })).filter((n, idx, list) => list.findIndex((c) => c.name === n.name) === idx)
    };
    return description;
  }
}
BaseSchema.prototype.__isYupSchema__ = true;
for (const method of ["validate", "validateSync"]) BaseSchema.prototype[`${method}At`] = function(path2, value, options2 = {}) {
  const {
    parent,
    parentPath,
    schema: schema2
  } = getIn(this, path2, value, options2.context);
  return schema2[method](parent && parent[parentPath], _extends$2({}, options2, {
    parent,
    path: path2
  }));
};
for (const alias of ["equals", "is"]) BaseSchema.prototype[alias] = BaseSchema.prototype.oneOf;
for (const alias of ["not", "nope"]) BaseSchema.prototype[alias] = BaseSchema.prototype.notOneOf;
BaseSchema.prototype.optional = BaseSchema.prototype.notRequired;
const Mixed = BaseSchema;
function create$3() {
  return new Mixed();
}
create$3.prototype = Mixed.prototype;
const isAbsent = (value) => value == null;
let rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
let rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
let rUUID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
let isTrimmed = (value) => isAbsent(value) || value === value.trim();
let objStringTag = {}.toString();
function create$2() {
  return new StringSchema();
}
class StringSchema extends BaseSchema {
  constructor() {
    super({
      type: "string"
    });
    this.withMutation(() => {
      this.transform(function(value) {
        if (this.isType(value)) return value;
        if (Array.isArray(value)) return value;
        const strValue = value != null && value.toString ? value.toString() : value;
        if (strValue === objStringTag) return value;
        return strValue;
      });
    });
  }
  _typeCheck(value) {
    if (value instanceof String) value = value.valueOf();
    return typeof value === "string";
  }
  _isPresent(value) {
    return super._isPresent(value) && !!value.length;
  }
  length(length, message = string$2.length) {
    return this.test({
      message,
      name: "length",
      exclusive: true,
      params: {
        length
      },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
      }
    });
  }
  min(min, message = string$2.min) {
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        min
      },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min);
      }
    });
  }
  max(max, message = string$2.max) {
    return this.test({
      name: "max",
      exclusive: true,
      message,
      params: {
        max
      },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max);
      }
    });
  }
  matches(regex, options2) {
    let excludeEmptyString = false;
    let message;
    let name;
    if (options2) {
      if (typeof options2 === "object") {
        ({
          excludeEmptyString = false,
          message,
          name
        } = options2);
      } else {
        message = options2;
      }
    }
    return this.test({
      name: name || "matches",
      message: message || string$2.matches,
      params: {
        regex
      },
      test: (value) => isAbsent(value) || value === "" && excludeEmptyString || value.search(regex) !== -1
    });
  }
  email(message = string$2.email) {
    return this.matches(rEmail, {
      name: "email",
      message,
      excludeEmptyString: true
    });
  }
  url(message = string$2.url) {
    return this.matches(rUrl, {
      name: "url",
      message,
      excludeEmptyString: true
    });
  }
  uuid(message = string$2.uuid) {
    return this.matches(rUUID, {
      name: "uuid",
      message,
      excludeEmptyString: false
    });
  }
  //-- transforms --
  ensure() {
    return this.default("").transform((val) => val === null ? "" : val);
  }
  trim(message = string$2.trim) {
    return this.transform((val) => val != null ? val.trim() : val).test({
      message,
      name: "trim",
      test: isTrimmed
    });
  }
  lowercase(message = string$2.lowercase) {
    return this.transform((value) => !isAbsent(value) ? value.toLowerCase() : value).test({
      message,
      name: "string_case",
      exclusive: true,
      test: (value) => isAbsent(value) || value === value.toLowerCase()
    });
  }
  uppercase(message = string$2.uppercase) {
    return this.transform((value) => !isAbsent(value) ? value.toUpperCase() : value).test({
      message,
      name: "string_case",
      exclusive: true,
      test: (value) => isAbsent(value) || value === value.toUpperCase()
    });
  }
}
create$2.prototype = StringSchema.prototype;
var isoReg = /^(\d{4}|[+\-]\d{6})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:[ T]?(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;
function parseIsoDate(date2) {
  var numericKeys = [1, 4, 5, 6, 7, 10, 11], minutesOffset = 0, timestamp, struct;
  if (struct = isoReg.exec(date2)) {
    for (var i = 0, k; k = numericKeys[i]; ++i) struct[k] = +struct[k] || 0;
    struct[2] = (+struct[2] || 1) - 1;
    struct[3] = +struct[3] || 1;
    struct[7] = struct[7] ? String(struct[7]).substr(0, 3) : 0;
    if ((struct[8] === void 0 || struct[8] === "") && (struct[9] === void 0 || struct[9] === "")) timestamp = +new Date(struct[1], struct[2], struct[3], struct[4], struct[5], struct[6], struct[7]);
    else {
      if (struct[8] !== "Z" && struct[9] !== void 0) {
        minutesOffset = struct[10] * 60 + struct[11];
        if (struct[9] === "+") minutesOffset = 0 - minutesOffset;
      }
      timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
    }
  } else timestamp = Date.parse ? Date.parse(date2) : NaN;
  return timestamp;
}
let invalidDate = /* @__PURE__ */ new Date("");
let isDate = (obj) => Object.prototype.toString.call(obj) === "[object Date]";
class DateSchema extends BaseSchema {
  constructor() {
    super({
      type: "date"
    });
    this.withMutation(() => {
      this.transform(function(value) {
        if (this.isType(value)) return value;
        value = parseIsoDate(value);
        return !isNaN(value) ? new Date(value) : invalidDate;
      });
    });
  }
  _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime());
  }
  prepareParam(ref, name) {
    let param;
    if (!Reference.isRef(ref)) {
      let cast = this.cast(ref);
      if (!this._typeCheck(cast)) throw new TypeError(`\`${name}\` must be a Date or a value that can be \`cast()\` to a Date`);
      param = cast;
    } else {
      param = ref;
    }
    return param;
  }
  min(min, message = date$2.min) {
    let limit = this.prepareParam(min, "min");
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        min
      },
      test(value) {
        return isAbsent(value) || value >= this.resolve(limit);
      }
    });
  }
  max(max, message = date$2.max) {
    var limit = this.prepareParam(max, "max");
    return this.test({
      message,
      name: "max",
      exclusive: true,
      params: {
        max
      },
      test(value) {
        return isAbsent(value) || value <= this.resolve(limit);
      }
    });
  }
}
DateSchema.INVALID_DATE = invalidDate;
function arrayReduce$1(array2, iteratee, accumulator, initAccum) {
  var index2 = -1, length = array2 == null ? 0 : array2.length;
  if (initAccum && length) {
    accumulator = array2[++index2];
  }
  while (++index2 < length) {
    accumulator = iteratee(accumulator, array2[index2], index2, array2);
  }
  return accumulator;
}
var _arrayReduce = arrayReduce$1;
function basePropertyOf$2(object2) {
  return function(key) {
    return object2 == null ? void 0 : object2[key];
  };
}
var _basePropertyOf = basePropertyOf$2;
var basePropertyOf$1 = _basePropertyOf;
var deburredLetters$1 = {
  // Latin-1 Supplement block.
  "À": "A",
  "Á": "A",
  "Â": "A",
  "Ã": "A",
  "Ä": "A",
  "Å": "A",
  "à": "a",
  "á": "a",
  "â": "a",
  "ã": "a",
  "ä": "a",
  "å": "a",
  "Ç": "C",
  "ç": "c",
  "Ð": "D",
  "ð": "d",
  "È": "E",
  "É": "E",
  "Ê": "E",
  "Ë": "E",
  "è": "e",
  "é": "e",
  "ê": "e",
  "ë": "e",
  "Ì": "I",
  "Í": "I",
  "Î": "I",
  "Ï": "I",
  "ì": "i",
  "í": "i",
  "î": "i",
  "ï": "i",
  "Ñ": "N",
  "ñ": "n",
  "Ò": "O",
  "Ó": "O",
  "Ô": "O",
  "Õ": "O",
  "Ö": "O",
  "Ø": "O",
  "ò": "o",
  "ó": "o",
  "ô": "o",
  "õ": "o",
  "ö": "o",
  "ø": "o",
  "Ù": "U",
  "Ú": "U",
  "Û": "U",
  "Ü": "U",
  "ù": "u",
  "ú": "u",
  "û": "u",
  "ü": "u",
  "Ý": "Y",
  "ý": "y",
  "ÿ": "y",
  "Æ": "Ae",
  "æ": "ae",
  "Þ": "Th",
  "þ": "th",
  "ß": "ss",
  // Latin Extended-A block.
  "Ā": "A",
  "Ă": "A",
  "Ą": "A",
  "ā": "a",
  "ă": "a",
  "ą": "a",
  "Ć": "C",
  "Ĉ": "C",
  "Ċ": "C",
  "Č": "C",
  "ć": "c",
  "ĉ": "c",
  "ċ": "c",
  "č": "c",
  "Ď": "D",
  "Đ": "D",
  "ď": "d",
  "đ": "d",
  "Ē": "E",
  "Ĕ": "E",
  "Ė": "E",
  "Ę": "E",
  "Ě": "E",
  "ē": "e",
  "ĕ": "e",
  "ė": "e",
  "ę": "e",
  "ě": "e",
  "Ĝ": "G",
  "Ğ": "G",
  "Ġ": "G",
  "Ģ": "G",
  "ĝ": "g",
  "ğ": "g",
  "ġ": "g",
  "ģ": "g",
  "Ĥ": "H",
  "Ħ": "H",
  "ĥ": "h",
  "ħ": "h",
  "Ĩ": "I",
  "Ī": "I",
  "Ĭ": "I",
  "Į": "I",
  "İ": "I",
  "ĩ": "i",
  "ī": "i",
  "ĭ": "i",
  "į": "i",
  "ı": "i",
  "Ĵ": "J",
  "ĵ": "j",
  "Ķ": "K",
  "ķ": "k",
  "ĸ": "k",
  "Ĺ": "L",
  "Ļ": "L",
  "Ľ": "L",
  "Ŀ": "L",
  "Ł": "L",
  "ĺ": "l",
  "ļ": "l",
  "ľ": "l",
  "ŀ": "l",
  "ł": "l",
  "Ń": "N",
  "Ņ": "N",
  "Ň": "N",
  "Ŋ": "N",
  "ń": "n",
  "ņ": "n",
  "ň": "n",
  "ŋ": "n",
  "Ō": "O",
  "Ŏ": "O",
  "Ő": "O",
  "ō": "o",
  "ŏ": "o",
  "ő": "o",
  "Ŕ": "R",
  "Ŗ": "R",
  "Ř": "R",
  "ŕ": "r",
  "ŗ": "r",
  "ř": "r",
  "Ś": "S",
  "Ŝ": "S",
  "Ş": "S",
  "Š": "S",
  "ś": "s",
  "ŝ": "s",
  "ş": "s",
  "š": "s",
  "Ţ": "T",
  "Ť": "T",
  "Ŧ": "T",
  "ţ": "t",
  "ť": "t",
  "ŧ": "t",
  "Ũ": "U",
  "Ū": "U",
  "Ŭ": "U",
  "Ů": "U",
  "Ű": "U",
  "Ų": "U",
  "ũ": "u",
  "ū": "u",
  "ŭ": "u",
  "ů": "u",
  "ű": "u",
  "ų": "u",
  "Ŵ": "W",
  "ŵ": "w",
  "Ŷ": "Y",
  "ŷ": "y",
  "Ÿ": "Y",
  "Ź": "Z",
  "Ż": "Z",
  "Ž": "Z",
  "ź": "z",
  "ż": "z",
  "ž": "z",
  "Ĳ": "IJ",
  "ĳ": "ij",
  "Œ": "Oe",
  "œ": "oe",
  "ŉ": "'n",
  "ſ": "s"
};
var deburrLetter$2 = basePropertyOf$1(deburredLetters$1);
var _deburrLetter = deburrLetter$2;
var deburrLetter$1 = _deburrLetter, toString$5 = toString_1;
var reLatin$1 = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
var rsComboMarksRange$4 = "\\u0300-\\u036f", reComboHalfMarksRange$3 = "\\ufe20-\\ufe2f", rsComboSymbolsRange$4 = "\\u20d0-\\u20ff", rsComboRange$3 = rsComboMarksRange$4 + reComboHalfMarksRange$3 + rsComboSymbolsRange$4;
var rsCombo$3 = "[" + rsComboRange$3 + "]";
var reComboMark$1 = RegExp(rsCombo$3, "g");
function deburr$3(string2) {
  string2 = toString$5(string2);
  return string2 && string2.replace(reLatin$1, deburrLetter$1).replace(reComboMark$1, "");
}
var deburr_1 = deburr$3;
var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
function asciiWords$1(string2) {
  return string2.match(reAsciiWord) || [];
}
var _asciiWords = asciiWords$1;
var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
function hasUnicodeWord$1(string2) {
  return reHasUnicodeWord.test(string2);
}
var _hasUnicodeWord = hasUnicodeWord$1;
var rsAstralRange$2 = "\\ud800-\\udfff", rsComboMarksRange$3 = "\\u0300-\\u036f", reComboHalfMarksRange$2 = "\\ufe20-\\ufe2f", rsComboSymbolsRange$3 = "\\u20d0-\\u20ff", rsComboRange$2 = rsComboMarksRange$3 + reComboHalfMarksRange$2 + rsComboSymbolsRange$3, rsDingbatRange = "\\u2700-\\u27bf", rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange = "\\u2000-\\u206f", rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange$2 = "\\ufe0e\\ufe0f", rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
var rsApos$1 = "['’]", rsBreak = "[" + rsBreakRange + "]", rsCombo$2 = "[" + rsComboRange$2 + "]", rsDigits = "\\d+", rsDingbat = "[" + rsDingbatRange + "]", rsLower = "[" + rsLowerRange + "]", rsMisc = "[^" + rsAstralRange$2 + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]", rsFitz$1 = "\\ud83c[\\udffb-\\udfff]", rsModifier$1 = "(?:" + rsCombo$2 + "|" + rsFitz$1 + ")", rsNonAstral$1 = "[^" + rsAstralRange$2 + "]", rsRegional$1 = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair$1 = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper = "[" + rsUpperRange + "]", rsZWJ$2 = "\\u200d";
var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")", rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")", rsOptContrLower = "(?:" + rsApos$1 + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper = "(?:" + rsApos$1 + "(?:D|LL|M|RE|S|T|VE))?", reOptMod$1 = rsModifier$1 + "?", rsOptVar$1 = "[" + rsVarRange$2 + "]?", rsOptJoin$1 = "(?:" + rsZWJ$2 + "(?:" + [rsNonAstral$1, rsRegional$1, rsSurrPair$1].join("|") + ")" + rsOptVar$1 + reOptMod$1 + ")*", rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq$1 = rsOptVar$1 + reOptMod$1 + rsOptJoin$1, rsEmoji = "(?:" + [rsDingbat, rsRegional$1, rsSurrPair$1].join("|") + ")" + rsSeq$1;
var reUnicodeWord = RegExp([
  rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [rsBreak, rsUpper, "$"].join("|") + ")",
  rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [rsBreak, rsUpper + rsMiscLower, "$"].join("|") + ")",
  rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
  rsUpper + "+" + rsOptContrUpper,
  rsOrdUpper,
  rsOrdLower,
  rsDigits,
  rsEmoji
].join("|"), "g");
function unicodeWords$1(string2) {
  return string2.match(reUnicodeWord) || [];
}
var _unicodeWords = unicodeWords$1;
var asciiWords = _asciiWords, hasUnicodeWord = _hasUnicodeWord, toString$4 = toString_1, unicodeWords = _unicodeWords;
function words$1(string2, pattern, guard) {
  string2 = toString$4(string2);
  pattern = guard ? void 0 : pattern;
  if (pattern === void 0) {
    return hasUnicodeWord(string2) ? unicodeWords(string2) : asciiWords(string2);
  }
  return string2.match(pattern) || [];
}
var words_1 = words$1;
var arrayReduce = _arrayReduce, deburr$2 = deburr_1, words = words_1;
var rsApos = "['’]";
var reApos = RegExp(rsApos, "g");
function createCompounder$2(callback) {
  return function(string2) {
    return arrayReduce(words(deburr$2(string2).replace(reApos, "")), callback, "");
  };
}
var _createCompounder = createCompounder$2;
var createCompounder$1 = _createCompounder;
var snakeCase = createCompounder$1(function(result, word, index2) {
  return result + (index2 ? "_" : "") + word.toLowerCase();
});
var snakeCase_1 = snakeCase;
const snakeCase$1 = /* @__PURE__ */ getDefaultExportFromCjs(snakeCase_1);
function baseSlice$1(array2, start, end) {
  var index2 = -1, length = array2.length;
  if (start < 0) {
    start = -start > length ? 0 : length + start;
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : end - start >>> 0;
  start >>>= 0;
  var result = Array(length);
  while (++index2 < length) {
    result[index2] = array2[index2 + start];
  }
  return result;
}
var _baseSlice = baseSlice$1;
var baseSlice = _baseSlice;
function castSlice$1(array2, start, end) {
  var length = array2.length;
  end = end === void 0 ? length : end;
  return !start && end >= length ? array2 : baseSlice(array2, start, end);
}
var _castSlice = castSlice$1;
var rsAstralRange$1 = "\\ud800-\\udfff", rsComboMarksRange$2 = "\\u0300-\\u036f", reComboHalfMarksRange$1 = "\\ufe20-\\ufe2f", rsComboSymbolsRange$2 = "\\u20d0-\\u20ff", rsComboRange$1 = rsComboMarksRange$2 + reComboHalfMarksRange$1 + rsComboSymbolsRange$2, rsVarRange$1 = "\\ufe0e\\ufe0f";
var rsZWJ$1 = "\\u200d";
var reHasUnicode = RegExp("[" + rsZWJ$1 + rsAstralRange$1 + rsComboRange$1 + rsVarRange$1 + "]");
function hasUnicode$2(string2) {
  return reHasUnicode.test(string2);
}
var _hasUnicode = hasUnicode$2;
function asciiToArray$1(string2) {
  return string2.split("");
}
var _asciiToArray = asciiToArray$1;
var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange$1 = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange$1 = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange$1 + reComboHalfMarksRange + rsComboSymbolsRange$1, rsVarRange = "\\ufe0e\\ufe0f";
var rsAstral = "[" + rsAstralRange + "]", rsCombo$1 = "[" + rsComboRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo$1 + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsZWJ = "\\u200d";
var reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsSymbol = "(?:" + [rsNonAstral + rsCombo$1 + "?", rsCombo$1, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
function unicodeToArray$1(string2) {
  return string2.match(reUnicode) || [];
}
var _unicodeToArray = unicodeToArray$1;
var asciiToArray = _asciiToArray, hasUnicode$1 = _hasUnicode, unicodeToArray = _unicodeToArray;
function stringToArray$1(string2) {
  return hasUnicode$1(string2) ? unicodeToArray(string2) : asciiToArray(string2);
}
var _stringToArray = stringToArray$1;
var castSlice = _castSlice, hasUnicode = _hasUnicode, stringToArray = _stringToArray, toString$3 = toString_1;
function createCaseFirst$1(methodName) {
  return function(string2) {
    string2 = toString$3(string2);
    var strSymbols = hasUnicode(string2) ? stringToArray(string2) : void 0;
    var chr = strSymbols ? strSymbols[0] : string2.charAt(0);
    var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string2.slice(1);
    return chr[methodName]() + trailing;
  };
}
var _createCaseFirst = createCaseFirst$1;
var createCaseFirst = _createCaseFirst;
var upperFirst$1 = createCaseFirst("toUpperCase");
var upperFirst_1 = upperFirst$1;
var toString$2 = toString_1, upperFirst = upperFirst_1;
function capitalize$1(string2) {
  return upperFirst(toString$2(string2).toLowerCase());
}
var capitalize_1 = capitalize$1;
var capitalize = capitalize_1, createCompounder = _createCompounder;
var camelCase = createCompounder(function(result, word, index2) {
  word = word.toLowerCase();
  return result + (index2 ? capitalize(word) : word);
});
var camelCase_1 = camelCase;
const camelCase$1 = /* @__PURE__ */ getDefaultExportFromCjs(camelCase_1);
var baseAssignValue = _baseAssignValue, baseForOwn = _baseForOwn, baseIteratee = _baseIteratee;
function mapKeys(object2, iteratee) {
  var result = {};
  iteratee = baseIteratee(iteratee);
  baseForOwn(object2, function(value, key, object3) {
    baseAssignValue(result, iteratee(value, key, object3), value);
  });
  return result;
}
var mapKeys_1 = mapKeys;
const mapKeys$1 = /* @__PURE__ */ getDefaultExportFromCjs(mapKeys_1);
var toposort$2 = { exports: {} };
toposort$2.exports = function(edges) {
  return toposort(uniqueNodes(edges), edges);
};
toposort$2.exports.array = toposort;
function toposort(nodes, edges) {
  var cursor = nodes.length, sorted = new Array(cursor), visited = {}, i = cursor, outgoingEdges = makeOutgoingEdges(edges), nodesHash = makeNodesHash(nodes);
  edges.forEach(function(edge) {
    if (!nodesHash.has(edge[0]) || !nodesHash.has(edge[1])) {
      throw new Error("Unknown node. There is an unknown node in the supplied edges.");
    }
  });
  while (i--) {
    if (!visited[i]) visit(nodes[i], i, /* @__PURE__ */ new Set());
  }
  return sorted;
  function visit(node, i2, predecessors) {
    if (predecessors.has(node)) {
      var nodeRep;
      try {
        nodeRep = ", node was:" + JSON.stringify(node);
      } catch (e) {
        nodeRep = "";
      }
      throw new Error("Cyclic dependency" + nodeRep);
    }
    if (!nodesHash.has(node)) {
      throw new Error("Found unknown node. Make sure to provided all involved nodes. Unknown node: " + JSON.stringify(node));
    }
    if (visited[i2]) return;
    visited[i2] = true;
    var outgoing = outgoingEdges.get(node) || /* @__PURE__ */ new Set();
    outgoing = Array.from(outgoing);
    if (i2 = outgoing.length) {
      predecessors.add(node);
      do {
        var child = outgoing[--i2];
        visit(child, nodesHash.get(child), predecessors);
      } while (i2);
      predecessors.delete(node);
    }
    sorted[--cursor] = node;
  }
}
function uniqueNodes(arr) {
  var res = /* @__PURE__ */ new Set();
  for (var i = 0, len = arr.length; i < len; i++) {
    var edge = arr[i];
    res.add(edge[0]);
    res.add(edge[1]);
  }
  return Array.from(res);
}
function makeOutgoingEdges(arr) {
  var edges = /* @__PURE__ */ new Map();
  for (var i = 0, len = arr.length; i < len; i++) {
    var edge = arr[i];
    if (!edges.has(edge[0])) edges.set(edge[0], /* @__PURE__ */ new Set());
    if (!edges.has(edge[1])) edges.set(edge[1], /* @__PURE__ */ new Set());
    edges.get(edge[0]).add(edge[1]);
  }
  return edges;
}
function makeNodesHash(arr) {
  var res = /* @__PURE__ */ new Map();
  for (var i = 0, len = arr.length; i < len; i++) {
    res.set(arr[i], i);
  }
  return res;
}
var toposortExports = toposort$2.exports;
const toposort$1 = /* @__PURE__ */ getDefaultExportFromCjs(toposortExports);
function sortFields(fields2, excludes = []) {
  let edges = [];
  let nodes = [];
  function addNode(depPath, key) {
    var node = propertyExpr.split(depPath)[0];
    if (!~nodes.indexOf(node)) nodes.push(node);
    if (!~excludes.indexOf(`${key}-${node}`)) edges.push([key, node]);
  }
  for (const key in fields2) if (has$1(fields2, key)) {
    let value = fields2[key];
    if (!~nodes.indexOf(key)) nodes.push(key);
    if (Reference.isRef(value) && value.isSibling) addNode(value.path, key);
    else if (isSchema(value) && "deps" in value) value.deps.forEach((path2) => addNode(path2, key));
  }
  return toposort$1.array(nodes, edges).reverse();
}
function findIndex(arr, err) {
  let idx = Infinity;
  arr.some((key, ii) => {
    var _err$path;
    if (((_err$path = err.path) == null ? void 0 : _err$path.indexOf(key)) !== -1) {
      idx = ii;
      return true;
    }
  });
  return idx;
}
function sortByKeyOrder(keys2) {
  return (a, b) => {
    return findIndex(keys2, a) - findIndex(keys2, b);
  };
}
function _extends$1() {
  _extends$1 = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source2 = arguments[i];
      for (var key in source2) {
        if (Object.prototype.hasOwnProperty.call(source2, key)) {
          target[key] = source2[key];
        }
      }
    }
    return target;
  };
  return _extends$1.apply(this, arguments);
}
let isObject$1 = (obj) => Object.prototype.toString.call(obj) === "[object Object]";
function unknown$1(ctx, value) {
  let known = Object.keys(ctx.fields);
  return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}
const defaultSort = sortByKeyOrder([]);
class ObjectSchema extends BaseSchema {
  constructor(spec) {
    super({
      type: "object"
    });
    this.fields = /* @__PURE__ */ Object.create(null);
    this._sortErrors = defaultSort;
    this._nodes = [];
    this._excludedEdges = [];
    this.withMutation(() => {
      this.transform(function coerce(value) {
        if (typeof value === "string") {
          try {
            value = JSON.parse(value);
          } catch (err) {
            value = null;
          }
        }
        if (this.isType(value)) return value;
        return null;
      });
      if (spec) {
        this.shape(spec);
      }
    });
  }
  _typeCheck(value) {
    return isObject$1(value) || typeof value === "function";
  }
  _cast(_value, options2 = {}) {
    var _options$stripUnknown;
    let value = super._cast(_value, options2);
    if (value === void 0) return this.getDefault();
    if (!this._typeCheck(value)) return value;
    let fields2 = this.fields;
    let strip = (_options$stripUnknown = options2.stripUnknown) != null ? _options$stripUnknown : this.spec.noUnknown;
    let props = this._nodes.concat(Object.keys(value).filter((v) => this._nodes.indexOf(v) === -1));
    let intermediateValue = {};
    let innerOptions = _extends$1({}, options2, {
      parent: intermediateValue,
      __validating: options2.__validating || false
    });
    let isChanged = false;
    for (const prop of props) {
      let field = fields2[prop];
      let exists = has$1(value, prop);
      if (field) {
        let fieldValue;
        let inputValue = value[prop];
        innerOptions.path = (options2.path ? `${options2.path}.` : "") + prop;
        field = field.resolve({
          value: inputValue,
          context: options2.context,
          parent: intermediateValue
        });
        let fieldSpec = "spec" in field ? field.spec : void 0;
        let strict = fieldSpec == null ? void 0 : fieldSpec.strict;
        if (fieldSpec == null ? void 0 : fieldSpec.strip) {
          isChanged = isChanged || prop in value;
          continue;
        }
        fieldValue = !options2.__validating || !strict ? (
          // TODO: use _cast, this is double resolving
          field.cast(value[prop], innerOptions)
        ) : value[prop];
        if (fieldValue !== void 0) {
          intermediateValue[prop] = fieldValue;
        }
      } else if (exists && !strip) {
        intermediateValue[prop] = value[prop];
      }
      if (intermediateValue[prop] !== value[prop]) {
        isChanged = true;
      }
    }
    return isChanged ? intermediateValue : value;
  }
  _validate(_value, opts = {}, callback) {
    let errors = [];
    let {
      sync: sync2,
      from = [],
      originalValue = _value,
      abortEarly = this.spec.abortEarly,
      recursive = this.spec.recursive
    } = opts;
    from = [{
      schema: this,
      value: originalValue
    }, ...from];
    opts.__validating = true;
    opts.originalValue = originalValue;
    opts.from = from;
    super._validate(_value, opts, (err, value) => {
      if (err) {
        if (!ValidationError$1.isError(err) || abortEarly) {
          return void callback(err, value);
        }
        errors.push(err);
      }
      if (!recursive || !isObject$1(value)) {
        callback(errors[0] || null, value);
        return;
      }
      originalValue = originalValue || value;
      let tests = this._nodes.map((key) => (_2, cb) => {
        let path2 = key.indexOf(".") === -1 ? (opts.path ? `${opts.path}.` : "") + key : `${opts.path || ""}["${key}"]`;
        let field = this.fields[key];
        if (field && "validate" in field) {
          field.validate(value[key], _extends$1({}, opts, {
            // @ts-ignore
            path: path2,
            from,
            // inner fields are always strict:
            // 1. this isn't strict so the casting will also have cast inner values
            // 2. this is strict in which case the nested values weren't cast either
            strict: true,
            parent: value,
            originalValue: originalValue[key]
          }), cb);
          return;
        }
        cb(null);
      });
      runTests({
        tests,
        value,
        errors,
        endEarly: abortEarly,
        sort: this._sortErrors,
        path: opts.path
      }, callback);
    });
  }
  clone(spec) {
    const next = super.clone(spec);
    next.fields = _extends$1({}, this.fields);
    next._nodes = this._nodes;
    next._excludedEdges = this._excludedEdges;
    next._sortErrors = this._sortErrors;
    return next;
  }
  concat(schema2) {
    let next = super.concat(schema2);
    let nextFields = next.fields;
    for (let [field, schemaOrRef] of Object.entries(this.fields)) {
      const target = nextFields[field];
      if (target === void 0) {
        nextFields[field] = schemaOrRef;
      } else if (target instanceof BaseSchema && schemaOrRef instanceof BaseSchema) {
        nextFields[field] = schemaOrRef.concat(target);
      }
    }
    return next.withMutation(() => next.shape(nextFields));
  }
  getDefaultFromShape() {
    let dft = {};
    this._nodes.forEach((key) => {
      const field = this.fields[key];
      dft[key] = "default" in field ? field.getDefault() : void 0;
    });
    return dft;
  }
  _getDefault() {
    if ("default" in this.spec) {
      return super._getDefault();
    }
    if (!this._nodes.length) {
      return void 0;
    }
    return this.getDefaultFromShape();
  }
  shape(additions, excludes = []) {
    let next = this.clone();
    let fields2 = Object.assign(next.fields, additions);
    next.fields = fields2;
    next._sortErrors = sortByKeyOrder(Object.keys(fields2));
    if (excludes.length) {
      if (!Array.isArray(excludes[0])) excludes = [excludes];
      let keys2 = excludes.map(([first, second]) => `${first}-${second}`);
      next._excludedEdges = next._excludedEdges.concat(keys2);
    }
    next._nodes = sortFields(fields2, next._excludedEdges);
    return next;
  }
  pick(keys2) {
    const picked = {};
    for (const key of keys2) {
      if (this.fields[key]) picked[key] = this.fields[key];
    }
    return this.clone().withMutation((next) => {
      next.fields = {};
      return next.shape(picked);
    });
  }
  omit(keys2) {
    const next = this.clone();
    const fields2 = next.fields;
    next.fields = {};
    for (const key of keys2) {
      delete fields2[key];
    }
    return next.withMutation(() => next.shape(fields2));
  }
  from(from, to, alias) {
    let fromGetter = propertyExpr.getter(from, true);
    return this.transform((obj) => {
      if (obj == null) return obj;
      let newObj = obj;
      if (has$1(obj, from)) {
        newObj = _extends$1({}, obj);
        if (!alias) delete newObj[from];
        newObj[to] = fromGetter(obj);
      }
      return newObj;
    });
  }
  noUnknown(noAllow = true, message = object$1.noUnknown) {
    if (typeof noAllow === "string") {
      message = noAllow;
      noAllow = true;
    }
    let next = this.test({
      name: "noUnknown",
      exclusive: true,
      message,
      test(value) {
        if (value == null) return true;
        const unknownKeys = unknown$1(this.schema, value);
        return !noAllow || unknownKeys.length === 0 || this.createError({
          params: {
            unknown: unknownKeys.join(", ")
          }
        });
      }
    });
    next.spec.noUnknown = noAllow;
    return next;
  }
  unknown(allow = true, message = object$1.noUnknown) {
    return this.noUnknown(!allow, message);
  }
  transformKeys(fn) {
    return this.transform((obj) => obj && mapKeys$1(obj, (_2, key) => fn(key)));
  }
  camelCase() {
    return this.transformKeys(camelCase$1);
  }
  snakeCase() {
    return this.transformKeys(snakeCase$1);
  }
  constantCase() {
    return this.transformKeys((key) => snakeCase$1(key).toUpperCase());
  }
  describe() {
    let base = super.describe();
    base.fields = mapValues$1(this.fields, (value) => value.describe());
    return base;
  }
}
function create$1(spec) {
  return new ObjectSchema(spec);
}
create$1.prototype = ObjectSchema.prototype;
function _extends() {
  _extends = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source2 = arguments[i];
      for (var key in source2) {
        if (Object.prototype.hasOwnProperty.call(source2, key)) {
          target[key] = source2[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function create(type) {
  return new ArraySchema(type);
}
class ArraySchema extends BaseSchema {
  constructor(type) {
    super({
      type: "array"
    });
    this.innerType = type;
    this.withMutation(() => {
      this.transform(function(values) {
        if (typeof values === "string") try {
          values = JSON.parse(values);
        } catch (err) {
          values = null;
        }
        return this.isType(values) ? values : null;
      });
    });
  }
  _typeCheck(v) {
    return Array.isArray(v);
  }
  get _subType() {
    return this.innerType;
  }
  _cast(_value, _opts) {
    const value = super._cast(_value, _opts);
    if (!this._typeCheck(value) || !this.innerType) return value;
    let isChanged = false;
    const castArray = value.map((v, idx) => {
      const castElement = this.innerType.cast(v, _extends({}, _opts, {
        path: `${_opts.path || ""}[${idx}]`
      }));
      if (castElement !== v) {
        isChanged = true;
      }
      return castElement;
    });
    return isChanged ? castArray : value;
  }
  _validate(_value, options2 = {}, callback) {
    var _options$abortEarly, _options$recursive;
    let errors = [];
    options2.sync;
    let path2 = options2.path;
    let innerType = this.innerType;
    let endEarly = (_options$abortEarly = options2.abortEarly) != null ? _options$abortEarly : this.spec.abortEarly;
    let recursive = (_options$recursive = options2.recursive) != null ? _options$recursive : this.spec.recursive;
    let originalValue = options2.originalValue != null ? options2.originalValue : _value;
    super._validate(_value, options2, (err, value) => {
      if (err) {
        if (!ValidationError$1.isError(err) || endEarly) {
          return void callback(err, value);
        }
        errors.push(err);
      }
      if (!recursive || !innerType || !this._typeCheck(value)) {
        callback(errors[0] || null, value);
        return;
      }
      originalValue = originalValue || value;
      let tests = new Array(value.length);
      for (let idx = 0; idx < value.length; idx++) {
        let item = value[idx];
        let path3 = `${options2.path || ""}[${idx}]`;
        let innerOptions = _extends({}, options2, {
          path: path3,
          strict: true,
          parent: value,
          index: idx,
          originalValue: originalValue[idx]
        });
        tests[idx] = (_2, cb) => innerType.validate(item, innerOptions, cb);
      }
      runTests({
        path: path2,
        value,
        errors,
        endEarly,
        tests
      }, callback);
    });
  }
  clone(spec) {
    const next = super.clone(spec);
    next.innerType = this.innerType;
    return next;
  }
  concat(schema2) {
    let next = super.concat(schema2);
    next.innerType = this.innerType;
    if (schema2.innerType) next.innerType = next.innerType ? (
      // @ts-expect-error Lazy doesn't have concat()
      next.innerType.concat(schema2.innerType)
    ) : schema2.innerType;
    return next;
  }
  of(schema2) {
    let next = this.clone();
    if (!isSchema(schema2)) throw new TypeError("`array.of()` sub-schema must be a valid yup schema not: " + printValue$1(schema2));
    next.innerType = schema2;
    return next;
  }
  length(length, message = array$1.length) {
    return this.test({
      message,
      name: "length",
      exclusive: true,
      params: {
        length
      },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
      }
    });
  }
  min(min, message) {
    message = message || array$1.min;
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        min
      },
      // FIXME(ts): Array<typeof T>
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min);
      }
    });
  }
  max(max, message) {
    message = message || array$1.max;
    return this.test({
      message,
      name: "max",
      exclusive: true,
      params: {
        max
      },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max);
      }
    });
  }
  ensure() {
    return this.default(() => []).transform((val, original) => {
      if (this._typeCheck(val)) return val;
      return original == null ? [] : [].concat(original);
    });
  }
  compact(rejector) {
    let reject = !rejector ? (v) => !!v : (v, i, a) => !rejector(v, i, a);
    return this.transform((values) => values != null ? values.filter(reject) : values);
  }
  describe() {
    let base = super.describe();
    if (this.innerType) base.innerType = this.innerType.describe();
    return base;
  }
  nullable(isNullable = true) {
    return super.nullable(isNullable);
  }
  defined() {
    return super.defined();
  }
  required(msg) {
    return super.required(msg);
  }
}
create.prototype = ArraySchema.prototype;
function setLocale(custom) {
  Object.keys(custom).forEach((type) => {
    Object.keys(custom[type]).forEach((method) => {
      locale[type][method] = custom[type][method];
    });
  });
}
function addMethod(schemaType, name, fn) {
  if (!schemaType || !isSchema(schemaType.prototype)) throw new TypeError("You must provide a yup schema constructor function");
  if (typeof name !== "string") throw new TypeError("A Method name must be provided");
  if (typeof fn !== "function") throw new TypeError("Method function must be provided");
  schemaType.prototype[name] = fn;
}
var httpErrors = { exports: {} };
/*!
 * depd
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var browser = depd;
function depd(namespace) {
  if (!namespace) {
    throw new TypeError("argument namespace is required");
  }
  function deprecate(message) {
  }
  deprecate._file = void 0;
  deprecate._ignored = true;
  deprecate._namespace = namespace;
  deprecate._traced = false;
  deprecate._warned = /* @__PURE__ */ Object.create(null);
  deprecate.function = wrapfunction;
  deprecate.property = wrapproperty;
  return deprecate;
}
function wrapfunction(fn, message) {
  if (typeof fn !== "function") {
    throw new TypeError("argument fn must be a function");
  }
  return fn;
}
function wrapproperty(obj, prop, message) {
  if (!obj || typeof obj !== "object" && typeof obj !== "function") {
    throw new TypeError("argument obj must be object");
  }
  var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
  if (!descriptor) {
    throw new TypeError("must call property on owner object");
  }
  if (!descriptor.configurable) {
    throw new TypeError("property must be configurable");
  }
}
var setprototypeof = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? setProtoOf : mixinProperties);
function setProtoOf(obj, proto) {
  obj.__proto__ = proto;
  return obj;
}
function mixinProperties(obj, proto) {
  for (var prop in proto) {
    if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
      obj[prop] = proto[prop];
    }
  }
  return obj;
}
const require$$0 = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "103": "Early Hints",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a Teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Too Early",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
};
/*!
 * statuses
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
var codes = require$$0;
var statuses = status;
status.message = codes;
status.code = createMessageToStatusCodeMap(codes);
status.codes = createStatusCodeList(codes);
status.redirect = {
  300: true,
  301: true,
  302: true,
  303: true,
  305: true,
  307: true,
  308: true
};
status.empty = {
  204: true,
  205: true,
  304: true
};
status.retry = {
  502: true,
  503: true,
  504: true
};
function createMessageToStatusCodeMap(codes2) {
  var map2 = {};
  Object.keys(codes2).forEach(function forEachCode(code) {
    var message = codes2[code];
    var status2 = Number(code);
    map2[message.toLowerCase()] = status2;
  });
  return map2;
}
function createStatusCodeList(codes2) {
  return Object.keys(codes2).map(function mapCode(code) {
    return Number(code);
  });
}
function getStatusCode(message) {
  var msg = message.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(status.code, msg)) {
    throw new Error('invalid status message: "' + message + '"');
  }
  return status.code[msg];
}
function getStatusMessage(code) {
  if (!Object.prototype.hasOwnProperty.call(status.message, code)) {
    throw new Error("invalid status code: " + code);
  }
  return status.message[code];
}
function status(code) {
  if (typeof code === "number") {
    return getStatusMessage(code);
  }
  if (typeof code !== "string") {
    throw new TypeError("code must be a number or string");
  }
  var n = parseInt(code, 10);
  if (!isNaN(n)) {
    return getStatusMessage(n);
  }
  return getStatusCode(code);
}
var inherits_browser = { exports: {} };
if (typeof Object.create === "function") {
  inherits_browser.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
} else {
  inherits_browser.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function() {
      };
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    }
  };
}
var inherits_browserExports = inherits_browser.exports;
/*!
 * toidentifier
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
var toidentifier = toIdentifier;
function toIdentifier(str) {
  return str.split(" ").map(function(token) {
    return token.slice(0, 1).toUpperCase() + token.slice(1);
  }).join("").replace(/[^ _0-9a-z]/gi, "");
}
/*!
 * http-errors
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
(function(module) {
  browser("http-errors");
  var setPrototypeOf = setprototypeof;
  var statuses$1 = statuses;
  var inherits = inherits_browserExports;
  var toIdentifier2 = toidentifier;
  module.exports = createError;
  module.exports.HttpError = createHttpErrorConstructor();
  module.exports.isHttpError = createIsHttpErrorFunction(module.exports.HttpError);
  populateConstructorExports(module.exports, statuses$1.codes, module.exports.HttpError);
  function codeClass(status2) {
    return Number(String(status2).charAt(0) + "00");
  }
  function createError() {
    var err;
    var msg;
    var status2 = 500;
    var props = {};
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      var type = typeof arg;
      if (type === "object" && arg instanceof Error) {
        err = arg;
        status2 = err.status || err.statusCode || status2;
      } else if (type === "number" && i === 0) {
        status2 = arg;
      } else if (type === "string") {
        msg = arg;
      } else if (type === "object") {
        props = arg;
      } else {
        throw new TypeError("argument #" + (i + 1) + " unsupported type " + type);
      }
    }
    if (typeof status2 !== "number" || !statuses$1.message[status2] && (status2 < 400 || status2 >= 600)) {
      status2 = 500;
    }
    var HttpError = createError[status2] || createError[codeClass(status2)];
    if (!err) {
      err = HttpError ? new HttpError(msg) : new Error(msg || statuses$1.message[status2]);
      Error.captureStackTrace(err, createError);
    }
    if (!HttpError || !(err instanceof HttpError) || err.status !== status2) {
      err.expose = status2 < 500;
      err.status = err.statusCode = status2;
    }
    for (var key in props) {
      if (key !== "status" && key !== "statusCode") {
        err[key] = props[key];
      }
    }
    return err;
  }
  function createHttpErrorConstructor() {
    function HttpError() {
      throw new TypeError("cannot construct abstract class");
    }
    inherits(HttpError, Error);
    return HttpError;
  }
  function createClientErrorConstructor(HttpError, name, code) {
    var className = toClassName(name);
    function ClientError(message) {
      var msg = message != null ? message : statuses$1.message[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ClientError);
      setPrototypeOf(err, ClientError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits(ClientError, HttpError);
    nameFunc(ClientError, className);
    ClientError.prototype.status = code;
    ClientError.prototype.statusCode = code;
    ClientError.prototype.expose = true;
    return ClientError;
  }
  function createIsHttpErrorFunction(HttpError) {
    return function isHttpError(val) {
      if (!val || typeof val !== "object") {
        return false;
      }
      if (val instanceof HttpError) {
        return true;
      }
      return val instanceof Error && typeof val.expose === "boolean" && typeof val.statusCode === "number" && val.status === val.statusCode;
    };
  }
  function createServerErrorConstructor(HttpError, name, code) {
    var className = toClassName(name);
    function ServerError(message) {
      var msg = message != null ? message : statuses$1.message[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ServerError);
      setPrototypeOf(err, ServerError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits(ServerError, HttpError);
    nameFunc(ServerError, className);
    ServerError.prototype.status = code;
    ServerError.prototype.statusCode = code;
    ServerError.prototype.expose = false;
    return ServerError;
  }
  function nameFunc(func, name) {
    var desc = Object.getOwnPropertyDescriptor(func, "name");
    if (desc && desc.configurable) {
      desc.value = name;
      Object.defineProperty(func, "name", desc);
    }
  }
  function populateConstructorExports(exports, codes2, HttpError) {
    codes2.forEach(function forEachCode(code) {
      var CodeError;
      var name = toIdentifier2(statuses$1.message[code]);
      switch (codeClass(code)) {
        case 400:
          CodeError = createClientErrorConstructor(HttpError, name, code);
          break;
        case 500:
          CodeError = createServerErrorConstructor(HttpError, name, code);
          break;
      }
      if (CodeError) {
        exports[code] = CodeError;
        exports[name] = CodeError;
      }
    });
  }
  function toClassName(name) {
    return name.substr(-5) !== "Error" ? name + "Error" : name;
  }
})(httpErrors);
class ApplicationError extends Error {
  constructor(message = "An application error occurred", details = {}) {
    super();
    this.name = "ApplicationError";
    this.message = message;
    this.details = details;
  }
}
class ValidationError2 extends ApplicationError {
  constructor(message, details) {
    super(message, details);
    this.name = "ValidationError";
  }
}
const GROUP_OPERATORS = [
  "$and",
  "$or"
];
const WHERE_OPERATORS = [
  "$not",
  "$in",
  "$notIn",
  "$eq",
  "$eqi",
  "$ne",
  "$nei",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$null",
  "$notNull",
  "$between",
  "$startsWith",
  "$endsWith",
  "$startsWithi",
  "$endsWithi",
  "$contains",
  "$notContains",
  "$containsi",
  "$notContainsi",
  // Experimental, only for internal use
  "$jsonSupersetOf"
];
const CAST_OPERATORS = [
  "$not",
  "$in",
  "$notIn",
  "$eq",
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$between"
];
const ARRAY_OPERATORS = [
  "$in",
  "$notIn",
  "$between"
];
const OPERATORS = {
  where: WHERE_OPERATORS,
  cast: CAST_OPERATORS,
  group: GROUP_OPERATORS,
  array: ARRAY_OPERATORS
};
const OPERATORS_LOWERCASE = Object.fromEntries(Object.entries(OPERATORS).map(([key, values]) => [
  key,
  values.map((value) => value.toLowerCase())
]));
const isObjKey = (key, obj) => {
  return key in obj;
};
const isOperatorOfType = (type, key, ignoreCase = false) => {
  if (ignoreCase) {
    return OPERATORS_LOWERCASE[type]?.includes(key.toLowerCase()) ?? false;
  }
  if (isObjKey(type, OPERATORS)) {
    return OPERATORS[type]?.includes(key) ?? false;
  }
  return false;
};
const isOperator = (key, ignoreCase = false) => {
  return Object.keys(OPERATORS).some((type) => isOperatorOfType(type, key, ignoreCase));
};
const isPlainObject$1 = (value) => _.isPlainObject(value);
function getMeaningfulSortSegments(sort2) {
  return sort2.split(",").map((segment) => segment.trim()).filter((segment) => {
    if (segment.length === 0) {
      return false;
    }
    const [field] = segment.split(":");
    return field.trim().length > 0;
  });
}
function hasMeaningfulSortObject(sort2) {
  return Object.keys(sort2).some((key) => {
    const order = sort2[key];
    if (typeof order === "string") {
      return order.length > 0;
    }
    if (isPlainObject$1(order)) {
      return hasMeaningfulSortObject(order);
    }
    return false;
  });
}
function hasMeaningfulStringSort(sort2) {
  return getMeaningfulSortSegments(sort2).length > 0;
}
function hasSort(sort2) {
  if (sort2 === void 0 || sort2 === null) {
    return false;
  }
  if (typeof sort2 === "string") {
    return hasMeaningfulStringSort(sort2);
  }
  if (Array.isArray(sort2)) {
    if (sort2.length === 0) {
      return false;
    }
    return sort2.some((item) => {
      if (typeof item === "string") {
        return hasMeaningfulStringSort(item);
      }
      if (isPlainObject$1(item)) {
        return hasMeaningfulSortObject(item);
      }
      return false;
    });
  }
  if (isPlainObject$1(sort2)) {
    return hasMeaningfulSortObject(sort2);
  }
  return false;
}
var indentString$1 = (string2, count = 1, options2) => {
  options2 = {
    indent: " ",
    includeEmptyLines: false,
    ...options2
  };
  if (typeof string2 !== "string") {
    throw new TypeError(
      `Expected \`input\` to be a \`string\`, got \`${typeof string2}\``
    );
  }
  if (typeof count !== "number") {
    throw new TypeError(
      `Expected \`count\` to be a \`number\`, got \`${typeof count}\``
    );
  }
  if (typeof options2.indent !== "string") {
    throw new TypeError(
      `Expected \`options.indent\` to be a \`string\`, got \`${typeof options2.indent}\``
    );
  }
  if (count === 0) {
    return string2;
  }
  const regex = options2.includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
  return string2.replace(regex, options2.indent.repeat(count));
};
const os$1 = require$$0$2;
const extractPathRegex = /\s+at.*(?:\(|\s)(.*)\)?/;
const pathRegex = /^(?:(?:(?:node|(?:internal\/[\w/]*|.*node_modules\/(?:babel-polyfill|pirates)\/.*)?\w+)\.js:\d+:\d+)|native)/;
const homeDir = typeof os$1.homedir === "undefined" ? "" : os$1.homedir();
var cleanStack$1 = (stack, options2) => {
  options2 = Object.assign({ pretty: false }, options2);
  return stack.replace(/\\/g, "/").split("\n").filter((line) => {
    const pathMatches = line.match(extractPathRegex);
    if (pathMatches === null || !pathMatches[1]) {
      return true;
    }
    const match = pathMatches[1];
    if (match.includes(".app/Contents/Resources/electron.asar") || match.includes(".app/Contents/Resources/default_app.asar")) {
      return false;
    }
    return !pathRegex.test(match);
  }).filter((line) => line.trim() !== "").map((line) => {
    if (options2.pretty) {
      return line.replace(extractPathRegex, (m, p1) => m.replace(p1, p1.replace(homeDir, "~")));
    }
    return line;
  }).join("\n");
};
const indentString = indentString$1;
const cleanStack = cleanStack$1;
const cleanInternalStack = (stack) => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, "");
let AggregateError$1 = class AggregateError extends Error {
  constructor(errors) {
    if (!Array.isArray(errors)) {
      throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
    }
    errors = [...errors].map((error2) => {
      if (error2 instanceof Error) {
        return error2;
      }
      if (error2 !== null && typeof error2 === "object") {
        return Object.assign(new Error(error2.message), error2);
      }
      return new Error(error2);
    });
    let message = errors.map((error2) => {
      return typeof error2.stack === "string" ? cleanInternalStack(cleanStack(error2.stack)) : String(error2);
    }).join("\n");
    message = "\n" + indentString(message, 4);
    super(message);
    this.name = "AggregateError";
    Object.defineProperty(this, "_errors", { value: errors });
  }
  *[Symbol.iterator]() {
    for (const error2 of this._errors) {
      yield error2;
    }
  }
};
var aggregateError = AggregateError$1;
const AggregateError2 = aggregateError;
var pMap = async (iterable, mapper, {
  concurrency = Infinity,
  stopOnError = true
} = {}) => {
  return new Promise((resolve, reject) => {
    if (typeof mapper !== "function") {
      throw new TypeError("Mapper function is required");
    }
    if (!((Number.isSafeInteger(concurrency) || concurrency === Infinity) && concurrency >= 1)) {
      throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
    }
    const result = [];
    const errors = [];
    const iterator = iterable[Symbol.iterator]();
    let isRejected = false;
    let isIterableDone = false;
    let resolvingCount = 0;
    let currentIndex = 0;
    const next = () => {
      if (isRejected) {
        return;
      }
      const nextItem = iterator.next();
      const index2 = currentIndex;
      currentIndex++;
      if (nextItem.done) {
        isIterableDone = true;
        if (resolvingCount === 0) {
          if (!stopOnError && errors.length !== 0) {
            reject(new AggregateError2(errors));
          } else {
            resolve(result);
          }
        }
        return;
      }
      resolvingCount++;
      (async () => {
        try {
          const element = await nextItem.value;
          result[index2] = await mapper(element, index2);
          resolvingCount--;
          next();
        } catch (error2) {
          if (stopOnError) {
            isRejected = true;
            reject(error2);
          } else {
            errors.push(error2);
            resolvingCount--;
            next();
          }
        }
      })();
    };
    for (let i = 0; i < concurrency; i++) {
      next();
      if (isIterableDone) {
        break;
      }
    }
  });
};
const pMap$1 = /* @__PURE__ */ getDefaultExportFromCjs(pMap);
function pipe$1(...fns) {
  const [firstFn, ...fnRest] = fns;
  return async (...args) => {
    let res = await firstFn.apply(firstFn, args);
    for (let i = 0; i < fnRest.length; i += 1) {
      res = await fnRest[i](res);
    }
    return res;
  };
}
curry(pMap$1);
const visitor$8 = ({ key, attribute }, { remove }) => {
  if (attribute?.type === "password") {
    remove(key);
  }
};
const visitor$7 = ({ schema: schema2, key, attribute }, { remove }) => {
  if (!attribute) {
    return;
  }
  const isPrivate = attribute.private === true || isPrivateAttribute(schema2, key);
  if (isPrivate) {
    remove(key);
  }
};
const visitor$6 = ({ key, attribute }, { remove }) => {
  if (isMorphToRelationalAttribute(attribute)) {
    remove(key);
  }
};
const visitor$5 = ({ key, attribute }, { remove }) => {
  if (isDynamicZoneAttribute(attribute)) {
    remove(key);
  }
};
const visitor$4 = ({ schema: schema2, key, value }, { set: set2 }) => {
  if (key === "" && value === "*") {
    const { attributes: attributes2 } = schema2;
    const newPopulateQuery = Object.entries(attributes2).filter(([, attribute]) => [
      "relation",
      "component",
      "media",
      "dynamiczone"
    ].includes(attribute.type)).reduce((acc, [key2]) => ({
      ...acc,
      [key2]: true
    }), {});
    set2("", newPopulateQuery);
  }
};
const DEFAULT_PATH = {
  raw: null,
  attribute: null
};
var traverseFactory = () => {
  const state = {
    parsers: [],
    interceptors: [],
    ignore: [],
    handlers: {
      attributes: [],
      common: []
    }
  };
  const traverse = async (visitor2, options2, data) => {
    const { path: path2 = DEFAULT_PATH, parent, schema: schema2, getModel } = options2 ?? {};
    for (const { predicate, handler } of state.interceptors) {
      if (predicate(data)) {
        return handler(visitor2, options2, data, {
          recurse: traverse
        });
      }
    }
    const parser = state.parsers.find((parser2) => parser2.predicate(data))?.parser;
    const utils2 = parser?.(data);
    if (!utils2) {
      return data;
    }
    let out = utils2.transform(data);
    const keys2 = utils2.keys(out);
    const handlers = [
      ...state.handlers.common,
      ...state.handlers.attributes
    ];
    const transformUtils = {
      remove(key) {
        out = utils2.remove(key, out);
      },
      set(key, value) {
        out = utils2.set(key, value, out);
      },
      recurse: traverse
    };
    const visitorUtils = {
      remove: transformUtils.remove,
      set: transformUtils.set
    };
    const handlerUtils = {
      set: transformUtils.set,
      recurse: transformUtils.recurse
    };
    for (const key of keys2) {
      const attribute = schema2?.attributes?.[key];
      let attributePath = path2.attribute;
      if (attribute != null) {
        attributePath = path2.attribute == null ? key : `${path2.attribute}.${key}`;
      }
      const newPath = {
        raw: path2.raw == null ? key : `${path2.raw}.${key}`,
        attribute: attributePath
      };
      const visitorOptions = {
        key,
        value: utils2.get(key, out),
        attribute,
        schema: schema2,
        path: newPath,
        data: out,
        getModel,
        parent
      };
      await visitor2(visitorOptions, visitorUtils);
      const value = utils2.get(key, out);
      const createContext = () => ({
        key,
        value,
        attribute,
        schema: schema2,
        path: newPath,
        data: out,
        visitor: visitor2,
        getModel,
        parent
      });
      const ignoreCtx = createContext();
      const shouldIgnore = state.ignore.some((predicate) => predicate(ignoreCtx));
      if (shouldIgnore) {
        continue;
      }
      for (const handler of handlers) {
        const ctx = createContext();
        const predicated = handler.predicate(ctx);
        const pass = predicated != null && typeof predicated.then === "function" ? await predicated : predicated;
        if (pass) {
          const handled = handler.handler(ctx, handlerUtils);
          if (handled != null && typeof handled.then === "function") {
            await handled;
          }
        }
      }
    }
    return out;
  };
  return {
    traverse,
    intercept(predicate, handler) {
      state.interceptors.push({
        predicate,
        handler
      });
      return this;
    },
    parse(predicate, parser) {
      state.parsers.push({
        predicate,
        parser
      });
      return this;
    },
    ignore(predicate) {
      state.ignore.push(predicate);
      return this;
    },
    on(predicate, handler) {
      state.handlers.common.push({
        predicate,
        handler
      });
      return this;
    },
    onAttribute(predicate, handler) {
      state.handlers.attributes.push({
        predicate,
        handler
      });
      return this;
    },
    onRelation(handler) {
      return this.onAttribute(({ attribute }) => attribute?.type === "relation", handler);
    },
    onMedia(handler) {
      return this.onAttribute(({ attribute }) => attribute?.type === "media", handler);
    },
    onComponent(handler) {
      return this.onAttribute(({ attribute }) => attribute?.type === "component", handler);
    },
    onDynamicZone(handler) {
      return this.onAttribute(({ attribute }) => attribute?.type === "dynamiczone", handler);
    }
  };
};
const isObj$2 = (value) => lodashExports.isObject(value);
const isFilterLikeObject = (value, schema2) => Object.keys(value).some((k) => isOperator(k) || Boolean(schema2?.attributes?.[k]));
const filters = traverseFactory().intercept(
  // Intercept filters arrays and apply the traversal to each one individually
  Array.isArray,
  async (visitor2, options2, filters2, { recurse }) => {
    return Promise.all(filters2.map((filter, i) => {
      const newPath = options2.path ? {
        ...options2.path,
        raw: `${options2.path.raw}[${i}]`
      } : options2.path;
      return recurse(visitor2, {
        ...options2,
        path: newPath
      }, filter);
    })).then((res) => res.filter((val) => !(lodashExports.isObject(val) && lodashExports.isEmpty(val))));
  }
).intercept(
  // Ignore non object filters and return the value as-is
  (filters2) => !lodashExports.isObject(filters2),
  (_2, __, filters2) => {
    return filters2;
  }
).parse(isObj$2, () => ({
  transform: lodashExports.cloneDeep,
  remove(key, data) {
    return lodashExports.omit(data, key);
  },
  set(key, value, data) {
    return {
      ...data,
      [key]: value
    };
  },
  keys(data) {
    return Object.keys(data);
  },
  get(key, data) {
    return data[key];
  }
})).ignore(({ value }) => value == null).on(({ attribute }) => attribute == null, async ({ key, visitor: visitor2, path: path2, value, schema: schema2, getModel, attribute }, { set: set2, recurse }) => {
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  if (isOperator(key) && key !== "$not" && isObj$2(value) && !Array.isArray(value) && !isFilterLikeObject(value, schema2)) {
    set2(key, value);
    return;
  }
  set2(key, await recurse(visitor2, {
    schema: schema2,
    path: path2,
    getModel,
    parent
  }, value));
}).onRelation(async ({ key, attribute, visitor: visitor2, path: path2, value, schema: schema2, getModel }, { set: set2, recurse }) => {
  const isMorphRelation = attribute.relation.toLowerCase().startsWith("morph");
  if (isMorphRelation) {
    return;
  }
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchemaUID = attribute.target;
  const targetSchema = getModel(targetSchemaUID);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onComponent(async ({ key, attribute, visitor: visitor2, path: path2, schema: schema2, value, getModel }, { set: set2, recurse }) => {
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchema = getModel(attribute.component);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onMedia(async ({ key, visitor: visitor2, path: path2, schema: schema2, attribute, value, getModel }, { set: set2, recurse }) => {
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchemaUID = "plugin::upload.file";
  const targetSchema = getModel(targetSchemaUID);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onAttribute(({ attribute, value }) => Boolean(isScalarAttribute(attribute)) && isObj$2(value) && !Array.isArray(value), async ({ key, visitor: visitor2, path: path2, value, schema: schema2, getModel, attribute }, { set: set2, recurse }) => {
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  set2(key, await recurse(visitor2, {
    schema: schema2,
    path: path2,
    getModel,
    parent
  }, value));
});
var traverseQueryFilters = curry(filters.traverse);
const ORDERS = {
  asc: "asc",
  desc: "desc"
};
const ORDER_VALUES = Object.values(ORDERS);
const isSortOrder = (value) => ORDER_VALUES.includes(value.toLowerCase());
const isStringArray$2 = (value) => Array.isArray(value) && value.every(lodashExports.isString);
const isObjectArray = (value) => Array.isArray(value) && value.every(lodashExports.isObject);
const isNestedSorts = (value) => lodashExports.isString(value) && value.split(",").length > 1;
const isObj$1 = (value) => lodashExports.isObject(value);
const isMeaninglessSortArray = (value) => Array.isArray(value) && !hasSort(value);
const sort = traverseFactory().intercept(isMeaninglessSortArray, async (_visitor, _options, sort2) => sort2).intercept(
  // String with chained sorts (foo,bar,foobar) => split, map(recurse), then recompose
  isNestedSorts,
  async (visitor2, options2, sort2, { recurse }) => {
    return Promise.all(sort2.split(",").map((value) => value.trim()).map((nestedSort) => recurse(visitor2, options2, nestedSort))).then((res) => res.filter((part) => !lodashExports.isEmpty(part)).join(","));
  }
).intercept(
  // Array of strings ['foo', 'foo,bar'] => map(recurse), then filter out empty items
  isStringArray$2,
  async (visitor2, options2, sort2, { recurse }) => {
    return Promise.all(sort2.map((nestedSort) => recurse(visitor2, options2, nestedSort))).then((res) => res.filter((nestedSort) => !lodashExports.isEmpty(nestedSort)));
  }
).intercept(
  // Array of objects [{ foo: 'asc' }, { bar: 'desc', baz: 'asc' }] => map(recurse), then filter out empty items
  isObjectArray,
  async (visitor2, options2, sort2, { recurse }) => {
    return Promise.all(sort2.map((nestedSort) => recurse(visitor2, options2, nestedSort))).then((res) => res.filter((nestedSort) => !lodashExports.isEmpty(nestedSort)));
  }
).parse(lodashExports.isString, () => {
  const tokenize = (value) => (value ?? "").split(".").flatMap((part) => part.split(":"));
  const recompose = (parts) => {
    if (parts.length === 0) {
      return void 0;
    }
    return parts.reduce((acc, part) => {
      if (lodashExports.isEmpty(part)) {
        return acc;
      }
      if (acc === "") {
        return part;
      }
      return isSortOrder(part) ? `${acc}:${part}` : `${acc}.${part}`;
    }, "");
  };
  return {
    transform: (value) => value.trim(),
    remove(key, data) {
      const [root2] = tokenize(data);
      return root2 === key ? void 0 : data;
    },
    set(key, value, data) {
      const [root2] = tokenize(data);
      if (root2 !== key) {
        return data;
      }
      return value == null ? root2 : `${root2}.${value}`;
    },
    keys(data) {
      const v = tokenize(data)[0];
      return v ? [
        v
      ] : [];
    },
    get(key, data) {
      const [root2, ...rest] = tokenize(data);
      return key === root2 ? recompose(rest) : void 0;
    }
  };
}).parse(isObj$1, () => ({
  transform: lodashExports.cloneDeep,
  remove(key, data) {
    const { [key]: ignored, ...rest } = data;
    return rest;
  },
  set(key, value, data) {
    return {
      ...data,
      [key]: value
    };
  },
  keys(data) {
    return Object.keys(data);
  },
  get(key, data) {
    return data[key];
  }
})).onRelation(async ({ key, value, attribute, visitor: visitor2, path: path2, getModel, schema: schema2 }, { set: set2, recurse }) => {
  const isMorphRelation = attribute.relation.toLowerCase().startsWith("morph");
  if (isMorphRelation) {
    return;
  }
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchemaUID = attribute.target;
  const targetSchema = getModel(targetSchemaUID);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onMedia(async ({ key, path: path2, schema: schema2, attribute, visitor: visitor2, value, getModel }, { recurse, set: set2 }) => {
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchemaUID = "plugin::upload.file";
  const targetSchema = getModel(targetSchemaUID);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onComponent(async ({ key, value, visitor: visitor2, path: path2, schema: schema2, attribute, getModel }, { recurse, set: set2 }) => {
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchema = getModel(attribute.component);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
});
var traverseQuerySort = curry(sort.traverse);
const DEFAULT_QS_ARRAY_LIMIT = 100;
const isQsArrayLimitPopulateObject = (value) => {
  if (!lodashExports.isObject(value) || Array.isArray(value)) {
    return false;
  }
  const keys2 = Object.keys(value);
  if (keys2.length === 0 || keys2.length <= DEFAULT_QS_ARRAY_LIMIT) {
    return false;
  }
  const hasConsecutiveNumericKeys = keys2.every((key, index2) => key === String(index2));
  if (!hasConsecutiveNumericKeys) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === "string");
};
const throwQsArrayLimitPopulateError = (entryCount) => {
  throw new ValidationError2(`Too many populate entries (${entryCount}). The maximum number of populate entries when using array notation is ${DEFAULT_QS_ARRAY_LIMIT}. Consider using object notation (populate[field]=true), nested population, or reducing the number of fields.`);
};
const isKeyword = (keyword) => {
  return ({ key, attribute }) => {
    return !attribute && keyword === key;
  };
};
const isWildcard = (value) => value === "*";
const isPopulateString = (value) => {
  return lodashExports.isString(value) && !isWildcard(value);
};
const isStringArray$1 = (value) => Array.isArray(value) && value.every(lodashExports.isString);
const isObj = (value) => lodashExports.isObject(value);
const populate = traverseFactory().intercept(isPopulateString, async (visitor2, options2, populate2, { recurse }) => {
  const populateObject = pathsToObjectPopulate([
    populate2
  ]);
  const traversedPopulate = await recurse(visitor2, options2, populateObject);
  const paths = objectPopulateToPaths(traversedPopulate);
  return paths ? paths[0] : traversedPopulate;
}).intercept(isStringArray$1, async (visitor2, options2, populate2, { recurse }) => {
  const populateObject = pathsToObjectPopulate(populate2);
  const traversedPopulate = await recurse(visitor2, options2, populateObject);
  const paths = objectPopulateToPaths(traversedPopulate);
  return paths ?? traversedPopulate;
}).intercept(isQsArrayLimitPopulateObject, async (_visitor, _options, populate2) => {
  throwQsArrayLimitPopulateError(Object.keys(populate2).length);
}).parse(isWildcard, () => ({
  /**
  * Since value is '*', we don't need to transform it
  */
  transform: lodashExports.identity,
  /**
  * '*' isn't a key/value structure, so regardless
  *  of the given key, it returns the data ('*')
  */
  get: (_key, data) => data,
  /**
  * '*' isn't a key/value structure, so regardless
  * of the given `key`, use `value` as the new `data`
  */
  set: (_key, value) => value,
  /**
  * '*' isn't a key/value structure, but we need to simulate at least one to enable
  * the data traversal. We're using '' since it represents a falsy string value
  */
  keys: lodashExports.constant([
    ""
  ]),
  /**
  * Removing '*' means setting it to undefined, regardless of the given key
  */
  remove: lodashExports.constant(void 0)
})).parse(lodashExports.isString, () => {
  const tokenize = (value) => value.split(".");
  const recompose = (parts) => parts.join(".");
  return {
    transform: (value) => value.trim(),
    remove(key, data) {
      const [root2] = tokenize(data);
      return root2 === key ? void 0 : data;
    },
    set(key, value, data) {
      const [root2] = tokenize(data);
      if (root2 !== key) {
        return data;
      }
      return value == null || lodashExports.isEmpty(value) ? root2 : `${root2}.${value}`;
    },
    keys(data) {
      const v = tokenize(data)[0];
      return v ? [
        v
      ] : [];
    },
    get(key, data) {
      const [root2, ...rest] = tokenize(data);
      return key === root2 ? recompose(rest) : void 0;
    }
  };
}).parse(isObj, () => ({
  transform: lodashExports.cloneDeep,
  remove(key, data) {
    const { [key]: ignored, ...rest } = data;
    return rest;
  },
  set(key, value, data) {
    return {
      ...data,
      [key]: value
    };
  },
  keys(data) {
    return Object.keys(data);
  },
  get(key, data) {
    return data[key];
  }
})).ignore(({ key, attribute, parent }) => {
  return [
    "sort",
    "filters",
    "fields"
  ].includes(key) && (!attribute || !!parent?.attribute);
}).on(
  // Handle recursion on populate."populate"
  isKeyword("populate"),
  async ({ key, visitor: visitor2, path: path2, value, schema: schema2, getModel, attribute }, { set: set2, recurse }) => {
    const parent = {
      key,
      path: path2,
      schema: schema2,
      attribute
    };
    const newValue = await recurse(visitor2, {
      schema: schema2,
      path: path2,
      getModel,
      parent
    }, value);
    set2(key, newValue);
  }
).on(isKeyword("on"), async ({ key, visitor: visitor2, path: path2, value, getModel, parent }, { set: set2, recurse }) => {
  const newOn = {};
  if (!isObj(value)) {
    return;
  }
  for (const [uid, subPopulate] of Object.entries(value)) {
    const model = getModel(uid);
    const newPath = {
      ...path2,
      raw: `${path2.raw}[${uid}]`
    };
    newOn[uid] = await recurse(visitor2, {
      schema: model,
      path: newPath,
      getModel,
      parent
    }, subPopulate);
  }
  set2(key, newOn);
}).onRelation(async ({ key, value, attribute, visitor: visitor2, path: path2, schema: schema2, getModel }, { set: set2, recurse }) => {
  if (value == null) {
    return;
  }
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  if (isMorphToRelationalAttribute(attribute)) {
    if (!lodashExports.isObject(value) || !("on" in value && lodashExports.isObject(value?.on))) {
      return;
    }
    const newValue2 = await recurse(visitor2, {
      schema: schema2,
      path: path2,
      getModel,
      parent
    }, {
      on: value?.on
    });
    set2(key, {
      ...value,
      ...newValue2
    });
    return;
  }
  const targetSchemaUID = attribute.target;
  const targetSchema = getModel(targetSchemaUID);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onMedia(async ({ key, path: path2, schema: schema2, attribute, visitor: visitor2, value, getModel }, { recurse, set: set2 }) => {
  if (value == null) {
    return;
  }
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchemaUID = "plugin::upload.file";
  const targetSchema = getModel(targetSchemaUID);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onComponent(async ({ key, value, schema: schema2, visitor: visitor2, path: path2, attribute, getModel }, { recurse, set: set2 }) => {
  if (value == null) {
    return;
  }
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  const targetSchema = getModel(attribute.component);
  const newValue = await recurse(visitor2, {
    schema: targetSchema,
    path: path2,
    getModel,
    parent
  }, value);
  set2(key, newValue);
}).onDynamicZone(async ({ key, value, schema: schema2, visitor: visitor2, path: path2, attribute, getModel }, { set: set2, recurse }) => {
  if (value == null || !lodashExports.isObject(value)) {
    return;
  }
  const parent = {
    key,
    path: path2,
    schema: schema2,
    attribute
  };
  if ("on" in value && value.on) {
    const newOn = await recurse(visitor2, {
      schema: schema2,
      path: path2,
      getModel,
      parent
    }, {
      on: value.on
    });
    set2(key, newOn);
  }
});
var traverseQueryPopulate = curry(populate.traverse);
const objectPopulateToPaths = (input) => {
  const paths = [];
  function traverse(currentObj, parentPath) {
    for (const [key, value] of Object.entries(currentObj)) {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      if (value === true) {
        paths.push(currentPath);
      } else {
        const nestedPopulate = value.populate;
        if (!nestedPopulate || !traverse(nestedPopulate, currentPath)) {
          return false;
        }
      }
    }
    return true;
  }
  if (!traverse(input, "")) {
    return void 0;
  }
  return paths;
};
const pathsToObjectPopulate = (input) => {
  const result = {};
  function traverse(object2, keys2) {
    const [first, ...rest] = keys2;
    if (rest.length === 0) {
      object2[first] = true;
    } else {
      if (!object2[first] || typeof object2[first] === "boolean") {
        object2[first] = {
          populate: {}
        };
      }
      traverse(object2[first].populate, rest);
    }
  }
  input.forEach((clause) => traverse(result, clause.split(".")));
  return result;
};
const isStringArray = (value) => {
  return Array.isArray(value) && value.every(lodashExports.isString);
};
const fields = traverseFactory().intercept(isStringArray, async (visitor2, options2, fields2, { recurse }) => {
  return Promise.all(fields2.map((field) => recurse(visitor2, options2, field)));
}).intercept((value) => lodashExports.isString(value) && value.includes(","), (visitor2, options2, fields2, { recurse }) => {
  return Promise.all(fields2.split(",").map((field) => recurse(visitor2, options2, field)));
}).intercept((value) => lodashExports.eq("*", value), lodashExports.constant("*")).parse(lodashExports.isString, () => ({
  transform: (value) => value.trim(),
  remove(key, data) {
    return data === key ? void 0 : data;
  },
  set(_key, _value, data) {
    return data;
  },
  keys(data) {
    return [
      data
    ];
  },
  get(key, data) {
    return key === data ? data : void 0;
  }
}));
var traverseQueryFields = curry(fields.traverse);
const { ID_ATTRIBUTE: ID_ATTRIBUTE$1, DOC_ID_ATTRIBUTE: DOC_ID_ATTRIBUTE$1 } = constants;
const defaultSanitizeFilters = curry((ctx, filters2) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultSanitizeFilters");
  }
  return pipe$1(
    // Remove keys that are not attributes or valid operators
    traverseQueryFilters(({ key, attribute }, { remove }) => {
      const isAttribute = !!attribute;
      if ([
        ID_ATTRIBUTE$1,
        DOC_ID_ATTRIBUTE$1
      ].includes(key)) {
        return;
      }
      if (!isAttribute && !isOperator(key)) {
        remove(key);
      }
    }, ctx),
    // Remove dynamic zones from filters
    traverseQueryFilters(visitor$5, ctx),
    // Remove morpTo relations from filters
    traverseQueryFilters(visitor$6, ctx),
    // Remove passwords from filters
    traverseQueryFilters(visitor$8, ctx),
    // Remove private from filters
    traverseQueryFilters(visitor$7, ctx),
    // Remove empty plain objects and empty arrays. Do not use lodash isObject+isEmpty: built-ins with no
    // enumerable keys (Date, RegExp, boxed primitives, etc.) are "empty" and would wrongly drop valid operands.
    traverseQueryFilters(({ key, value }, { remove }) => {
      const isEmptyPlainObject = lodashExports.isPlainObject(value) && lodashExports.isEmpty(value);
      const isEmptyArrayOperand = Array.isArray(value) && value.length === 0;
      if (isEmptyPlainObject || isEmptyArrayOperand) {
        remove(key);
      }
    }, ctx)
  )(filters2);
});
const defaultSanitizeSort = curry((ctx, sort2) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultSanitizeSort");
  }
  return pipe$1(
    // Remove non attribute keys
    traverseQuerySort(({ key, attribute }, { remove }) => {
      if ([
        ID_ATTRIBUTE$1,
        DOC_ID_ATTRIBUTE$1
      ].includes(key)) {
        return;
      }
      if (!attribute) {
        remove(key);
      }
    }, ctx),
    // Remove dynamic zones from sort
    traverseQuerySort(visitor$5, ctx),
    // Remove morpTo relations from sort
    traverseQuerySort(visitor$6, ctx),
    // Remove private from sort
    traverseQuerySort(visitor$7, ctx),
    // Remove passwords from filters
    traverseQuerySort(visitor$8, ctx),
    // Remove keys for empty non-scalar values
    traverseQuerySort(({ key, attribute, value }, { remove }) => {
      if ([
        ID_ATTRIBUTE$1,
        DOC_ID_ATTRIBUTE$1
      ].includes(key)) {
        return;
      }
      if (!isScalarAttribute(attribute) && lodashExports.isEmpty(value)) {
        remove(key);
      }
    }, ctx)
  )(sort2);
});
const defaultSanitizeFields = curry((ctx, fields2) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultSanitizeFields");
  }
  return pipe$1(
    // Only keep scalar attributes
    traverseQueryFields(({ key, attribute }, { remove }) => {
      if ([
        ID_ATTRIBUTE$1,
        DOC_ID_ATTRIBUTE$1
      ].includes(key)) {
        return;
      }
      if (attribute == null || !isScalarAttribute(attribute)) {
        remove(key);
      }
    }, ctx),
    // Remove private fields
    traverseQueryFields(visitor$7, ctx),
    // Remove password fields
    traverseQueryFields(visitor$8, ctx),
    // Remove nil values from fields array
    (value) => Array.isArray(value) ? value.filter((field) => field != null) : value
  )(fields2);
});
const defaultSanitizePopulate = curry((ctx, populate2) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultSanitizePopulate");
  }
  return pipe$1(
    traverseQueryPopulate(visitor$4, ctx),
    traverseQueryPopulate(async ({ key, value, schema: schema2, attribute, getModel, path: path2 }, { set: set2 }) => {
      if (attribute) {
        return;
      }
      const parent = {
        key,
        path: path2,
        schema: schema2,
        attribute
      };
      if (key === "sort") {
        set2(key, await defaultSanitizeSort({
          schema: schema2,
          getModel,
          parent
        }, value));
      }
      if (key === "filters") {
        set2(key, await defaultSanitizeFilters({
          schema: schema2,
          getModel,
          parent
        }, value));
      }
      if (key === "fields") {
        set2(key, await defaultSanitizeFields({
          schema: schema2,
          getModel,
          parent
        }, value));
      }
      if (key === "populate") {
        set2(key, await defaultSanitizePopulate({
          schema: schema2,
          getModel,
          parent
        }, value));
      }
    }, ctx),
    // Remove private fields
    traverseQueryPopulate(visitor$7, ctx)
  )(populate2);
});
const throwInvalidKey = ({ key, path: path2, reason }) => {
  const location = path2 && path2 !== key ? `Invalid key ${key} at ${path2}` : `Invalid key ${key}`;
  const msg = reason ? `${location}: ${reason}` : location;
  throw new ValidationError2(msg, {
    key,
    path: path2
  });
};
const asyncCurry = (fn) => curry(fn);
const visitor$3 = ({ key, attribute, path: path2 }) => {
  if (attribute?.type === "password") {
    throwInvalidKey({
      key,
      path: path2.attribute
    });
  }
};
const visitor$2 = ({ schema: schema2, key, attribute, path: path2 }) => {
  if (!attribute) {
    return;
  }
  const isPrivate = attribute.private === true || isPrivateAttribute(schema2, key);
  if (isPrivate) {
    throwInvalidKey({
      key,
      path: path2.attribute
    });
  }
};
const visitor$1 = ({ key, attribute, path: path2 }) => {
  if (isMorphToRelationalAttribute(attribute)) {
    throwInvalidKey({
      key,
      path: path2.attribute
    });
  }
};
const visitor = ({ key, attribute, path: path2 }) => {
  if (isDynamicZoneAttribute(attribute)) {
    throwInvalidKey({
      key,
      path: path2.attribute
    });
  }
};
const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = constants;
const FILTER_TRAVERSALS = [
  "nonAttributesOperators",
  "dynamicZones",
  "morphRelations",
  "passwords",
  "private"
];
const validateFilters = asyncCurry(async (ctx, filters2, include) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultValidateFilters");
  }
  const functionsToApply = [];
  if (include.includes("nonAttributesOperators")) {
    functionsToApply.push(traverseQueryFilters(({ key, attribute, path: path2 }) => {
      if ([
        ID_ATTRIBUTE,
        DOC_ID_ATTRIBUTE
      ].includes(key)) {
        return;
      }
      const isAttribute = !!attribute;
      if (!isAttribute && !isOperator(key)) {
        throwInvalidKey({
          key,
          path: path2.attribute
        });
      }
    }, ctx));
  }
  if (include.includes("dynamicZones")) {
    functionsToApply.push(traverseQueryFilters(visitor, ctx));
  }
  if (include.includes("morphRelations")) {
    functionsToApply.push(traverseQueryFilters(visitor$1, ctx));
  }
  if (include.includes("passwords")) {
    functionsToApply.push(traverseQueryFilters(visitor$3, ctx));
  }
  if (include.includes("private")) {
    functionsToApply.push(traverseQueryFilters(visitor$2, ctx));
  }
  if (functionsToApply.length === 0) {
    return filters2;
  }
  return pipe$1(...functionsToApply)(filters2);
});
asyncCurry(async (ctx, filters2) => {
  return validateFilters(ctx, filters2, FILTER_TRAVERSALS);
});
const SORT_TRAVERSALS = [
  "nonAttributesOperators",
  "dynamicZones",
  "morphRelations",
  "passwords",
  "private",
  "nonScalarEmptyKeys"
];
const validateSort = asyncCurry(async (ctx, sort2, include) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultValidateSort");
  }
  const functionsToApply = [];
  if (include.includes("nonAttributesOperators")) {
    functionsToApply.push(traverseQuerySort(({ key, attribute, path: path2 }) => {
      if ([
        ID_ATTRIBUTE,
        DOC_ID_ATTRIBUTE
      ].includes(key)) {
        return;
      }
      if (key === "status" && ctx.schema?.options?.draftAndPublish) {
        return;
      }
      if (!attribute) {
        throwInvalidKey({
          key,
          path: path2.attribute
        });
      }
    }, ctx));
  }
  if (include.includes("dynamicZones")) {
    functionsToApply.push(traverseQuerySort(visitor, ctx));
  }
  if (include.includes("morphRelations")) {
    functionsToApply.push(traverseQuerySort(visitor$1, ctx));
  }
  if (include.includes("passwords")) {
    functionsToApply.push(traverseQuerySort(visitor$3, ctx));
  }
  if (include.includes("private")) {
    functionsToApply.push(traverseQuerySort(visitor$2, ctx));
  }
  if (include.includes("nonScalarEmptyKeys")) {
    functionsToApply.push(traverseQuerySort(({ key, attribute, value, path: path2 }) => {
      if ([
        ID_ATTRIBUTE,
        DOC_ID_ATTRIBUTE
      ].includes(key)) {
        return;
      }
      if (!isScalarAttribute(attribute) && lodashExports.isEmpty(value)) {
        throwInvalidKey({
          key,
          path: path2.attribute
        });
      }
    }, ctx));
  }
  if (functionsToApply.length === 0) {
    return sort2;
  }
  return pipe$1(...functionsToApply)(sort2);
});
asyncCurry(async (ctx, sort2) => {
  return validateSort(ctx, sort2, SORT_TRAVERSALS);
});
const FIELDS_TRAVERSALS = [
  "scalarAttributes",
  "privateFields",
  "passwordFields"
];
const validateFields = asyncCurry(async (ctx, fields2, include) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultValidateFields");
  }
  const functionsToApply = [];
  if (include.includes("scalarAttributes")) {
    functionsToApply.push(traverseQueryFields(({ key, attribute, path: path2 }) => {
      if ([
        ID_ATTRIBUTE,
        DOC_ID_ATTRIBUTE
      ].includes(key)) {
        return;
      }
      if (attribute == null || !isScalarAttribute(attribute)) {
        throwInvalidKey({
          key,
          path: path2.attribute
        });
      }
    }, ctx));
  }
  if (include.includes("privateFields")) {
    functionsToApply.push(traverseQueryFields(visitor$2, ctx));
  }
  if (include.includes("passwordFields")) {
    functionsToApply.push(traverseQueryFields(visitor$3, ctx));
  }
  if (functionsToApply.length === 0) {
    return fields2;
  }
  return pipe$1(...functionsToApply)(fields2);
});
asyncCurry(async (ctx, fields2) => {
  return validateFields(ctx, fields2, FIELDS_TRAVERSALS);
});
const isMorphLikeAttribute = (attribute) => isDynamicZoneAttribute(attribute) || isMorphToRelationalAttribute(attribute);
const isPopulatableAttribute = (attribute) => !!attribute && [
  "relation",
  "dynamiczone",
  "component",
  "media"
].includes(attribute.type);
const isDotNotationPopulate = (populate2) => {
  if (populate2 === "*") {
    return false;
  }
  if (typeof populate2 === "string") {
    return true;
  }
  return Array.isArray(populate2) && populate2.length > 0 && populate2.every((p) => typeof p === "string");
};
const flattenDotPopulatePaths = (populate2) => {
  const items = Array.isArray(populate2) ? populate2 : [
    populate2
  ];
  return items.flatMap((item) => item.split(",").map((segment) => segment.trim()).filter(Boolean));
};
const validatePopulateDotPathSegments = ({ schema: schema2, getModel }, segments, pathPrefix) => {
  if (!segments.length) {
    return;
  }
  const [head, ...tail] = segments;
  const fullPath = pathPrefix ? `${pathPrefix}.${head}` : head;
  const attribute = schema2.attributes[head];
  if (!attribute || !isPopulatableAttribute(attribute)) {
    throwInvalidKey({
      key: head,
      path: fullPath
    });
  }
  if (!tail.length) {
    return;
  }
  if (attribute.type === "component") {
    if (!attribute.component) {
      throwInvalidKey({
        key: head,
        path: fullPath
      });
    }
    validatePopulateDotPathSegments({
      schema: getModel(attribute.component),
      getModel
    }, tail, fullPath);
    return;
  }
  if (attribute.type === "relation") {
    if (isMorphLikeAttribute(attribute)) {
      throwInvalidKey({
        key: head,
        path: fullPath
      });
    }
    if (!attribute.target) {
      throwInvalidKey({
        key: head,
        path: fullPath
      });
    }
    validatePopulateDotPathSegments({
      schema: getModel(attribute.target),
      getModel
    }, tail, fullPath);
    return;
  }
  if (attribute.type === "media") {
    throwInvalidKey({
      key: head,
      path: fullPath
    });
  }
  if (attribute.type === "dynamiczone") {
    const [nextSegment, ...rest] = tail;
    const nextPath = `${fullPath}.${nextSegment}`;
    const candidates = (attribute.components ?? []).map((uid) => getModel(uid)).filter((model) => model?.attributes?.[nextSegment]);
    if (!candidates.length) {
      throwInvalidKey({
        key: nextSegment,
        path: nextPath
      });
    }
    let validated = false;
    for (const componentSchema of candidates) {
      const nestedAttribute = componentSchema.attributes[nextSegment];
      try {
        if (!rest.length) {
          if (nestedAttribute) {
            validated = true;
            break;
          }
        } else if (nestedAttribute?.type === "component" && nestedAttribute.component) {
          validatePopulateDotPathSegments({
            schema: getModel(nestedAttribute.component),
            getModel
          }, rest, nextPath);
          validated = true;
          break;
        } else if (nestedAttribute?.type === "relation" && !isMorphLikeAttribute(nestedAttribute) && nestedAttribute.target) {
          validatePopulateDotPathSegments({
            schema: getModel(nestedAttribute.target),
            getModel
          }, rest, nextPath);
          validated = true;
          break;
        }
      } catch {
      }
    }
    if (!validated) {
      throwInvalidKey({
        key: nextSegment,
        path: nextPath
      });
    }
  }
};
const validatePopulateDotPaths = (ctx, populate2) => {
  for (const path2 of flattenDotPopulatePaths(populate2)) {
    const segments = path2.split(".").map((segment) => segment.trim()).filter(Boolean);
    validatePopulateDotPathSegments(ctx, segments, "");
  }
};
const validateMorphLikeNestedPopulate = (populateValue, { path: path2 }) => {
  if (populateValue != null && populateValue !== "*") {
    throwInvalidKey({
      key: "populate",
      path: path2
    });
  }
};
const POPULATE_TRAVERSALS = [
  "nonAttributesOperators",
  "private"
];
const ROOT_ONLY_QUERY_PARAMS = [
  "status",
  "publicationFilter",
  "hasPublishedVersion"
];
const validatePopulate = asyncCurry(async (ctx, populate2, includes) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultValidatePopulate");
  }
  if (isDotNotationPopulate(populate2)) {
    validatePopulateDotPaths({
      schema: ctx.schema,
      getModel: ctx.getModel
    }, populate2);
    if (includes?.populate?.includes("private")) {
      return traverseQueryPopulate(visitor$2, ctx)(populate2);
    }
    return populate2;
  }
  const functionsToApply = [];
  functionsToApply.push(traverseQueryPopulate(async ({ key, path: path2, value, schema: schema2, attribute, getModel, parent }, { set: set2 }) => {
    if (!parent?.attribute && attribute) {
      const isPopulatableAttribute2 = [
        "relation",
        "dynamiczone",
        "component",
        "media"
      ].includes(attribute.type);
      if (isMorphLikeAttribute(attribute) && lodashExports.isObject(value) && "populate" in value) {
        validateMorphLikeNestedPopulate(value.populate, {
          path: path2.raw
        });
      }
      if (!isPopulatableAttribute2) {
        throwInvalidKey({
          key,
          path: path2.raw
        });
      }
      return;
    }
    if (key === "on") {
      if (!lodashExports.isObject(value)) {
        return throwInvalidKey({
          key,
          path: path2.raw
        });
      }
      const targets = Object.keys(value);
      for (const target of targets) {
        const model = getModel(target);
        if (!model) {
          throwInvalidKey({
            key: target,
            path: `${path2.raw}.${target}`
          });
        }
      }
      return;
    }
    if (key === "" && value === "*") {
      return;
    }
    if (key === "count") {
      if (isBooleanLike(value)) {
        return;
      }
      throwInvalidKey({
        key,
        path: path2.attribute
      });
    }
    if (isBooleanLike(key)) {
      return;
    }
    if (key === "sort") {
      set2(key, await validateSort({
        schema: schema2,
        getModel
      }, value, includes?.sort || SORT_TRAVERSALS));
      return;
    }
    if (key === "filters") {
      set2(key, await validateFilters({
        schema: schema2,
        getModel
      }, value, includes?.filters || FILTER_TRAVERSALS));
      return;
    }
    if (key === "fields") {
      set2(key, await validateFields({
        schema: schema2,
        getModel
      }, value, includes?.fields || FIELDS_TRAVERSALS));
      return;
    }
    if (key === "populate") {
      set2(key, await validatePopulate(
        {
          schema: schema2,
          getModel,
          parent: {
            key,
            path: path2,
            schema: schema2,
            attribute
          },
          path: path2
        },
        value,
        includes
        // pass down the same includes object
      ));
      return;
    }
    if (includes?.populate?.includes("nonAttributesOperators")) {
      throwInvalidKey({
        key,
        path: path2.attribute,
        reason: ROOT_ONLY_QUERY_PARAMS.some((param) => param === key) ? `${key} is only accepted at the root of the query, and it also applies to populated relations` : void 0
      });
    }
  }, ctx));
  if (includes?.populate?.includes("private")) {
    functionsToApply.push(traverseQueryPopulate(visitor$2, ctx));
  }
  if (functionsToApply.length === 0) {
    return populate2;
  }
  return pipe$1(...functionsToApply)(populate2);
});
asyncCurry(async (ctx, populate2) => {
  if (!ctx.schema) {
    throw new Error("Missing schema in defaultValidatePopulate");
  }
  return validatePopulate(ctx, populate2, {
    filters: FILTER_TRAVERSALS,
    sort: SORT_TRAVERSALS,
    fields: FIELDS_TRAVERSALS,
    populate: POPULATE_TRAVERSALS
  });
});
var execa$1 = { exports: {} };
var crossSpawn$1 = { exports: {} };
var windows;
var hasRequiredWindows;
function requireWindows() {
  if (hasRequiredWindows) return windows;
  hasRequiredWindows = 1;
  windows = isexe2;
  isexe2.sync = sync2;
  var fs2 = require$$0$3;
  function checkPathExt(path2, options2) {
    var pathext = options2.pathExt !== void 0 ? options2.pathExt : process.env.PATHEXT;
    if (!pathext) {
      return true;
    }
    pathext = pathext.split(";");
    if (pathext.indexOf("") !== -1) {
      return true;
    }
    for (var i = 0; i < pathext.length; i++) {
      var p = pathext[i].toLowerCase();
      if (p && path2.substr(-p.length).toLowerCase() === p) {
        return true;
      }
    }
    return false;
  }
  function checkStat(stat, path2, options2) {
    if (!stat.isSymbolicLink() && !stat.isFile()) {
      return false;
    }
    return checkPathExt(path2, options2);
  }
  function isexe2(path2, options2, cb) {
    fs2.stat(path2, function(er, stat) {
      cb(er, er ? false : checkStat(stat, path2, options2));
    });
  }
  function sync2(path2, options2) {
    return checkStat(fs2.statSync(path2), path2, options2);
  }
  return windows;
}
var mode;
var hasRequiredMode;
function requireMode() {
  if (hasRequiredMode) return mode;
  hasRequiredMode = 1;
  mode = isexe2;
  isexe2.sync = sync2;
  var fs2 = require$$0$3;
  function isexe2(path2, options2, cb) {
    fs2.stat(path2, function(er, stat) {
      cb(er, er ? false : checkStat(stat, options2));
    });
  }
  function sync2(path2, options2) {
    return checkStat(fs2.statSync(path2), options2);
  }
  function checkStat(stat, options2) {
    return stat.isFile() && checkMode(stat, options2);
  }
  function checkMode(stat, options2) {
    var mod = stat.mode;
    var uid = stat.uid;
    var gid = stat.gid;
    var myUid = options2.uid !== void 0 ? options2.uid : process.getuid && process.getuid();
    var myGid = options2.gid !== void 0 ? options2.gid : process.getgid && process.getgid();
    var u = parseInt("100", 8);
    var g = parseInt("010", 8);
    var o = parseInt("001", 8);
    var ug = u | g;
    var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
    return ret;
  }
  return mode;
}
var core$1;
if (process.platform === "win32" || commonjsGlobal.TESTING_WINDOWS) {
  core$1 = requireWindows();
} else {
  core$1 = requireMode();
}
var isexe_1 = isexe$1;
isexe$1.sync = sync;
function isexe$1(path2, options2, cb) {
  if (typeof options2 === "function") {
    cb = options2;
    options2 = {};
  }
  if (!cb) {
    if (typeof Promise !== "function") {
      throw new TypeError("callback not provided");
    }
    return new Promise(function(resolve, reject) {
      isexe$1(path2, options2 || {}, function(er, is) {
        if (er) {
          reject(er);
        } else {
          resolve(is);
        }
      });
    });
  }
  core$1(path2, options2 || {}, function(er, is) {
    if (er) {
      if (er.code === "EACCES" || options2 && options2.ignoreErrors) {
        er = null;
        is = false;
      }
    }
    cb(er, is);
  });
}
function sync(path2, options2) {
  try {
    return core$1.sync(path2, options2 || {});
  } catch (er) {
    if (options2 && options2.ignoreErrors || er.code === "EACCES") {
      return false;
    } else {
      throw er;
    }
  }
}
const isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
const path$3 = require$$0$4;
const COLON = isWindows ? ";" : ":";
const isexe = isexe_1;
const getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
const getPathInfo = (cmd, opt) => {
  const colon = opt.colon || COLON;
  const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
    // windows always checks the cwd first
    ...isWindows ? [process.cwd()] : [],
    ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
    "").split(colon)
  ];
  const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
  const pathExt = isWindows ? pathExtExe.split(colon) : [""];
  if (isWindows) {
    if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
      pathExt.unshift("");
  }
  return {
    pathEnv,
    pathExt,
    pathExtExe
  };
};
const which$1 = (cmd, opt, cb) => {
  if (typeof opt === "function") {
    cb = opt;
    opt = {};
  }
  if (!opt)
    opt = {};
  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];
  const step = (i) => new Promise((resolve, reject) => {
    if (i === pathEnv.length)
      return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
    const pCmd = path$3.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
    resolve(subStep(p, i, 0));
  });
  const subStep = (p, i, ii) => new Promise((resolve, reject) => {
    if (ii === pathExt.length)
      return resolve(step(i + 1));
    const ext = pathExt[ii];
    isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
      if (!er && is) {
        if (opt.all)
          found.push(p + ext);
        else
          return resolve(p + ext);
      }
      return resolve(subStep(p, i, ii + 1));
    });
  });
  return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
};
const whichSync = (cmd, opt) => {
  opt = opt || {};
  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];
  for (let i = 0; i < pathEnv.length; i++) {
    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
    const pCmd = path$3.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
    for (let j = 0; j < pathExt.length; j++) {
      const cur = p + pathExt[j];
      try {
        const is = isexe.sync(cur, { pathExt: pathExtExe });
        if (is) {
          if (opt.all)
            found.push(cur);
          else
            return cur;
        }
      } catch (ex) {
      }
    }
  }
  if (opt.all && found.length)
    return found;
  if (opt.nothrow)
    return null;
  throw getNotFoundError(cmd);
};
var which_1 = which$1;
which$1.sync = whichSync;
var pathKey$1 = { exports: {} };
const pathKey = (options2 = {}) => {
  const environment = options2.env || process.env;
  const platform = options2.platform || process.platform;
  if (platform !== "win32") {
    return "PATH";
  }
  return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
};
pathKey$1.exports = pathKey;
pathKey$1.exports.default = pathKey;
var pathKeyExports = pathKey$1.exports;
const path$2 = require$$0$4;
const which = which_1;
const getPathKey = pathKeyExports;
function resolveCommandAttempt(parsed, withoutPathExt) {
  const env2 = parsed.options.env || process.env;
  const cwd = process.cwd();
  const hasCustomCwd = parsed.options.cwd != null;
  const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
  if (shouldSwitchCwd) {
    try {
      process.chdir(parsed.options.cwd);
    } catch (err) {
    }
  }
  let resolved;
  try {
    resolved = which.sync(parsed.command, {
      path: env2[getPathKey({ env: env2 })],
      pathExt: withoutPathExt ? path$2.delimiter : void 0
    });
  } catch (e) {
  } finally {
    if (shouldSwitchCwd) {
      process.chdir(cwd);
    }
  }
  if (resolved) {
    resolved = path$2.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
  }
  return resolved;
}
function resolveCommand$1(parsed) {
  return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
}
var resolveCommand_1 = resolveCommand$1;
var _escape = {};
const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
function escapeCommand(arg) {
  arg = arg.replace(metaCharsRegExp, "^$1");
  return arg;
}
function escapeArgument(arg, doubleEscapeMetaChars) {
  arg = `${arg}`;
  arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
  arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
  arg = `"${arg}"`;
  arg = arg.replace(metaCharsRegExp, "^$1");
  if (doubleEscapeMetaChars) {
    arg = arg.replace(metaCharsRegExp, "^$1");
  }
  return arg;
}
_escape.command = escapeCommand;
_escape.argument = escapeArgument;
var shebangRegex$1 = /^#!(.*)/;
const shebangRegex = shebangRegex$1;
var shebangCommand$1 = (string2 = "") => {
  const match = string2.match(shebangRegex);
  if (!match) {
    return null;
  }
  const [path2, argument] = match[0].replace(/#! ?/, "").split(" ");
  const binary = path2.split("/").pop();
  if (binary === "env") {
    return argument;
  }
  return argument ? `${binary} ${argument}` : binary;
};
const fs = require$$0$3;
const shebangCommand = shebangCommand$1;
function readShebang$1(command2) {
  const size = 150;
  const buffer = Buffer.alloc(size);
  let fd;
  try {
    fd = fs.openSync(command2, "r");
    fs.readSync(fd, buffer, 0, size, 0);
    fs.closeSync(fd);
  } catch (e) {
  }
  return shebangCommand(buffer.toString());
}
var readShebang_1 = readShebang$1;
const path$1 = require$$0$4;
const resolveCommand = resolveCommand_1;
const escape = _escape;
const readShebang = readShebang_1;
const isWin$2 = process.platform === "win32";
const isExecutableRegExp = /\.(?:com|exe)$/i;
const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
function detectShebang(parsed) {
  parsed.file = resolveCommand(parsed);
  const shebang = parsed.file && readShebang(parsed.file);
  if (shebang) {
    parsed.args.unshift(parsed.file);
    parsed.command = shebang;
    return resolveCommand(parsed);
  }
  return parsed.file;
}
function parseNonShell(parsed) {
  if (!isWin$2) {
    return parsed;
  }
  const commandFile = detectShebang(parsed);
  const needsShell = !isExecutableRegExp.test(commandFile);
  if (parsed.options.forceShell || needsShell) {
    const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
    parsed.command = path$1.normalize(parsed.command);
    parsed.command = escape.command(parsed.command);
    parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
    const shellCommand = [parsed.command].concat(parsed.args).join(" ");
    parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
    parsed.command = process.env.comspec || "cmd.exe";
    parsed.options.windowsVerbatimArguments = true;
  }
  return parsed;
}
function parse$2(command2, args, options2) {
  if (args && !Array.isArray(args)) {
    options2 = args;
    args = null;
  }
  args = args ? args.slice(0) : [];
  options2 = Object.assign({}, options2);
  const parsed = {
    command: command2,
    args,
    options: options2,
    file: void 0,
    original: {
      command: command2,
      args
    }
  };
  return options2.shell ? parsed : parseNonShell(parsed);
}
var parse_1 = parse$2;
const isWin$1 = process.platform === "win32";
function notFoundError(original, syscall) {
  return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
    code: "ENOENT",
    errno: "ENOENT",
    syscall: `${syscall} ${original.command}`,
    path: original.command,
    spawnargs: original.args
  });
}
function hookChildProcess(cp2, parsed) {
  if (!isWin$1) {
    return;
  }
  const originalEmit = cp2.emit;
  cp2.emit = function(name, arg1) {
    if (name === "exit") {
      const err = verifyENOENT(arg1, parsed);
      if (err) {
        return originalEmit.call(cp2, "error", err);
      }
    }
    return originalEmit.apply(cp2, arguments);
  };
}
function verifyENOENT(status2, parsed) {
  if (isWin$1 && status2 === 1 && !parsed.file) {
    return notFoundError(parsed.original, "spawn");
  }
  return null;
}
function verifyENOENTSync(status2, parsed) {
  if (isWin$1 && status2 === 1 && !parsed.file) {
    return notFoundError(parsed.original, "spawnSync");
  }
  return null;
}
var enoent$1 = {
  hookChildProcess,
  verifyENOENT,
  verifyENOENTSync,
  notFoundError
};
const cp = require$$0$1;
const parse$1 = parse_1;
const enoent = enoent$1;
function spawn(command2, args, options2) {
  const parsed = parse$1(command2, args, options2);
  const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
  enoent.hookChildProcess(spawned, parsed);
  return spawned;
}
function spawnSync(command2, args, options2) {
  const parsed = parse$1(command2, args, options2);
  const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
  result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
  return result;
}
crossSpawn$1.exports = spawn;
crossSpawn$1.exports.spawn = spawn;
crossSpawn$1.exports.sync = spawnSync;
crossSpawn$1.exports._parse = parse$1;
crossSpawn$1.exports._enoent = enoent;
var crossSpawnExports = crossSpawn$1.exports;
var stripFinalNewline$1 = (input) => {
  const LF = typeof input === "string" ? "\n" : "\n".charCodeAt();
  const CR = typeof input === "string" ? "\r" : "\r".charCodeAt();
  if (input[input.length - 1] === LF) {
    input = input.slice(0, input.length - 1);
  }
  if (input[input.length - 1] === CR) {
    input = input.slice(0, input.length - 1);
  }
  return input;
};
var npmRunPath$1 = { exports: {} };
npmRunPath$1.exports;
(function(module) {
  const path2 = require$$0$4;
  const pathKey2 = pathKeyExports;
  const npmRunPath2 = (options2) => {
    options2 = {
      cwd: process.cwd(),
      path: process.env[pathKey2()],
      execPath: process.execPath,
      ...options2
    };
    let previous;
    let cwdPath = path2.resolve(options2.cwd);
    const result = [];
    while (previous !== cwdPath) {
      result.push(path2.join(cwdPath, "node_modules/.bin"));
      previous = cwdPath;
      cwdPath = path2.resolve(cwdPath, "..");
    }
    const execPathDir = path2.resolve(options2.cwd, options2.execPath, "..");
    result.push(execPathDir);
    return result.concat(options2.path).join(path2.delimiter);
  };
  module.exports = npmRunPath2;
  module.exports.default = npmRunPath2;
  module.exports.env = (options2) => {
    options2 = {
      env: process.env,
      ...options2
    };
    const env2 = { ...options2.env };
    const path3 = pathKey2({ env: env2 });
    options2.path = env2[path3];
    env2[path3] = module.exports(options2);
    return env2;
  };
})(npmRunPath$1);
var npmRunPathExports = npmRunPath$1.exports;
var onetime$2 = { exports: {} };
var mimicFn$2 = { exports: {} };
const mimicFn$1 = (to, from) => {
  for (const prop of Reflect.ownKeys(from)) {
    Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
  }
  return to;
};
mimicFn$2.exports = mimicFn$1;
mimicFn$2.exports.default = mimicFn$1;
var mimicFnExports = mimicFn$2.exports;
const mimicFn = mimicFnExports;
const calledFunctions = /* @__PURE__ */ new WeakMap();
const onetime$1 = (function_, options2 = {}) => {
  if (typeof function_ !== "function") {
    throw new TypeError("Expected a function");
  }
  let returnValue;
  let callCount = 0;
  const functionName = function_.displayName || function_.name || "<anonymous>";
  const onetime2 = function(...arguments_) {
    calledFunctions.set(onetime2, ++callCount);
    if (callCount === 1) {
      returnValue = function_.apply(this, arguments_);
      function_ = null;
    } else if (options2.throw === true) {
      throw new Error(`Function \`${functionName}\` can only be called once`);
    }
    return returnValue;
  };
  mimicFn(onetime2, function_);
  calledFunctions.set(onetime2, callCount);
  return onetime2;
};
onetime$2.exports = onetime$1;
onetime$2.exports.default = onetime$1;
onetime$2.exports.callCount = (function_) => {
  if (!calledFunctions.has(function_)) {
    throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
  }
  return calledFunctions.get(function_);
};
var onetimeExports = onetime$2.exports;
var main = {};
var signals$2 = {};
var core = {};
Object.defineProperty(core, "__esModule", { value: true });
core.SIGNALS = void 0;
const SIGNALS = [
  {
    name: "SIGHUP",
    number: 1,
    action: "terminate",
    description: "Terminal closed",
    standard: "posix"
  },
  {
    name: "SIGINT",
    number: 2,
    action: "terminate",
    description: "User interruption with CTRL-C",
    standard: "ansi"
  },
  {
    name: "SIGQUIT",
    number: 3,
    action: "core",
    description: "User interruption with CTRL-\\",
    standard: "posix"
  },
  {
    name: "SIGILL",
    number: 4,
    action: "core",
    description: "Invalid machine instruction",
    standard: "ansi"
  },
  {
    name: "SIGTRAP",
    number: 5,
    action: "core",
    description: "Debugger breakpoint",
    standard: "posix"
  },
  {
    name: "SIGABRT",
    number: 6,
    action: "core",
    description: "Aborted",
    standard: "ansi"
  },
  {
    name: "SIGIOT",
    number: 6,
    action: "core",
    description: "Aborted",
    standard: "bsd"
  },
  {
    name: "SIGBUS",
    number: 7,
    action: "core",
    description: "Bus error due to misaligned, non-existing address or paging error",
    standard: "bsd"
  },
  {
    name: "SIGEMT",
    number: 7,
    action: "terminate",
    description: "Command should be emulated but is not implemented",
    standard: "other"
  },
  {
    name: "SIGFPE",
    number: 8,
    action: "core",
    description: "Floating point arithmetic error",
    standard: "ansi"
  },
  {
    name: "SIGKILL",
    number: 9,
    action: "terminate",
    description: "Forced termination",
    standard: "posix",
    forced: true
  },
  {
    name: "SIGUSR1",
    number: 10,
    action: "terminate",
    description: "Application-specific signal",
    standard: "posix"
  },
  {
    name: "SIGSEGV",
    number: 11,
    action: "core",
    description: "Segmentation fault",
    standard: "ansi"
  },
  {
    name: "SIGUSR2",
    number: 12,
    action: "terminate",
    description: "Application-specific signal",
    standard: "posix"
  },
  {
    name: "SIGPIPE",
    number: 13,
    action: "terminate",
    description: "Broken pipe or socket",
    standard: "posix"
  },
  {
    name: "SIGALRM",
    number: 14,
    action: "terminate",
    description: "Timeout or timer",
    standard: "posix"
  },
  {
    name: "SIGTERM",
    number: 15,
    action: "terminate",
    description: "Termination",
    standard: "ansi"
  },
  {
    name: "SIGSTKFLT",
    number: 16,
    action: "terminate",
    description: "Stack is empty or overflowed",
    standard: "other"
  },
  {
    name: "SIGCHLD",
    number: 17,
    action: "ignore",
    description: "Child process terminated, paused or unpaused",
    standard: "posix"
  },
  {
    name: "SIGCLD",
    number: 17,
    action: "ignore",
    description: "Child process terminated, paused or unpaused",
    standard: "other"
  },
  {
    name: "SIGCONT",
    number: 18,
    action: "unpause",
    description: "Unpaused",
    standard: "posix",
    forced: true
  },
  {
    name: "SIGSTOP",
    number: 19,
    action: "pause",
    description: "Paused",
    standard: "posix",
    forced: true
  },
  {
    name: "SIGTSTP",
    number: 20,
    action: "pause",
    description: 'Paused using CTRL-Z or "suspend"',
    standard: "posix"
  },
  {
    name: "SIGTTIN",
    number: 21,
    action: "pause",
    description: "Background process cannot read terminal input",
    standard: "posix"
  },
  {
    name: "SIGBREAK",
    number: 21,
    action: "terminate",
    description: "User interruption with CTRL-BREAK",
    standard: "other"
  },
  {
    name: "SIGTTOU",
    number: 22,
    action: "pause",
    description: "Background process cannot write to terminal output",
    standard: "posix"
  },
  {
    name: "SIGURG",
    number: 23,
    action: "ignore",
    description: "Socket received out-of-band data",
    standard: "bsd"
  },
  {
    name: "SIGXCPU",
    number: 24,
    action: "core",
    description: "Process timed out",
    standard: "bsd"
  },
  {
    name: "SIGXFSZ",
    number: 25,
    action: "core",
    description: "File too big",
    standard: "bsd"
  },
  {
    name: "SIGVTALRM",
    number: 26,
    action: "terminate",
    description: "Timeout or timer",
    standard: "bsd"
  },
  {
    name: "SIGPROF",
    number: 27,
    action: "terminate",
    description: "Timeout or timer",
    standard: "bsd"
  },
  {
    name: "SIGWINCH",
    number: 28,
    action: "ignore",
    description: "Terminal window size changed",
    standard: "bsd"
  },
  {
    name: "SIGIO",
    number: 29,
    action: "terminate",
    description: "I/O is available",
    standard: "other"
  },
  {
    name: "SIGPOLL",
    number: 29,
    action: "terminate",
    description: "Watched event",
    standard: "other"
  },
  {
    name: "SIGINFO",
    number: 29,
    action: "ignore",
    description: "Request for process information",
    standard: "other"
  },
  {
    name: "SIGPWR",
    number: 30,
    action: "terminate",
    description: "Device running out of power",
    standard: "systemv"
  },
  {
    name: "SIGSYS",
    number: 31,
    action: "core",
    description: "Invalid system call",
    standard: "other"
  },
  {
    name: "SIGUNUSED",
    number: 31,
    action: "terminate",
    description: "Invalid system call",
    standard: "other"
  }
];
core.SIGNALS = SIGNALS;
var realtime = {};
Object.defineProperty(realtime, "__esModule", { value: true });
realtime.SIGRTMAX = realtime.getRealtimeSignals = void 0;
const getRealtimeSignals = function() {
  const length = SIGRTMAX - SIGRTMIN + 1;
  return Array.from({ length }, getRealtimeSignal);
};
realtime.getRealtimeSignals = getRealtimeSignals;
const getRealtimeSignal = function(value, index2) {
  return {
    name: `SIGRT${index2 + 1}`,
    number: SIGRTMIN + index2,
    action: "terminate",
    description: "Application-specific signal (realtime)",
    standard: "posix"
  };
};
const SIGRTMIN = 34;
const SIGRTMAX = 64;
realtime.SIGRTMAX = SIGRTMAX;
Object.defineProperty(signals$2, "__esModule", { value: true });
signals$2.getSignals = void 0;
var _os$1 = require$$0$2;
var _core = core;
var _realtime$1 = realtime;
const getSignals = function() {
  const realtimeSignals = (0, _realtime$1.getRealtimeSignals)();
  const signals = [..._core.SIGNALS, ...realtimeSignals].map(normalizeSignal);
  return signals;
};
signals$2.getSignals = getSignals;
const normalizeSignal = function({
  name,
  number: defaultNumber,
  description,
  action,
  forced = false,
  standard
}) {
  const {
    signals: { [name]: constantSignal }
  } = _os$1.constants;
  const supported = constantSignal !== void 0;
  const number2 = supported ? constantSignal : defaultNumber;
  return { name, number: number2, description, supported, action, forced, standard };
};
Object.defineProperty(main, "__esModule", { value: true });
main.signalsByNumber = main.signalsByName = void 0;
var _os = require$$0$2;
var _signals = signals$2;
var _realtime = realtime;
const getSignalsByName = function() {
  const signals = (0, _signals.getSignals)();
  return signals.reduce(getSignalByName, {});
};
const getSignalByName = function(signalByNameMemo, { name, number: number2, description, supported, action, forced, standard }) {
  return {
    ...signalByNameMemo,
    [name]: { name, number: number2, description, supported, action, forced, standard }
  };
};
const signalsByName$1 = getSignalsByName();
main.signalsByName = signalsByName$1;
const getSignalsByNumber = function() {
  const signals = (0, _signals.getSignals)();
  const length = _realtime.SIGRTMAX + 1;
  const signalsA = Array.from({ length }, (value, number2) => getSignalByNumber(number2, signals));
  return Object.assign({}, ...signalsA);
};
const getSignalByNumber = function(number2, signals) {
  const signal = findSignalByNumber(number2, signals);
  if (signal === void 0) {
    return {};
  }
  const { name, description, supported, action, forced, standard } = signal;
  return {
    [number2]: {
      name,
      number: number2,
      description,
      supported,
      action,
      forced,
      standard
    }
  };
};
const findSignalByNumber = function(number2, signals) {
  const signal = signals.find(({ name }) => _os.constants.signals[name] === number2);
  if (signal !== void 0) {
    return signal;
  }
  return signals.find((signalA) => signalA.number === number2);
};
const signalsByNumber = getSignalsByNumber();
main.signalsByNumber = signalsByNumber;
const { signalsByName } = main;
const getErrorPrefix = ({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled }) => {
  if (timedOut) {
    return `timed out after ${timeout} milliseconds`;
  }
  if (isCanceled) {
    return "was canceled";
  }
  if (errorCode !== void 0) {
    return `failed with ${errorCode}`;
  }
  if (signal !== void 0) {
    return `was killed with ${signal} (${signalDescription})`;
  }
  if (exitCode !== void 0) {
    return `failed with exit code ${exitCode}`;
  }
  return "failed";
};
const makeError$1 = ({
  stdout,
  stderr,
  all,
  error: error2,
  signal,
  exitCode,
  command: command2,
  escapedCommand,
  timedOut,
  isCanceled,
  killed,
  parsed: { options: { timeout } }
}) => {
  exitCode = exitCode === null ? void 0 : exitCode;
  signal = signal === null ? void 0 : signal;
  const signalDescription = signal === void 0 ? void 0 : signalsByName[signal].description;
  const errorCode = error2 && error2.code;
  const prefix = getErrorPrefix({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled });
  const execaMessage = `Command ${prefix}: ${command2}`;
  const isError = Object.prototype.toString.call(error2) === "[object Error]";
  const shortMessage = isError ? `${execaMessage}
${error2.message}` : execaMessage;
  const message = [shortMessage, stderr, stdout].filter(Boolean).join("\n");
  if (isError) {
    error2.originalMessage = error2.message;
    error2.message = message;
  } else {
    error2 = new Error(message);
  }
  error2.shortMessage = shortMessage;
  error2.command = command2;
  error2.escapedCommand = escapedCommand;
  error2.exitCode = exitCode;
  error2.signal = signal;
  error2.signalDescription = signalDescription;
  error2.stdout = stdout;
  error2.stderr = stderr;
  if (all !== void 0) {
    error2.all = all;
  }
  if ("bufferedData" in error2) {
    delete error2.bufferedData;
  }
  error2.failed = true;
  error2.timedOut = Boolean(timedOut);
  error2.isCanceled = isCanceled;
  error2.killed = killed && !timedOut;
  return error2;
};
var error = makeError$1;
var stdio = { exports: {} };
const aliases = ["stdin", "stdout", "stderr"];
const hasAlias = (options2) => aliases.some((alias) => options2[alias] !== void 0);
const normalizeStdio$1 = (options2) => {
  if (!options2) {
    return;
  }
  const { stdio: stdio2 } = options2;
  if (stdio2 === void 0) {
    return aliases.map((alias) => options2[alias]);
  }
  if (hasAlias(options2)) {
    throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map((alias) => `\`${alias}\``).join(", ")}`);
  }
  if (typeof stdio2 === "string") {
    return stdio2;
  }
  if (!Array.isArray(stdio2)) {
    throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio2}\``);
  }
  const length = Math.max(stdio2.length, aliases.length);
  return Array.from({ length }, (value, index2) => stdio2[index2]);
};
stdio.exports = normalizeStdio$1;
stdio.exports.node = (options2) => {
  const stdio2 = normalizeStdio$1(options2);
  if (stdio2 === "ipc") {
    return "ipc";
  }
  if (stdio2 === void 0 || typeof stdio2 === "string") {
    return [stdio2, stdio2, stdio2, "ipc"];
  }
  if (stdio2.includes("ipc")) {
    return stdio2;
  }
  return [...stdio2, "ipc"];
};
var stdioExports = stdio.exports;
var signalExit = { exports: {} };
var signals$1 = { exports: {} };
var hasRequiredSignals;
function requireSignals() {
  if (hasRequiredSignals) return signals$1.exports;
  hasRequiredSignals = 1;
  (function(module) {
    module.exports = [
      "SIGABRT",
      "SIGALRM",
      "SIGHUP",
      "SIGINT",
      "SIGTERM"
    ];
    if (process.platform !== "win32") {
      module.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      module.exports.push(
        "SIGIO",
        "SIGPOLL",
        "SIGPWR",
        "SIGSTKFLT",
        "SIGUNUSED"
      );
    }
  })(signals$1);
  return signals$1.exports;
}
var process$2 = commonjsGlobal.process;
const processOk = function(process2) {
  return process2 && typeof process2 === "object" && typeof process2.removeListener === "function" && typeof process2.emit === "function" && typeof process2.reallyExit === "function" && typeof process2.listeners === "function" && typeof process2.kill === "function" && typeof process2.pid === "number" && typeof process2.on === "function";
};
if (!processOk(process$2)) {
  signalExit.exports = function() {
    return function() {
    };
  };
} else {
  var assert = require$$0$5;
  var signals = requireSignals();
  var isWin = /^win/i.test(process$2.platform);
  var EE = require$$2;
  if (typeof EE !== "function") {
    EE = EE.EventEmitter;
  }
  var emitter;
  if (process$2.__signal_exit_emitter__) {
    emitter = process$2.__signal_exit_emitter__;
  } else {
    emitter = process$2.__signal_exit_emitter__ = new EE();
    emitter.count = 0;
    emitter.emitted = {};
  }
  if (!emitter.infinite) {
    emitter.setMaxListeners(Infinity);
    emitter.infinite = true;
  }
  signalExit.exports = function(cb, opts) {
    if (!processOk(commonjsGlobal.process)) {
      return function() {
      };
    }
    assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
    if (loaded === false) {
      load();
    }
    var ev = "exit";
    if (opts && opts.alwaysLast) {
      ev = "afterexit";
    }
    var remove = function() {
      emitter.removeListener(ev, cb);
      if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
        unload();
      }
    };
    emitter.on(ev, cb);
    return remove;
  };
  var unload = function unload2() {
    if (!loaded || !processOk(commonjsGlobal.process)) {
      return;
    }
    loaded = false;
    signals.forEach(function(sig) {
      try {
        process$2.removeListener(sig, sigListeners[sig]);
      } catch (er) {
      }
    });
    process$2.emit = originalProcessEmit;
    process$2.reallyExit = originalProcessReallyExit;
    emitter.count -= 1;
  };
  signalExit.exports.unload = unload;
  var emit = function emit2(event, code, signal) {
    if (emitter.emitted[event]) {
      return;
    }
    emitter.emitted[event] = true;
    emitter.emit(event, code, signal);
  };
  var sigListeners = {};
  signals.forEach(function(sig) {
    sigListeners[sig] = function listener() {
      if (!processOk(commonjsGlobal.process)) {
        return;
      }
      var listeners = process$2.listeners(sig);
      if (listeners.length === emitter.count) {
        unload();
        emit("exit", null, sig);
        emit("afterexit", null, sig);
        if (isWin && sig === "SIGHUP") {
          sig = "SIGINT";
        }
        process$2.kill(process$2.pid, sig);
      }
    };
  });
  signalExit.exports.signals = function() {
    return signals;
  };
  var loaded = false;
  var load = function load2() {
    if (loaded || !processOk(commonjsGlobal.process)) {
      return;
    }
    loaded = true;
    emitter.count += 1;
    signals = signals.filter(function(sig) {
      try {
        process$2.on(sig, sigListeners[sig]);
        return true;
      } catch (er) {
        return false;
      }
    });
    process$2.emit = processEmit;
    process$2.reallyExit = processReallyExit;
  };
  signalExit.exports.load = load;
  var originalProcessReallyExit = process$2.reallyExit;
  var processReallyExit = function processReallyExit2(code) {
    if (!processOk(commonjsGlobal.process)) {
      return;
    }
    process$2.exitCode = code || /* istanbul ignore next */
    0;
    emit("exit", process$2.exitCode, null);
    emit("afterexit", process$2.exitCode, null);
    originalProcessReallyExit.call(process$2, process$2.exitCode);
  };
  var originalProcessEmit = process$2.emit;
  var processEmit = function processEmit2(ev, arg) {
    if (ev === "exit" && processOk(commonjsGlobal.process)) {
      if (arg !== void 0) {
        process$2.exitCode = arg;
      }
      var ret = originalProcessEmit.apply(this, arguments);
      emit("exit", process$2.exitCode, null);
      emit("afterexit", process$2.exitCode, null);
      return ret;
    } else {
      return originalProcessEmit.apply(this, arguments);
    }
  };
}
var signalExitExports = signalExit.exports;
const os = require$$0$2;
const onExit = signalExitExports;
const DEFAULT_FORCE_KILL_TIMEOUT = 1e3 * 5;
const spawnedKill$1 = (kill2, signal = "SIGTERM", options2 = {}) => {
  const killResult = kill2(signal);
  setKillTimeout(kill2, signal, options2, killResult);
  return killResult;
};
const setKillTimeout = (kill2, signal, options2, killResult) => {
  if (!shouldForceKill(signal, options2, killResult)) {
    return;
  }
  const timeout = getForceKillAfterTimeout(options2);
  const t = setTimeout(() => {
    kill2("SIGKILL");
  }, timeout);
  if (t.unref) {
    t.unref();
  }
};
const shouldForceKill = (signal, { forceKillAfterTimeout }, killResult) => {
  return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
};
const isSigterm = (signal) => {
  return signal === os.constants.signals.SIGTERM || typeof signal === "string" && signal.toUpperCase() === "SIGTERM";
};
const getForceKillAfterTimeout = ({ forceKillAfterTimeout = true }) => {
  if (forceKillAfterTimeout === true) {
    return DEFAULT_FORCE_KILL_TIMEOUT;
  }
  if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
    throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
  }
  return forceKillAfterTimeout;
};
const spawnedCancel$1 = (spawned, context) => {
  const killResult = spawned.kill();
  if (killResult) {
    context.isCanceled = true;
  }
};
const timeoutKill = (spawned, signal, reject) => {
  spawned.kill(signal);
  reject(Object.assign(new Error("Timed out"), { timedOut: true, signal }));
};
const setupTimeout$1 = (spawned, { timeout, killSignal = "SIGTERM" }, spawnedPromise) => {
  if (timeout === 0 || timeout === void 0) {
    return spawnedPromise;
  }
  let timeoutId;
  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      timeoutKill(spawned, killSignal, reject);
    }, timeout);
  });
  const safeSpawnedPromise = spawnedPromise.finally(() => {
    clearTimeout(timeoutId);
  });
  return Promise.race([timeoutPromise, safeSpawnedPromise]);
};
const validateTimeout$1 = ({ timeout }) => {
  if (timeout !== void 0 && (!Number.isFinite(timeout) || timeout < 0)) {
    throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
  }
};
const setExitHandler$1 = async (spawned, { cleanup, detached }, timedPromise) => {
  if (!cleanup || detached) {
    return timedPromise;
  }
  const removeExitHandler = onExit(() => {
    spawned.kill();
  });
  return timedPromise.finally(() => {
    removeExitHandler();
  });
};
var kill = {
  spawnedKill: spawnedKill$1,
  spawnedCancel: spawnedCancel$1,
  setupTimeout: setupTimeout$1,
  validateTimeout: validateTimeout$1,
  setExitHandler: setExitHandler$1
};
const isStream$1 = (stream2) => stream2 !== null && typeof stream2 === "object" && typeof stream2.pipe === "function";
isStream$1.writable = (stream2) => isStream$1(stream2) && stream2.writable !== false && typeof stream2._write === "function" && typeof stream2._writableState === "object";
isStream$1.readable = (stream2) => isStream$1(stream2) && stream2.readable !== false && typeof stream2._read === "function" && typeof stream2._readableState === "object";
isStream$1.duplex = (stream2) => isStream$1.writable(stream2) && isStream$1.readable(stream2);
isStream$1.transform = (stream2) => isStream$1.duplex(stream2) && typeof stream2._transform === "function";
var isStream_1 = isStream$1;
var getStream$2 = { exports: {} };
const { PassThrough: PassThroughStream } = require$$0$6;
var bufferStream$1 = (options2) => {
  options2 = { ...options2 };
  const { array: array2 } = options2;
  let { encoding } = options2;
  const isBuffer2 = encoding === "buffer";
  let objectMode = false;
  if (array2) {
    objectMode = !(encoding || isBuffer2);
  } else {
    encoding = encoding || "utf8";
  }
  if (isBuffer2) {
    encoding = null;
  }
  const stream2 = new PassThroughStream({ objectMode });
  if (encoding) {
    stream2.setEncoding(encoding);
  }
  let length = 0;
  const chunks = [];
  stream2.on("data", (chunk) => {
    chunks.push(chunk);
    if (objectMode) {
      length = chunks.length;
    } else {
      length += chunk.length;
    }
  });
  stream2.getBufferedValue = () => {
    if (array2) {
      return chunks;
    }
    return isBuffer2 ? Buffer.concat(chunks, length) : chunks.join("");
  };
  stream2.getBufferedLength = () => length;
  return stream2;
};
const { constants: BufferConstants } = require$$0$7;
const stream$1 = require$$0$6;
const { promisify } = require$$2$1;
const bufferStream = bufferStream$1;
const streamPipelinePromisified = promisify(stream$1.pipeline);
class MaxBufferError extends Error {
  constructor() {
    super("maxBuffer exceeded");
    this.name = "MaxBufferError";
  }
}
async function getStream$1(inputStream, options2) {
  if (!inputStream) {
    throw new Error("Expected a stream");
  }
  options2 = {
    maxBuffer: Infinity,
    ...options2
  };
  const { maxBuffer } = options2;
  const stream2 = bufferStream(options2);
  await new Promise((resolve, reject) => {
    const rejectPromise = (error2) => {
      if (error2 && stream2.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
        error2.bufferedData = stream2.getBufferedValue();
      }
      reject(error2);
    };
    (async () => {
      try {
        await streamPipelinePromisified(inputStream, stream2);
        resolve();
      } catch (error2) {
        rejectPromise(error2);
      }
    })();
    stream2.on("data", () => {
      if (stream2.getBufferedLength() > maxBuffer) {
        rejectPromise(new MaxBufferError());
      }
    });
  });
  return stream2.getBufferedValue();
}
getStream$2.exports = getStream$1;
getStream$2.exports.buffer = (stream2, options2) => getStream$1(stream2, { ...options2, encoding: "buffer" });
getStream$2.exports.array = (stream2, options2) => getStream$1(stream2, { ...options2, array: true });
getStream$2.exports.MaxBufferError = MaxBufferError;
var getStreamExports = getStream$2.exports;
const { PassThrough } = require$$0$6;
var mergeStream$1 = function() {
  var sources = [];
  var output = new PassThrough({ objectMode: true });
  output.setMaxListeners(0);
  output.add = add;
  output.isEmpty = isEmpty;
  output.on("unpipe", remove);
  Array.prototype.slice.call(arguments).forEach(add);
  return output;
  function add(source2) {
    if (Array.isArray(source2)) {
      source2.forEach(add);
      return this;
    }
    sources.push(source2);
    source2.once("end", remove.bind(null, source2));
    source2.once("error", output.emit.bind(output, "error"));
    source2.pipe(output, { end: false });
    return this;
  }
  function isEmpty() {
    return sources.length == 0;
  }
  function remove(source2) {
    sources = sources.filter(function(it) {
      return it !== source2;
    });
    if (!sources.length && output.readable) {
      output.end();
    }
  }
};
const isStream = isStream_1;
const getStream = getStreamExports;
const mergeStream = mergeStream$1;
const handleInput$1 = (spawned, input) => {
  if (input === void 0 || spawned.stdin === void 0) {
    return;
  }
  if (isStream(input)) {
    input.pipe(spawned.stdin);
  } else {
    spawned.stdin.end(input);
  }
};
const makeAllStream$1 = (spawned, { all }) => {
  if (!all || !spawned.stdout && !spawned.stderr) {
    return;
  }
  const mixed2 = mergeStream();
  if (spawned.stdout) {
    mixed2.add(spawned.stdout);
  }
  if (spawned.stderr) {
    mixed2.add(spawned.stderr);
  }
  return mixed2;
};
const getBufferedData = async (stream2, streamPromise) => {
  if (!stream2) {
    return;
  }
  stream2.destroy();
  try {
    return await streamPromise;
  } catch (error2) {
    return error2.bufferedData;
  }
};
const getStreamPromise = (stream2, { encoding, buffer, maxBuffer }) => {
  if (!stream2 || !buffer) {
    return;
  }
  if (encoding) {
    return getStream(stream2, { encoding, maxBuffer });
  }
  return getStream.buffer(stream2, { maxBuffer });
};
const getSpawnedResult$1 = async ({ stdout, stderr, all }, { encoding, buffer, maxBuffer }, processDone) => {
  const stdoutPromise = getStreamPromise(stdout, { encoding, buffer, maxBuffer });
  const stderrPromise = getStreamPromise(stderr, { encoding, buffer, maxBuffer });
  const allPromise = getStreamPromise(all, { encoding, buffer, maxBuffer: maxBuffer * 2 });
  try {
    return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
  } catch (error2) {
    return Promise.all([
      { error: error2, signal: error2.signal, timedOut: error2.timedOut },
      getBufferedData(stdout, stdoutPromise),
      getBufferedData(stderr, stderrPromise),
      getBufferedData(all, allPromise)
    ]);
  }
};
const validateInputSync$1 = ({ input }) => {
  if (isStream(input)) {
    throw new TypeError("The `input` option cannot be a stream in sync mode");
  }
};
var stream = {
  handleInput: handleInput$1,
  makeAllStream: makeAllStream$1,
  getSpawnedResult: getSpawnedResult$1,
  validateInputSync: validateInputSync$1
};
const nativePromisePrototype = (async () => {
})().constructor.prototype;
const descriptors = ["then", "catch", "finally"].map((property2) => [
  property2,
  Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property2)
]);
const mergePromise$1 = (spawned, promise2) => {
  for (const [property2, descriptor] of descriptors) {
    const value = typeof promise2 === "function" ? (...args) => Reflect.apply(descriptor.value, promise2(), args) : descriptor.value.bind(promise2);
    Reflect.defineProperty(spawned, property2, { ...descriptor, value });
  }
  return spawned;
};
const getSpawnedPromise$1 = (spawned) => {
  return new Promise((resolve, reject) => {
    spawned.on("exit", (exitCode, signal) => {
      resolve({ exitCode, signal });
    });
    spawned.on("error", (error2) => {
      reject(error2);
    });
    if (spawned.stdin) {
      spawned.stdin.on("error", (error2) => {
        reject(error2);
      });
    }
  });
};
var promise = {
  mergePromise: mergePromise$1,
  getSpawnedPromise: getSpawnedPromise$1
};
const normalizeArgs = (file, args = []) => {
  if (!Array.isArray(args)) {
    return [file];
  }
  return [file, ...args];
};
const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
const DOUBLE_QUOTES_REGEXP = /"/g;
const escapeArg = (arg) => {
  if (typeof arg !== "string" || NO_ESCAPE_REGEXP.test(arg)) {
    return arg;
  }
  return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
};
const joinCommand$1 = (file, args) => {
  return normalizeArgs(file, args).join(" ");
};
const getEscapedCommand$1 = (file, args) => {
  return normalizeArgs(file, args).map((arg) => escapeArg(arg)).join(" ");
};
const SPACES_REGEXP = / +/g;
const parseCommand$1 = (command2) => {
  const tokens = [];
  for (const token of command2.trim().split(SPACES_REGEXP)) {
    const previousToken = tokens[tokens.length - 1];
    if (previousToken && previousToken.endsWith("\\")) {
      tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
    } else {
      tokens.push(token);
    }
  }
  return tokens;
};
var command = {
  joinCommand: joinCommand$1,
  getEscapedCommand: getEscapedCommand$1,
  parseCommand: parseCommand$1
};
const path = require$$0$4;
const childProcess = require$$0$1;
const crossSpawn = crossSpawnExports;
const stripFinalNewline = stripFinalNewline$1;
const npmRunPath = npmRunPathExports;
const onetime = onetimeExports;
const makeError = error;
const normalizeStdio = stdioExports;
const { spawnedKill, spawnedCancel, setupTimeout, validateTimeout, setExitHandler } = kill;
const { handleInput, getSpawnedResult, makeAllStream, validateInputSync } = stream;
const { mergePromise, getSpawnedPromise } = promise;
const { joinCommand, parseCommand, getEscapedCommand } = command;
const DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
const getEnv = ({ env: envOption, extendEnv, preferLocal, localDir, execPath }) => {
  const env2 = extendEnv ? { ...process.env, ...envOption } : envOption;
  if (preferLocal) {
    return npmRunPath.env({ env: env2, cwd: localDir, execPath });
  }
  return env2;
};
const handleArguments = (file, args, options2 = {}) => {
  const parsed = crossSpawn._parse(file, args, options2);
  file = parsed.command;
  args = parsed.args;
  options2 = parsed.options;
  options2 = {
    maxBuffer: DEFAULT_MAX_BUFFER,
    buffer: true,
    stripFinalNewline: true,
    extendEnv: true,
    preferLocal: false,
    localDir: options2.cwd || process.cwd(),
    execPath: process.execPath,
    encoding: "utf8",
    reject: true,
    cleanup: true,
    all: false,
    windowsHide: true,
    ...options2
  };
  options2.env = getEnv(options2);
  options2.stdio = normalizeStdio(options2);
  if (process.platform === "win32" && path.basename(file, ".exe") === "cmd") {
    args.unshift("/q");
  }
  return { file, args, options: options2, parsed };
};
const handleOutput = (options2, value, error2) => {
  if (typeof value !== "string" && !Buffer.isBuffer(value)) {
    return error2 === void 0 ? void 0 : "";
  }
  if (options2.stripFinalNewline) {
    return stripFinalNewline(value);
  }
  return value;
};
const execa = (file, args, options2) => {
  const parsed = handleArguments(file, args, options2);
  const command2 = joinCommand(file, args);
  const escapedCommand = getEscapedCommand(file, args);
  validateTimeout(parsed.options);
  let spawned;
  try {
    spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
  } catch (error2) {
    const dummySpawned = new childProcess.ChildProcess();
    const errorPromise = Promise.reject(makeError({
      error: error2,
      stdout: "",
      stderr: "",
      all: "",
      command: command2,
      escapedCommand,
      parsed,
      timedOut: false,
      isCanceled: false,
      killed: false
    }));
    return mergePromise(dummySpawned, errorPromise);
  }
  const spawnedPromise = getSpawnedPromise(spawned);
  const timedPromise = setupTimeout(spawned, parsed.options, spawnedPromise);
  const processDone = setExitHandler(spawned, parsed.options, timedPromise);
  const context = { isCanceled: false };
  spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
  spawned.cancel = spawnedCancel.bind(null, spawned, context);
  const handlePromise = async () => {
    const [{ error: error2, exitCode, signal, timedOut }, stdoutResult, stderrResult, allResult] = await getSpawnedResult(spawned, parsed.options, processDone);
    const stdout = handleOutput(parsed.options, stdoutResult);
    const stderr = handleOutput(parsed.options, stderrResult);
    const all = handleOutput(parsed.options, allResult);
    if (error2 || exitCode !== 0 || signal !== null) {
      const returnedError = makeError({
        error: error2,
        exitCode,
        signal,
        stdout,
        stderr,
        all,
        command: command2,
        escapedCommand,
        parsed,
        timedOut,
        isCanceled: context.isCanceled,
        killed: spawned.killed
      });
      if (!parsed.options.reject) {
        return returnedError;
      }
      throw returnedError;
    }
    return {
      command: command2,
      escapedCommand,
      exitCode: 0,
      stdout,
      stderr,
      all,
      failed: false,
      timedOut: false,
      isCanceled: false,
      killed: false
    };
  };
  const handlePromiseOnce = onetime(handlePromise);
  handleInput(spawned, parsed.options.input);
  spawned.all = makeAllStream(spawned, parsed.options);
  return mergePromise(spawned, handlePromiseOnce);
};
execa$1.exports = execa;
execa$1.exports.sync = (file, args, options2) => {
  const parsed = handleArguments(file, args, options2);
  const command2 = joinCommand(file, args);
  const escapedCommand = getEscapedCommand(file, args);
  validateInputSync(parsed.options);
  let result;
  try {
    result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
  } catch (error2) {
    throw makeError({
      error: error2,
      stdout: "",
      stderr: "",
      all: "",
      command: command2,
      escapedCommand,
      parsed,
      timedOut: false,
      isCanceled: false,
      killed: false
    });
  }
  const stdout = handleOutput(parsed.options, result.stdout, result.error);
  const stderr = handleOutput(parsed.options, result.stderr, result.error);
  if (result.error || result.status !== 0 || result.signal !== null) {
    const error2 = makeError({
      stdout,
      stderr,
      error: result.error,
      signal: result.signal,
      exitCode: result.status,
      command: command2,
      escapedCommand,
      parsed,
      timedOut: result.error && result.error.code === "ETIMEDOUT",
      isCanceled: false,
      killed: result.signal !== null
    });
    if (!parsed.options.reject) {
      return error2;
    }
    throw error2;
  }
  return {
    command: command2,
    escapedCommand,
    exitCode: 0,
    stdout,
    stderr,
    failed: false,
    timedOut: false,
    isCanceled: false,
    killed: false
  };
};
execa$1.exports.command = (command2, options2) => {
  const [file, ...args] = parseCommand(command2);
  return execa(file, args, options2);
};
execa$1.exports.commandSync = (command2, options2) => {
  const [file, ...args] = parseCommand(command2);
  return execa.sync(file, args, options2);
};
execa$1.exports.node = (scriptPath, args, options2 = {}) => {
  if (args && !Array.isArray(args) && typeof args === "object") {
    options2 = args;
    args = [];
  }
  const stdio2 = normalizeStdio.node(options2);
  const defaultExecArgv = process.execArgv.filter((arg) => !arg.startsWith("--inspect"));
  const {
    nodePath = process.execPath,
    nodeOptions = defaultExecArgv
  } = options2;
  return execa(
    nodePath,
    [
      ...nodeOptions,
      scriptPath,
      ...Array.isArray(args) ? args : []
    ],
    {
      ...options2,
      stdin: void 0,
      stdout: void 0,
      stderr: void 0,
      stdio: stdio2,
      shell: false
    }
  );
};
var slugify$2 = { exports: {} };
var escapeStringRegexp$3 = (string2) => {
  if (typeof string2 !== "string") {
    throw new TypeError("Expected a string");
  }
  return string2.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
};
var symbolTag = "[object Symbol]";
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
var rsComboMarksRange = "\\u0300-\\u036f\\ufe20-\\ufe23", rsComboSymbolsRange = "\\u20d0-\\u20f0";
var rsCombo = "[" + rsComboMarksRange + rsComboSymbolsRange + "]";
var reComboMark = RegExp(rsCombo, "g");
var deburredLetters = {
  // Latin-1 Supplement block.
  "À": "A",
  "Á": "A",
  "Â": "A",
  "Ã": "A",
  "Ä": "A",
  "Å": "A",
  "à": "a",
  "á": "a",
  "â": "a",
  "ã": "a",
  "ä": "a",
  "å": "a",
  "Ç": "C",
  "ç": "c",
  "Ð": "D",
  "ð": "d",
  "È": "E",
  "É": "E",
  "Ê": "E",
  "Ë": "E",
  "è": "e",
  "é": "e",
  "ê": "e",
  "ë": "e",
  "Ì": "I",
  "Í": "I",
  "Î": "I",
  "Ï": "I",
  "ì": "i",
  "í": "i",
  "î": "i",
  "ï": "i",
  "Ñ": "N",
  "ñ": "n",
  "Ò": "O",
  "Ó": "O",
  "Ô": "O",
  "Õ": "O",
  "Ö": "O",
  "Ø": "O",
  "ò": "o",
  "ó": "o",
  "ô": "o",
  "õ": "o",
  "ö": "o",
  "ø": "o",
  "Ù": "U",
  "Ú": "U",
  "Û": "U",
  "Ü": "U",
  "ù": "u",
  "ú": "u",
  "û": "u",
  "ü": "u",
  "Ý": "Y",
  "ý": "y",
  "ÿ": "y",
  "Æ": "Ae",
  "æ": "ae",
  "Þ": "Th",
  "þ": "th",
  "ß": "ss",
  // Latin Extended-A block.
  "Ā": "A",
  "Ă": "A",
  "Ą": "A",
  "ā": "a",
  "ă": "a",
  "ą": "a",
  "Ć": "C",
  "Ĉ": "C",
  "Ċ": "C",
  "Č": "C",
  "ć": "c",
  "ĉ": "c",
  "ċ": "c",
  "č": "c",
  "Ď": "D",
  "Đ": "D",
  "ď": "d",
  "đ": "d",
  "Ē": "E",
  "Ĕ": "E",
  "Ė": "E",
  "Ę": "E",
  "Ě": "E",
  "ē": "e",
  "ĕ": "e",
  "ė": "e",
  "ę": "e",
  "ě": "e",
  "Ĝ": "G",
  "Ğ": "G",
  "Ġ": "G",
  "Ģ": "G",
  "ĝ": "g",
  "ğ": "g",
  "ġ": "g",
  "ģ": "g",
  "Ĥ": "H",
  "Ħ": "H",
  "ĥ": "h",
  "ħ": "h",
  "Ĩ": "I",
  "Ī": "I",
  "Ĭ": "I",
  "Į": "I",
  "İ": "I",
  "ĩ": "i",
  "ī": "i",
  "ĭ": "i",
  "į": "i",
  "ı": "i",
  "Ĵ": "J",
  "ĵ": "j",
  "Ķ": "K",
  "ķ": "k",
  "ĸ": "k",
  "Ĺ": "L",
  "Ļ": "L",
  "Ľ": "L",
  "Ŀ": "L",
  "Ł": "L",
  "ĺ": "l",
  "ļ": "l",
  "ľ": "l",
  "ŀ": "l",
  "ł": "l",
  "Ń": "N",
  "Ņ": "N",
  "Ň": "N",
  "Ŋ": "N",
  "ń": "n",
  "ņ": "n",
  "ň": "n",
  "ŋ": "n",
  "Ō": "O",
  "Ŏ": "O",
  "Ő": "O",
  "ō": "o",
  "ŏ": "o",
  "ő": "o",
  "Ŕ": "R",
  "Ŗ": "R",
  "Ř": "R",
  "ŕ": "r",
  "ŗ": "r",
  "ř": "r",
  "Ś": "S",
  "Ŝ": "S",
  "Ş": "S",
  "Š": "S",
  "ś": "s",
  "ŝ": "s",
  "ş": "s",
  "š": "s",
  "Ţ": "T",
  "Ť": "T",
  "Ŧ": "T",
  "ţ": "t",
  "ť": "t",
  "ŧ": "t",
  "Ũ": "U",
  "Ū": "U",
  "Ŭ": "U",
  "Ů": "U",
  "Ű": "U",
  "Ų": "U",
  "ũ": "u",
  "ū": "u",
  "ŭ": "u",
  "ů": "u",
  "ű": "u",
  "ų": "u",
  "Ŵ": "W",
  "ŵ": "w",
  "Ŷ": "Y",
  "ŷ": "y",
  "Ÿ": "Y",
  "Ź": "Z",
  "Ż": "Z",
  "Ž": "Z",
  "ź": "z",
  "ż": "z",
  "ž": "z",
  "Ĳ": "IJ",
  "ĳ": "ij",
  "Œ": "Oe",
  "œ": "oe",
  "ŉ": "'n",
  "ſ": "ss"
};
var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal || freeSelf || Function("return this")();
function basePropertyOf(object2) {
  return function(key) {
    return object2 == null ? void 0 : object2[key];
  };
}
var deburrLetter = basePropertyOf(deburredLetters);
var objectProto = Object.prototype;
var objectToString = objectProto.toString;
var Symbol$1 = root.Symbol;
var symbolProto = Symbol$1 ? Symbol$1.prototype : void 0, symbolToString$1 = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString$1 ? symbolToString$1.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
}
function isObjectLike(value) {
  return !!value && typeof value == "object";
}
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
}
function toString$1(value) {
  return value == null ? "" : baseToString(value);
}
function deburr$1(string2) {
  string2 = toString$1(string2);
  return string2 && string2.replace(reLatin, deburrLetter).replace(reComboMark, "");
}
var lodash_deburr = deburr$1;
const matchOperatorsRegex = /[|\\{}()[\]^$+*?.-]/g;
var escapeStringRegexp$2 = (string2) => {
  if (typeof string2 !== "string") {
    throw new TypeError("Expected a string");
  }
  return string2.replace(matchOperatorsRegex, "\\$&");
};
var replacements = [
  // German umlauts
  ["ß", "ss"],
  ["ä", "ae"],
  ["Ä", "Ae"],
  ["ö", "oe"],
  ["Ö", "Oe"],
  ["ü", "ue"],
  ["Ü", "Ue"],
  // Latin
  ["À", "A"],
  ["Á", "A"],
  ["Â", "A"],
  ["Ã", "A"],
  ["Ä", "Ae"],
  ["Å", "A"],
  ["Æ", "AE"],
  ["Ç", "C"],
  ["È", "E"],
  ["É", "E"],
  ["Ê", "E"],
  ["Ë", "E"],
  ["Ì", "I"],
  ["Í", "I"],
  ["Î", "I"],
  ["Ï", "I"],
  ["Ð", "D"],
  ["Ñ", "N"],
  ["Ò", "O"],
  ["Ó", "O"],
  ["Ô", "O"],
  ["Õ", "O"],
  ["Ö", "Oe"],
  ["Ő", "O"],
  ["Ø", "O"],
  ["Ù", "U"],
  ["Ú", "U"],
  ["Û", "U"],
  ["Ü", "Ue"],
  ["Ű", "U"],
  ["Ý", "Y"],
  ["Þ", "TH"],
  ["ß", "ss"],
  ["à", "a"],
  ["á", "a"],
  ["â", "a"],
  ["ã", "a"],
  ["ä", "ae"],
  ["å", "a"],
  ["æ", "ae"],
  ["ç", "c"],
  ["è", "e"],
  ["é", "e"],
  ["ê", "e"],
  ["ë", "e"],
  ["ì", "i"],
  ["í", "i"],
  ["î", "i"],
  ["ï", "i"],
  ["ð", "d"],
  ["ñ", "n"],
  ["ò", "o"],
  ["ó", "o"],
  ["ô", "o"],
  ["õ", "o"],
  ["ö", "oe"],
  ["ő", "o"],
  ["ø", "o"],
  ["ù", "u"],
  ["ú", "u"],
  ["û", "u"],
  ["ü", "ue"],
  ["ű", "u"],
  ["ý", "y"],
  ["þ", "th"],
  ["ÿ", "y"],
  ["ẞ", "SS"],
  // Vietnamese
  ["à", "a"],
  ["À", "A"],
  ["á", "a"],
  ["Á", "A"],
  ["â", "a"],
  ["Â", "A"],
  ["ã", "a"],
  ["Ã", "A"],
  ["è", "e"],
  ["È", "E"],
  ["é", "e"],
  ["É", "E"],
  ["ê", "e"],
  ["Ê", "E"],
  ["ì", "i"],
  ["Ì", "I"],
  ["í", "i"],
  ["Í", "I"],
  ["ò", "o"],
  ["Ò", "O"],
  ["ó", "o"],
  ["Ó", "O"],
  ["ô", "o"],
  ["Ô", "O"],
  ["õ", "o"],
  ["Õ", "O"],
  ["ù", "u"],
  ["Ù", "U"],
  ["ú", "u"],
  ["Ú", "U"],
  ["ý", "y"],
  ["Ý", "Y"],
  ["ă", "a"],
  ["Ă", "A"],
  ["Đ", "D"],
  ["đ", "d"],
  ["ĩ", "i"],
  ["Ĩ", "I"],
  ["ũ", "u"],
  ["Ũ", "U"],
  ["ơ", "o"],
  ["Ơ", "O"],
  ["ư", "u"],
  ["Ư", "U"],
  ["ạ", "a"],
  ["Ạ", "A"],
  ["ả", "a"],
  ["Ả", "A"],
  ["ấ", "a"],
  ["Ấ", "A"],
  ["ầ", "a"],
  ["Ầ", "A"],
  ["ẩ", "a"],
  ["Ẩ", "A"],
  ["ẫ", "a"],
  ["Ẫ", "A"],
  ["ậ", "a"],
  ["Ậ", "A"],
  ["ắ", "a"],
  ["Ắ", "A"],
  ["ằ", "a"],
  ["Ằ", "A"],
  ["ẳ", "a"],
  ["Ẳ", "A"],
  ["ẵ", "a"],
  ["Ẵ", "A"],
  ["ặ", "a"],
  ["Ặ", "A"],
  ["ẹ", "e"],
  ["Ẹ", "E"],
  ["ẻ", "e"],
  ["Ẻ", "E"],
  ["ẽ", "e"],
  ["Ẽ", "E"],
  ["ế", "e"],
  ["Ế", "E"],
  ["ề", "e"],
  ["Ề", "E"],
  ["ể", "e"],
  ["Ể", "E"],
  ["ễ", "e"],
  ["Ễ", "E"],
  ["ệ", "e"],
  ["Ệ", "E"],
  ["ỉ", "i"],
  ["Ỉ", "I"],
  ["ị", "i"],
  ["Ị", "I"],
  ["ọ", "o"],
  ["Ọ", "O"],
  ["ỏ", "o"],
  ["Ỏ", "O"],
  ["ố", "o"],
  ["Ố", "O"],
  ["ồ", "o"],
  ["Ồ", "O"],
  ["ổ", "o"],
  ["Ổ", "O"],
  ["ỗ", "o"],
  ["Ỗ", "O"],
  ["ộ", "o"],
  ["Ộ", "O"],
  ["ớ", "o"],
  ["Ớ", "O"],
  ["ờ", "o"],
  ["Ờ", "O"],
  ["ở", "o"],
  ["Ở", "O"],
  ["ỡ", "o"],
  ["Ỡ", "O"],
  ["ợ", "o"],
  ["Ợ", "O"],
  ["ụ", "u"],
  ["Ụ", "U"],
  ["ủ", "u"],
  ["Ủ", "U"],
  ["ứ", "u"],
  ["Ứ", "U"],
  ["ừ", "u"],
  ["Ừ", "U"],
  ["ử", "u"],
  ["Ử", "U"],
  ["ữ", "u"],
  ["Ữ", "U"],
  ["ự", "u"],
  ["Ự", "U"],
  ["ỳ", "y"],
  ["Ỳ", "Y"],
  ["ỵ", "y"],
  ["Ỵ", "Y"],
  ["ỷ", "y"],
  ["Ỷ", "Y"],
  ["ỹ", "y"],
  ["Ỹ", "Y"],
  // Arabic
  ["ء", "e"],
  ["آ", "a"],
  ["أ", "a"],
  ["ؤ", "w"],
  ["إ", "i"],
  ["ئ", "y"],
  ["ا", "a"],
  ["ب", "b"],
  ["ة", "t"],
  ["ت", "t"],
  ["ث", "th"],
  ["ج", "j"],
  ["ح", "h"],
  ["خ", "kh"],
  ["د", "d"],
  ["ذ", "dh"],
  ["ر", "r"],
  ["ز", "z"],
  ["س", "s"],
  ["ش", "sh"],
  ["ص", "s"],
  ["ض", "d"],
  ["ط", "t"],
  ["ظ", "z"],
  ["ع", "e"],
  ["غ", "gh"],
  ["ـ", "_"],
  ["ف", "f"],
  ["ق", "q"],
  ["ك", "k"],
  ["ل", "l"],
  ["م", "m"],
  ["ن", "n"],
  ["ه", "h"],
  ["و", "w"],
  ["ى", "a"],
  ["ي", "y"],
  ["َ‎", "a"],
  ["ُ", "u"],
  ["ِ‎", "i"],
  ["٠", "0"],
  ["١", "1"],
  ["٢", "2"],
  ["٣", "3"],
  ["٤", "4"],
  ["٥", "5"],
  ["٦", "6"],
  ["٧", "7"],
  ["٨", "8"],
  ["٩", "9"],
  // Persian / Farsi
  ["چ", "ch"],
  ["ک", "k"],
  ["گ", "g"],
  ["پ", "p"],
  ["ژ", "zh"],
  ["ی", "y"],
  ["۰", "0"],
  ["۱", "1"],
  ["۲", "2"],
  ["۳", "3"],
  ["۴", "4"],
  ["۵", "5"],
  ["۶", "6"],
  ["۷", "7"],
  ["۸", "8"],
  ["۹", "9"],
  // Pashto
  ["ټ", "p"],
  ["ځ", "z"],
  ["څ", "c"],
  ["ډ", "d"],
  ["ﺫ", "d"],
  ["ﺭ", "r"],
  ["ړ", "r"],
  ["ﺯ", "z"],
  ["ږ", "g"],
  ["ښ", "x"],
  ["ګ", "g"],
  ["ڼ", "n"],
  ["ۀ", "e"],
  ["ې", "e"],
  ["ۍ", "ai"],
  // Urdu
  ["ٹ", "t"],
  ["ڈ", "d"],
  ["ڑ", "r"],
  ["ں", "n"],
  ["ہ", "h"],
  ["ھ", "h"],
  ["ے", "e"],
  // Russian
  ["А", "A"],
  ["а", "a"],
  ["Б", "B"],
  ["б", "b"],
  ["В", "V"],
  ["в", "v"],
  ["Г", "G"],
  ["г", "g"],
  ["Д", "D"],
  ["д", "d"],
  ["Е", "E"],
  ["е", "e"],
  ["Ж", "Zh"],
  ["ж", "zh"],
  ["З", "Z"],
  ["з", "z"],
  ["И", "I"],
  ["и", "i"],
  ["Й", "J"],
  ["й", "j"],
  ["К", "K"],
  ["к", "k"],
  ["Л", "L"],
  ["л", "l"],
  ["М", "M"],
  ["м", "m"],
  ["Н", "N"],
  ["н", "n"],
  ["О", "O"],
  ["о", "o"],
  ["П", "P"],
  ["п", "p"],
  ["Р", "R"],
  ["р", "r"],
  ["С", "S"],
  ["с", "s"],
  ["Т", "T"],
  ["т", "t"],
  ["У", "U"],
  ["у", "u"],
  ["Ф", "F"],
  ["ф", "f"],
  ["Х", "H"],
  ["х", "h"],
  ["Ц", "Cz"],
  ["ц", "cz"],
  ["Ч", "Ch"],
  ["ч", "ch"],
  ["Ш", "Sh"],
  ["ш", "sh"],
  ["Щ", "Shh"],
  ["щ", "shh"],
  ["Ъ", ""],
  ["ъ", ""],
  ["Ы", "Y"],
  ["ы", "y"],
  ["Ь", ""],
  ["ь", ""],
  ["Э", "E"],
  ["э", "e"],
  ["Ю", "Yu"],
  ["ю", "yu"],
  ["Я", "Ya"],
  ["я", "ya"],
  ["Ё", "Yo"],
  ["ё", "yo"],
  // Romanian
  ["ă", "a"],
  ["Ă", "A"],
  ["ș", "s"],
  ["Ș", "S"],
  ["ț", "t"],
  ["Ț", "T"],
  ["ţ", "t"],
  ["Ţ", "T"],
  // Turkish
  ["ş", "s"],
  ["Ş", "S"],
  ["ç", "c"],
  ["Ç", "C"],
  ["ğ", "g"],
  ["Ğ", "G"],
  ["ı", "i"],
  ["İ", "I"],
  // Armenian
  ["ա", "a"],
  ["Ա", "A"],
  ["բ", "b"],
  ["Բ", "B"],
  ["գ", "g"],
  ["Գ", "G"],
  ["դ", "d"],
  ["Դ", "D"],
  ["ե", "ye"],
  ["Ե", "Ye"],
  ["զ", "z"],
  ["Զ", "Z"],
  ["է", "e"],
  ["Է", "E"],
  ["ը", "y"],
  ["Ը", "Y"],
  ["թ", "t"],
  ["Թ", "T"],
  ["ժ", "zh"],
  ["Ժ", "Zh"],
  ["ի", "i"],
  ["Ի", "I"],
  ["լ", "l"],
  ["Լ", "L"],
  ["խ", "kh"],
  ["Խ", "Kh"],
  ["ծ", "ts"],
  ["Ծ", "Ts"],
  ["կ", "k"],
  ["Կ", "K"],
  ["հ", "h"],
  ["Հ", "H"],
  ["ձ", "dz"],
  ["Ձ", "Dz"],
  ["ղ", "gh"],
  ["Ղ", "Gh"],
  ["ճ", "tch"],
  ["Ճ", "Tch"],
  ["մ", "m"],
  ["Մ", "M"],
  ["յ", "y"],
  ["Յ", "Y"],
  ["ն", "n"],
  ["Ն", "N"],
  ["շ", "sh"],
  ["Շ", "Sh"],
  ["ո", "vo"],
  ["Ո", "Vo"],
  ["չ", "ch"],
  ["Չ", "Ch"],
  ["պ", "p"],
  ["Պ", "P"],
  ["ջ", "j"],
  ["Ջ", "J"],
  ["ռ", "r"],
  ["Ռ", "R"],
  ["ս", "s"],
  ["Ս", "S"],
  ["վ", "v"],
  ["Վ", "V"],
  ["տ", "t"],
  ["Տ", "T"],
  ["ր", "r"],
  ["Ր", "R"],
  ["ց", "c"],
  ["Ց", "C"],
  ["ու", "u"],
  ["ՈՒ", "U"],
  ["Ու", "U"],
  ["փ", "p"],
  ["Փ", "P"],
  ["ք", "q"],
  ["Ք", "Q"],
  ["օ", "o"],
  ["Օ", "O"],
  ["ֆ", "f"],
  ["Ֆ", "F"],
  ["և", "yev"],
  // Georgian
  ["ა", "a"],
  ["ბ", "b"],
  ["გ", "g"],
  ["დ", "d"],
  ["ე", "e"],
  ["ვ", "v"],
  ["ზ", "z"],
  ["თ", "t"],
  ["ი", "i"],
  ["კ", "k"],
  ["ლ", "l"],
  ["მ", "m"],
  ["ნ", "n"],
  ["ო", "o"],
  ["პ", "p"],
  ["ჟ", "zh"],
  ["რ", "r"],
  ["ს", "s"],
  ["ტ", "t"],
  ["უ", "u"],
  ["ფ", "ph"],
  ["ქ", "q"],
  ["ღ", "gh"],
  ["ყ", "k"],
  ["შ", "sh"],
  ["ჩ", "ch"],
  ["ც", "ts"],
  ["ძ", "dz"],
  ["წ", "ts"],
  ["ჭ", "tch"],
  ["ხ", "kh"],
  ["ჯ", "j"],
  ["ჰ", "h"],
  // Czech
  ["č", "c"],
  ["ď", "d"],
  ["ě", "e"],
  ["ň", "n"],
  ["ř", "r"],
  ["š", "s"],
  ["ť", "t"],
  ["ů", "u"],
  ["ž", "z"],
  ["Č", "C"],
  ["Ď", "D"],
  ["Ě", "E"],
  ["Ň", "N"],
  ["Ř", "R"],
  ["Š", "S"],
  ["Ť", "T"],
  ["Ů", "U"],
  ["Ž", "Z"],
  // Dhivehi
  ["ހ", "h"],
  ["ށ", "sh"],
  ["ނ", "n"],
  ["ރ", "r"],
  ["ބ", "b"],
  ["ޅ", "lh"],
  ["ކ", "k"],
  ["އ", "a"],
  ["ވ", "v"],
  ["މ", "m"],
  ["ފ", "f"],
  ["ދ", "dh"],
  ["ތ", "th"],
  ["ލ", "l"],
  ["ގ", "g"],
  ["ޏ", "gn"],
  ["ސ", "s"],
  ["ޑ", "d"],
  ["ޒ", "z"],
  ["ޓ", "t"],
  ["ޔ", "y"],
  ["ޕ", "p"],
  ["ޖ", "j"],
  ["ޗ", "ch"],
  ["ޘ", "tt"],
  ["ޙ", "hh"],
  ["ޚ", "kh"],
  ["ޛ", "th"],
  ["ޜ", "z"],
  ["ޝ", "sh"],
  ["ޞ", "s"],
  ["ޟ", "d"],
  ["ޠ", "t"],
  ["ޡ", "z"],
  ["ޢ", "a"],
  ["ޣ", "gh"],
  ["ޤ", "q"],
  ["ޥ", "w"],
  ["ަ", "a"],
  ["ާ", "aa"],
  ["ި", "i"],
  ["ީ", "ee"],
  ["ު", "u"],
  ["ޫ", "oo"],
  ["ެ", "e"],
  ["ޭ", "ey"],
  ["ޮ", "o"],
  ["ޯ", "oa"],
  ["ް", ""],
  // Greek
  ["α", "a"],
  ["β", "v"],
  ["γ", "g"],
  ["δ", "d"],
  ["ε", "e"],
  ["ζ", "z"],
  ["η", "i"],
  ["θ", "th"],
  ["ι", "i"],
  ["κ", "k"],
  ["λ", "l"],
  ["μ", "m"],
  ["ν", "n"],
  ["ξ", "ks"],
  ["ο", "o"],
  ["π", "p"],
  ["ρ", "r"],
  ["σ", "s"],
  ["τ", "t"],
  ["υ", "y"],
  ["φ", "f"],
  ["χ", "x"],
  ["ψ", "ps"],
  ["ω", "o"],
  ["ά", "a"],
  ["έ", "e"],
  ["ί", "i"],
  ["ό", "o"],
  ["ύ", "y"],
  ["ή", "i"],
  ["ώ", "o"],
  ["ς", "s"],
  ["ϊ", "i"],
  ["ΰ", "y"],
  ["ϋ", "y"],
  ["ΐ", "i"],
  ["Α", "A"],
  ["Β", "B"],
  ["Γ", "G"],
  ["Δ", "D"],
  ["Ε", "E"],
  ["Ζ", "Z"],
  ["Η", "I"],
  ["Θ", "TH"],
  ["Ι", "I"],
  ["Κ", "K"],
  ["Λ", "L"],
  ["Μ", "M"],
  ["Ν", "N"],
  ["Ξ", "KS"],
  ["Ο", "O"],
  ["Π", "P"],
  ["Ρ", "R"],
  ["Σ", "S"],
  ["Τ", "T"],
  ["Υ", "Y"],
  ["Φ", "F"],
  ["Χ", "X"],
  ["Ψ", "PS"],
  ["Ω", "O"],
  ["Ά", "A"],
  ["Έ", "E"],
  ["Ί", "I"],
  ["Ό", "O"],
  ["Ύ", "Y"],
  ["Ή", "I"],
  ["Ώ", "O"],
  ["Ϊ", "I"],
  ["Ϋ", "Y"],
  // Disabled as it conflicts with German and Latin.
  // Hungarian
  // ['ä', 'a'],
  // ['Ä', 'A'],
  // ['ö', 'o'],
  // ['Ö', 'O'],
  // ['ü', 'u'],
  // ['Ü', 'U'],
  // ['ű', 'u'],
  // ['Ű', 'U'],
  // Latvian
  ["ā", "a"],
  ["ē", "e"],
  ["ģ", "g"],
  ["ī", "i"],
  ["ķ", "k"],
  ["ļ", "l"],
  ["ņ", "n"],
  ["ū", "u"],
  ["Ā", "A"],
  ["Ē", "E"],
  ["Ģ", "G"],
  ["Ī", "I"],
  ["Ķ", "K"],
  ["Ļ", "L"],
  ["Ņ", "N"],
  ["Ū", "U"],
  ["č", "c"],
  ["š", "s"],
  ["ž", "z"],
  ["Č", "C"],
  ["Š", "S"],
  ["Ž", "Z"],
  // Lithuanian
  ["ą", "a"],
  ["č", "c"],
  ["ę", "e"],
  ["ė", "e"],
  ["į", "i"],
  ["š", "s"],
  ["ų", "u"],
  ["ū", "u"],
  ["ž", "z"],
  ["Ą", "A"],
  ["Č", "C"],
  ["Ę", "E"],
  ["Ė", "E"],
  ["Į", "I"],
  ["Š", "S"],
  ["Ų", "U"],
  ["Ū", "U"],
  // Macedonian
  ["Ќ", "Kj"],
  ["ќ", "kj"],
  ["Љ", "Lj"],
  ["љ", "lj"],
  ["Њ", "Nj"],
  ["њ", "nj"],
  ["Тс", "Ts"],
  ["тс", "ts"],
  // Polish
  ["ą", "a"],
  ["ć", "c"],
  ["ę", "e"],
  ["ł", "l"],
  ["ń", "n"],
  ["ś", "s"],
  ["ź", "z"],
  ["ż", "z"],
  ["Ą", "A"],
  ["Ć", "C"],
  ["Ę", "E"],
  ["Ł", "L"],
  ["Ń", "N"],
  ["Ś", "S"],
  ["Ź", "Z"],
  ["Ż", "Z"],
  // Disabled as it conflicts with Vietnamese.
  // Serbian
  // ['љ', 'lj'],
  // ['њ', 'nj'],
  // ['Љ', 'Lj'],
  // ['Њ', 'Nj'],
  // ['đ', 'dj'],
  // ['Đ', 'Dj'],
  // ['ђ', 'dj'],
  // ['ј', 'j'],
  // ['ћ', 'c'],
  // ['џ', 'dz'],
  // ['Ђ', 'Dj'],
  // ['Ј', 'j'],
  // ['Ћ', 'C'],
  // ['Џ', 'Dz'],
  // Disabled as it conflicts with German and Latin.
  // Slovak
  // ['ä', 'a'],
  // ['Ä', 'A'],
  // ['ľ', 'l'],
  // ['ĺ', 'l'],
  // ['ŕ', 'r'],
  // ['Ľ', 'L'],
  // ['Ĺ', 'L'],
  // ['Ŕ', 'R'],
  // Disabled as it conflicts with German and Latin.
  // Swedish
  // ['å', 'o'],
  // ['Å', 'o'],
  // ['ä', 'a'],
  // ['Ä', 'A'],
  // ['ë', 'e'],
  // ['Ë', 'E'],
  // ['ö', 'o'],
  // ['Ö', 'O'],
  // Ukrainian
  ["Є", "Ye"],
  ["І", "I"],
  ["Ї", "Yi"],
  ["Ґ", "G"],
  ["є", "ye"],
  ["і", "i"],
  ["ї", "yi"],
  ["ґ", "g"]
  // Danish
  // ['Æ', 'Ae'],
  // ['Ø', 'Oe'],
  // ['Å', 'Aa'],
  // ['æ', 'ae'],
  // ['ø', 'oe'],
  // ['å', 'aa']
];
const deburr = lodash_deburr;
const escapeStringRegexp$1 = escapeStringRegexp$2;
const builtinReplacements = replacements;
const doCustomReplacements = (string2, replacements2) => {
  for (const [key, value] of replacements2) {
    string2 = string2.replace(new RegExp(escapeStringRegexp$1(key), "g"), value);
  }
  return string2;
};
var transliterate$1 = (string2, options2) => {
  if (typeof string2 !== "string") {
    throw new TypeError(`Expected a string, got \`${typeof string2}\``);
  }
  options2 = {
    customReplacements: [],
    ...options2
  };
  const customReplacements = new Map([
    ...builtinReplacements,
    ...options2.customReplacements
  ]);
  string2 = string2.normalize();
  string2 = doCustomReplacements(string2, customReplacements);
  string2 = deburr(string2);
  return string2;
};
var overridableReplacements = [
  ["&", " and "],
  ["🦄", " unicorn "],
  ["♥", " love "]
];
const escapeStringRegexp = escapeStringRegexp$3;
const transliterate = transliterate$1;
const builtinOverridableReplacements = overridableReplacements;
const decamelize = (string2) => {
  return string2.replace(/([A-Z]{2,})(\d+)/g, "$1 $2").replace(/([a-z\d]+)([A-Z]{2,})/g, "$1 $2").replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z\d]+)/g, "$1 $2");
};
const removeMootSeparators = (string2, separator) => {
  const escapedSeparator = escapeStringRegexp(separator);
  return string2.replace(new RegExp(`${escapedSeparator}{2,}`, "g"), separator).replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"), "");
};
const slugify$1 = (string2, options2) => {
  if (typeof string2 !== "string") {
    throw new TypeError(`Expected a string, got \`${typeof string2}\``);
  }
  options2 = {
    separator: "-",
    lowercase: true,
    decamelize: true,
    customReplacements: [],
    preserveLeadingUnderscore: false,
    ...options2
  };
  const shouldPrependUnderscore = options2.preserveLeadingUnderscore && string2.startsWith("_");
  const customReplacements = new Map([
    ...builtinOverridableReplacements,
    ...options2.customReplacements
  ]);
  string2 = transliterate(string2, { customReplacements });
  if (options2.decamelize) {
    string2 = decamelize(string2);
  }
  let patternSlug = /[^a-zA-Z\d]+/g;
  if (options2.lowercase) {
    string2 = string2.toLowerCase();
    patternSlug = /[^a-z\d]+/g;
  }
  string2 = string2.replace(patternSlug, options2.separator);
  string2 = string2.replace(/\\/g, "");
  if (options2.separator) {
    string2 = removeMootSeparators(string2, options2.separator);
  }
  if (shouldPrependUnderscore) {
    string2 = `_${string2}`;
  }
  return string2;
};
const counter = () => {
  const occurrences = /* @__PURE__ */ new Map();
  const countable = (string2, options2) => {
    string2 = slugify$1(string2, options2);
    if (!string2) {
      return "";
    }
    const stringLower = string2.toLowerCase();
    const numberless = occurrences.get(stringLower.replace(/(?:-\d+?)+?$/, "")) || 0;
    const counter2 = occurrences.get(stringLower);
    occurrences.set(stringLower, typeof counter2 === "number" ? counter2 + 1 : 1);
    const newCounter = occurrences.get(stringLower) || 2;
    if (newCounter >= 2 || numberless > 2) {
      string2 = `${string2}-${newCounter}`;
    }
    return string2;
  };
  countable.reset = () => {
    occurrences.clear();
  };
  return countable;
};
slugify$2.exports = slugify$1;
slugify$2.exports.counter = counter;
const isCamelCase = (value) => /^[a-z][a-zA-Z0-9]+$/.test(value);
const isKebabCase = (value) => /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/.test(value);
const { toString } = Object.prototype;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString = typeof Symbol !== "undefined" ? Symbol.prototype.toString : () => "";
const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
function printNumber(val) {
  if (val != +val) return "NaN";
  const isNegativeZero = val === 0 && 1 / val < 0;
  return isNegativeZero ? "-0" : `${val}`;
}
function printSimpleValue(val, quoteStrings = false) {
  if (val == null || val === true || val === false) return `${val}`;
  if (typeof val === "number") return printNumber(val);
  if (typeof val === "string") return quoteStrings ? `"${val}"` : val;
  if (typeof val === "function") return `[Function ${val.name || "anonymous"}]`;
  if (typeof val === "symbol") return symbolToString.call(val).replace(SYMBOL_REGEXP, "Symbol($1)");
  const tag = toString.call(val).slice(8, -1);
  if (tag === "Date") {
    const v = val;
    return Number.isNaN(v.getTime()) ? `${v}` : v.toISOString();
  }
  if (tag === "Error" || val instanceof Error) return `[${errorToString.call(val)}]`;
  if (tag === "RegExp") return regExpToString.call(val);
  return null;
}
function printValue(value, quoteStrings) {
  const result = printSimpleValue(value, quoteStrings);
  if (result !== null) return result;
  return JSON.stringify(value, function replacer(key, value2) {
    const result2 = printSimpleValue(this[key], quoteStrings);
    if (result2 !== null) return result2;
    return value2;
  }, 2);
}
const isNotNilTest = (value) => !_.isNil(value);
const isNotNullTest = (value) => !_.isNull(value);
addMethod(create$3, "notNil", function isNotNill(msg = "${path} must be defined.") {
  return this.test("defined", msg, isNotNilTest);
});
addMethod(create$3, "notNull", function isNotNull(msg = "${path} cannot be null.") {
  return this.test("defined", msg, isNotNullTest);
});
addMethod(create$3, "isFunction", function isFunction2(message = "${path} is not a function") {
  return this.test("is a function", message, (value) => _.isUndefined(value) || _.isFunction(value));
});
addMethod(create$2, "isCamelCase", function isCamelCase$1(message = "${path} is not in camel case (anExampleOfCamelCase)") {
  return this.test("is in camelCase", message, (value) => value ? isCamelCase(value) : true);
});
addMethod(create$2, "isKebabCase", function isKebabCase$1(message = "${path} is not in kebab case (an-example-of-kebab-case)") {
  return this.test("is in kebab-case", message, (value) => value ? isKebabCase(value) : true);
});
addMethod(create$1, "onlyContainsFunctions", function onlyContainsFunctions(message = "${path} contains values that are not functions") {
  return this.test("only contains functions", message, (value) => _.isUndefined(value) || value && Object.values(value).every(_.isFunction));
});
addMethod(create, "uniqueProperty", function uniqueProperty(propertyName, message) {
  return this.test("unique", message, function unique(list) {
    const errors = [];
    list?.forEach((element, index2) => {
      const sameElements = list.filter((e) => lodashExports.get(e, propertyName) === lodashExports.get(element, propertyName));
      if (sameElements.length > 1) {
        errors.push(this.createError({
          path: `${this.path}[${index2}].${propertyName}`,
          message
        }));
      }
    });
    if (errors.length) {
      throw new ValidationError$1(errors);
    }
    return true;
  });
});
setLocale({
  mixed: {
    notType(options2) {
      const { path: path2, type, value, originalValue } = options2;
      const isCast = originalValue != null && originalValue !== value;
      const msg = `${path2} must be a \`${type}\` type, but the final value was: \`${printValue(value, true)}\`${isCast ? ` (cast from the value \`${printValue(originalValue, true)}\`).` : "."}`;
      return msg;
    }
  }
});
var _a$1;
function $constructor(name, initializer2, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _2,
          traits: /* @__PURE__ */ new Set()
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer2(inst, def);
    const proto = _2.prototype;
    const keys2 = Object.keys(proto);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _2(def) {
    var _a2;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_2, "init", { value: init });
  Object.defineProperty(_2, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_2, "name", { value: name });
  return _2;
}
class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}
class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  return globalConfig;
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _2]) => numericValues.indexOf(+k) === -1).map(([_2, v]) => v);
  return values;
}
function jsonStringifyReplacer(_2, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  return {
    get value() {
      {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source2) {
  const start = source2.startsWith("^") ? 1 : 0;
  const end = source2.endsWith("$") ? source2.length - 1 : source2.length;
  return source2.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
const EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors2 = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors2);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_2) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
const propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
const NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema2, mask) {
  const currDef = schema2._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema2, def);
}
function omit(schema2, mask) {
  const currDef = schema2._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const newShape = { ...schema2._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema2, def);
}
function extend(schema2, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema2._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema2._zod.def.shape;
    for (const key in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const _shape = { ...schema2._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema2, def);
}
function safeExtend(schema2, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const _shape = { ...schema2._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema2, def);
}
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class, schema2, mask) {
  const currDef = schema2._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const oldShape = schema2._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema2, def);
}
function required(Class, schema2, mask) {
  const def = mergeDefs(schema2._zod.def, {
    get shape() {
      const oldShape = schema2._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    }
  });
  return clone(schema2, def);
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path2, issues) {
  return issues.map((iss) => {
    var _a2;
    (_a2 = iss).path ?? (_a2.path = []);
    iss.path.unshift(path2);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message;
  if (ctx?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
const initializer$1 = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error2.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error3, path2 = []) => {
    for (const issue2 of error3.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path2, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else {
        const fullpath = [...path2, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }
  };
  processError(error2);
  return fieldErrors;
}
const _parse = (_Err) => (schema2, value, _ctx, _params) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
const _parseAsync = (_Err) => async (schema2, value, _ctx, params) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
const _safeParse = (_Err) => (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
const safeParse$1 = /* @__PURE__ */ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema2._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
const safeParseAsync$1 = /* @__PURE__ */ _safeParseAsync($ZodRealError);
const _encode = (_Err) => (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parse(_Err)(schema2, value, ctx);
};
const _decode = (_Err) => (schema2, value, _ctx) => {
  return _parse(_Err)(schema2, value, _ctx);
};
const _encodeAsync = (_Err) => async (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parseAsync(_Err)(schema2, value, ctx);
};
const _decodeAsync = (_Err) => async (schema2, value, _ctx) => {
  return _parseAsync(_Err)(schema2, value, _ctx);
};
const _safeEncode = (_Err) => (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema2, value, ctx);
};
const _safeDecode = (_Err) => (schema2, value, _ctx) => {
  return _safeParse(_Err)(schema2, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema2, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema2, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema2, value, _ctx) => {
  return _safeParseAsync(_Err)(schema2, value, _ctx);
};
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^[A-Za-z0-9_-]*$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
const date$1 = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time$1(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
  const time2 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex = `${time2}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const string$1 = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
const integer = /^-?\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const boolean$1 = /^(?:true|false)$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a2;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a2 = inst._zod).onattach ?? (_a2.onattach = []);
});
const numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
const $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a2;
    (_a2 = inst2._zod.bag).multipleOf ?? (_a2.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a2, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a2 = inst._zod).check ?? (_a2.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
const $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});
class Doc {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join("\n"));
  }
}
const version = {
  major: 4,
  minor: 4,
  patch: 3
};
const $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a2;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _2 = ch._zod.check(payload);
        if (_2 instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _2 instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _2;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: (value) => {
      try {
        const r = safeParse$1(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_2) {
        return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
});
const $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
  inst._zod.parse = (payload, _2) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_3) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
const $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
const $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
const $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
const $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
const $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      if (!def.normalize && def.protocol?.source === httpProtocol.source) {
        if (!/^https?:\/\//i.test(trimmed)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid URL format",
            input: payload.value,
            inst,
            continue: !def.abort
          });
          return;
        }
      }
      const url = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: def.hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_2) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
const $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
const $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
const $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime$1(def));
  $ZodStringFormat.init(inst, def);
});
const $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date$1);
  $ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time$1(def));
  $ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration$1);
  $ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv4`;
});
const $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv6`;
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
const $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error();
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error();
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
const $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64";
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
const $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64url";
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
const $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_2) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
const $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
const $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean$1;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_2) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
const $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
const $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
const $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index2) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index2, result.issues));
  }
  final.value[index2] = result.value;
}
const $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
  const isPresent = key in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  const keys2 = Object.keys(def.shape);
  for (const k of keys2) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys: keys2,
    keySet: new Set(keys2),
    numKeys: keys2.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key in input) {
    if (key === "__proto__")
      continue;
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
    } else {
      handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
const $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  if (!desc?.get) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: () => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh
        });
        return newSh;
      }
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const isObject$12 = isObject;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject$12(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key of value.keys) {
      const el = shape[key];
      const isOptionalIn = el._zod.optin === "optional";
      const isOptionalOut = el._zod.optout === "optional";
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
      } else {
        handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
const $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter2 = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter2++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key of normalized.keys) {
      const id = ids[key];
      const k = esc(key);
      const schema2 = shape[key];
      const isOptionalIn = schema2?._zod?.optin === "optional";
      const isOptionalOut = schema2?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(key)};`);
      if (isOptionalIn && isOptionalOut) {
        doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject$12 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval$1 = allowsEval;
  const fastEnabled = jit && allowsEval$1.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject$12(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
const $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
const $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index2 = 0; index2 < a.length; index2++) {
      const itemA = a[index2];
      const itemB = b[index2];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index2, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
const $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values) {
      payload.value = {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number$1.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[keyResult.value] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
const $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
const $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  if (def.values.length === 0) {
    throw new Error("Cannot create literal schema with no valid values");
  }
  const values = new Set(def.values);
  inst._zod.values = values;
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
const $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    payload.fallback = true;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (input === void 0 && (result.issues.length || result.fallback)) {
    return { issues: [], value: void 0 };
  }
  return result;
}
const $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const input = payload.value;
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, input));
      return handleOptionalResult(result, input);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
const $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
const $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
      payload.fallback = true;
    }
    return payload;
  };
});
const $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
const $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
  defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
const $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _2) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
var _a;
class $ZodRegistry {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema2, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema2, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema2);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema2) {
    const meta = this._map.get(schema2);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema2);
    return this;
  }
  get(schema2) {
    const p = schema2._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema2) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema2);
  }
  has(schema2) {
    return this._map.has(schema2);
  }
}
function registry() {
  return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
  return new Class({
    type: "string",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
  return new Class({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _any(Class) {
  return new Class({
    type: "any"
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
  const schema2 = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema2;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue$1) => {
      if (typeof issue$1 === "string") {
        payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
      } else {
        const _issue = issue$1;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? void 0
  };
}
function process$1(schema2, ctx, _params = { path: [], schemaPath: [] }) {
  var _a2;
  const def = schema2._zod.def;
  const seen = ctx.seen.get(schema2);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema2);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema2, result);
  const overrideSchema = schema2._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema2],
      path: _params.path
    };
    if (schema2._zod.processJSONSchema) {
      schema2._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema2, ctx, _json, params);
    }
    const parent = schema2._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process$1(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema2);
  if (meta)
    Object.assign(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema2)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a2 = result.schema).default ?? (_a2.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema2);
  return _result.schema;
}
function extractDefs(ctx, schema2) {
  const root2 = ctx.seen.get(schema2);
  if (!root2)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
    }
    if (entry[1] === root2) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema3 = seen.schema;
    for (const key in schema3) {
      delete schema3[key];
    }
    schema3.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema2 === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema2 !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx, schema2) {
  const root2 = ctx.seen.get(schema2);
  if (!root2)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema3 = seen.def ?? seen.schema;
    const _cached = { ...schema3 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema3.allOf = schema3.allOf ?? [];
        schema3.allOf.push(refSchema);
      } else {
        Object.assign(schema3, refSchema);
      }
      Object.assign(schema3, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema3) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema3[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema3) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema3[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema3[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema3.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema3) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema3[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema3[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema3,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") ;
  else ;
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema2)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root2.def ?? root2.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema2)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId)
        delete seen.def.id;
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) ;
  else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema2["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema2, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema2, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
const createToJSONSchemaMethod = (schema2, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  process$1(schema2, ctx);
  extractDefs(ctx, schema2);
  return finalize(ctx, schema2);
};
const createStandardJSONSchemaMethod = (schema2, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  process$1(schema2, ctx);
  extractDefs(ctx, schema2);
  return finalize(ctx, schema2);
};
const formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
const stringProcessor = (schema2, ctx, _json, _params) => {
  const json2 = _json;
  json2.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding } = schema2._zod.bag;
  if (typeof minimum === "number")
    json2.minLength = minimum;
  if (typeof maximum === "number")
    json2.maxLength = maximum;
  if (format) {
    json2.format = formatMap[format] ?? format;
    if (json2.format === "")
      delete json2.format;
    if (format === "time") {
      delete json2.format;
    }
  }
  if (contentEncoding)
    json2.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const regexes = [...patterns];
    if (regexes.length === 1)
      json2.pattern = regexes[0].source;
    else if (regexes.length > 1) {
      json2.allOf = [
        ...regexes.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
const numberProcessor = (schema2, ctx, _json, _params) => {
  const json2 = _json;
  const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema2._zod.bag;
  if (typeof format === "string" && format.includes("int"))
    json2.type = "integer";
  else
    json2.type = "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json2.minimum = exclusiveMinimum;
      json2.exclusiveMinimum = true;
    } else {
      json2.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json2.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json2.maximum = exclusiveMaximum;
      json2.exclusiveMaximum = true;
    } else {
      json2.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json2.maximum = maximum;
  }
  if (typeof multipleOf === "number")
    json2.multipleOf = multipleOf;
};
const booleanProcessor = (_schema, _ctx, json2, _params) => {
  json2.type = "boolean";
};
const neverProcessor = (_schema, _ctx, json2, _params) => {
  json2.not = {};
};
const anyProcessor = (_schema, _ctx, _json, _params) => {
};
const unknownProcessor = (_schema, _ctx, _json, _params) => {
};
const enumProcessor = (schema2, _ctx, json2, _params) => {
  const def = schema2._zod.def;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number"))
    json2.type = "number";
  if (values.every((v) => typeof v === "string"))
    json2.type = "string";
  json2.enum = values;
};
const literalProcessor = (schema2, ctx, json2, _params) => {
  const def = schema2._zod.def;
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Literal `undefined` cannot be represented in JSON Schema");
      }
    } else if (typeof val === "bigint") {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      } else {
        vals.push(Number(val));
      }
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) ;
  else if (vals.length === 1) {
    const val = vals[0];
    json2.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json2.enum = [val];
    } else {
      json2.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json2.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json2.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json2.type = "boolean";
    if (vals.every((v) => v === null))
      json2.type = "null";
    json2.enum = vals;
  }
};
const customProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
};
const transformProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Transforms cannot be represented in JSON Schema");
  }
};
const arrayProcessor = (schema2, ctx, _json, params) => {
  const json2 = _json;
  const def = schema2._zod.def;
  const { minimum, maximum } = schema2._zod.bag;
  if (typeof minimum === "number")
    json2.minItems = minimum;
  if (typeof maximum === "number")
    json2.maxItems = maximum;
  json2.type = "array";
  json2.items = process$1(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
const objectProcessor = (schema2, ctx, _json, params) => {
  const json2 = _json;
  const def = schema2._zod.def;
  json2.type = "object";
  json2.properties = {};
  const shape = def.shape;
  for (const key in shape) {
    json2.properties[key] = process$1(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key) => {
    const v = def.shape[key]._zod;
    if (ctx.io === "input") {
      return v.optin === void 0;
    } else {
      return v.optout === void 0;
    }
  }));
  if (requiredKeys.size > 0) {
    json2.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json2.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json2.additionalProperties = false;
  } else if (def.catchall) {
    json2.additionalProperties = process$1(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
const unionProcessor = (schema2, ctx, json2, params) => {
  const def = schema2._zod.def;
  const isExclusive = def.inclusive === false;
  const options2 = def.options.map((x, i) => process$1(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json2.oneOf = options2;
  } else {
    json2.anyOf = options2;
  }
};
const intersectionProcessor = (schema2, ctx, json2, params) => {
  const def = schema2._zod.def;
  const a = process$1(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = process$1(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json2.allOf = allOf;
};
const recordProcessor = (schema2, ctx, _json, params) => {
  const json2 = _json;
  const def = schema2._zod.def;
  json2.type = "object";
  const keyType = def.keyType;
  const keyBag = keyType._zod.bag;
  const patterns = keyBag?.patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = process$1(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json2.patternProperties = {};
    for (const pattern of patterns) {
      json2.patternProperties[pattern.source] = valueSchema;
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json2.propertyNames = process$1(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
    }
    json2.additionalProperties = process$1(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  if (keyValues) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json2.required = validKeyValues;
    }
  }
};
const nullableProcessor = (schema2, ctx, json2, params) => {
  const def = schema2._zod.def;
  const inner = process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json2.nullable = true;
  } else {
    json2.anyOf = [inner, { type: "null" }];
  }
};
const nonoptionalProcessor = (schema2, ctx, _json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
};
const defaultProcessor = (schema2, ctx, json2, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  json2.default = JSON.parse(JSON.stringify(def.defaultValue));
};
const prefaultProcessor = (schema2, ctx, json2, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  if (ctx.io === "input")
    json2._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
const catchProcessor = (schema2, ctx, json2, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json2.default = catchValue;
};
const pipeProcessor = (schema2, ctx, _json, params) => {
  const def = schema2._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  process$1(innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = innerType;
};
const readonlyProcessor = (schema2, ctx, json2, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
  json2.readOnly = true;
};
const optionalProcessor = (schema2, ctx, _json, params) => {
  const def = schema2._zod.def;
  process$1(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema2);
  seen.ref = def.innerType;
};
const ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime(params) {
  return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
}
const ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date(params) {
  return /* @__PURE__ */ _isoDate(ZodISODate, params);
}
const ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time(params) {
  return /* @__PURE__ */ _isoTime(ZodISOTime, params);
}
const ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration(params) {
  return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
}
const initializer = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => {
        inst.issues.push(issue2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => {
        inst.issues.push(...issues2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
};
const ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer, {
  Parent: Error
});
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
const _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = /* @__PURE__ */ new Set();
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group))
    return;
  installed.add(group);
  for (const key in methods) {
    const fn = methods[key];
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: bound
        });
        return bound;
      },
      set(v) {
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: v
        });
      }
    });
  }
}
const ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  Object.assign(inst["~standard"], {
    jsonSchema: {
      input: createStandardJSONSchemaMethod(inst, "input"),
      output: createStandardJSONSchemaMethod(inst, "output")
    }
  });
  inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode(inst, data, params);
  inst.decode = (data, params) => decode(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
  _installLazyMethods(inst, "ZodType", {
    check(...chks) {
      const def2 = this.def;
      return this.clone(mergeDefs(def2, {
        checks: [
          ...def2.checks ?? [],
          ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }), { parent: true });
    },
    with(...chks) {
      return this.check(...chks);
    },
    clone(def2, params) {
      return clone(this, def2, params);
    },
    brand() {
      return this;
    },
    register(reg, meta) {
      reg.add(this, meta);
      return this;
    },
    refine(check, params) {
      return this.check(refine(check, params));
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
      return this.check(/* @__PURE__ */ _overwrite(fn));
    },
    optional() {
      return optional(this);
    },
    exactOptional() {
      return exactOptional(this);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    array() {
      return array(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    and(arg) {
      return intersection(this, arg);
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    default(d) {
      return _default(this, d);
    },
    prefault(d) {
      return prefault(this, d);
    },
    catch(params) {
      return _catch(this, params);
    },
    pipe(target) {
      return pipe(this, target);
    },
    readonly() {
      return readonly(this);
    },
    describe(description) {
      const cl = this.clone();
      globalRegistry.add(cl, { description });
      return cl;
    },
    meta(...args) {
      if (args.length === 0)
        return globalRegistry.get(this);
      const cl = this.clone();
      globalRegistry.add(cl, args[0]);
      return cl;
    },
    isOptional() {
      return this.safeParse(void 0).success;
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    apply(fn) {
      return fn(this);
    }
  });
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  return inst;
});
const _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => stringProcessor(inst, ctx, json2);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  _installLazyMethods(inst, "_ZodString", {
    regex(...args) {
      return this.check(/* @__PURE__ */ _regex(...args));
    },
    includes(...args) {
      return this.check(/* @__PURE__ */ _includes(...args));
    },
    startsWith(...args) {
      return this.check(/* @__PURE__ */ _startsWith(...args));
    },
    endsWith(...args) {
      return this.check(/* @__PURE__ */ _endsWith(...args));
    },
    min(...args) {
      return this.check(/* @__PURE__ */ _minLength(...args));
    },
    max(...args) {
      return this.check(/* @__PURE__ */ _maxLength(...args));
    },
    length(...args) {
      return this.check(/* @__PURE__ */ _length(...args));
    },
    nonempty(...args) {
      return this.check(/* @__PURE__ */ _minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(/* @__PURE__ */ _lowercase(params));
    },
    uppercase(params) {
      return this.check(/* @__PURE__ */ _uppercase(params));
    },
    trim() {
      return this.check(/* @__PURE__ */ _trim());
    },
    normalize(...args) {
      return this.check(/* @__PURE__ */ _normalize(...args));
    },
    toLowerCase() {
      return this.check(/* @__PURE__ */ _toLowerCase());
    },
    toUpperCase() {
      return this.check(/* @__PURE__ */ _toUpperCase());
    },
    slugify() {
      return this.check(/* @__PURE__ */ _slugify());
    }
  });
});
const ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(/* @__PURE__ */ _email(ZodEmail, params));
  inst.url = (params) => inst.check(/* @__PURE__ */ _url(ZodURL, params));
  inst.jwt = (params) => inst.check(/* @__PURE__ */ _jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
  inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(/* @__PURE__ */ _uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(/* @__PURE__ */ _cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(/* @__PURE__ */ _ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(/* @__PURE__ */ _base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(/* @__PURE__ */ _xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(/* @__PURE__ */ _e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime(params));
  inst.date = (params) => inst.check(date(params));
  inst.time = (params) => inst.check(time(params));
  inst.duration = (params) => inst.check(duration(params));
});
function string(params) {
  return /* @__PURE__ */ _string(ZodString, params);
}
const ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
const ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => numberProcessor(inst, ctx, json2);
  _installLazyMethods(inst, "ZodNumber", {
    gt(value, params) {
      return this.check(/* @__PURE__ */ _gt(value, params));
    },
    gte(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    min(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    lt(value, params) {
      return this.check(/* @__PURE__ */ _lt(value, params));
    },
    lte(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    max(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(/* @__PURE__ */ _gt(0, params));
    },
    nonnegative(params) {
      return this.check(/* @__PURE__ */ _gte(0, params));
    },
    negative(params) {
      return this.check(/* @__PURE__ */ _lt(0, params));
    },
    nonpositive(params) {
      return this.check(/* @__PURE__ */ _lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(/* @__PURE__ */ _multipleOf(value, params));
    },
    step(value, params) {
      return this.check(/* @__PURE__ */ _multipleOf(value, params));
    },
    finite() {
      return this;
    }
  });
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number(params) {
  return /* @__PURE__ */ _number(ZodNumber, params);
}
const ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
const ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => booleanProcessor(inst, ctx, json2);
});
function boolean(params) {
  return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
const ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => anyProcessor();
});
function any() {
  return /* @__PURE__ */ _any(ZodAny);
}
const ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unknownProcessor();
});
function unknown() {
  return /* @__PURE__ */ _unknown(ZodUnknown);
}
const ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => neverProcessor(inst, ctx, json2);
});
function never(params) {
  return /* @__PURE__ */ _never(ZodNever, params);
}
const ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => arrayProcessor(inst, ctx, json2, params);
  inst.element = def.element;
  _installLazyMethods(inst, "ZodArray", {
    min(n, params) {
      return this.check(/* @__PURE__ */ _minLength(n, params));
    },
    nonempty(params) {
      return this.check(/* @__PURE__ */ _minLength(1, params));
    },
    max(n, params) {
      return this.check(/* @__PURE__ */ _maxLength(n, params));
    },
    length(n, params) {
      return this.check(/* @__PURE__ */ _length(n, params));
    },
    unwrap() {
      return this.element;
    }
  });
});
function array(element, params) {
  return /* @__PURE__ */ _array(ZodArray, element, params);
}
const ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => objectProcessor(inst, ctx, json2, params);
  defineLazy(inst, "shape", () => {
    return def.shape;
  });
  _installLazyMethods(inst, "ZodObject", {
    keyof() {
      return _enum(Object.keys(this._zod.def.shape));
    },
    catchall(catchall) {
      return this.clone({ ...this._zod.def, catchall });
    },
    passthrough() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    loose() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    strict() {
      return this.clone({ ...this._zod.def, catchall: never() });
    },
    strip() {
      return this.clone({ ...this._zod.def, catchall: void 0 });
    },
    extend(incoming) {
      return extend(this, incoming);
    },
    safeExtend(incoming) {
      return safeExtend(this, incoming);
    },
    merge(other) {
      return merge(this, other);
    },
    pick(mask) {
      return pick(this, mask);
    },
    omit(mask) {
      return omit(this, mask);
    },
    partial(...args) {
      return partial(ZodOptional, this, args[0]);
    },
    required(...args) {
      return required(ZodNonOptional, this, args[0]);
    }
  });
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
const ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function union(options2, params) {
  return new ZodUnion({
    type: "union",
    options: options2,
    ...normalizeParams(params)
  });
}
const ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => intersectionProcessor(inst, ctx, json2, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
const ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => recordProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string(),
      valueType: keyType,
      ...normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
const ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => enumProcessor(inst, ctx, json2);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys2 = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys2.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys2.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
const ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => literalProcessor(inst, ctx, json2);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
const ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => transformProcessor(inst, ctx);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue$1) => {
      if (typeof issue$1 === "string") {
        payload.issues.push(issue(issue$1, payload.value, def));
      } else {
        const _issue = issue$1;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    payload.value = output;
    payload.fallback = true;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
const ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
const ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
const ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nullableProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
const ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => defaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
const ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => prefaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
const ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nonoptionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
const ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => catchProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
const ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => pipeProcessor(inst, ctx, json2, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
const ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => readonlyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
const ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => customProcessor(inst, ctx);
});
function refine(fn, _params = {}) {
  return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return /* @__PURE__ */ _superRefine(fn, params);
}
union([
  string(),
  array(string())
]).describe("Select specific fields to return in the response");
union([
  literal("*"),
  string(),
  array(string()),
  record(string(), any())
]).describe("Specify which relations to populate in the response");
union([
  string(),
  array(string()),
  record(string(), _enum([
    "asc",
    "desc"
  ])),
  array(record(string(), _enum([
    "asc",
    "desc"
  ])))
]).describe("Sort the results by specified fields");
intersection(object({
  withCount: boolean().optional().describe("Include total count in response")
}), union([
  object({
    page: number().int().positive().describe("Page number (1-based)"),
    pageSize: number().int().positive().describe("Number of entries per page")
  }).describe("Page-based pagination"),
  object({
    start: number().int().min(0).describe("Number of entries to skip"),
    limit: number().int().positive().describe("Maximum number of entries to return")
  }).describe("Offset-based pagination")
])).describe("Pagination parameters");
record(string(), any()).describe("Apply filters to the query");
string().describe("Specify the locale for localized content");
_enum([
  "draft",
  "published"
]).describe("Filter by publication status");
string().describe("Search query string");
const BRAIN_GUIDE = `# Paul's Brain — Usage Guide for AI Assistants

## What is this?

Paul's Brain is a shared long-term memory system accessible via MCP. All of Paul's AI assistants (Cursor agents, Grok bots, chat interfaces) read and write here to maintain continuity across conversations.

**Note on YouTube Transcripts**: Raw YouTube transcripts now live centrally in a separate Strapi Cloud app (yt-kb plugin at https://deserving-harmony-9f5ca04daf.strapiapp.com). Access them via the \`yt_kb__*\` MCP tools on the \`strapi-prod\` MCP server (e.g., \`yt_kb__get_transcript\`, \`yt_kb__search_transcript\`, \`yt_kb__add_video\`, etc.). Paul-brain stores only notes/sources/people that reference videos by YouTube videoId, enabling joins between notes and transcripts.

**Core Principles for Team Brain**:
- **Drafts only**: Save work-in-progress, not polished outputs
- **Uniform results are suspect**: If all/none/zero results come back, verify by checking one raw record
- **Write negatives down**: Record what systems CANNOT do (capabilities table)
- **Build new skills from gaps and retros**: When we fail or lack something repeatedly, that's the signal to improve
- **Start every session with get_briefing**: Load context about lessons, open issues, and urgent work
- **Log retros after real failures**: Don't let lessons slip away
- **Handle duplicate candidates**: When remember or add_todo returns needsDecision, choose merge/new/supersede

## Content Types

1. **note** — Facts, preferences, ideas, todos, logs, references, lessons
   - Kinds: \`fact\`, \`preference\`, \`idea\`, \`todo\`, \`log\`, \`reference\`, \`lesson\`
   - Use tags liberally: \`#strapi\`, \`#mcp\`, \`#cursor\`, \`#ai\`, etc.
   - Confidence: \`low\`, \`medium\`, \`high\`
   - New fields for lessons: \`verifiedAt\`, \`howToRecheck\`, \`durability\` (durable/temporary)

2. **person** — People in Paul's network (colleagues, collaborators, community)
   - Fields: name, role, org, email, handles (GitHub, X, LinkedIn)
   - Always link related notes

3. **project** — Paul's projects and initiatives
   - Status: \`idea\`, \`active\`, \`paused\`, \`done\`
   - Include repo_url and live URL when available

4. **decision** — Architecture decisions and key choices
   - Status: \`proposed\`, \`accepted\`, \`superseded\`
   - Always link the project and people involved

5. **source** — External sources (videos, articles, transcripts)
   - Types: \`video\`, \`article\`, \`email\`, \`transcript\`, \`chat\`, \`repo\`, \`other\`
   - Include \`videoId\` for YouTube videos to enable join with central yt-kb service transcripts (accessed via yt_kb__* MCP tools on strapi-prod server)

6. **retro** — Failure on real work + fix (post-mortem)
   - Fields: title, date, task, failure, fix, fixLocation, status (open/fixed/declined/wontfix)
   - Link to project when relevant
   - Use update_retro to change status or add fix details

7. **gap** — Request nothing handled well (capability we lack)
   - Fields: title, date, request, whatWasNeeded, count, status (open/built/wontfix), firstSeen, seenDates
   - Appends to seenDates when logged again; proposeCapability: true when seenDates reaches 2
   - Use update_gap to change status or description

8. **capability** — What a system can and CANNOT do (probed and dated)
   - Fields: system, capability, canDo (boolean), verifiedAt, howVerified, notes
   - Upserts by system+capability

9. **rule** — Deterministic routing/handling rules (editable in admin)
   - Fields: name, match, action, priority, enabled
   - Sorted by priority for rule engines

10. **todo** — Task management for Paul's work
   - Status: \`inbox\` (bot-captured, for Paul to confirm), \`next\`, \`doing\`, \`waiting\`, \`done\`, \`dropped\`, \`superseded\`
   - Priority: \`P0\` (urgent today), \`P1\` (this week), \`P2\` (soon, default), \`P3\` (someday)
   - Fields: title, dueDate, doDate, goal, acceptanceCriteria, context (markdown)
   - Links: JSON array of {type: email|github|calendar|doc|url|other, label, url, note}
   - Relations: relatedNotes (many-to-many with note), project (many-to-one), supersededBy (self-relation)
   - Log: JSON array of timestamped entries tracking changes
   - Bot-captured todos default to \`inbox\` status for Paul to confirm
   - Duplicate detection: add_todo checks for similar todos unless onDuplicate is set

11. **goal** — Goals with daily/weekly check-ins and streak tracking
   - Status: \`active\`, \`paused\`, \`done\`, \`dropped\`
   - Category: \`health\`, \`fitness\`, \`work\`, \`learning\`, \`personal\`, \`other\`
   - Cadence: \`daily\` (default), \`weekly\`
   - Fields: title, description, target (e.g. "last meal by 5 PM"), startDate
   - Streaks: currentStreak (consecutive met days ending on latest check-in), bestStreak
   - One-to-many relation with goal-checkin

12. **goal-checkin** — Daily or weekly check-ins for goals
   - Fields: goal (relation), date (required), met (boolean, required), note, loggedBy
   - One check-in per goal per date (updates existing instead of creating duplicate)

## When to Use Which Tool

### get_briefing
Get a compact session briefing to start every session.
- Returns pinned and recent lessons (notes with lesson field)
- Open retros and gaps
- P0/P1 or overdue todos
- Recent 'cannot' capabilities (last 90 days)
- Call this first to load context

### kb_stats
Get knowledge base statistics to understand what's in the brain.
- Returns counts per content type (note, person, project, etc.)
- Notes broken down by kind and tag
- Video notes vs transcripts: shows which YouTube transcripts (from central yt-kb service) lack notes
- Orphan counts: notes without links, people/projects/sources without notes
- Use before major operations to understand KB state
- Check regularly to find transcripts that need notes
- Note: Requires YT_KB_API_TOKEN env var to fetch transcript list; shows 'yt-kb not configured' message if missing

### health_check
Run diagnostic checks on brain data.
- Checks for duplicates, missing fields, stale data, orphans, broken relations
- Returns findings with severity (BLOCK/WARN) and suggested fixes
- Run periodically or when data quality is suspect

### remember
Create a new note with duplicate detection.
- Returns needsDecision: true with candidates if similar notes found and onDuplicate not set
- onDuplicate: 'merge' — append to existing note
- onDuplicate: 'new' — force create new note
- onDuplicate: 'supersede' — create new and mark old as superseded
- Always set meaningful tags
- Set \`source_bot\` to identify which bot created it
- Use \`createMissing: true\` to auto-create linked entities by name

### recall
Search across all brain types with ranked results (searches note body/content and tags).
- Use specific queries: "strapi mcp tools" not just "strapi"
- Filter by type: \`["note", "person"]\`
- Filter by kind: \`"video"\`, \`"lesson"\`, \`"fact"\`, etc.
- Filter by tag: \`"strapi"\` (single tag)
- Filter by videoId: find notes for a specific YouTube video
- Filter by sourceId: find notes linked to a specific source
- Results are ranked: title match > alias/tag match > body match
- Pinned notes rank higher
- Recent items rank higher
- Returns linkedSourceIds and linkedPersonIds for notes (useful for traversing connections)
- Always search before creating notes to avoid duplicates

### get_entity
Fetch one entity by type + documentId or slug.
- Relations are populated
- Use after recall to get full details

### list_recent
Get newest N items across types.
- Good for "what did we save today?"
- Filter by \`kind\` for notes (\`fact\`, \`preference\`, etc.)
- Filter by \`source_bot\` to see what a specific bot created

### update_note
Patch a note's fields.
- Use \`appendBody\` instead of \`body\` to add without overwriting
- Use \`addTags\` / \`removeTags\` for tag operations

### upsert_person
Create or update a person (matches by slug/alias, updates or creates).
- Fields: name, role, org, email, handles (JSON: {github, x, linkedin}), notes_md, last_contact
- Idempotent: safe to call multiple times with same name
- Returns created: true/false and documentId

### upsert_source
Create or update a source (matches by slug, videoId, or url).
- Fields: title, type, url, videoId, external_id, excerpt, captured_on
- Matches by slug (from title), videoId, or url
- Updates matched source or creates new
- Use for YouTube videos: pass videoId and url to join with central yt-kb transcripts

### update_source
Update an existing source by documentId or slug.
- Fields: title, type, url, videoId, external_id, excerpt, captured_on
- All fields optional (only updates provided fields)
- Use when you know the source exists
- For YouTube videos, ensure videoId is set to join with central yt-kb transcripts

### link
Connect or disconnect a note with people/projects/sources/decisions.
- Pass documentIds or slugs
- For sources: can also pass videoId or url to find/update the source
- Automatically adds missing videoId/url to sources when provided
- Use after creating stub entities with \`createMissing\`
- Always link video notes to sources for better organization

### log_decision
Create a decision record (context/decision/rationale).
- Always link project and people
- Optionally mark a prior decision as superseded

### forget
Delete an entity (requires \`confirm: true\`).
- This is a separate permission (not granted by default)
- Returns what was deleted for audit

### log_retro
Create a retro record (failure on real work + fix).
- Link to project when relevant
- Mark status as \`open\` or \`fixed\`
- Log after every real failure to capture lessons

### update_retro
Update an existing retro.
- Change status to \`fixed\`, \`declined\`, or \`wontfix\`
- Add or update fix details

### list_retros
List retro records.
- Filter by status: \`open\`, \`fixed\`, \`declined\`, \`wontfix\`

### log_gap
Create a gap record (request nothing handled well).
- Appends to seenDates if a similar open gap exists
- Returns proposeCapability: true when seenDates reaches 2
- Status: \`open\`, \`built\`, \`wontfix\`

### update_gap
Update an existing gap.
- Change status to \`built\` or \`wontfix\`
- Update request or whatWasNeeded description

### list_gaps
List gap records sorted by count (highest first) then date.
- Filter by status

### record_capability
Create or update a capability record (what a system can and CANNOT do).
- Upserts by system+capability
- Always set \`canDo\` (boolean) to record both what works AND what doesn't

### list_capabilities
List capability records.
- Filter by system (e.g., "strapi", "mcp", "cursor-agent")

### add_rule
Create a deterministic routing/handling rule.
- Priority: higher runs first
- Enabled: toggle rules on/off

### list_rules
List routing/handling rules sorted by priority.
- Filter by enabled status

### add_todo
Create a new todo item with duplicate detection.
- Returns needsDecision: true with candidates if similar todos found and onDuplicate not set
- onDuplicate: 'merge' — append context to existing todo and add log entry
- onDuplicate: 'new' — force create new todo
- onDuplicate: 'supersede' — create new and mark old as superseded
- Bot-captured todos default to \`inbox\` status for Paul to confirm
- Priority: \`P0\` (urgent today), \`P1\` (this week), \`P2\` (soon, default), \`P3\` (someday)
- Always set \`source\` and \`capturedBy\` to track origin
- Links are JSON objects with type, label, url, optional note

### update_todo
Update a todo's fields.
- Use \`appendContext\` to add without overwriting
- Use \`appendLog\` to add log entries
- Changing status to \`done\` automatically sets \`completedAt\`

### list_todos
List todos with flexible filters.
- Filter by status, priority, project
- Filter by \`dueBefore\` or \`overdue\` for deadline management
- Filter by \`waitingOlderThanDays\` to find stale waiting items
- Results sorted by priority (P0 first) then dueDate

### get_todo
Fetch one todo by documentId with populated relatedNotes and project.
- Use after \`list_todos\` to get full details

### complete_todo
Mark a todo as done with optional closing note.
- Sets status to \`done\` and records \`completedAt\` timestamp
- Adds log entry automatically

### add_goal
Create a new goal with daily or weekly check-ins.
- Categories: \`health\`, \`fitness\`, \`work\`, \`learning\`, \`personal\`, \`other\`
- Cadence: \`daily\` (default) or \`weekly\`
- Refuses duplicate active goals with the same title (returns existing instead)
- Auto-sets startDate to today if not provided

### list_goals
List goals with filters by status and category.
- Includes currentStreak and bestStreak
- Filter by status: \`active\`, \`paused\`, \`done\`, \`dropped\`
- Filter by category

### log_checkin
Log a check-in for a goal (updates existing for same date).
- Date defaults to today in America/Los_Angeles timezone
- Recomputes currentStreak: consecutive met days ending on latest check-in
- Recomputes bestStreak from entire history
- For daily goals, if latest check-in is older than yesterday, currentStreak = 0
- Missed or unlogged days break the streak

### get_goal_progress
Get goal progress with metrics and recent check-ins.
- Returns currentStreak and bestStreak
- Calculates met rate over last 7 and 30 days
- Returns recent check-ins (default: 14, configurable)

### update_goal
Update goal fields.
- Can update: status, description, category, target, cadence
- Identify by documentId or title

## Best Practices

1. **Start with briefing**: Call \`get_briefing\` at session start to load lessons, open issues, and urgent todos
2. **Check KB stats**: Use \`kb_stats\` to understand what's in the brain and find transcripts without notes
3. **Search before writing**: Always \`recall\` before creating notes to avoid duplicates
4. **Handle duplicates**: When \`remember\` or \`add_todo\` returns needsDecision with candidates, review and choose merge/new/supersede
5. **Deduplication**: Let tools check for duplicates automatically — they'll ask when unsure
6. **Tagging**: Tag liberally. Common tags: \`#strapi\`, \`#mcp\`, \`#cursor\`, \`#ai\`, \`#deployment\`, \`#bug\`, \`#feature\`
7. **Linking**: Link notes to people/projects/sources — it enables context traversal
8. **Video notes workflow**: For YouTube content:
   - Check \`kb_stats\` to find transcripts without notes
   - Create note with \`kind: "video"\` and \`videoId\`
   - Link to source with \`link\` (pass videoId/url to find or update source)
   - This enables joining with central yt-kb service data (access transcripts via yt_kb__* MCP tools on strapi-prod server)
9. **Confidence**: Set \`low\` for speculative info, \`high\` for verified facts
10. **Expiry**: Set \`expires_on\` for time-sensitive notes (todos, temporary decisions)
11. **Pinning**: Pin critical notes so they rank higher in search
12. **Source Bot**: Always set \`source_bot\` to identify which bot created a note
13. **Write negatives**: Use \`record_capability\` with \`canDo: false\` to document what doesn't work
14. **Log gaps**: When you can't handle something well, \`log_gap\` so we can build it later
15. **Log retros**: When things fail in real work, \`log_retro\` with the fix for future reference
16. **Close retros**: Use \`update_retro\` to mark status as fixed/declined/wontfix when resolved
17. **Todo status workflow**: Bot-captured todos go to \`inbox\` for Paul to confirm → \`next\` → \`doing\` → \`done\`
18. **Todo priorities**: Use P0 for urgent today, P1 for this week, P2 for soon (default), P3 for someday
19. **Goal tracking**: Use \`add_goal\` for habits and targets, \`log_checkin\` daily, streaks auto-calculate
20. **Goal categories**: Choose from health, fitness, work, learning, personal, other for better organization

## Common Workflows

### Knowledge Base Maintenance
1. \`kb_stats\` to see overview and find gaps
2. Check transcripts without notes (returned in kb_stats)
3. Create video notes for important transcripts
4. Review orphans (notes/sources without connections)

### Processing YouTube Videos
1. \`kb_stats\` to find transcripts without notes
2. For each important video:
   - \`recall\` by videoId to check if note exists
   - \`upsert_source\` with title, type: "video", videoId, and url
   - Create note with \`kind: "video"\`, \`videoId\`, and key insights
   - \`link\` the note to source (pass videoId and url)
   - Tag appropriately (\`#video\`, topic tags)

### Learning about a person
1. \`recall\` with their name
2. \`get_entity\` for full details + related notes/projects
3. Create new notes and link with \`link\`

### Starting a new project
1. \`remember\` a note with \`#project-idea\` tag
2. \`log_decision\` for key architectural choices
3. Link people involved

### Capturing a conversation
1. \`recall\` first to check for existing notes
2. \`remember\` key points as separate notes (kind: \`fact\` or \`preference\`)
3. Link to source if it's a video/article
4. Tag with relevant topics

### Finding prior context
1. \`recall\` with keywords + tags (now searches body/content too)
2. Use filters: kind, tag, videoId, sourceId
3. \`get_entity\` to get full details
4. \`list_recent\` to see what was captured recently

### Capturing a todo from an email/meeting
1. \`add_todo\` with source=email/meeting, capturedBy set to bot name
2. Status defaults to \`inbox\` for Paul to review
3. Link related notes with \`relatedNoteIds\`
4. Set priority based on urgency

### Managing todos
1. \`list_todos\` with status filters to see what's in flight
2. \`update_todo\` to change status, add context, or append log entries
3. \`complete_todo\` when done with optional closing note

### Tracking goals
1. \`add_goal\` to create a new goal with category and target
2. \`log_checkin\` daily (or weekly) to record progress
3. \`get_goal_progress\` to see streaks, met rates, and recent history
4. \`list_goals\` to see all active goals or filter by status/category

## Permissions

Each tool requires specific permissions on your admin token:
- \`plugin::paul-brain.guide.read\` — read this guide
- \`plugin::paul-brain.read\` — recall, get_entity, list_recent, list_retros, list_gaps, list_capabilities, list_rules, list_todos, get_todo
- \`plugin::paul-brain.stats.read\` — kb_stats
- \`plugin::paul-brain.health.read\` — health_check
- \`plugin::paul-brain.brief.read\` — get_briefing
- \`plugin::paul-brain.note.write\` — remember, update_note, link
- \`plugin::paul-brain.entity.write\` — upsert_person, upsert_source, update_source
- \`plugin::paul-brain.decision.write\` — log_decision
- \`plugin::paul-brain.meta.write\` — log_retro, log_gap, record_capability
- \`plugin::paul-brain.retro.update\` — update_retro
- \`plugin::paul-brain.gap.update\` — update_gap
- \`plugin::paul-brain.rule.write\` — add_rule
- \`plugin::paul-brain.todo.write\` — add_todo, update_todo, complete_todo
- \`plugin::paul-brain.goal.read\` — list_goals, get_goal_progress
- \`plugin::paul-brain.goal.write\` — add_goal, update_goal, log_checkin
- \`plugin::paul-brain.forget\` — forget (dangerous, usually not granted)

Plus the standard content-manager permissions for read/create/update on paul-brain types.
`;
const PLUGIN_VERSION = "1.7.0";
const register$y = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "get_brain_guide",
    title: "Get Brain Usage Guide",
    description: "Returns the complete usage guide for Paul's Brain: what content types exist, when to use which tool, best practices, tagging conventions, and permission requirements.",
    resolveInputSchema: () => object({}),
    resolveOutputSchema: () => object({
      guide: string().describe("The complete brain usage guide in markdown format"),
      version: string().describe("Plugin version")
    }),
    auth: {
      policies: [{ action: getActionId("guide.read") }]
    },
    createHandler: () => async () => {
      return {
        content: [
          {
            type: "text",
            text: `${BRAIN_GUIDE}

---
Plugin version: ${PLUGIN_VERSION}`
          }
        ],
        structuredContent: {
          guide: BRAIN_GUIDE,
          version: PLUGIN_VERSION
        }
      };
    }
  });
};
const getBrainGuide = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$y
}, Symbol.toStringTag, { value: "Module" }));
function stripNullish(obj) {
  if (obj === null || obj === void 0) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.filter((item) => item !== null && item !== void 0).map((item) => stripNullish(item));
  }
  if (typeof obj === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== void 0) {
        cleaned[key] = stripNullish(value);
      }
    }
    return cleaned;
  }
  return obj;
}
function getTodayPST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(/* @__PURE__ */ new Date());
}
function getDaysAgoPST(days) {
  const d = /* @__PURE__ */ new Date(getTodayPST() + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
function diffDays(laterDateStr, earlierDateStr) {
  const later = /* @__PURE__ */ new Date(laterDateStr + "T00:00:00Z");
  const earlier = /* @__PURE__ */ new Date(earlierDateStr + "T00:00:00Z");
  return Math.round((later.getTime() - earlier.getTime()) / 864e5);
}
const register$x = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "recall",
    title: "Recall from Brain",
    description: "Search across all brain types (notes, people, projects, decisions, sources) with ranked keyword search. Searches note body/content and tags. Returns snippets, documentIds, and linked source/person ids. Results ranked by: title match (×3) > alias/tag match (×2) > body match (×1), plus recency decay and pinned boost. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      query: string().describe("Search query (keywords)"),
      types: array(_enum(["note", "person", "project", "decision", "source", "retro", "gap", "capability", "rule", "todo", "goal", "goal-checkin"])).optional().describe("Limit search to these types (default: all)"),
      kind: _enum(["fact", "preference", "idea", "todo", "log", "reference", "lesson", "video", "taught"]).optional().describe("Filter notes by kind"),
      tag: string().optional().describe("Filter by tag (notes only)"),
      videoId: string().optional().describe("Filter by videoId (notes only)"),
      sourceId: string().optional().describe("Filter by linked source documentId (notes only)"),
      since: string().optional().describe("Only return items updated after this ISO date"),
      limit: number().min(1).max(25).optional().describe("Max results (default: 25)")
    }),
    resolveOutputSchema: () => object({
      results: array(object({
        type: string(),
        documentId: string(),
        slug: string().nullish(),
        title: string().nullish(),
        name: string().nullish(),
        snippet: string(),
        score: number(),
        updatedAt: string(),
        linkedSourceIds: array(string()).optional(),
        linkedPersonIds: array(string()).optional()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const results = await brainService.search({
        query: args.query,
        types: args.types,
        kind: args.kind,
        tag: args.tag,
        videoId: args.videoId,
        sourceId: args.sourceId,
        since: args.since,
        limit: args.limit
      });
      const output = stripNullish({
        results,
        count: results.length
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const recall = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$x
}, Symbol.toStringTag, { value: "Module" }));
const register$w = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "get_entity",
    title: "Get Brain Entity",
    description: "Fetch one entity by type and documentId or slug, with relations populated. Use after recall to get full details. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      type: _enum(["note", "person", "project", "decision", "source", "retro", "gap", "capability", "rule", "todo", "goal", "goal-checkin"]).describe("Entity type"),
      identifier: string().describe("documentId or slug")
    }),
    resolveOutputSchema: () => object({
      entity: record(any()).nullable()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid(args.type);
      const entities = await strapi22.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.identifier } },
            { slug: { $eq: args.identifier } }
          ]
        },
        populate: "*",
        limit: 1
      });
      const entity = entities.length > 0 ? entities[0] : null;
      let sanitized = entity;
      if (entity) {
        try {
          sanitized = await strapi22.contentAPI.sanitize.output(entity, uid, context.userAbility);
        } catch (err) {
          strapi22.log.warn("Failed to sanitize entity:", err);
        }
      }
      const output = {
        entity: sanitized
      };
      return {
        content: [
          {
            type: "text",
            text: sanitized ? JSON.stringify(sanitized, null, 2) : "Entity not found"
          }
        ],
        structuredContent: output
      };
    }
  });
};
const getEntity = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$w
}, Symbol.toStringTag, { value: "Module" }));
const register$v = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "list_recent",
    title: "List Recent Brain Items",
    description: 'Get newest N items by updatedAt across or within types. Good for "what did we save today?". Optional filters: types, kind (notes only), source_bot. See get_brain_guide for usage.',
    resolveInputSchema: () => object({
      types: array(_enum(["note", "person", "project", "decision", "source"])).optional().describe("Limit to these types (default: all)"),
      kind: _enum(["fact", "preference", "idea", "todo", "log", "reference", "lesson", "video", "taught"]).optional().describe("Filter notes by kind"),
      source_bot: string().optional().describe("Filter by source_bot (notes only)"),
      limit: number().min(1).max(50).optional().describe("Max results (default: 25)")
    }),
    resolveOutputSchema: () => object({
      items: array(object({
        type: string(),
        documentId: string(),
        title: string().nullish(),
        name: string().nullish(),
        slug: string().nullish(),
        updatedAt: string()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const types = args.types || [...CONTENT_TYPES];
      const limit = args.limit || 25;
      const allItems = [];
      for (const type of types) {
        const uid = getUid(type);
        const filters2 = {};
        if (args.kind && type === "note") {
          filters2.kind = { $eq: args.kind };
        }
        if (args.source_bot && type === "note") {
          filters2.source_bot = { $eq: args.source_bot };
        }
        try {
          const items = await strapi22.documents(uid).findMany({
            filters: filters2,
            sort: { updatedAt: "desc" },
            limit: limit * 2
          });
          for (const item of items) {
            let sanitized = item;
            try {
              sanitized = await strapi22.contentAPI.sanitize.output(item, uid, context.userAbility);
            } catch (err) {
              strapi22.log.warn("Failed to sanitize item:", err);
            }
            allItems.push({
              type,
              documentId: sanitized.documentId,
              title: sanitized.title,
              name: sanitized.name,
              slug: sanitized.slug,
              updatedAt: sanitized.updatedAt
            });
          }
        } catch (err) {
          strapi22.log.warn(`Failed to list recent for type ${type}:`, err);
        }
      }
      allItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const limited = allItems.slice(0, limit);
      const output = stripNullish({
        items: limited,
        count: limited.length
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const listRecent = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$v
}, Symbol.toStringTag, { value: "Module" }));
const register$u = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "remember",
    title: "Remember in Brain",
    description: "Create a note with duplicate detection. onDuplicate: merge (append to existing), new (force new), supersede (mark old as superseded). Always set tags and source_bot.",
    resolveInputSchema: () => object({
      title: string().describe("Note title (used to generate slug)"),
      body: string().optional().describe("Note body (markdown)"),
      summary: string().max(280).optional().describe("Short summary"),
      kind: _enum(["fact", "preference", "idea", "todo", "log", "reference", "lesson", "video", "taught"]).optional().describe("Note kind (default: fact)"),
      videoId: string().optional().describe("YouTube video ID for video or taught notes"),
      tags: array(string()).optional().describe("Tags for categorization"),
      confidence: _enum(["low", "medium", "high"]).optional().describe("Confidence level"),
      source_bot: string().optional().describe("Bot identifier that created this"),
      pinned: boolean().optional().describe("Pin this note for higher search ranking"),
      expires_on: string().optional().describe("Expiration date (ISO format)"),
      onDuplicate: _enum(["merge", "new", "supersede"]).optional().describe("How to handle duplicates: merge (append), new (force new), supersede (mark old superseded)"),
      createMissing: boolean().optional().describe("Auto-create missing people/projects/sources by name"),
      link_people: array(string()).optional().describe("People names or slugs to link"),
      link_projects: array(string()).optional().describe("Project names or slugs to link"),
      link_sources: array(string()).optional().describe("Source titles or slugs to link")
    }),
    resolveOutputSchema: () => union([
      object({
        needsDecision: literal(true),
        candidates: array(object({
          documentId: string(),
          title: string(),
          slug: string(),
          kind: string().optional(),
          summary: string().optional()
        }))
      }),
      object({
        created: boolean(),
        documentId: string(),
        slug: string(),
        message: string(),
        superseded: string().optional()
      })
    ]),
    auth: {
      policies: [{ action: getActionId("note.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("note");
      const slug = brainService.slugify(args.title);
      if (!args.onDuplicate) {
        const candidates = await brainService.findDuplicateNotes(args.title);
        if (candidates.length > 0) {
          const output2 = stripNullish({
            needsDecision: true,
            candidates: candidates.map((c) => ({
              documentId: c.documentId,
              title: c.title,
              slug: c.slug,
              kind: c.kind,
              summary: c.summary
            }))
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(output2, null, 2)
              }
            ],
            structuredContent: output2
          };
        }
      }
      const existing = await brainService.findBySlugOrAlias("note", slug);
      let result;
      let created = false;
      let message = "";
      let supersededId;
      const mode2 = args.onDuplicate || "merge";
      if (existing.exists && mode2 !== "new") {
        if (mode2 === "merge") {
          result = await brainService.mergeNote(existing.documentId, {
            body: args.body,
            summary: args.summary,
            kind: args.kind,
            videoId: args.videoId,
            tags: args.tags,
            confidence: args.confidence,
            source_bot: args.source_bot,
            pinned: args.pinned,
            expires_on: args.expires_on
          });
          if (args.createMissing) {
            await applyLinks(strapi22, existing.documentId, args, brainService);
          }
          message = "Merged with existing note";
        } else if (mode2 === "supersede") {
          result = await createNewNote(strapi22, uid, args, slug, brainService);
          await strapi22.documents(uid).update({
            documentId: existing.documentId,
            data: {
              supersededBy: { connect: [{ documentId: result.documentId }] }
            }
          });
          created = true;
          message = "Created new note and superseded old one";
          supersededId = existing.documentId;
        } else {
          result = await strapi22.documents(uid).update({
            documentId: existing.documentId,
            data: {
              title: args.title,
              body: args.body,
              summary: args.summary,
              kind: args.kind || "fact",
              videoId: args.videoId,
              tags: args.tags || [],
              confidence: args.confidence || "medium",
              source_bot: args.source_bot,
              pinned: args.pinned,
              expires_on: args.expires_on
            }
          });
          message = "Replaced existing note";
        }
      } else {
        result = await createNewNote(strapi22, uid, args, slug, brainService);
        created = true;
        message = "Created new note";
      }
      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug,
        message,
        superseded: supersededId
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
async function applyLinks(strapi2, noteDocId, args, brainService) {
  const uid = getUid("note");
  if (args.link_people) {
    const peopleIds = await Promise.all(
      args.link_people.map(async (name) => {
        const personSlug = brainService.slugify(name);
        const existingPerson = await brainService.findBySlugOrAlias("person", personSlug);
        if (existingPerson.exists) {
          return existingPerson.documentId;
        }
        const newPerson = await strapi2.documents(getUid("person")).create({
          data: { name, slug: personSlug }
        });
        return newPerson.documentId;
      })
    );
    await strapi2.documents(uid).update({
      documentId: noteDocId,
      data: { people: { connect: peopleIds.map((id) => ({ documentId: id })) } }
    });
  }
  if (args.link_projects) {
    const projectIds = await Promise.all(
      args.link_projects.map(async (name) => {
        const projectSlug = brainService.slugify(name);
        const existingProject = await brainService.findBySlugOrAlias("project", projectSlug);
        if (existingProject.exists) {
          return existingProject.documentId;
        }
        const newProject = await strapi2.documents(getUid("project")).create({
          data: { name, slug: projectSlug }
        });
        return newProject.documentId;
      })
    );
    await strapi2.documents(uid).update({
      documentId: noteDocId,
      data: { projects: { connect: projectIds.map((id) => ({ documentId: id })) } }
    });
  }
  if (args.link_sources) {
    const sourceIds = await Promise.all(
      args.link_sources.map(async (title) => {
        const sourceSlug = brainService.slugify(title);
        const existingSource = await brainService.findBySlugOrAlias("source", sourceSlug);
        if (existingSource.exists) {
          return existingSource.documentId;
        }
        const newSource = await strapi2.documents(getUid("source")).create({
          data: { title, slug: sourceSlug }
        });
        return newSource.documentId;
      })
    );
    await strapi2.documents(uid).update({
      documentId: noteDocId,
      data: { sources: { connect: sourceIds.map((id) => ({ documentId: id })) } }
    });
  }
}
async function createNewNote(strapi2, uid, args, slug, brainService) {
  const data = {
    title: args.title,
    slug,
    body: args.body,
    summary: args.summary,
    kind: args.kind || "fact",
    videoId: args.videoId,
    tags: args.tags || [],
    confidence: args.confidence || "medium",
    source_bot: args.source_bot,
    pinned: args.pinned || false,
    expires_on: args.expires_on
  };
  if (args.createMissing) {
    if (args.link_people) {
      const peopleIds = await Promise.all(
        args.link_people.map(async (name) => {
          const personSlug = brainService.slugify(name);
          const existingPerson = await brainService.findBySlugOrAlias("person", personSlug);
          if (existingPerson.exists) {
            return existingPerson.documentId;
          }
          const newPerson = await strapi2.documents(getUid("person")).create({
            data: { name, slug: personSlug }
          });
          return newPerson.documentId;
        })
      );
      data.people = { connect: peopleIds.map((id) => ({ documentId: id })) };
    }
    if (args.link_projects) {
      const projectIds = await Promise.all(
        args.link_projects.map(async (name) => {
          const projectSlug = brainService.slugify(name);
          const existingProject = await brainService.findBySlugOrAlias("project", projectSlug);
          if (existingProject.exists) {
            return existingProject.documentId;
          }
          const newProject = await strapi2.documents(getUid("project")).create({
            data: { name, slug: projectSlug }
          });
          return newProject.documentId;
        })
      );
      data.projects = { connect: projectIds.map((id) => ({ documentId: id })) };
    }
    if (args.link_sources) {
      const sourceIds = await Promise.all(
        args.link_sources.map(async (title) => {
          const sourceSlug = brainService.slugify(title);
          const existingSource = await brainService.findBySlugOrAlias("source", sourceSlug);
          if (existingSource.exists) {
            return existingSource.documentId;
          }
          const newSource = await strapi2.documents(getUid("source")).create({
            data: { title, slug: sourceSlug }
          });
          return newSource.documentId;
        })
      );
      data.sources = { connect: sourceIds.map((id) => ({ documentId: id })) };
    }
  }
  return strapi2.documents(uid).create({ data });
}
const remember = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$u
}, Symbol.toStringTag, { value: "Module" }));
const register$t = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "update_note",
    title: "Update Brain Note",
    description: "Patch a note's fields. Use appendBody instead of body to add without overwriting. Use addTags/removeTags for tag operations. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      identifier: string().describe("documentId or slug"),
      title: string().optional().describe("New title"),
      body: string().optional().describe("Replace body (use appendBody to add)"),
      appendBody: string().optional().describe("Append to body (preferred over replace)"),
      summary: string().max(280).optional().describe("New summary"),
      kind: _enum(["fact", "preference", "idea", "todo", "log", "reference", "lesson", "video", "taught"]).optional().describe("New kind"),
      videoId: string().optional().describe("YouTube video ID"),
      addTags: array(string()).optional().describe("Tags to add"),
      removeTags: array(string()).optional().describe("Tags to remove"),
      confidence: _enum(["low", "medium", "high"]).optional().describe("New confidence"),
      pinned: boolean().optional().describe("Pin/unpin"),
      expires_on: string().optional().describe("New expiration date")
    }),
    resolveOutputSchema: () => object({
      updated: boolean(),
      documentId: string()
    }),
    auth: {
      policies: [{ action: getActionId("note.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("note");
      const notes = await strapi22.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.identifier } },
            { slug: { $eq: args.identifier } }
          ]
        },
        limit: 1
      });
      if (notes.length === 0) {
        throw new Error(`Note not found: ${args.identifier}`);
      }
      const note2 = notes[0];
      const updates = {};
      if (args.title) updates.title = args.title;
      if (args.summary) updates.summary = args.summary;
      if (args.kind) updates.kind = args.kind;
      if (args.videoId !== void 0) updates.videoId = args.videoId;
      if (args.confidence) updates.confidence = args.confidence;
      if (args.pinned !== void 0) updates.pinned = args.pinned;
      if (args.expires_on) updates.expires_on = args.expires_on;
      if (args.body) {
        updates.body = args.body;
      } else if (args.appendBody) {
        const existingBody = note2.body || "";
        updates.body = existingBody ? `${existingBody}

---

${args.appendBody}` : args.appendBody;
      }
      if (args.addTags || args.removeTags) {
        let tags = Array.isArray(note2.tags) ? [...note2.tags] : [];
        if (args.addTags) {
          tags = [.../* @__PURE__ */ new Set([...tags, ...args.addTags])];
        }
        if (args.removeTags) {
          tags = tags.filter((t) => !args.removeTags.includes(t));
        }
        updates.tags = tags;
      }
      const result = await strapi22.documents(uid).update({
        documentId: note2.documentId,
        data: updates
      });
      const output = {
        updated: true,
        documentId: result.documentId
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const updateNote = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$t
}, Symbol.toStringTag, { value: "Module" }));
const register$s = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "link",
    title: "Link Brain Entities",
    description: "Connect or disconnect a note with people/projects/sources/decisions. Pass documentIds or slugs. For sources, can also pass videoId or url to find/update. Use after creating stubs with createMissing. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      note: string().describe("Note documentId or slug"),
      relation: _enum(["people", "projects", "sources", "decisions"]).describe("Relation to modify"),
      targets: array(string()).describe("Target documentIds or slugs"),
      operation: _enum(["connect", "disconnect"]).describe("connect or disconnect"),
      videoId: string().optional().describe("For sources: videoId to find source or update matched source"),
      url: string().optional().describe("For sources: url to find source or update matched source")
    }),
    resolveOutputSchema: () => object({
      linked: boolean(),
      message: string()
    }),
    auth: {
      policies: [{ action: getActionId("note.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const noteDocId = await brainService.resolveEntityBySlug("note", args.note);
      if (!noteDocId) {
        throw new Error(`Note not found: ${args.note}`);
      }
      const relationTypeMap = {
        people: "person",
        projects: "project",
        sources: "source",
        decisions: "decision"
      };
      const targetType = relationTypeMap[args.relation];
      const targetDocIds = await Promise.all(
        args.targets.map(async (target) => {
          let docId = await brainService.resolveEntityBySlug(targetType, target);
          if (!docId && args.relation === "sources") {
            const sourceUid = `plugin::${PLUGIN_NAME$1}.source`;
            if (args.videoId) {
              const sources = await strapi22.documents(sourceUid).findMany({
                filters: { videoId: { $eq: args.videoId } },
                limit: 1
              });
              if (sources.length > 0) {
                docId = sources[0].documentId;
                const updates = {};
                if (args.url && !sources[0].url) {
                  updates.url = args.url;
                }
                if (Object.keys(updates).length > 0) {
                  await strapi22.documents(sourceUid).update({
                    documentId: docId,
                    data: updates
                  });
                }
              }
            } else if (args.url) {
              const sources = await strapi22.documents(sourceUid).findMany({
                filters: { url: { $eq: args.url } },
                limit: 1
              });
              if (sources.length > 0) {
                docId = sources[0].documentId;
                if (args.videoId && !sources[0].videoId) {
                  await strapi22.documents(sourceUid).update({
                    documentId: docId,
                    data: { videoId: args.videoId }
                  });
                }
              }
            }
          }
          if (!docId) {
            throw new Error(`${targetType} not found: ${target}`);
          }
          return docId;
        })
      );
      await brainService.linkEntities(
        noteDocId,
        args.relation,
        targetDocIds,
        args.operation
      );
      const output = {
        linked: true,
        message: `${args.operation === "connect" ? "Connected" : "Disconnected"} ${targetDocIds.length} ${args.relation}`
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const link = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$s
}, Symbol.toStringTag, { value: "Module" }));
const register$r = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "log_decision",
    title: "Log Brain Decision",
    description: "Create a decision record (context/decision/rationale). Always link project and people. Optionally mark a prior decision as superseded. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      title: string().describe("Decision title"),
      context: string().optional().describe("Background context (markdown)"),
      decision: string().describe("The decision made (markdown)"),
      rationale: string().optional().describe("Why this decision (markdown)"),
      status: _enum(["proposed", "accepted", "superseded"]).optional().describe("Decision status (default: accepted)"),
      decided_on: string().optional().describe("Decision date (ISO format)"),
      project: string().optional().describe("Project documentId or slug"),
      people: array(string()).optional().describe("People documentIds or slugs"),
      supersedes: string().optional().describe("Prior decision documentId or slug to mark superseded")
    }),
    resolveOutputSchema: () => object({
      created: boolean(),
      documentId: string(),
      slug: string()
    }),
    auth: {
      policies: [{ action: getActionId("decision.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("decision");
      const slug = brainService.slugify(args.title);
      const data = {
        title: args.title,
        slug,
        context: args.context,
        decision: args.decision,
        rationale: args.rationale,
        state: args.status || "accepted",
        // Map external status to internal state
        decided_on: args.decided_on || (/* @__PURE__ */ new Date()).toISOString()
      };
      if (args.project) {
        const projectDocId = await brainService.resolveEntityBySlug("project", args.project);
        if (projectDocId) {
          data.project = { connect: [{ documentId: projectDocId }] };
        }
      }
      if (args.people && args.people.length > 0) {
        const peopleDocIds = await Promise.all(
          args.people.map(async (p) => {
            const docId = await brainService.resolveEntityBySlug("person", p);
            return docId;
          })
        );
        const validIds = peopleDocIds.filter((id) => id !== null);
        if (validIds.length > 0) {
          data.people = { connect: validIds.map((id) => ({ documentId: id })) };
        }
      }
      if (args.supersedes) {
        const supersedesDocId = await brainService.resolveEntityBySlug("decision", args.supersedes);
        if (supersedesDocId) {
          data.supersedes = { connect: [{ documentId: supersedesDocId }] };
          await strapi22.documents(uid).update({
            documentId: supersedesDocId,
            data: { state: "superseded" }
          });
        }
      }
      const result = await strapi22.documents(uid).create({ data });
      const output = {
        created: true,
        documentId: result.documentId,
        slug: result.slug
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const logDecision = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$r
}, Symbol.toStringTag, { value: "Module" }));
const register$q = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "forget",
    title: "Forget from Brain",
    description: "Delete an entity (requires confirm: true). Returns what was deleted. Separate permission (not granted by default). See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      type: _enum(["note", "person", "project", "decision", "source"]).describe("Entity type"),
      identifier: string().describe("documentId or slug"),
      confirm: boolean().describe("Must be true to confirm deletion")
    }),
    resolveOutputSchema: () => object({
      deleted: boolean(),
      entity: record(any()).optional()
    }),
    auth: {
      policies: [{ action: getActionId("forget") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      if (!args.confirm) {
        throw new Error("Deletion requires confirm: true");
      }
      const uid = getUid(args.type);
      const entities = await strapi22.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.identifier } },
            { slug: { $eq: args.identifier } }
          ]
        },
        limit: 1
      });
      if (entities.length === 0) {
        throw new Error(`${args.type} not found: ${args.identifier}`);
      }
      const entity = entities[0];
      await strapi22.documents(uid).delete({ documentId: entity.documentId });
      const output = {
        deleted: true,
        entity
      };
      return {
        content: [
          {
            type: "text",
            text: `Deleted ${args.type}: ${entity.title || entity.name || entity.documentId}`
          }
        ],
        structuredContent: output
      };
    }
  });
};
const forget = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$q
}, Symbol.toStringTag, { value: "Module" }));
const register$p = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "log_retro",
    title: "Log Brain Retro",
    description: "Create a retro record (failure on real work + fix). Optionally link to project. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      title: string().describe("Retro title"),
      date: string().optional().describe("Date of failure (YYYY-MM-DD, defaults to today in America/Los_Angeles)"),
      task: string().optional().describe("What task was being attempted"),
      failure: string().describe("What went wrong"),
      fix: string().describe("How it was fixed"),
      fixLocation: string().optional().describe("Where the fix was applied (file, system, etc.)"),
      status: _enum(["open", "fixed"]).optional().describe("Status (default: open)"),
      project: string().optional().describe("Project documentId or slug")
    }),
    resolveOutputSchema: () => object({
      created: boolean(),
      documentId: string(),
      slug: string()
    }),
    auth: {
      policies: [{ action: getActionId("meta.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("retro");
      const slug = brainService.slugify(args.title);
      const data = {
        title: args.title,
        slug,
        date: args.date ? args.date.slice(0, 10) : getTodayPST(),
        task: args.task,
        failure: args.failure,
        fix: args.fix,
        fixLocation: args.fixLocation,
        state: args.status || "open"
        // Map external status to internal state,
      };
      if (args.project) {
        const projectDocId = await brainService.resolveEntityBySlug("project", args.project);
        if (projectDocId) {
          data.project = { connect: [{ documentId: projectDocId }] };
        }
      }
      const result = await strapi22.documents(uid).create({ data });
      const output = {
        created: true,
        documentId: result.documentId,
        slug: result.slug
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const logRetro = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$p
}, Symbol.toStringTag, { value: "Module" }));
const register$o = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "list_retros",
    title: "List Brain Retros",
    description: "List retro records. Filter by status. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      status: _enum(["open", "fixed"]).optional().describe("Filter by status"),
      limit: number().min(1).max(50).optional().describe("Max results (default: 25)")
    }),
    resolveOutputSchema: () => object({
      items: array(object({
        documentId: string(),
        slug: string(),
        title: string(),
        status: string(),
        date: string().nullish(),
        failure: string().nullish(),
        fix: string().nullish()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("retro");
      const limit = args.limit || 25;
      const filters2 = {};
      if (args.status) {
        filters2.state = { $eq: args.status };
      }
      const items = await strapi22.documents(uid).findMany({
        filters: filters2,
        sort: { date: "desc" },
        limit
      });
      const output = stripNullish({
        items: items.map((item) => ({
          documentId: item.documentId,
          slug: item.slug,
          title: item.title,
          status: item.state,
          // Map state to status for external API
          date: item.date,
          failure: item.failure,
          fix: item.fix
        })),
        count: items.length
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const listRetros = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$o
}, Symbol.toStringTag, { value: "Module" }));
const register$n = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "log_gap",
    title: "Log Brain Gap",
    description: "Create a gap record (request nothing handled well). If a similar open gap exists, appends to seenDates and returns proposeCapability: true when seenDates reaches 2.",
    resolveInputSchema: () => object({
      title: string().describe("Gap title"),
      date: string().optional().describe("Date of gap (ISO format)"),
      request: string().describe("What was requested"),
      whatWasNeeded: string().describe("What was actually needed"),
      status: _enum(["open", "built", "wontfix"]).optional().describe("Status (default: open)")
    }),
    resolveOutputSchema: () => object({
      created: boolean(),
      documentId: string(),
      slug: string(),
      count: number(),
      message: string(),
      proposeCapability: boolean().optional(),
      seenDates: array(string()).optional()
    }),
    auth: {
      policies: [{ action: getActionId("meta.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("gap");
      const slug = brainService.slugify(args.title);
      const today = getTodayPST();
      const existing = await strapi22.documents(uid).findMany({
        filters: {
          slug: { $eq: slug },
          state: { $eq: "open" }
        },
        limit: 1
      });
      let result;
      let created = false;
      let message = "";
      let proposeCapability = false;
      if (existing.length > 0) {
        const existingGap = existing[0];
        const seenDates = Array.isArray(existingGap.seenDates) ? [...existingGap.seenDates] : [];
        if (!seenDates.includes(today)) {
          seenDates.push(today);
        }
        if (seenDates.length >= 2) {
          proposeCapability = true;
        }
        result = await strapi22.documents(uid).update({
          documentId: existingGap.documentId,
          data: {
            count: (existingGap.count || 1) + 1,
            seenDates
          }
        });
        created = false;
        message = `Appended to existing gap seenDates (count: ${result.count})`;
      } else {
        const data = {
          title: args.title,
          slug,
          date: args.date || today,
          firstSeen: today,
          seenDates: [today],
          request: args.request,
          whatWasNeeded: args.whatWasNeeded,
          count: 1,
          state: args.status || "open"
          // Map external status to internal state,
        };
        result = await strapi22.documents(uid).create({ data });
        created = true;
        message = "Created new gap";
      }
      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug,
        count: result.count,
        message,
        proposeCapability: proposeCapability || void 0,
        seenDates: result.seenDates
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const logGap = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$n
}, Symbol.toStringTag, { value: "Module" }));
const register$m = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "list_gaps",
    title: "List Brain Gaps",
    description: "List gap records. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      status: _enum(["open", "built", "wontfix"]).optional().describe("Filter by status"),
      limit: number().min(1).max(50).optional().describe("Max results (default: 25)")
    }),
    resolveOutputSchema: () => object({
      items: array(object({
        documentId: string(),
        slug: string(),
        title: string(),
        status: string(),
        count: number(),
        date: string().nullish(),
        request: string().nullish(),
        whatWasNeeded: string().nullish()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("gap");
      const limit = args.limit || 25;
      const filters2 = {};
      if (args.status) {
        filters2.state = { $eq: args.status };
      }
      const items = await strapi22.documents(uid).findMany({
        filters: filters2,
        sort: { count: "desc", date: "desc" },
        limit
      });
      const output = stripNullish({
        items: items.map((item) => ({
          documentId: item.documentId,
          slug: item.slug,
          title: item.title,
          status: item.state,
          // Map state to status for external API
          count: item.count || 1,
          date: item.date,
          request: item.request,
          whatWasNeeded: item.whatWasNeeded
        })),
        count: items.length
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const listGaps = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$m
}, Symbol.toStringTag, { value: "Module" }));
const register$l = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "record_capability",
    title: "Record Brain Capability",
    description: "Create or update a capability record (what a system can and CANNOT do). Upserts by system+capability. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      system: string().describe('System name (e.g., "strapi", "mcp", "cursor-agent")'),
      capability: string().describe("What capability is being tested"),
      canDo: boolean().describe("Whether the system CAN do this"),
      verifiedAt: string().optional().describe("When this was verified (YYYY-MM-DD, defaults to today in America/Los_Angeles)"),
      howVerified: string().optional().describe("How this was verified"),
      notes: string().optional().describe("Additional notes")
    }),
    resolveOutputSchema: () => object({
      created: boolean(),
      documentId: string(),
      message: string()
    }),
    auth: {
      policies: [{ action: getActionId("meta.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("capability");
      const existing = await strapi22.documents(uid).findMany({
        filters: {
          system: { $eq: args.system },
          capability: { $eq: args.capability }
        },
        limit: 1
      });
      let result;
      let created = false;
      let message = "";
      const data = {
        system: args.system,
        capability: args.capability,
        canDo: args.canDo,
        verifiedAt: args.verifiedAt ? args.verifiedAt.slice(0, 10) : getTodayPST(),
        howVerified: args.howVerified,
        notes: args.notes
      };
      if (existing.length > 0) {
        result = await strapi22.documents(uid).update({
          documentId: existing[0].documentId,
          data
        });
        created = false;
        message = "Updated existing capability";
      } else {
        result = await strapi22.documents(uid).create({ data });
        created = true;
        message = "Created new capability";
      }
      const output = {
        created,
        documentId: result.documentId,
        message
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const recordCapability = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$l
}, Symbol.toStringTag, { value: "Module" }));
const register$k = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "list_capabilities",
    title: "List Brain Capabilities",
    description: "List capability records. Filter by system. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      system: string().optional().describe("Filter by system"),
      limit: number().min(1).max(50).optional().describe("Max results (default: 25)")
    }),
    resolveOutputSchema: () => object({
      items: array(object({
        documentId: string(),
        system: string(),
        capability: string(),
        canDo: boolean(),
        verifiedAt: string().nullish(),
        howVerified: string().nullish(),
        notes: string().nullish()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("capability");
      const limit = args.limit || 25;
      const filters2 = {};
      if (args.system) {
        filters2.system = { $eq: args.system };
      }
      const items = await strapi22.documents(uid).findMany({
        filters: filters2,
        sort: { verifiedAt: "desc" },
        limit
      });
      const output = stripNullish({
        items: items.map((item) => ({
          documentId: item.documentId,
          system: item.system,
          capability: item.capability,
          canDo: item.canDo,
          verifiedAt: item.verifiedAt,
          howVerified: item.howVerified,
          notes: item.notes
        })),
        count: items.length
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const listCapabilities = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$k
}, Symbol.toStringTag, { value: "Module" }));
const register$j = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "add_rule",
    title: "Add Brain Rule",
    description: "Create a deterministic routing/handling rule. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      name: string().describe("Rule name"),
      match: string().describe("What items this rule applies to"),
      action: string().describe("What action to take"),
      priority: number().optional().describe("Priority (higher = earlier, default: 0)"),
      enabled: boolean().optional().describe("Whether rule is enabled (default: true)")
    }),
    resolveOutputSchema: () => object({
      created: boolean(),
      documentId: string()
    }),
    auth: {
      policies: [{ action: getActionId("rule.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("rule");
      const data = {
        name: args.name,
        match: args.match,
        action: args.action,
        priority: args.priority || 0,
        enabled: args.enabled !== false
      };
      const result = await strapi22.documents(uid).create({ data });
      const output = {
        created: true,
        documentId: result.documentId
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const addRule = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$j
}, Symbol.toStringTag, { value: "Module" }));
const register$i = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "list_rules",
    title: "List Brain Rules",
    description: "List routing/handling rules. Optionally filter by enabled status, sorted by priority. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      enabled: boolean().optional().describe("Filter by enabled status"),
      limit: number().min(1).max(50).optional().describe("Max results (default: 50)")
    }),
    resolveOutputSchema: () => object({
      items: array(object({
        documentId: string(),
        name: string(),
        match: string(),
        action: string(),
        priority: number(),
        enabled: boolean()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("rule");
      const limit = args.limit || 50;
      const filters2 = {};
      if (args.enabled !== void 0) {
        filters2.enabled = { $eq: args.enabled };
      }
      const items = await strapi22.documents(uid).findMany({
        filters: filters2,
        sort: { priority: "desc" },
        limit
      });
      const sanitized = await Promise.all(
        items.map(async (item) => {
          try {
            return await strapi22.contentAPI.sanitize.output(item, uid, context.userAbility);
          } catch (err) {
            return item;
          }
        })
      );
      const output = {
        items: sanitized.map((item) => ({
          documentId: item.documentId,
          name: item.name,
          match: item.match,
          action: item.action,
          priority: item.priority,
          enabled: item.enabled
        })),
        count: sanitized.length
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const listRules = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$i
}, Symbol.toStringTag, { value: "Module" }));
const register$h = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "add_todo",
    title: "Add Todo",
    description: "Create a new todo item with duplicate detection. Bot-captured todos default to inbox status. Priority: P0 (urgent today), P1 (this week), P2 (soon, default), P3 (someday). onDuplicate: merge (append to existing), new (force new), supersede (mark old as superseded).",
    resolveInputSchema: () => object({
      title: string().describe("Todo title"),
      status: _enum(["inbox", "next", "doing", "waiting", "done", "dropped"]).optional().describe("Status (default: inbox)"),
      priority: _enum(["P0", "P1", "P2", "P3"]).optional().describe("Priority: P0 urgent today, P1 this week, P2 soon (default), P3 someday"),
      dueDate: string().optional().describe("Due date (ISO format)"),
      doDate: string().optional().describe("Do date (ISO format)"),
      goal: string().optional().describe("Goal or objective"),
      acceptanceCriteria: string().optional().describe("Acceptance criteria"),
      context: string().optional().describe("Context (markdown)"),
      links: array(object({
        type: _enum(["email", "github", "calendar", "doc", "url", "other"]),
        label: string(),
        url: string(),
        note: string().optional()
      })).optional().describe("Related links"),
      relatedNoteIds: array(string()).optional().describe("documentIds of related notes"),
      projectId: string().optional().describe("documentId or slug of the project"),
      waitingOn: string().optional().describe("What/who this is waiting on"),
      source: _enum(["paul", "email", "meeting", "bot", "other"]).optional().describe("Source (default: other)"),
      capturedBy: string().optional().describe("Bot or system that captured this"),
      logEntry: string().optional().describe("Initial log entry"),
      onDuplicate: _enum(["merge", "new", "supersede"]).optional().describe("How to handle duplicates: merge (append), new (force new), supersede (mark old superseded)")
    }),
    resolveOutputSchema: () => union([
      object({
        needsDecision: literal(true),
        candidates: array(object({
          documentId: string(),
          title: string(),
          status: string(),
          priority: string(),
          dueDate: string().optional(),
          project: any().optional()
        }))
      }),
      object({
        documentId: string(),
        title: string(),
        status: string(),
        priority: string(),
        merged: boolean().optional(),
        superseded: string().optional()
      })
    ]),
    auth: {
      policies: [{ action: getActionId("todo.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("todo");
      if (!args.onDuplicate) {
        const candidates = await brainService.findDuplicateTodos(args.title, args.dueDate, args.projectId);
        if (candidates.length > 0) {
          const output2 = stripNullish({
            needsDecision: true,
            candidates: candidates.map((c) => ({
              documentId: c.documentId,
              title: c.title,
              status: c.state,
              // Map state to status for external API
              priority: c.priority,
              dueDate: c.dueDate,
              project: c.project
            }))
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(output2, null, 2)
              }
            ],
            structuredContent: output2
          };
        }
      }
      if (args.onDuplicate && args.onDuplicate !== "new") {
        const candidates = await brainService.findDuplicateTodos(args.title, args.dueDate, args.projectId);
        if (candidates.length > 0) {
          const existing = candidates[0];
          if (args.onDuplicate === "merge") {
            const updates = {};
            if (args.context) {
              updates.context = existing.context ? `${existing.context}

---

${args.context}` : args.context;
            }
            const logEntries = Array.isArray(existing.log) ? [...existing.log] : [];
            logEntries.push({
              date: (/* @__PURE__ */ new Date()).toISOString(),
              entry: `Merged with new todo: ${args.title}${args.logEntry ? ` - ${args.logEntry}` : ""}`,
              by: args.capturedBy || "system"
            });
            updates.log = logEntries;
            const result2 = await strapi22.documents(uid).update({
              documentId: existing.documentId,
              data: updates
            });
            const output2 = stripNullish({
              documentId: result2.documentId,
              title: result2.title,
              status: result2.state,
              // Map state to status for external API
              priority: result2.priority,
              merged: true
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(output2, null, 2)
                }
              ],
              structuredContent: output2
            };
          } else if (args.onDuplicate === "supersede") {
            const newTodo = await createNewTodo(strapi22, uid, args);
            await strapi22.documents(uid).update({
              documentId: existing.documentId,
              data: {
                state: "superseded",
                supersededBy: { connect: [{ documentId: newTodo.documentId }] }
              }
            });
            const output2 = stripNullish({
              documentId: newTodo.documentId,
              title: newTodo.title,
              status: newTodo.state,
              // Map state to status for external API
              priority: newTodo.priority,
              superseded: existing.documentId
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(output2, null, 2)
                }
              ],
              structuredContent: output2
            };
          }
        }
      }
      const result = await createNewTodo(strapi22, uid, args);
      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        status: result.state,
        // Map state to status for external API
        priority: result.priority
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
async function createNewTodo(strapi2, uid, args) {
  const data = {
    title: args.title,
    state: args.status || "inbox",
    // Map external status to internal state,
    priority: args.priority || "P2",
    dueDate: args.dueDate,
    doDate: args.doDate,
    goal: args.goal,
    acceptanceCriteria: args.acceptanceCriteria,
    context: args.context,
    links: args.links || [],
    waitingOn: args.waitingOn,
    source: args.source || "other",
    capturedBy: args.capturedBy,
    log: []
  };
  if (args.logEntry) {
    data.log = [{
      date: (/* @__PURE__ */ new Date()).toISOString(),
      entry: args.logEntry,
      by: args.capturedBy || "system"
    }];
  }
  if (args.relatedNoteIds && args.relatedNoteIds.length > 0) {
    data.relatedNotes = {
      connect: args.relatedNoteIds.map((id) => ({ documentId: id }))
    };
  }
  if (args.projectId) {
    const projectUid = getUid("project");
    const projects = await strapi2.documents(projectUid).findMany({
      filters: {
        $or: [
          { documentId: { $eq: args.projectId } },
          { slug: { $eq: args.projectId } }
        ]
      },
      limit: 1
    });
    if (projects.length > 0) {
      data.project = { connect: [{ documentId: projects[0].documentId }] };
    }
  }
  return strapi2.documents(uid).create({ data });
}
const addTodo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$h
}, Symbol.toStringTag, { value: "Module" }));
const register$g = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "update_todo",
    title: "Update Todo",
    description: "Update a todo's fields. Can append log entries, change status, and set completedAt when marking as done. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      identifier: string().describe("documentId of the todo"),
      title: string().optional().describe("New title"),
      status: _enum(["inbox", "next", "doing", "waiting", "done", "dropped"]).optional().describe("New status (sets completedAt if done)"),
      priority: _enum(["P0", "P1", "P2", "P3"]).optional().describe("New priority"),
      dueDate: string().optional().describe("New due date (ISO format)"),
      doDate: string().optional().describe("New do date (ISO format)"),
      goal: string().optional().describe("New goal"),
      acceptanceCriteria: string().optional().describe("New acceptance criteria"),
      context: string().optional().describe("New context"),
      appendContext: string().optional().describe("Append to context (preferred over replace)"),
      addLinks: array(object({
        type: _enum(["email", "github", "calendar", "doc", "url", "other"]),
        label: string(),
        url: string(),
        note: string().optional()
      })).optional().describe("Links to add"),
      waitingOn: string().optional().describe("What/who this is waiting on"),
      appendLog: string().optional().describe("Append a log entry"),
      closingNote: string().optional().describe("Closing note (for done/dropped)")
    }),
    resolveOutputSchema: () => object({
      updated: boolean(),
      documentId: string(),
      status: string()
    }),
    auth: {
      policies: [{ action: getActionId("todo.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("todo");
      const todos = await strapi22.documents(uid).findMany({
        filters: { documentId: { $eq: args.identifier } },
        limit: 1
      });
      if (todos.length === 0) {
        throw new Error(`Todo not found: ${args.identifier}`);
      }
      const todo2 = todos[0];
      const updates = {};
      if (args.title) updates.title = args.title;
      if (args.priority) updates.priority = args.priority;
      if (args.dueDate !== void 0) updates.dueDate = args.dueDate;
      if (args.doDate !== void 0) updates.doDate = args.doDate;
      if (args.goal !== void 0) updates.goal = args.goal;
      if (args.acceptanceCriteria !== void 0) updates.acceptanceCriteria = args.acceptanceCriteria;
      if (args.waitingOn !== void 0) updates.waitingOn = args.waitingOn;
      if (args.closingNote !== void 0) updates.closingNote = args.closingNote;
      if (args.context) {
        updates.context = args.context;
      } else if (args.appendContext) {
        const existingContext = todo2.context || "";
        updates.context = existingContext ? `${existingContext}

---

${args.appendContext}` : args.appendContext;
      }
      if (args.status) {
        updates.state = args.status;
        if (args.status === "done" && !todo2.completedAt) {
          updates.completedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
      }
      if (args.addLinks) {
        const existingLinks = Array.isArray(todo2.links) ? [...todo2.links] : [];
        updates.links = [...existingLinks, ...args.addLinks];
      }
      if (args.appendLog) {
        const existingLog = Array.isArray(todo2.log) ? [...todo2.log] : [];
        existingLog.push({
          date: (/* @__PURE__ */ new Date()).toISOString(),
          entry: args.appendLog,
          by: context?.user?.email || "system"
        });
        updates.log = existingLog;
      }
      const result = await strapi22.documents(uid).update({
        documentId: todo2.documentId,
        data: updates
      });
      const output = {
        updated: true,
        documentId: result.documentId,
        status: result.state
        // Map state to status for external API
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const updateTodo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$g
}, Symbol.toStringTag, { value: "Module" }));
const register$f = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "list_todos",
    title: "List Todos",
    description: "List todos with filters: status[], priority[], project (documentId/slug), dueBefore (ISO date), overdue (boolean), waitingOlderThanDays (number). Results sorted by priority then dueDate.",
    resolveInputSchema: () => object({
      status: array(_enum(["inbox", "next", "doing", "waiting", "done", "dropped"])).optional().describe("Filter by status"),
      priority: array(_enum(["P0", "P1", "P2", "P3"])).optional().describe("Filter by priority"),
      project: string().optional().describe("Filter by project documentId or slug"),
      dueBefore: string().optional().describe("Filter todos due before this date (ISO format)"),
      overdue: boolean().optional().describe("Filter overdue todos (dueDate < today and status not done/dropped)"),
      waitingOlderThanDays: number().optional().describe("Filter waiting items older than N days"),
      limit: number().min(1).max(100).optional().describe("Max results (default: 50)")
    }),
    resolveOutputSchema: () => object({
      todos: array(object({
        documentId: string(),
        title: string(),
        status: string(),
        priority: string(),
        dueDate: string().nullish(),
        doDate: string().nullish(),
        project: object({
          documentId: string(),
          name: string()
        }).nullish(),
        waitingOn: string().nullish(),
        source: string().nullish(),
        capturedBy: string().nullish()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("todo");
      const limit = args.limit || 50;
      const filters2 = {};
      if (args.status && args.status.length > 0) {
        filters2.state = { $in: args.status };
      }
      if (args.priority && args.priority.length > 0) {
        filters2.priority = { $in: args.priority };
      }
      if (args.project) {
        const projectUid = getUid("project");
        const projects = await strapi22.documents(projectUid).findMany({
          filters: {
            $or: [
              { documentId: { $eq: args.project } },
              { slug: { $eq: args.project } }
            ]
          },
          limit: 1
        });
        if (projects.length > 0) {
          filters2.project = { documentId: { $eq: projects[0].documentId } };
        } else {
          return {
            content: [{ type: "text", text: JSON.stringify({ todos: [], count: 0 }, null, 2) }],
            structuredContent: { todos: [], count: 0 }
          };
        }
      }
      if (args.dueBefore) {
        filters2.dueDate = { $lt: args.dueBefore };
      }
      if (args.overdue) {
        const today = getTodayPST();
        filters2.dueDate = { $lt: today };
        filters2.state = { $notIn: ["done", "dropped"] };
      }
      let todos = await strapi22.documents(uid).findMany({
        filters: filters2,
        populate: ["project"],
        limit: limit * 2
      });
      if (args.waitingOlderThanDays !== void 0) {
        const cutoffDate = getDaysAgoPST(args.waitingOlderThanDays);
        todos = todos.filter((todo2) => {
          if (todo2.state !== "waiting") return false;
          return todo2.updatedAt && todo2.updatedAt.slice(0, 10) < cutoffDate;
        });
      }
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      todos.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
      todos = todos.slice(0, limit);
      const formattedTodos = todos.map((todo2) => ({
        documentId: todo2.documentId,
        title: todo2.title,
        status: todo2.state,
        // Map state to status for external API
        priority: todo2.priority,
        dueDate: todo2.dueDate,
        doDate: todo2.doDate,
        project: todo2.project ? {
          documentId: todo2.project.documentId,
          name: todo2.project.name
        } : void 0,
        waitingOn: todo2.waitingOn,
        source: todo2.source,
        capturedBy: todo2.capturedBy
      }));
      const output = stripNullish({
        todos: formattedTodos,
        count: formattedTodos.length
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const listTodos = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$f
}, Symbol.toStringTag, { value: "Module" }));
const register$e = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "get_todo",
    title: "Get Todo",
    description: "Fetch one todo by documentId with populated relatedNotes and project. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      identifier: string().describe("documentId of the todo")
    }),
    resolveOutputSchema: () => object({
      documentId: string(),
      title: string(),
      status: string(),
      priority: string(),
      dueDate: string().nullish(),
      doDate: string().nullish(),
      goal: string().nullish(),
      acceptanceCriteria: string().nullish(),
      context: string().nullish(),
      links: array(any()).nullish(),
      relatedNotes: array(object({
        documentId: string(),
        title: string(),
        slug: string().nullish()
      })).nullish(),
      project: object({
        documentId: string(),
        name: string(),
        slug: string().nullish()
      }).nullish(),
      waitingOn: string().nullish(),
      log: array(any()).nullish(),
      source: string().nullish(),
      capturedBy: string().nullish(),
      completedAt: string().nullish(),
      closingNote: string().nullish(),
      createdAt: string(),
      updatedAt: string()
    }),
    auth: {
      policies: [{ action: getActionId("read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("todo");
      const todos = await strapi22.documents(uid).findMany({
        filters: { documentId: { $eq: args.identifier } },
        populate: ["relatedNotes", "project"],
        limit: 1
      });
      if (todos.length === 0) {
        throw new Error(`Todo not found: ${args.identifier}`);
      }
      const todo2 = todos[0];
      const output = stripNullish({
        documentId: todo2.documentId,
        title: todo2.title,
        status: todo2.state,
        // Map state to status for external API
        priority: todo2.priority,
        dueDate: todo2.dueDate,
        doDate: todo2.doDate,
        goal: todo2.goal,
        acceptanceCriteria: todo2.acceptanceCriteria,
        context: todo2.context,
        links: todo2.links,
        relatedNotes: todo2.relatedNotes?.map((note2) => ({
          documentId: note2.documentId,
          title: note2.title,
          slug: note2.slug
        })),
        project: todo2.project ? {
          documentId: todo2.project.documentId,
          name: todo2.project.name,
          slug: todo2.project.slug
        } : void 0,
        waitingOn: todo2.waitingOn,
        log: todo2.log,
        source: todo2.source,
        capturedBy: todo2.capturedBy,
        completedAt: todo2.completedAt,
        closingNote: todo2.closingNote,
        createdAt: todo2.createdAt,
        updatedAt: todo2.updatedAt
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const getTodo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$e
}, Symbol.toStringTag, { value: "Module" }));
const register$d = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "complete_todo",
    title: "Complete Todo",
    description: "Mark a todo as done with an optional closing note. Sets status to done and records completedAt timestamp.",
    resolveInputSchema: () => object({
      identifier: string().describe("documentId of the todo"),
      closingNote: string().optional().describe("Closing note or completion summary")
    }),
    resolveOutputSchema: () => object({
      completed: boolean(),
      documentId: string(),
      title: string(),
      completedAt: string()
    }),
    auth: {
      policies: [{ action: getActionId("todo.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("todo");
      const todos = await strapi22.documents(uid).findMany({
        filters: { documentId: { $eq: args.identifier } },
        limit: 1
      });
      if (todos.length === 0) {
        throw new Error(`Todo not found: ${args.identifier}`);
      }
      const todo2 = todos[0];
      const completedAt = (/* @__PURE__ */ new Date()).toISOString();
      const updates = {
        state: "done",
        completedAt
      };
      if (args.closingNote) {
        updates.closingNote = args.closingNote;
      }
      const log = Array.isArray(todo2.log) ? [...todo2.log] : [];
      log.push({
        date: completedAt,
        entry: "Marked as done" + (args.closingNote ? `: ${args.closingNote}` : ""),
        by: context?.user?.email || "system"
      });
      updates.log = log;
      const result = await strapi22.documents(uid).update({
        documentId: todo2.documentId,
        data: updates
      });
      const output = {
        completed: true,
        documentId: result.documentId,
        title: result.title,
        completedAt: result.completedAt
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const completeTodo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$d
}, Symbol.toStringTag, { value: "Module" }));
const register$c = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "add_goal",
    title: "Add Goal",
    description: "Create a new goal with daily or weekly check-ins. Categories: health, fitness, work, learning, personal, other. Refuses duplicate active goals by title.",
    resolveInputSchema: () => object({
      title: string().describe("Goal title"),
      description: string().optional().describe("Goal description"),
      category: _enum(["health", "fitness", "work", "learning", "personal", "other"]).optional().describe("Goal category"),
      cadence: _enum(["daily", "weekly"]).optional().describe("Check-in cadence (default: daily)"),
      target: string().optional().describe('Target metric or description (e.g. "last meal by 5 PM")'),
      startDate: string().optional().describe("Start date (ISO format, defaults to today)")
    }),
    resolveOutputSchema: () => object({
      documentId: string(),
      title: string(),
      category: string().nullish(),
      cadence: string(),
      status: string(),
      currentStreak: number(),
      bestStreak: number(),
      alreadyExists: boolean().optional()
    }),
    auth: {
      policies: [{ action: getActionId("goal.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("goal");
      const existingGoals = await strapi22.documents(uid).findMany({
        filters: {
          title: { $eq: args.title },
          status: { $eq: "active" }
        },
        limit: 1
      });
      if (existingGoals.length > 0) {
        const existing = existingGoals[0];
        const output2 = stripNullish({
          documentId: existing.documentId,
          title: existing.title,
          category: existing.category,
          cadence: existing.cadence,
          status: existing.state,
          // Map state to status for external API
          currentStreak: existing.currentStreak,
          bestStreak: existing.bestStreak,
          alreadyExists: true
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(output2, null, 2)
            }
          ],
          structuredContent: output2
        };
      }
      const data = {
        title: args.title,
        description: args.description,
        category: args.category,
        cadence: args.cadence || "daily",
        target: args.target,
        state: "active",
        startDate: args.startDate || getTodayPST(),
        currentStreak: 0,
        bestStreak: 0
      };
      const result = await strapi22.documents(uid).create({ data });
      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        category: result.category,
        cadence: result.cadence,
        status: result.state,
        // Map state to status for external API
        currentStreak: result.currentStreak,
        bestStreak: result.bestStreak
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const addGoal = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$c
}, Symbol.toStringTag, { value: "Module" }));
const register$b = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "list_goals",
    title: "List Goals",
    description: "List goals with filters by status and category. Includes current and best streaks.",
    resolveInputSchema: () => object({
      status: array(_enum(["active", "paused", "done", "dropped"])).optional().describe("Filter by status"),
      category: array(_enum(["health", "fitness", "work", "learning", "personal", "other"])).optional().describe("Filter by category"),
      limit: number().min(1).max(100).optional().describe("Max results (default: 50)")
    }),
    resolveOutputSchema: () => object({
      goals: array(object({
        documentId: string(),
        title: string(),
        description: string().nullish(),
        category: string().nullish(),
        cadence: string(),
        target: string().nullish(),
        status: string(),
        startDate: string().nullish(),
        currentStreak: number(),
        bestStreak: number(),
        lastCheckinDate: string().nullish()
      })),
      count: number()
    }),
    auth: {
      policies: [{ action: getActionId("goal.read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("goal");
      const limit = args.limit || 50;
      const filters2 = {};
      if (args.status && args.status.length > 0) {
        filters2.state = { $in: args.status };
      }
      if (args.category && args.category.length > 0) {
        filters2.category = { $in: args.category };
      }
      const goals = await strapi22.documents(uid).findMany({
        filters: filters2,
        limit,
        sort: { createdAt: "desc" }
      });
      const todayPST = getTodayPST();
      const formattedGoals = goals.map((goal2) => {
        let currentStreak = goal2.currentStreak;
        if (currentStreak > 0 && goal2.lastCheckinDate) {
          const daysSinceLastCheckin = diffDays(todayPST, goal2.lastCheckinDate);
          if (goal2.cadence === "daily" && daysSinceLastCheckin > 1) {
            currentStreak = 0;
          } else if (goal2.cadence === "weekly" && daysSinceLastCheckin > 7) {
            currentStreak = 0;
          }
        }
        return {
          documentId: goal2.documentId,
          title: goal2.title,
          description: goal2.description,
          category: goal2.category,
          cadence: goal2.cadence,
          target: goal2.target,
          status: goal2.state,
          // Map state to status for external API
          startDate: goal2.startDate,
          currentStreak,
          bestStreak: goal2.bestStreak,
          lastCheckinDate: goal2.lastCheckinDate
        };
      });
      const output = stripNullish({
        goals: formattedGoals,
        count: formattedGoals.length
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const listGoals = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$b
}, Symbol.toStringTag, { value: "Module" }));
function calculateStreaks(checkins, cadence) {
  if (checkins.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }
  const sortedCheckins = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  const latestCheckin = sortedCheckins[0];
  const todayPST = getTodayPST();
  const daysDiff = diffDays(todayPST, latestCheckin.date);
  let currentStreak = 0;
  if (cadence === "daily") {
    if (daysDiff > 1) {
      currentStreak = 0;
    } else {
      for (let i = 0; i < sortedCheckins.length; i++) {
        const checkin = sortedCheckins[i];
        if (!checkin.met) break;
        if (i === 0) {
          currentStreak = 1;
        } else {
          const diff = diffDays(sortedCheckins[i - 1].date, checkin.date);
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
  } else {
    if (daysDiff > 7) {
      currentStreak = 0;
    } else {
      for (let i = 0; i < sortedCheckins.length; i++) {
        const checkin = sortedCheckins[i];
        if (!checkin.met) break;
        if (i === 0) {
          currentStreak = 1;
        } else {
          const diff = diffDays(sortedCheckins[i - 1].date, checkin.date);
          if (diff >= 6 && diff <= 8) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
  }
  let bestStreak = 0;
  let tempStreak = 0;
  for (let i = sortedCheckins.length - 1; i >= 0; i--) {
    const checkin = sortedCheckins[i];
    if (checkin.met) {
      if (i === sortedCheckins.length - 1) {
        tempStreak = 1;
      } else {
        const diff = diffDays(checkin.date, sortedCheckins[i + 1].date);
        if (cadence === "daily" && diff === 1) {
          tempStreak++;
        } else if (cadence === "weekly" && diff >= 6 && diff <= 8) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  return { currentStreak, bestStreak };
}
const register$a = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "log_checkin",
    title: "Log Goal Check-in",
    description: "Log a check-in for a goal. Updates existing check-in for the same date. Recomputes currentStreak (consecutive met days ending on latest check-in) and bestStreak. For daily goals, missed/unlogged days break the streak.",
    resolveInputSchema: () => object({
      goal: string().describe("Goal documentId or title"),
      date: string().optional().describe("Check-in date (YYYY-MM-DD, defaults to today in America/Los_Angeles)"),
      met: boolean().describe("Whether the goal was met"),
      note: string().optional().describe("Optional note"),
      loggedBy: string().optional().describe("Who logged this check-in")
    }),
    resolveOutputSchema: () => object({
      checkinId: string(),
      goalId: string(),
      date: string(),
      met: boolean(),
      currentStreak: number(),
      bestStreak: number()
    }),
    auth: {
      policies: [{ action: getActionId("goal.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const goalUid = getUid("goal");
      const checkinUid = getUid("goal-checkin");
      const goals = await strapi22.documents(goalUid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.goal } },
            { title: { $eq: args.goal } }
          ]
        },
        limit: 1
      });
      if (goals.length === 0) {
        throw new Error(`Goal not found: ${args.goal}`);
      }
      const goal2 = goals[0];
      const checkinDate = args.date || getTodayPST();
      const existingCheckins = await strapi22.documents(checkinUid).findMany({
        filters: {
          goal: { documentId: { $eq: goal2.documentId } },
          date: { $eq: checkinDate }
        },
        limit: 1
      });
      let checkin;
      if (existingCheckins.length > 0) {
        checkin = await strapi22.documents(checkinUid).update({
          documentId: existingCheckins[0].documentId,
          data: {
            met: args.met,
            note: args.note,
            loggedBy: args.loggedBy
          }
        });
      } else {
        checkin = await strapi22.documents(checkinUid).create({
          data: {
            goal: { connect: [{ documentId: goal2.documentId }] },
            date: checkinDate,
            met: args.met,
            note: args.note,
            loggedBy: args.loggedBy
          }
        });
      }
      const allCheckins = await strapi22.documents(checkinUid).findMany({
        filters: {
          goal: { documentId: { $eq: goal2.documentId } }
        },
        limit: 1e3
      });
      const { currentStreak, bestStreak } = calculateStreaks(allCheckins, goal2.cadence);
      await strapi22.documents(goalUid).update({
        documentId: goal2.documentId,
        data: {
          currentStreak,
          bestStreak,
          lastCheckinDate: checkinDate
        }
      });
      const output = stripNullish({
        checkinId: checkin.documentId,
        goalId: goal2.documentId,
        date: checkinDate,
        met: args.met,
        currentStreak,
        bestStreak
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const logCheckin = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  calculateStreaks,
  register: register$a
}, Symbol.toStringTag, { value: "Module" }));
const register$9 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "get_goal_progress",
    title: "Get Goal Progress",
    description: "Get goal progress including streaks, met rate over last 7 and 30 days, and recent check-ins.",
    resolveInputSchema: () => object({
      goal: string().describe("Goal documentId or title"),
      recentCheckinsLimit: number().min(1).max(100).optional().describe("Number of recent check-ins to return (default: 14)")
    }),
    resolveOutputSchema: () => object({
      goalId: string(),
      title: string(),
      status: string(),
      currentStreak: number(),
      bestStreak: number(),
      metRateLast7Days: number().nullish(),
      metRateLast30Days: number().nullish(),
      recentCheckins: array(object({
        date: string(),
        met: boolean(),
        note: string().nullish(),
        loggedBy: string().nullish()
      }))
    }),
    auth: {
      policies: [{ action: getActionId("goal.read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const goalUid = getUid("goal");
      const checkinUid = getUid("goal-checkin");
      const goals = await strapi22.documents(goalUid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.goal } },
            { title: { $eq: args.goal } }
          ]
        },
        limit: 1
      });
      if (goals.length === 0) {
        throw new Error(`Goal not found: ${args.goal}`);
      }
      const goal2 = goals[0];
      const allCheckins = await strapi22.documents(checkinUid).findMany({
        filters: {
          goal: { documentId: { $eq: goal2.documentId } }
        },
        limit: 1e3,
        sort: { date: "desc" }
      });
      const recentLimit = args.recentCheckinsLimit || 14;
      const recentCheckins = allCheckins.slice(0, recentLimit).map((c) => ({
        date: c.date,
        met: c.met,
        note: c.note,
        loggedBy: c.loggedBy
      }));
      const { currentStreak, bestStreak } = calculateStreaks(allCheckins, goal2.cadence);
      const sevenDaysAgoStr = getDaysAgoPST(7);
      const thirtyDaysAgoStr = getDaysAgoPST(30);
      const checkins7Days = allCheckins.filter((c) => c.date >= sevenDaysAgoStr);
      const checkins30Days = allCheckins.filter((c) => c.date >= thirtyDaysAgoStr);
      let metRateLast7Days = null;
      if (checkins7Days.length > 0) {
        const metCount = checkins7Days.filter((c) => c.met).length;
        metRateLast7Days = Math.round(metCount / checkins7Days.length * 100) / 100;
      }
      let metRateLast30Days = null;
      if (checkins30Days.length > 0) {
        const metCount = checkins30Days.filter((c) => c.met).length;
        metRateLast30Days = Math.round(metCount / checkins30Days.length * 100) / 100;
      }
      const output = stripNullish({
        goalId: goal2.documentId,
        title: goal2.title,
        status: goal2.state,
        // Map state to status for external API
        currentStreak,
        bestStreak,
        metRateLast7Days,
        metRateLast30Days,
        recentCheckins
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const getGoalProgress = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$9
}, Symbol.toStringTag, { value: "Module" }));
const register$8 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "update_goal",
    title: "Update Goal",
    description: "Update goal fields including status, description, category, target, etc.",
    resolveInputSchema: () => object({
      goal: string().describe("Goal documentId or title"),
      status: _enum(["active", "paused", "done", "dropped"]).optional().describe("Update status"),
      description: string().optional().describe("Update description"),
      category: _enum(["health", "fitness", "work", "learning", "personal", "other"]).optional().describe("Update category"),
      target: string().optional().describe("Update target"),
      cadence: _enum(["daily", "weekly"]).optional().describe("Update cadence")
    }),
    resolveOutputSchema: () => object({
      documentId: string(),
      title: string(),
      status: string(),
      description: string().nullish(),
      category: string().nullish(),
      target: string().nullish(),
      cadence: string()
    }),
    auth: {
      policies: [{ action: getActionId("goal.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const uid = getUid("goal");
      const goals = await strapi22.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.goal } },
            { title: { $eq: args.goal } }
          ]
        },
        limit: 1
      });
      if (goals.length === 0) {
        throw new Error(`Goal not found: ${args.goal}`);
      }
      const goal2 = goals[0];
      const updateData = {};
      if (args.status !== void 0) updateData.state = args.status;
      if (args.description !== void 0) updateData.description = args.description;
      if (args.category !== void 0) updateData.category = args.category;
      if (args.target !== void 0) updateData.target = args.target;
      if (args.cadence !== void 0) updateData.cadence = args.cadence;
      const updated = await strapi22.documents(uid).update({
        documentId: goal2.documentId,
        data: updateData
      });
      const output = stripNullish({
        documentId: updated.documentId,
        title: updated.title,
        status: updated.state,
        // Map state to status for external API
        description: updated.description,
        category: updated.category,
        target: updated.target,
        cadence: updated.cadence
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const updateGoal = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$8
}, Symbol.toStringTag, { value: "Module" }));
function normalizeTitle(title) {
  return title.toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
}
function isSimilar(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  if (norm1 === norm2) return true;
  const words1 = norm1.split(" ");
  const words2 = norm2.split(" ");
  const commonWords = words1.filter((w) => words2.includes(w) && w.length > 3);
  const similarity = 2 * commonWords.length / (words1.length + words2.length);
  return similarity > 0.7;
}
const register$7 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "health_check",
    title: "Health Check",
    description: "Run diagnostic checks on brain data. Returns findings with severity (BLOCK/WARN), kind, type, ids, message, and suggestedFix. Checks for duplicates, missing fields, stale data, orphans, broken relations, old capabilities, and open retros.",
    resolveInputSchema: () => object({
      checks: array(_enum([
        "duplicates",
        "missing_fields",
        "stale_notes",
        "orphans",
        "broken_relations",
        "old_capabilities",
        "open_retros",
        "sanity"
      ])).optional().describe("Specific checks to run (default: all)")
    }),
    resolveOutputSchema: () => object({
      findings: array(object({
        severity: _enum(["BLOCK", "WARN"]),
        kind: string(),
        type: string(),
        ids: array(string()),
        message: string(),
        suggestedFix: string()
      })),
      summary: object({
        total: number(),
        blocks: number(),
        warns: number()
      })
    }),
    auth: {
      policies: [{ action: getActionId("health.read") }]
    },
    createHandler: (strapi22) => async ({ args }) => {
      const findings = [];
      const checksToRun = args.checks || [
        "duplicates",
        "missing_fields",
        "stale_notes",
        "orphans",
        "broken_relations",
        "old_capabilities",
        "open_retros",
        "sanity"
      ];
      if (checksToRun.includes("duplicates")) {
        const todoUid = getUid("todo");
        const todos = await strapi22.documents(todoUid).findMany({
          filters: {
            state: { $notIn: ["done", "dropped", "superseded"] }
          },
          limit: 500
        });
        for (let i = 0; i < todos.length; i++) {
          for (let j = i + 1; j < todos.length; j++) {
            const t1 = todos[i];
            const t2 = todos[j];
            if (isSimilar(t1.title, t2.title)) {
              const sameDueDate = t1.dueDate && t2.dueDate && t1.dueDate === t2.dueDate;
              const sameProject = t1.project?.documentId === t2.project?.documentId;
              if (sameDueDate || sameProject) {
                findings.push({
                  severity: "WARN",
                  kind: "duplicate_todo",
                  type: "todo",
                  ids: [t1.documentId, t2.documentId],
                  message: `Likely duplicate todos: "${t1.title}" and "${t2.title}"`,
                  suggestedFix: `Review and merge or supersede one: add_todo with onDuplicate: 'supersede'`
                });
              }
            }
          }
        }
        const noteUid = getUid("note");
        const notes = await strapi22.documents(noteUid).findMany({
          limit: 500
        });
        for (let i = 0; i < notes.length; i++) {
          for (let j = i + 1; j < notes.length; j++) {
            const n1 = notes[i];
            const n2 = notes[j];
            if (isSimilar(n1.title, n2.title)) {
              findings.push({
                severity: "WARN",
                kind: "duplicate_note",
                type: "note",
                ids: [n1.documentId, n2.documentId],
                message: `Likely duplicate notes: "${n1.title}" and "${n2.title}"`,
                suggestedFix: `Review and merge or supersede one: remember with onDuplicate: 'supersede'`
              });
            }
          }
        }
      }
      if (checksToRun.includes("missing_fields")) {
        const todoUid = getUid("todo");
        const todos = await strapi22.documents(todoUid).findMany({
          limit: 500
        });
        for (const todo2 of todos) {
          if (!todo2.priority) {
            findings.push({
              severity: "WARN",
              kind: "missing_priority",
              type: "todo",
              ids: [todo2.documentId],
              message: `Todo "${todo2.title}" is missing priority`,
              suggestedFix: `Set priority: update_todo with priority: 'P2'`
            });
          }
          if (!todo2.state) {
            findings.push({
              severity: "WARN",
              kind: "missing_status",
              type: "todo",
              ids: [todo2.documentId],
              message: `Todo "${todo2.title}" is missing status`,
              suggestedFix: `Set status: update_todo with status: 'inbox'`
            });
          }
          if (todo2.state === "done" && !todo2.completedAt) {
            findings.push({
              severity: "WARN",
              kind: "missing_completed_at",
              type: "todo",
              ids: [todo2.documentId],
              message: `Done todo "${todo2.title}" is missing completedAt`,
              suggestedFix: `Set completedAt: update_todo or use complete_todo`
            });
          }
          if (todo2.state === "waiting" && !todo2.waitingOn) {
            findings.push({
              severity: "WARN",
              kind: "missing_waiting_on",
              type: "todo",
              ids: [todo2.documentId],
              message: `Waiting todo "${todo2.title}" is missing waitingOn`,
              suggestedFix: `Set waitingOn: update_todo with waitingOn: '<description>'`
            });
          }
        }
      }
      if (checksToRun.includes("stale_notes")) {
        const noteUid = getUid("note");
        const notes = await strapi22.documents(noteUid).findMany({
          filters: {
            durability: { $eq: "temporary" }
          },
          limit: 500
        });
        const todayPST = getTodayPST();
        for (const note2 of notes) {
          if (note2.verifiedAt) {
            const ageInDays = diffDays(todayPST, note2.verifiedAt.slice(0, 10));
            if (ageInDays > 90) {
              findings.push({
                severity: "WARN",
                kind: "stale_temporary_note",
                type: "note",
                ids: [note2.documentId],
                message: `Temporary note "${note2.title}" verified ${Math.floor(ageInDays)} days ago (>90 days)`,
                suggestedFix: `Re-verify using howToRecheck, or change durability to 'durable', or delete`
              });
            }
          }
        }
      }
      if (checksToRun.includes("orphans")) {
        const noteUid = getUid("note");
        const notes = await strapi22.documents(noteUid).findMany({
          populate: ["people", "projects", "sources", "decisions", "relatedTodos"],
          limit: 500
        });
        for (const note2 of notes) {
          const hasPeople = Array.isArray(note2.people) && note2.people.length > 0;
          const hasProjects = Array.isArray(note2.projects) && note2.projects.length > 0;
          const hasSources = Array.isArray(note2.sources) && note2.sources.length > 0;
          const hasDecisions = Array.isArray(note2.decisions) && note2.decisions.length > 0;
          const hasTodos = Array.isArray(note2.relatedTodos) && note2.relatedTodos.length > 0;
          if (!hasPeople && !hasProjects && !hasSources && !hasDecisions && !hasTodos) {
            findings.push({
              severity: "WARN",
              kind: "orphan_note",
              type: "note",
              ids: [note2.documentId],
              message: `Note "${note2.title}" has no relations or links`,
              suggestedFix: `Link to people/projects/sources using link tool, or delete if obsolete`
            });
          }
        }
      }
      if (checksToRun.includes("broken_relations")) {
        const noteUid = getUid("note");
        const notes = await strapi22.documents(noteUid).findMany({
          populate: ["people", "projects", "sources", "decisions", "relatedTodos"],
          limit: 500
        });
        for (const note2 of notes) {
          const relations = [
            ...note2.people || [],
            ...note2.projects || [],
            ...note2.sources || [],
            ...note2.decisions || [],
            ...note2.relatedTodos || []
          ];
          for (const rel of relations) {
            if (!rel || !rel.documentId) {
              findings.push({
                severity: "WARN",
                kind: "broken_relation",
                type: "note",
                ids: [note2.documentId],
                message: `Note "${note2.title}" has a broken relation`,
                suggestedFix: `Remove broken relation using link tool with operation: 'disconnect'`
              });
              break;
            }
          }
        }
      }
      if (checksToRun.includes("old_capabilities")) {
        const capabilityUid = getUid("capability");
        const capabilities = await strapi22.documents(capabilityUid).findMany({
          limit: 500
        });
        const todayPST = getTodayPST();
        for (const capability2 of capabilities) {
          if (capability2.verifiedAt) {
            const ageInDays = diffDays(todayPST, capability2.verifiedAt.slice(0, 10));
            if (ageInDays > 90) {
              findings.push({
                severity: "WARN",
                kind: "old_capability",
                type: "capability",
                ids: [capability2.documentId],
                message: `Capability "${capability2.system}: ${capability2.capability}" verified ${Math.floor(ageInDays)} days ago (>90 days)`,
                suggestedFix: `Re-verify using howVerified and update with record_capability`
              });
            }
          }
        }
      }
      if (checksToRun.includes("open_retros")) {
        const retroUid = getUid("retro");
        const retros = await strapi22.documents(retroUid).findMany({
          filters: {
            state: { $eq: "open" }
          },
          limit: 500
        });
        const todayPST = getTodayPST();
        for (const retro2 of retros) {
          if (retro2.date) {
            const ageInDays = diffDays(todayPST, retro2.date.slice(0, 10));
            if (ageInDays > 14) {
              findings.push({
                severity: "WARN",
                kind: "old_open_retro",
                type: "retro",
                ids: [retro2.documentId],
                message: `Retro "${retro2.title}" has been open for ${Math.floor(ageInDays)} days (>14 days)`,
                suggestedFix: `Review and update status to 'fixed', 'declined', or 'wontfix' using update_retro`
              });
            }
          }
        }
      }
      if (checksToRun.includes("sanity")) {
        const types = ["note", "todo", "person", "project", "retro", "gap", "capability", "rule"];
        for (const type of types) {
          const uid = getUid(type);
          const results = await strapi22.documents(uid).findMany({ limit: 1 });
          if (results.length === 0) {
            const rawQuery = await strapi22.db.query(uid).count();
            if (rawQuery > 0) {
              findings.push({
                severity: "BLOCK",
                kind: "sanity_mismatch",
                type,
                ids: [],
                message: `Collection ${type} returns 0 rows but raw count is ${rawQuery}`,
                suggestedFix: `Check database permissions and Strapi document service configuration`
              });
            }
          }
        }
      }
      const summary = {
        total: findings.length,
        blocks: findings.filter((f) => f.severity === "BLOCK").length,
        warns: findings.filter((f) => f.severity === "WARN").length
      };
      const output = stripNullish({
        findings,
        summary
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const healthCheck = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$7
}, Symbol.toStringTag, { value: "Module" }));
const register$6 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "update_retro",
    title: "Update Retro",
    description: "Update an existing retro record. Change status to fixed/declined/wontfix, update fix details, or modify other fields.",
    resolveInputSchema: () => object({
      documentId: string().describe("documentId of the retro to update"),
      title: string().optional().describe("Updated title"),
      task: string().optional().describe("Updated task description"),
      failure: string().optional().describe("Updated failure description"),
      fix: string().optional().describe("Updated fix description"),
      fixLocation: string().optional().describe("Updated fix location"),
      status: _enum(["open", "fixed", "declined", "wontfix"]).optional().describe("Updated status"),
      date: string().optional().describe("Updated date (ISO format)")
    }),
    resolveOutputSchema: () => object({
      documentId: string(),
      title: string(),
      status: string(),
      message: string()
    }),
    auth: {
      policies: [{ action: getActionId("retro.update") }]
    },
    createHandler: (strapi22) => async ({ args }) => {
      const uid = getUid("retro");
      const updates = {};
      if (args.title !== void 0) updates.title = args.title;
      if (args.task !== void 0) updates.task = args.task;
      if (args.failure !== void 0) updates.failure = args.failure;
      if (args.fix !== void 0) updates.fix = args.fix;
      if (args.fixLocation !== void 0) updates.fixLocation = args.fixLocation;
      if (args.status !== void 0) updates.state = args.status;
      if (args.date !== void 0) updates.date = args.date;
      const result = await strapi22.documents(uid).update({
        documentId: args.documentId,
        data: updates
      });
      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        status: result.state,
        // Map state to status for external API
        message: "Retro updated successfully"
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const updateRetro = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$6
}, Symbol.toStringTag, { value: "Module" }));
const register$5 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "update_gap",
    title: "Update Gap",
    description: "Update an existing gap record. Change status to built/wontfix, update what was needed, or modify other fields.",
    resolveInputSchema: () => object({
      documentId: string().describe("documentId of the gap to update"),
      title: string().optional().describe("Updated title"),
      request: string().optional().describe("Updated request description"),
      whatWasNeeded: string().optional().describe("Updated description of what was needed"),
      status: _enum(["open", "built", "wontfix"]).optional().describe("Updated status"),
      date: string().optional().describe("Updated date (ISO format)")
    }),
    resolveOutputSchema: () => object({
      documentId: string(),
      title: string(),
      status: string(),
      count: number(),
      message: string()
    }),
    auth: {
      policies: [{ action: getActionId("gap.update") }]
    },
    createHandler: (strapi22) => async ({ args }) => {
      const uid = getUid("gap");
      const updates = {};
      if (args.title !== void 0) updates.title = args.title;
      if (args.request !== void 0) updates.request = args.request;
      if (args.whatWasNeeded !== void 0) updates.whatWasNeeded = args.whatWasNeeded;
      if (args.status !== void 0) updates.state = args.status;
      if (args.date !== void 0) updates.date = args.date;
      const result = await strapi22.documents(uid).update({
        documentId: args.documentId,
        data: updates
      });
      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        status: result.state,
        // Map state to status for external API
        count: result.count,
        message: "Gap updated successfully"
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const updateGap = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$5
}, Symbol.toStringTag, { value: "Module" }));
const register$4 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "get_briefing",
    title: "Get Briefing",
    description: "Get a compact session briefing with pinned/recent lessons, open retros, open gaps, P0/P1/overdue todos, and recent cannot capabilities.",
    resolveInputSchema: () => object({
      lessonLimit: number().optional().describe("Max number of lessons to return (default: 10)"),
      todoLimit: number().optional().describe("Max number of todos to return (default: 10)")
    }),
    resolveOutputSchema: () => object({
      lessons: array(object({
        documentId: string(),
        title: string(),
        summary: string().optional(),
        lesson: string().optional(),
        pinned: boolean().optional()
      })),
      openRetros: array(object({
        documentId: string(),
        title: string(),
        date: string().optional(),
        task: string().optional(),
        failure: string().optional()
      })),
      openGaps: array(object({
        documentId: string(),
        title: string(),
        count: number(),
        request: string().optional(),
        whatWasNeeded: string().optional()
      })),
      urgentTodos: array(object({
        documentId: string(),
        title: string(),
        priority: string(),
        status: string(),
        dueDate: string().optional()
      })),
      recentCannotCapabilities: array(object({
        documentId: string(),
        system: string(),
        capability: string(),
        verifiedAt: string().optional(),
        notes: string().optional()
      })),
      summary: object({
        lessonsCount: number(),
        openRetrosCount: number(),
        openGapsCount: number(),
        urgentTodosCount: number(),
        cannotCount: number()
      })
    }),
    auth: {
      policies: [{ action: getActionId("brief.read") }]
    },
    createHandler: (strapi22) => async ({ args }) => {
      const lessonLimit = args.lessonLimit || 10;
      const todoLimit = args.todoLimit || 10;
      const noteUid = getUid("note");
      const retroUid = getUid("retro");
      const gapUid = getUid("gap");
      const todoUid = getUid("todo");
      const capabilityUid = getUid("capability");
      const pinnedLessons = await strapi22.documents(noteUid).findMany({
        filters: {
          kind: { $eq: "lesson" },
          pinned: { $eq: true }
        },
        limit: lessonLimit,
        sort: ["updatedAt:desc"]
      });
      const remainingLessonSlots = lessonLimit - pinnedLessons.length;
      let recentLessons = [];
      if (remainingLessonSlots > 0) {
        recentLessons = await strapi22.documents(noteUid).findMany({
          filters: {
            kind: { $eq: "lesson" },
            pinned: { $ne: true }
          },
          limit: remainingLessonSlots,
          sort: ["updatedAt:desc"]
        });
      }
      const lessons = [...pinnedLessons, ...recentLessons].map((l) => stripNullish({
        documentId: l.documentId,
        title: l.title,
        summary: l.summary,
        lesson: typeof l.body === "string" ? l.body.substring(0, 200) : void 0,
        pinned: l.pinned
      }));
      const openRetros = await strapi22.documents(retroUid).findMany({
        filters: {
          state: { $eq: "open" }
        },
        limit: 20,
        sort: ["date:desc"]
      });
      const retros = openRetros.map((r) => stripNullish({
        documentId: r.documentId,
        title: r.title,
        date: r.date,
        task: r.task,
        failure: r.failure
      }));
      const openGaps = await strapi22.documents(gapUid).findMany({
        filters: {
          state: { $eq: "open" }
        },
        limit: 20,
        sort: ["count:desc", "date:desc"]
      });
      const gaps = openGaps.map((g) => stripNullish({
        documentId: g.documentId,
        title: g.title,
        count: g.count,
        request: g.request,
        whatWasNeeded: g.whatWasNeeded
      }));
      const todayPST = getTodayPST();
      const todos = await strapi22.documents(todoUid).findMany({
        filters: {
          state: { $in: ["inbox", "next", "doing", "waiting"] }
        },
        limit: 100,
        sort: ["priority:asc", "dueDate:asc"]
      });
      const urgentTodos = todos.filter((t) => {
        if (t.priority === "P0" || t.priority === "P1") return true;
        if (t.dueDate) {
          return t.dueDate < todayPST;
        }
        return false;
      }).slice(0, todoLimit).map((t) => stripNullish({
        documentId: t.documentId,
        title: t.title,
        priority: t.priority,
        status: t.state,
        // Map state to status for external API
        dueDate: t.dueDate
      }));
      const ninetyDaysAgoStr = getDaysAgoPST(90);
      const capabilities = await strapi22.documents(capabilityUid).findMany({
        filters: {
          canDo: { $eq: false },
          verifiedAt: { $gte: ninetyDaysAgoStr }
        },
        limit: 10,
        sort: ["verifiedAt:desc"]
      });
      const cannotCapabilities = capabilities.map((c) => stripNullish({
        documentId: c.documentId,
        system: c.system,
        capability: c.capability,
        verifiedAt: c.verifiedAt,
        notes: c.notes
      }));
      const output = stripNullish({
        lessons,
        openRetros: retros,
        openGaps: gaps,
        urgentTodos,
        recentCannotCapabilities: cannotCapabilities,
        summary: {
          lessonsCount: lessons.length,
          openRetrosCount: retros.length,
          openGapsCount: gaps.length,
          urgentTodosCount: urgentTodos.length,
          cannotCount: cannotCapabilities.length
        }
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const getBriefing = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$4
}, Symbol.toStringTag, { value: "Module" }));
const register$3 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "kb_stats",
    title: "Knowledge Base Statistics",
    description: "Get counts per paul-brain content type, notes by kind/tag, video notes vs transcripts in central yt-kb service, orphan count. See get_brain_guide for usage.",
    resolveInputSchema: () => object({}),
    resolveOutputSchema: () => object({
      contentTypeCounts: object({
        note: number(),
        person: number(),
        project: number(),
        decision: number(),
        source: number(),
        retro: number(),
        gap: number(),
        capability: number(),
        rule: number(),
        todo: number(),
        goal: number(),
        goalCheckin: number()
      }),
      notesByKind: record(number()),
      notesByTag: record(number()),
      videoNotes: object({
        notesWithVideoId: number(),
        notesLinkedToSources: number(),
        videoSourcesWithNotes: number(),
        totalVideoSources: number()
      }),
      transcripts: object({
        total: number(),
        withoutNotes: array(object({
          videoId: string(),
          title: string().nullish()
        })).optional()
      }),
      orphans: object({
        notesWithoutLinks: number(),
        peopleWithoutNotes: number(),
        projectsWithoutNotes: number(),
        sourcesWithoutNotes: number()
      })
    }),
    auth: {
      policies: [{ action: getActionId("stats.read") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const contentTypeCounts = {
        note: 0,
        person: 0,
        project: 0,
        decision: 0,
        source: 0,
        retro: 0,
        gap: 0,
        capability: 0,
        rule: 0,
        todo: 0,
        goal: 0,
        goalCheckin: 0
      };
      const contentTypes2 = [
        "note",
        "person",
        "project",
        "decision",
        "source",
        "retro",
        "gap",
        "capability",
        "rule",
        "todo",
        "goal",
        "goal-checkin"
      ];
      for (const type of contentTypes2) {
        try {
          const uid = getUid(type);
          const items = await strapi22.documents(uid).findMany({
            limit: -1
          });
          const key = type === "goal-checkin" ? "goalCheckin" : type;
          contentTypeCounts[key] = items.length;
        } catch (err) {
          strapi22.log.warn(`Failed to count ${type}:`, err);
        }
      }
      const notesByKind = {};
      const notesByTag = {};
      let notesWithVideoId = 0;
      let notesWithoutLinks = 0;
      try {
        const notes = await strapi22.documents(getUid("note")).findMany({
          limit: -1,
          populate: ["people", "projects", "sources", "decisions"]
        });
        for (const note2 of notes) {
          if (note2.kind) {
            notesByKind[note2.kind] = (notesByKind[note2.kind] || 0) + 1;
          }
          if (Array.isArray(note2.tags)) {
            for (const tag of note2.tags) {
              notesByTag[tag] = (notesByTag[tag] || 0) + 1;
            }
          }
          if (note2.videoId) {
            notesWithVideoId++;
          }
          const hasLinks = Array.isArray(note2.people) && note2.people.length > 0 || Array.isArray(note2.projects) && note2.projects.length > 0 || Array.isArray(note2.sources) && note2.sources.length > 0 || Array.isArray(note2.decisions) && note2.decisions.length > 0;
          if (!hasLinks) {
            notesWithoutLinks++;
          }
        }
      } catch (err) {
        strapi22.log.warn("Failed to analyze notes:", err);
      }
      let notesLinkedToSources = 0;
      let videoSourcesWithNotes = 0;
      let totalVideoSources = 0;
      try {
        const sources = await strapi22.documents(getUid("source")).findMany({
          limit: -1,
          populate: ["notes"]
        });
        for (const source2 of sources) {
          if (source2.type === "video") {
            totalVideoSources++;
            if (Array.isArray(source2.notes) && source2.notes.length > 0) {
              videoSourcesWithNotes++;
            }
          }
          if (Array.isArray(source2.notes) && source2.notes.length > 0) {
            notesLinkedToSources += source2.notes.length;
          }
        }
      } catch (err) {
        strapi22.log.warn("Failed to analyze sources:", err);
      }
      let peopleWithoutNotes = 0;
      try {
        const people = await strapi22.documents(getUid("person")).findMany({
          limit: -1,
          populate: ["notes"]
        });
        peopleWithoutNotes = people.filter(
          (p) => !Array.isArray(p.notes) || p.notes.length === 0
        ).length;
      } catch (err) {
        strapi22.log.warn("Failed to analyze people:", err);
      }
      let projectsWithoutNotes = 0;
      try {
        const projects = await strapi22.documents(getUid("project")).findMany({
          limit: -1,
          populate: ["notes"]
        });
        projectsWithoutNotes = projects.filter(
          (p) => !Array.isArray(p.notes) || p.notes.length === 0
        ).length;
      } catch (err) {
        strapi22.log.warn("Failed to analyze projects:", err);
      }
      let sourcesWithoutNotes = 0;
      try {
        const sources = await strapi22.documents(getUid("source")).findMany({
          limit: -1,
          populate: ["notes"]
        });
        sourcesWithoutNotes = sources.filter(
          (s) => !Array.isArray(s.notes) || s.notes.length === 0
        ).length;
      } catch (err) {
        strapi22.log.warn("Failed to analyze sources:", err);
      }
      let transcriptsTotal = 0;
      const transcriptsWithoutNotes = [];
      const ytKbApiUrl = process.env.YT_KB_API_URL || "https://deserving-harmony-9f5ca04daf.strapiapp.com/api/yt-kb";
      const ytKbApiToken = process.env.YT_KB_API_TOKEN;
      if (ytKbApiToken) {
        try {
          let page = 1;
          let hasMore = true;
          const allTranscripts = [];
          while (hasMore) {
            const response = await fetch(`${ytKbApiUrl}/transcripts?pagination[page]=${page}&pagination[pageSize]=100`, {
              headers: {
                Authorization: `Bearer ${ytKbApiToken}`
              }
            });
            if (!response.ok) {
              strapi22.log.warn(`yt-kb API returned ${response.status}: ${response.statusText}`);
              break;
            }
            const data = await response.json();
            const transcripts = data.data || [];
            for (const t of transcripts) {
              if (t.youtubeVideoId) {
                allTranscripts.push({
                  youtubeVideoId: t.youtubeVideoId,
                  title: t.title
                });
              }
            }
            hasMore = transcripts.length === 100;
            page++;
          }
          transcriptsTotal = allTranscripts.length;
          const notes = await strapi22.documents(getUid("note")).findMany({
            limit: -1,
            filters: {
              videoId: { $notNull: true }
            }
          });
          const notedVideoIds = new Set(notes.map((n) => n.videoId));
          for (const transcript of allTranscripts) {
            if (!notedVideoIds.has(transcript.youtubeVideoId)) {
              transcriptsWithoutNotes.push({
                videoId: transcript.youtubeVideoId,
                title: transcript.title
              });
            }
          }
        } catch (err) {
          strapi22.log.warn("Failed to fetch transcripts from yt-kb API:", err);
        }
      }
      const output = stripNullish({
        contentTypeCounts,
        notesByKind,
        notesByTag,
        videoNotes: {
          notesWithVideoId,
          notesLinkedToSources,
          videoSourcesWithNotes,
          totalVideoSources
        },
        transcripts: ytKbApiToken ? {
          total: transcriptsTotal,
          withoutNotes: transcriptsWithoutNotes.length > 0 ? transcriptsWithoutNotes : void 0
        } : {
          message: "yt-kb not configured (set YT_KB_API_TOKEN env var)"
        },
        orphans: {
          notesWithoutLinks,
          peopleWithoutNotes,
          projectsWithoutNotes,
          sourcesWithoutNotes
        }
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const kbStats = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$3
}, Symbol.toStringTag, { value: "Module" }));
const register$2 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "upsert_source",
    title: "Upsert Source",
    description: "Create or update a source. Matches by slug (from title), videoId, or url. Updates matched source or creates new. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      title: string().describe("Source title (used to generate slug)"),
      type: _enum(["video", "article", "email", "transcript", "chat", "repo", "other"]).optional().describe("Source type"),
      url: string().optional().describe("Source URL"),
      videoId: string().optional().describe("YouTube video ID"),
      external_id: string().optional().describe("External ID (e.g., video ID, article ID)"),
      excerpt: string().optional().describe("Excerpt or description"),
      captured_on: string().optional().describe("Date captured (ISO format)")
    }),
    resolveOutputSchema: () => object({
      created: boolean(),
      documentId: string(),
      slug: string(),
      message: string()
    }),
    auth: {
      policies: [{ action: getActionId("entity.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("source");
      const slug = brainService.slugify(args.title);
      let existing = await brainService.findBySlugOrAlias("source", slug);
      if (!existing.exists && args.videoId) {
        const sources = await strapi22.documents(uid).findMany({
          filters: { videoId: { $eq: args.videoId } },
          limit: 1
        });
        if (sources.length > 0) {
          existing = { exists: true, documentId: sources[0].documentId, entity: sources[0] };
        }
      }
      if (!existing.exists && args.url) {
        const sources = await strapi22.documents(uid).findMany({
          filters: { url: { $eq: args.url } },
          limit: 1
        });
        if (sources.length > 0) {
          existing = { exists: true, documentId: sources[0].documentId, entity: sources[0] };
        }
      }
      let result;
      let created = false;
      let message = "";
      if (existing.exists) {
        const updates = {
          title: args.title
        };
        if (args.type) updates.type = args.type;
        if (args.url) updates.url = args.url;
        if (args.videoId) updates.videoId = args.videoId;
        if (args.external_id) updates.external_id = args.external_id;
        if (args.excerpt) updates.excerpt = args.excerpt;
        if (args.captured_on) updates.captured_on = args.captured_on;
        result = await strapi22.documents(uid).update({
          documentId: existing.documentId,
          data: updates
        });
        message = "Updated existing source";
      } else {
        result = await strapi22.documents(uid).create({
          data: {
            title: args.title,
            slug,
            type: args.type || "other",
            url: args.url,
            videoId: args.videoId,
            external_id: args.external_id,
            excerpt: args.excerpt,
            captured_on: args.captured_on
          }
        });
        created = true;
        message = "Created new source";
      }
      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug,
        message
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const upsertSource = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$2
}, Symbol.toStringTag, { value: "Module" }));
const register$1 = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "update_source",
    title: "Update Source",
    description: "Update an existing source by documentId or slug. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      source: string().describe("Source documentId or slug"),
      title: string().optional().describe("New title"),
      type: _enum(["video", "article", "email", "transcript", "chat", "repo", "other"]).optional().describe("Source type"),
      url: string().optional().describe("Source URL"),
      videoId: string().optional().describe("YouTube video ID"),
      external_id: string().optional().describe("External ID"),
      excerpt: string().optional().describe("Excerpt or description"),
      captured_on: string().optional().describe("Date captured (ISO format)")
    }),
    resolveOutputSchema: () => object({
      updated: boolean(),
      documentId: string(),
      message: string()
    }),
    auth: {
      policies: [{ action: getActionId("entity.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("source");
      const sourceDocId = await brainService.resolveEntityBySlug("source", args.source);
      if (!sourceDocId) {
        throw new Error(`Source not found: ${args.source}`);
      }
      const updates = {};
      if (args.title !== void 0) updates.title = args.title;
      if (args.type !== void 0) updates.type = args.type;
      if (args.url !== void 0) updates.url = args.url;
      if (args.videoId !== void 0) updates.videoId = args.videoId;
      if (args.external_id !== void 0) updates.external_id = args.external_id;
      if (args.excerpt !== void 0) updates.excerpt = args.excerpt;
      if (args.captured_on !== void 0) updates.captured_on = args.captured_on;
      if (Object.keys(updates).length === 0) {
        throw new Error("No fields to update");
      }
      const result = await strapi22.documents(uid).update({
        documentId: sourceDocId,
        data: updates
      });
      const output = stripNullish({
        updated: true,
        documentId: result.documentId,
        message: "Source updated successfully"
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const updateSource = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register: register$1
}, Symbol.toStringTag, { value: "Module" }));
const register = (strapi2) => {
  strapi2.ai.mcp.registerTool({
    name: "upsert_person",
    title: "Upsert Person",
    description: "Create or update a person. Matches by slug (from name) or alias. Updates matched person or creates new. See get_brain_guide for usage.",
    resolveInputSchema: () => object({
      name: string().describe("Person name (used to generate slug)"),
      role: string().optional().describe("Role or title"),
      org: string().optional().describe("Organization"),
      email: string().email().optional().describe("Email address"),
      handles: record(string()).optional().describe('Social handles (e.g., {github: "username", x: "username"})'),
      notes_md: string().optional().describe("Rich text notes about this person"),
      last_contact: string().optional().describe("Last contact date (ISO format)")
    }),
    resolveOutputSchema: () => object({
      created: boolean(),
      documentId: string(),
      slug: string(),
      message: string()
    }),
    auth: {
      policies: [{ action: getActionId("entity.write") }]
    },
    createHandler: (strapi22) => async ({ args, context }) => {
      const brainService = strapi22.plugin(PLUGIN_NAME$1).service("brain");
      const uid = getUid("person");
      const slug = brainService.slugify(args.name);
      const existing = await brainService.findBySlugOrAlias("person", slug);
      let result;
      let created = false;
      let message = "";
      if (existing.exists) {
        const updates = {
          name: args.name
        };
        if (args.role !== void 0) updates.role = args.role;
        if (args.org !== void 0) updates.org = args.org;
        if (args.email !== void 0) updates.email = args.email;
        if (args.handles !== void 0) updates.handles = args.handles;
        if (args.notes_md !== void 0) updates.notes_md = args.notes_md;
        if (args.last_contact !== void 0) updates.last_contact = args.last_contact;
        result = await strapi22.documents(uid).update({
          documentId: existing.documentId,
          data: updates
        });
        message = "Updated existing person";
      } else {
        result = await strapi22.documents(uid).create({
          data: {
            name: args.name,
            slug,
            role: args.role,
            org: args.org,
            email: args.email,
            handles: args.handles || {},
            notes_md: args.notes_md,
            last_contact: args.last_contact
          }
        });
        created = true;
        message = "Created new person";
      }
      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug,
        message
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output
      };
    }
  });
};
const upsertPerson = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  register
}, Symbol.toStringTag, { value: "Module" }));
const tools = [
  getBrainGuide,
  kbStats,
  recall,
  getEntity,
  listRecent,
  remember,
  updateNote,
  upsertPerson,
  upsertSource,
  updateSource,
  link,
  logDecision,
  forget,
  logRetro,
  listRetros,
  updateRetro,
  logGap,
  listGaps,
  updateGap,
  recordCapability,
  listCapabilities,
  addRule,
  listRules,
  addTodo,
  updateTodo,
  listTodos,
  getTodo,
  completeTodo,
  addGoal,
  listGoals,
  logCheckin,
  getGoalProgress,
  updateGoal,
  healthCheck,
  getBriefing
];
const registerMcpTools = (strapi2) => {
  if (!strapi2.ai?.mcp?.isEnabled()) {
    strapi2.log.info("[paul-brain] MCP is not enabled, skipping tool registration");
    return;
  }
  strapi2.log.info("[paul-brain] Registering MCP tools...");
  for (const tool of tools) {
    try {
      tool.register(strapi2);
      strapi2.log.debug(`[paul-brain] Registered tool: ${tool.register.name}`);
    } catch (err) {
      strapi2.log.error(`[paul-brain] Failed to register tool:`, err);
    }
  }
  strapi2.log.info(`[paul-brain] Registered ${tools.length} MCP tools`);
};
const bootstrap = async ({ strapi: strapi2 }) => {
  registerMcpTools(strapi2);
  strapi2.log.info("[paul-brain] Bootstrap complete");
};
const kind$b = "collectionType";
const collectionName$b = "paul_brain_notes";
const info$b = {
  singularName: "note",
  pluralName: "notes",
  displayName: "Note",
  description: "Brain notes: facts, preferences, ideas, todos, logs, and references"
};
const options$b = {
  draftAndPublish: false
};
const pluginOptions$b = {};
const attributes$b = {
  title: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "title"
  },
  aliases: {
    type: "json",
    "default": []
  },
  body: {
    type: "richtext"
  },
  summary: {
    type: "text",
    maxLength: 280
  },
  kind: {
    type: "enumeration",
    "enum": [
      "fact",
      "preference",
      "idea",
      "todo",
      "log",
      "reference",
      "lesson",
      "video",
      "taught"
    ],
    "default": "fact"
  },
  videoId: {
    type: "string"
  },
  verifiedAt: {
    type: "date"
  },
  howToRecheck: {
    type: "text"
  },
  durability: {
    type: "enumeration",
    "enum": [
      "durable",
      "temporary"
    ]
  },
  tags: {
    type: "json",
    "default": []
  },
  confidence: {
    type: "enumeration",
    "enum": [
      "low",
      "medium",
      "high"
    ],
    "default": "medium"
  },
  source_bot: {
    type: "string"
  },
  pinned: {
    type: "boolean",
    "default": false
  },
  expires_on: {
    type: "date"
  },
  people: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.person",
    inversedBy: "notes"
  },
  projects: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.project",
    inversedBy: "notes"
  },
  sources: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.source",
    inversedBy: "notes"
  },
  decisions: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.decision",
    inversedBy: "notes"
  },
  relatedTodos: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.todo",
    mappedBy: "relatedNotes"
  },
  supersededBy: {
    type: "relation",
    relation: "oneToOne",
    target: "plugin::paul-brain.note"
  }
};
const schema$b = {
  kind: kind$b,
  collectionName: collectionName$b,
  info: info$b,
  options: options$b,
  pluginOptions: pluginOptions$b,
  attributes: attributes$b
};
const note = { schema: schema$b };
const kind$a = "collectionType";
const collectionName$a = "paul_brain_people";
const info$a = {
  singularName: "person",
  pluralName: "people",
  displayName: "Person",
  description: "People in Paul's network"
};
const options$a = {
  draftAndPublish: false
};
const pluginOptions$a = {};
const attributes$a = {
  name: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "name"
  },
  aliases: {
    type: "json",
    "default": []
  },
  role: {
    type: "string"
  },
  org: {
    type: "string"
  },
  email: {
    type: "email"
  },
  handles: {
    type: "json",
    "default": {}
  },
  notes_md: {
    type: "richtext"
  },
  last_contact: {
    type: "date"
  },
  notes: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.note",
    mappedBy: "people"
  },
  projects: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.project",
    inversedBy: "people"
  },
  decisions: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.decision",
    inversedBy: "people"
  }
};
const schema$a = {
  kind: kind$a,
  collectionName: collectionName$a,
  info: info$a,
  options: options$a,
  pluginOptions: pluginOptions$a,
  attributes: attributes$a
};
const person = { schema: schema$a };
const kind$9 = "collectionType";
const collectionName$9 = "paul_brain_projects";
const info$9 = {
  singularName: "project",
  pluralName: "projects",
  displayName: "Project",
  description: "Paul's projects and initiatives"
};
const options$9 = {
  draftAndPublish: false
};
const pluginOptions$9 = {};
const attributes$9 = {
  name: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "name"
  },
  aliases: {
    type: "json",
    "default": []
  },
  state: {
    type: "enumeration",
    "enum": [
      "idea",
      "active",
      "paused",
      "done"
    ],
    "default": "idea"
  },
  repo_url: {
    type: "string"
  },
  url: {
    type: "string"
  },
  summary: {
    type: "text"
  },
  goals: {
    type: "richtext"
  },
  started: {
    type: "date"
  },
  ended: {
    type: "date"
  },
  notes: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.note",
    mappedBy: "projects"
  },
  people: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.person",
    mappedBy: "projects"
  },
  decisions: {
    type: "relation",
    relation: "oneToMany",
    target: "plugin::paul-brain.decision",
    mappedBy: "project"
  },
  retros: {
    type: "relation",
    relation: "oneToMany",
    target: "plugin::paul-brain.retro",
    mappedBy: "project"
  },
  todos: {
    type: "relation",
    relation: "oneToMany",
    target: "plugin::paul-brain.todo",
    mappedBy: "project"
  }
};
const schema$9 = {
  kind: kind$9,
  collectionName: collectionName$9,
  info: info$9,
  options: options$9,
  pluginOptions: pluginOptions$9,
  attributes: attributes$9
};
const project = { schema: schema$9 };
const kind$8 = "collectionType";
const collectionName$8 = "paul_brain_decisions";
const info$8 = {
  singularName: "decision",
  pluralName: "decisions",
  displayName: "Decision",
  description: "Architecture decisions and key choices"
};
const options$8 = {
  draftAndPublish: false
};
const pluginOptions$8 = {};
const attributes$8 = {
  title: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "title"
  },
  aliases: {
    type: "json",
    "default": []
  },
  context: {
    type: "richtext"
  },
  decision: {
    type: "richtext"
  },
  rationale: {
    type: "richtext"
  },
  state: {
    type: "enumeration",
    "enum": [
      "proposed",
      "accepted",
      "superseded"
    ],
    "default": "proposed"
  },
  decided_on: {
    type: "date"
  },
  supersedes: {
    type: "relation",
    relation: "oneToOne",
    target: "plugin::paul-brain.decision"
  },
  project: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::paul-brain.project",
    inversedBy: "decisions"
  },
  people: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.person",
    mappedBy: "decisions"
  },
  notes: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.note",
    mappedBy: "decisions"
  }
};
const schema$8 = {
  kind: kind$8,
  collectionName: collectionName$8,
  info: info$8,
  options: options$8,
  pluginOptions: pluginOptions$8,
  attributes: attributes$8
};
const decision = { schema: schema$8 };
const kind$7 = "collectionType";
const collectionName$7 = "paul_brain_sources";
const info$7 = {
  singularName: "source",
  pluralName: "sources",
  displayName: "Source",
  description: "External sources: videos, articles, transcripts, chats"
};
const options$7 = {
  draftAndPublish: false
};
const pluginOptions$7 = {};
const attributes$7 = {
  title: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "title"
  },
  aliases: {
    type: "json",
    "default": []
  },
  type: {
    type: "enumeration",
    "enum": [
      "video",
      "article",
      "email",
      "transcript",
      "chat",
      "repo",
      "other"
    ],
    "default": "other"
  },
  url: {
    type: "string"
  },
  videoId: {
    type: "string"
  },
  external_id: {
    type: "string"
  },
  captured_on: {
    type: "date"
  },
  excerpt: {
    type: "text"
  },
  notes: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.note",
    mappedBy: "sources"
  }
};
const schema$7 = {
  kind: kind$7,
  collectionName: collectionName$7,
  info: info$7,
  options: options$7,
  pluginOptions: pluginOptions$7,
  attributes: attributes$7
};
const source = { schema: schema$7 };
const kind$6 = "collectionType";
const collectionName$6 = "paul_brain_retros";
const info$6 = {
  singularName: "retro",
  pluralName: "retros",
  displayName: "Retro",
  description: "Failure on real work + fix"
};
const options$6 = {
  draftAndPublish: false
};
const pluginOptions$6 = {};
const attributes$6 = {
  title: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "title"
  },
  date: {
    type: "date"
  },
  task: {
    type: "text"
  },
  failure: {
    type: "text"
  },
  fix: {
    type: "text"
  },
  fixLocation: {
    type: "string"
  },
  state: {
    type: "enumeration",
    "enum": [
      "open",
      "fixed",
      "declined",
      "wontfix"
    ],
    "default": "open"
  },
  project: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::paul-brain.project",
    inversedBy: "retros"
  }
};
const schema$6 = {
  kind: kind$6,
  collectionName: collectionName$6,
  info: info$6,
  options: options$6,
  pluginOptions: pluginOptions$6,
  attributes: attributes$6
};
const retro = { schema: schema$6 };
const kind$5 = "collectionType";
const collectionName$5 = "paul_brain_gaps";
const info$5 = {
  singularName: "gap",
  pluralName: "gaps",
  displayName: "Gap",
  description: "Request nothing handled well"
};
const options$5 = {
  draftAndPublish: false
};
const pluginOptions$5 = {};
const attributes$5 = {
  title: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "title"
  },
  date: {
    type: "date"
  },
  request: {
    type: "text"
  },
  whatWasNeeded: {
    type: "text"
  },
  count: {
    type: "integer",
    "default": 1
  },
  state: {
    type: "enumeration",
    "enum": [
      "open",
      "built",
      "wontfix"
    ],
    "default": "open"
  },
  firstSeen: {
    type: "date"
  },
  seenDates: {
    type: "json",
    "default": []
  }
};
const schema$5 = {
  kind: kind$5,
  collectionName: collectionName$5,
  info: info$5,
  options: options$5,
  pluginOptions: pluginOptions$5,
  attributes: attributes$5
};
const gap = { schema: schema$5 };
const kind$4 = "collectionType";
const collectionName$4 = "paul_brain_capabilities";
const info$4 = {
  singularName: "capability",
  pluralName: "capabilities",
  displayName: "Capability",
  description: "What a system can and CANNOT do, probed and dated"
};
const options$4 = {
  draftAndPublish: false
};
const pluginOptions$4 = {};
const attributes$4 = {
  system: {
    type: "string",
    required: true
  },
  capability: {
    type: "text",
    required: true
  },
  canDo: {
    type: "boolean",
    required: true
  },
  verifiedAt: {
    type: "date"
  },
  howVerified: {
    type: "text"
  },
  notes: {
    type: "text"
  }
};
const schema$4 = {
  kind: kind$4,
  collectionName: collectionName$4,
  info: info$4,
  options: options$4,
  pluginOptions: pluginOptions$4,
  attributes: attributes$4
};
const capability = { schema: schema$4 };
const kind$3 = "collectionType";
const collectionName$3 = "paul_brain_rules";
const info$3 = {
  singularName: "rule",
  pluralName: "rules",
  displayName: "Rule",
  description: "Deterministic routing/handling rules editable in admin"
};
const options$3 = {
  draftAndPublish: false
};
const pluginOptions$3 = {};
const attributes$3 = {
  name: {
    type: "string",
    required: true
  },
  match: {
    type: "text",
    required: true
  },
  action: {
    type: "text",
    required: true
  },
  priority: {
    type: "integer",
    "default": 0
  },
  enabled: {
    type: "boolean",
    "default": true
  }
};
const schema$3 = {
  kind: kind$3,
  collectionName: collectionName$3,
  info: info$3,
  options: options$3,
  pluginOptions: pluginOptions$3,
  attributes: attributes$3
};
const rule = { schema: schema$3 };
const kind$2 = "collectionType";
const collectionName$2 = "paul_brain_todos";
const info$2 = {
  singularName: "todo",
  pluralName: "todos",
  displayName: "Todo",
  description: "Task management for Paul's work"
};
const options$2 = {
  draftAndPublish: false
};
const pluginOptions$2 = {};
const attributes$2 = {
  title: {
    type: "string",
    required: true
  },
  state: {
    type: "enumeration",
    "enum": [
      "inbox",
      "next",
      "doing",
      "waiting",
      "done",
      "dropped",
      "superseded"
    ],
    "default": "inbox"
  },
  priority: {
    type: "enumeration",
    "enum": [
      "P0",
      "P1",
      "P2",
      "P3"
    ],
    "default": "P2"
  },
  dueDate: {
    type: "date"
  },
  doDate: {
    type: "date"
  },
  goal: {
    type: "text"
  },
  acceptanceCriteria: {
    type: "text"
  },
  context: {
    type: "richtext"
  },
  links: {
    type: "json",
    "default": []
  },
  relatedNotes: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::paul-brain.note",
    inversedBy: "relatedTodos"
  },
  project: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::paul-brain.project",
    inversedBy: "todos"
  },
  waitingOn: {
    type: "string"
  },
  log: {
    type: "json",
    "default": []
  },
  source: {
    type: "enumeration",
    "enum": [
      "paul",
      "email",
      "meeting",
      "bot",
      "other"
    ],
    "default": "other"
  },
  capturedBy: {
    type: "string"
  },
  completedAt: {
    type: "datetime"
  },
  closingNote: {
    type: "text"
  },
  supersededBy: {
    type: "relation",
    relation: "oneToOne",
    target: "plugin::paul-brain.todo"
  }
};
const schema$2 = {
  kind: kind$2,
  collectionName: collectionName$2,
  info: info$2,
  options: options$2,
  pluginOptions: pluginOptions$2,
  attributes: attributes$2
};
const todo = { schema: schema$2 };
const kind$1 = "collectionType";
const collectionName$1 = "paul_brain_goals";
const info$1 = {
  singularName: "goal",
  pluralName: "goals",
  displayName: "Goal",
  description: "Goals with daily check-ins and streak tracking"
};
const options$1 = {
  draftAndPublish: false
};
const pluginOptions$1 = {};
const attributes$1 = {
  title: {
    type: "string",
    required: true
  },
  description: {
    type: "text"
  },
  category: {
    type: "enumeration",
    "enum": [
      "health",
      "fitness",
      "work",
      "learning",
      "personal",
      "other"
    ]
  },
  cadence: {
    type: "enumeration",
    "enum": [
      "daily",
      "weekly"
    ],
    "default": "daily"
  },
  target: {
    type: "string"
  },
  state: {
    type: "enumeration",
    "enum": [
      "active",
      "paused",
      "done",
      "dropped"
    ],
    "default": "active"
  },
  startDate: {
    type: "date"
  },
  currentStreak: {
    type: "integer",
    "default": 0
  },
  bestStreak: {
    type: "integer",
    "default": 0
  },
  lastCheckinDate: {
    type: "date"
  },
  checkins: {
    type: "relation",
    relation: "oneToMany",
    target: "plugin::paul-brain.goal-checkin",
    mappedBy: "goal"
  }
};
const schema$1 = {
  kind: kind$1,
  collectionName: collectionName$1,
  info: info$1,
  options: options$1,
  pluginOptions: pluginOptions$1,
  attributes: attributes$1
};
const goal = { schema: schema$1 };
const kind = "collectionType";
const collectionName = "paul_brain_goal_checkins";
const info = {
  singularName: "goal-checkin",
  pluralName: "goal-checkins",
  displayName: "Goal Checkin",
  description: "Daily or weekly check-ins for goals"
};
const options = {
  draftAndPublish: false
};
const pluginOptions = {};
const attributes = {
  goal: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::paul-brain.goal",
    inversedBy: "checkins"
  },
  date: {
    type: "date",
    required: true
  },
  met: {
    type: "boolean",
    required: true
  },
  note: {
    type: "text"
  },
  loggedBy: {
    type: "string"
  }
};
const schema = {
  kind,
  collectionName,
  info,
  options,
  pluginOptions,
  attributes
};
const goalCheckin = { schema };
const contentTypes = {
  note,
  person,
  project,
  decision,
  source,
  retro,
  gap,
  capability,
  rule,
  todo,
  goal,
  "goal-checkin": goalCheckin
};
const PLUGIN_NAME = "paul-brain";
const brain = ({ strapi: strapi2 }) => ({
  slugify(text) {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  },
  async findBySlugOrAlias(type, slug) {
    const uid = `plugin::${PLUGIN_NAME}.${type}`;
    const exactMatch = await strapi2.documents(uid).findMany({
      filters: { slug: { $eq: slug } },
      limit: 1
    });
    if (exactMatch.length > 0) {
      return {
        exists: true,
        documentId: exactMatch[0].documentId,
        entity: exactMatch[0]
      };
    }
    const candidates = await strapi2.documents(uid).findMany({
      filters: { aliases: { $notNull: true } },
      limit: 100
    });
    const slugLower = slug.toLowerCase();
    for (const entity of candidates) {
      const aliases2 = Array.isArray(entity.aliases) ? entity.aliases : [];
      if (aliases2.some((alias) => alias.toLowerCase() === slugLower)) {
        return {
          exists: true,
          documentId: entity.documentId,
          entity
        };
      }
    }
    return { exists: false };
  },
  async mergeNote(documentId, data) {
    const uid = `plugin::${PLUGIN_NAME}.note`;
    const existing = await strapi2.documents(uid).findOne({ documentId });
    if (!existing) {
      throw new Error(`Note ${documentId} not found`);
    }
    const updates = { ...data };
    if (data.body && existing.body) {
      updates.body = `${existing.body}

---

${data.body}`;
    }
    if (data.tags && Array.isArray(data.tags)) {
      const existingTags = Array.isArray(existing.tags) ? existing.tags : [];
      updates.tags = [.../* @__PURE__ */ new Set([...existingTags, ...data.tags])];
    }
    return strapi2.documents(uid).update({ documentId, data: updates });
  },
  async search(options2) {
    const { query, types = ["note", "person", "project", "decision", "source"], kind: kind2, tag, videoId, sourceId, since, limit = 25 } = options2;
    const results = [];
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter((k) => k.length > 2);
    for (const type of types) {
      const uid = `plugin::${PLUGIN_NAME}.${type}`;
      try {
        const filters2 = {};
        if (since) {
          filters2.updatedAt = { $gte: since };
        }
        if (type === "note" && kind2) {
          filters2.kind = { $eq: kind2 };
        }
        if (type === "note" && videoId) {
          filters2.videoId = { $eq: videoId };
        }
        const populate2 = type === "note" ? ["sources", "people"] : void 0;
        const entities = await strapi2.documents(uid).findMany({
          filters: filters2,
          populate: populate2,
          limit: 100
        });
        for (const entity of entities) {
          if (tag && type === "note") {
            const entityTags2 = Array.isArray(entity.tags) ? entity.tags : [];
            const hasMatchingTag = entityTags2.some(
              (t) => t.toLowerCase() === tag.toLowerCase()
            );
            if (!hasMatchingTag) {
              continue;
            }
          }
          if (sourceId && type === "note") {
            const sources = Array.isArray(entity.sources) ? entity.sources : [];
            const hasMatchingSource = sources.some(
              (s) => s.documentId === sourceId
            );
            if (!hasMatchingSource) {
              continue;
            }
          }
          let score = 0;
          let snippet = "";
          const title = entity.title || entity.name || "";
          const titleLower = title.toLowerCase();
          const body = entity.body || entity.summary || entity.context || entity.excerpt || "";
          const bodyText = typeof body === "string" ? body : JSON.stringify(body);
          const bodyLower = bodyText.toLowerCase();
          const aliases2 = Array.isArray(entity.aliases) ? entity.aliases : [];
          const entityTags = Array.isArray(entity.tags) ? entity.tags : [];
          for (const keyword of keywords) {
            if (titleLower.includes(keyword)) score += 3;
            if (aliases2.some((a) => a.toLowerCase().includes(keyword))) score += 2;
            if (entityTags.some((t) => t.toLowerCase().includes(keyword))) score += 2;
            if (bodyLower.includes(keyword)) score += 1;
          }
          if (titleLower.includes(queryLower)) score += 5;
          const now = /* @__PURE__ */ new Date();
          const updated = new Date(entity.updatedAt);
          const ageInDays = (now.getTime() - updated.getTime()) / (1e3 * 60 * 60 * 24);
          const recencyBoost = Math.max(0, 1 - ageInDays / 365);
          score += recencyBoost;
          if (entity.pinned === true && type === "note") {
            score += 2;
          }
          if (score > 0) {
            const snippetStart = bodyLower.indexOf(queryLower);
            if (snippetStart >= 0) {
              const start = Math.max(0, snippetStart - 50);
              const end = Math.min(bodyText.length, snippetStart + query.length + 100);
              snippet = (start > 0 ? "..." : "") + bodyText.substring(start, end) + (end < bodyText.length ? "..." : "");
            } else {
              snippet = bodyText.substring(0, 150) + (bodyText.length > 150 ? "..." : "");
            }
            const result = {
              type,
              documentId: entity.documentId,
              slug: entity.slug,
              title: entity.title,
              name: entity.name,
              snippet,
              score,
              updatedAt: entity.updatedAt
            };
            if (type === "note") {
              const sources = Array.isArray(entity.sources) ? entity.sources : [];
              const people = Array.isArray(entity.people) ? entity.people : [];
              if (sources.length > 0) {
                result.linkedSourceIds = sources.map((s) => s.documentId);
              }
              if (people.length > 0) {
                result.linkedPersonIds = people.map((p) => p.documentId);
              }
            }
            results.push(result);
          }
        }
      } catch (err) {
        strapi2.log.warn(`Search failed for type ${type}:`, err);
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, Math.min(limit, 25));
  },
  async linkEntities(noteDocumentId, relation, targetDocumentIds, operation) {
    const uid = `plugin::${PLUGIN_NAME}.note`;
    const data = {};
    data[relation] = operation === "connect" ? { connect: targetDocumentIds.map((id) => ({ documentId: id })) } : { disconnect: targetDocumentIds.map((id) => ({ documentId: id })) };
    return strapi2.documents(uid).update({
      documentId: noteDocumentId,
      data
    });
  },
  async resolveEntityBySlug(type, identifier) {
    const uid = `plugin::${PLUGIN_NAME}.${type}`;
    const entities = await strapi2.documents(uid).findMany({
      filters: {
        $or: [
          { slug: { $eq: identifier } },
          { documentId: { $eq: identifier } }
        ]
      },
      limit: 1
    });
    return entities.length > 0 ? entities[0].documentId : null;
  },
  normalizeTitle(title) {
    return title.toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
  },
  isSimilar(title1, title2) {
    const norm1 = this.normalizeTitle(title1);
    const norm2 = this.normalizeTitle(title2);
    if (norm1 === norm2) return true;
    const words1 = norm1.split(" ");
    const words2 = norm2.split(" ");
    const commonWords = words1.filter((w) => words2.includes(w) && w.length > 3);
    const similarity = 2 * commonWords.length / (words1.length + words2.length);
    return similarity > 0.7;
  },
  async findDuplicateTodos(title, dueDate, projectId) {
    const uid = `plugin::${PLUGIN_NAME}.todo`;
    const todos = await strapi2.documents(uid).findMany({
      filters: {
        state: { $notIn: ["done", "dropped", "superseded"] }
      },
      limit: 100
    });
    const candidates = [];
    for (const todo2 of todos) {
      if (this.isSimilar(title, todo2.title)) {
        const sameDueDate = dueDate && todo2.dueDate && dueDate === todo2.dueDate;
        const sameProject = projectId && todo2.project?.documentId === projectId;
        if (sameDueDate || sameProject || !dueDate) {
          candidates.push(todo2);
        }
      }
    }
    return candidates;
  },
  async findDuplicateNotes(title) {
    const uid = `plugin::${PLUGIN_NAME}.note`;
    const slug = this.slugify(title);
    const notes = await strapi2.documents(uid).findMany({
      limit: 100
    });
    const candidates = [];
    for (const note2 of notes) {
      if (note2.slug === slug || this.isSimilar(title, note2.title)) {
        candidates.push(note2);
      }
    }
    return candidates;
  }
});
const services = {
  brain
};
const index = {
  register: register$z,
  bootstrap,
  contentTypes,
  services
};
export {
  index as default
};
