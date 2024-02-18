/** @enum {(typeof Node_Type)[keyof typeof Node_Type]} */
const Node_Type = /** @type {const} */({
    Text:        0,
    Em:          1,
    Strong:      2,
    Code_Inline: 3,
    Code_Block:  4,
    Heading:     5,
    Link:        6,
})

/** @param {HTMLElement} container */
export function Stream(container) {
    this.source          =/**@type {string       }*/("")
    this.index           =/**@type {number       }*/(0)
    this.nodes_elem      =/**@type {HTMLElement[]}*/([container     ,,,,,])
    this.nodes_type      =/**@type {Node_Type[]  }*/([Node_Type.Text,,,,,])
    this.nodes_len       =/**@type {number       }*/(0)
    this.text            =/**@type {string       }*/("")
    this.code_block_lang =/**@type {string | null}*/(null)
    this.temp_span       =/**@type {HTMLElement  }*/(document.createElement("span"))
}

/**
 * @param   {Stream} s 
 * @returns {void  } */
function flush(s) {
    console.assert(
        s.nodes_len >= 0,
        "nodes_len should never below 0",
    )
    if (s.text.length > 0) {
        s.nodes_elem[s.nodes_len].appendChild(document.createTextNode(s.text))
        s.text = ""
    }
}

/**
 * @param   {Stream} s
 * @returns {void  } */
function end_node(s) {
    flush(s)
    if (s.nodes_len > 0) {
        s.nodes_len -= 1
    }
}

/**
 * @param   {Stream      } s
 * @param   {Node_Type   } type
 * @param   {HTMLElement } container_el element to append to parent
 * @param   {HTMLElement=} text_el      element to write text to
 * @returns {void        } */
function add_node(s, type, container_el, text_el = container_el) {
    flush(s)
    s.nodes_elem[s.nodes_len].appendChild(container_el)
    s.nodes_len += 1
    s.nodes_elem[s.nodes_len] = text_el
    s.nodes_type[s.nodes_len] = type
}


/**
 * @param   {Stream } s
 * @returns {boolean} */
function check_newline(s) {
    if (s.source[s.index] !== '\n') return false

    if (s.source[s.index-1] === '\n') {
        end_node(s)
        add_node(s, Node_Type.Text, document.createElement("p"))
    } else {
        while (s.nodes_len > 1) {
            end_node(s)
        }
        flush(s)
        s.nodes_elem[s.nodes_len].appendChild(document.createElement("br"))
    }

    return true
}

/**
 * @param   {Stream } s
 * @returns {boolean} */
function check_code_inline(s) {
    if (// checking text, not source, to not match ending backticks
        s.text[s.text.length-1] === '`' &&
        s.source[s.index  ] !== '`' &&
        s.source[s.index  ] !== '\n'
    ) {
        s.text = s.text.slice(0, -1)
        add_node(s, Node_Type.Code_Inline, document.createElement("code"))
        s.text = s.source[s.index]
        return true
    }
    return false
}

/**
 * @param   {Stream } s
 * @returns {boolean} */
function check_em(s) {
    const char = s.source[s.index]
    if (s.text[s.text.length-1] === '*' &&
        char !== '*' && char !== '\n'
    ) {
        s.text = s.text.slice(0, -1)
        add_node(s, Node_Type.Em, document.createElement("em"))
        s.text = char
        return true
    }
    return false
}

/**
 * @param   {Stream } s
 * @returns {boolean} */
function check_strong(s) {
    if (s.text[s.text.length-1] === '*' &&
        s.source[s.index] === '*'
    ) {
        s.text = s.text.slice(0, -1)
        add_node(s, Node_Type.Strong, document.createElement("strong"))
        return true
    }
    return false
}

/**
 * @param   {Stream} s 
 * @param   {string} chunk 
 * @returns {void  } */
export function puch_chunk(s, chunk) {
    if (s.nodes_len === 0) {
        add_node(s, Node_Type.Text, document.createElement("p"))
    }

    console.log(`chunk: "${chunk}"`)

    s.source += chunk
    
    while (s.index < s.source.length) {
        const char = s.source[s.index]

        switch (s.nodes_type[s.nodes_len]) {
        case Node_Type.Code_Block:
            if (s.code_block_lang !== null) {
                if (char === '\n') {
                    s.code_block_lang = null
                } else {
                    s.code_block_lang += char
                }
                break
            }

            if (s.index >= 3 &&
                s.source[s.index-3] === '\n' &&
                s.source[s.index-2] === '`' &&
                s.source[s.index-1] === '`' &&
                               char === '`'
            ) {
                s.code_block_lang = null
                s.text = s.text.slice(0, -3)
                end_node(s)
                break
            }

            s.text += char
            break
        case Node_Type.Code_Inline:
            if (char === '`') {
                end_node(s)
                break
            }

            if (check_newline(s)) break

            s.text += char
            break
        case Node_Type.Strong:
            if (s.text[s.text.length-1] === '*' && char === '*') {
                s.text = s.text.slice(0, -1)
                end_node(s)
                break
            }

            if (check_code_inline(s)) break
            if (check_em(s)) break
            if (check_newline(s)) break

            s.text += char
            break
        case Node_Type.Em: // TODO _italic_
            if (s.text[s.text.length-1] === '*' && char !== '*') {
                s.text = s.text.slice(0, -1)
                end_node(s)
                s.index -= 1 // reprocess char
                break
            }

            if (check_code_inline(s)) break
            if (check_strong(s)) break
            if (check_newline(s)) break

            s.text += char
            break
        default:
            if (s.source[s.index-3] === '\n' &&
                s.source[s.index-2] === '`' &&
                s.source[s.index-1] === '`' &&
                               char === '`'
            ) {
                s.code_block_lang = ""
                s.text = ""
                const pre  = document.createElement("pre")
                const code = pre.appendChild(document.createElement("code"))
                add_node(s, Node_Type.Code_Block, pre, code)
                break
            }

            if (check_code_inline(s)) break
            if (check_strong(s)) break
            if (check_em(s)) break
            if (check_newline(s)) break

            s.text += char
            break
        }

        s.index += 1
    }

    s.nodes_elem[s.nodes_len].appendChild(s.temp_span).innerText = s.text
}

/**
 * @param   {Stream} s 
 * @returns {void  } */
export function end(s) {
    s.nodes_elem[s.nodes_len].removeChild(s.temp_span)
    while (s.nodes_len > 0) {
        end_node(s)
    }
}