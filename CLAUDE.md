# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Compilation
- `npm run compile` - Compile TypeScript to JavaScript (outputs to `out/` directory)
- `npm run watch` - Watch mode compilation for development
- `npm run clean` - Remove compiled output and coverage directories

### Testing
- `npm test` - Run all tests using Mocha
- Tests are located in `src/test/` and compiled to `out/test/`

### Linting and Code Quality
- `npm run lint` - Run ESLint on TypeScript source files
- Uses TypeScript ESLint parser with Prettier integration
- Configuration in `.eslintrc.js`

### VS Code Extension Development
- `npm run vscode:prepublish` - Prepare extension for publishing (clean + compile)
- Extension entry point: `out/extension.js`
- Package as VSIX using `vsce package`

## Architecture Overview

This is a VS Code extension for clipboard management with cycling capabilities. The extension is built using TypeScript and follows a modular command pattern.

### Core Components

**Extension Entry Point (`src/extension.ts`)**
- Activates extension and registers all commands and providers
- Initializes clipboard monitoring and manager instances
- Sets up configuration change listeners

**Clipboard Manager (`src/manager.ts`)**
- Central class managing clipboard history (`IClipboardItem[]`)
- Handles persistence to `clipboard.history.json`
- Manages deduplication, clip limits, and ordering
- Provides events for UI updates

**Monitor (`src/monitor.ts`)**
- Monitors system clipboard for changes using polling
- Detects text changes and captures metadata (language, location)
- Respects window focus settings and size limits
- Fires events when clipboard content changes

**Commands (`src/commands/`)**
- Each command is a separate class implementing the command pattern
- Key commands: `pickAndPaste`, `pasteNextInPlace`, `pastePrevInPlace`, `copyToHistory`
- All commands are registered in `extension.ts` activation

**Tree Provider (`src/tree/history.ts`)**
- Implements VS Code TreeDataProvider for clipboard history view
- Shows clipboard items in the sidebar with icons and context menus

**Completion Provider (`src/completion.ts`)**
- Provides IntelliSense completions for clipboard snippets
- Uses configurable prefix (default "clip") with numbered suggestions

### Key Features Architecture

**In-Place Cycling**
- `pasteNextInPlace` and `pastePrevInPlace` commands cycle through history at cursor
- Maintains cycling state to allow sequential navigation
- Implemented in dedicated command classes

**Clipboard Monitoring**
- Uses `clipboardy` library for cross-platform clipboard access
- Configurable polling interval (default 500ms)
- Can be restricted to VS Code window focus only

**Persistence**
- History saved to JSON file in temp directory or configured location
- Supports version migration and handles file access errors
- Auto-saves on configuration changes and clip updates

### Configuration System

Extension settings are prefixed with `clipboard-manager-with-cycling.`:
- `maxClips` - Maximum history size (default 100)
- `avoidDuplicates` - Prevent duplicate entries
- `checkInterval` - Polling frequency in milliseconds
- `onlyWindowFocused` - Monitor only when VS Code is focused
- `snippet.enabled` - Enable completion snippets
- `saveTo` - Custom save location for history file

### Testing Structure

Tests use Mocha framework with VS Code test runner:
- `src/test/runTests.ts` - Test runner setup
- Individual test files for each component
- Coverage reports generated to `coverage/` directory

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. Run `npm run compile` or use watch mode
3. Test changes using F5 (Launch Extension) in VS Code
4. Run `npm run lint` to check code style
5. Run `npm test` to verify functionality
6. Use `npm run vscode:prepublish` before publishing

## File Structure Notes

- Source files: `src/` (TypeScript)
- Compiled output: `out/` (JavaScript + source maps)
- Resources: `resources/` (SVG icons for light/dark themes)
- Media: `media/` (extension icon and screenshots)
- Tests compile alongside source files in `out/test/`