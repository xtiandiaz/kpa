/* ==========================================================================
 Base Class: Game Episode
 ========================================================================== */

Episode = function(_data) {
	
	PIXI.DisplayObjectContainer.call(this);

	this.preloaded = false;
	
	this.scaleRel = [];
	this.accesses = [];
	
	this.sID = _data.id;
	this.name = _data.name;
	
	this.curAccess = null;
	
	//Reference Scale
	this.rs = _data.rs?parseFloat(_data.rs):1;
	
	if (_data.soundtrack !== undefined) this.soundtrack = _data.soundtrack;
	//@type: Array
	this.puzzleData = _data.puzzles;
};

Episode.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Episode.prototype.constructor = Episode;

Episode.prototype.onAddedToStage = function() {
	
};

Episode.prototype.getAssets = function() {
	
	var batch = {"graphic" : [{"id" : "episode."+this.sID+".art" , "src" : "episode/"+this.sID+"/"+this.sID+".jpg" }] };
	
	if (this.soundtrack === undefined) this.soundtrack = "episode_"+this.sID;
		
	if (this.soundtrack !== "") {
		batch.sound = [{"id" : "episode."+this.sID+".soundtrack" , "src" : this.soundtrack+".mp3" }];
	}
	
	//console.log(batch);
	for (var i = 0; i < this.puzzleData.length; i++) {			 
		batch.graphic.push({"id" : this.sID+".access."+this.puzzleData[i].id, "src":"episode/"+this.sID+"/puzzle/"+this.puzzleData[i].id+"_access.png"});
	}
	return batch;
};

Episode.prototype.init = function() {

	if (!this.preloaded) {
		
		this.cleanUp();
		////////////
		this.preloaded = true;
		////////////
		this.scaleRel = [];
		//Render the stage
		
		var woodTexture = GAME.AssetManager.fromCache("desk-wood");
		this.baseBg = new PIXI.TilingSprite(woodTexture, 512, 512);
		this.addChild(this.baseBg);
		
		this.bg = new PIXI.Sprite(GAME.AssetManager.fromCache("episode."+this.sID+".art"));
		this.bg.anchor = new PIXI.Point(0.5,0.5);
		this.bg.z = -1;
		//this.scaleRel["bg"] = GAME.utils.getScaleRel(this.bg.width, this.bg.height);
		this.addChild(this.bg);
		
		// Create the accesses
		for (var i = 0; i < this.puzzleData.length; i++) {
			var puzzleAccess = new PuzzleAccess(this.puzzleData[i], this.sID, this.rs);
			puzzleAccess.index = i;
			this.accesses.push(puzzleAccess);
			this.addChild(puzzleAccess);
			puzzleAccess.onAddedToStage();
		}
		this.children.sort(GAME.utils.depthCompare);
	}
	
	//Play the soundtrack
	GAME.SoundManager.playTrack("episode."+this.sID+".soundtrack", {loop:-1});

};

Episode.prototype.getPrintData = function() {
	var data = '{"id":"'+this.sID+'",<br/>"name":"'+this.name+'",<br/>"rs":'+this.bg.scale.x+',<br/>"puzzles":[';
	for (var i = 0; i < this.accesses.length; i++) {
		data += this.accesses[i].getPrintData();
		if (i< this.accesses.length -1) data += ",";
	}
	return data+"<br/>]}";
};

Episode.prototype.updateAccessStatus = function() {
	for (var i = 0; i < this.accesses.length; i++) {
		this.accesses[i].updateStatus();
	}
};

Episode.prototype.markAccessStatus = function(index, status) {
	console.log("Access '"+index+"' marked as: "+status);
	this.accesses[index].status = status;
};

Episode.prototype.getSAC = function() {
	return this.bg.scale.x / this.rs;
};

Episode.prototype.onResize = function() {
	var ss = GAME.getScreenSize();
	
	this.baseBg.width = ss.w;
	this.baseBg.height = ss.h;
	
	GAME.utils.fitScreen(this.bg);
	///
	//scale aspect coef
	var sac = this.getSAC();
	for (var i = 0; i < this.accesses.length; i++) {
		this.accesses[i].onResize(sac, {x:this.bg.x-this.bg.width*0.5, y:this.bg.y-this.bg.height*0.5});
	}
};

Episode.prototype.cleanUp = function() {
	if (this.bg) this.removeChild(this.bg);
	///
	for (var i = 0; i < this.accesses.length; i++) {
		this.removeChild(this.accesses[i]);
	}
	this.accesses.length = 0;
};

Episode.prototype.onResume = function() {
	
	this.updateAccessStatus();
	
	GAME.SoundManager.playTrack("episode."+this.sID+".soundtrack", {loop:-1});
};


/* ==========================================================================
 Class: Puzzle Access
 ========================================================================== */
 
function PuzzleAccess(_data, episodeSID, rs) {
	
	PIXI.DisplayObjectContainer.call(this);
	///
	this.episodeSID = episodeSID;
	this.sID = _data.id;
	this.access = _data.access;
	this.TTSWord = _data.TTSWord;
	this.dragging = false;
	this._data = _data;
	//0: unsolved, 1:solved
	this.status = 0;
	
	this.accessSprite = new PIXI.Sprite(GAME.AssetManager.fromCache(this.episodeSID+".access."+this.sID));
	
	//base reference screen size 
	this.baseSS = GAME.getScreenSize();
	if (_data.access) {
		this.iniPos = {x:this.access.x, y:this.access.y};
		this.z = this.access.z;
	} else {
		this.iniPos = {x: GAME.utils.getRandomInRange(0, this.baseSS.w-this.accessSprite.width), y: GAME.utils.getRandomInRange(0, this.baseSS.h-this.accessSprite.height)};
		//this.iniPos = {x:0, y:0};
		this.z = 0;
		
	}
	this.iniScale = rs;
	
	this.addChild(this.accessSprite);
	
	//Setting the 'unsolved' appearance
	this.updateStatus();
	
	this.accessSprite.interactive = this.accessSprite.buttonMode = true;
	
	if (GAME.editMode) {
		this.accessSprite.mousedown = this.accessSprite.touchstart = this.onEditSelection.bind(this);
		this.accessSprite.mouseup = this.accessSprite.mouseupoutside = this.accessSprite.touchend = this.accessSprite.touchendoutside = this.onDeselection.bind(this);
		this.accessSprite.mousemove = this.accessSprite.touchmove = this.onDragging.bind(this);
	} else {
		this.accessSprite.click = this.accessSprite.tap = this.onSelection.bind(this);
	}
};

PuzzleAccess.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
PuzzleAccess.prototype.constructor = PuzzleAccess;

PuzzleAccess.prototype.onAddedToStage = function() {
	
};

PuzzleAccess.prototype.getData = function() {
	if (GAME.editMode) {
		return {id:this.sID, access:{x:GAME.utils.trimFloat(this.x-this.bgPos.x, 2), y:GAME.utils.trimFloat(this.y-this.bgPos.y, 2), z:this.z}, TTSWord:this.TTSWord};
	}
	return this._data;
};

PuzzleAccess.prototype.getPrintData = function() {
	//var sac = this.parent.getSAC();
	return '	<br/>	{"id":"'+this.sID+'",<br/>	"access":{"x":'+GAME.utils.trimFloat(this.x-this.bgPos.x, 2)+',"y":'+GAME.utils.trimFloat(this.y-this.bgPos.y, 2)+',"z":'+this.z+'},<br/>	"TTSWord":"'+this.TTSWord+'"}';
};

PuzzleAccess.prototype.updateStatus = function() {
	if (this.status !== this.lastStatus) {
		switch (this.status) {
			case 0:
				this.accessSprite.tint = 0x000000;
				this.qMark = GAME.UI.createText("?", "graphicsCaption", {fill : GAME.UI.getNextIdentityColor()/*GAME.utils.getRandomRGBString()*/});
				this.qMark.position = {x:this.accessSprite.width*0.5, y:this.accessSprite.height*0.5};
				this.addChild(this.qMark);
			break;
			case 1:
				this.accessSprite.tint = 0xFFFFFF;
				this.removeChild(this.qMark);
				this.qMark = null;
			break;
		}
	}
	this.lastStatus = this.status;
};

PuzzleAccess.prototype.onEditSelection = function(data) {
	
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	//Z-swap
	this.z = this.parent.getNextHighestDepth();
	this.parent.children.sort(GAME.utils.depthCompare);
	this.dragging = true;
	this.selectionOffset = data.getLocalPosition(this);
	//var sac = this.parent.getSAC();
	this.selectionOffset.x *= this.scale.x;
	this.selectionOffset.y *= this.scale.y;
};

PuzzleAccess.prototype.onSelection = function(data) {

	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
		
	var puzzleID = this.episodeSID+".puzzle."+this.sID;

	GAME.AssetManager.pushBatch(this.episodeSID+".puzzle."+this.sID, 
		{"graphic" : [{"id" : this.episodeSID+".puzzle."+this.sID, "src" : "episode/"+this.episodeSID+"/puzzle/"+this.sID+".jpg"}]}
	);
	this.parent.curAccess = this;
	//Calling the scene
	this.parent.parent.dispatchPuzzle(puzzleID, this.index);
};

PuzzleAccess.prototype.onDragging = function(data) {
	if (this.dragging) {
		var newPos = data.getLocalPosition(this.parent);
		this.x = newPos.x - this.selectionOffset.x;	
		this.y = newPos.y - this.selectionOffset.y;
	}
};

PuzzleAccess.prototype.onDeselection = function(data) {
	
	this.dragging = false;
	//Update transform
	this.iniPos = {x:(this.x- this.bgPos.x) / this.sac, y:(this.y - this.bgPos.y)/ this.sac};
};

PuzzleAccess.prototype.onResize = function(sac, bgPos) {
	this.sac = sac;
	this.bgPos = bgPos;
	this.scale = new PIXI.Point(this.iniScale * sac, this.iniScale * sac);
	this.x = bgPos.x + this.iniPos.x * sac;
	this.y = bgPos.y + this.iniPos.y * sac;
};