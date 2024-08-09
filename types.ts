// types.ts

// Token definitions
export const
    DOCUMENT       = 1,
    PARAGRAPH      = 2,
    HEADING_1      = 4,
    HEADING_2      = 8,
    HEADING_3      = 16,
    HEADING_4      = 32,
    HEADING_5      = 64,
    HEADING_6      = 128,
    CODE_BLOCK     = 256,
    CODE_FENCE     = 512,
    CODE_INLINE    = 1024,
    ITALIC_AST     = 2048,
    ITALIC_UND     = 4096,
    STRONG_AST     = 8192,
    STRONG_UND     = 16384,
    STRIKE         = 32768,
    LINK           = 65536,
    RAW_URL        = 131072,
    IMAGE          = 262144,
    BLOCKQUOTE     = 524288,
    LINE_BREAK     = 1048576,
    RULE           = 4194304,
    LIST_UNORDERED = 8388608,
    LIST_ORDERED   = 16777216,
    LIST_ITEM      = 33554432,
    CHECKBOX       = 67108864,
    MAYBE_URL      = 134217728,
    MAYBE_TASK     = 268435456;

export const
    ANY_HEADING    = 252,
    ANY_CODE       = 1792,
    ANY_ITALIC     = 6144,
    ANY_STRONG     = 24576,
    ANY_AST        = 10240,
    ANY_UND        = 20480,
    ANY_LIST       = 25165824,
    ANY_ROOT       = 524289;

export const Token = {
    Document: DOCUMENT,
    Blockquote: BLOCKQUOTE,
    Paragraph: PARAGRAPH,
    Heading_1: HEADING_1,
    Heading_2: HEADING_2,
    Heading_3: HEADING_3,
    Heading_4: HEADING_4,
    Heading_5: HEADING_5,
    Heading_6: HEADING_6,
    Code_Block: CODE_BLOCK,
    Code_Fence: CODE_FENCE,
    Code_Inline: CODE_INLINE,
    Italic_Ast: ITALIC_AST,
    Italic_Und: ITALIC_UND,
    Strong_Ast: STRONG_AST,
    Strong_Und: STRONG_UND,
    Strike: STRIKE,
    Link: LINK,
    Raw_URL: RAW_URL,
    Image: IMAGE,
    Line_Break: LINE_BREAK,
    Rule: RULE,
    List_Unordered: LIST_UNORDERED,
    List_Ordered: LIST_ORDERED,
    List_Item: LIST_ITEM,
    Checkbox: CHECKBOX,
} as const;

export type Token = typeof Token[keyof typeof Token];

// Attr definitions
export const
    HREF    = 1,
    SRC     = 2,
    LANG    = 4,
    CHECKED = 8,
    START   = 16;

export const Attr = {
    Href: HREF,
    Src: SRC,
    Lang: LANG,
    Checked: CHECKED,
    Start: START,
} as const;

export type Attr = typeof Attr[keyof typeof Attr];

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