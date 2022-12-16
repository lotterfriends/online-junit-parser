# online-junit-parser
A JUnit parser, visualizer and format converter.

Demo:
https://lotterfriends.github.io/online-junit-parser

## Standalone Version 
The standalone version (sa version) is optimized for offline use with "all in once". You can copy just this one file in your repository to have always an junit viewer without the need of an internet connection or external dependencies.

https://github.com/lotterfriends/online-junit-parser/blob/main/index.sa.html

## Testing

### Write Tests

You can add tests in `junit-parser-test.js`.
Suites a bundled in functions, prefixed with `test_`
Mock user input via
```js
document.querySelector('textarea.xml').value = `<?xml ...`;
document.querySelector('textarea.xml').dispatchEvent(new Event('change'));
waitForChange(document.querySelector('textarea.html'));
const obj = JSON.parse(document.querySelector('textarea.json').value);
```
The converted JSON Report is stored in `obj` variable and you can 
use `chk()` function to check it's like expected for the given xml.

### Run Tests
Generate new testing HTML:
```
./bin/gen-pages.sh
```
Open `test/index.html` in your Browser.
Just refresh the page to execute the Tests again. 

## Development

To create different versions of the page the page is splitted in templates. The files `index.html`, `index.sa.html` and `test/index.html` are generated, please do not change.