/*	
 *	Gruvy Vanilla Game Engine for PIXI.js
 *	(c) 2014 gruvy, gruvy.co
 *	v 1.0
 */
/*

/**
 * Language / PIXI overloads
 */

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

PIXI.DisplayObjectContainer.prototype.maxChildDepth = 0;
PIXI.DisplayObjectContainer.prototype.getNextHighestDepth = function() {
	return ++this.maxChildDepth;
};

/**
 * Some previous assertions
 */

var cordova = null;

/*
 * Please refrain from changing these values if you're not completely aware of the logic around them
 * e.g. in the SoundManager class
 */
var GAME_ENVIRONMENT = {
	web : 0,
	cordova_ios : 1,
	cordova : 10,
	cordova_android : 11,
};

// global namespace
var GAME = GAME || {

	renderer : null,
	FPS: 50,
	curState : null,
	isPortrait : false,
	editMode : false,
	environment : GAME_ENVIRONMENT.web,
	
	init : function() {
		
		PIXI.AUTO_PREVENT_DEFAULT = false;
		
		//console.log("User Agent: "+navigator.userAgent);
		//Unfortunately, automatic audio playback is disabled in some Mobile devices
		//It must be started by the user input.
		//So the music is disabled by default in these, but by enabling it from the home screen
		//toggle button, it will start and remain playing throughout the game
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && GAME.environment === GAME_ENVIRONMENT.web) {
			GAME.Globals.isMusicEnabled = false;
		} else if (GAME.environment === GAME_ENVIRONMENT.cordova) {
			
			switch (cordova.platformId) {
				case "android":
					GAME.environment = GAME_ENVIRONMENT.cordova_android;
				break;
				case "ios":
					GAME.environment = GAME_ENVIRONMENT.cordova_ios;
				break;
			}
			
			/*if (/Android/i.test(navigator.userAgent)) {
				GAME.environment = GAME_ENVIRONMENT.cordova_android;
			} else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
				GAME.environment = GAME_ENVIRONMENT.cordova_ios;
			}*/
		}
		
		console.log("GAME.environment: "+GAME.environment);
		
		/// Text to speech init - called here as a guarantee the device is ready in cordova environments
		
		GAME.utils.tts.init();
		
		//LOAD GAME DATA
		var dataLoader = new PIXI.JsonLoader("game-data.json", false);
		dataLoader.addEventListener("loaded", GAME._onGameDataLoaded);
		dataLoader.load();
	},

	_onGameDataLoaded : function(evt) {
		
		GAME.SceneManager = new SceneManager();
		GAME.SceneManager.init();
	
		GAME.AssetManager = new AssetManager();
		GAME.AssetManager.batches = evt.content.json.assetBatches;
		GAME.AssetManager.init();
		
		// Sound Manager instance
		GAME.SoundManager = new SoundManager();
		GAME.SoundManager.init();
		
		$(window).bind("orientationchange", GAME.checkOrientation);
		$(window).resize(GAME.onResize);
		
		GAME.checkOrientation();
		
		GAME.UI._init();
		
		GAME.DOM._init();
		
		GAME.onGameDataLoaded(evt.content.json);
		
	},
	
	onGameDataLoaded : function() {
		///Should be override in Game.js
	},
	
	updateOrientation : function() {
		console.log("New orientation: " + window.orientation);
	},
	
	getScreenSize : function() {
		return {w:window.innerWidth, h:window.innerHeight};
	},
	
	checkOrientation : function() {
		var isPortrait = (window.innerHeight > window.innerWidth);
		if (isPortrait === GAME.isPortrait ) return;
		GAME.isPortrait = isPortrait;
	},
	
	getCordovaPath : function() {
	
   		var path = window.location.pathname;
    	path = path.substr( 0, path.length - 10 );
    	return 'file://' + path;
    },
	
	onResize : function() {
	    GAME.checkOrientation();
	    var screenWH = GAME.getScreenSize();
	    GAME.renderer.resize(window.innerWidth, window.innerHeight);
	    if (GAME.SceneManager.currentScene.preloaded)
			GAME.SceneManager.currentScene.onResize();
		else
			GAME.UI.Preloader.onResize();
	}
};

/* ==========================================================================
 GAME SCENE-MANAGER
 ========================================================================== */

SceneManager = function() {
	
	this.scenes = {};
	this.currentScene = null;


	this.init = function(w, h) {
		//if (this.renderer) return this;
		if (!w || !h) {
			var screenWH = GAME.getScreenSize();
			if (!w) w = screenWH.w;
			if (!h) h = screenWH.h;
		}
		var renderer = PIXI.autoDetectRenderer(w, h);
		document.body.appendChild(renderer.view);
		GAME.renderer = renderer;
		
		requestAnimFrame(this.loop);
	};
	
	this._createScene = function(scene, sID) {
		scene._manager = this;
		this.scenes[sID] = scene;
		return scene;
	};
	
	this.goToScene = function(sID, forcePreload) {
		
		if (forcePreload === undefined) forcePreload = false;
		if (this.scenes[sID]) {
		    if (this.currentScene) this.currentScene.pause();
		    this.currentScene = this.scenes[sID];
		    if (forcePreload || !this.currentScene.preloaded) {
		    	console.log("scene needs preloading.");
		    	this.currentScene.preload();
		    } else {
		    	this.currentScene.onResume();
		    }
		    console.log("moved to scene: "+this.currentScene.sID);
		    return true;
		}
		return false;
	};
	
	this.loop = function() {
		
		requestAnimFrame(GAME.SceneManager.loop);
		
		if (!GAME.SceneManager.currentScene || GAME.SceneManager.currentScene.paused) return;
		
		GAME.SceneManager.currentScene._update();
		GAME.renderer.render(GAME.SceneManager.currentScene);
		//window.setTimeout(function() {requestAnimFrame(GAME.SceneManager.loop);}, 1000 / GAME.FPS);
	};
	
	this.forceRender = function() {
		if (this.currentScene) {
			GAME.renderer.render(this.currentScene);
			console.log("Render force for: "+this.currentScene.sID);
		}
	};

};

/* ==========================================================================
 Base Class: Scene
 ========================================================================== */

Scene = function(sID) {
	
	PIXI.Stage.call(this, 0xFFFFFF);
	
	this.sID = sID;
	this.preloaded = false;
	this.preloading = false;
	this.paused = false;
	this.initialized = false;
	this.UIInitialized = false;

	this.UICont = new PIXI.DisplayObjectContainer();
}

Scene.prototype = Object.create(PIXI.Stage.prototype);
Scene.prototype.constructor = Scene;
Scene.prototype.base = Scene.prototype;

/**
 * Preload an asset batch
 * @param  {String}   assetbatchID   The string ID of the asset batch to be loaded
 */
Scene.prototype.preload = function(assetbatchID) {
	///required for the preloader rendering
	this.paused = false;
	////
	if (assetbatchID !== undefined) {
		this.preloaded = false;
		this.preloading = true;
		this.addChild(GAME.UI.Preloader);
		GAME.UI.Preloader.onResize();
		var itemCount = GAME.AssetManager.loadBatch(assetbatchID, this.onLoadProgress.bind(this), this.onLoadComplete.bind(this));
		GAME.UI.Preloader.reset(itemCount);
	} else {
		console.log("Preload was skipped.");
		this._start();
	}
};

Scene.prototype.onLoadProgress = function(evt) {
	//console.log(evt);
	GAME.UI.Preloader.update();
};

Scene.prototype.onLoadComplete = function() {
	console.log(this.sID + " preload complete.");
	this._start();
	if (GAME.UI.Preloader) this.removeChild(GAME.UI.Preloader);
};

Scene.prototype._start = function() {
	this.preloading = false;
	this.preloaded = true;
	if (!this.initialized) this.init();
	this.onAssetsLoaded();
	this.onEditorReset();
	this.onUIInit();
	
	//Clean-up by force all mouse-events leaving only touch based ones for mobile environment
	//On android devices both are triggered leading to serious usability issues
	//TODO: Improve this fix
	if (GAME.environment !== GAME_ENVIRONMENT.web) {
		this.forceCleanUpME(this);
	}
	this.onResize();
	this.resume();
};

Scene.prototype.onAssetsLoaded = function() {};

Scene.prototype.init = function() {

	this.initialized = true;
	//Every scene brings their own editor if the mode is active
	if (GAME.editMode) {
		this._editor = new GAME.Editor(this.sID);
		this._editor.position = new PIXI.Point(0, 0);
		this.addChild(this._editor);
	}
};

Scene.prototype.onUIInit = function() {
	if (!this.UIInitialized && this.UI) {
		_.each(this.UI, function(e, i, l) {
			e.interactive = true;
			this.UICont.addChild(e);
		}, this);
		this.addChild(this.UICont);
	}
	this.UIInitialized = true;
};

Scene.prototype.onEditorReset = function() {
	if (GAME.editMode) {
		this.removeChild(this._editor);
		this.addChild(this._editor);
	}
};

Scene.prototype._update = function() {
	if (this.preloaded && !this.paused) {
		this.update();
	} else if (this.preloading) {
		GAME.UI.Preloader._update();
	}
};

Scene.prototype.update = function() { };

Scene.prototype.pause = function() {
	this.paused = true;
	this.wasInteractive = this.interactive;
	this.interactive = false;
	if (this.children) this.disableInteraction(this);
	//Last render to validate interaction changes
	GAME.renderer.render(this);
	console.log(this.sID+" paused.");
};

Scene.prototype.resume = function() {
	this.paused = false;
	this.interactive = (this.wasInteractive !== undefined ) ? this.wasInteractive : this.interactive;
	if (this.children) this.renableInteraction(this);
	// Place the UI always on top
	if (this.UI) {
		this.removeChild(this.UICont);
		this.addChild(this.UICont);
	}
	if (GAME.editMode) {
		this.removeChild(this._editor);
		this.addChild(this._editor);
	}
	console.log(this.sID+" resumed.");
};

Scene.prototype.disableInteraction = function(parent) {
	for (var i = 0; i < parent.children.length; i++) {
		//console.log(this.children[i]);
		if (parent.children[i].interactive) { 
			parent.children[i].interactive = false;
			parent.children[i].wasInteractive = true;
		} else {
			parent.children[i].wasInteractive = false;
		}
		if (parent.children[i].children)
			this.disableInteraction(parent.children[i]);
	}
	//console.log(this.interactionManager.interactiveItems.length);
	/*for (var i = 0; i < this.interactionManager.interactiveItems.length; i++) {
		this.interactionManager.interactiveItems[i].interactive = false;
		this.interactionManager.interactiveItems[i].wasInteractive = true;
	}*/
	return;
};

Scene.prototype.renableInteraction = function(parent) {
	for (var i = 0; i < parent.children.length; i++) {
		if (parent.children[i].wasInteractive) { 
			parent.children[i].interactive = true;
		}
		if (parent.children[i].children)
			this.renableInteraction(parent.children[i]);
	}
	//console.log("renable");
	//console.log(this.interactionManager.interactiveItems.length);
	return;
	/*for (var i = 0; i < this.interactionManager.interactiveItems.length; i++) {
		this.interactionManager.interactiveItems[i].interactive = true;
	}*/
};

/*
 * Force clean-up mouse events
 */

Scene.prototype.forceCleanUpME = function(parent) {
	var item;
	for (var i = 0; i < parent.children.length; i++) {
		//console.log(this.children[i]);
		item = parent.children[i];
		
		if (item.mousedown || item.click || item.mouseup || item.mouseover || item.mousemove || item.mouseupoutside) {
			item.mousedown = item.click = item.mouseup = item.mouseover = item.mousemove = item.mouseupoutside = null;
		}
		if (item.children)
			this.forceCleanUpME(item);
	}
};

Scene.prototype.onResize = function() {

	var ss = GAME.getScreenSize();
	if (this.interactive) this.hitArea = new PIXI.Rectangle(0,0, ss.w, ss.h);
	
	if (this.UI) this.onResizeUI();
	
	if (GAME.editMode) {
		this._editor.onResize();
	}
};

Scene.prototype.onResizeUI = function() {
	_.each(this.UI, function(e, i, c) {
		e.scale = GAME.UI.getResponsiveScale();
	}, this);
};

Scene.prototype.onResume = function() {
	console.log("Scene resume on: "+this.sID);
	this.onResize();
	this.resume();
};


/* ==========================================================================
 GAME ASSET-MANAGER
 ========================================================================== */

AssetManager = function() {

	//Defined in game-data.json
	this.batches = [];
	
	this._hash = [];
	this.queueLoad = false;
	this.assetType = ["graphic", "sound"];
	this.fAssetType = null;
	this.assetsPath = "assets/";

	/**
	 * Called after batch data have been retrieved by the game
	 */
	this.init = function() {
		if (GAME.environment < 10) {
			createjs.Sound.alternateExtensions = ["ogg"];
			createjs.Sound.addEventListener("fileload", this.onFileLoaded.bind(this));
			this.fAssetType = this.assetType;
		} else {
			this.fAssetType = _.filter(this.assetType, function(type){ return type !== "sound"; });
		}
		this.buildHash();
	};
	/**
	 * Pushes a new batch into the collection.
	 * @param  {String}   sID   	The string ID of the array to push
	 * @param  {Object}   batch		The batch. The object must comply with the same structure defined in the game-data JSON file
	 */
	this.pushBatch = function(sID, batch) {
		for (var i = 0; i < this.assetType.length; i++) {
			if (batch[this.assetType[i]] && batch[this.assetType[i]].length > 0) {
				this.batches[this.assetType[i]][sID] = batch[this.assetType[i]];
				//update the hash
				//if (this.assetType[i] == "graphic") {
					for (var j = 0; j < batch[this.assetType[i]].length; j++) {
						//console.log(batch[this.assetType[i]][j].src);
						this._hash[this.assetType[i]][batch[this.assetType[i]][j].id] = this.assetsPath + this.assetType[i] + "/" + batch[this.assetType[i]][j].src;
					}
				//}
			}
		}
		//console.log(this._hash["graphic"]["stage.farm.art"]);
	};
	/**
	 * Join 2 existing batches using their ids
	 * @return {void}
	 */
	this.joinBatches = function(toID, fromID) {
		for (var i = 0; i < this.assetType.length; i++) {
			if (this.batches[this.assetType[i]][toID] && this.batches[this.assetType[i]][fromID]) {
				this.batches[this.assetType[i]][toID] = this.batches[this.assetType[i]][toID].concat(this.batches[this.assetType[i]][fromID]);
			}
		}
	};
	/**
	 * Triggers the loading process
	 * @return {void}
	 */
	this.loadBatch = function(sID, _itemLoadedCallback, _allLoadedCallback, _autoload) {
		//if (typeof batch === string)
		this.itemLoadedCallback = _itemLoadedCallback;
		this.allLoadedCallback = _allLoadedCallback;
		this.typeIt = 0;
		this.cbSID = sID; //cur batch string ID
		this.loadNext();
		//get total item count
		var itemCount = 0;
		for (var i = 0; i < this.fAssetType.length; i++) {
			if (this.batches[this.fAssetType[i]][sID]) {
				itemCount += this.batches[this.fAssetType[i]][sID].length;
			}
		}
		return itemCount;
	};
	
	this.loadNext = function() {
		
		if (this.typeIt < this.fAssetType.length) {
			
			var curType = this.fAssetType[this.typeIt];
			var batch = this.batches[this.fAssetType[this.typeIt]][this.cbSID];
			
			this.typeIt++;

			if (batch && batch.length > 0) {

				this.batchItemCount = 0;
				this.batchItemTotal = batch.length;

				switch (curType) {
					case "graphic":
						this.loader = new PIXI.AssetLoader(this.getBatchURLs(batch, "graphic"));
						this.loader.onProgress = this.onFileLoaded.bind(this);
						this.loader.load();
					break;
					case "sound":
						createjs.Sound.registerManifest(batch, this.assetsPath+"sound/");
					break;
				}
			} else {
				this.loadNext();
			}
		
		} else {
			this.allLoadedCallback();
		}
		
	};
	
	this.onFileLoaded = function(evt) {
		this.batchItemCount++;
		this.itemLoadedCallback(evt);
		if (this.batchItemCount === this.batchItemTotal) {
			this.loadNext();
		}
	};
	
	//Helper function
	this.getBatchURLs = function(batch, type) {
		var URLs = [];
		for (var i = batch.length - 1; i >= 0; i--) {
			URLs.push(this.assetsPath + type + "/" + batch[i].src);
		};
		return URLs;
	};
	this.buildHash = function() {
		var type;
		//console.log(this.assetType);
		for (var i = 0; i < this.assetType.length; i++) {
			type = this.assetType[i];
			this._hash[type] = [];
			if (this.batches[type]) {
				for(var key in this.batches[type]) {
					for (var j=0; j<this.batches[type][key].length; j++) {
						this._hash[type][this.batches[type][key][j].id] = this.assetsPath + type + "/" + this.batches[type][key][j].src;
						//console.log(this.assetsPath + type + "/" + this.batches[type][key][j].src);
					}
				}
			}
		}
	};
	this.getURL = function(id, assetType) {
		return this._hash[assetType?assetType:"graphic"][id];
	};
	/*
	 * Only for PIXI assets
	 */
	this.fromCache = function(id) {
		//console.log("from cache: "+this.getURL(id));
		return PIXI.TextureCache[this.getURL(id)];
	}

};

/* ==========================================================================
 GAME SOUND MANAGER
 ========================================================================== */
 
 
SoundManager = function() {
	
	//help variable for volume interpolation
	this.volume01 = 1;

	this.mediaInstances = {};
	this.mediaPath = "";
	
	this.init = function() {
		if (GAME.environment !== GAME_ENVIRONMENT.web) {
			switch (cordova.platformId) {
				case "android":
					this.mediaPath = GAME.getCordovaPath();
				break;
			}
		}
	};
	
	this.playTrack = function(id, _options) {
		if (GAME.Globals.isMusicEnabled) {
			
			if (this.mediaInstances[id]) {
				if (!this.mediaInstances[id].isPlaying) {
					this.stopAll();
					this.resume(id);
				}
			} else {
				this.stopAll();
				this._play(id, _options);
			}
		}
	};
	
	this.play = function(id, _options) {
		
		if (GAME.environment >= GAME_ENVIRONMENT.cordova) {
			if (this.mediaInstances[id]) {
				if (!this.mediaInstances[id].isPlaying) {
					this.resume(id);
				} else {
					this._play(id, _options);
				}
			}
		} else {
			this._play(id, _options);
		}
	};
	
	this._play = function(id, _options) {
		
		var url = GAME.AssetManager.getURL(id, "sound");
		if (url === undefined) {
			console.log("SoundManager / couldn't play sound: URL for id '"+id+"' not defined.");
			return;
		}
		
		if (_options === undefined) _options = {};
		
		if (GAME.environment >= GAME_ENVIRONMENT.cordova) {
		
			this.mediaInstances[id] = new Media(this.mediaPath + GAME.AssetManager.getURL(id, "sound"), this.onSuccess, this.onError, this.onStatus.bind(this, id));
			
			this.mediaInstances[id].play();
			
		} else {
			
			createjs.Sound.play(id, _options);
			this.mediaInstances[id] = {};
			
		}
		////
		this.mediaInstances[id].isPlaying = true;
		this.mediaInstances[id].enabled = true;
		this.mediaInstances[id]._options = _options;
		
		console.log("SoundManager / playing: "+id);
		
	};
	
	this.resume = function(id) {
		if (GAME.environment >= GAME_ENVIRONMENT.cordova) {
			this.mediaInstances[id].play();
		} else {
			createjs.Sound.play(id, this.mediaInstances[id]._options);
		}
		this.mediaInstances[id].isPlaying = this.mediaInstances[id].enabled = true;
		
		console.log("SoundManager / resuming: "+id);
	};
	
	this.stopAll = function() {

		if (GAME.environment >= GAME_ENVIRONMENT.cordova) {
			_.each(this.mediaInstances, function(e, i, c){
				e.stop();
				e.enabled = false;
				e.release();
			}, this);	
		} else {
			createjs.Sound.stop();
		}
		/// Resetting flags now that they've served well
		_.each(this.mediaInstances, function(e, i, c){
			e.isPlaying = e.enabled = false;
		});
		
	};

	this.setVolume = function(vol01, fadingTime) {
		console.log("Setting volume to: "+vol01+", fadingTime: "+fadingTime);
		if (fadingTime == undefined || fadingTime == 0) {
			this.volume01 = vol01;
			this.onVolumeUpdate();
		} else {
			Tweener.addTween(this, {
				volume01:vol01, time:fadingTime, delay:0, onUpdate: this.onVolumeUpdate.bind(this)
			});
		}
	};

	this.onVolumeUpdate = function() {
		
		if (GAME.environment >= GAME_ENVIRONMENT.cordova) {
			_.each(this.mediaInstances, function(e, i, c){
				e.setVolume(this.volume01);
			}, this);	
		} else {
			createjs.Sound.setVolume(this.volume01);	
		}
	};
	
	/**
	 * For Apache Cordova Media plugin usage only
	 */
	 
	this.onStatus = function(id, status) {
		//Handling looped tracks
		//alert(id+" "+this.mediaInstances[id].status);
		if (this.mediaInstances[id].enabled && status === Media.MEDIA_STOPPED) {
			//alert(id+2);
			if (this.mediaInstances[id]._options.loop === -1) {	
				//alert("media stopped "+_id+status);
				this.mediaInstances[id].play();
			} else {
				this.mediaInstances[id].isPlaying = false;
			}
		} 
	};
	
	this.onSuccess = function() {
		console.log("playAudio():Audio Success");
	};
	
	this.onError = function(error) {
		console.log('code: '    + error.code    + '\n' +
	          		'message: ' + error.message + '\n');
	};
	
};


/* ==========================================================================
 GAME Utils
 ========================================================================== */

GAME.utils = {

	depthCompare : function(a,b) {
		if (a.z < b.z)
			return -1;
		if (a.z > b.z)
			return 1;
		return 0;
	},
	
	getScaleRel : function(w, h) {
		return (w > h) ? h/w : w/h;
	},
	
	getRandomInRange : function(a, b) {
		return a+(b-a)*Math.random();
	},
	
	getWhiteSpaces : function(count) {
		var str = "";
		for (var i = 0; i < count; i++) {
			str += "enps;"
		}
		return str;
	},
	
	trimFloat : function(val, decimalDigits) {
		return parseInt(val * Math.pow(10, decimalDigits))/Math.pow(10, decimalDigits);
	},
	
	fillScreen : function(displayObject) {
		var ss = GAME.getScreenSize();
		var scaleRel = GAME.utils.getScaleRel(displayObject.width, displayObject.height);
		if (GAME.isPortrait) {
			displayObject.height = ss.h;
			displayObject.width = ss.h / scaleRel;
			if (displayObject.width < ss.w) {
				displayObject.width = ss.w;
				displayObject.height = ss.w * scaleRel;
			}
		} else {
			displayObject.width = ss.w;
			displayObject.height = ss.w * scaleRel;
			if (displayObject.height < ss.h) {
				displayObject.height = ss.h;
				displayObject.width = ss.h / scaleRel;
			}
		}
		displayObject.position = {x:ss.w*0.5, y:ss.h*0.5};
	},
	
	fitScreen : function(displayObject) {
		var ss = GAME.getScreenSize();
		var scaleRel = GAME.utils.getScaleRel(displayObject.width, displayObject.height);
		if (GAME.isPortrait) {
			displayObject.height = ss.h;
			displayObject.width = ss.h / scaleRel;
			if (displayObject.width > ss.w) {
				displayObject.width = ss.w;
				displayObject.height = ss.w * scaleRel;
			}
		} else {
			displayObject.width = ss.w;
			displayObject.height = ss.w * scaleRel;
			if (displayObject.height > ss.h) {
				displayObject.height = ss.h;
				displayObject.width = ss.h / scaleRel;
			}
		}
		displayObject.position = {x:ss.w*0.5, y:ss.h*0.5};
	},
	
	getRandomRGBString : function() {
	    var letters = '0123456789ABCDEF'.split('');
	    var color = '#';
	    for (var i = 0; i < 6; i++ ) {
	        color += letters[Math.floor(Math.random() * 16)];
	    }
	    return color;
	},

};

/*
 * Text To Speech util
 */

TTS = function() {

	this.ssu = null;
	this.targetVoices = ["Victoria", "Agnes", "Junior"];
	this.available = false;

	this.init = function() {
		
		if ('speechSynthesis' in window) {
			
			this.ssu = new SpeechSynthesisUtterance();
			
			this.ssu.lang = 'en-US';

			this.ssu.volume = 1;
			this.ssu.rate = 0.6;
			this.ssu.pitch = 1;
			this.ssu.volume = 1;
			
			this.setVoice();
			
			window.speechSynthesis.onvoiceschanged = this.onVoicesAvailable.bind(this);
			
			this.available = true;
			console.log("Speech synthesis is available");
		
		}/* else {
		
			switch (GAME.environment) {
				case GAME_ENVIRONMENT.cordova_android:
				
					window.plugins.tts.startup(this.onPluginStartup.bind(this), this.onPluginFail.bind(this));
								
				break;
			}
		}*/
	};

	this.speak = function(str) {
		
		if (this.ssu !== null) {
			this.ssu.text = str;
			window.speechSynthesis.speak(this.ssu);
			//console.log(this.ssu);
		}
	};

	this.setVoice = function() {
		var voices = window.speechSynthesis.getVoices();
		//console.log(voices);
		// Echoes all available voices
		/*_.each(voices, function(e,i,c) {
			console.log(e);
		});*/
		// Perfom a search of voices in preference order
		if (voices) {
			for (var i = 0; i < this.targetVoices.length; i++) {
				this.ssu.voice = _.find(voices, function (v) { if (v === undefined) return false; return v.name === this.targetVoices[i]; }, this);
				if (this.ssu.voice)
					break;
			};
		}
	};
	
	this.onVoicesAvailable = function() {
		this.setVoice();
	};
	
	this.onPluginStartup = function(result) {
		console.log("TTS onPluginStartup result: "+result);
		if (result === 2) {
			window.plugins.tts.speak("The text to speech service is ready");
		}
	};
	
	this.onPluginFail = function(result) {
		console.log("TTS onPluginFail: "+result);
	};
	
};


GAME.utils.tts = new TTS();


/* ==========================================================================
 GAME UI
 ========================================================================== */

GAME.UI = {
	
	iPIt : -1, /*Identity Palette Iterator*/
	
	identityPalette : [
		"#13a2a5"/*light blue*/, 
		"#d1155d"/*magenta*/, 
		"#e57b1c"/*orange*/, 
		"#2a9617"/*green*/, 
		"#6b24aa"/*purple*/, 
		"#c42818"/*red*/
	],
	
	_init : function() {
		
		GAME.UI.Preloader.init();
	
		if (typeof GAME.UI.init === 'function')
			GAME.UI.init();
	},
	
	getNextIdentityColor : function() {
		GAME.UI.iPIt = (GAME.UI.iPIt > GAME.UI.identityPalette.length-2)?0:++GAME.UI.iPIt;
		return GAME.UI.identityPalette[GAME.UI.iPIt];
	},
	
	getResponsiveScale : function(min) {
		var rs = Math.max(min?min:0.5, Math.min(GAME.getScreenSize().w/1200, 1.4));
		return new PIXI.Point(rs,rs);
	},
	
	getTextStyles : function(styleSetID) {
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
	},
	
/**
 * Returns a PIXI.Text instance with the styles associated to the passed styleSID
 */
	createText : function(str, styleSetID, _props) {
		
		var props = GAME.UI.getTextStyles(styleSetID);
		////
		if (_props !== undefined)
			props = _.extend(props, _props);

		var text = new PIXI.Text(str, props);
		////
		switch (props.align) {
			case "center":
				text.anchor.x = text.anchor.y = 0.5;
			break;
		}
		return text;
	},
	
	getBitmapTextStyles : function(styleSetID) {
		return undefined;
	},

	createBitmapText : function(str, styleSetID, _props) {
		
		var props = GAME.UI.getBitmapTextStyles(styleSetID);
		if (props === undefined)
			return null;

		if (_props !== undefined)
			props = _.extend(props, _props);

		var text = new PIXI.BitmapText(str, props);
		return text;

	},
	
	createButton : function (textureID, isFromFrame) {
		var control;
		if (isFromFrame)
			control = new PIXI.Sprite.fromFrame(textureID);
		else
			control = new PIXI.Sprite(GAME.AssetManager.fromCache(textureID));
		control.interactive = true;
		control.buttonMode = true;
		return control;
	},

	createUIButton : function(label, _props, _callback) {
		var cont = new PIXI.DisplayObjectContainer(); 
		var text = GAME.UI.createText(label, "UIComponent");
		var base = new PIXI.Graphics();
		//tinting for PIXI.Graphics doesn't work on canvas yet, so a second base shape must be created
		var base2 = new PIXI.Graphics();
		///
		var w = text.width + 40;
		var h = 65;
		///
		base.beginFill(_props.fill, 0.9);
		base.drawRoundedRect(0, 0, w , h, 10);
		base.endFill();
		cont.addChild(base);
		base2.beginFill(_props.activeFill, 0.9);
		base2.drawRoundedRect(0, 0, w , h, 10);
		base2.endFill();
		base2.visible = false;
		cont.addChild(base2);

		text.position = {x:20, y: 15};
		cont.interactive = cont.buttonMode = true;
		cont.addChild(text);
		///
		cont.hitArea = new PIXI.Rectangle(0, 0, w, h);
		cont._base = base;
		cont._base2 = base2;
		cont._baseFill = _props.fill;
		cont._activeFill = _props.activeFill;
		cont.anchor = new PIXI.Point(0, 0.5);
		
		cont.setActive = function(active) {
			if (active) {
				for (var i = 0; i < this._selector._options.length; i++) {
					this._selector._options[i].setActive(false);
				};
				this._base.visible = false; this._base2.visible = true;
				//this._base.tint = this._activeFill;
			} else {
				this._base.visible = true; this._base2.visible = false;
				//this._base.tint = this._baseFill;
			}
		};

		cont.click = cont.tap = function() {
			this.setActive(true);
			_callback(this.id);
		};

		return cont;
	},

	/**
	 * Creates a radio-button-type generic selector, for options handling
	 * @param  string 			label   The label to display for the options set
	 * @param  Array of string 	options 	The list of options to choose from
	 * @param  object 			_props   style properties conforming with the PIXI.text customization properties
	 * @return void
	 */
	createInlineSelector : function(label, options, _props, _callback) {
		var cont = new PIXI.DisplayObjectContainer();
		var lbl = GAME.UI.createText(label, "", {});
		lbl.y = 8;
		cont.addChild(lbl);
		cont._options = [];
		////
		var spacing = 10;
		var offset = lbl.width + spacing + 20;
		for (var i = 0; i < options.length; i++) {
			var opt = GAME.UI.createUIButton(options[i], {fill: 0x985e34, activeFill:0x5d3916, isToggle:true}, _callback);
			opt.id = i;
			cont.addChild(opt);
			opt.x = offset;
			opt._selector = cont;
			offset += opt.width + spacing/*padding*/;
			cont._options.push(opt);
		};
		cont.anchor = new PIXI.Point(0, 0.5);
		cont._width = offset;
		return cont;
	},
	
	getScreenAnchor : function(id, padding, offset) {
		var coords;
		var ss = GAME.getScreenSize();
		if (padding === undefined) padding = 0;
		padding *= GAME.UI.getResponsiveScale().x;
		switch (id) {
			case "TR":
				coords = {x:ss.w-padding, y:padding};	
			break;
			case "BL":
				coords = {x:padding, y:ss.h-padding};	
			break;
			case "BR":
				coords = {x:ss.w-padding, y:ss.h-padding};	
			break;
			case "ML":
				coords = {x:padding, y:ss.h*0.5};	
			break;
			case "MR":
				coords = {x:ss.w-padding, y:ss.h*0.5};		
			break;
			case "TC":
				coords = {x:ss.w*0.5, y:padding};	
			break;
			case "BC":
				coords = {x:ss.w*0.5, y:ss.h-padding};		
			break;
			case "MC":
				coords = {x:ss.w*0.5, y:ss.h*0.5};		
			break;
			//case "TL" :
			default:
				coords = {x:padding, y:padding};
		}
		if (offset !== undefined) {
			coords.x += offset.x;
			coords.y += offset.y;
		}
			
		return coords;
	},
	
};

/* ==========================================================================
 Class: Preloader
 ========================================================================== */

Preloader = function() {
	
	PIXI.DisplayObjectContainer.call(this);
	
	this.barSize = {w:300, h:30};
	this.borderThickness = 8;
	this.barPadding = 0;
	this.curCount = this.itemCount = 0;
	
	this.bgColor = 0xFFFFFF;
	this.barColor = 0x03ce67;
	this.barFrameColor = 0x666666;
	
	///ProgressBar 
	this.bar = new PIXI.Graphics();
	this.barCont = new PIXI.DisplayObjectContainer();
	
	//Progress loop
	
};

Preloader.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Preloader.prototype.constructor = Preloader;

Preloader.prototype.init = function() {
	
	this.setAppearance();
	
	if (this.bg === undefined) {
		this.bg = new PIXI.Graphics();
		this.bg.beginFill(this.bgColor, 1);
		var ss = GAME.getScreenSize();
		this.bg.drawRect(0, 0, ss.w+100, ss.h+100);
	}
	
	this.addChild(this.bg);
	
	//FramebarColor
	var frame = new PIXI.Graphics();
	frame.lineStyle(this.borderThickness, this.barFrameColor, 1);
	frame.drawRoundedRect(-this.barSize.w*0.5, -this.barSize.h*0.5, this.barSize.w + (this.barPadding+this.borderThickness)*2, this.barSize.h, this.borderThickness);
	this.barCont.addChild(frame);
	//Bar
	this.bar.position = {x:-this.barSize.w*0.5+this.borderThickness+this.barPadding, y:-this.barSize.h*0.5+this.borderThickness+this.barPadding};
	this.bar.beginFill(this.barColor, 1);
	this.bar.drawRect(0, 0, this.barSize.w, this.barSize.h - (this.barPadding+this.borderThickness)*2);
	///
	this.barCont.anchor = new PIXI.Point(0.5, 0.5);
	this.barCont.addChild(this.bar);
	
	//Progress animation loop
	if (this.loop !== undefined) {
		this.loop.position = this.bar.position;
		this.barCont.addChild(this.loop);
	}
	
	this.addChild(this.barCont);
	
	this.progressLoopTex = PIXI.Texture.fromImage('js/lib/gruvy/assets/ui/progress_bar_loop.png');
	
	if (this.progressLoopTex.baseTexture.hasLoaded) {
		this.onLoopTexLoaded();
	} else {
		this.progressLoopTex.on('update', this.onLoopTexLoaded.bind(this));
	}
	
	if (this.bgTexture.baseTexture.hasLoaded) {
		this.onBgTextureLoaded();
	} else {
	    //you have to wait for it to load
		this.bgTexture.on('update', this.onBgTextureLoaded.bind(this));
	}
	
};

Preloader.prototype.setAppearance = function() {
	this._setAppearance({});
};

Preloader.prototype._setAppearance = function(props) {
	
	if (props.bgColor !== undefined)
		this.bgColor = props.bgColor;
	if (props.barColor !== undefined)
		this.barColor = props.barColor;
	if (props.barFrameColor !== undefined)
		this.barFrameColor = props.barFrameColor;
	
	if (props.bgTexture !== undefined) {
		this.bgTexture = PIXI.Texture.fromImage(props.bgTexture);
	}
};

Preloader.prototype.onLoopTexLoaded = function() {
	this.loop = new PIXI.TilingSprite(this.progressLoopTex, this.barSize.w, this.barSize.h-(this.barPadding+this.borderThickness)*2);
	this.loop.position = this.bar.position;
	this.barCont.addChild(this.loop);
};

Preloader.prototype.onBgTextureLoaded = function() {
	this.removeChild(this.bg);
	this.removeChild(this.barCont);
	this.bg = new PIXI.TilingSprite(this.bgTexture, 512, 512);
	this.addChild(this.bg);
	this.addChild(this.barCont);
	this.onResize();
};

Preloader.prototype.reset = function(itemCount) {
	this.progress01 = 0;
	this.itemCount = itemCount;
	this.curCount = 0;
	this.bar.scale = new PIXI.Point(0, 1);
};

Preloader.prototype._update = function() {
	if (this.loop) this.loop.tilePosition.x += 1;
};

Preloader.prototype.update = function() {
	this.curCount++;
	this.progress01 = this.curCount/this.itemCount;
	//console.log(this.progress01);
	this.bar.scale = new PIXI.Point(this.progress01, 1);
};

Preloader.prototype.onResize = function () {
	var ss = GAME.getScreenSize();
	this.bg.width = ss.w;
	this.bg.height = ss.h;

	this.barCont.scale = GAME.UI.getResponsiveScale();
	
	this.barCont.position = GAME.UI.getScreenAnchor("MC", 0);

};

GAME.UI.Preloader = new Preloader();

/* ==========================================================================
 GAME DOM extensions
 ========================================================================== */
 
GAME.DOM = {
	
	_init : function() {
		 /*
	    * Rubberband scrolling disabling for iOS
	    */
	    document.body.addEventListener('touchmove', function(event) {
	      //console.log(event.source);
	      //if (event.source == document.body)
	        event.preventDefault();
	    }, false);
	 
	    window.onresize = function() {
	    	$(document.body).width(window.innerWidth).height(window.innerHeight);
	    }
	 
	    $(function() {
	    	window.onresize();
	    });
	    
	    
	    ///////
	    if (typeof GAME.DOM.init === "function")
			GAME.DOM.init();

	}
	
};


