export * from "./types.js"

export const
    ROOT        = 1,
    PARAGRAPH   = 2,
    HEADING_1   = 4,
    HEADING_2   = 8,
    HEADING_3   = 16,
    HEADING_4   = 32,
    HEADING_5   = 64,
    HEADING_6   = 128,
    ITALIC_AST  = 256,
    ITALIC_UND  = 512,
    STRONG_AST  = 1024,
    STRONG_UND  = 2048,
    CODE_INLINE = 4096,
    CODE_BLOCK  = 8192,
	LINK		= 16384,
	/** `STRONG_AST | ITALIC_AST` */
	ASTERISK 	= 1280,
	/** `STRONG_UND | ITALIC_UND` */
	UNDERSCORE 	= 2560,
	/** `CODE_INLINE | CODE_BLOCK` */
	CODE        = 12288,
    /** `HEADING_1 | HEADING_2 | HEADING_3 | HEADING_4 | HEADING_5 | HEADING_6` */
    HEADING     = 252,
    /** `ITALIC_AST | ITALIC_UND` */
    ITALIC      = 768,
    /** `STRONG_AST | STRONG_UND` */
    STRONG      = 3072

/** @enum {(typeof Token_Type)[keyof typeof Token_Type]} */
export const Token_Type = /** @type {const} */({
    Root:        ROOT,
    Paragraph:   PARAGRAPH,
    Heading_1:   HEADING_1,
    Heading_2:   HEADING_2,
    Heading_3:   HEADING_3,
    Heading_4:   HEADING_4,
    Heading_5:   HEADING_5,
    Heading_6:   HEADING_6,
    Italic_Ast:  ITALIC_AST,
    Italic_Und:  ITALIC_UND,
    Strong_Ast:  STRONG_AST,
    Strong_Und:  STRONG_UND,
    Code_Inline: CODE_INLINE,
    Code_Block:  CODE_BLOCK,
	Link:        LINK,
})

/**
 * @param   {Token_Type} type
 * @returns {string    } */
export function token_type_to_string(type) {
    switch (type) {
    case ROOT:       return "Root"
    case PARAGRAPH:  return "Paragraph"
    case HEADING_1:  return "Heading_1"
    case HEADING_2:  return "Heading_2"
    case HEADING_3:  return "Heading_3"
    case HEADING_4:  return "Heading_4"
    case HEADING_5:  return "Heading_5"
    case HEADING_6:  return "Heading_6"
    case ITALIC_AST: return "Italic_Ast"
    case ITALIC_UND: return "Italic_Und"
    case STRONG_AST: return "Strong_Ast"
    case STRONG_UND: return "Strong_Und"
    case CODE_INLINE:return "Code_Inline"
    case CODE_BLOCK: return "Code_Block"
	case LINK:       return "Link"
    }
}

/**
 * @typedef {import("./types.js").Any_Renderer} Any_Renderer
 * @typedef {import("./types.js").Parser      } Parser
 */

/**
 * Makes a new Parser object.
 * @param   {Any_Renderer} renderer
 * @returns {Parser      } */
export function parser(renderer) {
    return {
		renderer       : renderer,
		text           : "",
		pending		   : "",
		types          : /**@type {*}*/([ROOT,,,,,]),
		len            : 0,
		code_block_lang: "",
	}
}

/**
 * Finish rendering the markdown.
 * Resets the state of the stream and flushes any remaining text.
 * @param   {Parser} p
 * @returns {void  } */
export function parser_end(p) {
	// p.text += p.pending
	parser_write(p, "\n")
	// p.text += p.pending
	if (p.text.length > 0) {
		// if (p.text[p.text.length-1] !== '\n') {
		// 	write(p, "\n")
		// } else {

		// }
		p.renderer.add_text(p.text, p.renderer.data)
	}
    p.text = ""
	p.pending = ""
    p.code_block_lang = null
    p.len = 0
}

/**
 * @param   {Parser} p
 * @returns {void  } */
export function parser_add_text(p) {
	if (p.text.length === 0) return
	p.renderer.add_text(p.text, p.renderer.data)
	p.text = ""
}

/**
 * @param   {Parser} p
 * @returns {void  } */
export function parser_end_token(p) {
	p.len -= 1
	p.renderer.end_node(p.renderer.data)
	p.pending = ""
}

/**
 * @param   {Parser    } p
 * @param   {Token_Type} type
 * @returns {void      } */
export function parser_add_token(p, type) {
	p.pending = ""
    p.len += 1
    p.types[p.len] = type
    p.renderer.add_node(type, p.renderer.data)
}

/**
 * @param   {Parser} p
 * @returns {void  } */
export function parser_add_paragraph(p) {
    if (p.len === 0) parser_add_token(p, PARAGRAPH)
}

/**
 * @param   {string} char
 * @returns {string} */
function escape(char) {
	const char_code = char.charCodeAt(0)
	return (char_code >= 48 && char_code <= 90) ||
		   (char_code >= 97 && char_code <= 122)
		? '\\' + char
		: char
}

/**
 * Parse and render another chunk of markdown.
 * @param   {Parser} p
 * @param   {string} chunk
 * @returns {void  } */
export function parser_write(p, chunk) {
    for (const char of chunk) {
        const in_token = p.types[p.len]
		const pending_with_char = p.pending + char

		/*
		Token specific checks
		*/
		switch (in_token) {
		case ROOT: {
			switch (pending_with_char) {
			case "# ":      parser_add_token(p, HEADING_1)  ;continue
			case "## ":     parser_add_token(p, HEADING_2)  ;continue
			case "### ":    parser_add_token(p, HEADING_3)  ;continue
			case "#### ":   parser_add_token(p, HEADING_4)  ;continue
			case "##### ":  parser_add_token(p, HEADING_5)  ;continue
			case "###### ": parser_add_token(p, HEADING_6)  ;continue
			case "```":     parser_add_token(p, CODE_BLOCK) ;continue
			case "#":
			case "##":
			case "###":
			case "####":
			case "#####":
			case "######":
			case "#######":
			case "`":
			case "``":
				p.pending = pending_with_char
				continue
			case "\n":
				continue
			}

			parser_add_token(p, PARAGRAPH)
			p.text = p.pending
			p.pending = char
			continue
		}
		case CODE_BLOCK: {
			if (p.code_block_lang !== null) {
				p.code_block_lang = '\n' === char ? null : p.code_block_lang + char
				continue
			}

			switch (pending_with_char) {
			case "\n```":
				p.code_block_lang = ""
				parser_add_text(p)
				parser_end_token(p)
				continue
			case "\n``":
			case "\n`":
			case "\n":
				p.pending = pending_with_char
				continue
			}

			if (p.text === "") {
				switch (pending_with_char) {
				case "```":
					p.code_block_lang = ""
					parser_add_text(p)
					parser_end_token(p)
					continue
				case "``":
				case "`":
					p.pending = pending_with_char
					continue
				}
			}

			p.text += pending_with_char
			p.pending = ""
			continue
		}
		case CODE_INLINE: {
			if ("\n" === p.pending) {
				parser_add_text(p)

				switch (char) {
				case '\n':
					while (p.len > 0) parser_end_token(p)
					continue
				case '`':
					p.renderer.add_text('\n', p.renderer.data)
					parser_end_token(p)
					continue
				default:
					p.renderer.add_text('\n', p.renderer.data)
					continue
				}
			}

			switch (char) {
			case '\n':
				p.pending = "\n"
				continue
			case '`':
				p.text += p.pending
				p.pending = ""
				parser_add_text(p)
				parser_end_token(p)
				continue
			default:
				p.text += p.pending + char
				p.pending = ""
				continue
			}
		}
		case STRONG_AST:
			if ("*" === p.pending) {
				parser_add_text(p)
				if ('*' === char) {
					parser_end_token(p)
				} else {
					parser_add_token(p, ITALIC_AST)
					p.pending = char
				}
				continue
			}
            break
        case STRONG_UND:
            if ("_" === p.pending) {
				parser_add_text(p)
				if ('_' === char) {
					parser_end_token(p)
				} else {
					parser_add_token(p, ITALIC_UND)
					p.pending = char
				}
				continue
			}
			break
        case ITALIC_AST:
			if ("*" === p.pending) {
				parser_add_text(p)
				if ('*' === char) {
					parser_add_token(p, STRONG_AST)
				} else {
					parser_end_token(p)
					p.pending = char
				}
				continue
			}
			break
        case ITALIC_UND:
            if ("_" === p.pending) {
				parser_add_text(p)
				if ('_' === char) {
					parser_add_token(p, STRONG_UND)
				} else {
					parser_end_token(p)
					p.pending = char
				}
				continue
			}
            break
		case LINK:
			if (']' === p.pending) {
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
			if (p.pending[0] === "]" &&
				p.pending[1] === "(") {
				/*
				[Link](url)
						  ^
				*/
				if (')' === char) {
					parser_end_token(p)
				} else {
					p.pending += char
				}
				continue
			}
			break
		}

		/*
        Escape character
        */
		if ("\\" === p.pending) {
			p.text += escape(char)
			p.pending = ""
			continue
		}

        /* Newline */
		if ('\n' === p.pending[0]) {
			parser_add_text(p)
			if ('\n' === char) {
				while (p.len > 0) parser_end_token(p)
			} else {
				p.renderer.add_text('\n', p.renderer.data)
				p.pending = char
			}
			continue
		}

        /* `Code Inline` */
        if ('`' === p.pending &&
			"\n"!== char &&
			'`' !== char
		) {
            parser_add_text(p)
            parser_add_token(p, CODE_INLINE)
            p.pending = char
            continue
        }

        if (in_token ^ ASTERISK) {
			/* **Strong** */
			if ("**" === pending_with_char) {
				parser_add_text(p)
				parser_add_token(p, STRONG_AST)
				continue
			}
			/* *Em* */
			if ("*" === p.pending &&
				"\n"!== char
			) {
				parser_add_text(p)
				parser_add_token(p, ITALIC_AST)
				p.pending = char
				continue
			}
		}

		if (in_token ^ UNDERSCORE) {
			/* __Strong__ */
			if ("__" === pending_with_char) {
				parser_add_text(p)
				parser_add_token(p, STRONG_UND)
				continue
			}
			/* _Em_ */
			if ("_" === p.pending &&
				"\n"!== char
			) {
				parser_add_text(p)
				parser_add_token(p, ITALIC_UND)
				p.pending = char
				continue
			}
		}

		/* [Link](url) */
		if (in_token !== LINK &&
			"[" === p.pending &&
			"\n"!== char &&
			"]" !== char
		) {
			parser_add_text(p)
			parser_add_token(p, LINK)
			p.pending = char
			continue
		}

		/*
		No check hit
		*/
		p.text += p.pending
		p.pending = char
    }

    parser_add_text(p)
}

/**
 * @typedef {import("./types.js").Default_Renderer         } Default_Renderer
 * @typedef {import("./types.js").Default_Renderer_Node    } Default_Renderer_Node
 * @typedef {import("./types.js").Default_Renderer_Add_Node} Default_Renderer_Add_Node
 * @typedef {import("./types.js").Default_Renderer_End_Node} Default_Renderer_End_Node
 * @typedef {import("./types.js").Default_Renderer_Add_Text} Default_Renderer_Add_Text
 */

/**
 * @param   {HTMLElement     } root
 * @returns {Default_Renderer} */
export function default_renderer(root) {
    return {
        add_node: default_add_node,
        end_node: default_end_node,
        add_text: default_add_text,
        data    : {
            node: {
				slot  : root,
				parent: null,
			},
        },
    }
}

/** @type {Default_Renderer_Add_Node} */
export function default_add_node(type, data) {
    /**@type {HTMLElement}*/ let mount
    /**@type {HTMLElement}*/ let slot

    switch (type) {
    case ROOT: return // node is already root
    case PARAGRAPH:  mount = slot = document.createElement("p")     ;break
    case HEADING_1:  mount = slot = document.createElement("h1")    ;break
    case HEADING_2:  mount = slot = document.createElement("h2")    ;break
    case HEADING_3:  mount = slot = document.createElement("h3")    ;break
    case HEADING_4:  mount = slot = document.createElement("h4")    ;break
    case HEADING_5:  mount = slot = document.createElement("h5")    ;break
    case HEADING_6:  mount = slot = document.createElement("h6")    ;break
    case ITALIC_AST:
    case ITALIC_UND: mount = slot = document.createElement("em")    ;break
    case STRONG_AST:
    case STRONG_UND: mount = slot = document.createElement("strong");break
    case CODE_INLINE:mount = slot = document.createElement("code")  ;break
	case LINK:       mount = slot = document.createElement("a")     ;break
    case CODE_BLOCK:
        mount = document.createElement("pre")
        slot = mount.appendChild(document.createElement("code"))
        break
    }

    data.node.slot.appendChild(mount)
    data.node = {
		slot: slot,
		parent: data.node,
	}
}

/** @type {Default_Renderer_End_Node} */
export function default_end_node(data) {
	data.node = /**@type {Default_Renderer_Node}*/(data.node.parent)
}

/** @type {Default_Renderer_Add_Text} */
export function default_add_text(text, data) {
	switch (text) {
	case ""  : break
	case "\n": data.node.slot.appendChild(document.createElement("br")); break
	default  : data.node.slot.appendChild(document.createTextNode(text))
	}
}


/**
 * @typedef {import("./types.js").Logger_Renderer         } Logger_Renderer
 * @typedef {import("./types.js").Logger_Renderer_Add_Node} Logger_Renderer_Add_Node
 * @typedef {import("./types.js").Logger_Renderer_End_Node} Logger_Renderer_End_Node
 * @typedef {import("./types.js").Logger_Renderer_Add_Text} Logger_Renderer_Add_Text
 */

/** @returns {Logger_Renderer} */
export function logger_renderer() {
	return {
		data: undefined,
		add_node: logger_add_node,
		end_node: logger_end_node,
		add_text: logger_add_text,
	}
}

/** @type {Logger_Renderer_Add_Node} */
export function logger_add_node(type, data) {
	console.log("add_node:", token_type_to_string(type))
}

/** @type {Logger_Renderer_End_Node} */
export function logger_end_node(data) {
	console.log("end_node")
}

/** @type {Logger_Renderer_Add_Text} */
export function logger_add_text(text, data) {
	console.log('add_text: "' + text + '"')
}
