import * as vscode from 'vscode';

export class TldrEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new TldrEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(TldrEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'tldraw.editor';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Called when our custom editor is opened.
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {

		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, 'dist-app'),
                vscode.Uri.joinPath(this.context.extensionUri, 'public')
			]
		};

		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage((e: any) => {
			switch (e.type) {
				case 'ready':
					updateWebview();
					return;
				case 'edit':
					this.updateTextDocument(document, e.text);
					return;
			}
		});
	}

	/**
	 * Get the static html used for the editor webview.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		const distPath = vscode.Uri.joinPath(this.context.extensionUri, 'dist-app');
		
		// The Vite build should have an index.html we can use as a template
        // However, webviews need relative URI mapping
        // We'll read the index.html and replace src links with webview-friendly URIs

        try {
            // Ideally should read from dist/index.html after building
            // For now, I'll generate a simple one that loads the main script
            
            // Note: In production, Vite produces [hash].js, we'd need to find it.
            // For development or "simple build", we can use a fixed path or find it from manifest.json
            
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>tldraw Editor</title>
    <style>
        html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; background: white; }
        #root { height: 100%; }
    </style>
    <link rel="stylesheet" href="${webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'assets/index.css'))}">
</head>
<body>
    <div id="root"></div>
    <script>
        const vscode = acquireVsCodeApi();
        window.vscode = vscode;
        window.__PUBLIC_PATH__ = "${webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'public'))}";
    </script>
    <script type="module" src="${webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'assets/index.js'))}"></script>
</body>
</html>`;
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
	}

	/**
	 * Write out the json string to a document.
	 */
	private updateTextDocument(document: vscode.TextDocument, json: string) {
		const edit = new vscode.WorkspaceEdit();

		// Replace the entire document content with our new text.
		const fullRange = new vscode.Range(
			document.positionAt(0),
			document.positionAt(document.getText().length)
		);

		edit.replace(document.uri, fullRange, json);

		return vscode.workspace.applyEdit(edit);
	}
}
