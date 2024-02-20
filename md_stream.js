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

/**
 * @typedef {unknown} Token_Node
 * 
 * @typedef {Token_Node | null} Maybe_Token_Node 
 * 
 * @typedef {unknown} Renderer_Data
 * 
 * @callback Create_Token_Node
 * @param   {Renderer_Data   } data
 * @param   {Token_Type      } type
 * @param   {Maybe_Token_Node} parent
 * @returns {Token_Node}
 * 
 * @callback Update_Token_Node
 * @param   {Renderer_Data} data
 * @param   {Token_Node   } node
 * @param   {string       } text
 * @returns {void}
 * 
 * @callback Render_Temp_Text
 * @param   {Renderer_Data} data
 * @param   {Token_Node   } node
 * @param   {string       } text
 * @returns {void}
 * 
 * @typedef  {object           } Renderer
 * @property {Renderer_Data    } data             User data.
 * @property {Create_Token_Node} create_node      Create a new token node.
 * @property {Update_Token_Node} update_node      Add a text chunk to a token node.
 * @property {Render_Temp_Text } render_temp_text Render temporary text.
 *                                                Each call should replace the previous text.
 */

/** @param {Renderer} renderer */
export function Stream(renderer) {
    const root = renderer.create_node(renderer.data, ROOT, null)
    this.renderer = renderer
    this.txt             =/**@type {string            }*/("")
    this.src             =/**@type {string            }*/("")
    this.idx             =/**@type {number            }*/(0)
    this.tokens_node     =/**@type {Maybe_Token_Node[]}*/([root,,,,,])
    this.tokens_type     =/**@type {Token_Type[]      }*/([ROOT,,,,,])
    this.tokens_len      =/**@type {number            }*/(0)
    this.code_block_lang =/**@type {string | null     }*/(null) // TODO remove
}

/**
 * Makes a new Stream object.
 * @param   {Renderer} renderer
 * @returns {Stream  } */
export function make(renderer) {
    return new Stream(renderer)
}

/**
 * Finish rendering the markdown.
 * Resets the state of the stream and flushes any remaining text.
 * @param   {Stream} s 
 * @returns {void  } */
export function end(s) {
    // TODO
    // s.tokens_node[s.tokens_len].removeChild(s.temp_span)
    flush(s)
    s.idx = 0
    s.src = ""
    s.txt = ""
    s.code_block_lang = null
    s.tokens_node.fill(null)
    s.tokens_len = 0
}

/**
 * @param   {Stream} s 
 * @returns {void  } */
function flush(s) {
    if (s.txt.length > 0) {
        s.renderer.update_node(s.renderer.data, s.tokens_node[s.tokens_len], s.txt)
        s.txt = ""
    }
}

/**
 * @param   {Stream} s
 * @returns {void  } */
function end_token(s) {
    if (s.tokens_len > 0) {
        s.tokens_len -= 1
    }
}

/**
 * @param   {Stream    } s
 * @param   {Token_Type} type
 * @returns {void      } */
function add_token(s, type) {
    const parent = s.tokens_node[s.tokens_len]
    s.tokens_len += 1
    s.tokens_node[s.tokens_len] = s.renderer.create_node(s.renderer.data, type, parent)
    s.tokens_type[s.tokens_len] = type
}

/**
 * @param   {Stream} s
 * @returns {void  } */
function add_paragraph(s) {
    if (s.tokens_len === 0) add_token(s, PARAGRAPH)
}

/**
 * Parse and render another chunk of markdown.
 * @param   {Stream} s 
 * @param   {string} chunk 
 * @returns {void  } */
export function write(s, chunk) {
    for (s.src += chunk; s.idx < s.src.length; s.idx += 1)
    {
        const last_last_txt_char = s.txt[s.txt.length-2]
        const last_txt_char      = s.txt[s.txt.length-1]
        const char               = s.src[s.idx]
        const in_token           = s.tokens_type[s.tokens_len]

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

            if (s.txt.length >= 4 &&
                '\n'=== s.txt[s.txt.length-3] &&
                '`' === last_last_txt_char &&
                '`' === last_txt_char &&
                '`' === char
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
            if ('*' === last_txt_char &&
                '*' === char
            ) {
                s.txt = s.txt.slice(0, -1)
                flush(s)
                end_token(s)
                continue
            }
            break
        case STRONG_UND:
            if ('_' === last_txt_char &&
                '_' === char
            ) {
                s.txt = s.txt.slice(0, -1)
                flush(s)
                end_token(s)
                continue
            }
            break
        case ITALIC_AST:
            if ('*' !== last_last_txt_char &&
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
            if ('*' === last_last_txt_char &&
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
            if ('_' !== last_last_txt_char &&
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
            if ('_' === last_last_txt_char &&
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
            if ('\n' === s.src[s.idx-1]) {
                flush(s)
                end_token(s)
            } else {
                if (s.txt.length > 0) {
                    add_paragraph(s)
                    flush(s)
                }
                s.tokens_len = Math.min(s.tokens_len, 1)
            }
            continue
        }

        if (in_token === CODE) {
            s.txt += char
            continue
        }

        /* `Code Inline` */
        if ('`' === last_txt_char &&
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

    s.renderer.render_temp_text(s.renderer.data, s.tokens_node[s.tokens_len], s.txt)
}

/**
 * @typedef  {object     } Default_Renderer_Data
 * @property {HTMLElement} container
 * @property {HTMLElement} temp_span
 * 
 * @typedef  {object     } Default_Renderer_Node
 * @property {HTMLElement} elem element to append to parent
 * @property {HTMLElement} slot element to write text to
 */

/** @param   {HTMLElement} container */
export function Default_Renderer(container) {
    this.create_node      = create_token_node
    this.update_node      = update_token_node
    this.render_temp_text = render_temp_text
    this.data             = {
        container: container,
        temp_span: document.createElement("span"),
    }
}

/**
 * @param   {HTMLElement     } container 
 * @returns {Default_Renderer} */
export function default_renderer(container) {
    return new Default_Renderer(container)
}

/**
 * @type    {Create_Token_Node}
 * @param   {Default_Renderer_Data       } data
 * @param   {Token_Type                  } type
 * @param   {Default_Renderer_Node | null} parent
 * @returns {Default_Renderer_Node} */
export function create_token_node(data, type, parent) {
    /** @type {HTMLElement} */
    let elem
    /** @type {HTMLElement} */
    let slot

    switch (type) {
    case ROOT:
        elem = slot = data.container
        return { elem, slot }
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

    return { elem, slot }
}

/** 
 * @type {Update_Token_Node}
 * @param {Default_Renderer_Data} data
 * @param {Default_Renderer_Node} node
 */
export function update_token_node(data, node, text) {
    node.slot.appendChild(document.createTextNode(text))
}

/** 
 * @type {Render_Temp_Text}
 * @param {Default_Renderer_Data} data
 * @param {Default_Renderer_Node} node
 */
export function render_temp_text(data, node, text) {
    node.slot.appendChild(data.temp_span).innerText = text   
}