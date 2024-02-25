import * as t      from "node:test"
import * as assert from "node:assert/strict"

import * as mds    from "./mds.js"

/**
 * @typedef {(string | Test_Renderer_Node)[]} Test_Renderer_Children
 * 
 * @typedef  {object} Test_Renderer_Data
 * @property {Test_Renderer_Node | null} root
 * @property {string                   } temp_text
 * @property {Test_Renderer_Node | null} temp_node
 *
 * @typedef  {object} Test_Renderer_Node
 * @property {mds.Token_Type        } type
 * @property {Test_Renderer_Children} children
 *
 * @typedef {mds.Renderer         <Test_Renderer_Data, Test_Renderer_Node>} Test_Renderer
 * @typedef {mds.Renderer_Add_Node<Test_Renderer_Data, Test_Renderer_Node>} Test_Add_Node
 * @typedef {mds.Renderer_Add_Text<Test_Renderer_Data, Test_Renderer_Node>} Test_Add_Text
 * @typedef {mds.Renderer_Add_Temp<Test_Renderer_Data, Test_Renderer_Node>} Test_Add_Temp
 */

/** @returns {Test_Renderer} */
function test_renderer() {
    return {
		add_node: test_add_node,
        add_text: test_add_text,
        add_temp: test_add_temp,
        data    : {
			root     : null,
			temp_text: "",
			temp_node: null
		},
    }
}
/** @type {Test_Add_Node} */
function test_add_node(data, type, parent) {
	/** @type {Test_Renderer_Node} */
    const node = {type, children: []}
	if (parent === null) {
		assert.equal(data.root, null, "Root node already exists")
		data.root = node
	} else {
		parent.children.push(node)
	}
	return node
}
/** @type {Test_Add_Text} */
function test_add_text(data, node, text) {
	node.children.push(text)
}
/** @type {Test_Add_Temp} */
function test_add_temp(data, node, text) {
	if (node === null || text === "") {
		data.temp_text      = ""
		data.temp_node = null
	} else {
		data.temp_text      = text
		data.temp_node = node
	}
}

const content_1 = "Hello, World!"
const content_2 = "Goodbye, World!"

for (let level = 1; level <= 6; level += 1) {

	/** @type {mds.Token_Type} */
	let heading_type
	switch (level) {
		case 1: heading_type = mds.Token_Type.Heading_1; break
		case 2: heading_type = mds.Token_Type.Heading_2; break
		case 3: heading_type = mds.Token_Type.Heading_3; break
		case 4: heading_type = mds.Token_Type.Heading_4; break
		case 5: heading_type = mds.Token_Type.Heading_5; break
		case 6: heading_type = mds.Token_Type.Heading_6; break
		default: throw new Error("Invalid heading level")
	}

	t.test(`Heading_${level}`, () => {
		const renderer = test_renderer()
		const parser = mds.parser(renderer)

		mds.write(parser, "#".repeat(level) + " " + content_1)

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : heading_type,
				children: []
			}]
		})
		assert.equal(renderer.data.temp_text, content_1)
		assert.equal(renderer.data.temp_node, renderer.data.root.children[0])

		mds.end(parser)

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : heading_type,
				children: [content_1]
			}]
		})
		assert.equal(renderer.data.temp_text, "")
		assert.equal(renderer.data.temp_node, null)
	})

	t.test(`Heading_${level} with Italic`, () => {
		const renderer = test_renderer()
		const parser = mds.parser(renderer)

		mds.write(parser, "#".repeat(level) + " " + content_1)

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : heading_type,
				children: []
			}]
		})
		assert.equal(renderer.data.temp_text, content_1)
		assert.equal(renderer.data.temp_node, renderer.data.root.children[0])

		mds.write(parser, " *" + content_2 + "*")

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : heading_type,
				children: [content_1 + " ", {
					type    : mds.Token_Type.Italic_Ast,
					children: []
				}]
			}]
		})
		assert.equal(renderer.data.temp_text, content_2 + "*")
		assert.equal(renderer.data.temp_node, renderer.data.root.children[0].children[1])

		mds.end(parser)

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : heading_type,
				children: [content_1 + " ", {
					type    : mds.Token_Type.Italic_Ast,
					children: [content_2]
				}]
			}]
		})
		assert.equal(renderer.data.temp_text, "")
		assert.equal(renderer.data.temp_node, null)
	})
}

t.test("Line Breaks", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, content_1 + "\n" + content_2)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: [content_1, "\n"],
		}]
	})
	assert.equal(renderer.data.temp_text, content_2)
	assert.equal(renderer.data.temp_node, renderer.data.root.children[0])

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: [content_1, "\n", content_2],
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Line Breaks with Italic", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "*" + content_1 + "\n" + content_2 + "*")
	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: [{
				type    : mds.Token_Type.Italic_Ast,
				children: [content_1, "\n", content_2]
			}],
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Paragraphs", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, content_1 + "\n" + "\n" + content_2)
	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: [content_1],
		}, {
			type    : mds.Token_Type.Paragraph,
			children: [content_2],
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Paragraph with Italic", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "*" + content_1 + "*")
	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: [{
				type    : mds.Token_Type.Italic_Ast,
				children: [content_1]
			}],
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Empty Code_Block", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "```\n")

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: []
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)

	mds.write(parser, "```")

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: []
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: []
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Code_Block", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "```\n")
	mds.write(parser, content_1 + "\n")
	mds.write(parser, "```")

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Code_Block with language", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "```js\n")
	mds.write(parser, content_1 + "\n")
	mds.write(parser, "```")

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

for (const token of [
	mds.Token_Type.Italic_Ast,
	mds.Token_Type.Italic_Und,
	mds.Token_Type.Strong_Ast,
	mds.Token_Type.Strong_Und,
]) {
	/** @type {string} */
	let char
	/** @type {string} */
	let escaped
	switch (token) {
		case mds.Token_Type.Italic_Ast: char = "*" ; escaped = "\\*"   ; break
		case mds.Token_Type.Italic_Und: char = "_" ; escaped = "\\_"   ; break
		case mds.Token_Type.Strong_Ast: char = "**"; escaped = "\\*\\*"; break
		case mds.Token_Type.Strong_Und: char = "__"; escaped = "\\_\\_"; break
		default: throw new Error("Invalid token")
	}

	t.test(`Escape ${mds.token_type_to_string(token)} Begin`, () => {
		const renderer = test_renderer()
		const parser = mds.parser(renderer)

		mds.write(parser, escaped + content_1)
		mds.end(parser)

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : mds.Token_Type.Paragraph,
				children: [char + content_1]
			}]
		})
		assert.equal(renderer.data.temp_text, "")
		assert.equal(renderer.data.temp_node, null)
	})

	t.test(`Escape ${mds.token_type_to_string(token)} End`, () => {
		const renderer = test_renderer()
		const parser = mds.parser(renderer)

		mds.write(parser, char + content_1 + escaped)
		mds.end(parser)

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : mds.Token_Type.Paragraph,
				children: [{
					type    : token,
					children: [content_1 + char]
				}]
			}]
		})
		assert.equal(renderer.data.temp_text, "")
		assert.equal(renderer.data.temp_node, null)
	})
}

t.test("Escape Backtick", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "\\`" + content_1)
	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: ["`" + content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Escape Backslash", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "\\\\" + content_1)
	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: ["\\" + content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})

t.test("Escape normal char", () => {
	const renderer = test_renderer()
	const parser = mds.parser(renderer)

	mds.write(parser, "\\a" + content_1)
	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: ["\\a" + content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_node, null)
})
