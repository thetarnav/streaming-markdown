import { expect } from "bun:test"
import { Token } from "@/tokens";
import type { TestAddText, TestAddToken, TestEndToken, TestRenderer, TestRendererNode, TestSetAttr } from "./types";
import { token_to_string } from "@/utils";
import type { Children } from "@/renderer";

export function test_renderer(): TestRenderer {
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

export const test_renderer_add_token: TestAddToken = (data, type) => {
  const node: TestRendererNode = { type, children: [] };
  data.node.children.push(node);
  data.parent_map.set(node, data.node);
  data.node = node;
};

export const test_renderer_add_text: TestAddText = (data, text) => {
  const lastChild = data.node.children[data.node.children.length - 1];
  if (typeof lastChild === "string") {
      data.node.children[data.node.children.length - 1] = lastChild + text;
  } else {
      data.node.children.push(text);
  }
};

export const test_renderer_end_token: TestEndToken = (data) => {
  const parent = data.parent_map.get(data.node);
  // notEqual(parent, undefined, "Parent not found");
  expect(parent, "Parent not found").not.toBe(undefined)
  data.node = parent as TestRendererNode;
};

export const test_renderer_set_attr: TestSetAttr = (data, type, value) => {
  if (data.node.attrs === undefined) {
      data.node.attrs = { [type]: value };
  } else {
      data.node.attrs[type] = value;
  }
};

export function compare_pad(len: number, h: number): string {
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

export function compare_push_text(text: string, lines: string[], len: number, h: number): void {
lines.push(compare_pad(len, h) + JSON.stringify(text))
}

export function compare_push_node(node: TestRendererNode, lines: string[], len: number, h: number): void {
compare_push_type(node.type, lines, len, h)
for (const child of node.children) {
  if (typeof child === "string") {
    compare_push_text(child, lines, len + 1, h)
  } else {
    compare_push_node(child, lines, len + 1, h)
  }
}
}

export function compare_push_type(type: Token, lines: string[], len: number, h: number): void {
lines.push(compare_pad(len, h) + "\u001b[36m" + token_to_string(type) + "\u001b[0m")
}

export function compare_child<T extends string | TestRendererNode>(
actual: T | undefined, 
expected: T | undefined, 
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

export function compare_children<T extends string | TestRendererNode>(
children: Children<T>, 
expected_children: Children<T>, 
lines: string[], 
len: number
): boolean {
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

export function assert_children<T extends string | TestRendererNode>(
children: Children<T>, 
expected_children: Children<T>
): void {
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