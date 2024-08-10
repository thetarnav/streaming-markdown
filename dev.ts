import * as fs   from "node:fs"
import * as fsp  from "node:fs/promises"
import * as path from "node:path"
import * as url  from "node:url"
import * as http from "node:http"
import * as ws   from "ws"

const dirname         = path.dirname(url.fileURLToPath(import.meta.url))
const index_html_path = path.join(dirname, "index.html")

const HTTP_PORT       = 3000
const WEB_SOCKET_PORT = 8080
// const HTTP_URL        = "http://localhost:" + HTTP_PORT
const WEB_SOCKET_URL  = "ws://localhost:" + WEB_SOCKET_PORT
const MESSAGE_RELOAD  = "reload"

const reload_client_script = /*html*/`<script>
new WebSocket("${WEB_SOCKET_URL}").addEventListener("message",
	event => event.data === "${MESSAGE_RELOAD}" && location.reload(),
)
</script>`

function main() {
	const server = makeHttpServer(requestListener)
	const wss = new ws.WebSocketServer({port: WEB_SOCKET_PORT})
	
	const watched_paths = new Set<string>()
	
	function exit() {
		void server.close()
		void wss.close()
		sendToAllClients(wss, MESSAGE_RELOAD)
		clearWatchedFiles()
		void process.exit(0)
	}
	void process.on("SIGINT", exit)
	void process.on("SIGTERM", exit)
	
	function onFileChange(stat: fs.Stats) {
		if (stat.isDirectory()) return
		// eslint-disable-next-line no-console
		console.log("Reloading page...")
		sendToAllClients(wss, MESSAGE_RELOAD)
		clearWatchedFiles()
	}
	
	function clearWatchedFiles() {
		for (const filename of watched_paths) fs.unwatchFile(filename)
		watched_paths.clear()
	}
	
	const WATCH_FILE_OPTIONS = /** @type {const} */({interval: 200})
	
	function watchFile(filepath: string) {
		if (watched_paths.has(filepath)) return
	
		watched_paths.add(filepath)
		void fs.watchFile(filepath, WATCH_FILE_OPTIONS, onFileChange)
	}
	
	/** @returns {Promise<void>} */
	async function requestListener(
		req: http.IncomingMessage,
		res: http.ServerResponse,
	) {
		if (!req.url || req.method !== "GET") return end404(req, res)

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
function toWebFilepath(path: string) {
	return path.endsWith("/") ? path + "index.html" : path
}

function makeHttpServer(requestListener: http.RequestListener): http.Server {
	const server = http.createServer(requestListener).listen(HTTP_PORT)

	// eslint-disable-next-line no-console
	console.log(
		`#` +`\n`+
		`# Server running at http://127.0.0.1:` + HTTP_PORT +`\n`+
		`#`
	)

	return server
}

type BufferLike = Parameters<ws.WebSocket["send"]>[0]

function sendToAllClients(wss: ws.WebSocketServer, data: BufferLike) {
	for (const client of wss.clients) {
		client.send(data)
	}
}

function end404(req: http.IncomingMessage, res: http.ServerResponse) {
	void res.writeHead(404)
	void res.end()
	// eslint-disable-next-line no-console
	console.log(`${req.method} ${req.url} 404`)
}

function toExt(filepath: string) {
	return path.extname(filepath).substring(1).toLowerCase()
}

function mimeType(ext: string) {
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
 */
function matchesAcceptsHeader(accept: string | undefined, mime_type: string) {
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

function streamStatic(req: http.IncomingMessage, res: http.ServerResponse, filepath: string) {
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