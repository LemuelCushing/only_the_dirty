import * as vscode from 'vscode';

class TabCleaner {
  constructor(private readonly window: typeof vscode.window) {}

  clean(): void {
    this.window.tabGroups.all
      .flatMap(group => group.tabs)
      .filter(tab => !tab.isDirty)
      .forEach(tab => this.window.tabGroups.close(tab));
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const cleaner = new TabCleaner(vscode.window);

  context.subscriptions.push(
    vscode.commands.registerCommand('onlyTheDirty.closeNonDirtyTabs', () => cleaner.clean())
  );
}

export function deactivate() {}
