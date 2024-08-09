import { Token, Attr } from "./types.js"

export function token_to_string(type: Token): string {
  switch (type) {
      case Token.Document:       return "Document"
      case Token.Blockquote:     return "Blockquote"
      case Token.Paragraph:      return "Paragraph"
      case Token.Heading_1:      return "Heading_1"
      case Token.Heading_2:      return "Heading_2"
      case Token.Heading_3:      return "Heading_3"
      case Token.Heading_4:      return "Heading_4"
      case Token.Heading_5:      return "Heading_5"
      case Token.Heading_6:      return "Heading_6"
      case Token.Code_Block:     return "Code_Block"
      case Token.Code_Fence:     return "Code_Fence"
      case Token.Code_Inline:    return "Code_Inline"
      case Token.Italic_Ast:     return "Italic_Ast"
      case Token.Italic_Und:     return "Italic_Und"
      case Token.Strong_Ast:     return "Strong_Ast"
      case Token.Strong_Und:     return "Strong_Und"
      case Token.Strike:         return "Strike"
      case Token.Link:           return "Link"
      case Token.Raw_URL:        return "Raw URL"
      case Token.Image:          return "Image"
      case Token.Line_Break:     return "Line_Break"
      case Token.Rule:           return "Rule"
      case Token.List_Unordered: return "List_Unordered"
      case Token.List_Ordered:   return "List_Ordered"
      case Token.List_Item:      return "List_Item"
      case Token.Checkbox:       return "Checkbox"
      default:                   return "Unknown"
  }
}

export function attr_to_html_attr(type: Attr): string {
  switch (type) {
      case Attr.Href:    return "href"
      case Attr.Src:     return "src"
      case Attr.Lang:    return "lang"
      case Attr.Checked: return "checked"
      case Attr.Start:   return "start"
      default:           return "unknown"
  }
}
