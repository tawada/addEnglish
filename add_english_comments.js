#!/usr/bin/env node
// add_english_comments.js
// Inserts English (dummy) comments after Japanese comments in Python and JavaScript source files.
// Supports Python (#, docstring) and JavaScript (//, /* ... */) comments.

const fs = require('fs');
const path = require('path');

const JP_CHAR_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;
const PY_LINE_COMMENT = /^\s*#(.*)/;
const JS_LINE_COMMENT = /^\s*\/(\/)(.*)/;

function isJapanese(text) {
    return JP_CHAR_PATTERN.test(text);
}
function translateDummy(text) {
    return `English: ${text.trim()}`;
}
function processPython(lines) {
    let result = [];
    let inDocstring = false;
    let docstringDelim = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const docstringMatch = line.match(/^(\s*)(["']{3})/);
        if (docstringMatch) {
            const delim = docstringMatch[2];
            if (!inDocstring) {
                inDocstring = true;
                docstringDelim = delim;
            } else {
                inDocstring = false;
                docstringDelim = '';
            }
            result.push(line);
            continue;
        }
        if (inDocstring) {
            if (isJapanese(line)) {
                result.push(line);
                result.push(`${docstringDelim} ${translateDummy(line)}`);
            } else {
                result.push(line);
            }
            continue;
        }
        const m = line.match(PY_LINE_COMMENT);
        if (m && isJapanese(m[1])) {
            result.push(line);
            result.push(`# ${translateDummy(m[1])}`);
        } else {
            result.push(line);
        }
    }
    return result;
}
function processJavaScript(lines) {
    let result = [];
    let inBlock = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('/*')) {
            inBlock = true;
            result.push(line);
            continue;
        }
        if (line.includes('*/') && inBlock) {
            inBlock = false;
            result.push(line);
            continue;
        }
        if (inBlock) {
            if (isJapanese(line)) {
                result.push(line);
                result.push(`// ${translateDummy(line)}`);
            } else {
                result.push(line);
            }
            continue;
        }
        const m = line.match(/^\s*\/\/(.*)/);
        if (m && isJapanese(m[1])) {
            result.push(line);
            result.push(`// ${translateDummy(m[1])}`);
        } else {
            result.push(line);
        }
    }
    return result;
}
function detectLanguage(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.py') return 'python';
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return 'javascript';
    return null;
}
function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node add_english_comments.js <sourcefile>');
        process.exit(1);
    }
    const filename = process.argv[2];
    const lang = detectLanguage(filename);
    if (!lang) {
        console.log('Unsupported file type.');
        process.exit(1);
    }
    const lines = fs.readFileSync(filename, 'utf8').split(/\r?\n/);
    let newLines;
    if (lang === 'python') {
        newLines = processPython(lines);
    } else {
        newLines = processJavaScript(lines);
    }
    const outname = filename + '.encommented';
    fs.writeFileSync(outname, newLines.join('\n'), 'utf8');
    console.log(`Output written to ${outname}`);
}
if (require.main === module) {
    main();
}
