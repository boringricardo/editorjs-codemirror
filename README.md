# CodeMirror for EditorJS

---

A CodeMirror implementation for EditorJS. There are a few similar packages, but this one aims to allow you to have more control
over the packages.

## Installation

### Install via NPM

```bash
npm i @boringricardo/editorjs-codemirror
```

And then just include it in your application:

```javascript
import { CodeMirrorTool } from '@boringricardo/editorjs-codemirror';
```

## Usage

Add the imported tool to your EditorJS config:

```javascript
const editor = EditorJS({
    tools: {
        code: CodeMirrorTool
    }
});
```

## Output format

This tool returns a format that includes the selected language that can be used by any
syntax highlighting tool.

```json
{
    "type": "codemirror",
    "data": {
        "code": "def is_awesome\n true\nend",
        "language": "ruby"
    }
}
```

