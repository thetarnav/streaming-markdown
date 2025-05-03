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

const ANSI_GRAY   = "\u001b[30m"
const ANSI_RED    = "\u001b[31m"
const ANSI_GREEN  = "\u001b[32m"
const ANSI_PURPLE = "\u001b[35m"
const ANSI_CYAN   = "\u001b[36m"
const ANSI_RESET  = "\u001b[0m"

/**
 * @param {number} len
 * @param {number} h
 * @returns {string} */
function compare_pad(len, h) {
    let txt = ""
    if (h < 0) {
        txt += ANSI_RED
    } else if (h > 0) {
        txt += ANSI_GREEN
    } else {
        txt += ANSI_GRAY
    }
    for (let i = 0; i <= len; i += 1) {
        txt += ": "
    }
    txt += ANSI_RESET
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
    lines.push(compare_pad(len, h) + ANSI_CYAN + smd.token_to_string(type) + ANSI_RESET)
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
 * @param   {string} str
 * @returns {string} */
function display_whitespace(str) {
    let txt = ""
    for (let i = 0; i < str.length; i += 1) {
        let c = str[i]
        switch (c) {
        case ' ':  txt += ANSI_GRAY + "·"   + ANSI_RESET ;break
        case '\n': txt += ANSI_GRAY + "↵\n" + ANSI_RESET ;break
        case '\r': txt += ANSI_GRAY + "↵"   + ANSI_RESET ;break
        case '\t': txt += ANSI_GRAY + "⇥"   + ANSI_RESET ;break
        default:
            if (c < ' ') {
                txt += ANSI_GRAY+"\\x"+c.charCodeAt(0).toString(16).padStart(2, '0')+ANSI_RESET
            } else {
                txt += c
            }
        }
    }
    return txt
}

/**
 * @param {Children} children
 * @param {Children} expected_children
 * @param {string  } markdown
 * @returns {void} */
function assert_children(children, expected_children, markdown) {

    /** @type {string[]} */
    let lines = []
    
    if (!compare_children(children, expected_children, lines, 0)) {
        let stl = Error.stackTraceLimit
        Error.stackTraceLimit = 0
        let e = new Error(
            ANSI_RED+"Children not equal\n"+ANSI_RESET+
            ANSI_PURPLE+"Input:\n"+ANSI_RESET+
            display_whitespace(markdown)+
            "\n"+
            ANSI_PURPLE+"Tokens:\n"+ANSI_RESET+
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
