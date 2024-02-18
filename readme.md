# Streaming Markdown

**Experiment making a streaming makdown renderer *à la ChatGPT.***

## Installation

```bash
npm install streaming-markdown
# or
yarn add streaming-markdown
# or
pnpm add streaming-markdown
```

## Usage

Create new markdown `Stream` by calling `stream` function with the `HTMLElement` to render to.

```js
import * as md_stream from "streaming-markdown"

const stream = md_stream.stream(document.getElementById("markdown"))
```

Then, you can start streaming markdown to the `Stream` by calling `write` function with the chunk of markdown string.

```js
md_stream.write(stream, "# Streaming Markdown\n\n")
```

*You can write as **many times** as needed to stream the markdown.*

The parser is optimistic. When it sees the start of an inline code block or code block, it will immediately style the element accordingly.

E.g. `print("hello wor

While the text is streamed in, the user should be able to select the text that has already been streamed in and copy it. *(The parser is only adding new elements to the DOM, not modifying the existing ones.)*