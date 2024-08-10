/*
Streaming Markdown Parser and Renderer
MIT License
Copyright 2024 Damian Tarnawski
https://github.com/thetarnav/streaming-markdown
*/

import { Attr, Token } from "./tokens.js"
import type { DefaultRenderer, DefaultAddText, DefaultAddToken, DefaultEndToken, DefaultSetAttr, LoggerRenderer, LoggerRendererAddText, LoggerRendererAddToken, LoggerRendererEndToken, LoggerRendererSetAttr, Parser, Renderer } from "./types.js"

export function token_to_string(type: Token) {
  switch (type) {
      case Token.Document:       return "Document"
      case Token.Blockquote:     return "Blockquote"
      case Token.Paragraph:      return "Paragraph"
      case Token.Heading_1:       return "Heading1"
      case Token.Heading_2:       return "Heading2"
      case Token.Heading_3:       return "Heading3"
      case Token.Heading_4:       return "Heading4"
      case Token.Heading_5:       return "Heading5"
      case Token.Heading_6:       return "Heading6"
      case Token.Code_Block:      return "CodeBlock"
      case Token.Code_Fence:      return "CodeFence"
      case Token.Code_Inline:     return "CodeInline"
      case Token.Italic_Ast:      return "ItalicAst"
      case Token.Italic_Und:      return "ItalicUnd"
      case Token.Strong_Ast:      return "StrongAst"
      case Token.Strong_Und:      return "StrongUnd"
      case Token.Strike:         return "Strike"
      case Token.Link:           return "Link"
      case Token.Raw_URL:         return "RawUrl"
      case Token.Image:          return "Image"
      case Token.Line_Break:      return "LineBreak"
      case Token.Rule:           return "Rule"
      case Token.List_Unordered:  return "ListUnordered"
      case Token.List_Ordered:    return "ListOrdered"
      case Token.List_Item:       return "ListItem"
      case Token.Checkbox:       return "Checkbox"

      default:
        throw new Error("Unknown token")
  }
}

export function attr_to_html_attr(type: Attr) {
	switch (type) {
	case Attr.Href:    return "href"
	case Attr.Src :    return "src"
	case Attr.Lang:    return "lang"
	case Attr.Checked: return "checked"
	case Attr.Start:   return "start"
	}
}

const TOKEN_ARRAY_CAP = 24

export function createParser<T>(renderer: Renderer<T>): Parser<T> {
	const tokens = new Uint32Array(TOKEN_ARRAY_CAP)
	tokens[0] = Token.Document
	return {
		renderer  : renderer,
		text      : "",
		pending   : "",
		tokens    : tokens,
		len       : 0,
		token     : Token.Document,
		code_fence_body: 0,
		blockquote_idx: 0,
		hr_char   : '',
		hr_chars  : 0,
		backticks_count: 0,
		spaces    : new Uint8Array(TOKEN_ARRAY_CAP),
		indent    : "",
		indent_len: 0,
	}
}

/**
 * Finish rendering the markdown - flushes any remaining text.
 */
export function parser_end<T>(p: Parser<T>) {
	if (p.pending.length > 0) {
		parser_write(p, "\n")
	}
}

function add_text<T>(p: Parser<T>) {
	if (p.text.length === 0) return
	console.assert(p.len > 0, "Never adding text to root")
	p.renderer.add_text(p.renderer.data, p.text)
	p.text = ""
}

function end_token<T>(p: Parser<T>) {
	console.assert(p.len > 0, "No nodes to end")
	p.len -= 1
	p.token = /** @type {Token} */ (p.tokens[p.len])
	p.renderer.end_token(p.renderer.data)
}

function add_token<T>(p: Parser<T>, token: Token) {
	p.len += 1
	p.tokens[p.len] = token
	p.token = token
	p.renderer.add_token(p.renderer.data, token)
}

function idx_of_token<T>(p: Parser<T>, token: Token, start_idx: number) {
	while (start_idx <= p.len) {
		if (p.tokens[start_idx] & token) {
			return start_idx
		}
		start_idx += 1
	}
	return -1
}

/**
 * End tokens until the parser has the given length.
 */
function end_tokens_to_len<T>(p: Parser<T>, len: number) {
	while (p.len > len) {
		end_token(p)
	}
}
function continue_or_add_list<T>(p: Parser<T>, list_token: Token) {
	/* will create a new list inside the last item
	   if the amount of spaces is greater than the last one (with prefix)
	   1. foo
	      - bar      <- new nested ul
	         - baz   <- new nested ul
	      12. qux    <- cannot be nested in "baz" or "bar",
	                    so it's a new list in "foo"
	*/
	let list_idx = -1
	let item_idx = -1

	for (let i = p.blockquote_idx+1; i <= p.len; i += 1) {
		if (p.tokens[i] & Token.List_Item) {
			if (p.tokens[i-1] & list_token) {
				list_idx = i-1
			}
			if (p.indent_len < p.spaces[i]) {
				item_idx = -1
				break
			}
			item_idx = i
		}
	}

	if (item_idx === -1) {
		if (list_idx === -1) {
			end_tokens_to_len(p, p.blockquote_idx)
			add_token(p, list_token)
		} else {
			end_tokens_to_len(p, list_idx)
		}
	} else {
		end_tokens_to_len(p, item_idx)
		add_token(p, list_token)
	}
}

/**
 * Create a new list
 * or continue the last one
 */
function add_list_item<T>(p: Parser<T>, prefix_length: number) {
	add_token(p, Token.List_Item)
	p.spaces[p.len] = p.indent_len + prefix_length
	clear_root_pending(p)
	p.token = Token.Maybe_Task
}

function clear_root_pending<T>(p: Parser<T>) {
	p.indent = ""
	p.indent_len = 0
	p.pending = ""
}

function is_digit(charcode: number) {
	switch (charcode) {
	case 48: case 49: case 50: case 51: case 52:
	case 53: case 54: case 55: case 56: case 57:
		return true
	default:
		return false
	}
}

/**
 * Parse and render another chunk of markdown.
 */
export function parser_write<T>(p: Parser<T>, chunk: string) {
	for (const char of chunk) {
		const pending_with_char = p.pending + char
		
		/*
		Token specific checks
		*/
		switch (p.token) {
		case Token.Line_Break:
		case Token.Document:
		case Token.Blockquote:
			console.assert(p.text.length === 0, "Root should not have any text")

			switch (p.pending[0]) {
			case undefined:
				p.pending = char
				continue
			case ' ':
				p.pending = char
				p.indent += ' '
				p.indent_len += 1
				continue
			case '\t':
				p.pending = char
				p.indent += '\t'
				p.indent_len += 4
				continue
			/* Ignore newlines in root */
			case '\n':
				end_tokens_to_len(p, p.blockquote_idx)
				p.blockquote_idx = 0
				p.backticks_count = 0
				p.pending = char
				continue
			/* Heading */
			case '#':
				switch (char) {
				case '#':
					if (p.pending.length < 6) {
						p.pending = pending_with_char
						continue
					}
					break // fail
				case ' ':
					switch (p.pending.length) {
					case 1: add_token(p, Token.Heading_1); clear_root_pending(p); continue
					case 2: add_token(p, Token.Heading_2); clear_root_pending(p); continue
					case 3: add_token(p, Token.Heading_3); clear_root_pending(p); continue
					case 4: add_token(p, Token.Heading_4); clear_root_pending(p); continue
					case 5: add_token(p, Token.Heading_5); clear_root_pending(p); continue
					case 6: add_token(p, Token.Heading_6); clear_root_pending(p); continue
					}
					console.assert(false, "Should not reach here")
				}
				break // fail
			/* Blockquote */
			case '>': {
				const next_blockquote_idx = idx_of_token(p, Token.Blockquote, p.blockquote_idx+1)
				
				/*
				Only when there is no blockquote to the right of blockquote_idx
				a new blockquote can be created
				*/
				if (next_blockquote_idx === -1) {
					end_tokens_to_len(p, p.blockquote_idx)
					p.blockquote_idx += 1
					p.backticks_count = 0
					add_token(p, Token.Blockquote)
				} else {
					p.blockquote_idx = next_blockquote_idx
				}
				
				clear_root_pending(p)
				p.pending = char
				continue
			}
			/* Horizontal Rule
			   "-- - --- - --"
			*/
			case '-':
			case '*':
			case '_':
				if (p.hr_chars === 0) {
					console.assert(p.pending.length === 1, "Pending should be one character")
					p.hr_chars = 1
					p.hr_char = p.pending
				}

				if (p.hr_chars > 0) {
					switch (char) {
					case p.hr_char:
						p.hr_chars += 1
						p.pending = pending_with_char
						continue
					case ' ':
						p.pending = pending_with_char
						continue
					case '\n':
						if (p.hr_chars < 3) break
						p.renderer.add_token(p.renderer.data, Token.Rule)
						p.renderer.end_token(p.renderer.data)
						p.pending = ""
						p.hr_chars = 0
						continue
					}

					p.hr_chars = 0
				}

				/* Unordered list 
				/  * foo
				/  * *bar*
				/  * **baz**
				/*/
				if ('_' !== p.pending[0] &&
				    ' ' === p.pending[1]
				) {
					continue_or_add_list(p, Token.List_Unordered)
					add_list_item(p, 2)
					parser_write(p, pending_with_char.slice(2))
					continue
				}

				break // fail
			/* Code Fence */
			case '`':
				/*  ``?
				      ^
				*/
				if (p.pending.length < 3) {
					if ('`' === char) {
						p.pending = pending_with_char
						p.backticks_count = pending_with_char.length
						continue
					}
					p.backticks_count = 0
					break // fail
				}

				switch (char) {
				case '`':
					/*  ````?
						   ^
					*/
					if (p.pending.length === p.backticks_count) {
						p.pending = pending_with_char
						p.backticks_count = pending_with_char.length
					}
					/*  ```code`
							   ^
					*/
					else {
						add_token(p, Token.Paragraph)
						clear_root_pending(p)
						p.backticks_count = 0
						parser_write(p, pending_with_char)
					}
					continue
				case '\n':
					/*  ```lang\n
								^
					*/
					add_token(p, Token.Code_Fence)
					if (p.pending.length > p.backticks_count) {
						p.renderer.set_attr(p.renderer.data, Attr.Lang, p.pending.slice(p.backticks_count))
					}
					clear_root_pending(p)
					continue
				default:
					/*  ```lang\n
							^
					*/
					p.pending = pending_with_char
					continue
				}
			/*
			List Unordered for '+'
			The other list types are handled with HORIZONTAL_RULE
			*/
			case '+': 
				if (' ' !== char) break // fail

				continue_or_add_list(p, Token.List_Unordered)
				add_list_item(p, 2)
				continue
			/* List Ordered */
			case '0': case '1': case '2': case '3': case '4':
			case '5': case '6': case '7': case '8': case '9':
				/*
				12. foo
				   ^
				*/
				if ('.' === p.pending[p.pending.length-1]) {
					if (' ' !== char) break // fail

					continue_or_add_list(p, Token.List_Ordered)
					if (p.pending !== "1.") {
						p.renderer.set_attr(p.renderer.data, Attr.Start, p.pending.slice(0, -1))
					}
					add_list_item(p, p.pending.length+1)
					continue
				} else {
					const char_code = char.charCodeAt(0)
					if (46 === char_code || // '.'
					    is_digit(char_code) // 0-9
					) {
						p.pending = pending_with_char
						continue
					}
				}
				break // fail
			}

			let to_write = pending_with_char

			/* Add line break */
			if (p.token & Token.Line_Break) {
				/* Add a line break and continue in previous token */
				p.token = p.tokens[p.len]
				p.renderer.add_token(p.renderer.data, Token.Line_Break)
				p.renderer.end_token(p.renderer.data)
			}
			/* Code Block */
			else if (p.indent_len >= 4) {
				/*
				Case where there are additional spaces
				after the indent that makes the code block
				_________________________
				       code
				^^^^----indent
				    ^^^-part of code
				_________________________
				 \t   code
				^^-----indent
				   ^^^-part of code
				*/
				let code_start = 0
				for (; code_start < 4; code_start += 1) {
					if (p.indent[code_start] === '\t') {
						code_start = code_start+1
						break
					}
				}
				to_write = p.indent.slice(code_start) + pending_with_char
				add_token(p, Token.Code_Block)
			}
			/* Paragraph */
			else {
				add_token(p, Token.Paragraph)
			}
			
			clear_root_pending(p)
			parser_write(p, to_write)
			continue
		case Token.Code_Block:
			switch (pending_with_char) {
			case "\n    ":
			case "\n   \t":
			case "\n  \t":
			case "\n \t":
			case "\n\t":
				p.text += "\n"
				p.pending = ""
				continue
			case "\n":
			case "\n ":
			case "\n  ":
			case "\n   ":
				p.pending = pending_with_char
				continue
			default:
				if (p.pending.length !== 0) {
					add_text(p)
					end_token(p)
					p.pending = char
				} else {
					p.text += char
				}
				continue
			}
		case Token.Code_Fence:
			switch (char) {
			case '`':
				if (pending_with_char.length ===
					p.backticks_count + p.code_fence_body // 0 or 1 for \n
				) {
					add_text(p)
					end_token(p)
					p.pending = ""
					p.backticks_count = 0
					p.code_fence_body = 0
				} else {
					p.pending = pending_with_char
				}
				continue
			case '\n':
				p.text   += p.pending
				p.pending = char
				p.code_fence_body = 1
				continue
			default:
				p.text   += pending_with_char
				p.pending = ""
				p.code_fence_body = 1
				continue
			}
		case Token.Code_Inline:
			switch (char) {
			case '`':
				if (pending_with_char.length ===
				    p.backticks_count + Number(p.pending[0] === ' ') // 0 or 1 for space
				) {
					add_text(p)
					end_token(p)
					p.pending = ""
					p.backticks_count = 0
				} else {
					p.pending = pending_with_char
				}
				continue
			case '\n':
				p.text += p.pending
				p.pending = ""
				p.token = Token.Line_Break
				p.blockquote_idx = 0
				add_text(p)
				continue
			/* Trim space before ` */
			case ' ':
				p.text += p.pending
				p.pending = char
				continue
			default:
				p.text += pending_with_char
				p.pending = ""
				continue
			}
		/* Checkboxes */
		case Token.Maybe_Task:
			switch (p.pending.length) {
			case 0:
				if ('[' !== char) break // fail
				p.pending = pending_with_char
				continue
			case 1:
				if (' ' !== char && 'x' !== char) break // fail
				p.pending = pending_with_char
				continue
			case 2:
				if (']' !== char) break // fail
				p.pending = pending_with_char
				continue
			case 3:
				if (' ' !== char) break // fail
				p.renderer.add_token(p.renderer.data, Token.Checkbox)
				if ('x' === p.pending[1]) {
					p.renderer.set_attr(p.renderer.data, Attr.Checked, "")
				}
				p.renderer.end_token(p.renderer.data)
				p.pending = " "
				continue
			}

			p.token = p.tokens[p.len]
			p.pending = ""
			parser_write(p, pending_with_char)
			continue
		case Token.Strong_Ast:
		case Token.Strong_Und: {
			/** @type {string} */ let symbol = '*'
			/** @type {Token } */ let italic = Token.Italic_Ast
			if (p.token === Token.Strong_Und) {
				symbol = '_'
				italic = Token.Italic_Und
			}

			if (symbol === p.pending) {
				add_text(p)
				/* **Bold**
						  ^
				*/
				if (symbol === char) {
					end_token(p)
					p.pending = ""
					continue
				}
				/* **Bold*Bold->Em*
						  ^
				*/
				add_token(p, italic)
				p.pending = char
				continue
			}

			break
		}
		case Token.Italic_Ast:
		case Token.Italic_Und: {
			/** @type {string} */ let symbol = '*'
			/** @type {Token } */ let strong = Token.Strong_Ast
			if (p.token === Token.Italic_Und) {
				symbol = '_'
				strong = Token.Strong_Und
			}

			switch (p.pending) {
			case symbol:
				if (symbol === char) {
					/* Decide between ***bold>em**em* and **bold*bold>em***
					                             ^                       ^
					   With the help of the next character
					*/
					if (p.tokens[p.len-1] === strong) {
						p.pending = pending_with_char
					}
					/* *em**bold
					       ^
					*/
					else {
						add_text(p)
						add_token(p, strong)
						p.pending = ""
					}
				}
				/* *em*foo
					   ^
				*/
				else {
					add_text(p)
					end_token(p)
					p.pending = char
				}
				continue
			case symbol+symbol:
				const italic = p.token
				add_text(p)
				end_token(p)
				end_token(p)
				/* ***bold>em**em* or **bold*bold>em***
				               ^                      ^
				*/
				if (symbol !== char) {
					add_token(p, italic)
					p.pending = char
				} else {
					p.pending = ""
				}
				continue
			}
			break
		}
		case Token.Strike:
			if ("~~" === pending_with_char) {
				add_text(p)
				end_token(p)
				p.pending = ""
				continue
			}
			break
		/* Raw URLs */
		case Token.Maybe_URL:
			if ("http://"  === pending_with_char ||
				"https://" === pending_with_char
			) {
				add_text(p)
				add_token(p, Token.Raw_URL)
				p.pending = pending_with_char
				p.text    = pending_with_char
			}
			else
			if ("http:/" [p.pending.length] === char ||
				"https:/"[p.pending.length] === char
			) {
				p.pending = pending_with_char
			}
			else {
				p.token = p.tokens[p.len]
				parser_write(p, char)
			}
			continue
		case Token.Link:
		case Token.Image:
			if ("]" === p.pending) {
				/*
				[Link](url)
					 ^
				*/
				add_text(p)
				if ('(' === char) {
					p.pending = pending_with_char
				} else {
					end_token(p)
					p.pending = char
				}
				continue
			}
			if (']' === p.pending[0] &&
			    '(' === p.pending[1]
			) {
				/*
				[Link](url)
						  ^
				*/
				if (')' === char) {
					const type = p.token === Token.Link ? Attr.Href : Attr.Src
					const url = p.pending.slice(2)
					p.renderer.set_attr(p.renderer.data, type, url)
					end_token(p)
					p.pending = ""
				} else {
					p.pending += char
				}
				continue
			}
			break
		case Token.Raw_URL:
			/* http://example.com?
			                     ^
			*/
			if (' ' === char ||
			    '\n'=== char ||
			    '\\'=== char
			) {
				p.renderer.set_attr(p.renderer.data, Attr.Href, p.pending)
				add_text(p)
				end_token(p)
				p.pending = char
			} else {
				p.text   += char
				p.pending = pending_with_char
			}
			continue
		}

		/*
		Common checks
		*/
		switch (p.pending[0]) {
		/* Escape character */
		case '\\':
			if ('\n' === char) {
				// Escaped newline has the same affect as unescaped one
				p.pending = char
			} else {
				const char_code = char.charCodeAt(0)
				p.pending = ""
				p.text += is_digit(char_code)                 || // 0-9
				          (char_code >= 65 && char_code <= 90) || // A-Z
				          (char_code >= 97 && char_code <= 122)   // a-z
				          ? pending_with_char
				          : char
			}
			continue
		/* Newline */
		case '\n':
			add_text(p)
			p.token = Token.Line_Break
			p.blockquote_idx = 0
			p.pending = char
			continue
		/* `Code Inline` */
		case '`':
			if (p.token & Token.Image) break

			if ('`' === char) {
				p.backticks_count += 1
				p.pending = pending_with_char
			} else {
				p.backticks_count += 1 // started at 0, and first wasn't counted
				add_text(p)
				add_token(p, Token.Code_Inline)
				p.text = ' ' === char || '\n' === char ? "" : char // trim leading space
				p.pending = ""
			}
			continue
		case '_':
		case '*': {
			if (p.token & Token.Image) break

			/** @type {Token} */ let italic = Token.Italic_Ast
			/** @type {Token} */ let strong = Token.Strong_Ast
			const symbol = p.pending[0]
			if ('_' === symbol) {
				italic = Token.Italic_Und 
				strong = Token.Strong_Und
			}

			if (p.pending.length === 1) {
				/* **Strong**
					^
				*/
				if (symbol === char) {
					p.pending = pending_with_char
					continue
				}
				/* *Em*
					^
				*/
				if (' ' !== char && '\n' !== char) {
					add_text(p)
					add_token(p, italic)
					p.pending = char
					continue
				}
			} else {
				/* ***Strong->Em***
					 ^
				*/
				if (symbol === char) {
					add_text(p)
					add_token(p, strong)
					add_token(p, italic)
					p.pending = ""
					continue
				}
				/* **Strong**
					 ^
				*/
				if (' ' !== char && '\n' !== char) {
					add_text(p)
					add_token(p, strong)
					p.pending = char
					continue
				}
			}

			break
		}
		case '~':
			if (p.token & (Token.Image | Token.Strike)) break

			if ("~" === p.pending) {
				/* ~~Strike~~
					^
				*/
				if ('~' === char) {
					p.pending = pending_with_char
					continue
				}
			} else {
				/* ~~Strike~~
					 ^
				*/
				if (' ' !== char && '\n' !== char) {
					add_text(p)
					add_token(p, Token.Strike)
					p.pending = char
					continue
				}
			}

			break
		/* [Image](url) */
		case '[':
			if (!(p.token & (Token.Image | Token.Link)) &&
			    ']' !== char
			) {
				add_text(p)
				add_token(p, Token.Link)
				p.pending = char
				continue
			}
			break
		/* ![Image](url) */
		case '!':
			if (!(p.token & Token.Image) &&
			    '[' === char
			) {
				add_text(p)
				add_token(p, Token.Image)
				p.pending = ""
				continue
			}
			break
		/* Trim spaces */
		case ' ':
			if (' ' === char) {
				continue
			}
			break
		}

		/* foo http://...
		       ^
		*/
		if (!(p.token & (Token.Image | Token.Link)) &&
		    'h' === char &&
		   (" " === p.pending ||
		    ""  === p.pending)
		) {
			p.text   += p.pending
			p.pending = char
			p.token = Token.Maybe_URL
			continue
		}

		/*
		No check hit
		*/
		p.text += p.pending
		p.pending = char
	}

	add_text(p)
}

/**
 * @param   {HTMLElement     } root
 * @returns {DefaultRenderer} */
export function default_renderer(root: HTMLElement): DefaultRenderer {
	return {
		add_token: default_add_token,
		end_token: default_end_token,
		add_text:  default_add_text,
		set_attr:  default_set_attr,
		data    : {
			nodes: /**@type {*}*/([root,,,,,]),
			index: 0,
		},
	}
}

export const default_add_token: DefaultAddToken = (data, type) => {
  let mount: HTMLElement;
  let slot: HTMLElement;

  switch (type) {
      case Token.Document: return; // document is provided
      case Token.Blockquote:    mount = slot = document.createElement("blockquote"); break;
      case Token.Paragraph:     mount = slot = document.createElement("p");          break;
      case Token.Line_Break:     mount = slot = document.createElement("br");         break;
      case Token.Rule:          mount = slot = document.createElement("hr");         break;
      case Token.Heading_1:      mount = slot = document.createElement("h1");         break;
      case Token.Heading_2:      mount = slot = document.createElement("h2");         break;
      case Token.Heading_3:      mount = slot = document.createElement("h3");         break;
      case Token.Heading_4:      mount = slot = document.createElement("h4");         break;
      case Token.Heading_5:      mount = slot = document.createElement("h5");         break;
      case Token.Heading_6:      mount = slot = document.createElement("h6");         break;
      case Token.Italic_Ast:
      case Token.Italic_Und:     mount = slot = document.createElement("em");         break;
      case Token.Strong_Ast:
      case Token.Strong_Und:     mount = slot = document.createElement("strong");     break;
      case Token.Strike:        mount = slot = document.createElement("s");          break;
      case Token.Code_Inline:    mount = slot = document.createElement("code");       break;
      case Token.Raw_URL:
      case Token.Link:          mount = slot = document.createElement("a");          break;
      case Token.Image:         mount = slot = document.createElement("img");        break;
      case Token.List_Unordered: mount = slot = document.createElement("ul");         break;
      case Token.List_Ordered:   mount = slot = document.createElement("ol");         break;
      case Token.List_Item:      mount = slot = document.createElement("li");         break;
      case Token.Checkbox:
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.disabled = true;
          mount = slot = checkbox;
          break;
      case Token.Code_Block:
      case Token.Code_Fence:
          mount = document.createElement("pre");
          slot  = document.createElement("code");
          mount.appendChild(slot);
          break;

      default:
          throw new Error("Unknown token: " + type);
  }

  data.nodes[data.index]?.appendChild(mount);
  data.index += 1;
  data.nodes[data.index] = slot;
};

export const default_end_token: DefaultEndToken = (data) => {
	data.index -= 1
}

export const default_add_text: DefaultAddText = (data, text) => {
	data.nodes[data.index]?.appendChild(document.createTextNode(text))
}

export const default_set_attr: DefaultSetAttr = (data, type, value) => {
	data.nodes[data.index]?.setAttribute(attr_to_html_attr(type), value)
}

export const logger_renderer: LoggerRenderer = {
  data:      undefined,
  add_token: (data, type) => {
    console.log("add_token:", token_to_string(type))
  },
  end_token: (data) => {
    console.log("end_token")
  },
  add_text:  (data, text) => {
    console.log('add_text: "%s"', text)
  },
  set_attr:  (data, type, value) => {
    console.log('set_attr: %s="%s"', attr_to_html_attr(type), value)
  },
}
