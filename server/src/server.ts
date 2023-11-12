/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface FV1LanguageServerSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: FV1LanguageServerSettings = { maxNumberOfProblems: 1000 };
let globalSettings: FV1LanguageServerSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<FV1LanguageServerSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <FV1LanguageServerSettings>(
			(change.settings.fv1LanguageServer || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<FV1LanguageServerSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'fv1LanguageServer'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;

	let m: RegExpExecArray | null;
	let problems = 0;

	const diagnostics: Diagnostic[] = [];

	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;

		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};

		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}

		diagnostics.push(diagnostic);
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: "EQU",
				documentation: "Equate a value to a label reference",
				detail: `Usage:
					equ krt 0.86 ;equate the label krt to the value of 0.86
					equ	sgn	-1	;equate the label sgn to the value of -1
					equ	a	reg0	;equate the label a to represent register 0`,
				kind: CompletionItemKind.Keyword
			},
			{
				label: "MEM",
				documentation: "Define the length of delay memory elements and associate an address label.",
				detail: "Usage: mem del1 1000 ;assign 1000 delay memory locations to the label del1",
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
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
