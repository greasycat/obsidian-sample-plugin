import {Command, Notice} from 'obsidian';
import MathjaxSuggest from './mathjax-suggest';
import {BetterMathjaxSettings} from "./settings";
import {MathjaxHelper} from "./mathjax-helper";

export function selectNextSuggestCommand(latexSuggest: MathjaxSuggest): Command {
	return {
		id: 'better-mathjax-select-next-suggestion',
		name: 'Select next suggestion',
		hotkeys: [
			{
				key: "]",
				modifiers: ["Ctrl"]
			}
		],
		repeatable: true, editorCallback: (_: never) => {
			latexSuggest.selectNextSuggestion();
		},
	};
}

export function selectPreviousSuggestCommand(latexSuggest: MathjaxSuggest): Command {
	return {
		id: 'better-mathjax-select-previous-suggestion',
		name: 'Select previous suggestion',
		hotkeys: [
			{
				key: "[",
				modifiers: ["Ctrl"]
			}
		],
		repeatable: true, editorCallback: (_: never) => {
			latexSuggest.selectPreviousSuggestion();
		},
	};
}

export function selectNextPlaceholderCommand(latexSuggest: MathjaxSuggest): Command {
	return {
		id: 'better-mathjax-select-next-placeholder',
		name: 'Select next placeholder',
		hotkeys: [
			{
				key: "'",
				modifiers: ["Ctrl"]
			}
		],
		repeatable: true, editorCallback: (_: never) => {
			latexSuggest.selectNextPlaceholder();
		},
	};
}

export function selectPreviousPlaceholderCommand(latexSuggest: MathjaxSuggest): Command {
	return {
		id: 'better-mathjax-select-previous-placeholder',
		name: 'Select previous placeholder',
		hotkeys: [
			{
				key: ";",
				modifiers: ["Ctrl"]
			}
		],
		repeatable: true, editorCallback: (_: never) => {
			latexSuggest.selectPreviousPlaceholder();
		},
	};
}

export function showMathjaxHelperOnCurrentSelection(latexSuggestions: MathjaxSuggest): Command {
	return {
		id: 'better-mathjax-show-mathjax-helper-on-current-selection',
		name: 'Show mathjax helper on current selection',
		hotkeys: [
			{
				key: "?",
				modifiers: ["Ctrl", "Shift"]
			}
		],
		repeatable: true, editorCallback: (_: never) => {
			latexSuggestions.showMathjaxHelperOnCurrentSelection();
		},
	};
}

export function insertSubscriptPlaceholder(mathjaxSuggest: MathjaxSuggest, settings: BetterMathjaxSettings): Command {
	return {
		id: 'better-mathjax-insert-subscript-placeholder-bracket',
		name: 'Insert subscript',
		hotkeys: [{
			key: "_",
			modifiers: []
		}],
		repeatable: true, editorCallback: (editor, view) => {


			// Get current cursor position
			const cursor = editor.getCursor();
			if (settings.matchingSubScript && mathjaxSuggest.enabled)
			{
				editor.replaceRange("_{@1@}", cursor);
			}
			else
			{
				editor.replaceRange("_", cursor);
			}
			editor.setCursor({ch:cursor.ch + 1, line:cursor.line})
		},
	};
}

export function insertSuperscriptPlaceholder(mathjaxSuggest: MathjaxSuggest, settings: BetterMathjaxSettings): Command {
	return {
		id: 'better-mathjax-insert-super-placeholder-bracket',
		name: 'Insert super',
		hotkeys: [{
			key: "^",
			modifiers: []
		}],
		repeatable: true, editorCallback: (editor, view) => {


			// Get current cursor position
			const cursor = editor.getCursor();
			if (settings.matchingSuperScript && mathjaxSuggest.enabled) {
				editor.replaceRange("^{@1@}", cursor);
			}
			else
			{
				editor.replaceRange("^", cursor);
			}
			editor.setCursor({ch:cursor.ch + 1, line:cursor.line})
		},
	};
}

export function reloadUserDefinedFile(mathjaxHelper: MathjaxHelper): Command {
	return {
		id: 'better-mathjax-reload-user-defined-file',
		name: 'Reload user defined file',
		hotkeys: [],
		repeatable: true, editorCallback: (editor, view) => {
			mathjaxHelper.readUserDefinedSymbols().then(() => {
				new Notice("User defined file reloaded");
			});
		},
	};
}
