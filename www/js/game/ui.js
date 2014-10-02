GAME.UI.identityPalette = [
	"#13a2a5"/*light blue*/, 
	"#d1155d"/*magenta*/, 
	"#e57b1c"/*orange*/, 
	"#2a9617"/*green*/, 
	"#6b24aa"/*purple*/, 
	"#c42818"/*red*/
];

/* ==========================================================================
 Class: Tiled Text
 ========================================================================== */

GAME.UI.TiledText = function(str) {
	
	PIXI.DisplayObjectContainer.call(this);
	
	this.tiles = [];
	this.spacing = 10;
	this.tileScale = 0.65*GAME.UI.getResponsiveScale().x;
	var frameTex = new PIXI.Texture.fromFrame("tts_letter_frame.png");
	this.tileDim = {w:parseInt(frameTex.width), h:parseInt(frameTex.height)};
	
	this.anchor = new PIXI.Point(0.5,0);
	
	for (var i=0; i < str.length; i++) {
		var frame = new PIXI.Sprite(frameTex);
	    frame.anchor = new PIXI.Point(0.5,0.5);
		var _char = new PIXI.BitmapText(str.charAt(i), { font: "100px VAGRounded" });
	    _char.x = -(_char.width)*0.5-2;
	    _char.y = -(_char.textHeight)*0.5-6;
	    frame.x = (i-(str.length-1)*0.5)*(frame.width + this.spacing);
	    frame.addChild(_char);
	    frame.scale.x = frame.scale.y = 0;
		this.tiles.push(frame);
		this.addChild(frame);
	}
	
	this._width = (i)*(this.tileDim.w + this.spacing) - this.spacing;
	this._height = this.tileDim.h;
	this._deployTime = 1+i*0.3;
};

GAME.UI.TiledText.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
GAME.UI.TiledText.prototype.constructor = GAME.UI.TiledText;

GAME.UI.TiledText.prototype.deployAnimated = function () {
	for (var i = 0; i < this.tiles.length; i++) {
		Tweener.addTween(this.tiles[i],
			{width:this.tileDim.w, height:this.tileDim.h, time:1, delay:0.3*i, transition:"easeOutElastic",
		});
	}
};

GAME.UI.TiledText.prototype.cycleThroughAnimated = function () {
	for (var i = 0; i < this.tiles.length; i++) {
		Tweener.addTween(this.tiles[i],
			{width:this.tileDim.w, height:this.tileDim.h, time:1, delay:0.15*i, transition:"easeOutElastic", onStart:function(e) {e.scale = new PIXI.Point(0.8,0.8);}, onStartParams:[this.tiles[i]]
		});
	}
};


GAME.UI.getTextStyles = function(styleSetID) {
	var props;
	switch (styleSetID) {
		case "h1":
			props = { font: "bold 60px Arial", fill: "#FFFFFF", align: "center", stroke: "#cd9767", strokeThickness: 6, dropShadow : true, dropShadowColor : "#a26e42" };
		break;
		case "graphicsCaption":
			props = { font: "bold 60px Arial", fill: "#539012", align: "center", stroke: "#e1b38b", strokeThickness: 8 };
		break;
		case "hintNote":
			props = { font: "bold 25px Arial", fill: "#FFFFFF", align: "center", stroke: "#cd9767", strokeThickness: 6, dropShadow : true, dropShadowColor : "#a26e42" };
		break;
		case "UIComponent":
			props = { font: "bold 30px Arial", fill: "#FFFFFF", align: "left" };
		break;
		default:
			props = { font: "bold 35px Arial", fill: "#FFFFFF", align: "left", stroke: "#cd9767", strokeThickness: 6, dropShadow : true, dropShadowColor : "#a26e42" };
	}
	return props;
};

GAME.UI.getBitmapTextStyles = function(styleSetID) {
	
	var props;
	switch (styleSetID) {
		default:
			props = { font: "60px VAGRoundedHeadings" };
		break;
	}
	return props;
};

GAME.UI.Preloader.setAppearance = function () {
	this._setAppearance({
		bgColor : 0xc99566,
		bgTexture :  "assets/graphic/texture/ui/desk_wood.jpg",
		barColor : 0x7821c6,
		barFrameColor : 0x955d33,
	});
};

GAME.UI.init = function() {

};