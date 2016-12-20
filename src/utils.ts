import * as vscode from 'vscode';


export class Globals {
    static wsArray: string[] = [""];
    static nlArray: string[] = [""];
    /// Copy/Cut/Paste functionality
	static g_buffers = [];
}

export function getWS(noOfWS: number, storage: string[] = Globals.wsArray, wsString: string = ' '): string {
    if (!storage[noOfWS]) {
        storage[noOfWS] = wsString.repeat(noOfWS);
    }

    return storage[noOfWS];
}

export function getNL(noOfNL: number, storage: string[] = Globals.nlArray, nlString: string = '\n'): string {
    if (!storage[noOfNL]) {
        storage[noOfNL] = nlString.repeat(noOfNL);
    }

    return storage[noOfNL];
}

export function appendWhiteSpace(textEditor: vscode.TextEditor, builder: vscode.TextEditorEdit, idxLines: number[], minLineSize: number) {
    for (const idxLine of idxLines) {
        let lineSz = textEditor.document.lineAt(idxLine).range.end.character + 1;

        if (lineSz < minLineSize) {
            builder.insert(new vscode.Position(idxLine, lineSz), getWS(minLineSize - lineSz));
        }
    }
}


export function getTopBottomSelectedLine(textEditor: vscode.TextEditor): number[] {
    let topIdx = Number.MAX_VALUE;
    let bottomIdx = 0;

    for (const selection of textEditor.selections) {
        if (topIdx > selection.start.line) {
            topIdx = selection.start.line
        }

        if (bottomIdx < selection.end.line) {
            bottomIdx = selection.end.line;
        }
    }

    return [topIdx, bottomIdx];
}

export function isSelectionGaplessAndSingleLined(textEditor: vscode.TextEditor): boolean {
    let ret: boolean = true;
    let selLen: number = textEditor.selections.length;

    if (selLen === 1) {
        ret = textEditor.selection.isSingleLine;
    } else {

        for (let seleIdx = 0; seleIdx < selLen - 1; seleIdx++) {

            let currSelection = textEditor.selections[seleIdx];
            let nextSelection = textEditor.selections[seleIdx + 1];

            if (currSelection.isSingleLine && nextSelection.isSingleLine &&
                Math.abs(currSelection.start.line - nextSelection.start.line) === 1) {
                ret = true;
            } else {
                ret = false;
                break;
            }
        }
    }
    return ret;
}