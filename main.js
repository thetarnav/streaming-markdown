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
    Text:       0,
    Italic:     1,
    Bold:       2,
    CodeInline: 3,
    CodeBlock:  4,
})

/** @param {HTMLElement} container */
function MdStream(container) {
    this.nodes_elem      =/**@type {HTMLElement[]}*/([container      ,,,,,])
    this.nodes_type      =/**@type {MdNodeType[] }*/([MdNodeType.Text,,,,,])
    this.nodes_len       =/**@type {number       }*/(0)
    this.last_type       =/**@type {MdNodeType   }*/(0)
    this.last_elem       =/**@type {HTMLElement  }*/(container)
    this.text            =/**@type {string       }*/("")
    this.last_char       =/**@type {string       }*/("")
    this.backticks_count =/**@type {number       }*/(0)
    this.code_block_lang =/**@type {boolean      }*/(false)
    this.temp_span       =/**@type {HTMLElement  }*/(document.createElement("span"))
}

/**
 * @param   {MdStream} s 
 * @returns {void    } */
function flush(s) {
    console.assert(
        s.nodes_len >= 0,
        "nodes_len should never below 0",
    )
    console.log(`flush: "${s.text}"`)
    if (s.text.length > 0) {
        s.nodes_elem[s.nodes_len].appendChild(document.createTextNode(s.text))
        s.text = ""
    }
}

/**
 * @param   {MdStream} s
 * @returns {void    } */
function endNode(s) {
    flush(s)
    s.last_type = s.nodes_type[s.nodes_len]
    s.last_elem = s.nodes_elem[s.nodes_len]
    if (s.nodes_len > 0) {
        s.nodes_len -= 1
    }
}

/**
 * @param   {MdStream    } s
 * @param   {MdNodeType  } type
 * @param   {HTMLElement } container_el element to append to parent
 * @param   {HTMLElement=} text_el      element to write text to
 * @returns {void        } */
function addNode(s, type, container_el, text_el = container_el) {
    flush(s)
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

    let i = 0,
        char = s.last_char,
        last_char = s.last_char
    
    while (i < chunk.length) {
        last_char = char
        char = chunk[i]
        i += 1

        switch (char) {
        case '*': {
            if (last_char === '*') {
                switch (s.nodes_type[s.nodes_len]) {
                case MdNodeType.CodeInline:
                case MdNodeType.CodeBlock:
                    if (!s.code_block_lang) s.text += char
                    continue
                case MdNodeType.Italic:
                    if (s.nodes_type[s.nodes_len-1] === MdNodeType.Bold) {
                        /*
                        Leaving Bold
                        "**bold**"
                                ^
                        */
                        s.nodes_elem[s.nodes_len-1].removeChild(s.nodes_elem[s.nodes_len])
                        s.nodes_len -= 1
                        endNode(s)
                    } else {
                        /*
                        Entering Bold in Text
                        "text **bold"
                               ^
                        */
                        // TODO pool <i> elements instead of throwing them away
                        s.nodes_elem[s.nodes_len-1].removeChild(s.nodes_elem[s.nodes_len])
                        s.nodes_elem[s.nodes_len] = document.createElement("b")
                        s.nodes_elem[s.nodes_len-1].appendChild(s.nodes_elem[s.nodes_len])
                        s.nodes_type[s.nodes_len] = MdNodeType.Bold
                    }
                    continue
                default:
                    /*
                    Entering Bold in Italic
                    "*italic **bold"
                              ^
                    */
                    console.assert(
                        s.nodes_type[s.nodes_len] !== MdNodeType.Bold,
                        "Curret node cannot be Bold, first * should enter Italic",
                    )
                    if (s.last_type === MdNodeType.Italic) {
                        s.nodes_len += 1
                    }
                    addNode(s, MdNodeType.Bold, document.createElement("b"))
                    continue
                }
            } else {
                switch (s.nodes_type[s.nodes_len]) {
                case MdNodeType.CodeInline:
                case MdNodeType.CodeBlock:
                    if (!s.code_block_lang) s.text += char
                    continue
                case MdNodeType.Italic:
                    endNode(s)
                    continue
                default:
                    addNode(s, MdNodeType.Italic, document.createElement("i"))
                    continue
                }
            }
        }
        case '`': {
            s.backticks_count = last_char === '`'
                ? s.backticks_count + 1
                : 1

            switch (s.nodes_type[s.nodes_len]) {
            case MdNodeType.CodeInline: {
                console.assert(
                    s.backticks_count <= 3,
                    "code inline should never have 3 backticks",
                )

                endNode(s)
                continue
            }
            case MdNodeType.CodeBlock: {
                if (s.backticks_count === 3) {
                    s.text = s.text.slice(0, -2)
                    endNode(s)
                } else if (!s.code_block_lang) {
                    s.text += char
                }
                continue
            }
            default: {
                if (s.backticks_count === 3) {
                    console.assert(
                        s.last_type === MdNodeType.CodeInline,
                        "last_type should always be CodeInline when creating CodeBlock",
                    )

                    const pre = document.createElement("pre")
                    pre.appendChild(s.last_elem)
                    addNode(s, MdNodeType.CodeBlock, pre, s.last_elem)
                    s.code_block_lang = true
                } else {
                    addNode(s, MdNodeType.CodeInline, document.createElement("code"))
                }
                continue
            }
            }
        }
        case '\n': {
            switch (s.nodes_type[s.nodes_len]) {
            case MdNodeType.CodeBlock:
                if (s.code_block_lang) {
                    s.code_block_lang = false
                } else {
                    s.text += char
                }
                continue
            default: 
                endNode(s)
                s.nodes_elem[s.nodes_len].appendChild(document.createElement("br"))
                s.text = ""
                continue
            }
        }
        default: 
            if (!s.code_block_lang) s.text += char
            continue
        }
    }

    s.last_char = char
    s.nodes_elem[s.nodes_len].appendChild(s.temp_span).innerText = s.text
}

main()
export {}