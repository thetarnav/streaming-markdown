import {Token_Type} from './mds.js'

export type Parser = {
	/** {@link Renderer} interface */
	renderer       : Any_Renderer
	/** Text to be added to the last token in the next flush */
	text           : string
	/** Characters for identifying tokens */
	pending        : string
	/** Current token and it's parents (a slice of a tree) */
	types          : Token_Type[]
	/** Number of tokens in {@link Parser.types types} without root */
	len            : number
	code_block_lang: string | null
}

export type Renderer_Add_Node<TData> = (type: Token_Type, data: TData) => void
export type Renderer_End_Node<TData> = (data: TData) => void
export type Renderer_Add_Text<TData> = (text: string, data: TData) => void

export type Renderer<TData> = {
	data    : TData
	add_node: Renderer_Add_Node<TData>
	end_node: Renderer_End_Node<TData>
	add_text: Renderer_Add_Text<TData>
}

export type Any_Renderer = Renderer<any>

export type Default_Renderer_Data = {
	node: Default_Renderer_Node
}
export type Default_Renderer_Node = {
	slot  : HTMLElement
	parent: Default_Renderer_Node | null
}
export type Default_Renderer          = Renderer         <Default_Renderer_Data>
export type Default_Renderer_Add_Node = Renderer_Add_Node<Default_Renderer_Data>
export type Default_Renderer_End_Node = Renderer_End_Node<Default_Renderer_Data>
export type Default_Renderer_Add_Text = Renderer_Add_Text<Default_Renderer_Data>

export type Logger_Renderer_Data = undefined
export type Logger_Renderer          = Renderer         <Logger_Renderer_Data>
export type Logger_Renderer_Add_Node = Renderer_Add_Node<Logger_Renderer_Data>
export type Logger_Renderer_End_Node = Renderer_End_Node<Logger_Renderer_Data>
export type Logger_Renderer_Add_Text = Renderer_Add_Text<Logger_Renderer_Data>
