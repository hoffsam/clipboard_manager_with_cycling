import * as vscode from 'vscode';
import { decrementClipboardIndex } from '../clipboardState';
import { ClipboardManager } from '../manager';
import { commandList } from './common';
import { sharedCyclingState } from '../cyclingState';

export class PastePrevInPlaceCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(private readonly manager: ClipboardManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.pastePrevInPlace,
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

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const index = decrementClipboardIndex(clips.length);
        const text = clips[index].value;
        
        sharedCyclingState.executePaste(editor, text);
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
