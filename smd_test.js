import * as smd from "./smd.js"

import {test_single_write, BR} from "./smd_test_setup.js"

for (let level = 1; level <= 6; level += 1) {

	/** @type {smd.Token} */
	let heading_type
	switch (level) {
	case 1: heading_type = smd.Token.Heading_1; break
	case 2: heading_type = smd.Token.Heading_2; break
	case 3: heading_type = smd.Token.Heading_3; break
	case 4: heading_type = smd.Token.Heading_4; break
	case 5: heading_type = smd.Token.Heading_5; break
	case 6: heading_type = smd.Token.Heading_6; break
	default: throw new Error("Invalid heading level")
	}

	test_single_write(`Heading_${level}`,
		"#".repeat(level) + " " + "foo",
		[{
			type    : heading_type,
			children: ["foo"]
		}]
	)

	test_single_write(`Heading_${level} with Line Italic`,
		"#".repeat(level) + " foo *bar*",
		[{
			type    : heading_type,
			children: ["foo ", {
				type    : smd.Token.Italic_Ast,
				children: ["bar"]
			}]
		}]
	)

	test_single_write(`Heading_${level} after line break`,
		"\n" + "#".repeat(level) + " " + "foo",
		[{
			type    : heading_type,
			children: ["foo"]
		}]
	)
}

test_single_write("Newline",
	"foo\nbar",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo", BR, "bar"],
	}]
)

test_single_write("Newline with Italic",
	"*a\nb*",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Italic_Ast,
			children: ["a", BR, "b"]
		}],
	}]
)

test_single_write("Escaped Newline",
	"a\\\nb",
	[{
		type    : smd.Token.Paragraph,
		children: ["a", BR, "b"],
	}]
)

for (let br of ["<br>", "<br/>", "<br />"]) {
	test_single_write("Line Break ("+br+")",
		"a"+br+"b",
		[{
			type    : smd.Token.Paragraph,
			children: ["a", BR, "b"],
		}]
	)
	
	test_single_write("Line Break with Italic ("+br+")",
		"*a"+br+"b*",
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Italic_Ast,
				children: ["a", BR, "b"]
			}],
		}]
	)
	
	test_single_write("Escaped Line Break ("+br+")",
		"a\\"+br+"b",
		[{
			type    : smd.Token.Paragraph,
			children: ["a"+br+"b"],
		}]
	)
}

for (let br of ["<bra>", "<br//>"]) {
	test_single_write("Wrong Line Break ("+br+")",
		"a"+br+"b",
		[{
			type    : smd.Token.Paragraph,
			children: ["a"+br+"b"],
		}]
	)
}


test_single_write("Paragraphs",
	"foo\n\nbar",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo"],
	}, {
		type    : smd.Token.Paragraph,
		children: ["bar"],
	}]
)

test_single_write("Paragraph trim leading spaces",
	"  foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo"],
	}]
)

test_single_write("Trim too many spaces",
	"foo       bar",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo bar"],
	}]
)

test_single_write("Trim too many spaces in italic",
	"*foo       bar*",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Italic_Ast,
			children: ["foo bar"]
		}],
	}]
)

for (const c of ["*", "-", "_"]) {
	for (let l = 3; l <= 6; l += 1) {
		let txt = ""
		for (let i = 0; i < l; i += 1) {
			if (i % 2 === 0) {
				txt += " " // mix in some spaces
			}
			txt += c
		}

		test_single_write('Horizontal Rule "' + txt + '"',
			txt,
			[{
				type    : smd.Token.Rule,
				children: []
			}]
		)
	}
}

test_single_write("Text after Horizontal Rule",
	"---\nfoo",
	[{
		type    : smd.Token.Rule,
		children: []
	}, {
		type    : smd.Token.Paragraph,
		children: ["foo"],
	}]
)

for (let l = 1; l <= 4; l += 1) {
	const c = '`'.repeat(l)

	test_single_write("Code Inline" + " - "+l+" backticks",
		c + "a" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}],
		}]
	)

	test_single_write("Code Inline trims spaces" + " - "+l+" backticks",
		c + " a " + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}],
		}]
	)

	test_single_write("Code Inline x2" + " - "+l+" backticks",
		c+"a"+c+" "+c+"b"+c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}, " ", {
				type    : smd.Token.Code_Inline,
				children: ["b"]
			}],
		}]
	)

	if (l > 1) {
		const m = '`'.repeat(l - 1)

		test_single_write("Code ` Inline" + " - "+l+" backticks",
		c + "a"+m+"b" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"+m+"b"]
			}],
		}]
	)
	}
}

for (let l = 1; l <= 2; l += 1) {
	const c = '`'.repeat(l)

	test_single_write("Code with line break" + " - "+l+" backticks",
		c + "a\nb" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a", BR, "b"]
			}],
		}]
	)

	test_single_write("Code with two newlines" + " - "+l+" backticks",
		c + "a\n\nb",
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["a"]
			}],
		}, {
			type    : smd.Token.Paragraph,
			children: ["b"],
		}]
	)
}

for (let l = 3; l <= 5; l += 1) {

	let fence      = '`'.repeat(l)
	let fence_less = '`'.repeat(l - 1)
	let fence_more = '`'.repeat(l + 1)

	test_single_write("Empty Code_Fence - "+l+" backticks",
		fence+"\n"+fence,
		[{
			type    : smd.Token.Code_Fence,
			children: []
		}]
	)

	test_single_write("Code_Fence - "+l+" backticks",
		fence+"\nfoo\n"+fence,
		[{
			type    : smd.Token.Code_Fence,
			children: ["foo"]
		}]
	)

	test_single_write("Code_Fence space before close - "+l+" backticks",
		fence+"\nfoo\n "+fence,
		[{
			type    : smd.Token.Code_Fence,
			children: ["foo"]
		}]
	)

	test_single_write("Code_Fence with language - "+l+" backticks",
		fence+"js\nfoo\n"+fence,
		[{
			type    : smd.Token.Code_Fence,
			children: ["foo"],
			attrs   : {[smd.Attr.Lang]: "js"}
		}]
	)

	test_single_write("Code_Fence escaped backticks - "+l+" backticks",
		fence+"\n"+fence_less+"\n"+fence,
		[{
			type    : smd.Token.Code_Fence,
			children: [fence_less]
		}]
	)

	test_single_write("Code_Fence - bad_end_fence:less - "+l+" backticks",
		fence+"\n"+
		fence_less+"\n"+
		fence,
		[{
			type    : smd.Token.Code_Fence,
			children: [fence_less]
		}]
	)

	test_single_write("Code_Fence - bad_end_fence:more - "+l+" backticks",
		fence+"\n"+
		fence_more+"\n"+
		fence,
		[{
			type    : smd.Token.Code_Fence,
			children: [fence_more]
		}]
	)

	test_single_write("Code_Fence - bad_end_fence:char - "+l+" backticks",
		fence+"\n"+
		fence+"b"+"\n"+
		fence,
		[{
			type    : smd.Token.Code_Fence,
			children: [fence+"b"]
		}]
	)

	test_single_write("Code_Fence - bad_end_fence:space - "+l+" backticks",
		fence+"\n"+
		"`".padStart(l)+"\n"+
		fence,
		[{
			type    : smd.Token.Code_Fence,
			children: ["`".padStart(l)]
		}]
	)

	test_single_write("Multiple Code Fences should be separated - "+l+" backticks",
		`${fence}\nFoo\n${fence}\n\nBar\n\n${fence}\nBaz\n${fence}`,
		[{
			type    : smd.Token.Code_Fence,
			children: ["Foo"]
		}, {
			type    : smd.Token.Paragraph,
			children: ["Bar"]
		}, {
			type    : smd.Token.Code_Fence,
			children: ["Baz"]
		}]
	)

	test_single_write("Nested Code Fences - "+l+" backticks",
		`${fence_more}\nbefore\n${fence}js\nsome js\n${fence}\n${fence_more}`,
		[{
			type    : smd.Token.Code_Fence,
			children: [`before\n${fence}js\nsome js\n${fence}`],
		}],
	)
}


for (const indent of [
	"    ",
	"   \t",
	"  \t",
	" \t",
	"\t",
]) {
	const escaped_indent = indent.replace(/\t/g, "\\t")

	test_single_write("Code_Block; indent: '"+escaped_indent+"'",
		indent + "  foo",
		[{
			type    : smd.Token.Code_Block,
			children: ["  foo"]
		}]
	)

	test_single_write("Code_Block multiple lines; indent: '"+escaped_indent+"'",
		indent + "foo\n" +
		indent + "bar",
		[{
			type    : smd.Token.Code_Block,
			children: ["foo\nbar"]
		}]
	)

	test_single_write("Code_Block end; indent: '"+escaped_indent+"'",
		indent+"foo\n" +
		"bar",
		[{
			type    : smd.Token.Code_Block,
			children: ["foo"]
		}, {
			type    : smd.Token.Paragraph,
			children: ["bar"]
		}]
	)
}


for (const {c, italic, strong} of [{
	c: "*",
	italic: smd.Token.Italic_Ast,
	strong: smd.Token.Strong_Ast,
}, {
	c: "_",
	italic: smd.Token.Italic_Und,
	strong: smd.Token.Strong_Und,
}]) {
	const case_1 = ""+c+c+"bold"+c+"bold>em"+c+c+c+""
	const case_2 = ""+c+c+c+"bold>em"+c+"bold"+c+c+""
	const case_3 = ""+c+"em"+c+c+"em>bold"+c+c+c+""
	const case_4 = ""+c+c+c+"bold>em"+c+c+"em"+c+""

	test_single_write("Italic & Bold \""+case_1+"\'",
		case_1,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : strong,
				children: ["bold", {
					type    : italic,
					children: ["bold>em"]
				}]
			}]
		}]
	)

	test_single_write("Italic & Bold \""+case_2+"\'",
		case_2,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : strong,
				children: [{
					type    : italic,
					children: ["bold>em"]
				},
				"bold"]
			}]
		}]
	)

	test_single_write("Italic & Bold \""+case_3+"\'",
		case_3,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : italic,
				children: ["em", {
					type    : strong,
					children: ["em>bold"]
				}]
			}]
		}]
	)

	test_single_write("Italic & Bold \""+case_4+"\'",
		case_4,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : strong,
				children: [{
					type    : italic,
					children: ["bold>em"]
				}]
			}, {
				type    : italic,
				children: ["em"]
			}]
		}]
	)
}

for (const {type, c} of [
	{type: smd.Token.Italic_Ast, c: "*" },
	{type: smd.Token.Italic_Und, c: "_" },
	{type: smd.Token.Strong_Ast, c: "**"},
	{type: smd.Token.Strong_Und, c: "__"},
	{type: smd.Token.Strike    , c: "~~"},
]) {
	let e = ""
	for (const char of c) {
		e += "\\" + char
	}

	test_single_write(smd.token_to_string(type),
		c + "foo" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: ["foo"]
			}]
		}]
	)

	test_single_write(smd.token_to_string(type) + " space after begin",
		"a " + c + " b" + c,
		[{
			type    : smd.Token.Paragraph,
			children: ["a " + c + " b" + c]
		}]
	)

	test_single_write(smd.token_to_string(type) + " with Code",
		c + "`foo`" + c,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: [{
					type    : smd.Token.Code_Inline,
					children: ["foo"]
				}]
			}]
		}]
	)

	test_single_write(smd.token_to_string(type) + " new Paragraph",
		"foo\n\n"+
		c + "bar" + c,
		[{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}, {
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: ["bar"]
			}],
		}]
	)

	test_single_write(`Escape ${smd.token_to_string(type)} Begin`,
		e + "foo",
		[{
			type    : smd.Token.Paragraph,
			children: [c + "foo"]
		}]
	)

	test_single_write(`Escape ${smd.token_to_string(type)} End`,
		c + "foo" + e,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : type,
				children: ["foo" + c]
			}]
		}]
	)
}

test_single_write("Escape Backtick",
	"\\`" + "foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["`" + "foo"]
	}]
)

test_single_write("Escape Backslash",
	"\\\\" + "foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["\\" + "foo"]
	}]
)

test_single_write("Escape normal char",
	"\\a",
	[{
		type    : smd.Token.Paragraph,
		children: ["\\a"]
	}]
)

for (const url of [
	"http://example.com/page",
	"https://example.com/page",
]) {
	test_single_write("Raw URL " + url,
		url,
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Raw_URL,
				attrs   : {[smd.Attr.Href]: url},
				children: [url],
			}]
		}]
	)

	test_single_write("Raw URL in text " + url,
		"foo "+url+" bar",
		[{	type    : smd.Token.Paragraph,
			children: [
				"foo ",
				{	type    : smd.Token.Raw_URL,
					attrs   : {[smd.Attr.Href]: url},
					children: [url],
				},
				" bar",
			]
		}]
	)

	test_single_write("Doesn't match urls in text",
		"foo"+url,
		[{
			type    : smd.Token.Paragraph,
			children: ["foo"+url]
		}],
	)
}

test_single_write("Doesn't match not_urls as urls",
	"http:/wrong.com",
	[{
		type    : smd.Token.Paragraph,
		children: ["http:/wrong.com"]
	}]
)

test_single_write("Link",
	"[title](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Link with code",
	"[`title`](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: [{
				type    : smd.Token.Code_Inline,
				children: ["title"],
			}],
		}]
	}]
)

test_single_write("Link new paragraph",
	"foo\n\n"+
	"[title](url)",
	[{
		type    : smd.Token.Paragraph,
		children: ["foo"]
	},{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Image",
	"![title](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Image,
			attrs   : {[smd.Attr.Src]: "url"},
			children: ["title"],
		}]
	}]
)

test_single_write("Image with code",
	"![`title`](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Image,
			attrs   : {[smd.Attr.Src]: "url"},
			children: ["`title`"],
		}]
	}]
)

test_single_write("Link with Image",
	"[![title](src)](href)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "href"},
			children: [{
				type    : smd.Token.Image,
				attrs   : {[smd.Attr.Src]: "src"},
				children: ["title"],
			}],
		}]
	}]
)

test_single_write("Escaped link Begin",
	"\\[foo](url)",
	[{
		type    : smd.Token.Paragraph,
		children: ["[foo](url)"]
	}]
)

test_single_write("Escaped link End",
	"[foo\\](url)",
	[{
		type    : smd.Token.Paragraph,
		children: [{
			type    : smd.Token.Link,
			children: ["foo](url)"],
		}]
	}]
)

test_single_write("Un-Escaped link Both",
	"\\\\[foo\\\\](url)",
	[{
		type    : smd.Token.Paragraph,
		children: ["\\", {
			type    : smd.Token.Link,
			attrs   : {[smd.Attr.Href]: "url"},
			children: ["foo\\"],
		}]
	}]
)

test_single_write("Blockquote",
	"> foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote no-space",
	">foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote Escape",
	"\\> foo",
	[{
		type    : smd.Token.Paragraph,
		children: ["> foo"],
	}]
)

test_single_write("Blockquote line break",
	"> foo\nbar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo", BR, "bar"],
		}]
	}]
)

test_single_write("Blockquote continued",
	"> foo\n> bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo", BR, "bar"],
		}]
	}]
)

test_single_write("Blockquote end",
	"> foo\n\nbar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}]
	}, {
		type    : smd.Token.Paragraph,
		children: ["bar"],
	}]
)

test_single_write("Blockquote heading",
	"> # foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Heading_1,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote codeblock",
	"> ```\nfoo\n```",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Code_Fence,
			children: ["foo"],
		}]
	}]
)

test_single_write("Blockquote blockquote",
	"> > foo",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}]
		}]
	}]
)

test_single_write("Blockquote up blockquote",
	"> foo\n"+
	"> > bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Paragraph,
			children: ["foo"],
		}, {
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["bar"],
			}]
		}]
	}]
)

test_single_write("Blockquote blockquote down",
	"> > foo\n"+
	"> \n"+
	"> bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}]
		}, {
			type    : smd.Token.Paragraph,
			children: ["bar"],
		}]
	}]
)

test_single_write("Blockquote blockquote continued",
	"> > foo\n"+
	"> >\n"+
	"> > bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}, {
				type    : smd.Token.Paragraph,
				children: ["bar"],
			}]
		}]
	}]
)

test_single_write("Blockquote up down",
	"> > foo\n"+
	">\n"+
	"> > bar",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["foo"],
			}]
		}, {
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["bar"],
			}]
		}]
	}]
)

test_single_write("Blockquote with code and line break",
	"> > `a\n"+
	"b`\n"+
	">\n"+
	"> > c",
	[{
		type    : smd.Token.Blockquote,
		children: [{
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: [{
					type    : smd.Token.Code_Inline,
					children: ["a", BR, "b"],
				}]
			}]
		}, {
			type    : smd.Token.Blockquote,
			children: [{
				type    : smd.Token.Paragraph,
				children: ["c"],
			}],
		}]
	}]
)

test_single_write("Ordered list",
	"1. hello\n"+
	"2. world\n"+
	"3. wave",
	[{
		type    : smd.Token.List_Ordered,
		children: [{
			type    : smd.Token.List_Item,
			children: ["hello"],
		}, {
			type    : smd.Token.List_Item,
			children: ["world"],
		}, {
			type    : smd.Token.List_Item,
			children: ["wave"],
		}],
	}]
)

for (const [c, token] of /** @type {const} */([
	["*",    smd.Token.List_Unordered],
	["-",    smd.Token.List_Unordered],
	["+",    smd.Token.List_Unordered],
	["1.",   smd.Token.List_Ordered],
	["420.", smd.Token.List_Ordered],
])) {
	const list_name = token === smd.Token.List_Unordered
		? "List Unordered"
		: "List Ordered"
	const suffix = "; prefix: "+c

	const attrs = c === "420."
		? {[smd.Attr.Start]: "420"}
		: undefined

	const indent       = " ".repeat(c.length + 1)
	const indent_small = " ".repeat(c.length)

	test_single_write(list_name + suffix,
		c+" foo",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["foo"]
			}]
		}]
	)

	test_single_write(list_name + " with italic" + suffix,
		c+" *foo*",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: [{
					type    : smd.Token.Italic_Ast,
					children: ["foo"]
				}]
			}]
		}]
	)

	test_single_write(list_name + " two items" + suffix,
		c+" a\n"+
		c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a"]
			}, {
				type    : smd.Token.List_Item,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " with line break" + suffix,
		c+" a\nb",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a", BR, "b"]
			}]
		}]
	)

	test_single_write(list_name + " with two newlines" + suffix,
		c+" a\n\n"+c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a"]
			}, {
				type    : smd.Token.List_Item,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " with three newlines" + suffix,
		c+" a\n\n\n"+c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a"]
			}]
		}, {
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " end" + suffix,
		c+" a\n"+
		"\n"+
		"b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a"]
			}]
		}, {
			type    : smd.Token.Paragraph,
			children: ["b"]
		}]
	)

	test_single_write(list_name + " after line break" + suffix,
		"a\n"+
		c+" b",
		[{
			type    : smd.Token.Paragraph,
			children: ["a"]
		}, {
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " with unchecked task" + suffix,
		c+" [ ] foo",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: [{
					type    : smd.Token.Checkbox,
					children: [],
				}, " foo"]
			}]
		}]
	)

	test_single_write(list_name + " with checked task" + suffix,
		c+" [x] foo",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: [{
					type    : smd.Token.Checkbox,
					attrs   : {[smd.Attr.Checked]: ""},
					children: [],
				}, " foo"]
			}]
		}]
	)

	test_single_write(list_name + " with two tasks" + suffix,
		c+" [ ] foo\n"+
		c+" [x] bar\n",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: [{
					type    : smd.Token.Checkbox,
					children: [],
				}, " foo"]
			}, {
				type    : smd.Token.List_Item,
				children: [{
					type    : smd.Token.Checkbox,
					attrs   : {[smd.Attr.Checked]: ""},
					children: [],
				}, " bar"]
			}]
		}]
	)

	test_single_write(list_name + " with link" + suffix,
		c+" [x](url)",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: [{
					type    : smd.Token.Link,
					attrs   : {[smd.Attr.Href]: "url"},
					children: ["x"],
				}]
			}]
		}]
	)

	test_single_write(list_name + " nested list" + suffix,
		c+" a\n"+
		indent+c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a", {
					type    : token,
					attrs   : attrs,
					children: [{
						type    : smd.Token.List_Item,
						children: ["b"]
					}]
				}]
			}]
		}]
	)

	test_single_write(list_name + " failed nested list" + suffix,
		c+" a\n"+
		indent_small+c+" b",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a"]
			}, {
				type    : smd.Token.List_Item,
				children: ["b"]
			}]
		}]
	)

	test_single_write(list_name + " nested ul multiple items" + suffix,
		c+" a\n"+
		indent+"* b\n"+
		indent+"* c\n",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a", {
					type    : smd.Token.List_Unordered,
					children: [{
						type    : smd.Token.List_Item,
						children: ["b"]
					}, {
						type    : smd.Token.List_Item,
						children: ["c"]
					}]
				}]
			}]
		}]
	)

	test_single_write(list_name + " nested and un-nested" + suffix,
		c+" a\n"+
		indent+"* b\n"+
		c+" c\n",
		[{
			type    : token,
			attrs   : attrs,
			children: [{
				type    : smd.Token.List_Item,
				children: ["a", {
					type    : smd.Token.List_Unordered,
					children: [{
						type    : smd.Token.List_Item,
						children: ["b"]
					}]
				}]
			}, {
				type    : smd.Token.List_Item,
				children: ["c"]
			}]
		}]
	)

	// test_single_write(list_name + " single line nesting" + suffix,
	// 	c+" * a",
	// 	[{
	// 		type    : token,
	// 		attrs   : attrs,
	// 		children: [{
	// 			type    : smd.Token.List_Item,
	// 			children: [{
	// 				type    : smd.Token.List_Unordered,
	// 				children: [{
	// 					type    : smd.Token.List_Item,
	// 					children: ["a"]
	// 				}]
	// 			}]
	// 		}]
	// 	}]
	// )

	// test_single_write(list_name + " single line nesting continued" + suffix,
	// 	c+" * a\n"+
	// 	indent+"* b",
	// 	[{
	// 		type    : token,
	// 		attrs   : attrs,
	// 		children: [{
	// 			type    : smd.Token.List_Item,
	// 			children: [{
	// 				type    : smd.Token.List_Unordered,
	// 				children: [{
	// 					type    : smd.Token.List_Item,
	// 					children: ["a"]
	// 				}, {
	// 					type    : smd.Token.List_Item,
	// 					children: ["b"]
	// 				}]
	// 			}]
	// 		}]
	// 	}]
	// )
}

test_single_write("Failed nesting of ul in ol",
	"1. a\n"+
	"  * b",
	[{
		type    : smd.Token.List_Ordered,
		children: [{
			type    : smd.Token.List_Item,
			children: ["a"]
		}]
	}, {
		type    : smd.Token.List_Unordered,
		children: [{
			type    : smd.Token.List_Item,
			children: ["b"]
		}]
	}]
)

// test_single_write("Heading in a list item",
// 	"- # foo",
// 	[{
// 		type    : smd.Token.List_Unordered,
// 		children: [{
// 			type    : smd.Token.List_Item,
// 			children: [{
// 				type    : smd.Token.Heading_1,
// 				children: ["foo"]
// 			}]
// 		}]
// 	}]
// )

test_single_write("Simple Table",
`| Foo | Bar |
| -- | -- |
| A\\|a | Bb |
| aA| bB |`,
[{
	type    : smd.Token.Table,
	children: [{
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" Foo "]},
			{type: smd.Token.Table_Cell, children: [" Bar "]},
		]
	}, {
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" A|a "]},
			{type: smd.Token.Table_Cell, children: [" Bb "]},
		]
	}, {
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" aA"]},
			{type: smd.Token.Table_Cell, children: [" bB "]},
		]
	}]
}])

test_single_write("Table Empty Cells",
`||
|-|
||`,
[{
	type    : smd.Token.Table,
	children: [{
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: []},
		]
	}, {
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: []},
		]
	}]
}])

test_single_write("Table Escaped Pipe",
`\\| a | b | c |`,
[{
	type    : smd.Token.Paragraph,
	children: ["\| a | b | c |"],
}])

test_single_write("Paragraph after table",
`| A | B |
| -- | -- |
| a | b |

Hello`,
[{
	type    : smd.Token.Table,
	children: [{
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" A "]},
			{type: smd.Token.Table_Cell, children: [" B "]},
		]
	}, {
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" a "]},
			{type: smd.Token.Table_Cell, children: [" b "]},
		]
	}]
}, {
	type:     smd.Token.Paragraph,
	children: ["Hello"],
}])

test_single_write("Table after table",
`| A | B |
| - | - |
| a | b |

| C | D |
| - | - |
| c | d |`,
[{
	type    : smd.Token.Table,
	children: [{
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" A "]},
			{type: smd.Token.Table_Cell, children: [" B "]},
		]
	}, {
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" a "]},
			{type: smd.Token.Table_Cell, children: [" b "]},
		]
	}]
}, {
	type    : smd.Token.Table,
	children: [{
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" C "]},
			{type: smd.Token.Table_Cell, children: [" D "]},
		]
	}, {
		type:     smd.Token.Table_Row,
		children: [
			{type: smd.Token.Table_Cell, children: [" c "]},
			{type: smd.Token.Table_Cell, children: [" d "]},
		]
	}]
}])

test_single_write("Table with nested elements",
`| *Aa* | B<br>b |
| -- | -- |
| \`aA\` | bB |`,
[{
	type    : smd.Token.Table,
	children: [{
		type:     smd.Token.Table_Row,
		children: [{
			type:     smd.Token.Table_Cell,
			children: [
				" ",
				{type: smd.Token.Italic_Ast, children: ["Aa"]},
				" ",
			]
		}, {
			type:     smd.Token.Table_Cell,
			children: [" B", BR, "b "],
		}],
	}, {
		type:     smd.Token.Table_Row,
		children: [{
			type: smd.Token.Table_Cell,
			children: [
				" ",
				{type: smd.Token.Code_Inline, children: ["aA"]},
				" ",
			]
		}, {
			type: smd.Token.Table_Cell,
			children: [" bB "],
		}],
	}],
}])

test_single_write("Inline Equation $",
		"$equation$",
		[{
			type    : smd.Token.Paragraph,
			children: [{
				type    : smd.Token.Equation_Inline,
				children: ["equation"],
			}]
		}]
)

test_single_write("Inline Equation ()",
	"\\(equation\\)",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Inline,
			children: ["equation"],
		}]
	}]
)

test_single_write("Inline Equation $ prevented by spaces",
	"$ equation $",
	[{
		type    : smd.Token.Paragraph,
		children: ["$ equation $"]
	}]
)

test_single_write("Inline Equation () with spaces",
	"\\( equation \\)",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Inline,
			children: [" equation "],
		}]
	}]
)

test_single_write("Block Equation $$",
	"$$\nequation\n$$",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Block,
			children: ["\nequation\n"],
		}]
	}]
)

test_single_write("Block Equation []",
	"\\[\nequation\n\\]",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Block,
			children: ["\nequation\n"],
		}]
	}]
)

test_single_write("Equation in text",
	"some text $equation$ more text",
	[{
		type: smd.Token.Paragraph,
		children: [
			"some text ",
			{
				type: smd.Token.Equation_Inline,
				children: ["equation"],
			},
			" more text"
		]
	}]
)

test_single_write("Inline Equation $",
	"$equation$",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Inline,
			children: ["equation"],
		}]
	}]
)

// TODO: How to allow equations starting with a number?
// test_single_write("Inline Equation $ number",
// 	"$123$",
// 	[{
// 		type: smd.Token.Paragraph,
// 		children: [{
// 			type: smd.Token.Equation_Inline,
// 			children: ["123"],
// 		}]
// 	}]
// )

test_single_write("Inline Equation ()",
	"\\(equation\\)",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Inline,
			children: ["equation"],
		}]
	}]
)

test_single_write("Inline Equation () no escape",
	"(equation)",
	[{
		type: smd.Token.Paragraph,
		children: ["(equation)"],
	}]
)

test_single_write("Block Equation $$",
	"$$\nequation\n$$",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Block,
			children: ["\nequation\n"]
		}]
	}]
)

test_single_write("Block Equation []",
	"\\[\nequation\n\\]",
	[{
		type: smd.Token.Paragraph,
		children: [{
			type: smd.Token.Equation_Block,
			children: ["\nequation\n"],
		}]
	}]
)

test_single_write("Equation in text",
	"some text $equation$ more text",
	[{
		type: smd.Token.Paragraph,
		children: [
			"some text ",
			{
				type: smd.Token.Equation_Inline,
				children: ["equation"],
			},
			" more text"
		]
	}]
)

test_single_write("Equation in text ()",
	"some text \\(equation\\) more text",
	[{
		type: smd.Token.Paragraph,
		children: [
			"some text ",
			{
				type: smd.Token.Equation_Inline,
				children: ["equation"],
			},
			" more text"
		]
	}]
)

test_single_write("Equation in text $ no closing",
	"some text $equation more text",
	[{
		type: smd.Token.Paragraph,
		children: [
			"some text ",
			{
				type: smd.Token.Equation_Inline,
				children: ["equation more text"],
			}
		]
	}]
)

test_single_write("Dollar sign followed by digit is not equation",
    "$123 is not an equation",
    [{
        type: smd.Token.Paragraph,
        children: ["$123 is not an equation"]
    }]
)

test_single_write("Dollar sign followed by comma is not equation",
    "$,000 is not an equation",
    [{
        type: smd.Token.Paragraph,
        children: ["$,000 is not an equation"]
    }]
)

test_single_write("Dollar sign followed by period is not equation",
    "$.99 is not an equation",
    [{
        type: smd.Token.Paragraph,
        children: ["$.99 is not an equation"]
    }]
)

test_single_write("Multiple currency values in text",
    "The items cost $10, $20, and $30 respectively.",
    [{
        type: smd.Token.Paragraph,
        children: ["The items cost $10, $20, and $30 respectively."]
    }]
)

test_single_write("Mixed currency and equation usage",
    "Price: $50 where $x^2$ is the formula",
    [{
        type: smd.Token.Paragraph,
        children: [
            "Price: $50 where ",
            {
                type: smd.Token.Equation_Inline,
                children: ["x^2"]
            },
            " is the formula"
        ]
    }]
)

test_single_write("Currency at end of line",
    "Total cost: $99\nNext line",
    [{
        type: smd.Token.Paragraph,
        children: ["Total cost: $99", BR, "Next line"]
    }]
)

test_single_write("Dollar sign followed by various delimiters",
    "$: a, $; b, $) c, $? d, $] e",
    [{
        type: smd.Token.Paragraph,
        children: ["$: a, $; b, $) c, $? d, $] e"]
    }]
)

test_single_write("Valid equation after text without space",
    "Value$x=y$formula",
    [{
        type: smd.Token.Paragraph,
        children: [
            "Value",
            {
                type: smd.Token.Equation_Inline,
                children: ["x=y"]
            },
            "formula"
        ]
    }]
)

test_single_write("Escaped dollar sign",
    "\\$foo$",
    [{
        type: smd.Token.Paragraph,
        children: ["$foo$"]
    }]
)
