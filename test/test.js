const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const glob = require('glob');

// テスト前に*.encommentedファイルを削除
const encommentedFiles = glob.sync(path.join(__dirname, '../*.encommented'));
encommentedFiles.forEach(f => {
    try { fs.unlinkSync(f); } catch (e) { /* ignore */ }
});

function runTest(src, ext) {
    const srcFile = `../test_sample.${ext}`;
    const outFile = `../test_sample.${ext}.encommented`;
    execSync(`node ../add_english_comments.js ${srcFile}`);
    const result = fs.readFileSync(outFile, 'utf8');
    console.log(`\n=== ${srcFile} result ===\n`);
    console.log(result);
}

runTest('test_sample', 'py');
runTest('test_sample', 'js');
