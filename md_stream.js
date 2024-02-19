/** @enum {(typeof Token_Type)[keyof typeof Token_Type]} */
const Token_Type = /** @type {const} */({
    Text:        1,
    Em_Ast:      2,
    Em_Und:      4,
    Strong_Ast:  8,
    Strong_Und:  16,
    Code_Inline: 32,
    Code_Block:  64,
    Heading:     128,
    Link:        256,
})

/** @param {HTMLElement} container */
export function Stream(container) {
    this.txt             =/**@type {string       }*/("")
    this.src             =/**@type {string       }*/("")
    this.idx             =/**@type {number       }*/(0)
    this.tokens_elem     =/**@type {HTMLElement[]}*/([container      ,,,,,])
    this.tokens_type     =/**@type {Token_Type[] }*/([Token_Type.Text,,,,,])
    this.tokens_len      =/**@type {number       }*/(0)
    this.code_block_lang =/**@type {string | null}*/(null) // TODO remove
    this.temp_span       =/**@type {HTMLElement  }*/(document.createElement("span"))
}

/**
 * Makes a new Stream object.
 * @param   {HTMLElement} container
 * @returns {Stream     } */
export function make(container) {
    return new Stream(container)
}

/**
 * @param   {Stream} s 
 * @returns {void  } */
function flush(s) {
    console.assert(
        s.tokens_len >= 0,
        "nodes_len should never below 0",
    )
    if (s.txt.length > 0) {
        s.tokens_elem[s.tokens_len].appendChild(document.createTextNode(s.txt))
        s.txt = ""
    }
}

/**
 * @param   {Stream} s
 * @returns {void  } */
function end_token(s) {
    flush(s)
    if (s.tokens_len > 0) {
        s.tokens_len -= 1
    }
}

/**
 * @param   {Stream      } s
 * @param   {Token_Type  } type
 * @param   {HTMLElement } container_el element to append to parent
 * @param   {HTMLElement=} text_el      element to write text to
 * @returns {void        } */
function add_token(s, type, container_el, text_el = container_el) {
    if (s.txt.length > 0) {
        s.tokens_elem[s.tokens_len].appendChild(document.createTextNode(s.txt))
        s.txt = ""
    }

    s.tokens_elem[s.tokens_len].appendChild(container_el)
    s.tokens_len += 1
    s.tokens_elem[s.tokens_len] = text_el
    s.tokens_type[s.tokens_len] = type
}

/**
 * @param   {Stream} s
 * @returns {void  } */
function add_paragraph(s) {
    if (s.tokens_len > 0) return

    const p = document.createElement("p")
    s.tokens_elem[s.tokens_len].appendChild(p)
    s.tokens_len += 1
    s.tokens_elem[s.tokens_len] = p
    s.tokens_type[s.tokens_len] = Token_Type.Text
}

/**
 * Parse and render another chunk of markdown.
 * @param   {Stream} s 
 * @param   {string} chunk 
 * @returns {void  } */
export function write(s, chunk) {
    s.src += chunk
    
    for (; s.idx < s.src.length; s.idx += 1)
    {
        const last_last_txt_char = s.txt[s.txt.length-2]
        const last_txt_char      = s.txt[s.txt.length-1]
        const last_src_char      = s.src[s.idx-1]
        const char               = s.src[s.idx]
        const in_token           = s.tokens_type[s.tokens_len]

        /*
        Token specific checks
        */
        switch (in_token) {
        case Token_Type.Code_Block:
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
                end_token(s)
                continue
            }

            s.txt += char
            continue
        case Token_Type.Code_Inline:
            if ('`' === char) {
                end_token(s)
                continue
            }
            break
        case Token_Type.Strong_Ast:
            if ('*' === last_txt_char &&
                '*' === char
            ) {
                s.txt = s.txt.slice(0, -1)
                end_token(s)
                continue
            }
            break
        case Token_Type.Strong_Und:
            if ('_' === last_txt_char &&
                '_' === char
            ) {
                s.txt = s.txt.slice(0, -1)
                end_token(s)
                continue
            }
            break
        case Token_Type.Em_Ast:
            if ('*' !== last_last_txt_char &&
                '*' === last_txt_char &&
                '*' !== char
            ) {
                s.txt = s.txt.slice(0, -1)
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
                end_token(s)
                s.idx -= 2
                continue
            }
            break
        case Token_Type.Em_Und:
            if ('_' !== last_last_txt_char &&
                '_' === last_txt_char &&
                '_' !== char
            ) {
                s.txt = s.txt.slice(0, -1)
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
                end_token(s)
                s.idx -= 2
                continue
            }
            break
        case Token_Type.Text: // top level checks
            if (s.tokens_len === 0) {
                switch (s.txt) {
                case "# ":
                    s.txt = ""
                    add_token(s, Token_Type.Heading, document.createElement("h1"))
                    s.txt = char
                    continue
                case "## ":
                    s.txt = ""
                    add_token(s, Token_Type.Heading, document.createElement("h2"))
                    s.txt = char
                    continue
                case "### ":
                    s.txt = ""
                    add_token(s, Token_Type.Heading, document.createElement("h3"))
                    s.txt = char
                    continue
                case "#### ":
                    s.txt = ""
                    add_token(s, Token_Type.Heading, document.createElement("h4"))
                    s.txt = char
                    continue
                case "##### ":
                    s.txt = ""
                    add_token(s, Token_Type.Heading, document.createElement("h5"))
                    s.txt = char
                    continue
                case "###### ":
                    s.txt = ""
                    add_token(s, Token_Type.Heading, document.createElement("h6"))
                    s.txt = char
                    continue
                case "```": {
                    s.code_block_lang = ""
                    s.txt = ""
                    const pre  = document.createElement("pre")
                    const code = pre.appendChild(document.createElement("code"))
                    add_token(s, Token_Type.Code_Block, pre, code)
                    continue
                }
                }
            }
            break
        }

        /*
        Common checks
        */

        /* Newline */
        if ('\n' === char) {
            if ('\n' === last_src_char) {
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

        if (in_token === Token_Type.Code_Inline) {
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
            add_token(s, Token_Type.Code_Inline, document.createElement("code"))
            s.txt = char
            continue
        }

        /* **Strong** */
        if (in_token !== Token_Type.Strong_Ast &&
            '*' === last_last_txt_char &&
            '*' === last_txt_char &&
            '*' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -2)
            add_paragraph(s)
            add_token(s, Token_Type.Strong_Ast, document.createElement("strong"))
            s.idx -= 1
            continue
        }
        
        /* __Strong__ */
        if (in_token !== Token_Type.Strong_Und &&
            '_' === last_last_txt_char &&
            '_' === last_txt_char &&
            '_' !== char &&
            '\n'!== char 
        ) {
            s.txt = s.txt.slice(0, -2)
            add_paragraph(s)
            add_token(s, Token_Type.Strong_Und, document.createElement("strong"))
            s.idx -= 1
            continue
        }

        /* *Em* */
        if (in_token !== Token_Type.Em_Ast &&
            '*' === last_txt_char &&
            '*' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -1)
            add_paragraph(s)
            add_token(s, Token_Type.Em_Ast, document.createElement("em"))
            s.idx -= 1
            continue
        }
        
        /* _Em_ */
        if (in_token !== Token_Type.Em_Und &&
            '_' === last_txt_char &&
            '_' !== char &&
            '\n'!== char
        ) {
            s.txt = s.txt.slice(0, -1)
            add_paragraph(s)
            add_token(s, Token_Type.Em_Und, document.createElement("em"))
            s.idx -= 1
            continue
        }

        s.txt += char
    }

    // TODO: temp paragraph
    s.tokens_elem[s.tokens_len].appendChild(s.temp_span).innerText = s.txt
}

/**
 * Finish rendering the markdown. Resets the state of the stream and flushes any remaining text.
 * @param   {Stream} s 
 * @returns {void  } */
export function end(s) { // TODO: reset state
    s.tokens_elem[s.tokens_len].removeChild(s.temp_span)
    while (s.tokens_len > 0) {
        end_token(s)
    }
}