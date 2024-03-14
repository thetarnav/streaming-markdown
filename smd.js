/*
Streaming Markdown Parser and Renderer
MIT License
Copyright 2024 Damian Tarnawski
https://github.com/thetarnav/streaming-markdown
*/

export const
	DOCUMENT       =        1, //  1
	PARAGRAPH      =        2, //  2
	HEADING_1      =        4, //  3
	HEADING_2      =        8, //  4
	HEADING_3      =       16, //  5
	HEADING_4      =       32, //  6
	HEADING_5      =       64, //  7
	HEADING_6      =      128, //  8
	CODE_BLOCK     =      256, //  9
	CODE_FENCE     =      512, // 10
	CODE_INLINE    =     1024, // 11
	ITALIC_AST     =     2048, // 12
	ITALIC_UND     =     4096, // 13
	STRONG_AST     =     8192, // 14
	STRONG_UND     =    16384, // 15
	STRIKE         =    32768, // 16
	LINK           =    65536, // 17
	RAW_URL        =   131072, // 18
	IMAGE          =   262144, // 19
	BLOCKQUOTE     =   524288, // 20
	LINE_BREAK     =  1048576, // 21
	RULE           =  4194304, // 22
	LIST_UNORDERED =  8388608, // 23
	LIST_ORDERED   = 16777216, // 24
	LIST_ITEM      = 33554432, // 25
	CHECKBOX       = 67108864, // 26
	MAYBE_URL	   =134217728, // 27
	MAYBE_TASK	   =268435456, // 28
	/** `HEADING_1 | HEADING_2 | HEADING_3 | HEADING_4 | HEADING_5 | HEADING_6` */
	ANY_HEADING    =      252,
	/** `CODE_BLOCK | CODE_FENCE | CODE_INLINE` */
	ANY_CODE       =     1792,
	/** `ITALIC_AST | ITALIC_UND` */
	ANY_ITALIC     =     6144,
	/** `STRONG_AST | STRONG_UND` */
	ANY_STRONG     =    24576,
	/** `STRONG_AST | ITALIC_AST` */
	ANY_AST        =    10240,
	/** `STRONG_UND | ITALIC_UND` */
	ANY_UND        =    20480,
	/** `LIST_UNORDERED | LIST_ORDERED` */
	ANY_LIST       = 25165824,
	/** `DOCUMENT | BLOCKQUOTE` */
	ANY_ROOT       =   262145

/** @enum {(typeof Token)[keyof typeof Token]} */
export const Token = /** @type {const} */({
	Document:       DOCUMENT,
	Blockquote:     BLOCKQUOTE,
	Paragraph:      PARAGRAPH,
	Heading_1:      HEADING_1,
	Heading_2:      HEADING_2,
	Heading_3:      HEADING_3,
	Heading_4:      HEADING_4,
	Heading_5:      HEADING_5,
	Heading_6:      HEADING_6,
	Code_Block:     CODE_BLOCK,
	Code_Fence:     CODE_FENCE,
	Code_Inline:    CODE_INLINE,
	Italic_Ast:     ITALIC_AST,
	Italic_Und:     ITALIC_UND,
	Strong_Ast:     STRONG_AST,
	Strong_Und:     STRONG_UND,
	Strike:         STRIKE,
	Link:           LINK,
	Raw_URL:        RAW_URL,
	Image:          IMAGE,
	Line_Break:     LINE_BREAK,
	Rule:           RULE,
	List_Unordered: LIST_UNORDERED,
	List_Ordered:   LIST_ORDERED,
	List_Item:      LIST_ITEM,
	Checkbox:       CHECKBOX,
})

/**
 * @param   {Token} type
 * @returns {string    } */
export function token_to_string(type) {
	switch (type) {
	case DOCUMENT:       return "Document"
	case BLOCKQUOTE:     return "Blockquote"
	case PARAGRAPH:      return "Paragraph"
	case HEADING_1:      return "Heading_1"
	case HEADING_2:      return "Heading_2"
	case HEADING_3:      return "Heading_3"
	case HEADING_4:      return "Heading_4"
	case HEADING_5:      return "Heading_5"
	case HEADING_6:      return "Heading_6"
	case CODE_BLOCK:     return "Code_Block"
	case CODE_FENCE:     return "Code_Fence"
	case CODE_INLINE:    return "Code_Inline"
	case ITALIC_AST:     return "Italic_Ast"
	case ITALIC_UND:     return "Italic_Und"
	case STRONG_AST:     return "Strong_Ast"
	case STRONG_UND:     return "Strong_Und"
	case STRIKE:         return "Strike"
	case LINK:           return "Link"
	case RAW_URL:        return "Raw URL"
	case IMAGE:          return "Image"
	case LINE_BREAK:     return "Line_Break"
	case RULE:           return "Rule"
	case LIST_UNORDERED: return "List_Unordered"
	case LIST_ORDERED:   return "List_Ordered"
	case LIST_ITEM:      return "List_Item"
	case CHECKBOX:       return "Checkbox"
	}
}

export const
	HREF    = 1,
	SRC     = 2,
	LANG    = 4,
	CHECKED = 8,
	START   = 16

/** @enum {(typeof Attr)[keyof typeof Attr]} */
export const Attr = /** @type {const} */({
	Href   : HREF,
	Src    : SRC,
	Lang   : LANG,
	Checked: CHECKED,
	Start  : START,
})

/**
 * @param   {Attr} type
 * @returns {string    } */
export function attr_to_html_attr(type) {
	switch (type) {
	case HREF:    return "href"
	case SRC :    return "src"
	case LANG:    return "lang"
	case CHECKED: return "checked"
	case START:   return "start"
	}
}

/**
 * @typedef  {object      } Parser
 * @property {Any_Renderer} renderer        - {@link Renderer} interface
 * @property {string      } text            - Text to be added to the last token in the next flush
 * @property {string      } pending         - Characters for identifying tokens
 * @property {Uint32Array } tokens          - Current token and it's parents (a slice of a tree)
 * @property {number      } len             - Number of tokens in types without root
 * @property {number      } token           - Last token in the tree
 * @property {Uint8Array  } spaces
 * @property {string      } indent
 * @property {number      } indent_len
 * @property {0 | 1       } code_fence_body - For {@link Token.Code_Fence} parsing
 * @property {number      } backticks_count
 * @property {number      } blockquote_idx  - For Blockquote parsing
 * @property {string      } hr_char         - For horizontal rule parsing
 * @property {number      } hr_chars        - For horizontal rule parsing
 */

const TOKEN_ARRAY_CAP = 24

/**
 * Makes a new Parser object.
 * @param   {Any_Renderer} renderer
 * @returns {Parser      } */
export function parser(renderer) {
	const tokens = new Uint32Array(TOKEN_ARRAY_CAP)
	tokens[0] = DOCUMENT
	return {
		renderer  : renderer,
		text      : "",
		pending   : "",
		tokens    : tokens,
		len       : 0,
		token     : DOCUMENT,
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
 * @param   {Parser} p
 * @returns {void  } */
export function parser_end(p) {
	if (p.pending.length > 0) {
		parser_write(p, "\n")
	}
}

/**
 * @param   {Parser} p
 * @returns {void  } */
function add_text(p) {
	if (p.text.length === 0) return
	console.assert(p.len > 0, "Never adding text to root")
	p.renderer.add_text(p.renderer.data, p.text)
	p.text = ""
}

/**
 * @param   {Parser} p
 * @returns {void  } */
function end_token(p) {
	console.assert(p.len > 0, "No nodes to end")
	p.len -= 1
	p.token = /** @type {Token} */ (p.tokens[p.len])
	p.renderer.end_token(p.renderer.data)
}

/**
 * @param   {Parser} p
 * @param   {Token } token
 * @returns {void  } */
function add_token(p, token) {
	p.len += 1
	p.tokens[p.len] = token
	p.token = token
	p.renderer.add_token(p.renderer.data, token)
}

/**
 * @param   {Parser} p
 * @param   {number} token
 * @param   {number} start_idx
 * @returns {number} */
function idx_of_token(p, token, start_idx) {
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
 * @param   {Parser} p
 * @param   {number} len
 * @returns {void  } */
function end_tokens_to_len(p, len) {
	while (p.len > len) {
		end_token(p)
	}
}

/**
 * @param   {Parser } p
 * @param   {Token  } list_token
 * @returns {void   } */
function continue_or_add_list(p, list_token) {
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
		if (p.tokens[i] & LIST_ITEM) {
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
 * @param   {Parser } p
 * @param   {number } prefix_length
 * @returns {void   } */
function add_list_item(p, prefix_length) {
	add_token(p, LIST_ITEM)
	p.spaces[p.len] = p.indent_len + prefix_length
	clear_root_pending(p)
	p.token = MAYBE_TASK
}

/**
 * @param {Parser} p
 * @returns {void  } */
function clear_root_pending(p) {
	p.indent = ""
	p.indent_len = 0
	p.pending = ""
}

/**
 * @param {number} charcode
 * @returns {boolean} */
function is_digit(charcode) {
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
 * @param   {Parser} p
 * @param   {string} chunk
 * @returns {void  } */
export function parser_write(p, chunk) {
	for (const char of chunk) {
		const pending_with_char = p.pending + char
		
		/*
		Token specific checks
		*/
		switch (p.token) {
		case LINE_BREAK:
		case DOCUMENT:
		case BLOCKQUOTE:
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
					case 1: add_token(p, HEADING_1); clear_root_pending(p); continue
					case 2: add_token(p, HEADING_2); clear_root_pending(p); continue
					case 3: add_token(p, HEADING_3); clear_root_pending(p); continue
					case 4: add_token(p, HEADING_4); clear_root_pending(p); continue
					case 5: add_token(p, HEADING_5); clear_root_pending(p); continue
					case 6: add_token(p, HEADING_6); clear_root_pending(p); continue
					}
					console.assert(false, "Should not reach here")
				}
				break // fail
			/* Blockquote */
			case '>': {
				const next_blockquote_idx = idx_of_token(p, BLOCKQUOTE, p.blockquote_idx+1)
				
				/*
				Only when there is no blockquote to the right of blockquote_idx
				a new blockquote can be created
				*/
				if (next_blockquote_idx === -1) {
					end_tokens_to_len(p, p.blockquote_idx)
					p.blockquote_idx += 1
					p.backticks_count = 0
					add_token(p, BLOCKQUOTE)
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
						p.renderer.add_token(p.renderer.data, RULE)
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
					continue_or_add_list(p, LIST_UNORDERED)
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
						add_token(p, PARAGRAPH)
						clear_root_pending(p)
						p.backticks_count = 0
						parser_write(p, pending_with_char)
					}
					continue
				case '\n':
					/*  ```lang\n
								^
					*/
					add_token(p, CODE_FENCE)
					if (p.pending.length > p.backticks_count) {
						p.renderer.set_attr(p.renderer.data, LANG, p.pending.slice(p.backticks_count))
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

				continue_or_add_list(p, LIST_UNORDERED)
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

					continue_or_add_list(p, LIST_ORDERED)
					if (p.pending !== "1.") {
						p.renderer.set_attr(p.renderer.data, START, p.pending.slice(0, -1))
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
			if (p.token & LINE_BREAK) {
				/* Add a line break and continue in previous token */
				p.token = p.tokens[p.len]
				p.renderer.add_token(p.renderer.data, LINE_BREAK)
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
				add_token(p, CODE_BLOCK)
			}
			/* Paragraph */
			else {
				add_token(p, PARAGRAPH)
			}
			
			clear_root_pending(p)
			parser_write(p, to_write)
			continue
		case CODE_BLOCK:
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
		case CODE_FENCE:
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
		case CODE_INLINE:
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
				p.token = LINE_BREAK
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
		case MAYBE_TASK:
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
				p.renderer.add_token(p.renderer.data, CHECKBOX)
				if ('x' === p.pending[1]) {
					p.renderer.set_attr(p.renderer.data, CHECKED, "")
				}
				p.renderer.end_token(p.renderer.data)
				p.pending = " "
				continue
			}

			p.token = p.tokens[p.len]
			p.pending = ""
			parser_write(p, pending_with_char)
			continue
		case STRONG_AST:
		case STRONG_UND: {
			/** @type {string} */ let symbol = '*'
			/** @type {Token } */ let italic = ITALIC_AST
			if (p.token === STRONG_UND) {
				symbol = '_'
				italic = ITALIC_UND
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
		case ITALIC_AST:
		case ITALIC_UND: {
			/** @type {string} */ let symbol = '*'
			/** @type {Token } */ let strong = STRONG_AST
			if (p.token === ITALIC_UND) {
				symbol = '_'
				strong = STRONG_UND
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
		case STRIKE:
			if ("~~" === pending_with_char) {
				add_text(p)
				end_token(p)
				p.pending = ""
				continue
			}
			break
		/* Raw URLs */
		case MAYBE_URL:
			if ("http://"  === pending_with_char ||
				"https://" === pending_with_char
			) {
				add_text(p)
				add_token(p, RAW_URL)
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
		case LINK:
		case IMAGE:
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
					const type = p.token === LINK ? HREF : SRC
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
		case RAW_URL:
			/* http://example.com?
			                     ^
			*/
			if (' ' === char ||
			    '\n'=== char ||
			    '\\'=== char
			) {
				p.renderer.set_attr(p.renderer.data, HREF, p.pending)
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
			p.token = LINE_BREAK
			p.blockquote_idx = 0
			p.pending = char
			continue
		/* `Code Inline` */
		case '`':
			if (p.token & IMAGE) break

			if ('`' === char) {
				p.backticks_count += 1
				p.pending = pending_with_char
			} else {
				p.backticks_count += 1 // started at 0, and first wasn't counted
				add_text(p)
				add_token(p, CODE_INLINE)
				p.text = ' ' === char || '\n' === char ? "" : char // trim leading space
				p.pending = ""
			}
			continue
		case '_':
		case '*': {
			if (p.token & IMAGE) break

			/** @type {Token} */ let italic = ITALIC_AST
			/** @type {Token} */ let strong = STRONG_AST
			const symbol = p.pending[0]
			if ('_' === symbol) {
				italic = ITALIC_UND
				strong = STRONG_UND
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
			if (p.token & (IMAGE | STRIKE)) break

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
					add_token(p, STRIKE)
					p.pending = char
					continue
				}
			}

			break
		/* [Image](url) */
		case '[':
			if (!(p.token & (IMAGE | LINK)) &&
			    ']' !== char
			) {
				add_text(p)
				add_token(p, LINK)
				p.pending = char
				continue
			}
			break
		/* ![Image](url) */
		case '!':
			if (!(p.token & IMAGE) &&
			    '[' === char
			) {
				add_text(p)
				add_token(p, IMAGE)
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
		if (!(p.token & (IMAGE | LINK)) &&
		    'h' === char &&
		   (" " === p.pending ||
		    ""  === p.pending)
		) {
			p.text   += p.pending
			p.pending = char
			p.token = MAYBE_URL
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
 * @template T
 * @callback Renderer_Add_Token
 * @param   {T    } data
 * @param   {Token} type
 * @returns {void } */

/**
 * @template T
 * @callback Renderer_End_Token
 * @param   {T    } data
 * @returns {void } */

/**
 * @template T
 * @callback Renderer_Add_Text
 * @param   {T     } data
 * @param   {string} text
 * @returns {void  } */

/**
 * @template T
 * @callback Renderer_Set_Attr
 * @param   {T     } data
 * @param   {Attr  } type
 * @param   {string} value
 * @returns {void  } */

/**
 * The renderer interface.
 * @template T
 * @typedef  {object               } Renderer
 * @property {T                    } data
 * @property {Renderer_Add_Token<T>} add_token
 * @property {Renderer_End_Token<T>} end_token
 * @property {Renderer_Add_Text <T>} add_text
 * @property {Renderer_Set_Attr <T>} set_attr
 */

/** @typedef {Renderer<any>} Any_Renderer */


/**
 * @typedef  {object} Default_Renderer_Data
 * @property {HTMLElement[]} nodes
 * @property {number       } index
 *
 * @typedef {Renderer          <Default_Renderer_Data>} Default_Renderer
 * @typedef {Renderer_Add_Token<Default_Renderer_Data>} Default_Renderer_Add_Token
 * @typedef {Renderer_End_Token<Default_Renderer_Data>} Default_Renderer_End_Token
 * @typedef {Renderer_Add_Text <Default_Renderer_Data>} Default_Renderer_Add_Text
 * @typedef {Renderer_Set_Attr <Default_Renderer_Data>} Default_Renderer_Set_Attr
 */

/**
 * @param   {HTMLElement     } root
 * @returns {Default_Renderer} */
export function default_renderer(root) {
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

/** @type {Default_Renderer_Add_Token} */
export function default_add_token(data, type) {
	/**@type {HTMLElement}*/ let mount
	/**@type {HTMLElement}*/ let slot

	switch (type) {
	case DOCUMENT: return // document is provided
	case BLOCKQUOTE:    mount = slot = document.createElement("blockquote");break
	case PARAGRAPH:     mount = slot = document.createElement("p")         ;break
	case LINE_BREAK:    mount = slot = document.createElement("br")        ;break
	case RULE:          mount = slot = document.createElement("hr")        ;break
	case HEADING_1:     mount = slot = document.createElement("h1")        ;break
	case HEADING_2:     mount = slot = document.createElement("h2")        ;break
	case HEADING_3:     mount = slot = document.createElement("h3")        ;break
	case HEADING_4:     mount = slot = document.createElement("h4")        ;break
	case HEADING_5:     mount = slot = document.createElement("h5")        ;break
	case HEADING_6:     mount = slot = document.createElement("h6")        ;break
	case ITALIC_AST:
	case ITALIC_UND:    mount = slot = document.createElement("em")        ;break
	case STRONG_AST:
	case STRONG_UND:    mount = slot = document.createElement("strong")    ;break
	case STRIKE:        mount = slot = document.createElement("s")         ;break
	case CODE_INLINE:   mount = slot = document.createElement("code")      ;break
	case RAW_URL:
	case LINK:          mount = slot = document.createElement("a")         ;break
	case IMAGE:         mount = slot = document.createElement("img")       ;break
	case LIST_UNORDERED:mount = slot = document.createElement("ul")        ;break
	case LIST_ORDERED:  mount = slot = document.createElement("ol")        ;break
	case LIST_ITEM:     mount = slot = document.createElement("li")        ;break
	case CHECKBOX:
		const checkbox = document.createElement("input")
		checkbox.type = "checkbox"
		checkbox.disabled = true
		mount = slot = checkbox
		break
	case CODE_BLOCK:
	case CODE_FENCE:
		mount = document.createElement("pre")
		slot  = document.createElement("code")
		mount.appendChild(slot)
		break
	}

	data.nodes[data.index].appendChild(mount)
	data.index += 1
	data.nodes[data.index] = slot
}

/** @type {Default_Renderer_End_Token} */
export function default_end_token(data) {
	data.index -= 1
}

/** @type {Default_Renderer_Add_Text} */
export function default_add_text(data, text) {
	data.nodes[data.index].appendChild(document.createTextNode(text))
}

/** @type {Default_Renderer_Set_Attr} */
export function default_set_attr(data, type, value) {
	data.nodes[data.index].setAttribute(attr_to_html_attr(type), value)
}


/**
 * @typedef {undefined} Logger_Renderer_Data
 *
 * @typedef {Renderer          <Logger_Renderer_Data>} Logger_Renderer
 * @typedef {Renderer_Add_Token<Logger_Renderer_Data>} Logger_Renderer_Add_Token
 * @typedef {Renderer_End_Token<Logger_Renderer_Data>} Logger_Renderer_End_Token
 * @typedef {Renderer_Add_Text <Logger_Renderer_Data>} Logger_Renderer_Add_Text
 * @typedef {Renderer_Set_Attr <Logger_Renderer_Data>} Logger_Renderer_Set_Attr
 */

/** @returns {Logger_Renderer} */
export function logger_renderer() {
	return {
		data:      undefined,
		add_token: logger_add_token,
		end_token: logger_end_token,
		add_text:  logger_add_text,
		set_attr:  logger_set_attr,
	}
}

/** @type {Logger_Renderer_Add_Token} */
export function logger_add_token(data, type) {
	console.log("add_token:", token_to_string(type))
}

/** @type {Logger_Renderer_End_Token} */
export function logger_end_token(data) {
	console.log("end_token")
}

/** @type {Logger_Renderer_Add_Text} */
export function logger_add_text(data, text) {
	console.log('add_text: "%s"', text)
}

/** @type {Logger_Renderer_Set_Attr} */
export function logger_set_attr(data, type, value) {
	console.log('set_attr: %s="%s"', attr_to_html_attr(type), value)
}
