import {Attr, Token} from './mds.js'

export type Parser = {
	/** {@link Renderer} interface */
	renderer  : Any_Renderer
	/** Text to be added to the last token in the next flush */
	text      : string
	/** Characters for identifying tokens */
	pending   : string
	/** Current token and it's parents (a slice of a tree) */
	types     : Token[]
	/** Number of tokens in {@link Parser.types types} without root */
	len       : number
	/** For Code_Fence parsing      \
	 *  string: parsing language    \
	 *  1     : can end             \
	 *  0     : cannot end
	 */
	code_fence: string | 0 | 1
	backticks_count: number
	/* For Blockquote parsing */
	newline_blockquote_idx: number
	/* For horizontal rule parsing */
	hr_char: string
	hr_chars: number
}

export type Renderer_Add_Token<TData> = (data: TData, type: Token) => void
export type Renderer_End_Token<TData> = (data: TData) => void
export type Renderer_Add_Text <TData> = (data: TData, text: string) => void
export type Renderer_Set_Attr <TData> = (data: TData, type: Attr, value: string) => void

export type Renderer<TData> = {
	data     : TData
	add_token: Renderer_Add_Token<TData>
	end_token: Renderer_End_Token<TData>
	add_text : Renderer_Add_Text <TData>
	set_attr : Renderer_Set_Attr <TData>
}

export type Any_Renderer = Renderer<any>

export type Default_Renderer_Data = {
	nodes: HTMLElement[]
	index: number
}
export type Default_Renderer           = Renderer          <Default_Renderer_Data>
export type Default_Renderer_Add_Token = Renderer_Add_Token<Default_Renderer_Data>
export type Default_Renderer_End_Token = Renderer_End_Token<Default_Renderer_Data>
export type Default_Renderer_Add_Text  = Renderer_Add_Text <Default_Renderer_Data>
export type Default_Renderer_Set_Attr  = Renderer_Set_Attr <Default_Renderer_Data>

export type Logger_Renderer_Data      = undefined
export type Logger_Renderer           = Renderer          <Logger_Renderer_Data>
export type Logger_Renderer_Add_Token = Renderer_Add_Token<Logger_Renderer_Data>
export type Logger_Renderer_End_Token = Renderer_End_Token<Logger_Renderer_Data>
export type Logger_Renderer_Add_Text  = Renderer_Add_Text <Logger_Renderer_Data>
export type Logger_Renderer_Set_Attr  = Renderer_Set_Attr <Logger_Renderer_Data>
