# Streaming *Markdown*

[![version](https://img.shields.io/npm/v/streaming-markdown?logo=npm)](https://www.npmjs.com/package/streaming-markdown) [![github](https://img.shields.io/badge/GitHub-streaming--markdown-orange?logo=github)](https://github.com/thetarnav/streaming-markdown)

**Experiment making a streaming makdown parser *à la ChatGPT.***

---

## Installation

Install `streaming-markdown` package from npm.

```bash
npm install streaming-markdown
```

*Or just copy [**`smd.js`**](https://github.com/thetarnav/streaming-markdown/blob/main/smd.js) file to your project.*

Or use the [CDN link](https://www.jsdelivr.com/package/npm/streaming-markdown).\
It's a minified *(3kB Gzip)* version of the package, with only the necessary functions exported.\
See the exports in [`smd_min_entry.js`](https://github.com/thetarnav/streaming-markdown/blob/main/smd_min_entry.js).\
The package uses ES module exports, so you need to use `type="module"` in your script tag.

```html
<script type="module">
    import * as smd from "https://cdn.jsdelivr.net/npm/streaming-markdown/smd.min.js"
    // ...
</script>
```

## Usage

First create new markdown `Parser` by calling `parser` function.\
It's single argument is a `Renderer` object, which is an interface to render the parsed markdown tokens to the DOM.\
There are two built-in renderers—`default_renderer` and `logger_renderer`—that you can try at first.

```js
import * as smd from "streaming-markdown"

const element  = document.getElementById("markdown")
const renderer = smd.default_renderer(element)
const parser   = smd.parser(renderer)
```

### `write` function

Then, you can start streaming markdown to the `Parser` by calling `parser_write` function with the chunk of markdown string.

```js
smd.parser_write(parser, "# Streaming Markdown\n\n")
```

*You can write **as many times as you want** to stream the markdown.*

The parser is optimistic.
When it sees the start of an inline code block or code block,
it will immediately style the element accordingly.

E.g. `` `print("hello wor `` should be rendered as `<code>print("hello wor</code>`

While the text is streamed in, the user should be able to select the text that has already been streamed in and copy it.
*(The parser is only adding new elements to the DOM, not modifying the existing ones.)*

### `end` function

Finally, you can end the stream by calling `end` function.

It will reset the `Parser` state and flush the remaining markdown.

```js
smd.parser_end(parser)
```

### Renderer interface

| Field name  | Type                   | Description |
| ----------- | ---------------------- | ----------- |
| `data`      | `T`                    | User data object.<br>Available as first param in callbacks. |
| `add_token` | `Renderer_Add_Token<T>`| When the tokens starts. |
| `end_token` | `Renderer_End_Token<T>`| When the token ends. |
| `add_text`  | `Renderer_Add_Text<T>` | To append text to current token.<br>Can be called multiple times or none. |
| `set_attr`  | `Renderer_Set_Attr<T>` | Set additional attributes of current token eg. the link url. |

## Markdown features

- [x] Paragraphs
- [x] Line breaks
    - [x] don't end tokens
    - [x] Escaping line breaks
- [x] Trim unnecessary spaces
- [x] Headers
    - [ ] ~~Alternate syntax~~ *(not planned)*
- [x] Code Block with indent
- [x] Code Block with triple backticks
    - [x] language attr
    - [x] with many backticks
- [x] `` `inline code` `` with backticks
    - [x] with many backticks
    - [x] trim spaces ` code `
- [x] *italic* with single asterisks
- [x] **Bold** with double asterisks
- [x] _italic_ with underscores
- [x] __Bold__ with double underscores
- [x] Special cases:
    - [x] **bold*bold>em***
    - [x] ***bold>em*bold**
    - [x] *em**em>bold***
    - [x] ***bold>em**em*
- [x] \* or \_ cannot be surrounded by spaces
- [x] Strikethrough ~~example~~
- [x] Escape characters (e.g. \* or \_ with \\\* or \\\_)
- [x] \[Link\](url)
    - [x] `href` attr
- [ ] Raw URLs
    - [ ] http://example.com
    - [ ] https://example.com
    - [ ] www.example.com
    - [ ] example@fake.com
    - [ ] mailto:example@fake.com
- [x] Autolinks
    - [ ] www.example.com
    - [x] http://example.com
    - [x] https://example.com
    - [ ] example@fake.com
    - [ ] mailto:example@fake.com
- [ ] Reference-style Links
- [x] Images
    - [x] `src` attr
- [x] Horizontal rules
    - [x] With `---`
    - [x] With `***`
    - [x] With `___`
- [x] Unordered lists
- [x] Ordered lists
    - [x] `start` attr
- [x] Task lists
- [x] Nested lists
- [ ] One-line nested lists
- [ ] Adding Elements in Lists
- [x] Blockquotes
- [x] Tables
    - [ ] Align cols right/center
    - [ ] Multiline cells
- [ ] Subscript
- [ ] Superscript
- [ ] Emoji Shortcodes
- [ ] Html tags (e.g. `<div>`, `<span>`, `<a>`, `<img>`, etc.)
    - [x] Line breaks `<br>`, `<br/>`
- [x] LaTex tags for blocks `\[...\]`, `$$...$$` and inline `\(...\)` or `$...$`

If you think that something is missing or doesn't work, please [make an issue](https://github.com/thetarnav/streaming-markdown/issues).

🔴Ⓜ️⬇️
