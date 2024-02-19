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
 * Makes a new Stream object.
 * @param   {HTMLElement} container
 * @returns {Stream     } */
export function stream(container) {
    return new Stream(container)
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
    console.log(`end_node: ${s.nodes_type[s.nodes_len]}, text: "${s.text}", len: ${s.nodes_len}`)
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
    if (s.text.length > 0) {
        s.nodes_elem[s.nodes_len].appendChild(document.createTextNode(s.text))
        s.text = ""
    }

    s.nodes_elem[s.nodes_len].appendChild(container_el)
    s.nodes_len += 1
    s.nodes_elem[s.nodes_len] = text_el
    s.nodes_type[s.nodes_len] = type
}

/**
 * @param   {Stream} s
 * @returns {void  } */
function ensure_paragraph(s) {
    if (s.nodes_len > 0) return

    const p = document.createElement("p")
    s.nodes_elem[s.nodes_len].appendChild(p)
    s.nodes_len += 1
    s.nodes_elem[s.nodes_len] = p
    s.nodes_type[s.nodes_len] = Node_Type.Text
}


/**
 * @param   {Stream } s
 * @returns {boolean} */
function check_newline(s) {
    if (s.source[s.index] !== '\n') return false
    
    if (s.source[s.index-1] === '\n') {
        end_node(s)
    } else {
        if (s.text.length > 0) {
            ensure_paragraph(s)
            flush(s)
        }
        s.nodes_len = Math.min(s.nodes_len, 1)
    }
    return true
}

/**
 * @param   {Stream } s
 * @returns {boolean} */
function check_code_inline(s) {
    const char = s.source[s.index]

    if (// checking text, not source, to not match ending backticks
        s.text[s.text.length-1] === '`' &&
        char !== '`' && char !== '\n'
    ) {
        s.text = s.text.slice(0, -1)
        ensure_paragraph(s)
        add_node(s, Node_Type.Code_Inline, document.createElement("code"))
        s.text = char
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
        ensure_paragraph(s)
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
        ensure_paragraph(s)
        add_node(s, Node_Type.Strong, document.createElement("strong"))
        return true
    }
    return false
}

/**
 * Parse and render another chunk of markdown.
 * @param   {Stream} s 
 * @param   {string} chunk 
 * @returns {void  } */
export function write(s, chunk) {
    s.source += chunk
    
    for (;s.index < s.source.length; s.index += 1) {
        const char = s.source[s.index]

        switch (s.nodes_type[s.nodes_len]) {
        case Node_Type.Code_Block:
            if (s.code_block_lang !== null) {
                if (char === '\n') {
                    s.code_block_lang = null
                } else {
                    s.code_block_lang += char
                }
                continue
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
                continue
            }

            s.text += char
            continue
        case Node_Type.Code_Inline:
            if (char === '`') {
                end_node(s)
                continue
            }

            if (check_newline(s)) continue

            s.text += char
            continue
        case Node_Type.Strong:
            if (s.text[s.text.length-1] === '*' && char === '*') {
                s.text = s.text.slice(0, -1)
                end_node(s)
                continue
            }

            if (check_code_inline(s) ||
                check_em(s) ||
                check_newline(s)
            ) continue

            s.text += char
            continue
        case Node_Type.Em: // TODO _italic_
            if (s.text[s.text.length-1] === '*' && char !== '*') {
                s.text = s.text.slice(0, -1)
                end_node(s)
                s.index -= 1 // reprocess char
                continue
            }

            if (check_code_inline(s) ||
                check_strong(s) ||
                check_newline(s)
            ) continue

            s.text += char
            continue
        case Node_Type.Heading:
            if (check_code_inline(s) ||
                check_strong(s) ||
                check_em(s) ||
                check_newline(s)
            ) continue

            s.text += char
            continue
        default:
            if (s.nodes_len === 0) {
                switch (s.text) {
                case "# ":
                    s.text = ""
                    add_node(s, Node_Type.Heading, document.createElement("h1"))
                    s.text = char
                    continue
                case "## ":
                    s.text = ""
                    add_node(s, Node_Type.Heading, document.createElement("h2"))
                    s.text = char
                    continue
                case "### ":
                    s.text = ""
                    add_node(s, Node_Type.Heading, document.createElement("h3"))
                    s.text = char
                    continue
                case "#### ":
                    s.text = ""
                    add_node(s, Node_Type.Heading, document.createElement("h4"))
                    s.text = char
                    continue
                case "##### ":
                    s.text = ""
                    add_node(s, Node_Type.Heading, document.createElement("h5"))
                    s.text = char
                    continue
                case "###### ":
                    s.text = ""
                    add_node(s, Node_Type.Heading, document.createElement("h6"))
                    s.text = char
                    continue
                case "```": {
                    s.code_block_lang = ""
                    s.text = ""
                    const pre  = document.createElement("pre")
                    const code = pre.appendChild(document.createElement("code"))
                    add_node(s, Node_Type.Code_Block, pre, code)
                    continue
                }
                }
            }

            if (check_code_inline(s) ||
                check_strong(s) ||
                check_em(s) ||
                check_newline(s)
            ) continue

            s.text += char
            continue
        }
    }

    // TODO: temp paragraph
    s.nodes_elem[s.nodes_len].appendChild(s.temp_span).innerText = s.text
}

/**
 * Finish rendering the markdown. Resets the state of the stream and flushes any remaining text.
 * @param   {Stream} s 
 * @returns {void  } */
export function end(s) { // TODO: reset state
    s.nodes_elem[s.nodes_len].removeChild(s.temp_span)
    while (s.nodes_len > 0) {
        end_node(s)
    }
}