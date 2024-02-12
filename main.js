// @ts-check

async function main() {
    const source_md_res = await fetch(location.origin + '/source.md')
    const source_md = await source_md_res.text()

    const container = document.createElement('div')
    document.body.appendChild(container)

    const stream = new MdStream(container)

    let i = 0
    while (i < source_md.length) {
        const length = Math.floor(Math.random() * 20) + 1
        const delay  = Math.floor(Math.random() * 80) + 10
        const chunk  = source_md.slice(i, i += length)
        addChunk(stream, chunk)
        await new Promise(resolve => setTimeout(resolve, delay))
    }
}

/** @enum {(typeof MdNodeType)[keyof typeof MdNodeType]} */
const MdNodeType = /** @type {const} */({
    Text:       1,
    Italic:     2,
    Bold:       4,
    CodeInline: 8,
    CodeBlock:  16,
})

/** @param {HTMLElement} container */
function MdStream(container) {
    this.nodes_elem      =/**@type {HTMLElement[]}*/([container      ,,,,,])
    this.nodes_type      =/**@type {MdNodeType[] }*/([MdNodeType.Text,,,,,])
    this.nodes_len       =/**@type {number       }*/(0)
    this.text            =/**@type {string       }*/("")
    this.backticks_count =/**@type {number       }*/(0)
    this.last_inline_code=/**@type {HTMLElement? }*/(null)
    this.code_block_lang =/**@type {boolean      }*/(false)
}

/**
 * @param   {MdStream} s 
 * @returns {void    } */
function flush(s) {
    if (s.nodes_len < 0) {
        throw new Error("nodes_len should never below 0")
    }
    console.log(`flush: "${s.text}"`)
    if (s.nodes_len === 0) {
        if (s.text.length === 0) return
        s.nodes_elem[0].appendChild(document.createElement("span")).innerText = s.text
    } else {
        s.nodes_elem[s.nodes_len].innerText = s.text
        s.nodes_len -= 1
    }
    s.text = ""
}

/**
 * @param   {MdStream    } s
 * @param   {MdNodeType  } type
 * @param   {HTMLElement } container_el element to append to parent
 * @param   {HTMLElement=} text_el      element to write text to
 * @returns {void        } */
function addNode(s, type, container_el, text_el = container_el) {
    s.nodes_elem[s.nodes_len].appendChild(container_el)
    s.nodes_len += 1
    s.nodes_elem[s.nodes_len] = text_el
    s.nodes_type[s.nodes_len] = type
}

/**
 * @param   {MdStream} s 
 * @param   {string  } chunk 
 * @returns {void    } */
function addChunk(s, chunk) {
    console.log(`chunk: "${chunk}"`)

    for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i]

        switch (ch) {
        case '*': {
            s.backticks_count = 0

            switch (s.nodes_type[s.nodes_len]) {
            case MdNodeType.CodeInline:
            case MdNodeType.CodeBlock:
                s.text += ch
                continue
            case MdNodeType.Italic:
                flush(s)
                continue
            default:
                flush(s)
                addNode(s, MdNodeType.Italic, document.createElement("i"))
                continue
            }
        }
        case '`': {
            s.backticks_count += 1

            switch (s.nodes_type[s.nodes_len]) {
            case MdNodeType.CodeInline: {
                if (s.backticks_count === 3) {
                    throw new Error("code inline should never have 3 backticks")
                }

                s.last_inline_code = s.nodes_elem[s.nodes_len]
                flush(s)
                continue
            }
            case MdNodeType.CodeBlock: {
                if (s.backticks_count === 3) {
                    flush(s)
                } else if (!s.code_block_lang) {
                    s.text += ch
                }
                continue
            }
            default: {
                flush(s)

                if (s.backticks_count === 3) {
                    if (s.last_inline_code === null) {
                        throw new Error("last_inline_code should always exist when creating code block")
                    }

                    const pre = document.createElement("pre")
                    pre.appendChild(s.last_inline_code)
                    addNode(s, MdNodeType.CodeBlock, pre, s.last_inline_code)
                    s.code_block_lang = true
                } else {
                    addNode(s, MdNodeType.CodeInline, document.createElement("code"))
                }
                s.last_inline_code = null

                continue
            }
            }
        }
        case '\n': {
            s.backticks_count = 0

            switch (s.nodes_type[s.nodes_len]) {
            case MdNodeType.CodeBlock:
                if (s.code_block_lang) {
                    s.code_block_lang = false
                } else {
                    s.text += ch
                }
                continue
            default: 
                flush(s)
                s.nodes_elem[s.nodes_len].appendChild(document.createElement("br"))
                s.text = ""
                continue
            }
        }
        default: 
            s.backticks_count = 0
            s.text += ch
            continue
        }
    }

    if (s.text.length > 0) {
        if (s.nodes_len === 0) {
            addNode(s, MdNodeType.Text, document.createElement("span"))
        }
        s.nodes_elem[s.nodes_len].innerText = s.text
    }
}

main()
export {}