import * as vscode from 'vscode';
import { incrementClipboardIndex } from '../clipboardState';
import { ClipboardManager } from '../manager';
import { commandList } from './common';

export class PasteNextInPlaceCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];
    private lastInsertRange: vscode.Range | null = null;

    constructor(private readonly manager: ClipboardManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.pasteNextInPlace,
                this.execute,
                this
            )
        );
    }

    protected execute() {
        const clips = this.manager.clips ?? [];
        if (clips.length === 0) {
            vscode.window.showInformationMessage('Clipboard history is empty');
            return;
        }

        const index = incrementClipboardIndex(clips.length);
        const text = clips[index].value;
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = this.lastInsertRange ?? editor.selection;
        const insertPos = selection.start;

        editor.edit(editBuilder => {
            editBuilder.delete(selection);
            editBuilder.insert(insertPos, text);
        }).then(success => {
            if (!success) return;

            const newEnd = insertPos.translate(0, text.length);
            this.lastInsertRange = new vscode.Range(insertPos, newEnd);
            editor.selection = new vscode.Selection(insertPos, newEnd);
        });
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
