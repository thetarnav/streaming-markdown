import path from "node:path"
import url  from "node:url"
import ts   from "typescript"

const dirname   = path.dirname(url.fileURLToPath(import.meta.url))
const src_entry = path.join(dirname, "mds", "mds.js")

/** @type {ts.CompilerOptions} */
const ts_options = {
	allowJs             : true,
	checkJs             : true,
	skipLibCheck        : false,
	maxNodeModuleJsDepth: 1,
	emitDeclarationOnly : true,
	noEmit              : false,
	noEmitOnError       : false,
	declaration         : true,
}

function main() {
	const begin = performance.now()
    const program = ts.createProgram([src_entry], ts_options)
    program.emit()
    console.log(`DTS complete in ${Math.ceil(performance.now() - begin)}ms`)
}


main()