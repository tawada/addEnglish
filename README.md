# addEnglish

A tool to automatically add English translations to Japanese comments in source code.

## Overview
- Detects Japanese comments in Python (#, docstring) and JavaScript (//, /* ... */) and inserts English translations immediately after them.
- Uses `@vitalets/google-translate-api` for translation.
- Main script: `add_english_comments.js`.
- Includes sample files and an automated test script.

## File Structure

- `add_english_comments.js`: Main script
- `test_sample.py`, `test_sample.js`: Sample input files for Python/JS
- `test_mixed.py`, `test_mixed.js`: Samples with mixed Japanese/English and edge cases
- `*.encommented`: Output files with English comments added
- `*.expect`: Expected output files for testing
- `test/test.js`: Automated test script (Node.js)
- `test/README.md`, `test/README_additional.md`: Test descriptions

## Usage

### 1. Install dependencies
```
npm install
```

### 2. Add English comments to code
```
node add_english_comments.js <source-file>
```
- Example: `node add_english_comments.js test_sample.py`
- Output will be saved as `<source-file>.encommented`

### 3. Run tests
```
node test/test.js
```
- Runs automated tests and compares output with expected results

## Notes
- English translations depend on the Google Translate API results
- Only Japanese in comments is targeted (not inside string literals)
- Existing English comments and code logic are not modified

## License
MIT
