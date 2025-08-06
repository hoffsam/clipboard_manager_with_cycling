import * as vscode from 'vscode';
import { commandList } from './common';
import { sharedCyclingState } from '../cyclingState';

export class AcceptCyclingSelectionCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];
    
    constructor() {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.acceptCyclingSelection,
                this.execute,
                this
            )
        );
    }

    protected execute() {
        sharedCyclingState.acceptCurrentSelection();
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}