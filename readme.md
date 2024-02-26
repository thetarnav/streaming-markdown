[# Streaming *Markdown*](hello)

**Experiment making a streaming makdown renderer *à la ChatGPT.***

## Installation

Install [`streaming-markdown` package](https://www.npmjs.com/package/streaming-markdown) from npm.

```
npm install streaming-markdown
```

*Or just copy [**`mds.js`**](https://github.com/thetarnav/streaming-markdown/blob/main/mds.js) and [types](https://github.com/thetarnav/streaming-markdown/blob/main/types.d.ts) to your project.*

## Usage

### `Parser` object

Create new markdown `Parser` by calling `parser` function with the `HTMLElement` to render to.

```js
import * as mds from "streaming-markdown"

const parser = mds.parser(document.getElementById(```markdown```))
```

### `write` function

Then, you can start streaming markdown to the `Parser` by calling `parser_write` function with the chunk of markdown string.

```js
mds.parser_write(parser, "# Streaming Markdown\n\n")
```

*You can write as **many times** as needed to stream the markdown.*

The parser is optimistic.
When it sees the start of an inline code block or code block,
it will immediately style the element accordingly.

E.g. "\`print("hello wor" should be displayed as `print("hello wor

While the text is streamed in, the user should be able to select the text that has already been streamed in and copy it.
*(The parser is only adding new elements to the DOM, not modifying the existing ones.)*

### `end` function

Finally, you can end the stream by calling `end` function.

It will reset the `Parser` state and flush the remaining markdown.

```js
mds.parser_end(parser)
```

## TODO

- [x] Paragraphs
- [x] Line breaks
    - [x] Single line breaks don't end tokens
- [x] Headers
- [x] code block with triple backticks
- [x] `inline code` with backticks
- [x] *italic* with single asterisks
- [x] **Bold** with double asterisks
- [x] _italic_ with underscores
- [x] __Bold__ with double underscores
- [ ] Special cases:
    - [ ] **foo*bar***
    - [ ] ***foo*bar**
    - [ ] *foo**bar***
    - [ ] ***foo**bar*
- [x] Escape characters (e.g. \* or \_ with \\\* or \\\_)
- [x] \[Link\](url)
    - [ ] href attr
    - [x] Escaping escaping bug: \\[Link\\](url)
- [ ] Images
- [ ] Lists
- [ ] Blockquotes
- [ ] Tables
- [ ] Html tags (e.g. `<div>`, `<span>`, `<a>`, `<img>`, etc.)