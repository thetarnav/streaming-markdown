import * as t      from "node:test"
import * as assert from "node:assert/strict"

import * as smd    from "./smd.js"

/**
 * @typedef {(string | Test_Renderer_Node)[]} Children
 * @typedef {Map<Test_Renderer_Node, Test_Renderer_Node>} Parent_Map
 * @typedef {{[key in smd.Attr]?: string}} Node_Attrs
 *
 * @typedef  {object} Test_Renderer_Data
 * @property {Test_Renderer_Node} root
 * @property {Test_Renderer_Node} node
 * @property {Parent_Map        } parent_map
 *
 * @typedef  {object} Test_Renderer_Node
 * @property {smd.Token  } type
 * @property {Children   } children
 * @property {Node_Attrs=} attrs
 *
 * @typedef {smd.Renderer          <Test_Renderer_Data>} Test_Renderer
 * @typedef {smd.Renderer_Add_Token<Test_Renderer_Data>} Test_Add_Token
 * @typedef {smd.Renderer_End_Token<Test_Renderer_Data>} Test_End_Token
 * @typedef {smd.Renderer_Add_Text <Test_Renderer_Data>} Test_Add_Text
 * @typedef {smd.Renderer_Set_Attr <Test_Renderer_Data>} Test_Set_Attr
 */

/** @returns {Test_Renderer} */
function test_renderer() {
	/** @type {Test_Renderer_Node} */
	const root = {
		type    : smd.Token.Document,
		children: []
	}
	return {
		add_token: test_renderer_add_token,
		end_token: test_renderer_end_token,
		set_attr : test_renderer_set_attr,
		add_text : test_renderer_add_text,
		data     : {
			parent_map: new Map(),
			root      : root,
			node      : root,
		},
	}
}
/** @type {Test_Add_Token} */
function test_renderer_add_token(data, type) {
	/** @type {Test_Renderer_Node} */
    const node = {type, children: []}
	data.node.children.push(node)
	data.parent_map.set(node, data.node)
	data.node = node
}
/** @type {Test_Add_Text} */
function test_renderer_add_text(data, text) {
	if (typeof data.node.children[data.node.children.length - 1] === "string") {
		data.node.children[data.node.children.length - 1] += text
	} else {
		data.node.children.push(text)
	}
}
/** @type {Test_End_Token} */
function test_renderer_end_token(data) {
	const parent = data.parent_map.get(data.node)
	assert.notEqual(parent, undefined, "Parent not found")
	data.node = /** @type {Test_Renderer_Node} */(parent)
}
/** @type {Test_Set_Attr} */
function test_renderer_set_attr(data, type, value) {
	if (value.length === 0) return

	if (data.node.attrs === undefined) {
		data.node.attrs = {[type]: value}
	} else {
		data.node.attrs[type] = value
	}
}

/** @type {Test_Renderer_Node} */
const br = {
	type    : smd.Token.Line_Break,
	children: []
}

/**
 * @param {number} len
 * @param {number} h
 * @returns {string} */
function compare_pad(len, h) {
	let txt = ""
	if (h < 0) {
		txt += "\u001b[31m"
	} else if (h > 0) {
		txt += "\u001b[32m"
	} else {
		txt += "\u001b[30m"
	}
	for (let i = 0; i <= len; i += 1) {
		txt += ": "
	}
	txt += "\u001b[0m"
	return txt
}

/**
 * @param {string  } text
 * @param {string[]} lines
 * @param {number  } len
 * @param {number} h
 * @returns {void  } */
function compare_push_text(text, lines, len, h) {
	lines.push(compare_pad(len, h) + JSON.stringify(text))
}

/**
 * @param {Test_Renderer_Node} node
 * @param {string[]} lines
 * @param {number} len
 * @param {number} h
 * @returns {void} */
function compare_push_node(node, lines, len, h) {
	compare_push_type(node.type, lines, len, h)
	for (const child of node.children) {
		if (typeof child === "string") {
			compare_push_text(child, lines, len + 1, h)
		} else {
			compare_push_node(child, lines, len + 1, h)
		}
	}
}

/**
 * @param {smd.Token} type
 * @param {string[]} lines
 * @param {number} len
 * @param {number} h
 * @returns {void} */
function compare_push_type(type, lines, len, h) {
	lines.push(compare_pad(len, h) + "\u001b[36m" + smd.token_to_string(type) + "\u001b[0m")
}

/**
 * @param {string | Test_Renderer_Node | undefined} actual
 * @param {string | Test_Renderer_Node | undefined} expected
 * @param {string[]} lines
 * @param {number} len
 * @returns {boolean} */
function compare_child(actual, expected, lines, len) {
	if (actual === undefined) {
		if (expected === undefined) return true

		if (typeof expected === "string") {
			compare_push_text(expected, lines, len, -1)
		} else {
			compare_push_node(expected, lines, len, -1)
		}

		return false
	}

	if (expected === undefined) {
		if (typeof actual === "string") {
			compare_push_text(actual, lines, len, +1)
		} else {
			compare_push_node(actual, lines, len, +1)
		}

		return false
	}

	if (typeof actual === "string") {
		if (typeof expected === "string") {
			if (actual === expected) {
				compare_push_text(expected, lines, len, 0)
				return true
			}

			compare_push_text(actual,   lines, len, +1)
			compare_push_text(expected, lines, len, -1)
			return false
		}

		compare_push_text(actual, lines, len, +1)
		compare_push_node(expected, lines, len, -1)
		return false
	}

	if (typeof expected === "string") {
		compare_push_text(expected, lines, len, -1)
		compare_push_node(actual, lines, len, +1)
		return false
	}

	if (actual.type === expected.type) {
		compare_push_type(actual.type, lines, len, 0)
	} else {
		compare_push_type(actual.type, lines, len, +1)
		compare_push_type(expected.type, lines, len, -1)
		return false
	}

	if (JSON.stringify(actual.attrs) !== JSON.stringify(expected.attrs)) {
		compare_push_text(JSON.stringify(actual.attrs),   lines, len + 1, +1)
		compare_push_text(JSON.stringify(expected.attrs), lines, len + 1, -1)
		return false
	}

	return compare_children(actual.children, expected.children, lines, len + 1)
}

/**
 * @param {Children} children
 * @param {Children} expected_children
 * @param {string[]} lines
 * @param {number} len
 * @returns {boolean} */
function compare_children(children, expected_children, lines, len) {
	let result = true

	let i = 0
	for (; i < children.length; i += 1) {
		result = compare_child(children[i], expected_children[i], lines, len) && result
	}

	for (; i < expected_children.length; i += 1) {
		compare_child(undefined, expected_children[i], lines, len)
		result = false
	}

	return result
}

/**
 * @param {Children} children
 * @param {Children} expected_children
 * @returns {void} */
function assert_children(children, expected_children) {
	/** @type {string[]} */
	const lines = []
	const result = compare_children(children, expected_children, lines, 0)
	if (!result) {
		const stl = Error.stackTraceLimit
		Error.stackTraceLimit = 0
		const e = new Error("Children not equal:\n" + lines.join("\n") + "\n")
		Error.stackTraceLimit = stl
		throw e
	}
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
		const parser = smd.parser(renderer)

		smd.parser_write(parser, markdown)
		smd.parser_end(parser)

		assert_children(renderer.data.root.children, expected_children)
	})

	t.test(title + " - by char", () => {
		const renderer = test_renderer()
		const parser = smd.parser(renderer)

		for (const char of markdown) {
			smd.parser_write(parser, char)
		}
		smd.parser_end(parser)

		assert_children(renderer.data.root.children, expected_children)
	})
}

for (let level = 1; level <= 6; level += 1) {

	/** @type {smd.Token} */
	let heading_type
	switch (level) {
		case 1: heading_type = smd.Token.Heading_1; break
		case 2: heading_type = smd.Token.Heading_2; break
		case 3: heading_type = smd.Token.Heading_3; break
		case 4: heading_type = smd.Token.Heading_4; break
		case 5: heading_type = smd.Token.Heading_5; break
		case 6: heading_type = smd.Token.Heading_6; break
		default: throw new Error("Invalid heading level")
	}

	test_single_write(`Heading_${level}`,
		"#".repeat(level) + " " + "foo",
		[{
			type    : heading_type,
			children: ["foo"]
		}]
	)

	test_single_write(`Heading_${level} with Line Italic`,
		"#".repeat(level) + " foo *bar*",
		[{
			type    : heading_type,
			children: ["foo ", {
				type    : smd.Token.Italic_Ast,
				children: ["bar"]
			}]
		}]
	)
}

test_single_write("Line Breaks",
	"foo\nbar",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo", br, "bar"],
	}]
)

test_single_write("Line Breaks with Italic",
	"*a\nb*",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Italic_Ast,
			children: ["a", br, "b"]
		}],
	}]
)

test_single_write("Escaped Line Breaks",
	"a\\\nb",
	[{
		type    : smd.Token.Paragraph,
		children: ["a", br, "b"],
	}]
)

test_single_write("Paragraphs",
	"foo\n\nbar",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo"],
	}, {
		type    : smd.Token.Paragraph,
		children: ["bar"],
	}]
)

test_single_write("Paragraph trim leading spaces",
	"  foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo"],
	}]
)

test_single_write("Trim too many spaces",
	"foo       bar",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo bar"],
	}]
)

test_single_write("Trim too many spaces in italic",
	"*foo       bar*",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Italic_Ast,
			children: ["foo bar"]
		}],
	}]
)

for (const c of ["*", "-", "_"]) {
	for (let l = 3; l <= 6; l += 1) {
		let txt = ""
		for (let i = 0; i < l; i += 1) {
			if (i % 2 === 0) {
				txt += " " // mix in some spaces
			}
			txt += c
		}

		test_single_write('Horizontal Rule "' + txt + '"',
			txt,
			[{
				type    : smd.Token.Horizontal_Rule,
				children: []
			}]
		)
	}
}

test_single_write("Text after Horizontal Rule",
	"---\nfoo",
	[{
		type    : smd.Token.Horizontal_Rule,
		children: []
	}, {
		type    : smd.Token.Paragraph,
		children: ["foo"],
	}]
)

for (let l = 1; l <= 4; l += 1) {
	const c = '`'.repeat(l)

	test_single_write("Code Inline" + " - "+l+" backticks",
		c + "a" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}],
		}]
	)

	test_single_write("Code Inline trims spaces" + " - "+l+" backticks",
		c + " a " + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}],
		}]
	)

	test_single_write("Code Inline x2" + " - "+l+" backticks",
		c+"a"+c+" "+c+"b"+c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}, " ", {
				type    : smd.Token.Code_Inline,
				children: ["b"]
			}],
		}]
	)

	if (l > 1) {
		const m = '`'.repeat(l - 1)

		test_single_write("Code ` Inline" + " - "+l+" backticks",
		c + "a"+m+"b" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"+m+"b"]
			}],
		}]
	)	
	}
}

for (let l = 1; l <= 2; l += 1) {
	const c = '`'.repeat(l)

	test_single_write("Code with line break" + " - "+l+" backticks",
		c + "a\nb" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a", br, "b"]
			}],
		}]
	)
	
	test_single_write("Code with two line breaks" + " - "+l+" backticks",
		c + "a\n\nb",
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}],
		}, {
			type    : smd.Token.Paragraph,
			children: ["b"],
		}]
	)
}

for (let l = 3; l <= 5; l += 1) {
	const c = '`'.repeat(l)

	test_single_write("Empty Code_Fence - " + l + " backticks",
		c+"\n"+c,
		[{
			type    : smd.Token.Code_Fence,
			children: []
		}]
	)
	
	test_single_write("Code_Fence - " + l + " backticks",
		c+"\nfoo\n"+c,
		[{
			type    : smd.Token.Code_Fence,
			children: ["foo"]
		}]
	)
	
	test_single_write("Code_Fence with language - " + l + " backticks",
		c+"js\nfoo\n"+c,
		[{
			type    : smd.Token.Code_Fence,
			children: ["foo"],
			attrs   : {[smd.Attr.Lang]: "js"}
		}]
	)
	
	const m = '`'.repeat(l - 1)

	test_single_write("Code_Fence escaped backticks - " + l + " backticks",
		c+"\n"+m+"\n"+c,
		[{
			type    : smd.Token.Code_Fence,
			children: [m]
		}]
	)
	
	test_single_write("Code_Fence with unfinished end backticks - " + l + " backticks",
		c+"\na\n"+m+"\n"+c,
		[{
			type    : smd.Token.Code_Fence,
			children: ["a\n"+m+""]
		}]
	)
}


for (const indent of [
	"    ",
	"   \t",
	"  \t",
	" \t",
	"\t",
]) {
	test_single_write("Code_Block",
		indent + "  foo",
		[{
			type    : smd.Token.Code_Block,
			children: ["  foo"]
		}]
	)

	test_single_write("Code_Block multiple lines",
		indent + "foo\n" +
		indent + "bar",
		[{
			type    : smd.Token.Code_Block,
			children: ["foo\nbar"]
		}]
	)

	test_single_write("Code_Block end",
		indent+"foo\n" +
		"bar",
		[{
			type    : smd.Token.Code_Block,
			children: ["foo"]
		}, {
			type    : smd.Token.Paragraph,
			children: ["bar"]
		}]
	)
}


for (const {c, italic, strong} of [{
	c: "*",
	italic: smd.Token.Italic_Ast,
	strong: smd.Token.Strong_Ast,
}, {
	c: "_",
	italic: smd.Token.Italic_Und,
	strong: smd.Token.Strong_Und,
}]) {
	const case_1 = ""+c+c+"bold"+c+"bold>em"+c+c+c+""
	const case_2 = ""+c+c+c+"bold>em"+c+"bold"+c+c+""
	const case_3 = ""+c+"em"+c+c+"em>bold"+c+c+c+""
	const case_4 = ""+c+c+c+"bold>em"+c+c+"em"+c+""

	test_single_write("Italic & Bold \""+case_1+"\'",
		case_1,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : strong,
				children: ["bold", {
					type    : italic,
					children: ["bold>em"]
				}]
			}]
		}]
	)

	test_single_write("Italic & Bold \""+case_2+"\'",
		case_2,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : strong,
				children: [{
					type    : italic,
					children: ["bold>em"]
				},
				"bold"]
			}]
		}]
	)

	test_single_write("Italic & Bold \""+case_3+"\'",
		case_3,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : italic,
				children: ["em", {
					type    : strong,
					children: ["em>bold"]
				}]
			}]
		}]
	)

	test_single_write("Italic & Bold \""+case_4+"\'",
		case_4,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : strong,
				children: [{
					type    : italic,
					children: ["bold>em"]
				}]
			}, {
				type    : italic,
				children: ["em"]
			}]
		}]
	)
}

for (const {type, c} of [
	{type: smd.Token.Italic_Ast, c: "*" },
	{type: smd.Token.Italic_Und, c: "_" },
	{type: smd.Token.Strong_Ast, c: "**"},
	{type: smd.Token.Strong_Und, c: "__"},
	{type: smd.Token.Strike    , c: "~~"},
]) {
	let e = ""
	for (const char of c) {
		e += "\\" + char
	}

	test_single_write(smd.token_to_string(type),
		c + "foo" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: ["foo"]
			}]
		}]
	)

	test_single_write(smd.token_to_string(type) + " space after begin",
		c + " foo" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [c + " foo" + c]
		}]
	)

	test_single_write(smd.token_to_string(type) + " with Code",
		c + "`foo`" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: [{
					type    : smd.Token.Code_Inline,
					children: ["foo"]
				}]
			}]
		}]
	)

	test_single_write(smd.token_to_string(type) + " new Paragraph",
		"foo\n\n"+
		c + "bar" + c,
		[{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}, {
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: ["bar"]
			}],
		}]
	)

	test_single_write(`Escape ${smd.token_to_string(type)} Begin`,
		e + "foo",
		[{
			type    : smd.Token.Paragraph,
			children: [c + "foo"]
		}]
	)

	test_single_write(`Escape ${smd.token_to_string(type)} End`,
		c + "foo" + e,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: ["foo" + c]
			}]
		}]
	)
}

test_single_write("Escape Backtick",
	"\\`" + "foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["`" + "foo"]
	}]
)

test_single_write("Escape Backslash",
	"\\\\" + "foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["\\" + "foo"]
	}]
)

test_single_write("Escape normal char",
	"\\a",
	[{
		type    : smd.Token.Paragraph,
		children: ["\\a"]
	}]
)

test_single_write("Link",
	"[title](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Link with code",
	"[`title`](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["title"],
			}],
		}]
	}]
)

test_single_write("Link new paragraph",
	"foo\n\n"+
	"[title](url)",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo"]
	},{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Image",
	"![title](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Image,
			attrs   : {[smd.Attr.Src]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Image with code",
	"![`title`](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Image,
			attrs   : {[smd.Attr.Src]: "url"},
			children: ["`title`"],
		}]
	}]
)

test_single_write("Link with Image",
	"[![title](src)](href)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "href"},
			children: [{
				type    : smd.Token.Image,
				attrs   : {[smd.Attr.Src]: "src"},
				children: ["title"],
			}],
		}]
	}]
)

test_single_write("Escaped link Begin",
	"\\[foo](url)",
	[{
		type    : smd.Token.Paragraph,
		children: ["[foo](url)"]
	}]
)

test_single_write("Escaped link End",
	"[foo\\](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			children: ["foo](url)"],
		}]
	}]
)

test_single_write("Un-Escaped link Both",
	"\\\\[foo\\\\](url)",
	[{
		type    : smd.Token.Paragraph,
		children: ["\\", {
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: ["foo\\"],
		}]
	}]
)

test_single_write("Blockquote",
	"> foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote no-space",
	">foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote Escape",
	"\\> foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["> foo"],
	}]
)

test_single_write("Blockquote line break",
	"> foo\nbar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo", br, "bar"],
		}]
	}]
)

test_single_write("Blockquote continued",
	"> foo\n> bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo", br, "bar"],
		}]
	}]
)

test_single_write("Blockquote end",
	"> foo\n\nbar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}]
	}, {
		type    : smd.Token.Paragraph,
		children: ["bar"],
	}]
)

test_single_write("Blockquote heading",
	"> # foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Heading_1,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote codeblock",
	"> ```\nfoo\n```",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Code_Fence,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote blockquote",
	"> > foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}]
		}]
	}]
)

test_single_write("Blockquote up blockquote",
	"> foo\n"+
	"> > bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}, {
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["bar"],
			}]
		}]
	}]
)

test_single_write("Blockquote blockquote down",
	"> > foo\n"+
	"> \n"+
	"> bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}]
		}, {
			type    : smd.Token.Paragraph,
			children: ["bar"],
		}]
	}]
)

test_single_write("Blockquote blockquote continued",
	"> > foo\n"+
	"> >\n"+
	"> > bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}, {
				type    : smd.Token.Paragraph,
				children: ["bar"],
			}]
		}]
	}]
)

test_single_write("Blockquote up down",
	"> > foo\n"+
	">\n"+
	"> > bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}]
		}, {
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["bar"],
			}]
		}]
	}]
)

test_single_write("Blockquote with code and line break",
	"> > `a\n"+
	"b`\n"+
	">\n"+
	"> > c",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: [{
					type    : smd.Token.Code_Inline,
					children: ["a", br, "b"],
				}]
			}]
		}, {
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["c"],
			}],
		}]
	}]
)
