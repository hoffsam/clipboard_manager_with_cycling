import * as vscode from "vscode";
import { commandList } from "../commands/common";
import { ClipboardManager, IClipboardItem } from "../manager";
import { leftPad } from "../util";

export class ClipHistoryItem extends vscode.TreeItem {
  constructor(readonly clip: IClipboardItem) {
    super(clip.value);

    this.contextValue = "clipHistoryItem:";
    this.label = this.clip.value.replace(/\s+/g, " ").trim();
    this.tooltip = this.clip.value;

    this.command = {
      command: commandList.historyTreeDoubleClick,
      title: "Paste",
      tooltip: "Paste",
      arguments: [this.clip],
    };

    // Set up tooltip and context based on source location
    if (this.clip.createdLocation) {
      // Don't set resourceUri to prevent validation errors from showing
      // this.resourceUri = this.clip.createdLocation.uri;
      this.contextValue += "file";

      this.tooltip = `File: ${this.clip.createdLocation.uri.fsPath}\nValue: ${this.tooltip}\n`;
    }

    // Always use custom icons to avoid file validation indicators
    this.iconPath = this.getIconForLanguage(this.clip.language);
  }

  private getIconForLanguage(language?: string): vscode.ThemeIcon | { light: string; dark: string } {
    // Use VS Code's built-in theme icons based on language
    if (language) {
      switch (language.toLowerCase()) {
        case 'typescript':
        case 'typescriptreact':
          return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('symbolIcon.classForeground'));
        case 'javascript':
        case 'javascriptreact':
          return new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('symbolIcon.functionForeground'));
        case 'python':
          return new vscode.ThemeIcon('symbol-module', new vscode.ThemeColor('symbolIcon.moduleForeground'));
        case 'json':
          return new vscode.ThemeIcon('symbol-object', new vscode.ThemeColor('symbolIcon.objectForeground'));
        case 'html':
        case 'xml':
          return new vscode.ThemeIcon('symbol-tag', new vscode.ThemeColor('symbolIcon.tagForeground'));
        case 'css':
        case 'scss':
        case 'less':
          return new vscode.ThemeIcon('symbol-color', new vscode.ThemeColor('symbolIcon.colorForeground'));
        case 'markdown':
          return new vscode.ThemeIcon('book');
        case 'sql':
          return new vscode.ThemeIcon('database');
        case 'yaml':
        case 'yml':
          return new vscode.ThemeIcon('symbol-key', new vscode.ThemeColor('symbolIcon.keyForeground'));
        default:
          // For other languages, use a generic file icon
          return new vscode.ThemeIcon('symbol-text', new vscode.ThemeColor('symbolIcon.textForeground'));
      }
    }

    
    // Fallback to custom string icon for items without language
    // const basePath = path.join(__filename, "..", "..", "..", "resources");
    // return {
    //   light: path.join(basePath, "light", "string.svg"),
    //   dark: path.join(basePath, "dark", "string.svg"),
    // };
    return new vscode.ThemeIcon('symbol-text', new vscode.ThemeColor('symbolIcon.textForeground'));
  }
}

export class ClipboardTreeDataProvider
  implements vscode.TreeDataProvider<ClipHistoryItem>, vscode.Disposable
{
  private _disposables: vscode.Disposable[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<ClipHistoryItem | null> =
    new vscode.EventEmitter<ClipHistoryItem | null>();
  public readonly onDidChangeTreeData: vscode.Event<ClipHistoryItem | null> =
    this._onDidChangeTreeData.event;

  constructor(protected _manager: ClipboardManager) {
    this._manager.onDidChangeClipList(() => {
      this._onDidChangeTreeData.fire(null);
    });
  }

  public getTreeItem(
    element: ClipHistoryItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }


  
  public getChildren(
    _element?: ClipHistoryItem | undefined
  ): vscode.ProviderResult<ClipHistoryItem[]> {
    const clips = this._manager.clips;

    const maxLength = `${clips.length}`.length;

    const childs = clips.map((c, index) => {
      const item = new ClipHistoryItem(c);
      const indexNumber = leftPad(index + 1, maxLength, "0");

      item.label = `${indexNumber}) ${item.label}`;

      return item;
    });

    return childs;
  }

  public dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}
