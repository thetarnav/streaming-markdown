export const
    DOCUMENT       = 1,        //  1
    PARAGRAPH      = 2,        //  2
    HEADING_1      = 4,        //  3
    HEADING_2      = 8,        //  4
    HEADING_3      = 16,       //  5
    HEADING_4      = 32,       //  6
    HEADING_5      = 64,       //  7
    HEADING_6      = 128,      //  8
    CODE_BLOCK     = 256,      //  9
    CODE_FENCE     = 512,      // 10
    CODE_INLINE    = 1024,     // 11
    ITALIC_AST     = 2048,     // 12
    ITALIC_UND     = 4096,     // 13
    STRONG_AST     = 8192,     // 14
    STRONG_UND     = 16384,    // 15
    STRIKE         = 32768,    // 16
    LINK           = 65536,    // 17
    RAW_URL        = 131072,   // 18
    IMAGE          = 262144,   // 19
    BLOCKQUOTE     = 524288,   // 20
    LINE_BREAK     = 1048576,  // 21
    RULE           = 4194304,  // 22
    LIST_UNORDERED = 8388608,  // 23
    LIST_ORDERED   = 16777216, // 24
    LIST_ITEM      = 33554432, // 25
    CHECKBOX       = 67108864, // 26
    MAYBE_URL      = 134217728,// 27
    MAYBE_TASK     = 268435456;// 28

// Compound Token types
export const
  /** `HEADING_1 | HEADING_2 | HEADING_3 | HEADING_4 | HEADING_5 | HEADING_6` */
  ANY_HEADING    = 252,
  /** `CODE_BLOCK | CODE_FENCE | CODE_INLINE` */
  ANY_CODE       = 1792,
  /** `ITALIC_AST | ITALIC_UND` */
  ANY_ITALIC     = 6144,
  /** `STRONG_AST | STRONG_UND` */
  ANY_STRONG     = 24576,
  /** `STRONG_AST | ITALIC_AST` */
  ANY_AST        = 10240,
  /** `STRONG_UND | ITALIC_UND` */
  ANY_UND        = 20480,
  /** `LIST_UNORDERED | LIST_ORDERED` */
  ANY_LIST       = 25165824,
  /** `DOCUMENT | BLOCKQUOTE` */
  ANY_ROOT       = 524289;

// Attr definitions
export const
    HREF    = 1,
    SRC     = 2,
    LANG    = 4,
    CHECKED = 8,
    START   = 16;

// Token enum
export enum Tokens {
    Document       = DOCUMENT,
    Paragraph      = PARAGRAPH,
    Heading_1      = HEADING_1,
    Heading_2      = HEADING_2,
    Heading_3      = HEADING_3,
    Heading_4      = HEADING_4,
    Heading_5      = HEADING_5,
    Heading_6      = HEADING_6,
    Code_Block     = CODE_BLOCK,
    Code_Fence     = CODE_FENCE,
    Code_Inline    = CODE_INLINE,
    Italic_Ast     = ITALIC_AST,
    Italic_Und     = ITALIC_UND,
    Strong_Ast     = STRONG_AST,
    Strong_Und     = STRONG_UND,
    Strike         = STRIKE,
    Link           = LINK,
    Raw_URL        = RAW_URL,
    Image          = IMAGE,
    Blockquote     = BLOCKQUOTE,
    Line_Break     = LINE_BREAK,
    Rule           = RULE,
    List_Unordered = LIST_UNORDERED,
    List_Ordered   = LIST_ORDERED,
    List_Item      = LIST_ITEM,
    Checkbox       = CHECKBOX,
    Maybe_URL      = MAYBE_URL,
    Maybe_Task     = MAYBE_TASK
}

// Attr enum
export enum Attrs {
    Href    = HREF,
    Src     = SRC,
    Lang    = LANG,
    Checked = CHECKED,
    Start   = START
}