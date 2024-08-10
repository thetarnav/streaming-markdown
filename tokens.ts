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

// Compound Token types
export const ANY_HEADING    = Token.HEADING_1 | Token.HEADING_2 | Token.HEADING_3 | Token.HEADING_4 | Token.HEADING_5 | Token.HEADING_6;
export const ANY_CODE       = Token.CODE_BLOCK | Token.CODE_FENCE | Token.CODE_INLINE;
export const ANY_ITALIC     = Token.ITALIC_AST | Token.ITALIC_UND;
export const ANY_STRONG     = Token.STRONG_AST | Token.STRONG_UND;
export const ANY_AST        = Token.STRONG_AST | Token.ITALIC_AST;
export const ANY_UND        = Token.STRONG_UND | Token.ITALIC_UND;
export const ANY_LIST       = Token.LIST_UNORDERED | Token.LIST_ORDERED;
export const ANY_ROOT       = Token.DOCUMENT | Token.BLOCKQUOTE;

// Attr enum
export enum Attr {
  HREF    = 1,
  SRC     = 2,
  LANG    = 4,
  CHECKED = 8,
  START   = 16
}