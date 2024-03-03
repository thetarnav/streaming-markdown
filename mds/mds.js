/*
Streaming Markdown Parser and Renderer
MIT License
Copyright 2024 Damian Tarnawski
https://github.com/thetarnav/streaming-markdown
*/

export * from "./t.js"

export const
	DOCUMENT        =       1, //  1
	PARAGRAPH       =       2, //  2
	HEADING_1       =       4, //  3
	HEADING_2       =       8, //  4
	HEADING_3       =      16, //  5
	HEADING_4       =      32, //  6
	HEADING_5       =      64, //  7
	HEADING_6       =     128, //  8
	CODE_BLOCK      =     256, //  9
	CODE_FENCE      =     512, // 10
	CODE_INLINE     =    1024, // 11
	ITALIC_AST      =    2048, // 12
	ITALIC_UND      =    4096, // 13
	STRONG_AST      =    8192, // 14
	STRONG_UND      =   16384, // 15
	STRIKE          =   32768, // 16
	LINK            =   65536, // 17
	IMAGE           =  131072, // 18
	BLOCKQUOTE      =  262144, // 19
	LINE_BREAK      =  524288, // 20
	HORIZONTAL_RULE = 1048576, // 21
	/** `HEADING_1 | HEADING_2 | HEADING_3 | HEADING_4 | HEADING_5 | HEADING_6` */
	ANY_HEADING     =     252,
	/** `CODE_BLOCK | CODE_FENCE | CODE_INLINE` */
	ANY_CODE        =    1792,
	/** `ITALIC_AST | ITALIC_UND` */
	ANY_ITALIC      =    6144,
	/** `STRONG_AST | STRONG_UND` */
	ANY_STRONG      =   24576,
	/** `STRONG_AST | ITALIC_AST` */
	ANY_AST         =   10240,
	/** `STRONG_UND | ITALIC_UND` */
	ANY_UND         =   20480,
	/** `ANY_CODE | IMAGE | HORIZONTAL_RULE` */
	NO_NESTING      = 1181440,
	/** `DOCUMENT | BLOCKQUOTE` */
	ANY_ROOT        =  262145

/** @enum {(typeof Token_Type)[keyof typeof Token_Type]} */
export const Token_Type = /** @type {const} */({
	Document:        DOCUMENT,
	Blockquote:      BLOCKQUOTE,
	Paragraph:       PARAGRAPH,
	Heading_1:       HEADING_1,
	Heading_2:       HEADING_2,
	Heading_3:       HEADING_3,
	Heading_4:       HEADING_4,
	Heading_5:       HEADING_5,
	Heading_6:       HEADING_6,
	Code_Block:      CODE_BLOCK,
	Code_Fence:      CODE_FENCE,
	Code_Inline:     CODE_INLINE,
	Italic_Ast:      ITALIC_AST,
	Italic_Und:      ITALIC_UND,
	Strong_Ast:      STRONG_AST,
	Strong_Und:      STRONG_UND,
	Strike:          STRIKE,
	Link:            LINK,
	Image:           IMAGE,
	Line_Break:      LINE_BREAK,
	Horizontal_Rule: HORIZONTAL_RULE,
})

/**
 * @param   {Token_Type} type
 * @returns {string    } */
export function token_type_to_string(type) {
	switch (type) {
	case DOCUMENT:        return "Document"
	case BLOCKQUOTE:      return "Blockquote"
	case PARAGRAPH:       return "Paragraph"
	case HEADING_1:       return "Heading_1"
	case HEADING_2:       return "Heading_2"
	case HEADING_3:       return "Heading_3"
	case HEADING_4:       return "Heading_4"
	case HEADING_5:       return "Heading_5"
	case HEADING_6:       return "Heading_6"
	case CODE_BLOCK:      return "Code_Block"
	case CODE_FENCE:      return "Code_Fence"
	case CODE_INLINE:     return "Code_Inline"
	case ITALIC_AST:      return "Italic_Ast"
	case ITALIC_UND:      return "Italic_Und"
	case STRONG_AST:      return "Strong_Ast"
	case STRONG_UND:      return "Strong_Und"
	case STRIKE:          return "Strike"
	case LINK:            return "Link"
	case IMAGE:           return "Image"
	case LINE_BREAK:      return "Line_Break"
	case HORIZONTAL_RULE: return "Horizontal_Rule"
	}
}

export const
	HREF = 1,
	SRC  = 2,
	LANG = 4

/** @enum {(typeof Attr_Type)[keyof typeof Attr_Type]} */
export const Attr_Type = /** @type {const} */({
	Href: HREF,
	Src:  SRC,
	Lang: LANG,
})

/**
 * @param   {Attr_Type} type
 * @returns {string    } */
export function attr_type_to_html_attr(type) {
	switch (type) {
	case HREF: return "href"
	case SRC : return "src"
	case LANG: return "lang"
	}
}

/**
 * @typedef {import("./t.js").Any_Renderer} Any_Renderer
 * @typedef {import("./t.js").Parser      } Parser
 */

/**
 * Makes a new Parser object.
 * @param   {Any_Renderer} renderer
 * @returns {Parser      } */
export function parser(renderer) {
	return {
		renderer  : renderer,
		text      : "",
		pending   : "",
		types     : /**@type {*}*/([DOCUMENT,,,,,]),
		len       : 0,
		code_fence: "",
		newline_blockquote_idx: 0,
		hr_char   : '',
		hr_chars  : 0,
	}
}

/**
 * Finish rendering the markdown - flushes any remaining text.
 * @param   {Parser} p
 * @returns {void  } */
export function parser_end(p) {
	parser_write(p, "\n")
	parser_add_text(p)
	while (p.len > 0) {
		parser_end_token(p)
	}
}

/**
 * @param   {Parser} p
 * @returns {void  } */
export function parser_add_text(p) {
	if (p.text.length === 0) return
	console.assert(p.len > 0, "Never adding text to root")
	p.renderer.add_text(p.renderer.data, p.text)
	p.text = ""
}

/**
 * @param   {Parser} p
 * @returns {void  } */
export function parser_end_token(p) {
	console.assert(p.len > 0, "No nodes to end")
	p.len -= 1
	p.renderer.end_node(p.renderer.data)
}

/**
 * @param   {Parser    } p
 * @param   {Token_Type} type
 * @returns {void      } */
export function parser_add_token(p, type) {
	p.len += 1
	p.types[p.len] = type
	p.renderer.add_node(p.renderer.data, type)
}

/**
 * Parse and render another chunk of markdown.
 * @param   {Parser} p
 * @param   {string} chunk
 * @returns {void  } */
export function parser_write(p, chunk) {
	chars:
	for (const char of chunk) {
		const pending_with_char = p.pending + char
		const in_token = p.types[p.len]

		/*
		Token specific checks
		*/
		switch (in_token) {
		case LINE_BREAK:
			console.assert(p.pending.length === 1, "Pending in line break should be one character")
			console.assert(p.text.length === 0, "Text when in line break")

			switch (p.pending) {
			case " ":
				p.pending = char
				continue
			case ">":
				p.pending = char

				while (p.newline_blockquote_idx+1 < p.len-1) {
					p.newline_blockquote_idx += 1
					if (p.types[p.newline_blockquote_idx] === BLOCKQUOTE) {
						continue chars
					}
				}

				p.len -= 1 // remove the line break

				while (p.newline_blockquote_idx < p.len) {
					parser_end_token(p)
				}

				p.newline_blockquote_idx += 1
				parser_add_token(p, BLOCKQUOTE)
				continue
			case "\n":
				p.len -= 1 // remove the line break

				while (p.newline_blockquote_idx < p.len) {
					parser_end_token(p)
				}
				p.newline_blockquote_idx = 0
				p.pending = char
				continue
			default:
				p.len -= 1 // remove the line break
				p.renderer.add_node(p.renderer.data, LINE_BREAK)
				p.renderer.end_node(p.renderer.data)
				parser_write(p, char)
				continue
			}
		case DOCUMENT:
		case BLOCKQUOTE:
			console.assert(p.text.length === 0, "Root should not have any text")

			switch (pending_with_char) {
			case "# ":      p.pending=""; parser_add_token(p, HEADING_1)  ;continue
			case "## ":     p.pending=""; parser_add_token(p, HEADING_2)  ;continue
			case "### ":    p.pending=""; parser_add_token(p, HEADING_3)  ;continue
			case "#### ":   p.pending=""; parser_add_token(p, HEADING_4)  ;continue
			case "##### ":  p.pending=""; parser_add_token(p, HEADING_5)  ;continue
			case "###### ": p.pending=""; parser_add_token(p, HEADING_6)  ;continue
			case "```":     p.pending=""; parser_add_token(p, CODE_FENCE) ;continue
			case "    ":
			case "   \t":
			case "  \t":
			case " \t":
			case "\t":      p.pending=""; parser_add_token(p, CODE_BLOCK) ;continue
			case "#":
			case "##":
			case "###":
			case "####":
			case "#####":
			case "######":
			case "#######":
			case "`":
			case "``":
			case " ":
			case "  ":
			case "   ":
				p.pending = pending_with_char
				continue
			case "\n":
				continue
			case "> ":
			case ">":
				p.pending = ""

				while (p.newline_blockquote_idx+1 <= p.len) {
					p.newline_blockquote_idx += 1
					if (p.types[p.newline_blockquote_idx] === BLOCKQUOTE) {
						continue chars
					}
				}

				p.newline_blockquote_idx += 1
				parser_add_token(p, BLOCKQUOTE)
				continue
			}

			switch (p.pending) {
			/* `Code Inline` */
			case "`":
				parser_add_token(p, PARAGRAPH)
				parser_add_token(p, CODE_INLINE)
				p.pending = ""
				p.text = char
				continue
			/* Trim leading spaces */
			case " ":
			case "  ":
			case "   ":
			case "":
				p.pending = char
				continue
			default:
				console.assert(' ' !== p.pending[0], "Pending should not start with space")

				/* Horizontal Rule
				   "-- - --- - --"
				*/
				if (p.hr_chars === 0 &&
				   ('-' === p.pending ||
				    '*' === p.pending ||
				    '_' === p.pending)
				) {
					p.hr_chars = 1
					p.hr_char = p.pending
				}

				if (p.hr_chars > 0) {
					switch (char) {
					case p.hr_char:
						p.hr_chars += 1
						p.pending += char
						continue
					case ' ':
						p.pending += char
						continue
					case '\n':
						if (p.hr_chars < 3) break
						p.renderer.add_node(p.renderer.data, HORIZONTAL_RULE)
						p.renderer.end_node(p.renderer.data)
						p.pending = ""
						p.hr_chars = 0
						parser_write(p, char)
						continue
					}

					p.hr_chars = 0
				}
				
				p.pending = ""
				parser_add_token(p, PARAGRAPH)
				/* The whole pending text needs to be reprocessed */
				parser_write(p, pending_with_char)
				continue
			}
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
					parser_add_text(p)
					parser_end_token(p)
					p.pending = char
				} else {
					p.text += char
				}
				continue
			}
		case CODE_FENCE: {
			switch (p.code_fence) {
			case 1: /* can end */
				switch (pending_with_char) {
				case "\n```":
				case "```":
					p.code_fence = ""
					parser_add_text(p)
					parser_end_token(p)
					p.pending = ""
					continue
				case "\n``":
				case "\n`":
				case "``":
				case "`":
					p.pending = pending_with_char
					continue
				}

				if ('\n' === char) {
					p.text += p.pending
					p.pending = char
				} else {
					p.code_fence = 0
					p.text += pending_with_char
					p.pending = ""
				}
				continue
			case 0: /* can't end */
				console.assert(p.pending.length === 0, "Has pending text but cannot end")

				if ('\n' === char) {
					p.code_fence = 1
					p.pending = char
				} else {
					p.text += p.pending + char
					p.pending = ""
				}
				continue
			default: /* parsing langiage */
				if ('\n' === char) {
					p.renderer.set_attr(p.renderer.data, LANG, p.code_fence)
					p.code_fence = 1
				} else {
					p.code_fence += char
				}
				continue
			}
		}
		case CODE_INLINE: {
			if ('\n' === char && p.pending.length === 0) {
				p.pending = char
				continue
			}
			if ('`' === p.pending) {
				parser_add_text(p)
				parser_end_token(p)
				p.pending = ""
				continue
			}
			if ('`' === char) {
				p.text += p.pending
				parser_add_text(p)
				parser_end_token(p)
				p.pending = ""
				continue
			}
			break
		}
		case STRONG_AST:
		case STRONG_UND: {
			/** @type {string    } */ let symbol = '*'
			/** @type {Token_Type} */ let italic = ITALIC_AST
			if (in_token === STRONG_UND) {
				symbol = '_'
				italic = ITALIC_UND
			}
			if (symbol === p.pending) {
				parser_add_text(p)
				if (symbol === char) {
					parser_end_token(p)
					p.pending = ""
				} else {
					parser_add_token(p, italic)
					p.pending = char
				}
				continue
			}
			break
		}
		case ITALIC_AST:
		case ITALIC_UND: {
			/** @type {string    } */ let symbol = '*'
			/** @type {Token_Type} */ let strong = STRONG_AST
			if (in_token === ITALIC_UND) {
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
					if (p.types[p.len-1] === strong) {
						p.pending = pending_with_char
					}
					/* *em**bold
					       ^
					*/
					else {
						parser_add_text(p)
						parser_add_token(p, strong)
						p.pending = ""
					}
				}
				/* *em*foo
					   ^
				*/
				else {
					parser_add_text(p)
					parser_end_token(p)
					p.pending = char
				}
				continue
			case symbol+symbol:
				parser_add_text(p)
				parser_end_token(p)
				parser_end_token(p)
				/* ***bold>em**em* or **bold*bold>em***
				               ^                      ^
				*/
				if (symbol !== char) {
					parser_add_token(p, in_token)
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
				parser_add_text(p)
				parser_end_token(p)
				p.pending = ""
				continue
			}
			break
		case LINK:
		case IMAGE:
			if ("]" === p.pending) {
				/*
				[Link](url)
					 ^
				*/
				parser_add_text(p)
				if ('(' === char) {
					p.pending = pending_with_char
				} else {
					parser_end_token(p)
					p.pending = char
				}
				continue
			}
			if (p.pending[0] === ']' &&
				p.pending[1] === '(') {
				/*
				[Link](url)
						  ^
				*/
				if (')' === char) {
					const type = in_token === LINK ? HREF : SRC
					const url = p.pending.slice(2)
					p.renderer.set_attr(p.renderer.data, type, url)
					parser_end_token(p)
					p.pending = ""
				} else {
					p.pending += char
				}
				continue
			}
			break
		}

		/*
		Common checks
		*/
		switch (p.pending) {
		/* Escape character */
		case "\\":
			if (in_token & ANY_CODE) break

			if ('\n' === char) {
				// Escaped newline has the same affect as unescaped one
				p.pending = char
			} else {
				const char_code = char.charCodeAt(0)
				p.pending = ""
				p.text += (char_code >= 48 && char_code <= 57) || // 0-9
				          (char_code >= 65 && char_code <= 90) || // A-Z
				          (char_code >= 97 && char_code <= 122)   // a-z
				          ? pending_with_char
				          : char
			}
			continue
		/* Newline */
		case "\n":
			/* Add Line_Break temporarily */
			p.len += 1
			p.types[p.len] = LINE_BREAK
			p.newline_blockquote_idx = 0
			p.pending = char
			parser_add_text(p)
			continue
		/* `Code Inline` */
		case "`":
			if (!(in_token & NO_NESTING) &&
				'`' !== char
			) {
				parser_add_text(p)
				parser_add_token(p, CODE_INLINE)
				p.text = char
				p.pending = ""
				continue
			}
			break
		case "*":
			if (in_token & (NO_NESTING | ANY_AST)) break

			parser_add_text(p)
			/* **Strong** */
			if ('*' === char) {
				parser_add_token(p, STRONG_AST)
				p.pending = ""
			}
			/* *Em* */
			else {
				parser_add_token(p, ITALIC_AST)
				p.pending = char
			}
			continue
		case "_":
			if (in_token & (NO_NESTING | ANY_UND)) break

			parser_add_text(p)
			/* __Strong__ */
			if ('_' === char) {
				parser_add_token(p, STRONG_UND)
				p.pending = ""
			}
			/* _Em_ */
			else {
				parser_add_token(p, ITALIC_UND)
				p.pending = char
			}
			continue
		/* ~~Strike~~ */
		case "~":
			if (!(in_token & (NO_NESTING | STRIKE)) &&
				'~' === char
			) {
				parser_add_text(p)
				parser_add_token(p, STRIKE)
				p.pending = ""
				continue
			}
			break
		/* [Image](url) */
		case "[":
			if (!(in_token & (NO_NESTING | LINK)) &&
				']' !== char
			) {
				parser_add_text(p)
				parser_add_token(p, LINK)
				p.pending = char
				continue
			}
			break
		/* ![Image](url) */
		case "!":
			if (!(in_token & NO_NESTING) &&
				'[' === char
			) {
				parser_add_text(p)
				parser_add_token(p, IMAGE)
				p.pending = ""
				continue
			}
			break
		case " ":
			if (char === " ") {
				continue
			}
			break
		}

		/*
		No check hit
		*/
		switch (in_token) {
		case CODE_INLINE:
			p.text += p.pending + char
			p.pending = ""
			break
		default:
			p.text += p.pending
			p.pending = char
			break
		}
	}

	parser_add_text(p)
}

/**
 * @typedef {import("./t.js").Default_Renderer         } Default_Renderer
 * @typedef {import("./t.js").Default_Renderer_Add_Node} Default_Renderer_Add_Node
 * @typedef {import("./t.js").Default_Renderer_End_Node} Default_Renderer_End_Node
 * @typedef {import("./t.js").Default_Renderer_Add_Text} Default_Renderer_Add_Text
 * @typedef {import("./t.js").Default_Renderer_Set_Attr} Default_Renderer_Set_Attr
 */

/**
 * @param   {HTMLElement     } root
 * @returns {Default_Renderer} */
export function default_renderer(root) {
	return {
		add_node: default_add_node,
		end_node: default_end_node,
		add_text: default_add_text,
		set_attr: default_set_attr,
		data    : {
			nodes: /**@type {*}*/([root,,,,,]),
			index: 0,
		},
	}
}

/** @type {Default_Renderer_Add_Node} */
export function default_add_node(data, type) {
	/**@type {HTMLElement}*/ let mount
	/**@type {HTMLElement}*/ let slot

	switch (type) {
	case DOCUMENT: return // document is provided
	case BLOCKQUOTE:     mount = slot = document.createElement("blockquote");break
	case PARAGRAPH:      mount = slot = document.createElement("p")         ;break
	case LINE_BREAK:     mount = slot = document.createElement("br")        ;break
	case HORIZONTAL_RULE:mount = slot = document.createElement("hr")        ;break
	case HEADING_1:      mount = slot = document.createElement("h1")        ;break
	case HEADING_2:      mount = slot = document.createElement("h2")        ;break
	case HEADING_3:      mount = slot = document.createElement("h3")        ;break
	case HEADING_4:      mount = slot = document.createElement("h4")        ;break
	case HEADING_5:      mount = slot = document.createElement("h5")        ;break
	case HEADING_6:      mount = slot = document.createElement("h6")        ;break
	case ITALIC_AST:
	case ITALIC_UND:     mount = slot = document.createElement("em")        ;break
	case STRONG_AST:
	case STRONG_UND:     mount = slot = document.createElement("strong")    ;break
	case STRIKE:         mount = slot = document.createElement("s")         ;break
	case CODE_INLINE:    mount = slot = document.createElement("code")      ;break
	case LINK:           mount = slot = document.createElement("a")         ;break
	case IMAGE:          mount = slot = document.createElement("img")       ;break
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

/** @type {Default_Renderer_End_Node} */
export function default_end_node(data) {
	data.index -= 1
}

/** @type {Default_Renderer_Add_Text} */
export function default_add_text(data, text) {
	data.nodes[data.index].appendChild(document.createTextNode(text))
}

/** @type {Default_Renderer_Set_Attr} */
export function default_set_attr(data, type, value) {
	data.nodes[data.index].setAttribute(attr_type_to_html_attr(type), value)
}


/**
 * @typedef {import("./t.js").Logger_Renderer         } Logger_Renderer
 * @typedef {import("./t.js").Logger_Renderer_Add_Node} Logger_Renderer_Add_Node
 * @typedef {import("./t.js").Logger_Renderer_End_Node} Logger_Renderer_End_Node
 * @typedef {import("./t.js").Logger_Renderer_Add_Text} Logger_Renderer_Add_Text
 * @typedef {import("./t.js").Logger_Renderer_Set_Attr} Logger_Renderer_Set_Attr
 */

/** @returns {Logger_Renderer} */
export function logger_renderer() {
	return {
		data: undefined,
		add_node: logger_add_node,
		end_node: logger_end_node,
		add_text: logger_add_text,
		set_attr: logger_set_attr,
	}
}

/** @type {Logger_Renderer_Add_Node} */
export function logger_add_node(data, type) {
	console.log("add_node:", token_type_to_string(type))
}

/** @type {Logger_Renderer_End_Node} */
export function logger_end_node(data) {
	console.log("end_node")
}

/** @type {Logger_Renderer_Add_Text} */
export function logger_add_text(data, text) {
	console.log('add_text: "%s"', text)
}

/** @type {Logger_Renderer_Set_Attr} */
export function logger_set_attr(data, type, value) {
	console.log('set_attr: %s="%s"', attr_type_to_html_attr(type), value)
}
