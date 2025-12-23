import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

suite('TabCleaner Test Suite', () => {
  const extensionId = 'LemuelCushing.only-the-dirty';
  const commandId = 'onlyTheDirty.closeNonDirtyTabs';

  async function activateExtension(): Promise<void> {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, `Extension ${extensionId} not found`);

    if (!extension.isActive) {
      await extension.activate();
    }
  }

  // Helper to create a clean file on disk
  async function createCleanFile(name: string, content: string = ''): Promise<vscode.TextDocument> {
    const fileUri = vscode.Uri.file(path.join(os.tmpdir(), `test-${name}-${Date.now()}.txt`));
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content));
    const doc = await vscode.workspace.openTextDocument(fileUri);
    return doc;
  }

  function allOpenTabs(): readonly vscode.Tab[] {
    return vscode.window.tabGroups.all.flatMap(group => group.tabs);
  }

  async function closeAllEditors(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  }

  async function setKeepPinnedTabs(value?: boolean): Promise<void> {
    await vscode.workspace
      .getConfiguration('onlyTheDirty')
      .update('keepPinnedTabs', value, vscode.ConfigurationTarget.Global);
  }

  async function setEnablePreview(value?: boolean): Promise<void> {
    await vscode.workspace
      .getConfiguration('workbench.editor')
      .update('enablePreview', value, vscode.ConfigurationTarget.Global);
  }

  suiteSetup(async () => {
    await activateExtension();
  });

  teardown(async () => {
    await setEnablePreview();
    await setKeepPinnedTabs();
    await closeAllEditors();
    await vscode.commands.executeCommand('workbench.action.editorLayoutSingle');
  });

  test('command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes(commandId));
  });

  test('does nothing with no open editors', async () => {
    await closeAllEditors();
    await vscode.commands.executeCommand(commandId);
    assert.strictEqual(allOpenTabs().length, 0);
  });

  test('closes non-dirty editors, leaves dirty ones', async () => {
    await closeAllEditors();

    // Create a clean document (file on disk)
    const doc1 = await createCleanFile('clean', 'clean content');
    await vscode.window.showTextDocument(doc1, { preview: false });

    // Create a dirty document (untitled with content)
    const doc2 = await vscode.workspace.openTextDocument({ content: 'dirty content' });
    await vscode.window.showTextDocument(doc2, { preview: false });
    // It's already dirty because it's untitled with content.

    assert.ok(!doc1.isDirty, 'doc1 should be clean');
    assert.ok(doc2.isDirty, 'doc2 should be dirty');

    await vscode.commands.executeCommand(commandId);

    const visibleEditors = vscode.window.visibleTextEditors;
    // doc2 should remain. doc1 should close.
    assert.strictEqual(visibleEditors.length, 1, 'Should have 1 editor left');
    assert.strictEqual(visibleEditors[0].document.uri.toString(), doc2.uri.toString());
  });

  test('closes all when all are non-dirty', async () => {
    await closeAllEditors();

    const doc1 = await createCleanFile('one', 'one');
    await vscode.window.showTextDocument(doc1, { preview: false });

    const doc2 = await createCleanFile('two', 'two');
    await vscode.window.showTextDocument(doc2, { preview: false });

    assert.ok(!doc1.isDirty);
    assert.ok(!doc2.isDirty);

    await vscode.commands.executeCommand(commandId);
    assert.strictEqual(allOpenTabs().length, 0);
  });

  test('leaves all when all are dirty', async () => {
    await closeAllEditors();

    // Dirty 1
    const doc1 = await vscode.workspace.openTextDocument({ content: 'dirty1' });
    await vscode.window.showTextDocument(doc1, { preview: false });

    // Dirty 2
    const doc2 = await vscode.workspace.openTextDocument({ content: 'dirty2' });
    await vscode.window.showTextDocument(doc2, { preview: false });

    assert.ok(doc1.isDirty);
    assert.ok(doc2.isDirty);

    await vscode.commands.executeCommand(commandId);

    // Check tabs instead of visible editors (which are limited by split view)
    assert.strictEqual(allOpenTabs().length, 2);
  });

  test('handles multiple tab groups', async () => {
    await closeAllEditors();

    // Clean doc in group 1
    const doc1 = await createCleanFile('group1-clean', 'clean');
    await vscode.window.showTextDocument(doc1, { preview: false });

    // New group
    await vscode.commands.executeCommand('workbench.action.editorLayoutTwoColumns');

    // Dirty doc in group 2
    const doc2 = await vscode.workspace.openTextDocument({ content: 'group2-dirty' });
    await vscode.window.showTextDocument(doc2, { viewColumn: vscode.ViewColumn.Beside });

    assert.ok(!doc1.isDirty);
    assert.ok(doc2.isDirty);

    await vscode.commands.executeCommand(commandId);

    const visibleEditors = vscode.window.visibleTextEditors;
    // Should have 1 editor (the dirty one)
    assert.strictEqual(visibleEditors.length, 1);
    assert.strictEqual(visibleEditors[0].document.uri.toString(), doc2.uri.toString());
  });

  test('keeps pinned clean tabs when configured', async () => {
    await closeAllEditors();
    await setKeepPinnedTabs(true);
    await setEnablePreview(true);

    const doc1 = await createCleanFile('pinned', 'pinned');
    await vscode.window.showTextDocument(doc1, { preview: false });

    const doc2 = await createCleanFile('unpinned', 'unpinned');
    await vscode.window.showTextDocument(doc2, { preview: true });

    const tabsBefore = allOpenTabs();
    assert.strictEqual(tabsBefore.length, 2);
    assert.ok(tabsBefore.some(tab => tab.isPinned), 'Expected a pinned tab before cleaning');

    await vscode.commands.executeCommand(commandId);

    const tabsAfter = allOpenTabs();
    assert.strictEqual(tabsAfter.length, 1);
    assert.ok(tabsAfter[0].isPinned, 'Expected the remaining tab to be pinned');
    assert.strictEqual(
      vscode.window.visibleTextEditors[0].document.uri.toString(),
      doc1.uri.toString()
    );
  });
});
