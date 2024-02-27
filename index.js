import * as mds from "./mds/mds.js"

async function main() {
    const source_res = await fetch("readme.md")
    const source_txt = await source_res.text()

    const container = /** @type {HTMLElement} */(document.getElementById("markdown"))
    const renderer = mds.default_renderer(container)
    // const renderer = mds.logger_renderer()
    const parser = mds.parser(renderer)

    let i = 0
    while (i < source_txt.length) {
        const length = Math.floor(Math.random() * 20) + 1
        const delay  = Math.floor(Math.random() * 80) + 10
        const chunk  = source_txt.slice(i, i += length)
        await new Promise(resolve => setTimeout(resolve, delay))
        mds.parser_write(parser, chunk)
    }

    mds.parser_end(parser)
}

main()
export {}
