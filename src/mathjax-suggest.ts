import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	finishRenderMath,
	renderMath,
	TFile
} from 'obsidian';
import {MathjaxHelper} from './mathjax-helper';
import {MathJaxSymbol} from './mathjax-symbols';
import {BetterMathjaxSettings} from "./settings";
import Logger from "./logger";

export default class MathjaxSuggest extends EditorSuggest<MathJaxSymbol> {
	private mathjaxHelper: MathjaxHelper;
	private editor: Editor;
	private settings: BetterMathjaxSettings;

	public enabled: boolean;

	private startPos: EditorPosition;
	private endPos: EditorPosition;
	private suggestionTired: boolean;

	private startup: boolean;

	constructor(private app: App, settings: BetterMathjaxSettings, mathjaxHelper: MathjaxHelper) {
		super(app);
		this.mathjaxHelper = mathjaxHelper;
		this.settings = settings;
		this.startup = true;
	}

	getSuggestions(context: EditorSuggestContext): MathJaxSymbol[] {
		// convert the item in results to a string[]
		return this.mathjaxHelper.search(context.query, this.settings.maxSuggestionNumber);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		if (this.startup) {
			this.mathjaxHelper.readUserDefinedSymbols().then(() => {
				this.startup = false;
			});
		}

		if (this.suggestionTired) {
			this.suggestionTired = false;
			return null;
		}

		this.editor = editor;

		this.enabled = false;
		if (this.settings.forceEnabling) {
			this.enabled = true;
		} else {
			if (this.settings.autoEnabling) {
				const text = this.getTextBeforeCursor(cursor);
				this.enabled = this.checkMathjaxEnvironment(text)
			}

			if (!this.enabled) {
				return null;
			}
		}


		const word = this.getWord(this.getCurrentLineBeforeCursor(cursor));

		this.startPos = {line: cursor.line, ch: cursor.ch - word.length};
		this.endPos = cursor;

		if (word !== "") {
			return {start: this.startPos, end: cursor, query: word};
		}

		return null;

	}

	async renderSuggestion(suggestion: MathJaxSymbol, el: HTMLElement): Promise<void> {
		el.setText(suggestion.name);
		// Create new element
		const mathSpan = el.createSpan();

		//Change span left padding to 10px
		mathSpan.style.paddingLeft = "10px";
		try {
			let example = suggestion.name;
			// check the type of examples, if string and not empty then use it, if array and not empty then use the first element
			if (typeof suggestion.examples === "string" && suggestion.examples !== "") {
				example = suggestion.examples;
			} else if (Array.isArray(suggestion.examples) && suggestion.examples.length > 0) {
				example = suggestion.examples[0];
			}

			//Logger.instance.info(example)
			const mathEl = renderMath(example, false);
			await finishRenderMath();
			mathSpan.appendChild(mathEl);
		} catch (ReferenceError) {
			Logger.instance.error("ReferenceError");
			Logger.instance.error("Try to preview LaTeX once to load MathJax");
		}


	}

	selectSuggestion(suggestion: MathJaxSymbol, evt: MouseEvent | KeyboardEvent): void {
		const pos = this.startPos;
		pos.ch = pos.ch - 1;
		if (this.settings.useSnippetFirst && suggestion.snippet !== undefined && suggestion.snippet !== "") {
			this.editor.replaceRange(suggestion.snippet, this.startPos, this.endPos);
			this.editor.setCursor(pos);
			// this.placeholderPositions = this.getPlaceholderPositions(pos, suggestion.snippet);
			this.selectNextPlaceholder();
		} else {
			this.editor.replaceRange(suggestion.name, pos, this.endPos);
		}
		this.close();
		this.suggestionTired = true;
	}
	getCurrentLineBeforeCursor(pos: EditorPosition): string {
		return this.editor.getLine(pos.line).slice(0, pos.ch);
	}

	// Function to get the text before the cursor and after a backslash
	// if there is one space before the cursor and after the backslash
	// then return ""
	getWord(text: string): string {

		// Regex to match a word after a backslash and before the end of the line
		const regex = /\\(\w+)$/;
		const match = text.match(regex);
		if (!match) {
			return "";
		}
		return match[1];
	}

	getTextBeforeCursor(pos: EditorPosition): string {
		let text = "";
		for (let i = 0; i < pos.line; i++) {
			text += this.editor.getLine(i) + " ";
		}

		text += this.getCurrentLineBeforeCursor(pos);
		return text;
	}


	checkMathjaxEnvironment(text: string): boolean {
		// check if the text is in a mathjax environment using stack
		// the start of a mathjax environment is $ or $$
		// the end of a mathjax environment is $ or $$
		// if the stack is empty then we are not in a mathjax environment
		// if the stack is not empty then we are in a mathjax environment
		const stack: string[] = [];
		const regex = /(\$\$|\$)/g;
		let match;
		while ((match = regex.exec(text)) !== null) {
			if (stack.length === 0) {
				stack.push(match[1]);
			} else {
				if (stack[stack.length - 1] === match[1]) {
					stack.pop();
				} else {
					stack.push(match[1]);
				}
			}
		}
		// Logger.instance.info("DEBUG: stack length:", stack.length);
		return stack.length !== 0;
	}


	selectNextSuggestion(): void {
		// Thanks to github@tth05 for this hack
		// And thanks to Obsidian team who made this hack possible by not providing a doc for this (yet)

		/* eslint-disable */
		(this as any).suggestions.setSelectedItem((this as any).suggestions.selectedItem + 1, new KeyboardEvent("keydown"));
		/* eslint-enable */
	}

	selectPreviousSuggestion(): void {
		/* eslint-disable */
		(this as any).suggestions.setSelectedItem((this as any).suggestions.selectedItem - 1, new KeyboardEvent("keydown"));
		/* eslint-enable */
	}


	selectNextPlaceholder(): void {
		const pos = this.editor.getCursor();
		// If already selected, move to the next placeholder by adding the length of the placeholder to the pos
		if (this.editor.somethingSelected()) {
			const selectedText = this.editor.getSelection();
			pos.ch += selectedText.length - 1;
		}

		const currentLineNumber = pos.line;
		const maxLineNumber = this.editor.lastLine();

		// Iterate over each line unless find a placeholder in format @1@, @2@, @3@, etc.
		for (let lineNumber = currentLineNumber; lineNumber <= maxLineNumber; lineNumber++) {
			let line = "";
			if (lineNumber !== currentLineNumber) {
				line = this.editor.getLine(lineNumber);
			} else {
				// get the text after the cursor
				line = this.editor.getLine(lineNumber).slice(pos.ch);
			}
			const regex = /@(\d+)@/g;
			let match;
			if ((match = regex.exec(line)) !== null) {
				const placeholderStartPos = {line: lineNumber, ch: pos.ch + match.index};
				const placeholderEndPos = {line: lineNumber, ch: pos.ch + match.index + match[0].length};
				this.editor.setSelection(placeholderStartPos, placeholderEndPos);
				return;
			}
			pos.ch = 0;
		}
	}

	selectPreviousPlaceholder(): void {
		const pos = this.editor.getCursor();
		// If already selected, move to the next placeholder by adding the length of the placeholder to the pos
		if (this.editor.somethingSelected()) {
			const selectedText = this.editor.getSelection();
			pos.ch -= selectedText.length - 1;
		}

		const currentLineNumber = pos.line;
		const minLineNumber = 0;

		// Iterate over each line unless find a placeholder in format @1@, @2@, @3@, etc.
		for (let lineNumber = currentLineNumber; lineNumber >= minLineNumber; lineNumber--) {
			let line = "";
			if (lineNumber !== currentLineNumber) {
				line = this.editor.getLine(lineNumber);
			} else {
				// get the text before the cursor
				line = this.editor.getLine(lineNumber).slice(0, pos.ch);
			}
			// match the last placeholder in the line
			const regex = /@(\d+)@/g;
			let match;
			let lastMatch;
			while ((match = regex.exec(line)) !== null) {
				lastMatch = match;
			}
			if (lastMatch !== undefined) {
				const placeholderStartPos = {line: lineNumber, ch: lastMatch.index};
				const placeholderEndPos = {line: lineNumber, ch: lastMatch.index + lastMatch[0].length};
				this.editor.setSelection(placeholderStartPos, placeholderEndPos);
				return;
			}
		}
	}

	showMathjaxHelperOnCurrentSelection(): void {

		/* eslint-disable */
		const selectedIndex = (this as any).suggestions.selectedItem;
		/* eslint-enable */

		// show the mathjax helper
		this.mathjaxHelper.showHelperBySelectedItemIndex(selectedIndex);

	}
}
