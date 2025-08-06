import * as vscode from 'vscode';
import { resetClipboardIndex } from './clipboardState';
import { ClipboardManager } from './manager';

export class CyclingState implements vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];
    private _lastInsertRange: vscode.Range | null = null;
    private _lastEditor: vscode.TextEditor | null = null;
    private _commandInProgress = false;
    private _manager: ClipboardManager | null = null;
    private _lastSelectedText: string | null = null;
    private _isCycling = false;
    private _undoGroupActive = false;
    private _safetyTimeout: NodeJS.Timeout | null = null;

    constructor() {
        this._disposables.push(
            vscode.window.onDidChangeTextEditorSelection(this.onSelectionChanged, this)
        );
    }

    private get config() {
        return vscode.workspace.getConfiguration('clipboard-manager-with-cycling');
    }

    private async startUndoGroup(editor: vscode.TextEditor) {
        if (!this.config.get('singleUndoPerCycle', false)) return;

        try {

            await editor.edit(() => { }, {
                undoStopBefore: true,
                undoStopAfter: false
            });
            this._undoGroupActive = true;

            const timeoutMs = this.config.get('singleUndoTimeout', 5000);
            this._safetyTimeout = setTimeout(() => {
                this.finalizeUndoGroup();
                this.reset();
            }, timeoutMs);
        } catch (error) {
            console.error('Failed to start undo group:', error);
        }
    }

    private async finalizeUndoGroup() {
        if (this._safetyTimeout) {
            clearTimeout(this._safetyTimeout);
            this._safetyTimeout = null;
        };
        if (!this._undoGroupActive || !this._lastEditor) return;

        try {
            await this._lastEditor.edit(() => { }, {
                undoStopBefore: false,
                undoStopAfter: true
            });
        } catch (error) {
            console.error('Failed to finalize undo group:', error);
        } finally {
            this._undoGroupActive = false;
        }
    }

    private onSelectionChanged(event: vscode.TextEditorSelectionChangeEvent) {
        if (this._commandInProgress) {
            return;
        }

        const editor = event.textEditor;
        const selection = event.selections[0];

        if (!this._lastInsertRange || !this._lastEditor || editor !== this._lastEditor) {
            this.reset();
            return;
        }

        if (!selection || !this._lastInsertRange.contains(selection) ||
            (!selection.isEmpty && !selection.isEqual(new vscode.Selection(this._lastInsertRange.start, this._lastInsertRange.end)))) {
            this.reset();
        }
    }

    private setContext(isCycling: boolean) {
        vscode.commands.executeCommand('setContext', 'clipboard-manager-cycling.isCycling', isCycling);
    }

    public reset() {
        if (this._manager && this._lastSelectedText) {
            this._manager.updateClipUsage(this._lastSelectedText);
        }

        this._isCycling = false;
        this.setContext(false);
        resetClipboardIndex();
        this._lastInsertRange = null;
        this._lastEditor = null;
        this._lastSelectedText = null;
        this.finalizeUndoGroup().catch(() => { });
    }

    public setManager(manager: ClipboardManager) {
        this._manager = manager;
    }

    public acceptCurrentSelection() {
        if (!this._isCycling || !this._lastEditor || !this._lastInsertRange) {
            return;
        }

        const endPosition = this._lastInsertRange.end;
        this._lastEditor.selection = new vscode.Selection(endPosition, endPosition);

        this.finalizeUndoGroup().finally(() => {
            this.reset();
        });
    }

    public get isCycling(): boolean {
        return this._isCycling;
    }

    public executePaste(
        editor: vscode.TextEditor,
        text: string,
        onSuccess?: (range: vscode.Range) => void
    ) {
        this._lastSelectedText = text;
        this._isCycling = true;
        this.setContext(true);
        this._commandInProgress = true;

        const singleUndoEnabled = this.config.get('singleUndoPerCycle', false);

        if (singleUndoEnabled && !this._undoGroupActive) {
            this.startUndoGroup(editor);
        }

        const selection = this._lastInsertRange ?
            new vscode.Selection(this._lastInsertRange.start, this._lastInsertRange.end) :
            editor.selection;

        const insertPos = selection.start;

        editor.edit(editBuilder => {
            editBuilder.delete(selection);
            editBuilder.insert(insertPos, text);
        }, {
            undoStopBefore: !singleUndoEnabled,
            undoStopAfter: !singleUndoEnabled
        }).then(success => {
            this._commandInProgress = false;

            if (!success) return;

            const newEnd = this.calculateEndPosition(insertPos, text);
            this._lastInsertRange = new vscode.Range(insertPos, newEnd);
            this._lastEditor = editor;

            editor.selection = new vscode.Selection(insertPos, newEnd);

            if (onSuccess) {
                onSuccess(this._lastInsertRange);
            }
        });
    }

    private calculateEndPosition(start: vscode.Position, text: string): vscode.Position {
        const lines = text.split(/\r?\n/);
        if (lines.length === 1) {
            return start.translate(0, text.length);
        } else {
            const lastLineLength = lines[lines.length - 1].length;
            return new vscode.Position(start.line + lines.length - 1, lastLineLength);
        }
    }

    public get lastInsertRange(): vscode.Range | null {
        return this._lastInsertRange;
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}

export const sharedCyclingState = new CyclingState();

export function initializeCyclingState(manager: ClipboardManager) {
    sharedCyclingState.setManager(manager);
}