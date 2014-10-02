/*	
 *	KPA Game definition
 *	(c) 2014 gruvy, gruvy.co
 *	v 1.0
 */
/*
 *	GAME LOGIC
 */

var GAME_STATE = {
	intro : 0,
	menu : 1,
	episodeSelector : 2,
	newEpisode : 3,
	episode : 4,
	puzzle : 5,
	puzzleCompleted : 6,
	settings : 7,
};

GAME.editMode = false;
GAME.Globals = {
		
	isMusicEnabled : true,
	difficulties : ["Easy", "Medium", "Hard"],
	curDifficulty : 1,
		
};

GAME.onGameDataLoaded = function(jsonData) {
	var episodeData = jsonData.episodes;
	// SCENE CREATION
	GAME.SceneManager.createScene("menu", "menu");
	GAME.SceneManager.createScene("settings", "settings");
	GAME.SceneManager.createScene("puzzle", "puzzle");
	var episodeSelectorScene = GAME.SceneManager.createScene("episodeSelector", "episodeSelector");
	var episodeScene = GAME.SceneManager.createScene("episode", "episode");
	var episodePrevBatch = {"graphic" : []};
	for (var i = 0; i < episodeData.length; i++) {
		episodeScene.episodes[episodeData[i].id] = new Episode(episodeData[i]);
		episodePrevBatch["graphic"].push({"id": "episode."+episodeData[i].id+".thumb", "src" : "episode/"+episodeData[i].id+"/"+episodeData[i].id+"_thumb.png", "episodeId":episodeData[i].id, "episodeName": episodeData[i].name});
	}
	episodeSelectorScene.preparedBatch = episodePrevBatch;
	
	//LAUNCH THE FIRST SCENE
	GAME.stateChange(GAME_STATE.menu);
};

GAME.stateChange = function(newState) {
	switch (newState) {
		case GAME_STATE.menu:
			GAME.SceneManager.goToScene("menu");
		break;
		case GAME_STATE.settings:
			GAME.SceneManager.goToScene("settings");
		break;
		case GAME_STATE.episodeSelector:
			GAME.SceneManager.goToScene("episodeSelector");
		break;
		case GAME_STATE.episode:
			//go to scene and force preload. Loading exceptions are handled in the EpisodeScene
			GAME.SceneManager.goToScene("episode", true);
		break;
		case GAME_STATE.puzzle:
			//go to scene and force preload
			GAME.SceneManager.goToScene("puzzle", true);
		break;
	}
	GAME.curState = newState;
};

/*
 *	Scene Manager
 */

SceneManager.prototype.createScene = function(type, sID) {
	
	if (this.scenes[sID]) return undefined;
	
	var scene;
	switch(type) {
		case "menu":
			scene = new MenuScene(sID);
		break;
		case "puzzle":
			scene = new PuzzleScene(sID);
		break;
		case "episodeSelector":
			scene = new EpisodeSelectorScene(sID);
		break;
		case "episode":
			scene = new EpisodeScene(sID);
		break;
		case "settings":
			scene = new SettingsScene(sID);
		break;
		default:
			scene = new Scene(sID);
	}
	
	return this._createScene(scene, sID);
	
};

/*
 *	DOM
 */
GAME.DOM.init = function() {
	$("div.lbox a.close, #modal").click(function (e) {
		$("#modal").hide();
		$("div.lbox").hide();
	});
};
GAME.DOM.alertData = function(data) {
	$("#modal").css("display", "block");
	$("#lbox-alert pre").html(data);
	$("#lbox-alert").css("display", "block");
};