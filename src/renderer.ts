import { Token, Attr } from "./tokens";
import { attr_to_html_attr } from "./utils";

export type Children<T = string> = Array<T>
export type NodeAttrs = {[key in Attr]?: string};

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

export function default_renderer(root: HTMLElement): DefaultRenderer {
	return {
		add_token: default_add_token,
		end_token: default_end_token,
		add_text:  default_add_text,
		set_attr:  default_set_attr,
		data    : {
			nodes: ([root,,,,,]),
			index: 0,
		},
	}
}

export const default_add_token: DefaultAddToken = (data, type) => {
  let mount: HTMLElement;
  let slot: HTMLElement;

  switch (type) {
      case Token.DOCUMENT: return; // document is provided
      case Token.BLOCKQUOTE:    mount = slot = document.createElement("blockquote"); break;
      case Token.PARAGRAPH:     mount = slot = document.createElement("p");          break;
      case Token.LINE_BREAK:     mount = slot = document.createElement("br");         break;
      case Token.RULE:          mount = slot = document.createElement("hr");         break;
      case Token.HEADING_1:      mount = slot = document.createElement("h1");         break;
      case Token.HEADING_2:      mount = slot = document.createElement("h2");         break;
      case Token.HEADING_3:      mount = slot = document.createElement("h3");         break;
      case Token.HEADING_4:      mount = slot = document.createElement("h4");         break;
      case Token.HEADING_5:      mount = slot = document.createElement("h5");         break;
      case Token.HEADING_6:      mount = slot = document.createElement("h6");         break;
      case Token.ITALIC_AST:
      case Token.ITALIC_UND:     mount = slot = document.createElement("em");         break;
      case Token.STRONG_AST:
      case Token.STRONG_UND:     mount = slot = document.createElement("strong");     break;
      case Token.STRIKE:        mount = slot = document.createElement("s");          break;
      case Token.CODE_INLINE:    mount = slot = document.createElement("code");       break;
      case Token.RAW_URL:
      case Token.LINK:          mount = slot = document.createElement("a");          break;
      case Token.IMAGE:         mount = slot = document.createElement("img");        break;
      case Token.LIST_UNORDERED: mount = slot = document.createElement("ul");         break;
      case Token.LIST_ORDERED:   mount = slot = document.createElement("ol");         break;
      case Token.LIST_ITEM:      mount = slot = document.createElement("li");         break;
      case Token.CHECKBOX:
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.disabled = true;
          mount = slot = checkbox;
          break;
      case Token.CODE_BLOCK:
      case Token.CODE_FENCE:
          mount = document.createElement("pre");
          slot  = document.createElement("code");
          mount.appendChild(slot);
          break;

      default:
          throw new Error("Unknown token: " + type);
  }

  data.nodes[data.index]?.appendChild(mount);
  data.index += 1;
  data.nodes[data.index] = slot;
};

export const default_end_token: DefaultEndToken = (data) => {
	data.index -= 1
}

export const default_add_text: DefaultAddText = (data, text) => {
	data.nodes[data.index]?.appendChild(document.createTextNode(text))
}

export const default_set_attr: DefaultSetAttr = (data, type, value) => {
	data.nodes[data.index]?.setAttribute(attr_to_html_attr(type), value)
}
