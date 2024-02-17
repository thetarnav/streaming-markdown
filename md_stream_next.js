/** @enum {(typeof Node_Type)[keyof typeof Node_Type]} */
const Node_Type = /** @type {const} */({
    Text:        0,
    Italic:      1,
    Bold:        2,
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
    this.pending         =/**@type {Node_Type    }*/(Node_Type.Text)
    this.pending_text    =/**@type {string       }*/("")
    this.code_block_lang =/**@type {string | null}*/(null)
    this.temp_span       =/**@type {HTMLElement  }*/(document.createElement("span"))
}

/**
 * @param   {Stream} s 
 * @returns {void    } */
function flush(s) {
    console.assert(
        s.nodes_len >= 0,
        "nodes_len should never below 0",
    )
    if (s.pending_text.length > 0) {
        s.nodes_elem[s.nodes_len].appendChild(document.createTextNode(s.pending_text))
        s.pending_text = ""
    }
}

/**
 * @param   {Stream} s
 * @returns {void    } */
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
 * @param   {Stream} s 
 * @param   {string  } chunk 
 * @returns {void    } */
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
                s.pending_text = s.pending_text.slice(0, -3)
                end_node(s)
                break
            }

            s.pending_text += char
            break
        case Node_Type.Code_Inline:
            if (char === '`') {
                end_node(s)
                break
            }

            if (check_newline(s)) break

            s.pending_text += char
            break
        default:
            if (s.source[s.index-3] === '\n' &&
                s.source[s.index-2] === '`' &&
                s.source[s.index-1] === '`' &&
                               char === '`'
            ) {
                s.code_block_lang = ""
                s.pending_text = s.pending_text.slice(0, -3)
                const pre  = document.createElement("pre")
                const code = pre.appendChild(document.createElement("code"))
                add_node(s, Node_Type.Code_Block, pre, code)
                break
            }

            if (s.pending_text[s.pending_text.length-1] === '`' &&
                char !== '`' && char !== '\n'
            ) {
                s.pending_text = s.pending_text.slice(0, -1)
                add_node(s, Node_Type.Code_Inline, document.createElement("code"))
                s.pending_text += char
                break
            }

            if (check_newline(s)) break

            s.pending_text += char
            break
        }

        console.log(`char: "${char}"`)

        s.index += 1
    }

    s.nodes_elem[s.nodes_len].appendChild(s.temp_span).innerText = s.pending_text
}

/**
 * @param   {Stream} s 
 * @returns {void    } */
export function end(s) {
    s.nodes_elem[s.nodes_len].removeChild(s.temp_span)
    while (s.nodes_len > 0) {
        end_node(s)
    }
}