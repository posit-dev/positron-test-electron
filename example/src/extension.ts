import * as vscode from 'vscode';

// Trivial extension: it exists only so the test host has something to activate.
// The Positron API is acquired from the test suite, not here.
export function activate(_context: vscode.ExtensionContext): void {
	// no-op
}

export function deactivate(): void {
	// no-op
}
