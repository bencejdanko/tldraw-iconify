import * as vscode from 'vscode';
import { TldrEditorProvider } from './TldrEditorProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('"tldraw-vscode" is now active');

	context.subscriptions.push(TldrEditorProvider.register(context));
}

export function deactivate() {}
