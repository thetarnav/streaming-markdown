// import { Token, Attr } from "./types.js"

import { Attrs, Tokens } from "./tokens.js"
import type { Attr, Token } from "./types.js"

export function token_to_string(type: Token): string {
  switch (type) {
      case Tokens.Document:       return "Document"
      case Tokens.Blockquote:     return "Blockquote"
      case Tokens.Paragraph:      return "Paragraph"
      case Tokens.Heading_1:      return "Heading_1"
      case Tokens.Heading_2:      return "Heading_2"
      case Tokens.Heading_3:      return "Heading_3"
      case Tokens.Heading_4:      return "Heading_4"
      case Tokens.Heading_5:      return "Heading_5"
      case Tokens.Heading_6:      return "Heading_6"
      case Tokens.Code_Block:     return "Code_Block"
      case Tokens.Code_Fence:     return "Code_Fence"
      case Tokens.Code_Inline:    return "Code_Inline"
      case Tokens.Italic_Ast:     return "Italic_Ast"
      case Tokens.Italic_Und:     return "Italic_Und"
      case Tokens.Strong_Ast:     return "Strong_Ast"
      case Tokens.Strong_Und:     return "Strong_Und"
      case Tokens.Strike:         return "Strike"
      case Tokens.Link:           return "Link"
      case Tokens.Raw_URL:        return "Raw URL"
      case Tokens.Image:          return "Image"
      case Tokens.Line_Break:     return "Line_Break"
      case Tokens.Rule:           return "Rule"
      case Tokens.List_Unordered: return "List_Unordered"
      case Tokens.List_Ordered:   return "List_Ordered"
      case Tokens.List_Item:      return "List_Item"
      case Tokens.Checkbox:       return "Checkbox"
      default:                   return "Unknown"
  }
}

export function attr_to_html_attr(type: Attr): string {
  switch (type) {
      case Attrs.Href:    return "href"
      case Attrs.Src:     return "src"
      case Attrs.Lang:    return "lang"
      case Attrs.Checked: return "checked"
      case Attrs.Start:   return "start"
      default:           return "unknown"
  }
}
