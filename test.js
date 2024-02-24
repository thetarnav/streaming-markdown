import * as t      from "node:test"
import * as assert from "node:assert/strict"

import * as mds    from "./lib/mds.js"

/**
 * @typedef {object} Test_Renderer_Data
 * @property {Test_Renderer_Node | null} root
 * @property {string} temp_text
 * @property {Test_Renderer_Node | null} temp_text_node
 *
 * @typedef {object} Test_Renderer_Node
 * @property {mds.Token_Type} type
 * @property {(string | Test_Renderer_Node)[]} children
 *
 * @typedef {mds.Renderer         <Test_Renderer_Data, Test_Renderer_Node>} Test_Renderer
 * @typedef {mds.Create_Token_Node<Test_Renderer_Data, Test_Renderer_Node>} Test_Create_Node
 * @typedef {mds.Update_Token_Node<Test_Renderer_Data, Test_Renderer_Node>} Test_Update_Node
 * @typedef {mds.Render_Temp_Text <Test_Renderer_Data, Test_Renderer_Node>} Test_Render_Temp_Text
 */

/** @returns {Test_Renderer} */
function test_renderer() {
    return {
        data: {
			root          : null,
			temp_text     : "",
			temp_text_node: null
		},
        create_node     : test_create_node,
        update_node     : test_update_node,
        render_temp_text: test_render_temp_text,
    }
}
/** @type {Test_Create_Node} */
function test_create_node(data, type, parent) {
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
/** @type {Test_Update_Node} */
function test_update_node(data, node, text) {
	node.children.push(text)
}
/** @type {Test_Render_Temp_Text} */
function test_render_temp_text(data, node, text) {
	if (node === null || text === "") {
		data.temp_text      = ""
		data.temp_text_node = null
	} else {
		data.temp_text      = text
		data.temp_text_node = node
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
		assert.equal(renderer.data.temp_text_node, renderer.data.root.children[0])

		mds.end(parser)

		assert.deepEqual(renderer.data.root, {
			type    : mds.Token_Type.Root,
			children: [{
				type    : heading_type,
				children: [content_1]
			}]
		})
		assert.equal(renderer.data.temp_text, "")
		assert.equal(renderer.data.temp_text_node, null)
	})

	t.test(`Heading_${level} with Emphasis`, () => {
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
		assert.equal(renderer.data.temp_text_node, renderer.data.root.children[0])

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
		assert.equal(renderer.data.temp_text_node, renderer.data.root.children[0].children[1])

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
		assert.equal(renderer.data.temp_text_node, null)
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
	assert.equal(renderer.data.temp_text_node, renderer.data.root.children[0])

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Paragraph,
			children: [content_1, "\n", content_2],
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_text_node, null)
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
	assert.equal(renderer.data.temp_text_node, null)
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
	assert.equal(renderer.data.temp_text_node, null)

	mds.write(parser, "```")

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [""]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_text_node, null)

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [""]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_text_node, null)
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
	assert.equal(renderer.data.temp_text_node, null)

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_text_node, null)
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
	assert.equal(renderer.data.temp_text_node, null)

	mds.end(parser)

	assert.deepEqual(renderer.data.root, {
		type    : mds.Token_Type.Root,
		children: [{
			type    : mds.Token_Type.Code_Block,
			children: [content_1]
		}]
	})
	assert.equal(renderer.data.temp_text, "")
	assert.equal(renderer.data.temp_text_node, null)
})