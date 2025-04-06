import * as fs   from "node:fs"
import * as fsp  from "node:fs/promises"
import * as path from "node:path"
import * as url  from "node:url"
import * as http from "node:http"

const dirname         = path.dirname(url.fileURLToPath(import.meta.url))
const index_html_path = path.join(dirname, "index.html")

const HTTP_PORT       = 3000
const HTTP_URL        = "http://localhost:" + HTTP_PORT
const SSE_ENDPOINT    = "/events"
const MESSAGE_RELOAD  = "reload"

const reload_client_script = /*html*/`<script>
const evtSource = new EventSource("${SSE_ENDPOINT}");
evtSource.onmessage = event => event.data === "${MESSAGE_RELOAD}" && location.reload();
evtSource.onerror = () => {
    // Try to reconnect if connection is lost
    setTimeout(() => new EventSource("${SSE_ENDPOINT}"), 1000);
};
</script>`

function main() {
    const server = makeHttpServer(requestListener)
    const clients = /** @type {Set<http.ServerResponse>} */(new Set())

    const watched_paths = /** @type {Set<string>} */(new Set())

    function exit() {
        void server.close()
        sendToAllClients(clients, MESSAGE_RELOAD)
        clearWatchedFiles()
        void process.exit(0)
    }
    void process.on("SIGINT", exit)
    void process.on("SIGTERM", exit)

    /**
     * @param   {fs.Stats} stat
     * @returns {void} */
    function onFileChange(stat) {
        if (stat.isDirectory()) return
        // eslint-disable-next-line no-console
        console.log("Reloading page...")
        sendToAllClients(clients, MESSAGE_RELOAD)
        clearWatchedFiles()
    }

    function clearWatchedFiles() {
        for (const filename of watched_paths) fs.unwatchFile(filename)
        watched_paths.clear()
    }

    const WATCH_FILE_OPTIONS = /** @type {const} */({interval: 200})

    /**
     * @param   {string} filepath
     * @returns {void} */
    function watchFile(filepath) {
        if (watched_paths.has(filepath)) return

        watched_paths.add(filepath)
        void fs.watchFile(filepath, WATCH_FILE_OPTIONS, onFileChange)
    }

    /** @returns {Promise<void>} */
    async function requestListener(
        /** @type {http.IncomingMessage} */ req,
        /** @type {http.ServerResponse} */ res,
    ) {
        if (!req.url || req.method !== "GET") return end404(req, res)

        // Set up SSE connection
        if (req.url === SSE_ENDPOINT) {

            res.writeHead(200, {
                "Content-Type":  "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection":    "keep-alive"
            })

            res.write(":\n\n") // initial comment to keep connection open

            clients.add(res)
            req.on("close", () => clients.delete(res))

            return
        }

        if (req.url === "/") {
            const html = await fsp.readFile(index_html_path, "utf8")
            void res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"})
            void res.end(html + reload_client_script)
            watchFile(index_html_path)
            return
        }

        let url_path = path.join(dirname, toWebFilepath(req.url))

        try {await fsp.access(url_path)}
        catch (e) {return end404(req, res)}

        watchFile(url_path)
        streamStatic(req, res, url_path)
    }
}

/** @returns {string} */
function toWebFilepath(/** @type {string} */ path) {
    return path.endsWith("/") ? path + "index.html" : path
}

/**
 * @param   {http.RequestListener} requestListener
 * @returns {http.Server}
 */
function makeHttpServer(requestListener) {
    const server = http.createServer(requestListener).listen(HTTP_PORT)

    // eslint-disable-next-line no-console
    console.log(
        `#` +`\n`+
        `# Server running at http://127.0.0.1:` + HTTP_PORT +`\n`+
        `#`
    )

    return server
}

/** @returns {void} */
function sendToAllClients(/** @type {Set<http.ServerResponse>} */ clients, /** @type {string} */ data) {
    for (const client of clients) {
        client.write(`data: ${data}\n\n`)
    }
}

/**
 * @param   {http.IncomingMessage} req
 * @param   {http.ServerResponse}  res
 * @returns {void}
 */
function end404(req, res) {
    void res.writeHead(404)
    void res.end()
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.url} 404`)
}

/** @returns {string} */
function toExt(/** @type {string} */ filepath) {
    return path.extname(filepath).substring(1).toLowerCase()
}

/** @returns {string} */
function mimeType(/** @type {string} */ ext) {
    switch (ext) {
    case "html": return "text/html; charset=UTF-8"
    case "js":
    case "mjs":  return "application/javascript"
    case "json": return "application/json"
    case "wasm": return "application/wasm"
    case "css":  return "text/css"
    case "png":  return "image/png"
    case "jpg":  return "image/jpg"
    case "gif":  return "image/gif"
    case "ico":  return "image/x-icon"
    case "svg":  return "image/svg+xml"
    default:     return "application/octet-stream"
    }
}

/**
 * Checks if the accept header string matches the given mime type.
 *
 * @param {string | undefined} accept - The accept header.
 * @param {string} mime_type - The mime type to check.
 * @returns {boolean}
 */
function matchesAcceptsHeader(accept, mime_type) {
    if (accept === undefined) return true

    const l = mime_type.length
    let i = 0
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
        const j = accept.indexOf(mime_type, i)
        const d = j - i
        if (d === -1) break
        if (d === 0) return true
        if (accept[j - 1] === ",") return true
        i = j + l + 1
    }

    i = 0
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
        const j = accept.indexOf("*/*", i)
        const d = j - i
        if (d === -1) return false
        if (d === 0) return true
        if (accept[j - 1] === ",") return true
        i = j + 4
    }
}

/**
 * @param   {http.IncomingMessage} req
 * @param   {http.ServerResponse}  res
 * @param   {string}               filepath
 * @returns {void}
 */
function streamStatic(req, res, filepath) {
    const ext = toExt(filepath)
    const mime_type = mimeType(ext)

    if (!matchesAcceptsHeader(req.headers.accept, mime_type)) {
        return end404(req, res)
    }

    void res.writeHead(200, {"Content-Type": mime_type})

    const stream = fs.createReadStream(filepath)
    void stream.pipe(res)

    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.url} 200`)
}


main()
