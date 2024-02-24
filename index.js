import * as mds from "./lib/mds.js"

async function main() {
    const source_res = await fetch("readme.md")
    const source_txt = await source_res.text()

    const container = /** @type {HTMLElement} */(document.getElementById("markdown"))
    const renderer = mds.default_renderer(container)
    const stream = mds.parser(renderer)

    let i = 0
    while (i < source_txt.length) {
        const length = Math.floor(Math.random() * 20) + 1
        const delay  = Math.floor(Math.random() * 80) + 10
        const chunk  = source_txt.slice(i, i += length)
        mds.write(stream, chunk)
        await new Promise(resolve => setTimeout(resolve, delay))
    }

	// TODO abstract
    mds.end(stream)
	renderer.data.temp.parentElement?.removeChild(renderer.data.temp)
}

main()
export {}
