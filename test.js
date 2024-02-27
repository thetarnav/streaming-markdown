import * as t      from "node:test"
import * as assert from "node:assert/strict"

import * as mds    from "./mds.js"

/**
 * @typedef {(string | Test_Renderer_Node)[]} Children
 * @typedef {Map<Test_Renderer_Node, Test_Renderer_Node>} Parent_Map
 *
 * @typedef  {object} Test_Renderer_Data
 * @property {Test_Renderer_Node} root
 * @property {Test_Renderer_Node} node
 * @property {Parent_Map        } parent_map
 *
 * @typedef  {object} Test_Renderer_Node
 * @property {mds.Token_Type} type
 * @property {Children      } children
 *
 * @typedef {mds.Renderer         <Test_Renderer_Data>} Test_Renderer
 * @typedef {mds.Renderer_Add_Node<Test_Renderer_Data>} Test_Add_Node
 * @typedef {mds.Renderer_End_Node<Test_Renderer_Data>} Test_End_Node
 * @typedef {mds.Renderer_Add_Text<Test_Renderer_Data>} Test_Add_Text
 */

/** @returns {Test_Renderer} */
function test_renderer() {
	/** @type {Test_Renderer_Node} */
	const root = {
		type    : mds.Token_Type.Root,
		children: []
	}
	return {
		add_node: test_renderer_add_node,
		end_node: test_renderer_end_node,
		add_text: test_renderer_add_text,
		data    : {
			parent_map: new Map(),
			root: root,
			node: root,
		},
	}
}
/** @type {Test_Add_Node} */
function test_renderer_add_node(type, data) {
	/** @type {Test_Renderer_Node} */
    const node = {type, children: []}
	const parent = data.node
	parent.children.push(node)
	data.parent_map.set(node, parent)
	data.node = node
}
/** @type {Test_Add_Text} */
function test_renderer_add_text(text, data) {
	if (text === "") return

	if (text !== "\n" &&
		typeof data.node.children[data.node.children.length - 1] === "string" &&
		data.node.children[data.node.children.length - 1] !== "\n"
	) {
		data.node.children[data.node.children.length - 1] += text
	} else {
		data.node.children.push(text)
	}
}
/** @type {Test_End_Node} */
function test_renderer_end_node(data) {
	const parent = data.parent_map.get(data.node)
	assert.notEqual(parent, undefined)
	data.node = /** @type {Test_Renderer_Node} */(parent)
}

/**
 * @param {string  } title
 * @param {string  } markdown
 * @param {Children} expected_children
 * @returns {void}
 */
function test_single_write(title, markdown, expected_children) {
	t.test(title, () => {
		const renderer = test_renderer()
		const parser = mds.parser(renderer)

		mds.parser_write(parser, markdown)
		mds.parser_end(parser)

		assert.deepEqual(renderer.data.root.children, expected_children)
	})

	t.test(title + " (by char)", () => {
		const renderer = test_renderer()
		const parser = mds.parser(renderer)

		for (const char of markdown) {
			mds.parser_write(parser, char)
		}
		mds.parser_end(parser)

		assert.deepEqual(renderer.data.root.children, expected_children)
	})
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

	test_single_write(`Heading_${level}`,
		"#".repeat(level) + " " + content_1,
		[{
			type    : heading_type,
			children: [content_1]
		}]
	)

	test_single_write(`Heading_${level} with Line Italic`,
		"#".repeat(level) + " " + content_1 + " *" + content_2 + "*",
		[{
			type    : heading_type,
			children: [content_1 + " ", {
				type    : mds.Token_Type.Italic_Ast,
				children: [content_2]
			}]
		}]
	)
}

test_single_write("Line Breaks",
	content_1 + "\n" + content_2,
	[{
		type    : mds.Token_Type.Paragraph,
		children: [content_1, "\n", content_2],
	}]
)

test_single_write("Line Breaks with Italic",
	"*" + content_1 + "\n" + content_2 + "*",
	[{
		type    : mds.Token_Type.Paragraph,
		children: [{
			type    : mds.Token_Type.Italic_Ast,
			children: [content_1, "\n", content_2]
		}],
	}]
)

test_single_write("Paragraphs",
	content_1 + "\n" + "\n" + content_2,
	[{
		type    : mds.Token_Type.Paragraph,
		children: [content_1],
	}, {
		type    : mds.Token_Type.Paragraph,
		children: [content_2],
	}]
)

test_single_write("Paragraph with Italic", 
	"*" + content_1 + "*",
	[{
		type    : mds.Token_Type.Paragraph,
		children: [{
			type    : mds.Token_Type.Italic_Ast,
			children: [content_1]
		}],
	}]
)

test_single_write("Empty Code_Block",
	"```\n```",
	[{
		type    : mds.Token_Type.Code_Block,
		children: []
	}]
)

test_single_write("Code_Block",
	"```\n" + content_1 + "\n```",
	[{
		type    : mds.Token_Type.Code_Block,
		children: [content_1]
	}]
)

test_single_write("Code_Block with language",
	"```js\n" + content_1 + "\n```",
	[{
		type    : mds.Token_Type.Code_Block,
		children: [content_1]
	}]
)

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

	test_single_write(`Escape ${mds.token_type_to_string(token)} Begin`,
		escaped + content_1,
		[{
			type    : mds.Token_Type.Paragraph,
			children: [char + content_1]
		}]
	)

	test_single_write(`Escape ${mds.token_type_to_string(token)} End`,
		char + content_1 + escaped,
		[{
			type    : mds.Token_Type.Paragraph,
			children: [{
				type    : token,
				children: [content_1 + char]
			}]
		}]
	)
}

test_single_write("Escape Backtick",
	"\\`" + content_1,
	[{
		type    : mds.Token_Type.Paragraph,
		children: ["`" + content_1]
	}]
)

test_single_write("Escape Backslash",
	"\\\\" + content_1,
	[{
		type    : mds.Token_Type.Paragraph,
		children: ["\\" + content_1]
	}]
)

test_single_write("Escape normal char",
	"\\a",
	[{
		type    : mds.Token_Type.Paragraph,
		children: ["\\a"]
	}]
)

test_single_write("Link",
	"[" + content_1 + "](url)",
	[{
		type    : mds.Token_Type.Paragraph,
		children: [{
			type    : mds.Token_Type.Link,
			children: [content_1],
		}]
	}]
)

test_single_write("Link with code",
	"[`" + content_1 + "`](url)",
	[{
		type    : mds.Token_Type.Paragraph,
		children: [{
			type    : mds.Token_Type.Link,
			children: [{
				type    : mds.Token_Type.Code_Inline,
				children: [content_1],
			}],
		}]
	}]
)

test_single_write("Escaped link Begin",
	"\\[" + content_1 + "](url)",
	[{
		type    : mds.Token_Type.Paragraph,
		children: ["[" + content_1 + "](url)"]
	}]
)

test_single_write("Escaped link End",
	"[" + content_1 + "\\](url)",
	[{
		type    : mds.Token_Type.Paragraph,
		children: [{
			type    : mds.Token_Type.Link,
			children: [content_1 + "](url)"],
		}]
	}]
)

test_single_write("Un-Escaped link Both",
	"\\\\[" + content_1 + "\\\\](url)",
	[{
		type    : mds.Token_Type.Paragraph,
		children: ["\\", {
			type    : mds.Token_Type.Link,
			children: [content_1 + "\\"],
		}]
	}]
)