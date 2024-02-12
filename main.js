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
        this.container        = container
        this.backticks_count  = 0
        this.last_inline_code = /**@type {HTMLElement?}*/(null)
        this.code_inline      = /**@type {HTMLElement?}*/(null)
        this.code_block       = /**@type {HTMLElement?}*/(null)
        this.italic           = /**@type {HTMLElement?}*/(null)
        this.text_el          = /**@type {HTMLElement?}*/(null)
        this.text             = ""
        this.code_block_lang  = false
    }
}

/**
 * @param   {MdStream} s 
 * @returns {void}
 */
function flush(s) {
    if (s.text.length === 0) return
    if (!s.text_el) {
        s.text_el = document.createElement("span")
        s.container.appendChild(s.text_el)
    }
    console.log(`flush: "${s.text}"`)
    s.text_el.innerText = s.text
    s.text = ""
    s.text_el = null
}

/**
 * @param   {MdStream} s 
 * @param   {string}   chunk 
 * @returns {void}
 */
function addChunk(s, chunk) {
    console.log(`chunk: "${chunk}"`)

    for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i]

        switch (ch) {
        case '*': {
            if (s.code_block || s.code_inline) break

            flush(s)
            if (s.italic) {
                s.italic = null
            } else {
                s.text_el = s.italic = document.createElement("i")
                s.container.appendChild(s.text_el)
            }

            continue
        }
        case '`': {
            s.backticks_count += 1

            if (s.backticks_count === 3) {
                s.backticks_count = 0

                flush(s)
                if (s.code_block) {
                    s.code_block = null
                } else {
                    if (s.last_inline_code) {
                        s.container.removeChild(s.last_inline_code)
                        s.last_inline_code = null
                    }

                    const pre = document.createElement("pre")
                    s.container.appendChild(pre)
                    s.text_el = s.code_block = document.createElement("code")
                    pre.appendChild(s.code_block)
                    s.code_block_lang = true
                }

                continue
            }

            if (!s.code_block) {
                flush(s)
                if (s.code_inline) {
                    s.code_inline = null
                } else {
                    s.text_el = s.code_inline = document.createElement("code")
                    s.container.appendChild(s.text_el)
                    s.last_inline_code = null
                }
            }

            continue
        }
        case '\n': {
            if (s.code_block) {
                if (s.code_block_lang) {
                    s.code_block_lang = false
                } else {
                    s.text += ch
                }
                continue
            }

            flush(s)
            s.text = "\n"
            s.italic = null
            s.code_inline = null
            s.last_inline_code = null
            s.backticks_count = 0

            continue
        }
        }

        if (s.code_block_lang) continue

        s.backticks_count = 0
        s.text += ch

        continue
    }

    if (!s.text_el) {
        s.text_el = document.createElement("span")
        s.container.appendChild(s.text_el)
    }
    s.text_el.innerText = s.text
}

main()
export {}