new WebSocket("ws://localhost:8080").addEventListener("message",
	event => event.data === "reload" && location.reload(),
)