const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const glob = require('glob');
const assert = require('assert');

// テスト前に*.encommentedファイルを削除
const encommentedFiles = glob.sync(path.join(__dirname, '../*.encommented'));
encommentedFiles.forEach(f => {
    try { fs.unlinkSync(f); } catch (e) { /* ignore */ }
});

function runTest(src, ext) {
    const srcFile = path.join(__dirname, `../${src}.${ext}`);
    const outFile = path.join(__dirname, `../${src}.${ext}.encommented`);
    execSync(`node ${path.join(__dirname, '../add_english_comments.js')} ${srcFile}`);
    const result = fs.readFileSync(outFile, 'utf8');
    console.log(`\n=== ${srcFile} result ===\n`);
    console.log(result);
}

function normalize(str) {
    return str.replace(/\r/g, '').replace(/ +/g, ' ').trim();
}

function runTestWithExpect(src, ext) {
    const srcFile = path.join(__dirname, `../${src}.${ext}`);
    const outFile = path.join(__dirname, `../${src}.${ext}.encommented`);
    const expectFile = path.join(__dirname, `../${src}.${ext}.expect`);
    execSync(`node ${path.join(__dirname, '../add_english_comments.js')} ${srcFile}`);
    const result = fs.readFileSync(outFile, 'utf8');
    if (fs.existsSync(expectFile)) {
        const expect = fs.readFileSync(expectFile, 'utf8');
        try {
            assert.strictEqual(normalize(result), normalize(expect));
            console.log(`\u2714 ${srcFile} passed`);
        } catch (e) {
            console.error(`\u2716 ${srcFile} failed`);
            console.error('--- result ---\n' + result + '\n--- expect ---\n' + expect);
        }
    } else {
        console.log(`\u26A0 No expect file for ${srcFile}`);
    }
}

runTest('test_sample', 'py');
runTest('test_sample', 'js');
runTestWithExpect('test_sample', 'py');
runTestWithExpect('test_sample', 'js');
runTestWithExpect('test_mixed', 'py');
runTestWithExpect('test_mixed', 'js');
runTestWithExpect('test_mixed', 'js');
