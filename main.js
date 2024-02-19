import * as md_stream from "./md_stream.js"

async function main() {
    const source_res = await fetch(location.href + "/readme.md")
    const source_txt = await source_res.text()

    const container = /** @type {HTMLElement} */(document.getElementById("markdown"))
    const stream = md_stream.stream(container)

    let i = 0
    while (i < source_txt.length) {
        const length = Math.floor(Math.random() * 20) + 1
        const delay  = Math.floor(Math.random() * 80) + 10
        const chunk  = source_txt.slice(i, i += length)
        md_stream.write(stream, chunk)
        await new Promise(resolve => setTimeout(resolve, delay))
    }

    md_stream.end(stream)
}

main()
export {}