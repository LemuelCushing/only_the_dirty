# Only the Dirty (Know What Them Tabs Feel Like Tonight)

  _Rid yourself of all clean tabs in one fell swoop_

Closes all non-dirty editor tabs, leaving only unsaved changes open

![Only The Dirty Logo](https://github.com/LemuelCushing/only_the_dirty/raw/main/docs/logo.png)

## Usage

Run "Close All Non-Dirty Tabs" from the Command Palette (`Cmd/Ctrl + Shift + P`).

## Settings

- `onlyTheDirty.keepPinnedTabs` (default: false): Keep pinned (non-preview) tabs open when closing non-dirty tabs.

## What "dirty" means

In VS Code, a tab is "dirty" when you have unsaved changes to the file. Dirty tabs display a dot or indicator next to their name in the tab list. This command closes all tabs without unsaved changes, preserving your work-in-progress files.
