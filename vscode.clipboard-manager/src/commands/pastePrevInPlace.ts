import * as vscode from 'vscode';
import { decrementClipboardIndex } from '../clipboardState';

export class PastePrevInPlaceCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

    constructor(private readonly manager: any) { }

    public register(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('clipboard-manager-with-cycling.editor.pastePrevInPlace', () => {
                const clipboardItems = this.manager.items ?? [];
                if (clipboardItems.length === 0) {
                    vscode.window.showInformationMessage('Clipboard history is empty');
                    return;
                }
                const index = decrementClipboardIndex(clipboardItems.length);
                const text = clipboardItems[index];
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    editor.edit(edit => {
                        edit.delete(editor.selection);
                        edit.insert(editor.selection.start, text);
                    });
                }
            })
        );
    }
    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}