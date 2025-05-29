#!/usr/bin/env node
// add_english_comments.js
// Inserts English (dummy) comments after Japanese comments in Python and JavaScript source files.
// Supports Python (#, docstring) and JavaScript (//, /* ... */) comments.

const fs = require('fs');
const path = require('path');
const translate = require('@vitalets/google-translate-api').translate;

const JP_CHAR_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;
const PY_LINE_COMMENT = /^\s*#(.*)/;
const JS_LINE_COMMENT = /^\s*\/(\/)(.*)/;

function isJapanese(text) {
    return JP_CHAR_PATTERN.test(text);
}
async function translateJapaneseComment(text) {
    try {
        const res = await translate(text, {from: 'ja', to: 'en'});
        console.log('[DEBUG] input:', text, 'output:', res.text);
        return res.text;
    } catch (e) {
        console.error('[ERROR] Translation failed:', text);
        console.error(e);
        return `English: ${text.trim()}`;
    }
}
async function processPython(lines) {
    let result = [];
    let inDocstring = false;
    let docstringDelim = '';
    let commentBuffer = [];
    let commentIndent = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const docstringMatch = line.match(/^(\s*)(["']{3})/);
        if (docstringMatch) {
            const delim = docstringMatch[2];
            if (!inDocstring) {
                inDocstring = true;
                docstringDelim = delim;
                docstringBuffer = [line];
                docstringIndent = docstringMatch[1] || '';
                continue;
            } else {
                inDocstring = false;
                docstringBuffer.push(line);
                // 複数行docstring全体をまとめて翻訳
                const jpLines = docstringBuffer.slice(1, -1).map(l => l.trim()).join('\n');
                let en = '';
                if (jpLines && jpLines.split('').some(isJapanese)) {
                    en = await translateJapaneseComment(jpLines);
                }
                result.push(...docstringBuffer);
                if (en) {
                    result.push(`${docstringIndent}${docstringDelim} ${en.split('\n').join(' ')}`);
                }
                docstringBuffer = [];
                continue;
            }
        }
        if (inDocstring) {
            docstringBuffer.push(line);
            continue;
        }
        // 連続する日本語行コメントをまとめる
        const m = PY_LINE_COMMENT.match(line);
        if (m && isJapanese(m[1])) {
            if (commentBuffer.length === 0) {
                commentIndent = m[1].match(/^(\s*)/) ? m[1].match(/^(\s*)/)[1] : '';
            }
            commentBuffer.push({line, text: m[1]});
            // 次の行も日本語コメントならバッファに溜める
            continue;
        } else {
            // バッファに溜まっていたらまとめて英訳
            if (commentBuffer.length > 0) {
                for (const c of commentBuffer) result.push(c.line);
                const joined = commentBuffer.map(c => c.text.trim()).join(' ');
                const t = await translateJapaneseComment(joined);
                result.push(`${commentIndent}# ${t}`);
                commentBuffer = [];
            }
            result.push(line);
        }
    }
    // ファイル末尾にバッファが残っていた場合
    if (commentBuffer.length > 0) {
        for (const c of commentBuffer) result.push(c.line);
        const joined = commentBuffer.map(c => c.text.trim()).join(' ');
        const t = await translateJapaneseComment(joined);
        result.push(`${commentIndent}# ${t}`);
    }
    return result;
}

async function processJavaScript(lines) {
    let result = [];
    let inBlock = false;
    let blockBuffer = [];
    let blockIndent = '';
    let commentBuffer = [];
    let commentIndent = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('/*')) {
            inBlock = true;
            blockBuffer = [line];
            blockIndent = line.match(/^(\s*)/)[1] || '';
            continue;
        }
        if (line.includes('*/') && inBlock) {
            inBlock = false;
            blockBuffer.push(line);
            // 複数行ブロックコメント全体をまとめて翻訳
            const jpLines = blockBuffer.slice(1, -1).map(l => l.trim()).join('\n');
            let en = '';
            if (jpLines && jpLines.split('').some(isJapanese)) {
                en = await translateJapaneseComment(jpLines);
            }
            result.push(...blockBuffer);
            if (en) {
                result.push(`${blockIndent}// ${en.split('\n').join(' ')}`);
            }
            blockBuffer = [];
            continue;
        }
        if (inBlock) {
            blockBuffer.push(line);
            continue;
        }
        // 連続する日本語行コメントをまとめる
        const m = line.match(/^(\s*)\/\/(.*)/);
        if (m && isJapanese(m[2])) {
            if (commentBuffer.length === 0) {
                commentIndent = m[1] || '';
            }
            commentBuffer.push({line, text: m[2]});
            continue;
        } else {
            if (commentBuffer.length > 0) {
                for (const c of commentBuffer) result.push(c.line);
                const joined = commentBuffer.map(c => c.text.trim()).join(' ');
                const t = await translateJapaneseComment(joined);
                result.push(`${commentIndent}// ${t}`);
                commentBuffer = [];
            }
            result.push(line);
        }
    }
    if (commentBuffer.length > 0) {
        for (const c of commentBuffer) result.push(c.line);
        const joined = commentBuffer.map(c => c.text.trim()).join(' ');
        const t = await translateJapaneseComment(joined);
        result.push(`${commentIndent}// ${t}`);
    }
    return result;
}

function detectLanguage(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.py') return 'python';
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return 'javascript';
    return null;
}
async function main() {
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
        newLines = await processPython(lines);
    } else {
        newLines = await processJavaScript(lines);
    }
    const outname = filename + '.encommented';
    fs.writeFileSync(outname, newLines.join('\n'), 'utf8');
    console.log(`Output written to ${outname}`);
}
if (require.main === module) {
    main();
}
