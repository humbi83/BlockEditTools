// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as utils from './utils';
import * as block from './block';
import * as ctrl from './controller';

//TODO: multiple block modes Extend/Contract/Move Cursor l from current cursor as center ext/contract left right up down
//TODO: select & align after white space / char e.g. , or ;
//TODO: Move without changing selection ??? jump  left / beg sel, jump right / end sel, just move
//TODO: Cycle  through primary line ??? 
 
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('alm.blockSelectUp', () => {
		//blockSelectUpDown(true);
		//console.log("blockSelectUp#selections : " + currentSelections.length)

		let se = block.SelBlock.newInstance_E();
		se.addOffY = -1;
		ctrl.applySelBlock(se);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('alm.blockSelectDown', () => {
		let se = block.SelBlock.newInstance_E();
		se.addOffY = 1;
		ctrl.applySelBlock(se);

	}));

	context.subscriptions.push(vscode.commands.registerCommand('alm.blockSelectLeft', () => {
		let se = block.SelBlock.newInstance_E();
		se.addOffX = -1;
		ctrl.applySelBlock(se);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('alm.blockSelectRight', () => {
		let se = block.SelBlock.newInstance_E();
		se.addOffX = 1;
		ctrl.applySelBlock(se);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('alm.blockSelectWordLeft', () => {
		let se = block.SelBlock.newInstance_E();

		if (ctrl.selectWord(true, se)) {
			ctrl.applySelBlock(se);
		}
	}));


	context.subscriptions.push(vscode.commands.registerCommand('alm.blockSelectWordRight', () => {
		let se = block.SelBlock.newInstance_E();

		if (ctrl.selectWord(false, se)) {
			ctrl.applySelBlock(se);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('alm.blockCopy', () => {
		ctrl.copyOrCut(false);
	}));


	context.subscriptions.push(vscode.commands.registerCommand('alm.blockCut', () => {
		ctrl.copyOrCut(true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('alm.blockPaste', () => {
		ctrl.paste();

	}));

}