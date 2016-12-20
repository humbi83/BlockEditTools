import * as vscode from 'vscode';
import * as block from './block';
import * as utils from './utils';

//ok ... all sync tasks should be at the end of the chain !!!
//all sync task are dep on async tasks
//this is a call chain and we do not return anything, we only care about the side effects
export function chainCallingOfPromises(currIdx: number, ops: block.ISelBlockTask[]):void {
    // console.log(currIdx + ": Enter");
    //console.log("chainCallingOfPromises " + currIdx + "/" + ops.length);

    if (currIdx == ops.length) {
        //console.log(currIdx + ": Nothing To DO");
    } else if (ops[currIdx]) {

        //console.log(currIdx + ": If1 Enter");

        if (ops[currIdx].retsPromise()) {
            // console.log(currIdx + ": If2 Enter ");
            ops[currIdx].apply().then(() => { chainCallingOfPromises(currIdx + 1, ops); })
            //console.log(currIdx + ": If2 Exit ");
        } else {
            // console.log(currIdx + ": If3 Enter");
            ops[currIdx].apply();
            chainCallingOfPromises(currIdx + 1, ops);
            //console.log(currIdx + ": If3 Exit");
        }

        //console.log(currIdx + ": If1 Exit");
    }

    //console.log(currIdx + ": Exit");
}


export function applySelBlock(selBlock: block.SelBlock) {
    let va = new block.SelBlockValidator(selBlock);
    let ops = va.validate();
    chainCallingOfPromises(0, ops);
}

export function selectWord(isDirLeft: boolean, /*inout*/ se: block.SelBlock): boolean {

    let cursor = se.getCursorAsSelection();
    let wordRange = undefined;
    let foundNextWord = false;
    let te = vscode.window.activeTextEditor;
    let doc = te.document;

    let rightLimit = doc.lineAt(cursor.active.line).text.length;
    //if the line contains no words but other chars e.g. ws
    let isDirty = false;

    do {

        wordRange = doc.getWordRangeAtPosition(cursor.active);

        //should I compact it ?? +/- 1 & order & some conditons  
        if (wordRange) {
            if (isDirLeft) {
                let offToAdd = wordRange.start.character - cursor.active.character;
                se.addOffX = offToAdd == 0 ? -1 : offToAdd;
                isDirty = true;
            } else {
                let offToAdd = wordRange.end.character - cursor.active.character;
                se.addOffX = offToAdd == 0 ? +1 : offToAdd;
                isDirty = true;
            }
            foundNextWord = true;
        } else if (isDirLeft && se.active.character > 0) {
            se.addOffX = -1;
            isDirty = true;
        } else if (!isDirLeft && se.active.character < rightLimit) {
            se.addOffX = +1;
            isDirty = true;
        } else {
            break;
        }

        cursor = se.getCursorAsSelection();

    } while (!foundNextWord)

    return foundNextWord || isDirty;
}

//we let the cut functionality take care of the "cutting"
export function copyOrCut(doCut: boolean): void {
    let te = vscode.window.activeTextEditor;

    if (!te.selection.isEmpty) {

        let se = block.SelBlock.newInstance_E();
        let doc = te.document;

        utils.Globals.g_buffers = [];

        for (let i = se.top; i <= se.bottom; i++) {
            let pLeft = new vscode.Position(i, se.left);
            let pRight = new vscode.Position(i, se.right);

            let range = new vscode.Range(pLeft, pRight);

            let selText = doc.getText(range);

            utils.Globals.g_buffers.push(selText);

            //console.log(selText);
        }

        if (doCut) {
            vscode.commands.executeCommand("editor.action.clipboardCutAction");
        } else {
            vscode.commands.executeCommand("editor.action.clipboardCopyAction");
        }
    }
}

export function paste(): void {
    //insert

    let te = vscode.window.activeTextEditor;
    let doc = te.document;
    let se: block.SelBlock = block.SelBlock.newInstance_E();

    let cursorSelection: vscode.Selection = se.getCursorAsSelection();

    let noLines = utils.Globals.g_buffers.length;

    let neededWS = cursorSelection.start.character;
    let strOut: string = utils.Globals.g_buffers[0];

    if (strOut) {

        te.selections = [cursorSelection];

        for (let i = 1; i < noLines; i++) {
            strOut = strOut + "\n" + utils.getWS(neededWS) + utils.Globals.g_buffers[i];
        }

        if (noLines > 1) {
            strOut = strOut + "\n";
        }

        te.edit(editor => {
            editor.insert(te.selections[0].start, strOut);
        }).then(() => {
            let tET = vscode.window.activeTextEditor;

            let newSelz = [];
            for (let i = tET.selection.start.line - noLines, k = 0; i < tET.selection.start.line; i++, k++) {
                let sPos = new vscode.Position(i, cursorSelection.start.character + utils.Globals.g_buffers[k].length);
                newSelz.push(new vscode.Selection(sPos, sPos));
            }

            tET.selections = newSelz;

        });
    }
}