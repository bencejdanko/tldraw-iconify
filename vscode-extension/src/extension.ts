import * as vscode from 'vscode';
import { TldrEditorProvider } from './TldrEditorProvider';
import { TldrPasteProvider } from './TldrPasteProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('"tldraw-vscode" is now active');

	context.subscriptions.push(TldrEditorProvider.register(context));

	context.subscriptions.push(
		vscode.languages.registerDocumentPasteEditProvider(
			{ language: 'markdown' },
			new TldrPasteProvider(),
			{ 
				pasteMimeTypes: ['text/plain'],
				providedPasteEditKinds: [TldrPasteProvider.kind]
			}
		)
	);
}

export function deactivate() {}
