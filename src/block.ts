
import * as vscode from 'vscode'
import * as utils from './utils'

export class SelBlock {
    constructor(public mAnchSelection: vscode.Selection) { }

    public static newInstance(ancXChar, ancYLine, actXChar, actYLine): SelBlock {
        return new SelBlock(new vscode.Selection(
            Math.max(0, ancYLine),
            Math.max(0, ancXChar),
            Math.max(0, actYLine),
            Math.max(0, actXChar)));
    }

    //overloading doesn't work in ts/js ..
    public static newInstance_E(): SelBlock {
        let minY = Number.MAX_VALUE;
        let maxY = -1;

        let te = vscode.window.activeTextEditor;
        let selections = te.selections;

        for (const selection of selections) {
            minY = Math.min(minY, selection.start.line);
            minY = Math.min(minY, selection.end.line);

            maxY = Math.max(maxY, selection.start.line);
            maxY = Math.max(maxY, selection.end.line);
        }

        let mainSele = te.selection;

        let isXRev = mainSele.isReversed;
        let isYRev = !(mainSele.active.line > minY);

        let ret = SelBlock.newInstance(
            mainSele.anchor.character,
            isYRev ? maxY : minY,
            mainSele.active.character,
            !isYRev ? maxY : minY);

        return ret;
    }

    public getCursorAsSelection(): vscode.Selection {
        let se = this;

        let cursorSelection = new vscode.Selection(
            se.isRevY ? se.top : se.bottom,
            se.isRevX ? se.left : se.right,
            se.isRevY ? se.top : se.bottom,
            se.isRevX ? se.left : se.right
        );

        return cursorSelection;
    }

    //Ok .. these are setters only .. I cannot tell from the it's name
    set activeChar(value: number) {
        this.mAnchSelection = new vscode.Selection(this.mAnchSelection.anchor, new vscode.Position(this.mAnchSelection.active.line, Math.max(0, value)));
    }

    set activeLine(value: number) {
        this.mAnchSelection = new vscode.Selection(this.mAnchSelection.anchor, new vscode.Position(Math.max(0, value), this.mAnchSelection.active.character));
    }

    set activeCL(charLine: number[]) {
        this.mAnchSelection = new vscode.Selection(this.mAnchSelection.anchor, new vscode.Position(Math.max(0, charLine[1]), Math.max(0, charLine[0])));
    }

    set addOffX(offset: number) {
        let prev = this.mAnchSelection;
        this.mAnchSelection =
            new vscode.Selection(prev.anchor,
                new vscode.Position(prev.active.line, Math.max(0, prev.active.character + offset)));
    }

    set addOffY(offset: number) {
        let prev = this.mAnchSelection;
        this.mAnchSelection =
            new vscode.Selection(prev.anchor,
                new vscode.Position(Math.max(0, prev.active.line + offset), prev.active.character));
    }

    get isRevX(): boolean { let v = this.mAnchSelection; return v.active.character < v.anchor.character; }
    get isRevY(): boolean { let v = this.mAnchSelection; return v.active.line < v.anchor.line; }
    get left(): number { let v = this.mAnchSelection; return this.isRevX ? v.active.character : v.anchor.character; }
    get right(): number { let v = this.mAnchSelection; return !this.isRevX ? v.active.character : v.anchor.character; }
    get top(): number { let v = this.mAnchSelection; return this.isRevY ? v.active.line : v.anchor.line; }
    get bottom(): number { let v = this.mAnchSelection; return !this.isRevY ? v.active.line : v.anchor.line; }

    get width(): number { return this.right - this.left + 1; }
    get height(): number { return this.bottom - this.top + 1; }

    get anchor(): vscode.Position { return this.mAnchSelection.anchor; }
    get active(): vscode.Position { return this.mAnchSelection.active; }

}

export interface ISelBlockTask {
    retsPromise(): boolean;
    apply(): any;
}

export class LineSelBlockMorpher implements ISelBlockTask {

    constructor(public mNoLinesToExtend: number) { }
    public retsPromise() { return true; }
    public apply(): any {

        let te: vscode.TextEditor = vscode.window.activeTextEditor;
        // console.log("LineSelBlockMorpher Enter: "+ te.document.lineCount + " this.mNoLinesToExtend: " + this.mNoLinesToExtend);

        //What is the diff ??? 
        //te.edit(builder => {
        //    builder.insert(te.document.positionAt(te.document.getText.length - 1), utils.getNL(this.mNoLinesToExtend));
        //});

        //I should use the uri handle ??? instead of activeTextEditor
        let wsEdit = new vscode.WorkspaceEdit();
        //let pos = te.document.positionAt(Math.max(0,te.document.getText.length-1));
        //let pos2 = new vscode.Position(Math.max(0,te.document.lineCount - 1), Math.max(0, te.document.getText().length));

        let linedIdx = Math.max(0, te.document.lineCount - 1);
        let pos2 = new vscode.Position(linedIdx, Math.max(0, te.document.lineAt(linedIdx).text.length));
        // console.log("stufffff ",pos2.line, pos2.character);
        wsEdit.insert(te.document.uri, pos2, utils.getNL(this.mNoLinesToExtend));

        // console.log("LineSelBlockMorpher Exit:");

        return vscode.workspace.applyEdit(wsEdit);
    }
}

export class CharSelBlockMorpher implements ISelBlockTask {
    constructor(public mLines: { line: number, noWS: number }[]) { }
    public retsPromise() { return true; }
    public apply(): any {
        let te: vscode.TextEditor = vscode.window.activeTextEditor;

        let wsEdit = new vscode.WorkspaceEdit();

        for (const line of this.mLines) {
            // console.log("enter");
            // console.log(line.line, line.noWS);

            let pos2 = new vscode.Position(line.line, Math.max(0, te.document.lineAt(line.line).text.length));

            wsEdit.insert(te.document.uri, pos2, utils.getWS(line.noWS));
            // console.log("exit");
        }

        //Hopefully this actually works
        return vscode.workspace.applyEdit(wsEdit);
    }
}

export class SelBlockSetter implements ISelBlockTask {

    constructor(public mSel: SelBlock) { }

    public retsPromise() { return false; }

    public apply(): any {

        let te: vscode.TextEditor = vscode.window.activeTextEditor;
        let newSelections: vscode.Selection[] = [];
        let isYRev = this.mSel.active.line < this.mSel.anchor.line; // 

        if (isYRev) {
            for (let lineIdx = this.mSel.top; lineIdx <= this.mSel.bottom; lineIdx++) {
                newSelections.push(new vscode.Selection(
                    lineIdx,
                    this.mSel.anchor.character,
                    lineIdx,
                    this.mSel.active.character));
            }
        }
        else {
            for (let lineIdx = this.mSel.bottom; lineIdx >= this.mSel.top; lineIdx--) {
                newSelections.push(new vscode.Selection(
                    lineIdx,
                    this.mSel.anchor.character,
                    lineIdx,
                    this.mSel.active.character));
            }
        }

        te.selections = newSelections;
    }
}

export class SelBlockValidator {

    constructor(public mSel: SelBlock) { }

    public validate(): ISelBlockTask[] {

        let ret = [];
        let te = vscode.window.activeTextEditor;
        let doc = te.document;

        if (this.mSel.bottom >= doc.lineCount) {
            let missingLines = this.mSel.bottom - doc.lineCount + 1;
            //console.log("missingLines: " + missingLines);
            ret.push(new LineSelBlockMorpher(missingLines));
        }

        let neededMinLen = Math.max(this.mSel.anchor.character, this.mSel.active.character);

        let charSelInput: { line: number, noWS: number }[] = [];

        for (let lineIdx = this.mSel.top; lineIdx <= this.mSel.bottom; lineIdx++) {
            //console.log("lineIdx: " + lineIdx);
            if (lineIdx < doc.lineCount) {

                let lineLen = doc.lineAt(lineIdx).text.length;

                if (lineLen < neededMinLen) {
                    charSelInput.push({ line: lineIdx, noWS: neededMinLen - lineLen });
                }

            } else {
                charSelInput.push({ line: lineIdx, noWS: neededMinLen });
            }
        }

        //console.log("charSelInput.length: " + charSelInput.length);

        if (charSelInput.length) {
            ret.push(new CharSelBlockMorpher(charSelInput));
        }

        ret.push(new SelBlockSetter(this.mSel));

        return ret;
    }
}
