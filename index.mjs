// This script create 3 sections: keywords-<A-Z>, handle-attributes-<A-Z> and abl-functions-<A-Z> . ABL keywords can only be in
// one of these sections. The "keywords" section contains statements that are not in the attributes or function sections
// kwlist.txt file can be generated with `prowin -zgenkwlist > abl-keywords.txt`
//
// methods.txt can be created by copying the 'Related Links' from https://docs.progress.com/bundle/abl-reference/page/Handle-Attributes-and-Methods-Reference.html//
// It will look something like:
//    ACCELERATOR attribute
//    ACCEPT-CHANGES( ) method
//    ACCEPT-ROW-CHANGES( ) method
//
// abl-functions.txt can be created by copying the 'Related Links' from https://docs.progress.com/bundle/abl-reference/page/ABL-Syntax-Reference.html
//

import * as fs from 'node:fs';
import * as readline from 'node:readline';
import {optimize} from 'oniguruma-parser/optimizer';

let lineReaderMethods = readline.createInterface({
  input: fs.createReadStream('abl-methods.txt')
});

let lineReaderFunctions = readline.createInterface({
  input: fs.createReadStream('abl-functions.txt')
});

let lineReaderKeywords = readline.createInterface({
  input: fs.createReadStream('abl-keywords.txt')
});

let output = 'grammar.json';
let result = {};
let attributeBlocks = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
let methodBlocks = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
let keywordBlocks = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
let functionBlocks = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
const re = /(?:\w|-|\()+(?=\s|$)/g

// The doc is not always accurate ...
// Add the full keyword to one of these arrays, and
// it and any abbreviated versions will be added to the
// appropriate scopes
let alsoStatements = [];
alsoStatements.push('ambiguous');
alsoStatements.push('auto-go');
alsoStatements.push('available');
alsoStatements.push('bgcolor');
alsoStatements.push('centered');
alsoStatements.push('column-label');
alsoStatements.push('context-help-id');
alsoStatements.push('dcolor');
alsoStatements.push('default-button');
alsoStatements.push('default');
alsoStatements.push('delete');
alsoStatements.push('delimiter');
alsoStatements.push('drop-target');
alsoStatements.push('edge-pixels');
alsoStatements.push('fgcolor');
alsoStatements.push('first');
alsoStatements.push('flat-button');
alsoStatements.push('font');
alsoStatements.push('foreign-key-hidden');
alsoStatements.push('format');
alsoStatements.push('graphic-edge');
alsoStatements.push('help');
alsoStatements.push('hidden');
alsoStatements.push('image-down');
alsoStatements.push('image-insensitive');
alsoStatements.push('image-up');
alsoStatements.push('initial');
alsoStatements.push('keep-frame-z-order');
alsoStatements.push('label');
alsoStatements.push('locked');
alsoStatements.push('max-button');
alsoStatements.push('message-area');
alsoStatements.push('mouse-pointer');
alsoStatements.push('namespace-prefix');
alsoStatements.push('namespace-uri');
alsoStatements.push('nested');
alsoStatements.push('no-focus');
alsoStatements.push('page-bottom');
alsoStatements.push('pfcolor');
alsoStatements.push('recursive');
alsoStatements.push('resize');
alsoStatements.push('return-value');
alsoStatements.push('row');
alsoStatements.push('scroll-bars');
alsoStatements.push('scrollable');
alsoStatements.push('sensitive');
alsoStatements.push('separators');
alsoStatements.push('serialize-hidden');
alsoStatements.push('serialize-name');
alsoStatements.push('show-in-taskbar');
alsoStatements.push('side-labels');
alsoStatements.push('single-run');
alsoStatements.push('status-area');
alsoStatements.push('three-d');
alsoStatements.push('title');
alsoStatements.push('tooltip');
alsoStatements.push('transaction');
alsoStatements.push('value');
alsoStatements.push('view-as');
alsoStatements.push('warning');
alsoStatements.push('widget-id');
alsoStatements.push('write');
alsoStatements.push('xml-data-type');
alsoStatements.push('xml-node-name');
alsoStatements.push('xml-node-type');

let functionsNotStatements = [];
functionsNotStatements.push('set-size');

let alsoFunctions = [];
alsoFunctions.push('lower');
alsoFunctions.push('os-dir');
alsoFunctions.push('relation-fields');
alsoFunctions.push('return');
alsoFunctions.push('skip');
alsoFunctions.push('space');
alsoFunctions.push('substitute');
alsoFunctions.push('this-object');
alsoFunctions.push('value');

let alsoKeywords = [];
alsoKeywords.push('get-collation'); //plural version as key

// The documentation does not reflect all abbreviations
let minKeywords = new Map();
minKeywords.set('log', 'logical');
minKeywords.set('&glob', '&global-define');
minKeywords.set('&scop', '&scoped-define');
minKeywords.set('glob', 'global');
minKeywords.set('var', 'variable');

// This may holds the keyword names and their regex entries
let keywordEntries = new Map();
keywordEntries.set('logical', 'logical|logica|logic|logi|log|lo');
keywordEntries.set('&global-define', '&global-define|&global-defin|&global-defi|&global-def|&global-de|&global-d|&global-|&global|&globa|&glob)');
keywordEntries.set('&scoped-define', '&scoped-define|&scoped-defin|&scoped-defi|&scoped-def|&scoped-de|&scoped-d|&scoped-|&scoped|&scope|&scop');
keywordEntries.set('global', 'global|globa|glob');
keywordEntries.set('variable', 'variable|variabl|variab|varia|vari|var');

lineReaderMethods.on('line', line => {
  let results;
  line = line.toLowerCase();

  if (!line.startsWith("#")) {
    let kw = line.split(' ');
    let charIdx = kw[0].charCodeAt(0) - 97;
    let keyWord = kw[0].split('(')[0];

    if (kw.includes('attribute')) {
      if (!attributeBlocks[charIdx].includes(keyWord)) {
        attributeBlocks[charIdx].push(keyWord);
      }
    } else if (kw.includes('method')) {
      if (!methodBlocks[charIdx].includes(keyWord)) {
        methodBlocks[charIdx].push(keyWord);
      }
    }

    if (alsoStatements.includes(keyWord)) {
      if (!keywordBlocks[charIdx].includes(keyWord)) {
        keywordBlocks[charIdx].push(keyWord);
      }
    }
    if (alsoFunctions.includes(keyWord)) {
      if (!functionBlocks[charIdx].includes(keyWord)) {
        functionBlocks[charIdx].push(keyWord);
      }
    }
  }
});

lineReaderFunctions.on('line', line => {
  let results;
  line = line.toLowerCase();

  if (!line.startsWith("#")) {

    let kw = line.split(' ');

    // This is to skip the FUNCTION statement
    if (kw.includes('function') && !kw.includes('statement')) {
      let kwName = kw[0];

      // CAPS letter alphabet
      let charIdx = kwName.charCodeAt(0) - 97;
      if (!functionBlocks[charIdx].includes(kwName)) {
        functionBlocks[charIdx].push(kwName);
      }

      if (alsoStatements.includes(kwName)) {
        if (!keywordBlocks[charIdx].includes(kwName)) {
          keywordBlocks[charIdx].push(kwName);
        }
      }
    } else if (kw.includes('statement')) {
      for (const keyWord of kw) {
        let charIdx = keyWord.charCodeAt(0) - 97;

        if (keyWord == "statement") { break; }

        if (keyWord.indexOf('(') !== -1) { continue; }

        let kw2 = keyWord.replace(",", "");

        if (charIdx > 0 && functionsNotStatements.includes(kw2)) {
          functionBlocks[charIdx].push(kw2);
        } else if (charIdx > 0 && !keywordBlocks[charIdx].includes(kw2)) {
          keywordBlocks[charIdx].push(kw2);
        }
      }
    }
  }
});

lineReaderKeywords.on('line', line => {
  let results;
  line = line.toLowerCase();
  if (!line.startsWith("#")) {
    while ((results = re.exec(line)) !== null) {
      let kw = results[0];
      // CAPS letter alphabet
      let charIdx = kw.charCodeAt(0) - 97;

      if (kw.indexOf('(') !== -1) {
        let kwParts = kw.split('(');
        let fullKw = kwParts[0] + kwParts[1];
        let kwRegex = '';
        for (let i = kwParts[1].length; i > 0; i--) {
          kwRegex += kwParts[0] + kwParts[1].substring(0, i) + '|';
        }
        kwRegex += kwParts[0];
        addToBlock(charIdx, fullKw, kwParts[0], kwRegex);
      } else {
        addToBlock(charIdx, kw, kw, kw);
      }
    }
  }
});
// Find an appropriate keyword regex
function getKwRegex(fullKw) {
  let kwRegex = keywordEntries.get(fullKw);

  if (kwRegex) {
    return kwRegex;
  }

  if (minKeywords.has(fullKw)) {
    return keywordEntries.get(minKeywords.get(fullKw));
  }

  if (alsoKeywords.includes(fullKw)) {
    return fullKw;
  }
}

// Adds the keyword regex to the relevant block
function addToBlock(charIdx, fullKw, minKw, kwRegex) {
  // We will use these to resolve the full keywords later
  if (!minKeywords.has(minKw)) {
    minKeywords.set(minKw, fullKw);
  }
  if  (!keywordEntries.has(fullKw)) {
    keywordEntries.set(fullKw, kwRegex);
  }

  if (!attributeBlocks[charIdx].includes(fullKw) &&
      !methodBlocks[charIdx].includes(fullKw) &&
      !functionBlocks[charIdx].includes(fullKw) &&
      !keywordBlocks[charIdx].includes(fullKw)) {
    keywordBlocks[charIdx].push(fullKw);
  }

  if (alsoFunctions.includes(fullKw) &&
    !functionBlocks[charIdx].includes(fullKw)) {
    functionBlocks[charIdx].push(fullKw);
  }
}

// Replaces full keywords in an array with the regexes, if any
function replaceKeywordsWithRegex (kwArray) {
  let regexBlocks = [];

  for (var idx in kwArray) {
    regexBlocks[idx] = getKwRegex(kwArray[idx]);
  }

  let cleanBlocks = regexBlocks.sort().filter(val => val).join('|');

  // remove any empty entries before joining
  // approach from https://stackoverflow.com/a/19903533/18177
  return optimize(cleanBlocks).pattern;
}

lineReaderFunctions.on('close', () => {

  result['keywords'] = {
    comment: "These scopes contain statements, not all the keywords. Methods, attributes and functions have their own scopes.",
    patterns: [],
  }

  for (var zz = 0; zz < 26; zz++) {

    if (keywordBlocks[zz].length > 0) {
      result.keywords.patterns.push({ include: "#keywords-" + String.fromCharCode(97 + zz).toUpperCase() });

      result['keywords-' + String.fromCharCode(97 + zz).toUpperCase()] =
      {
        comment: "The keyword must not have a trailing variable character (one of #$-_%&)",
        match: "(?i)\\b(" + replaceKeywordsWithRegex(keywordBlocks[zz]) + ")\\b(?![#$\\-_%&])",
        captures: {
          1: {
            name: "keyword.other.abl"
          }
        }
      }
    }
  }

  result['handle-attributes'] = { patterns: [] }

  for (var zz = 0; zz < 26; zz++) {
    if (attributeBlocks[zz].length > 0) {

      result['handle-attributes'].patterns.push({ include: "#handle-attributes-" + String.fromCharCode(97 + zz).toUpperCase() });

      result['handle-attributes-' + String.fromCharCode(97 + zz).toUpperCase()] =
      {
        match: "(?i)(:)(" + replaceKeywordsWithRegex(attributeBlocks[zz]) + ")\\b(?![#$\\-_%&])",
        captures: {
          1: {
            name: "punctuation.separator.colon.abl"
          },
          2: {
            name: "entity.name.function.abl"
          }
        }
      }
    }
  }

  result['handle-methods'] = { patterns: [] }
  for (var zz = 0; zz < 26; zz++) {

    if (methodBlocks[zz].length > 0) {
      result['handle-methods'].patterns.push({ include: "#handle-methods-" + String.fromCharCode(97 + zz).toUpperCase() });

      result['handle-methods-' + String.fromCharCode(97 + zz).toUpperCase()] =
      {
        begin: "(?i)(:)(" + replaceKeywordsWithRegex(methodBlocks[zz]) + ")\\s*(?=\\()",
        beginCaptures: {
          1: {
            name: "punctuation.separator.colon.abl"
          },
          2: {
            name: "support.function.abl"
          }
        },
        end: "(\\))",
        endCaptures: {
          1: {
            name: "meta.brace.round.js"
          }
        },
        patterns: [
          {
            include: "#function-arguments"
          }
        ]
      }
    }
  }

  result['abl-functions'] = { patterns: [] }
  for (var zz = 0; zz < 26; zz++) {

    if (functionBlocks[zz].length > 0) {
      result['abl-functions'].patterns.push({ include: "#abl-functions-" + String.fromCharCode(97 + zz).toUpperCase() });

      result['abl-functions-' + String.fromCharCode(97 + zz).toUpperCase()] =
      {
        name: "meta.function-call.abl",
        begin: "(?i)\\s*(" + replaceKeywordsWithRegex(functionBlocks[zz]) + ")\\s*(?=\\()",
        beginCaptures: {
          1: {
            name: "support.function.abl"
          }
        },
        end: "(\\))",
        endCaptures: {
          1: {
            name: "meta.brace.round.js"
          }
        },
        patterns: [
          {
            include: "#function-arguments"
          }
        ]
      }
    }
  }
  fs.writeFileSync(output, JSON.stringify(result, undefined, 4));
})
