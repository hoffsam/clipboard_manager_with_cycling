"use strict";
import * as vscode from "vscode";
import { defaultClipboard } from "./clipboard";
import { ApiGetMonitor } from "./commands/apiGetMonitor";
import { ClearClipboardHistory } from "./commands/clearClipboardHistory";
import { HistoryTreeDoubleClickCommand } from "./commands/historyTreeDoubleClick";
import { PickAndPasteCommand } from "./commands/pickAndPaste";
import { RemoveClipboardHistory } from "./commands/removeClipboardHistory";
import { SetClipboardValueCommand } from "./commands/setClipboardValue";
import { ShowClipboardInFile } from "./commands/showClipboardInFile";
import { ClipboardCompletion } from "./completion";
import { ClipboardManager } from "./manager";
import { Monitor } from "./monitor";
import { ClipboardTreeDataProvider } from "./tree/history";
import { CopyToHistoryCommand } from "./commands/copyToHistory";
import { PasteNextInPlaceCommand } from './commands/pasteNextInPlace';
import { PastePrevInPlaceCommand } from './commands/pastePrevInPlace';
import { AcceptCyclingSelectionCommand } from './commands/acceptCyclingSelection';
import { sharedCyclingState, initializeCyclingState } from './cyclingState';


let manager: ClipboardManager;

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  const disposable: vscode.Disposable[] = [];

  // Initialize monitor immediately, test clipboard access in background
  let monitor: Monitor;

  try {
    disposable.push(defaultClipboard);
    monitor = new Monitor(defaultClipboard);
    disposable.push(monitor);

    // Test clipboard access in background to avoid blocking activation
    setTimeout(async () => {
      try {
        await defaultClipboard.readText();
      } catch (error: any) {
        console.warn("Clipboard read failed:", error);
        vscode.window.showWarningMessage("Clipboard access failed: clipboard monitoring may be limited.");
      }
    }, 0);
  } catch (error: any) {
    console.warn("Clipboard initialization failed:", error);
    monitor = new Monitor(null as any); // placeholder that won't do anything
  }


  manager = new ClipboardManager(context, monitor);
  disposable.push(manager);

  // Initialize cycling state with the manager
  initializeCyclingState(manager);

  // API Commands
  disposable.push(new ApiGetMonitor(monitor));

  // Commands
  disposable.push(new PickAndPasteCommand(manager));
  disposable.push(new HistoryTreeDoubleClickCommand(manager));
  disposable.push(new SetClipboardValueCommand(manager));
  disposable.push(new RemoveClipboardHistory(manager));
  disposable.push(new ShowClipboardInFile(manager));
  disposable.push(new ClearClipboardHistory(manager));
  disposable.push(new CopyToHistoryCommand(monitor));
  disposable.push(new PasteNextInPlaceCommand(manager));
  disposable.push(new PastePrevInPlaceCommand(manager));
  disposable.push(new AcceptCyclingSelectionCommand());

  const completion = new ClipboardCompletion(manager);
  // disposable.push(completion);

  // All files types
  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      {
        scheme: "file",
      },
      completion
    )
  );

  // All files types (New file)
  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      {
        scheme: "untitled",
      },
      completion
    )
  );

  const clipboardTreeDataProvider = new ClipboardTreeDataProvider(manager);
  disposable.push(clipboardTreeDataProvider);

  disposable.push(
    vscode.window.registerTreeDataProvider(
      "clipboard-manager-with-cycling.clipboardHistory",
      clipboardTreeDataProvider
    )
  );

  const updateConfig = () => {
    const config = vscode.workspace.getConfiguration("clipboard-manager-with-cycling");
    monitor.checkInterval = config.get("checkInterval", 500);
    monitor.onlyWindowFocused = config.get("onlyWindowFocused", true);
    monitor.maxClipboardSize = config.get("maxClipboardSize", 1000000);
  };
  updateConfig();

  disposable.push(
    vscode.workspace.onDidChangeConfiguration(
      e => e.affectsConfiguration("clipboard-manager-with-cycling") && updateConfig()
    )
  );

  // Register shared cycling state for proper disposal
  disposable.push(sharedCyclingState);

  context.subscriptions.push(...disposable);

  return {
    completion,
    manager,
  };
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (manager) {
    manager.saveClips().catch(error => {
      console.error('Failed to save clips on deactivation:', error);
    });
  }
}
