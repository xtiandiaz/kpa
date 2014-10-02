/*require.config({
	baseUrl: "js",
});

requirejs(['lib/jquery', 
		   'lib/underscore', 
		   'lib/pixi', 
		   'lib/t', 
		   'lib/voronoi', 
		   'lib/soundjs',
		   'gruvy/vanilla',
		   'game/editor',
		   'game/episode',
		   'game/scene',
		   'game/puzzle',
		   'game/ui',
		   'game/game'
		  ],
function () {
	
	if (cordova) {
    	app.initialize();
    } else {
        $(document).ready(function() {
        	GAME.init();
        });
	}
	
});*/

var app = {
	// Application Constructor
	initialize: function() {
		GAME.environment = GAME_ENVIRONMENT.cordova;
	    this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents: function() {
	    document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicity call 'app.receivedEvent(...);'
	onDeviceReady: function() {
	
		StatusBar.hide();
		screen.lockOrientation('landscape');
		
		GAME.init();
		
	    app.receivedEvent('deviceready');
	},
	// Update DOM on a Received Event
	receivedEvent: function(id) {
		
	}
	
};