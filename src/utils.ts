// import { Token, Attr } from "./types.js"

import { Token, Attr } from "./tokens.js"


export function token_to_string(type: Token): string {
  switch (type) {
      case Token.DOCUMENT:       return "Document"
      case Token.BLOCKQUOTE:     return "Blockquote"
      case Token.PARAGRAPH:      return "Paragraph"
      case Token.HEADING_1:      return "Heading_1"
      case Token.HEADING_2:      return "Heading_2"
      case Token.HEADING_3:      return "Heading_3"
      case Token.HEADING_4:      return "Heading_4"
      case Token.HEADING_5:      return "Heading_5"
      case Token.HEADING_6:      return "Heading_6"
      case Token.CODE_BLOCK:     return "Code_Block"
      case Token.CODE_FENCE:     return "Code_Fence"
      case Token.CODE_INLINE:    return "Code_Inline"
      case Token.ITALIC_AST:     return "Italic_Ast"
      case Token.ITALIC_UND:     return "Italic_Und"
      case Token.STRONG_AST:     return "Strong_Ast"
      case Token.STRONG_UND:     return "Strong_Und"
      case Token.STRIKE:         return "Strike"
      case Token.LINK:           return "Link"
      case Token.RAW_URL:        return "Raw URL"
      case Token.IMAGE:          return "Image"
      case Token.LINE_BREAK:     return "Line_Break"
      case Token.RULE:           return "Rule"
      case Token.LIST_UNORDERED: return "List_Unordered"
      case Token.LIST_ORDERED:   return "List_Ordered"
      case Token.LIST_ITEM:      return "List_Item"
      case Token.CHECKBOX:       return "Checkbox"
      default:                   return "Unknown"
  }
}

export function attr_to_html_attr(type: Attr): string {
  switch (type) {
      case Attr.HREF:    return "href"
      case Attr.SRC:     return "src"
      case Attr.LANG:    return "lang"
      case Attr.CHECKED: return "checked"
      case Attr.START:   return "start"
      default:           return "unknown"
  }
}
