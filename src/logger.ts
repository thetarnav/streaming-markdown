import type { Renderer, RendererAddText, RendererAddToken, RendererEndToken, RendererSetAttr } from "./renderer";
import { attr_to_html_attr, token_to_string } from "./utils"

// Parser type

export type LoggerRendererData = undefined;

export type LoggerRenderer = Renderer<LoggerRendererData>;
export type LoggerRendererAddToken = RendererAddToken<LoggerRendererData>;
export type LoggerRendererEndToken = RendererEndToken<LoggerRendererData>;
export type LoggerRendererAddText = RendererAddText<LoggerRendererData>;
export type LoggerRendererSetAttr = RendererSetAttr<LoggerRendererData>;

export const logger_renderer: LoggerRenderer = {
  data:      undefined,
  add_token: (_, type) => {
    console.log("add_token:", token_to_string(type))
  },
  end_token: (_) => {
    console.log("end_token")
  },
  add_text:  (_, text) => {
    console.log('add_text: "%s"', text)
  },
  set_attr:  (_, type, value) => {
    console.log('set_attr: %s="%s"', attr_to_html_attr(type), value)
  },
}
