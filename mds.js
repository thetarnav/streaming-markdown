export * from "./types.js"

export const
    ROOT       = 1,
    PARAGRAPH  = 2,
    HEADING_1  = 4,
    HEADING_2  = 8,
    HEADING_3  = 16,
    HEADING_4  = 32,
    HEADING_5  = 64,
    HEADING_6  = 128,
    ITALIC_AST = 256,
    ITALIC_UND = 512,
    STRONG_AST = 1024,
    STRONG_UND = 2048,
    CODE       = 4096,
    CODE_BLOCK = 8192,
    /** HEADING_1 | HEADING_2 | HEADING_3 | HEADING_4 | HEADING_5 | HEADING_6 */
    HEADING    = 252,
    /** ITALIC_AST | ITALIC_UND */
    ITALIC     = 768,
    /** STRONG_AST | STRONG_UND */
    STRONG     = 3072

/** @enum {(typeof Token_Type)[keyof typeof Token_Type]} */
export const Token_Type = /** @type {const} */({
    Root:       ROOT,
    Italic_Ast: ITALIC_AST,
    Italic_Und: ITALIC_UND,
    Strong_Ast: STRONG_AST,
    Strong_Und: STRONG_UND,
    Code:       CODE,
    Code_Block: CODE_BLOCK,
    Paragraph:  PARAGRAPH,
    Heading_1:  HEADING_1,
    Heading_2:  HEADING_2,
    Heading_3:  HEADING_3,
    Heading_4:  HEADING_4,
    Heading_5:  HEADING_5,
    Heading_6:  HEADING_6,
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
    case CODE:       return "Code"
    case CODE_BLOCK: return "Code_Block"
    }
}

/** @param {import("./types.js").Renderer<any, any>} renderer */
export function Parser(renderer) {
    const root = renderer.create_node(renderer.data, ROOT, null)
    this.renderer        = renderer
    this.txt             =/**@type {string       }*/("")
    this.src             =/**@type {string       }*/("")
    this.idx             =/**@type {number       }*/(0)
    this.nodes           =/**@type {any[]        }*/([root,,,,,])
    this.types           =/**@type {Token_Type[] }*/([ROOT,,,,,])
    this.len             =/**@type {number       }*/(0)
    this.code_block_lang =/**@type {string | null}*/(null) // TODO remove
}

/**
 * Makes a new Stream object.
 * @param   {import("./types.js").Renderer<any, any>} renderer
 * @returns {Parser} */
export function parser(renderer) {
    return new Parser(renderer)
}

/**
 * Finish rendering the markdown.
 * Resets the state of the stream and flushes any remaining text.
 * @param   {Parser} s
 * @returns {void  } */
export function end(s) {
    // TODO
    // s.tokens_node[s.tokens_len].removeChild(s.temp_span)
	if (s.txt.length > 0) {
		if (s.txt[s.txt.length-1] !== '\n') {
			write(s, "\n")
		} else {
			flush(s)
		}
	}
    s.idx = 0
    s.src = ""
    s.txt = ""
    s.code_block_lang = null
    s.nodes.fill(null)
    s.len = 0
}

/**
 * @param   {Parser} s
 * @returns {void  } */
export function flush(s) {
	if (s.txt.length === 0) return
	s.renderer.update_node(s.renderer.data, s.nodes[s.len], s.txt)
	s.txt = ""
}

/**
 * @param   {Parser} s
 * @returns {void  } */
export function end_token(s) {
    s.len = Math.max(0, s.len-1)
}

/**
 * @param   {Parser    } s
 * @param   {Token_Type} type
 * @returns {void      } */
export function add_token(s, type) {
    const parent = s.nodes[s.len]
    s.len += 1
    s.nodes[s.len] = s.renderer.create_node(s.renderer.data, type, parent)
    s.types[s.len] = type
}

/**
 * @param   {Parser} s
 * @returns {void  } */
export function add_paragraph(s) {
    if (s.len === 0) add_token(s, PARAGRAPH)
}

/**
 * Parse and render another chunk of markdown.
 * @param   {Parser} s
 * @param   {string} chunk
 * @returns {void  } */
export function write(s, chunk) {
    for (s.src += chunk; s.idx < s.src.length; s.idx += 1)
    {
        const last_last_txt_char = s.txt[s.txt.length-2]
        const last_last_src_char = s.src[s.idx-2]
        const last_txt_char      = s.txt[s.txt.length-1]
		const last_src_char      = s.src[s.idx-1]
        const char               = s.src[s.idx]
        const in_token           = s.types[s.len]

		/*
		Escape character
		*/
		if (in_token !== CODE_BLOCK &&
			in_token !== CODE &&
			last_txt_char === '\\' &&
			last_last_src_char !== '\\' &&
			('\\' === char || '*' === char || '_' === char || '`' === char)
		) {
			s.txt = s.txt.slice(0, -1)
			s.txt += char
			continue
		}

        /*
        Token specific checks
        */
        switch (in_token) {
        case CODE_BLOCK:
            if (s.code_block_lang !== null) {
                if (char === '\n') {
                    s.code_block_lang = null
                } else {
                    s.code_block_lang += char
                }
                continue
            }

            if (char === '`' &&
				s.txt === "``" ||
				(s.txt.length >= 4 &&
                '\n'=== s.txt[s.txt.length-3] &&
                '`' === last_last_txt_char &&
                '`' === last_txt_char)
            ) {
                s.code_block_lang = null
                s.txt = s.txt.slice(0, -3)
                flush(s)
                end_token(s)
                continue
            }

            s.txt += char
            continue
        case CODE:
            if ('`' === char) {
                flush(s)
                end_token(s)
                continue
            }
            break
        case STRONG_AST:
            if ('\\'!== last_last_src_char &&
				'*' === last_txt_char &&
                '*' === char
            ) {
                s.txt = s.txt.slice(0, -1)
                flush(s)
                end_token(s)
                continue
            }
            break
        case STRONG_UND:
            if ('\\'!== last_last_src_char &&
				'_' === last_txt_char &&
                '_' === char
            ) {
                s.txt = s.txt.slice(0, -1)
                flush(s)
                end_token(s)
                continue
            }
            break
        case ITALIC_AST:
            if ('\\'!== last_last_src_char &&
				'*' !== last_last_txt_char &&
                '*' === last_txt_char &&
                '*' !== char
            ) {
                s.txt = s.txt.slice(0, -1)
                flush(s)
                end_token(s)
                s.idx -= 1
                continue
            }
            // Special case for ***strong*em***
            if ('\\'!== s.src[s.idx-3] &&
				'*' === last_last_txt_char &&
                '*' === last_txt_char &&
                '*' === char
            ) {
                s.txt = s.txt.slice(0, -2)
                flush(s)
                end_token(s)
                s.idx -= 2
                continue
            }
            break
        case ITALIC_UND:
            if ('\\'!== last_last_src_char &&
				'_' !== last_last_txt_char &&
                '_' === last_txt_char &&
                '_' !== char
            ) {
                s.txt = s.txt.slice(0, -1)
                flush(s)
                end_token(s)
                s.idx -= 1
                continue
            }
            // Special case for ___strong_em___
            if ('\\'!== s.src[s.idx-3] &&
				'_' === last_last_txt_char &&
                '_' === last_txt_char &&
                '_' === char
            ) {
                s.txt = s.txt.slice(0, -2)
                flush(s)
                end_token(s)
                s.idx -= 2
                continue
            }
            break
        case ROOT:
            switch (s.txt) {
            case "# ":
                s.txt = ""
                add_token(s, HEADING_1)
                s.txt = char
                continue
            case "## ":
                s.txt = ""
                add_token(s, HEADING_2)
                s.txt = char
                continue
            case "### ":
                s.txt = ""
                add_token(s, HEADING_3)
                s.txt = char
                continue
            case "#### ":
                s.txt = ""
                add_token(s, HEADING_4)
                s.txt = char
                continue
            case "##### ":
                s.txt = ""
                add_token(s, HEADING_5)
                s.txt = char
                continue
            case "###### ":
                s.txt = ""
                add_token(s, HEADING_6)
                s.txt = char
                continue
            case "```": {
                s.code_block_lang = ""
                s.txt = ""
                add_token(s, CODE_BLOCK)
				s.idx -= 1
                continue
            }
            default:
                break
            }
        }

        /*
        Common checks
        */

        /* Newline */
        if ('\n' === char) {
			if (s.txt.length > 0) {
				add_paragraph(s)
				flush(s)
			}
			continue
		}
		if ('\n' === last_src_char) {
			if ('\n' === last_last_src_char) {
				s.len = 0
			} else {
				s.renderer.update_node(s.renderer.data, s.nodes[s.len], '\n')
			}
		}

        if (in_token === CODE) {
            s.txt += char
            continue
        }

        /* `Code Inline` */
        if ('\\'!== last_last_src_char &&
			'`' === last_txt_char &&
            '`' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -1)
            add_paragraph(s)
            flush(s)
            add_token(s, CODE)
            s.txt = char
            continue
        }

        /* **Strong** */
        if (in_token !== STRONG_AST &&
			'\\'!== s.src[s.idx-4] &&
            '*' === last_last_txt_char &&
            '*' === last_txt_char &&
            '*' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -2)
            add_paragraph(s)
            flush(s)
            add_token(s, STRONG_AST)
            s.idx -= 1
            continue
        }

        /* __Strong__ */
        if (in_token !== STRONG_UND &&
			'\\'!== s.src[s.idx-4] &&
            '_' === last_last_txt_char &&
            '_' === last_txt_char &&
            '_' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -2)
            add_paragraph(s)
            flush(s)
            add_token(s, STRONG_UND)
            s.idx -= 1
            continue
        }

        /* *Em* */
        if (in_token !== ITALIC_AST &&
			'\\'!== last_last_src_char &&
            '*' === last_txt_char &&
            '*' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -1)
            add_paragraph(s)
            flush(s)
            add_token(s, ITALIC_AST)
            s.idx -= 1
            continue
        }

        /* _Em_ */
        if (in_token !== ITALIC_UND &&
			'\\'!== last_last_src_char &&
            '_' === last_txt_char &&
            '_' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -1)
            add_paragraph(s)
            flush(s)
            add_token(s, ITALIC_UND)
            s.idx -= 1
            continue
        }

        s.txt += char
    }

    s.renderer.render_temp_text(s.renderer.data, s.nodes[s.len], s.txt)
}

/**
 * @typedef {import("./types.js").Default_Renderer} Default_Renderer
 * @typedef {import("./types.js").Default_Renderer_Data} Default_Renderer_Data
 * @typedef {import("./types.js").Default_Renderer_Node} Default_Renderer_Node
 * @typedef {import("./types.js").Default_Renderer_Create_Node} Default_Renderer_Create_Node
 * @typedef {import("./types.js").Default_Renderer_Update_Node} Default_Renderer_Update_Node
 * @typedef {import("./types.js").Default_Renderer_Render_Temp_Text} Default_Renderer_Render_Temp_Text
 */

/**
 * @param   {HTMLElement     } root
 * @returns {Default_Renderer} */
export function default_renderer(root) {
    return {
        create_node     : default_create_node,
        update_node     : default_update_node,
        render_temp_text: default_render_temp_text,
        data            : {
            root: root,
            temp: document.createElement("span"),
        },
    }
}

/** @type {Default_Renderer_Create_Node} */
export function default_create_node(data, type, parent) {
    /** @type {HTMLElement} */
    let elem
    /** @type {HTMLElement} */
    let slot

    switch (type) {
    case ROOT:
        elem = slot = data.root
        return {elem, slot}
    case PARAGRAPH:  elem = slot = document.createElement("p")     ;break
    case HEADING_1:  elem = slot = document.createElement("h1")    ;break
    case HEADING_2:  elem = slot = document.createElement("h2")    ;break
    case HEADING_3:  elem = slot = document.createElement("h3")    ;break
    case HEADING_4:  elem = slot = document.createElement("h4")    ;break
    case HEADING_5:  elem = slot = document.createElement("h5")    ;break
    case HEADING_6:  elem = slot = document.createElement("h6")    ;break
    case ITALIC_AST:
    case ITALIC_UND: elem = slot = document.createElement("em")    ;break
    case STRONG_AST:
    case STRONG_UND: elem = slot = document.createElement("strong");break
    case CODE:       elem = slot = document.createElement("code")  ;break
    case CODE_BLOCK:
        elem = document.createElement("pre")
        slot = elem.appendChild(document.createElement("code"))
        break
    }

    // Only for Root the parent is null
    /**@type {Default_Renderer_Node}*/(parent).elem.appendChild(elem)

    return {elem, slot}
}

/** @type {Default_Renderer_Update_Node} */
export function default_update_node(data, node, text) {
	switch (text) {
	case "":
		break
	case "\n":
		node.slot.appendChild(document.createElement("br"))
		break
	default:
		node.slot.appendChild(document.createTextNode(text))
	}
}

/** @type {Default_Renderer_Render_Temp_Text} */
export function default_render_temp_text(data, node, text) {
    node.slot.appendChild(data.temp).innerText = text
}
