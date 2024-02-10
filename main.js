// @ts-check

async function main() {
    const source_md_res = await fetch(location.origin + '/source.md')
    const source_md = await source_md_res.text()

    const container = document.createElement('div')
    document.body.appendChild(container)

    const state = new MdStream(container)

    let i = 0
    while (i < source_md.length) {
        const length = Math.floor(Math.random() * 20) + 1
        const delay  = Math.floor(Math.random() * 80) + 10
        const chunk  = source_md.slice(i, i += length)
        addChunk(state, chunk)
        await new Promise(resolve => setTimeout(resolve, delay))
    }
}

class MdStream {
    /**
     * @param {HTMLElement} container 
     */
    constructor(container) {
        this.container          = container
        this.backticks_count    = 0
        /** @type {HTMLElement | null} */
        this.last_inline_code   = null
        /** @type {HTMLElement | null} */
        this.code_inline        = null
        /** @type {HTMLElement | null} */
        this.code_block         = null
        /** @type {HTMLElement | null} */
        this.text_el            = null
        this.text               = ""
        this.in_code_block_lang = false
    }
}

/**
 * @param   {MdStream} s 
 * @param   {string}   chunk 
 * @returns {void}
 */
function addChunk(s, chunk) {
    for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i]

        if (ch === "`") {
            s.backticks_count += 1

            if (s.backticks_count === 3) {
                s.backticks_count = 0

                if (s.code_block) {
                    s.code_block.innerText = s.text
                    s.text = ""
                    s.code_block = null
                    s.text_el = null
                } else {
                    if (s.last_inline_code) {
                        s.container.removeChild(s.last_inline_code)
                        s.last_inline_code = null
                    }

                    if (s.text_el) {
                        s.text_el.innerText = s.text
                        s.text = ""
                    }

                    const pre = document.createElement("pre")
                    s.container.appendChild(pre)
                    s.text_el = document.createElement("code")
                    pre.appendChild(s.text_el)
                    s.code_block = s.text_el
                    s.in_code_block_lang = true
                }

                continue
            }

            if (!s.code_block) {
                if (s.code_inline) {
                    s.code_inline.innerText = s.text
                    s.text = ""
                    s.last_inline_code = s.code_inline
                    s.code_inline = null
                    s.text_el = null
                } else {
                    if (s.text_el) {
                        s.text_el.innerText = s.text
                        s.text = ""
                    }

                    s.text_el = document.createElement("code")
                    s.container.appendChild(s.text_el)
                    s.code_inline = s.text_el
                    s.last_inline_code = null
                }
            }

            continue
        }

        if (ch === "\n") {
            if (s.in_code_block_lang) {
                s.in_code_block_lang = false
                continue
            }

            if (s.code_inline) {
                s.code_inline.innerText = s.text
                s.text = ""
                s.text_el = null
                s.code_inline = null
            }

            if (!s.text_el) {
                s.text_el = document.createElement("span")
                s.container.appendChild(s.text_el)
            }

            s.backticks_count = 0
            s.text += ch
        } else {
            if (s.in_code_block_lang) continue

            if (!s.text_el) {
                s.text_el = document.createElement("span")
                s.container.appendChild(s.text_el)
            }

            s.backticks_count = 0
            s.text += ch
        }
    }

    if (s.text_el) {
        s.text_el.innerText = s.text
    } else {
        s.text_el = document.createElement("span")
        s.container.appendChild(s.text_el)
        s.text_el.innerText = s.text
    }
}

main()
export {}