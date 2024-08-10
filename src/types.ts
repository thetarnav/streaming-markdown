// types.ts

import type { Token, Attr } from "./tokens.js";

// Renderer types
export type RendererAddToken<T> = (data: T, type: Token) => void;
export type RendererEndToken<T> = (data: T) => void;
export type RendererAddText<T> = (data: T, text: string) => void;
export type RendererSetAttr<T> = (data: T, type: Attr, value: string) => void;

export interface Renderer<T> {
    data: T;
    add_token: RendererAddToken<T>;
    end_token: RendererEndToken<T>;
    add_text: RendererAddText<T>;
    set_attr: RendererSetAttr<T>;
}

// Default Renderer types
export interface DefaultRendererData {
    nodes: Array<HTMLElement | undefined>;
    index: number;
}

export type DefaultRenderer = Renderer<DefaultRendererData>;
export type DefaultAddToken = RendererAddToken<DefaultRendererData>;
export type DefaultEndToken = RendererEndToken<DefaultRendererData>;
export type DefaultAddText = RendererAddText<DefaultRendererData>;
export type DefaultSetAttr = RendererSetAttr<DefaultRendererData>;

// Test Renderer types
export type Children = Array<string | TestRendererNode>
export type Parent_Map = Map<TestRendererNode, TestRendererNode>;
export type NodeAttrs = {[key in Attr]?: string};

export interface TestRendererData {
    root: TestRendererNode;
    node: TestRendererNode;
    parent_map: Parent_Map;
}

export interface TestRendererNode {
    type: Token;
    children: Children;
    attrs?: NodeAttrs;
}

export type TestRenderer = Renderer<TestRendererData>;
export type TestAddToken = RendererAddToken<TestRendererData>;
export type TestEndToken = RendererEndToken<TestRendererData>;
export type TestAddText = RendererAddText<TestRendererData>;
export type TestSetAttr = RendererSetAttr<TestRendererData>;

// Parser type
export interface Parser<T> {
    renderer: Renderer<T>;
    text: string;
    pending: string;
    tokens: Uint32Array;
    len: number;
    token: number;
    spaces: Uint8Array;
    indent: string;
    indent_len: number;
    code_fence_body: 0 | 1;
    backticks_count: number;
    blockquote_idx: number;
    hr_char: string;
    hr_chars: number;
}

export const TOKEN_ARRAY_CAP = 24;

export type LoggerRendererData = undefined;

export type LoggerRenderer = Renderer<LoggerRendererData>;
export type LoggerRendererAddToken = RendererAddToken<LoggerRendererData>;
export type LoggerRendererEndToken = RendererEndToken<LoggerRendererData>;
export type LoggerRendererAddText = RendererAddText<LoggerRendererData>;
export type LoggerRendererSetAttr = RendererSetAttr<LoggerRendererData>;