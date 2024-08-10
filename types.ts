// types.ts

import type { Tokens, Attrs } from "./tokens.js"

export type Token = typeof Tokens[keyof typeof Tokens];
export type Attr = typeof Attrs[keyof typeof Attrs];

// Renderer types
export type Renderer_Add_Token<T> = (data: T, type: Token) => void;
export type Renderer_End_Token<T> = (data: T) => void;
export type Renderer_Add_Text<T> = (data: T, text: string) => void;
export type Renderer_Set_Attr<T> = (data: T, type: Attr, value: string) => void;

export interface Renderer<T> {
    data: T;
    add_token: Renderer_Add_Token<T>;
    end_token: Renderer_End_Token<T>;
    add_text: Renderer_Add_Text<T>;
    set_attr: Renderer_Set_Attr<T>;
}

export type Any_Renderer = Renderer<any>;

// Default Renderer types
export interface Default_Renderer_Data {
    nodes: HTMLElement[];
    index: number;
}

export type Default_Renderer = Renderer<Default_Renderer_Data>;
export type Default_Renderer_Add_Token = Renderer_Add_Token<Default_Renderer_Data>;
export type Default_Renderer_End_Token = Renderer_End_Token<Default_Renderer_Data>;
export type Default_Renderer_Add_Text = Renderer_Add_Text<Default_Renderer_Data>;
export type Default_Renderer_Set_Attr = Renderer_Set_Attr<Default_Renderer_Data>;

// Test Renderer types
export type Children = (string | Test_Renderer_Node)[];
export type Parent_Map = Map<Test_Renderer_Node, Test_Renderer_Node>;
export type Node_Attrs = {[key in Attr]?: string};

export interface Test_Renderer_Data {
    root: Test_Renderer_Node;
    node: Test_Renderer_Node;
    parent_map: Parent_Map;
}

export interface Test_Renderer_Node {
    type: Token;
    children: Children;
    attrs?: Node_Attrs;
}

export type Test_Renderer = Renderer<Test_Renderer_Data>;
export type Test_Add_Token = Renderer_Add_Token<Test_Renderer_Data>;
export type Test_End_Token = Renderer_End_Token<Test_Renderer_Data>;
export type Test_Add_Text = Renderer_Add_Text<Test_Renderer_Data>;
export type Test_Set_Attr = Renderer_Set_Attr<Test_Renderer_Data>;

// Parser type
export interface Parser {
    renderer: Any_Renderer;
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