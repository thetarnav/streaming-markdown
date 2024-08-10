import type { Renderer, RendererAddText, RendererAddToken, RendererEndToken, RendererSetAttr } from "@/renderer";
import type { Token } from "@/tokens";
import type { Children, NodeAttrs } from "@/types";

export type Parent_Map = Map<TestRendererNode, TestRendererNode>;

export interface TestRendererData {
  root: TestRendererNode;
  node: TestRendererNode;
  parent_map: Parent_Map;
}

export interface TestRendererNode {
  type: Token;
  children: Children<string | TestRendererNode>;
  attrs?: NodeAttrs;
}

export type TestRenderer = Renderer<TestRendererData>;
export type TestAddToken = RendererAddToken<TestRendererData>;
export type TestEndToken = RendererEndToken<TestRendererData>;
export type TestAddText = RendererAddText<TestRendererData>;
export type TestSetAttr = RendererSetAttr<TestRendererData>;