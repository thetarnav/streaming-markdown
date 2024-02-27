import fs   from "node:fs"
import path from "node:path"
import url  from "node:url"
import ts   from "typescript"

const dirname   = path.dirname(url.fileURLToPath(import.meta.url))
const src_dir   = path.join(dirname, "mds")
const src_entry = path.join(src_dir, "mds.js")

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
	declarationMap	    : true,
}

function main() {
	const begin = performance.now()

	// Remove old .d.ts files except t.d.ts
	const files = fs.readdirSync(src_dir)
	for (const file of files) {
		if ((file.endsWith(".d.ts") && file !== "t.d.ts") ||
			 file.endsWith(".d.ts.map")
		) {
			fs.unlinkSync(path.join(src_dir, file))
		}
	}
	
	// Emit d.ts files
    const program = ts.createProgram([src_entry], ts_options)
    program.emit()
    console.log(`DTS complete in ${Math.ceil(performance.now() - begin)}ms`)
}


main()