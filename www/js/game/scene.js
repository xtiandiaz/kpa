/* ==========================================================================
 Class: Menu Scene
 ========================================================================== */

function MenuScene(sID) {

	Scene.call(this, sID);
	this.count = this.count2 = 0;
}

MenuScene.prototype = Object.create(Scene.prototype);
MenuScene.prototype.constructor = MenuScene;

MenuScene.prototype.preload = function() {
	//append the editor assets to the UI only in case of 'edit mode'
	if (GAME.editMode) {
		GAME.AssetManager.joinBatches("ui", "editor");
	}
	this.base.preload.call(this, "ui");
};

MenuScene.prototype.onAssetsLoaded = function() {  
	
	this.base.onAssetsLoaded.call(this);
	////
	GAME.SoundManager.playTrack("intro", {loop:-1});

};

MenuScene.prototype.init = function() {

	var ss = GAME.getScreenSize();
	//UI stuff --- must be called before the base class'
	this.UI = {
		settings : GAME.UI.createButton("settings_btn.png", true),
		music : GAME.UI.createButton(GAME.Globals.isMusicEnabled?"music_on_btn.png":"music_off_btn.png", true),
		touchHint : GAME.UI.createText("Touch to Start", "hintNote"),
	}
	this.UI.settings.anchor = this.UI.music.anchor = new PIXI.Point(1, 0);
	this.UI.settings.tap = this.UI.settings.click = this.onSettingsSelected.bind(this);
	this.UI.music.onTexture = new PIXI.Texture.fromFrame("music_on_btn.png");
	this.UI.music.offTexture = new PIXI.Texture.fromFrame("music_off_btn.png");
	this.UI.music.tap = this.UI.music.click = this.onMusicToggle.bind(this);
	
	//////
	this.base.init.call(this);
	//////
	
	var bgTexture = GAME.AssetManager.fromCache("desk-wood");
	this.bg = new PIXI.TilingSprite(bgTexture, ss.w, ss.h);
	this.addChild(this.bg);

	// Logo
	this.logo = new PIXI.Sprite(GAME.AssetManager.fromCache("logo"));
	this.logo.anchor = new PIXI.Point(0.5, 0.5);
	this.logo.position = {x:ss.w*0.5, y:ss.h*0.5};
	this.addChild(this.logo);
	
	//'touch to start' area, invisible sprite, on top of everything but the UI elements (settings buttons)
	this.touchStartArea = new PIXI.Sprite(GAME.AssetManager.fromCache("desk-wood"));
	this.touchStartArea.alpha = 0;
	this.touchStartArea.interactive = this.touchStartArea.buttonMode = true;
	this.touchStartArea.tap = this.touchStartArea.click = this.onMenuOption.bind(this, "start");
	this.addChild(this.touchStartArea);
	
	//Codecanyon banner
	if (GAME.devMode) {
		this.ccAd = new PIXI.Sprite(GAME.AssetManager.fromCache("codecanyon-ad"));
		this.addChild(this.ccAd);
		this.ccAd.interactive = this.ccAd.buttonMode = true;
		this.ccAd.click = this.ccAd.tap = function() {window.location.assign("http://www.codecanyon.net/?ref=gruvy");};
	}
};

MenuScene.prototype.onMenuOption = function(option, data) {
	console.log("menu: "+option);
	data.originalEvent.stopPropagation();
	data.originalEvent.preventDefault();
	switch (option) {
		case "start":
			//GAME.utils.tts.speak("This is a test");
			GAME.stateChange(GAME_STATE.episodeSelector);
		break;
	}
};

MenuScene.prototype.onResize = function() {
	
	this.base.onResize.call(this);
	
	var ss = this.refSS =  GAME.getScreenSize();
	
	// Bg resize
	this.bg.width = ss.w;
	this.bg.height = ss.h;
	
	this.touchStartArea.width = ss.w;
	this.touchStartArea.height = ss.h;
	///
	this.logo.position = GAME.UI.getScreenAnchor("MC");
	this.logo.baseScale = GAME.UI.getResponsiveScale(0.4);
	
	if (GAME.devMode) {
		this.ccAd.position = GAME.UI.getScreenAnchor("TL", 20);
	}

};

MenuScene.prototype.onResizeUI = function() {
	
	this.base.onResizeUI.call(this);
	///
	this.UI.settings.position = GAME.UI.getScreenAnchor("TR", 20);
	this.UI.music.position = GAME.UI.getScreenAnchor("TR", 20, {x:0,y:this.UI.music.height});
	this.UI.touchHint.position = GAME.UI.getScreenAnchor("BC", 30);
};

MenuScene.prototype.update = function() {
	
	this.count += 0.08;
	this.logo.scale.x = this.logo.baseScale.x + 0.02*Math.sin(this.count);
	this.logo.scale.y = this.logo.baseScale.y + 0.02*Math.sin(this.count);
	this.logo.rotation = 0.05 * Math.cos(this.count);
	
	this.count2 += 0.01;
	this.bg.tilePosition.x += Math.sin(this.count2);
	this.bg.tilePosition.y += 1;
};

MenuScene.prototype.onSettingsSelected = function(data) {
	data.originalEvent.stopPropagation();
	data.originalEvent.preventDefault();
	
	GAME.stateChange(GAME_STATE.settings);
};

MenuScene.prototype.onMusicToggle = function(data) {

	data.originalEvent.stopPropagation();
	data.originalEvent.preventDefault();
	
	GAME.Globals.isMusicEnabled = !GAME.Globals.isMusicEnabled;
	if (GAME.Globals.isMusicEnabled)
		GAME.SoundManager.playTrack("intro", {loop:-1});
	else
		GAME.SoundManager.stopAll();
		
	this.UI.music.texture = GAME.Globals.isMusicEnabled ? this.UI.music.onTexture : this.UI.music.offTexture;
};

MenuScene.prototype.onResume = function() {
	/////
	this.base.onResume.call(this);
	/////
	GAME.SoundManager.playTrack("intro", {loop:-1});
};

/* ==========================================================================
 Class: Settings Scene
 ========================================================================== */

function SettingsScene(sID) {

	Scene.call(this, sID);
		
}

SettingsScene.prototype = Object.create(Scene.prototype);
SettingsScene.prototype.constructor = SettingsScene;


SettingsScene.prototype.init = function() {
	
	//UI stuff --- must be called before the base class'
	this.UI = {
		title : GAME.UI.createBitmapText("Settings", "", {align:"center"}),
		back : GAME.UI.createButton("back_btn.png", true),
		difficulty : GAME.UI.createInlineSelector("Difficulty:", GAME.Globals.difficulties, {}, this.onSetDifficulty),
	}
	this.UI.back.click = this.UI.back.tap = this.onBackToMenu.bind(this);
	//Displaying the default difficulty
	this.UI.difficulty._options[GAME.Globals.curDifficulty].setActive(true);
	
	//////
	this.base.init.call(this);
	//////
	
	var bgTexture = GAME.AssetManager.fromCache("desk-wood");
	this.bg = new PIXI.TilingSprite(bgTexture, 512, 512);
	this.addChild(this.bg);
};

SettingsScene.prototype.onResize = function() {
	
	this.base.onResize.call(this);
	
	var ss = GAME.getScreenSize();
	this.bg.width = ss.w;
	this.bg.height = ss.h;
};

SettingsScene.prototype.onResizeUI = function() {
	
	this.base.onResizeUI.call(this);
	///
	this.UI.title.position = GAME.UI.getScreenAnchor("TC", 20, {x:-this.UI.title.width*0.5, y:10});
	this.UI.back.position = GAME.UI.getScreenAnchor("TL", 20);
	this.UI.difficulty.position = GAME.UI.getScreenAnchor("MC", 0, {x:-this.UI.difficulty.width*0.5,y:-this.UI.difficulty.height*0.5});
	
};

SettingsScene.prototype.onBackToMenu = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	GAME.stateChange(GAME_STATE.menu);
};

SettingsScene.prototype.onSetDifficulty = function(id) {
	GAME.Globals.curDifficulty = id;
};

/* ==========================================================================
 Class: Episode Scene
 ========================================================================== */

function EpisodeSelectorScene(sID) {

	Scene.call(this, sID);
	
	// Retrived the game init.
	this.preparedBatch = null;
	
};

EpisodeSelectorScene.prototype = Object.create(Scene.prototype);
EpisodeSelectorScene.prototype.constructor = EpisodeSelectorScene;

EpisodeSelectorScene.prototype.preload = function() {
	GAME.AssetManager.pushBatch("episode-selector", this.preparedBatch);
	this.base.preload.call(this, "episode-selector");
};

EpisodeSelectorScene.prototype.init = function() {
	
	//UI stuff --- must be called before the base class'
	this.UI = {
		title : GAME.UI.createBitmapText("Choose an Episode", "", {align:"center"}),
		back : GAME.UI.createButton("exit_btn.png", true),
		left : GAME.UI.createButton("left_arrow_btn.png", true),
		right : GAME.UI.createButton("right_arrow_btn.png", true),
	}
	this.UI.back.anchor = new PIXI.Point(0, 1);
	this.UI.back.click = this.UI.back.tap = this.onBackToMenu.bind(this);
	this.UI.left.anchor = new PIXI.Point(0, 0.5);
	this.UI.left.click = this.UI.left.tap = this.onPrevPage.bind(this);
	this.UI.right.anchor = new PIXI.Point(1, 0.5);
	this.UI.right.click = this.UI.right.tap = this.onNextPage.bind(this);
	this.UI.right.visible = this.UI.left.visible = false;
	
	//////
	this.base.init.call(this);
	//////
	
	var bgTexture = GAME.AssetManager.fromCache("desk-wood");
	this.bg = new PIXI.TilingSprite(bgTexture, 512, 512);
	this.addChild(this.bg);
};

EpisodeSelectorScene.prototype.onAssetsLoaded = function() {
	
	this.thumbs = [];
	for (var i = 0; i < this.preparedBatch.graphic.length; i++) {
		var epthumb = this.createEpisodethumb(this.preparedBatch.graphic[i].episodeId, this.preparedBatch.graphic[i].episodeName);
		this.addChild(epthumb);
		if (i>2) epthumb.visible = false;
		this.thumbs.push(epthumb);
	};

	//Paging
	this.curPage = 1;
	this.totalPages = Math.ceil(this.thumbs.length/3);
	if (this.totalPages > 1) {
		this.UI.paging =  GAME.UI.createText(this.curPage+" / "+this.totalPages, "hintNote", {});
		this.UI.paging.anchor = new PIXI.Point(0.5, 1);
		this.UI.right.visible = this.UI.left.visible = true;
		this.addChild(this.UI.paging);
	}
	
};

EpisodeSelectorScene.prototype.onResize = function() {
	
	this.base.onResize.call(this);
	
	var ss = GAME.getScreenSize();
	this.bg.width = ss.w;
	this.bg.height = ss.h;

	// Thumbnails
	var respScale = GAME.UI.getResponsiveScale();
	var padding = 120 * respScale.x;
	var size = 256 * respScale.x;
	var spacing = 20 * respScale.x;
	var mcAnchorPos = GAME.UI.getScreenAnchor("MC", 0);
	var centerAdj = (this.thumbs.length > 3)?1.5:(this.thumbs.length/2);

	for (var i = 0; i < this.thumbs.length; i++) {
		this.thumbs[i].scale = respScale;
		if (this.thumbs[i].visible)
			this.thumbs[i].position = {x: spacing*0.5+ mcAnchorPos.x + (size+spacing)*(i%3-centerAdj), y: mcAnchorPos.y-size*0.5};
	}

};

EpisodeSelectorScene.prototype.onResizeUI = function() {
	
	this.base.onResizeUI.call(this);
	///
	this.UI.title.position = GAME.UI.getScreenAnchor("TC", 20, {x:-this.UI.title.width*0.5, y:10});
	this.UI.back.position = GAME.UI.getScreenAnchor("BL", 20);
	this.UI.left.position = GAME.UI.getScreenAnchor("ML", 20);
	this.UI.right.position = GAME.UI.getScreenAnchor("MR", 20);
	if (this.UI.paging)
		this.UI.paging.position = GAME.UI.getScreenAnchor("BC", 20);
	
};

EpisodeSelectorScene.prototype.onBackToMenu = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	GAME.stateChange(GAME_STATE.menu);
};

EpisodeSelectorScene.prototype.onPrevPage = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	this.UI.right.alpha = 1;
	if (--this.curPage < 1) {
		this.curPage = this.totalPages;
	}
	this.onPageChanged();
};

EpisodeSelectorScene.prototype.onNextPage = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	this.UI.left.alpha = 1;
	if (++this.curPage > this.totalPages) {
		this.curPage = 1;
	}
	this.onPageChanged();
};

EpisodeSelectorScene.prototype.onPageChanged = function(data) {
	if (this.UI.paging) { this.UI.paging.setText(this.curPage+" / "+this.totalPages); }
	var from = 3*(this.curPage-1);
	var to = (this.thumbs.length > 3*this.curPage) ? 3*this.curPage : this.thumbs.length;
	for (var i = 0; i < this.thumbs.length; i++) {
		if (i>=from && i<to) {
			this.thumbs[i].visible = true;
		} else {
			this.thumbs[i].visible = false;
		}
	}
	this.onResize();
};

EpisodeSelectorScene.prototype.createEpisodethumb = function(episodeId, episodeName) {
	var cont = new PIXI.DisplayObjectContainer();
	var thumbTex;
	/*try {
		var thumbTex = GAME.AssetManager.fromCache("episode."+episodeId+".thumb");
	} catch (err) {
		var thumbTex = new PIXI.Texture.fromFrame("no_thumb_episode.png");
	}*/
	var thumb = new PIXI.Sprite(GAME.AssetManager.fromCache("episode."+episodeId+".thumb"));

	var mask = new PIXI.Graphics();
	mask.beginFill(0x000000, 1);
	mask.drawRoundedRect(0,0,256, 256, 20);
	mask.endFill();
	thumb.mask = mask;
	var text = GAME.UI.createText(episodeName, "hintNote", {stroke:GAME.UI.getNextIdentityColor()});
	
	text.position = {x:thumb.width*0.5, y:thumb.height+35};
	cont.addChild(thumb);
	cont.addChild(mask);
	cont.addChild(text);
	cont.anchor = new PIXI.Point(0.5, 0.5);
	////
	thumb.interactive = thumb.buttonMode = true;
	thumb.click = thumb.tap = this.onEpisodeChosen.bind(this, episodeId);

	return cont;
};

EpisodeSelectorScene.prototype.onEpisodeChosen = function(episodeId, data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	////
	console.log("Chosen episode: "+episodeId);
	this._manager.scenes["episode"].queuedEpisodeID = episodeId;
	/////////
	GAME.stateChange(GAME_STATE.episode);
};

/* ==========================================================================
 Class: Episode Scene
 ========================================================================== */

function EpisodeScene(sID) {

	Scene.call(this, sID);
	
	this.episodes = new Array();
	this.queuedEpisodeID = undefined;
	this.curEpisode = null;
	
};

EpisodeScene.prototype = Object.create(Scene.prototype);
EpisodeScene.prototype.constructor = EpisodeScene;

EpisodeScene.prototype.preload = function() {
	if (this.queuedEpisodeID) {
		if (this.episodes[this.queuedEpisodeID].preloaded) {
			console.log("The episode was already preloaded.");
			this.onAssetsLoaded();
			this.onResume();
		} else {
			console.log("The episode needs preloading.");
			GAME.AssetManager.pushBatch("episode."+this.queuedEpisodeID, this.episodes[this.queuedEpisodeID].getAssets());
			this.base.preload.call(this, "episode."+this.queuedEpisodeID);
		}
	} else {
		console.log("There was no queued Episode to load.");
		GAME.stateChange(GAME_STATE.menu);
	}
};

EpisodeScene.prototype.onAssetsLoaded = function() {
	
	this.base.onAssetsLoaded.call(this);
	///
	if (this.curEpisode)  {
		this.removeChild(this.curEpisode);
	}
	this.curEpisode = this.episodes[this.queuedEpisodeID];
	this.curEpisode.init();
	this.addChild(this.curEpisode);
	//this.queuedEpisodeID = undefined;
};

EpisodeScene.prototype.init = function() {
	
	//UI stuff --- must be called before the base class'
	this.UI = {
		exit : GAME.UI.createButton("exit_btn.png", true),
	}
	this.UI.exit.anchor = new PIXI.Point(0, 1);
	this.UI.exit.click = this.UI.exit.tap = this.onBackToMenu.bind(this);
	
	////
	this.base.init.call(this);
	///EDITOR TOOLS
	
	if (GAME.editMode) {
		var saveControl = this._editor.pushControl("save", "save-btn");
		saveControl.click = saveControl.tap = this.saveAccessData.bind(this);
	}
};

EpisodeScene.prototype.dispatchPuzzle = function(puzzleID, accessIndex) {
	console.log("Dispatching puzzle : " + puzzleID);
	this.lastAccessIndex = accessIndex;
	this._manager.scenes["puzzle"].queuedPuzzleID = puzzleID;
	GAME.stateChange(GAME_STATE.puzzle);
};

EpisodeScene.prototype.markSolved = function() {
	if (this.lastAccessIndex !== undefined) {
		this.curEpisode.markAccessStatus(this.lastAccessIndex, 1);
	}
	this.lastAccessIndex = undefined;
};

EpisodeScene.prototype.getCurAccessData = function() {
	return this.curEpisode.curAccess.getData();
};

EpisodeScene.prototype.saveAccessData = function() {
	GAME.DOM.alertData(this.curEpisode.getPrintData());
};

EpisodeScene.prototype.onResize = function() {
	this.base.onResize.call(this);
	
	this.curEpisode.onResize();
};

EpisodeScene.prototype.onResizeUI = function() {
	
	this.base.onResizeUI.call(this);
	///
	this.UI.exit.position = GAME.UI.getScreenAnchor("BL", 20);
	
};

EpisodeScene.prototype.onResume = function() {
	this.base.onResume.call(this);
	/////
	this.curEpisode.onResume();
};

EpisodeScene.prototype.onBackToMenu = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	GAME.stateChange(GAME_STATE.episodeSelector);
};

/* ==========================================================================
 Class: Puzzle Scene
 ========================================================================== */

function PuzzleScene(sID) {

	Scene.call(this, sID);
	
	this.queuedPuzzleID = undefined;
	
	this.puzzle = null;
	this.tiledText = null;
	this.puzzleSolved = false;
	this.screenPadding = 20;
	this.count = 0;

	// Extracted from within EpisodeScene
	this.curAccessData = null;
};
 
PuzzleScene.prototype = Object.create(Scene.prototype);
PuzzleScene.prototype.constructor = PuzzleScene;

PuzzleScene.prototype.preload = function() {
	if (this.queuedPuzzleID) {
		this.base.preload.call(this, this.queuedPuzzleID);
	} else {
		console.log("There was no queued Puzzle to load.");
		GAME.stateChange(GAME_STATE.episode);
	}
};

PuzzleScene.prototype.onAssetsLoaded = function() {
	
	this.base.onAssetsLoaded.call(this);
	///
	var ss = GAME.getScreenSize();
	
	if (GAME.isPortrait)
		this.puzzleSize = parseInt(ss.w*0.9) - 2*this.screenPadding;
	else
		this.puzzleSize = ss.w*0.5 > ss.h ? ss.h-2*this.screenPadding : parseInt(ss.w*0.5);
	
	// Retrieving texture
	this.texture = GAME.AssetManager.fromCache(this.queuedPuzzleID);
	
	/////
	this.cleanUp();
	////
	this.puzzleSolved = false;
	this.queuedPuzzleID = undefined;
	////
	this.buildPuzzle();
};

PuzzleScene.prototype.init = function() {
	
	//UI stuff --- must be called before the base class'
	this.UI = {
		back : GAME.UI.createButton("back_btn.png", true),
	}
	this.UI.back.position = GAME.UI.getScreenAnchor("TL", 20);
	this.UI.back.click = this.UI.back.tap = this.onBackToEpisode.bind(this);
	
	//////
	this.base.init.call(this);
	//////
	
	var bgTexture = GAME.AssetManager.fromCache("desk-wood");
	this.bg = new PIXI.TilingSprite(bgTexture, 512, 512);
	this.addChild(this.bg);
	
};

PuzzleScene.prototype.cleanUp = function() {
	if (this.puzzle) {
		this.removeChild(this.puzzle);
		this.puzzle = null;
	}
	if (this.puzzleSS) {
		this.removeChild(this.puzzleSS);
		this.puzzleSS = null;
	}
	if (this.tiledText) {
		this.removeChild(this.tiledText);
		this.tiledText = null;
	}
	if (this.speakBtn) {
		this.removeChild(this.speakBtn);
		this.speakBtn = null;
	}
	this.curAccessData = null;
};

PuzzleScene.prototype.update = function() {
	this.count += 0.08;
	if (this.speakBtn) {
		this.speakBtn.scale.x = this.speakBtn.baseScale.x + 0.012*Math.sin(this.count);
		this.speakBtn.scale.y = this.speakBtn.baseScale.y + 0.012*Math.sin(this.count);
	}
};

PuzzleScene.prototype.onResize = function() {
	
	this.base.onResize.call(this);
	
	var ss = GAME.getScreenSize();
	this.puzzle.position = {x:ss.w*0.5, y:ss.h*0.5};
	this.bg.width = ss.w;
	this.bg.height = ss.h;
};

PuzzleScene.prototype.onResizeUI = function() {
	
	this.base.onResizeUI.call(this);
	///
	this.UI.back.position = GAME.UI.getScreenAnchor("TL", 20);
	if (this.speakBtn)
		this.speakBtn.baseScale = GAME.UI.getResponsiveScale();
	
};

PuzzleScene.prototype.buildPuzzle = function() {
	
	this.puzzle = new Puzzle(1, this.texture, this.puzzleSize, this.puzzleSize);
	
	var tileShuffleAreas, areaWH;
	var ss = GAME.getScreenSize();
	if (GAME.isPortrait) {
		tileShuffleAreas = new PIXI.Rectangle(0, 0, ss.w*0.7, (ss.h - this.puzzleSize)*0.4);
	} else {
		tileShuffleAreas = new PIXI.Rectangle(0, 0, (ss.w - this.puzzleSize)*0.4, ss.h*0.7);
	}
	this.puzzle.shuffle(tileShuffleAreas, GAME.isPortrait);
	this.addChild(this.puzzle);
}

PuzzleScene.prototype.onPuzzleCompletion = function() {

	GAME.SoundManager.play("puzzle-completed");
	
	////Notify completion to the Episode Scene
	this._manager.scenes["episode"].markSolved();

	var destPos, destSize;
	var ss = GAME.getScreenSize();
	if (GAME.isPortrait) {
		destPos = {x: ss.w*0.5, y: this.screenPadding + ss.h*0.25};
		destSize = Math.floor(ss.h*0.5 - 20); 
	} else {
		destPos = {x: ss.w*0.5, y: this.screenPadding + ss.h*0.35};
		destSize = Math.floor(ss.h*0.65 - 20);
	}

	//puzzle snapshot
	var puzzleTexture = new PIXI.RenderTexture(this.puzzle.fullW, this.puzzle.fullH);
	this.puzzleSS = new PIXI.Sprite(puzzleTexture);
	puzzleTexture.render(this.puzzle);

	this.addChild(this.puzzleSS);
	this.puzzleSS.pivot = this.puzzle.pivot;
	this.puzzleSS.width = this.puzzle.width;
	this.puzzleSS.height = this.puzzle.height;
	this.puzzleSS.x = this.puzzle.x;
	this.puzzleSS.y = this.puzzle.y;
	
	this.puzzle.clear();

	Tweener.addTween(this.puzzleSS,
		{x:destPos.x, y:destPos.y, width: destSize, height:destSize, time:1.5, delay:0, transition:"easeInOutQuart", 
		onComplete: this.onPuzzleAnimationComplete.bind(this)
	});
	
	// Draw the associated word
	var RS = GAME.UI.getResponsiveScale();
	this.curAccessData = this._manager.scenes["episode"].getCurAccessData();
	this.tiledText = new GAME.UI.TiledText(this.curAccessData.TTSWord);
	
	var ttspeakoffset = GAME.utils.tts.available ? 300 : 120;

	var ttScale = Math.min((ss.w-ttspeakoffset*RS.x)/this.tiledText._width, (ss.h-destPos.y-destSize*0.5-40*RS.x)/this.tiledText._height);
	this.tiledText.scale = new PIXI.Point(ttScale = ttScale>1.4?1.4:ttScale, ttScale);
	this.tiledText.position = {x:ss.w*0.5 ,y:ss.h-this.tiledText._height*ttScale*0.5-20*RS.x};
	this.addChild(this.tiledText);
	
	//speak button
	if (GAME.utils.tts.available) {
		this.speakBtn = GAME.UI.createButton("listen_tts_btn.png", true);
		this.speakBtn.scale = this.speakBtn.baseScale = RS;
		this.speakBtn.position = {x:ss.w*0.5 + this.tiledText._width*ttScale*0.5 + this.speakBtn.width*0.5 + 20*RS.x, y:this.tiledText.y};
		this.speakBtn.anchor = new PIXI.Point(0.5, 0.5);
		this.speakBtn.visible = false;
		this.speakBtn.tap = this.onManualSpeak.bind(this);
		//Exceptional case: this clickevent is not being removed by the Scene's method since is not available at the init time. In android both events trigger.
		if (GAME.environment === GAME_ENVIRONMENT.web)
			this.speakBtn.click = this.onManualSpeak.bind(this);
		this.addChild(this.speakBtn);
	}
	///
	this.tileRoundupTime = this.tiledText._deployTime*1000;
};

PuzzleScene.prototype.onPuzzleAnimationComplete = function() {
	
	setTimeout(this.speakTheWord.bind(this), this.tileRoundupTime > 1000 ? this.tileRoundupTime-1000 : this.tileRoundupTime);
	///
	GAME.SoundManager.setVolume(0.1, 2);
};

PuzzleScene.prototype.speakTheWord = function() {
	GAME.utils.tts.speak(this.curAccessData.TTSWord);
	this.tiledText.deployAnimated();
	this.ttCycleInterval = setInterval(this.onTTCycle.bind(this), this.tileRoundupTime+1400);
	if (this.speakBtn) this.speakBtn.visible = true;
};

PuzzleScene.prototype.onTTCycle = function() {
	this.tiledText.cycleThroughAnimated();
};

PuzzleScene.prototype.onManualSpeak = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	/////
	GAME.utils.tts.speak(this.curAccessData.TTSWord);
};

PuzzleScene.prototype.onBackToEpisode = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	
	if (this.ttCycleInterval) clearInterval(this.ttCycleInterval);
	
	GAME.SoundManager.setVolume(1, 2);
	///
	GAME.stateChange(GAME_STATE.episode);
};