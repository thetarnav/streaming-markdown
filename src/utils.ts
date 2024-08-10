// import { Token, Attr } from "./types.js"

import { Token, Attr, TokenLabel, AttrLabel } from "./tokens"

export function token_to_string(type: Token): typeof TokenLabel[Token] {
  return TokenLabel[type]
}

export function attr_to_html_attr(type: Attr): typeof AttrLabel[Attr] {
	return AttrLabel[type]
}