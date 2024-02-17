import * as md_stream from './md_stream_next.js'

async function main() {
    const source_md_res = await fetch(location.href + '/source.md')
    const source_md = await source_md_res.text()

    const container = document.createElement('main')
    document.body.appendChild(container)

    const stream = new md_stream.Stream(container)

    let i = 0
    while (i < source_md.length) {
        const length = Math.floor(Math.random() * 20) + 1
        const delay  = Math.floor(Math.random() * 80) + 10
        const chunk  = source_md.slice(i, i += length)
        md_stream.puch_chunk(stream, chunk)
        await new Promise(resolve => setTimeout(resolve, delay))
    }

    md_stream.end(stream)
}


main()
export {}