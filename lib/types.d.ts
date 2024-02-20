import {Token_Type} from './mds.js'

export type Create_Token_Node<TData, TNode> =
    (data: TData, type: Token_Type, parent: TNode | null) => TNode

export type Update_Token_Node<TData, TNode> =
    (data: TData, node: TNode, text: string) => void

export type Render_Temp_Text<TData, TNode> =
    (data: TData, node: TNode, text: string) => void

export type Renderer<TData, TNode> = {
    data            : TData
    create_node     : Create_Token_Node<TData, TNode>
    update_node     : Update_Token_Node<TData, TNode>
    render_temp_text: Render_Temp_Text <TData, TNode>
}

export type Default_Renderer_Data = {
    root: HTMLElement
    temp: HTMLElement
}

export type Default_Renderer_Node = {
    elem: HTMLElement
    slot: HTMLElement
}

export type Default_Renderer                  = Renderer         <Default_Renderer_Data, Default_Renderer_Node>
export type Default_Renderer_Create_Node      = Create_Token_Node<Default_Renderer_Data, Default_Renderer_Node>
export type Default_Renderer_Update_Node      = Update_Token_Node<Default_Renderer_Data, Default_Renderer_Node>
export type Default_Renderer_Render_Temp_Text = Render_Temp_Text <Default_Renderer_Data, Default_Renderer_Node>