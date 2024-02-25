import {Token_Type} from './mds.js'

export type Parser = {
	renderer       : Any_Renderer
	txt            : string
	src            : string
	idx            : number
	nodes          : any[]
	types          : Token_Type[]
	len            : number
	code_block_lang: string | null
}

export type Renderer_Add_Node<TData, TNode> =
    (data: TData, type: Token_Type, parent: TNode | null) => TNode

export type Renderer_Add_Text<TData, TNode> =
    (data: TData, node: TNode, text: string) => void

export type Renderer_Add_Temp<TData, TNode> =
    (data: TData, node: TNode, text: string) => void

export type Renderer<TData, TNode> = {
    data    : TData
    add_node: Renderer_Add_Node<TData, TNode>
    add_text: Renderer_Add_Text<TData, TNode>
    add_temp: Renderer_Add_Temp <TData, TNode>
}

export type Any_Renderer = Renderer<any, any>

export type Default_Renderer_Data = {
    root: HTMLElement
    temp: HTMLElement
}

export type Default_Renderer_Node = {
    elem: HTMLElement
    slot: HTMLElement
}

export type Default_Renderer          = Renderer         <Default_Renderer_Data, Default_Renderer_Node>
export type Default_Renderer_Add_Node = Renderer_Add_Node<Default_Renderer_Data, Default_Renderer_Node>
export type Default_Renderer_Add_Text = Renderer_Add_Text<Default_Renderer_Data, Default_Renderer_Node>
export type Default_Renderer_Add_Temp = Renderer_Add_Temp<Default_Renderer_Data, Default_Renderer_Node>
