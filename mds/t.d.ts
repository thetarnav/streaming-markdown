import {Attr_Type, Token_Type} from './mds.js'

export type Parser = {
	/** {@link Renderer} interface */
	renderer  : Any_Renderer
	/** Text to be added to the last token in the next flush */
	text      : string
	/** Characters for identifying tokens */
	pending   : string
	/** Current token and it's parents (a slice of a tree) */
	types     : Token_Type[]
	/** Number of tokens in {@link Parser.types types} without root */
	len       : number
	/** For Code_Fence parsing      \
	 *  string: parsing language    \
	 *  1     : can end             \
	 *  0     : cannot end
	 */
	code_fence: string | 0 | 1
}

export type Renderer_Add_Node<TData> = (data: TData, type: Token_Type) => void
export type Renderer_End_Node<TData> = (data: TData) => void
export type Renderer_Add_Text<TData> = (data: TData, text: string) => void
export type Renderer_Set_Attr<TData> = (data: TData, type: Attr_Type, value: string) => void

export type Renderer<TData> = {
	data    : TData
	add_node: Renderer_Add_Node<TData>
	end_node: Renderer_End_Node<TData>
	add_text: Renderer_Add_Text<TData>
	set_attr: Renderer_Set_Attr<TData>
}

export type Any_Renderer = Renderer<any>

export type Default_Renderer_Data = {
	nodes: HTMLElement[]
	index: number
}
export type Default_Renderer          = Renderer         <Default_Renderer_Data>
export type Default_Renderer_Add_Node = Renderer_Add_Node<Default_Renderer_Data>
export type Default_Renderer_End_Node = Renderer_End_Node<Default_Renderer_Data>
export type Default_Renderer_Add_Text = Renderer_Add_Text<Default_Renderer_Data>
export type Default_Renderer_Set_Attr = Renderer_Set_Attr<Default_Renderer_Data>

export type Logger_Renderer_Data     = undefined
export type Logger_Renderer          = Renderer         <Logger_Renderer_Data>
export type Logger_Renderer_Add_Node = Renderer_Add_Node<Logger_Renderer_Data>
export type Logger_Renderer_End_Node = Renderer_End_Node<Logger_Renderer_Data>
export type Logger_Renderer_Add_Text = Renderer_Add_Text<Logger_Renderer_Data>
export type Logger_Renderer_Set_Attr = Renderer_Set_Attr<Logger_Renderer_Data>
