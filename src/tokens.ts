// Token enum
export enum Token {
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
  MAYBE_TASK     = 268435456
}

// Attr enum
export enum Attr {
  HREF    = 1,
  SRC     = 2,
  LANG    = 4,
  CHECKED = 8,
  START   = 16
}

// Compound Token types
// Explicit type definitions
export type ANY_HEADING = Token.HEADING_1 | Token.HEADING_2 | Token.HEADING_3 | Token.HEADING_4 | Token.HEADING_5 | Token.HEADING_6;
export type ANY_CODE = Token.CODE_BLOCK | Token.CODE_FENCE | Token.CODE_INLINE;
export type ANY_ITALIC = Token.ITALIC_AST | Token.ITALIC_UND;
export type ANY_STRONG = Token.STRONG_AST | Token.STRONG_UND;
export type ANY_AST = Token.STRONG_AST | Token.ITALIC_AST;
export type ANY_UND = Token.STRONG_UND | Token.ITALIC_UND;
export type ANY_LIST = Token.LIST_UNORDERED | Token.LIST_ORDERED;
export type ANY_ROOT = Token.DOCUMENT | Token.BLOCKQUOTE;

// Explicit constants
export const ANY_HEADING: ANY_HEADING = Token.HEADING_1 | Token.HEADING_2 | Token.HEADING_3 | Token.HEADING_4 | Token.HEADING_5 | Token.HEADING_6;
export const ANY_CODE: ANY_CODE = Token.CODE_BLOCK | Token.CODE_FENCE | Token.CODE_INLINE;
export const ANY_ITALIC: ANY_ITALIC = Token.ITALIC_AST | Token.ITALIC_UND;
export const ANY_STRONG: ANY_STRONG = Token.STRONG_AST | Token.STRONG_UND;
export const ANY_AST: ANY_AST = Token.STRONG_AST | Token.ITALIC_AST;
export const ANY_UND: ANY_UND = Token.STRONG_UND | Token.ITALIC_UND;
export const ANY_LIST: ANY_LIST = Token.LIST_UNORDERED | Token.LIST_ORDERED;
export const ANY_ROOT: ANY_ROOT = Token.DOCUMENT | Token.BLOCKQUOTE;

export const TokenLabel: Readonly<Record<Token, string>> = {
  [Token.DOCUMENT]: "Document",
  [Token.PARAGRAPH]: "Paragraph",
  [Token.HEADING_1]: "Heading1",
  [Token.HEADING_2]: "Heading2",
  [Token.HEADING_3]: "Heading3",
  [Token.HEADING_4]: "Heading4",
  [Token.HEADING_5]: "Heading5",
  [Token.HEADING_6]: "Heading6",
  [Token.CODE_BLOCK]: "CodeBlock",
  [Token.CODE_FENCE]: "CodeFence",
  [Token.CODE_INLINE]: "CodeInline",
  [Token.ITALIC_AST]: "ItalicAst",
  [Token.ITALIC_UND]: "ItalicUnd",
  [Token.STRONG_AST]: "StrongAst",
  [Token.STRONG_UND]: "StrongUnd",
  [Token.STRIKE]: "Strike",
  [Token.LINK]: "Link",
  [Token.RAW_URL]: "RawUrl",
  [Token.IMAGE]: "Image",
  [Token.BLOCKQUOTE]: "Blockquote",
  [Token.LINE_BREAK]: "LineBreak",
  [Token.RULE]: "Rule",
  [Token.LIST_UNORDERED]: "ListUnordered",
  [Token.LIST_ORDERED]: "ListOrdered",
  [Token.LIST_ITEM]: "ListItem",
  [Token.CHECKBOX]: "Checkbox",
  [Token.MAYBE_URL]: "MaybeUrl",
  [Token.MAYBE_TASK]: "MaybeTask"
} as const;


export const AttrLabel: Readonly<Record<Attr, string>> = {
  [Attr.HREF]: "href",
  [Attr.SRC]: "src",
  [Attr.LANG]: "lang",
  [Attr.CHECKED]: "checked",
  [Attr.START]: "start"
} as const;