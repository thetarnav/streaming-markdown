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
	if (data.node.attrs === undefined) {
		data.node.attrs = {[type]: value}
	} else {
		data.node.attrs[type] = value
	}
}

/** @type {Test_Renderer_Node} */
export const BR = {
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

	let attrs_str_actual   = attrs_to_string(actual.attrs)
	let attrs_str_expected = attrs_to_string(expected.attrs)
	if (attrs_str_actual !== attrs_str_expected) {
		compare_push_text(attrs_str_actual,   lines, len + 1, +1)
		compare_push_text(attrs_str_expected, lines, len + 1, -1)
		return false
	}

	return compare_children(actual.children, expected.children, lines, len + 1)
}

/**
@param   {Node_Attrs|undefined} attrs 
@returns {string} */
function attrs_to_string(attrs) {
	let txt = '('
	if (attrs) {
		let entries = /** @type {[string, string][]} */(Object.entries(attrs))
		for (let i = 0; i < entries.length; i++) {
			let [key, value] = entries[i]
			txt += smd.attr_to_html_attr(/** @type {*} */(+key))
			txt += '='
			txt += value
			if (i < entries.length-1) {
				txt += ', '
			}
		}
	}
	txt += ')'
	return txt
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
 * @param {string  } markdown
 * @returns {void} */
function assert_children(children, expected_children, markdown) {
	/** @type {string[]} */
	const lines = []
	const result = compare_children(children, expected_children, lines, 0)
	if (!result) {
		const stl = Error.stackTraceLimit
		Error.stackTraceLimit = 0
		const e = new Error(
			"Children not equal\n"+
			"Input:\n```\n"+
			markdown+
			"\n```\n"+
			"Tokens:\n"+
			lines.join("\n")+
			"\n"
		)
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
export function test_single_write(title, markdown, expected_children) {
	t.test(title + ";", () => {
		const renderer = test_renderer()
		const parser = smd.parser(renderer)

		smd.parser_write(parser, markdown)
		smd.parser_end(parser)

		assert_children(renderer.data.root.children, expected_children, markdown)
	})

	t.test(title + "; by_char;", () => {
		const renderer = test_renderer()
		const parser = smd.parser(renderer)

		for (const char of markdown) {
			smd.parser_write(parser, char)
		}
		smd.parser_end(parser)

		assert_children(renderer.data.root.children, expected_children, markdown)
	})
}
