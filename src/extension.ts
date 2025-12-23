import * as vscode from 'vscode';

class TabCleaner {
  constructor(
    private readonly window: typeof vscode.window,
    private readonly workspace: typeof vscode.workspace
  ) {}

  async clean(): Promise<void> {
    const keepPinnedTabs = this.workspace
      .getConfiguration('onlyTheDirty')
      .get<boolean>('keepPinnedTabs', false);

    const cleanTabs = this.window.tabGroups.all
      .flatMap(group => group.tabs)
      .filter(tab => !tab.isDirty)
      .filter(tab => !(keepPinnedTabs && tab.isPinned));

    if (cleanTabs.length === 0) {
      return;
    }

    await this.window.tabGroups.close(cleanTabs);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const cleaner = new TabCleaner(vscode.window, vscode.workspace);

  context.subscriptions.push(
    vscode.commands.registerCommand('onlyTheDirty.closeNonDirtyTabs', () => cleaner.clean())
  );
}

export function deactivate() {}
