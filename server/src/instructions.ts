import { type CompletionItem, MarkupKind, CompletionItemKind } from 'vscode-languageserver';
/**
 * Removes all preceding spaces and tabs in an indented multiline string.
 */
const dedent = (text: TemplateStringsArray) =>
	text.map(t => t.replace(/^[\t\s]*/gm, '')).toString();

const comment = (text: TemplateStringsArray) =>
	text.map(t => `<i>t</i>`).toString();

export const instructions = (): CompletionItem[] => [
	{
		label: "EQU",
		labelDetails: {
			detail: ` {string} {int|float|register}`
		},
		detail: 'Equate a value to a label reference',
		documentation: dedent`
			@Example
			\`\`\`
			;equate the label krt to the value of 0.86
			equ krt 0.86
			;equate the label sgn to the value of -1
			equ sgn -1
			;equate the label a to represent register 0
			equ a reg0
			\`\`\``,
		kind: CompletionItemKind.Function
	},
	{
		label: "MEM",
		documentation: {
			kind: MarkupKind.Markdown,
			value: [
				'Define the length of delay memory elements and associate an address label.',
				'- when writing to a delay, do so to the address label',
				'- when reading the end of the delay, do so to the address label terminated with a #, as in del1#',
				'- when reading the midpoint of a delay, do so to the address label terminated with a $, as in del1$',
				'',
				'Usage:',
				'```spn',
				comment`;assign 1000 delay memory locations to the label del1`,
				'<span style="color: red">mem</span> del1 1000',
				'```'
			].join('\n')
			},
		kind: CompletionItemKind.Keyword
	},
	{
		label: "RDA",
		documentation: "Read delay memory times coefficient and add to accumulator.",
		detail: "Usage: rda memaddress,coefficient",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "RMPA",
		documentation: "Read delay memory from addr_ptr location, multiply by coefficient and add to accumulator",
		detail: "Usage: rmpa coefficient",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "WRA",
		documentation: "Write ACC to delay memory location and multiply ACC by coefficient",
		detail: "Usage: wra memaddrs,coefficient",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "WRAP",
		documentation: "Write delay memory, multiply written value by the coefficient, add to LR register and load ACC with result.",
		detail: "Usage: wrap memaddrs,coefficient",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "RDAX",
		documentation: "Read register value, multiply by coefficient and add to ACC.",
		detail: "Usage: rdax reg0,0.2",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "RDFX",
		documentation: "Subtract register contents from ACC, multiply by coefficient, add register contents and load to ACC.",
		detail: "Usage: rdfx reg0,0.23",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "WRAX",
		documentation: "Write ACC to register, multiply ACC by coefficient",
		detail: "Usage: wrax reg1,0",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "WRHX",
		documentation: "Write ACC to register, multiply ACC by coefficient, add PACC and load result to ACC",
		detail: "Usage: wrhx reg2,-0.5",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "WRLX",
		documentation: "Write ACC to the register, subtract ACC from PACC, multiply result by the coefficient, then add PACC and load result to ACC.",
		detail: "Usage: wrlx reg6,kshlf",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "MAXX",
		documentation: "Load the maximum of the absolute value of the register times the coefficient or the absolute value of ACC to ACC.",
		detail: "Usage: maxx reg2,0.5",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "ABSA",
		documentation: "Changes the ACC contents to absolute value of ACC",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "MULX",
		documentation: "Load the accumulator with the product of ACC and a register.",
		detail: "Usage: mulx reg0",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "LOG",
		documentation: "Take the LOG base 2 of the absolute value of the accumulator, divide result by 16, multiply the result by the coefficient, add a constant and load to ACC.",
		detail: "Usage: log 1.5,-0.3",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "EXP",
		documentation: "Raise 2 to the power of the accumulator*16, multiply by coefficient and add to a constant, loading the result to ACC.",
		detail: "Usage: exp 0.8,0",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "SOF",
		documentation: "Multiply ACC by the coefficient value and add a constant (Scale and Offset)",
		detail: "Usage: SOF 1.5,-0.3",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "AND",
		documentation: "And ACC with immediate mask",
		detail: "Usage: and %011111000000000000000000",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "OR",
		documentation: "Or ACC with immediate mask",
		detail: "Usage: or %011111000000000000000000",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "XOR",
		documentation: "Xor ACC with immediate mask",
		detail: "Usage: xor %011111000000000000000000",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "SKP",
		documentation: "Skip N instructions based on condition",
		detail: "Usage: skp zro,2 ;skip ahead 2 instructions if accumulator is zero.",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "WLDS",
		documentation: "Load SIN/COS generator with initial conditions",
		detail: "Usage: wlds sin0,freq,amp ;load the SIN/COS0 generator with freq and amp variables",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "WLDR",
		documentation: "Load RAMP generator with initial conditions",
		detail: "Usage: wldr rmp0,freq,amp ;load the RAMP0 generator with freq and amp variables",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "JAM",
		documentation: "When executed, will force a selected RAMP generator to it's starting condition",
		detail: "Usage: jam 0",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "CHO",
		documentation: "General operation for reading delay memory from an LFO output as both a memory pointer and an interpolation coefficient.",
		detail: "Usage: cho rda,sin0, SIN | REG ,del1+100 ;read del1+100+(sine of SIN/COS0 value) also, register LFO values.",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "NOP",
		documentation: "No operation",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "NOT",
		documentation: "Change sign of ACC value",
		kind: CompletionItemKind.Keyword
	},
	{
		label: "CLR",
		documentation: "Clear ACC",
		kind: CompletionItemKind.Keyword
	}
];