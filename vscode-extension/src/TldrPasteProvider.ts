import * as vscode from 'vscode';
import * as path from 'path';

export class TldrPasteProvider implements vscode.DocumentPasteEditProvider {
    static readonly kind = vscode.CodeActionKind.Empty.append('tldraw.paste');

    async provideDocumentPasteEdits(
        document: vscode.TextDocument,
        _ranges: readonly vscode.Range[],
        dataTransfer: vscode.DataTransfer,
        _context: vscode.DocumentPasteEditContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.DocumentPasteEdit[] | undefined> {
        if (document.uri.scheme !== 'file') {
            return undefined;
        }

        const textItem = dataTransfer.get('text/plain');
        if (!textItem) {
            return undefined;
        }

        const text = await textItem.asString();
        if (!this.isTldrContent(text)) {
            return undefined;
        }

        // Find a suitable filename
        const folderUri = vscode.Uri.file(path.dirname(document.uri.fsPath));
        let fileName = 'diagram.tldr';
        let counter = 1;

        while (await this.fileExists(vscode.Uri.joinPath(folderUri, fileName))) {
            fileName = `diagram${counter}.tldr`;
            counter++;
        }

        const fileUri = vscode.Uri.joinPath(folderUri, fileName);

        // Create the file
        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(text, 'utf8'));

        // Return the edit
        const edit = new vscode.DocumentPasteEdit(
            `::tldraw{src="./${fileName}"}`,
            'Paste as tldraw diagram',
            TldrPasteProvider.kind
        );

        return [edit];
    }

    private isTldrContent(text: string): boolean {
        try {
            const data = JSON.parse(text);
            // Basic check for tldraw version 3 content
            return (
                (data.document && data.document.store && data.document.schema) ||
                (data.tldrawFileFormatVersion !== undefined)
            );
        } catch {
            return false;
        }
    }

    private async fileExists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }
}
