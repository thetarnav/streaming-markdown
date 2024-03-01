import * as fs   from "node:fs"
import * as fsp  from "node:fs/promises"
import * as path from "node:path"
import * as url  from "node:url"
import * as http from "node:http"
import * as ws   from "ws"

const dirname            = path.dirname(url.fileURLToPath(import.meta.url))
const reload_client_path = path.join(dirname, "reload_client.js")
const index_html_path    = path.join(dirname, "index.html")

const reload_client_promise = fsp.readFile(reload_client_path, "utf8")

const HTTP_PORT       = 3000
const WEB_SOCKET_PORT = 8080
const HTTP_URL        = "http://localhost:" + HTTP_PORT
const WEB_SOCKET_URL  = "ws://localhost:" + WEB_SOCKET_PORT
const MESSAGE_RELOAD  = "reload"

function main() {
	const server = makeHttpServer(requestListener)
	const wss = new ws.WebSocketServer({port: WEB_SOCKET_PORT})
	
	const watched_paths = /** @type {Set<string>} */(new Set())
	
	function exit() {
		void server.close()
		void wss.close()
		sendToAllClients(wss, MESSAGE_RELOAD)
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
		sendToAllClients(wss, MESSAGE_RELOAD)
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

		if (req.url === "/") {
			const html = await fsp.readFile(index_html_path, "utf8")
			const reload_client = await reload_client_promise
			void res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"})
			void res.end(html + `<script>${reload_client}</script>`)
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

/** @typedef {Parameters<ws.WebSocket["send"]>[0]} BufferLike */

/** @returns {void} */
function sendToAllClients(/** @type {ws.WebSocketServer} */ wss, /** @type {BufferLike} */ data) {
	for (const client of wss.clients) {
		client.send(data)
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