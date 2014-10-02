var GAME = GAME || {};

GAME.Editor = function(sID) {
	
	PIXI.DisplayObjectContainer.call(this);
	
	this.sID = sID;
	this.controls = [];
	//control count
	this.cc = 1;
	this.controlSize = 106;
	this.controlContainer = new PIXI.DisplayObjectContainer();
	this.addChild(this.controlContainer);
	//"Edit mode" caption
	var caption = GAME.UI.createText("Edit mode", "hintNote", {align:"left"});
	caption.position = {x:20, y:20};
	this.addChild(caption);
	
};

GAME.Editor.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
GAME.Editor.constructor = GAME.Editor;

GAME.Editor.prototype.pushControl = function(sID, textureID) {
	
	var control = new PIXI.Sprite(GAME.AssetManager.fromCache(textureID));
	control.x = - this.controlSize * this.cc;
	control.y = - this.controlSize;
	control.interactive = true;
	this.controls[sID] = control;
	this.controlContainer.addChild(control);
	this.cc++;
	
	return control;
};

GAME.Editor.prototype.onResize = function() {
	var ss = GAME.getScreenSize();
	var rs = GAME.UI.getResponsiveScale();
	this.controlContainer.scale = rs;
	this.controlContainer.x = ss.w - 20*rs.x;
	this.controlContainer.y = ss.h - 20*rs.x;
};