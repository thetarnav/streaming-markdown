import * as t from "bun:test";
import * as assert from "node:assert/strict";

import type { Children, TestAddText, TestAddToken, TestEndToken, TestRenderer, TestRendererNode, TestSetAttr } from "./src/types.js";
import { createParser, parser_end, parser_write, token_to_string } from "./src/smd.js";
import { Token, Attr } from "./src/tokens.js";


function test_renderer(): TestRenderer {
    const root: TestRendererNode = {
        type: Token.DOCUMENT,
        children: []
    };
    return {
        add_token: test_renderer_add_token,
        end_token: test_renderer_end_token,
        set_attr: test_renderer_set_attr,
        add_text: test_renderer_add_text,
        data: {
            parent_map: new Map(),
            root: root,
            node: root,
        },
    };
}

const test_renderer_add_token: TestAddToken = (data, type) => {
    const node: TestRendererNode = { type, children: [] };
    data.node.children.push(node);
    data.parent_map.set(node, data.node);
    data.node = node;
};

const test_renderer_add_text: TestAddText = (data, text) => {
    const lastChild = data.node.children[data.node.children.length - 1];
    if (typeof lastChild === "string") {
        data.node.children[data.node.children.length - 1] = lastChild + text;
    } else {
        data.node.children.push(text);
    }
};

const test_renderer_end_token: TestEndToken = (data) => {
    const parent = data.parent_map.get(data.node);
    assert.notEqual(parent, undefined, "Parent not found");
    data.node = parent as TestRendererNode;
};

const test_renderer_set_attr: TestSetAttr = (data, type, value) => {
    if (data.node.attrs === undefined) {
        data.node.attrs = { [type]: value };
    } else {
        data.node.attrs[type] = value;
    }
};

const br: TestRendererNode = {
    type: Token.LINE_BREAK,
    children: []
};

function compare_pad(len: number, h: number) {
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

function compare_push_text(text: string, lines: string[], len: number, h: number) {
	lines.push(compare_pad(len, h) + JSON.stringify(text))
}

function compare_push_node(node: TestRendererNode, lines: string[], len: number, h: number) {
	compare_push_type(node.type, lines, len, h)
	for (const child of node.children) {
		if (typeof child === "string") {
			compare_push_text(child, lines, len + 1, h)
		} else {
			compare_push_node(child, lines, len + 1, h)
		}
	}
}

function compare_push_type(type: Token, lines: string[], len: number, h: number) {
	lines.push(compare_pad(len, h) + "\u001b[36m" + token_to_string(type) + "\u001b[0m")
}

function compare_child(
  actual: string | TestRendererNode | undefined, 
  expected: string | TestRendererNode | undefined, 
  lines: string[], 
  len: number
): boolean {
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

function compare_children(children: Children, expected_children: Children, lines: string[], len: number): boolean {
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

function assert_children(children: Children, expected_children: Children) {
	const lines: string[] = []
	const result = compare_children(children, expected_children, lines, 0)
	if (!result) {
		const stl = Error.stackTraceLimit
		Error.stackTraceLimit = 0
		const e = new Error("Children not equal:\n" + lines.join("\n") + "\n")
		Error.stackTraceLimit = stl
		throw e
	}
}

function test_single_write(title: string, markdown: string, expected_children: Children) {
	t.test(title + ";", () => {
		const renderer = test_renderer()
		const parser = createParser(renderer)

		parser_write(parser, markdown)
		parser_end(parser)

		assert_children(renderer.data.root.children, expected_children)
	})

	t.test(title + "; by_char;", () => {
		const renderer = test_renderer()
		const parser = createParser(renderer)

		for (const char of markdown) {
			parser_write(parser, char)
		}
		parser_end(parser)

		assert_children(renderer.data.root.children, expected_children)
	})
}

for (let level = 1; level <= 6; level += 1) {

	/** @type {Token} */
	let heading_type
	switch (level) {
	case 1: heading_type = Token.HEADING_1; break
	case 2: heading_type = Token.HEADING_2; break
	case 3: heading_type = Token.HEADING_3; break
	case 4: heading_type = Token.HEADING_4; break
	case 5: heading_type = Token.HEADING_5; break
	case 6: heading_type = Token.HEADING_6; break
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
				type    : Token.ITALIC_AST,
				children: ["bar"]
			}]
		}]
	)

	test_single_write(`Heading_${level} after line break`,
		"\n" + "#".repeat(level) + " " + "foo",
		[{
			type    : heading_type,
			children: ["foo"]
		}]
	)
}

test_single_write("Line Breaks",
	"foo\nbar",
	[{
		type    : Token.PARAGRAPH,
		children: ["foo", br, "bar"],
	}]
)

test_single_write("Line Breaks with Italic",
	"*a\nb*",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.ITALIC_AST,
			children: ["a", br, "b"]
		}],
	}]
)

test_single_write("Escaped Line Breaks",
	"a\\\nb",
	[{
		type    : Token.PARAGRAPH,
		children: ["a", br, "b"],
	}]
)

test_single_write("Paragraphs",
	"foo\n\nbar",
	[{
		type    : Token.PARAGRAPH,
		children: ["foo"],
	}, {
		type    : Token.PARAGRAPH,
		children: ["bar"],
	}]
)

test_single_write("Paragraph trim leading spaces",
	"  foo",
	[{
		type    : Token.PARAGRAPH,
		children: ["foo"],
	}]
)

test_single_write("Trim too many spaces",
	"foo       bar",
	[{
		type    : Token.PARAGRAPH,
		children: ["foo bar"],
	}]
)

test_single_write("Trim too many spaces in italic",
	"*foo       bar*",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.ITALIC_AST,
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
				type    : Token.RULE,
				children: []
			}]
		)
	}
}

test_single_write("Text after Horizontal Rule",
	"---\nfoo",
	[{
		type    : Token.RULE,
		children: []
	}, {
		type    : Token.PARAGRAPH,
		children: ["foo"],
	}]
)

for (let l = 1; l <= 4; l += 1) {
	const c = '`'.repeat(l)

	test_single_write("Code Inline" + " - "+l+" backticks",
		c + "a" + c,
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : Token.CODE_INLINE,
				children: ["a"]
			}],
		}]
	)

	test_single_write("Code Inline trims spaces" + " - "+l+" backticks",
		c + " a " + c,
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : Token.CODE_INLINE,
				children: ["a"]
			}],
		}]
	)

	test_single_write("Code Inline x2" + " - "+l+" backticks",
		c+"a"+c+" "+c+"b"+c,
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : Token.CODE_INLINE,
				children: ["a"]
			}, " ", {
				type    : Token.CODE_INLINE,
				children: ["b"]
			}],
		}]
	)

	if (l > 1) {
		const m = '`'.repeat(l - 1)

		test_single_write("Code ` Inline" + " - "+l+" backticks",
		c + "a"+m+"b" + c,
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : Token.CODE_INLINE,
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
			type    : Token.PARAGRAPH,
			children: [{
				type    : Token.CODE_INLINE,
				children: ["a", br, "b"]
			}],
		}]
	)

	test_single_write("Code with two line breaks" + " - "+l+" backticks",
		c + "a\n\nb",
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : Token.CODE_INLINE,
				children: ["a"]
			}],
		}, {
			type    : Token.PARAGRAPH,
			children: ["b"],
		}]
	)
}

for (let l = 3; l <= 5; l += 1) {
	const c = '`'.repeat(l)

	test_single_write("Empty Code_Fence - " + l + " backticks",
		c+"\n"+c,
		[{
			type    : Token.CODE_FENCE,
			children: []
		}]
	)

	test_single_write("Code_Fence - " + l + " backticks",
		c+"\nfoo\n"+c,
		[{
			type    : Token.CODE_FENCE,
			children: ["foo"]
		}]
	)

	test_single_write("Code_Fence with language - " + l + " backticks",
		c+"js\nfoo\n"+c,
		[{
			type    : Token.CODE_FENCE,
			children: ["foo"],
			attrs   : {[Attr.LANG]: "js"}
		}]
	)

	const m = '`'.repeat(l - 1)

	test_single_write("Code_Fence escaped backticks - " + l + " backticks",
		c+"\n"+m+"\n"+c,
		[{
			type    : Token.CODE_FENCE,
			children: [m]
		}]
	)

	test_single_write("Code_Fence with unfinished end backticks - " + l + " backticks",
		c+"\na\n"+m+"\n"+c,
		[{
			type    : Token.CODE_FENCE,
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
	const escaped_indent = indent.replace(/\t/g, "\\t")

	test_single_write("Code_Block; indent: '"+escaped_indent+"'",
		indent + "  foo",
		[{
			type    : Token.CODE_BLOCK,
			children: ["  foo"]
		}]
	)

	test_single_write("Code_Block multiple lines; indent: '"+escaped_indent+"'",
		indent + "foo\n" +
		indent + "bar",
		[{
			type    : Token.CODE_BLOCK,
			children: ["foo\nbar"]
		}]
	)

	test_single_write("Code_Block end; indent: '"+escaped_indent+"'",
		indent+"foo\n" +
		"bar",
		[{
			type    : Token.CODE_BLOCK,
			children: ["foo"]
		}, {
			type    : Token.PARAGRAPH,
			children: ["bar"]
		}]
	)
}


for (const {c, italic, strong} of [{
	c: "*",
	italic: Token.ITALIC_AST,
	strong: Token.STRONG_AST,
}, {
	c: "_",
	italic: Token.ITALIC_UND,
	strong: Token.STRONG_UND,
}]) {
	const case_1 = ""+c+c+"bold"+c+"bold>em"+c+c+c+""
	const case_2 = ""+c+c+c+"bold>em"+c+"bold"+c+c+""
	const case_3 = ""+c+"em"+c+c+"em>bold"+c+c+c+""
	const case_4 = ""+c+c+c+"bold>em"+c+c+"em"+c+""

	test_single_write("Italic & Bold \""+case_1+"\'",
		case_1,
		[{
			type    : Token.PARAGRAPH,
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
			type    : Token.PARAGRAPH,
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
			type    : Token.PARAGRAPH,
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
			type    : Token.PARAGRAPH,
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
	{type: Token.ITALIC_AST, c: "*" },
	{type: Token.ITALIC_UND, c: "_" },
	{type: Token.STRONG_AST, c: "**"},
	{type: Token.STRONG_UND, c: "__"},
	{type: Token.STRIKE    , c: "~~"},
]) {
	let e = ""
	for (const char of c) {
		e += "\\" + char
	}

	test_single_write(
    token_to_string(type),
		c + "foo" + c,
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : type,
				children: ["foo"]
			}]
		}]
	)

	test_single_write(token_to_string(type) + " space after begin",
		"a " + c + " b" + c,
		[{
			type    : Token.PARAGRAPH,
			children: ["a " + c + " b" + c]
		}]
	)

	test_single_write(token_to_string(type) + " with Code",
		c + "`foo`" + c,
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : type,
				children: [{
					type    : Token.CODE_INLINE,
					children: ["foo"]
				}]
			}]
		}]
	)

	test_single_write(token_to_string(type) + " new Paragraph",
		"foo\n\n"+
		c + "bar" + c,
		[{
			type    : Token.PARAGRAPH,
			children: ["foo"],
		}, {
			type    : Token.PARAGRAPH,
			children: [{
				type    : type,
				children: ["bar"]
			}],
		}]
	)

	test_single_write(`Escape ${token_to_string(type)} Begin`,
		e + "foo",
		[{
			type    : Token.PARAGRAPH,
			children: [c + "foo"]
		}]
	)

	test_single_write(`Escape ${token_to_string(type)} End`,
		c + "foo" + e,
		[{
			type    : Token.PARAGRAPH,
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
		type    : Token.PARAGRAPH,
		children: ["`" + "foo"]
	}]
)

test_single_write("Escape Backslash",
	"\\\\" + "foo",
	[{
		type    : Token.PARAGRAPH,
		children: ["\\" + "foo"]
	}]
)

test_single_write("Escape normal char",
	"\\a",
	[{
		type    : Token.PARAGRAPH,
		children: ["\\a"]
	}]
)

for (const url of [
	"http://example.com/page",
	"https://example.com/page",
]) {
	test_single_write("Raw URL " + url,
		url,
		[{
			type    : Token.PARAGRAPH,
			children: [{
				type    : Token.RAW_URL,
				attrs   : {[Attr.HREF]: url},
				children: [url],
			}]
		}]
	)

	test_single_write("Raw URL in text " + url,
		"foo "+url+" bar",
		[{	type    : Token.PARAGRAPH,
			children: [
				"foo ",
				{	type    : Token.RAW_URL,
					attrs   : {[Attr.HREF]: url},
					children: [url],
				},
				" bar",
			]
		}]
	)

	test_single_write("Doesn't match urls in text",
		"foo"+url,
		[{
			type    : Token.PARAGRAPH,
			children: ["foo"+url]
		}],
	)
}

test_single_write("Doesn't match not_urls as urls",
	"http:/wrong.com",
	[{
		type    : Token.PARAGRAPH,
		children: ["http:/wrong.com"]
	}]
)

test_single_write("Link",
	"[title](url)",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.LINK,
			attrs   : {[Attr.HREF]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Link with code",
	"[`title`](url)",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.LINK,
			attrs   : {[Attr.HREF]: "url"},
			children: [{
				type    : Token.CODE_INLINE,
				children: ["title"],
			}],
		}]
	}]
)

test_single_write("Link new paragraph",
	"foo\n\n"+
	"[title](url)",
	[{
		type    : Token.PARAGRAPH,
		children: ["foo"]
	},{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.LINK,
			attrs   : {[Attr.HREF]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Image",
	"![title](url)",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.IMAGE,
			attrs   : {[Attr.SRC]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Image with code",
	"![`title`](url)",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.IMAGE,
			attrs   : {[Attr.SRC]: "url"},
			children: ["`title`"],
		}]
	}]
)

test_single_write("Link with Image",
	"[![title](src)](href)",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.LINK,
			attrs   : {[Attr.HREF]: "href"},
			children: [{
				type    : Token.IMAGE,
				attrs   : {[Attr.SRC]: "src"},
				children: ["title"],
			}],
		}]
	}]
)

test_single_write("Escaped link Begin",
	"\\[foo](url)",
	[{
		type    : Token.PARAGRAPH,
		children: ["[foo](url)"]
	}]
)

test_single_write("Escaped link End",
	"[foo\\](url)",
	[{
		type    : Token.PARAGRAPH,
		children: [{
			type    : Token.LINK,
			children: ["foo](url)"],
		}]
	}]
)

test_single_write("Un-Escaped link Both",
	"\\\\[foo\\\\](url)",
	[{
		type    : Token.PARAGRAPH,
		children: ["\\", {
			type    : Token.LINK,
			attrs   : {[Attr.HREF]: "url"},
			children: ["foo\\"],
		}]
	}]
)

test_single_write("Blockquote",
	"> foo",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.PARAGRAPH,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote no-space",
	">foo",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.PARAGRAPH,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote Escape",
	"\\> foo",
	[{
		type    : Token.PARAGRAPH,
		children: ["> foo"],
	}]
)

test_single_write("Blockquote line break",
	"> foo\nbar",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.PARAGRAPH,
			children: ["foo", br, "bar"],
		}]
	}]
)

test_single_write("Blockquote continued",
	"> foo\n> bar",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.PARAGRAPH,
			children: ["foo", br, "bar"],
		}]
	}]
)

test_single_write("Blockquote end",
	"> foo\n\nbar",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.PARAGRAPH,
			children: ["foo"],
		}]
	}, {
		type    : Token.PARAGRAPH,
		children: ["bar"],
	}]
)

test_single_write("Blockquote heading",
	"> # foo",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.HEADING_1,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote codeblock",
	"> ```\nfoo\n```",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.CODE_FENCE,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote blockquote",
	"> > foo",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
				children: ["foo"],
			}]
		}]
	}]
)

test_single_write("Blockquote up blockquote",
	"> foo\n"+
	"> > bar",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.PARAGRAPH,
			children: ["foo"],
		}, {
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
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
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
				children: ["foo"],
			}]
		}, {
			type    : Token.PARAGRAPH,
			children: ["bar"],
		}]
	}]
)

test_single_write("Blockquote blockquote continued",
	"> > foo\n"+
	"> >\n"+
	"> > bar",
	[{
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
				children: ["foo"],
			}, {
				type    : Token.PARAGRAPH,
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
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
				children: ["foo"],
			}]
		}, {
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
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
		type    : Token.BLOCKQUOTE,
		children: [{
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
				children: [{
					type    : Token.CODE_INLINE,
					children: ["a", br, "b"],
				}]
			}]
		}, {
			type    : Token.BLOCKQUOTE,
			children: [{
				type    : Token.PARAGRAPH,
				children: ["c"],
			}],
		}]
	}]
)

const optimisticTests = [
	["*",    Token.LIST_UNORDERED],
	["-",    Token.LIST_UNORDERED],
	["+",    Token.LIST_UNORDERED],
	["1.",   Token.LIST_ORDERED],
	["420.", Token.LIST_ORDERED],
] as const

for (const [c, token] of optimisticTests) {
	const list_name = token === Token.LIST_UNORDERED
		? "List Unordered"
		: "List Ordered"
	const suffix = "; prefix: "+c

	const attrs = c === "420."
		? {[Attr.START]: "420"}
		: undefined

	const indent       = " ".repeat(c.length + 1)
	const indent_small = " ".repeat(c.length)

	test_single_write(list_name + suffix,
		c+" foo",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["foo"]
			}]
		}]
	)

	test_single_write(list_name + " with italic" + suffix,
		c+" *foo*",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: [{
					type    : Token.ITALIC_AST,
					children: ["foo"]
				}]
			}]
		}]
	)

	test_single_write(list_name + " two items" + suffix,
		c+" a\n"+
		c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["a"]
			}, {
				type    : Token.LIST_ITEM,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " with line break" + suffix,
		c+" a\nb",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["a", br, "b"]
			}]
		}]
	)

	test_single_write(list_name + " end" + suffix,
		c+" a\n"+
		"\n"+
		"b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["a"]
			}]
		}, {
			type    : Token.PARAGRAPH,
			children: ["b"]
		}]
	)

	test_single_write(list_name + " after line break" + suffix,
		"a\n"+
		c+" b",
		[{
			type    : Token.PARAGRAPH,
			children: ["a"]
		}, {
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " with unchecked task" + suffix,
		c+" [ ] foo",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: [{
					type    : Token.CHECKBOX,
					children: [],
				}, " foo"]
			}]
		}]
	)

	test_single_write(list_name + " with checked task" + suffix,
		c+" [x] foo",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: [{
					type    : Token.CHECKBOX,
					attrs   : {[Attr.CHECKED]: ""},
					children: [],
				}, " foo"]
			}]
		}]
	)

	test_single_write(list_name + " with two tasks" + suffix,
		c+" [ ] foo\n"+
		c+" [x] bar\n",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: [{
					type    : Token.CHECKBOX,
					children: [],
				}, " foo"]
			}, {
				type    : Token.LIST_ITEM,
				children: [{
					type    : Token.CHECKBOX,
					attrs   : {[Attr.CHECKED]: ""},
					children: [],
				}, " bar"]
			}]
		}]
	)

	test_single_write(list_name + " with link" + suffix,
		c+" [x](url)",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: [{
					type    : Token.LINK,
					attrs   : {[Attr.HREF]: "url"},
					children: ["x"],
				}]
			}]
		}]
	)

	test_single_write(list_name + " nested list" + suffix,
		c+" a\n"+
		indent+c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["a", {
					type    : token,
					attrs   : attrs,
					children: [{
						type    : Token.LIST_ITEM,
						children: ["b"]
					}]
				}]
			}]
		}]
	)

	test_single_write(list_name + " failed nested list" + suffix,
		c+" a\n"+
		indent_small+c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["a"]
			}, {
				type    : Token.LIST_ITEM,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " nested ul multiple items" + suffix,
		c+" a\n"+
		indent+"* b\n"+
		indent+"* c\n",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["a", {
					type    : Token.LIST_UNORDERED,
					children: [{
						type    : Token.LIST_ITEM,
						children: ["b"]
					}, {
						type    : Token.LIST_ITEM,
						children: ["c"]
					}]
				}]
			}]
		}]
	)

	test_single_write(list_name + " nested and un-nested" + suffix,
		c+" a\n"+
		indent+"* b\n"+
		c+" c\n",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : Token.LIST_ITEM,
				children: ["a", {
					type    : Token.LIST_UNORDERED,
					children: [{
						type    : Token.LIST_ITEM,
						children: ["b"]
					}]
				}]
			}, {
				type    : Token.LIST_ITEM,
				children: ["c"]
			}]
		}]
	)

	// test_single_write(list_name + " single line nesting" + suffix,
	// 	c+" * a",
	// 	[{
	// 		type    : token,
	// 		attrs   : attrs,
	// 		children: [{
	// 			type    : Token.List_Item,
	// 			children: [{
	// 				type    : Token.List_Unordered,
	// 				children: [{
	// 					type    : Token.List_Item,
	// 					children: ["a"]
	// 				}]
	// 			}]
	// 		}]
	// 	}]
	// )

	// test_single_write(list_name + " single line nesting continued" + suffix,
	// 	c+" * a\n"+
	// 	indent+"* b",
	// 	[{
	// 		type    : token,
	// 		attrs   : attrs,
	// 		children: [{
	// 			type    : Token.List_Item,
	// 			children: [{
	// 				type    : Token.List_Unordered,
	// 				children: [{
	// 					type    : Token.List_Item,
	// 					children: ["a"]
	// 				}, {
	// 					type    : Token.List_Item,
	// 					children: ["b"]
	// 				}]
	// 			}]
	// 		}]
	// 	}]
	// )
}

test_single_write("Failed nesting of ul in ol",
	"1. a\n"+
	"  * b",
	[{
		type    : Token.LIST_ORDERED,
		children: [{
			type    : Token.LIST_ITEM,
			children: ["a"]
		}]
	}, {
		type    : Token.LIST_UNORDERED,
		children: [{
			type    : Token.LIST_ITEM,
			children: ["b"]
		}]
	}]
)

// test_single_write("Heading in a list item",
// 	"- # foo",
// 	[{
// 		type    : Token.List_Unordered,
// 		children: [{
// 			type    : Token.List_Item,
// 			children: [{
// 				type    : Token.Heading_1,
// 				children: ["foo"]
// 			}]
// 		}]
// 	}]
// )