/* ==========================================================================
 Class: Puzzle
 ========================================================================== */

function Puzzle(level, texture, w, h) {
	
	PIXI.DisplayObjectContainer.call(this);
	
	//////////////////////////////
	//////////////////////////////
	//Number of tiles according to the game difficulties
	
	this.pTileCount = 8;
	switch (GAME.Globals.curDifficulty) {
		case 0:
			this.pTileCount = 8;
		break;
		case 1:
			this.pTileCount = 16;
		break;
		case 2:
			this.pTileCount = 32;
		break;
	}
	//////////////////////////////
	//////////////////////////////
	
	//Private
	var privateLevel = 10;
	
	//Public
	this.frameColors = [0x895BFF, 0xE8CF3C, 0x2A97FF, 0xD91958, 0x00D498, 0xEB9E11, 0x16C7E0, 0x60BFFF, 0xFF4223, 0x78C211, 0x00DB43, 0xE565FF];
	this.level = level;
	this.texture = texture;
	this.w = this.texture.width;
	this.h = this.texture.height;
	this.padding = 50;
	this.borderRadius = 5;

	this.fixedTileCount = 0;

	this.finalArt = new PIXI.Sprite(this.texture);
	this.finalArt.position = {x: this.padding, y:this.padding};

	this.build();
	
	this.width = w;
	this.height = h;
};

Puzzle.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Puzzle.prototype.constructor = Puzzle;

Puzzle.prototype.build = function() {
	
	this.shape = null;
	this.puzzle = new PIXI.DisplayObjectContainer();
	this.frame = new PIXI.DisplayObjectContainer();
	//TILES
	this.tiles = new Array();
	
	this.buildFrame();
	this.buildContent();
	
	var renderTexture = new PIXI.RenderTexture(this.frame.width, this.frame.height);
	var frame = new PIXI.Sprite(renderTexture);
	renderTexture.render(this.frame);
	this.frame = frame;
	
	this.addChild(frame);
	this.addChild(this.puzzle);
	
	this.pivot = new PIXI.Point(this.fullW*0.5, this.fullH*0.5);
};

Puzzle.prototype.buildFrame = function() {
	
	this.outlineOffset = 6;
	this.fullW = this.w+this.padding*2;
	this.fullH = this.h+this.padding*2;
	this.iniXY = this.outlineOffset*0.5;
	
	var shape = new PIXI.Graphics();
	shape.beginFill(this.getRandomColor(), 1);
	shape.drawRoundedRect(0, 0, this.fullW, this.fullH, this.borderRadius);
	//shape.drawRect(0, 0, this.fullW, this.fullH);
	shape.endFill();
	
	var outline = new PIXI.Graphics();
	outline.lineStyle(this.outlineOffset, 0x5d3916, 1);
	outline.drawRoundedRect(this.outlineOffset*0.5, this.outlineOffset*0.5, this.fullW-this.outlineOffset, this.fullH-this.outlineOffset, this.borderRadius);
	
	var borderHighlight = new PIXI.Graphics();
	borderHighlight.lineStyle(3, 0xFFFFFF, 0.4);
	borderHighlight.drawRect(this.padding-4, this.padding-4, this.w+7, this.h+7);
	borderHighlight.blendMode = PIXI.blendModes.ADD;
	
	var multTex = new PIXI.Sprite(GAME.AssetManager.fromCache("frame-texture"));
	multTex.blendMode = PIXI.blendModes.MULTIPLY;
	var reflect = new PIXI.Sprite(GAME.AssetManager.fromCache("frame-reflection"));
	reflect.blendMode = PIXI.blendModes.OVERLAY;
	if (GAME.renderer.type == PIXI.WEBGL_RENDERER) {
		reflect.alpha = 0.4;
	}
	////
	reflect.width = multTex.width = this.fullW;
	reflect.height = multTex.height = this.fullH;
	//shape.position = reflect.position = multTex.position = {x:this.iniXY,y:this.iniXY};
	///åå
	this.frame.addChild(shape);
	this.frame.addChild(reflect);
	this.frame.addChild(multTex);
	this.frame.addChild(borderHighlight);
	this.frame.addChild(outline);
};

Puzzle.prototype.buildContent = function() {
	//console.log(PIXI.PolyK.Triangulate([0,0,this.w/2, 0,this.w, 0,this.w, this.h/2,this.w, this.h,this.w/2, this.h, 0,this.h, 0, this.h/2]));
	var voronoi = new Voronoi();
	var bbox = {xl:0,xr:this.w,yt:0,yb:this.h};
	var sites = this.getSites();
	var diagram = voronoi.compute(sites, bbox);
	//console.log(diagram);
	
	var blueprint = new PIXI.Graphics();
	var minX, minY, maxX, maxY;
	var vx, vy, lvx, lvy;
	var tile;
	var tileBounds;
	var vertices;
	for (var i=0; i<diagram.cells.length; i++) {
		
		minX = minY = Number.MAX_VALUE;
		maxX = maxY = -Number.MAX_VALUE;
		//shape.beginFill(0x000000, 1);
		
		vertices = this.getVertexSequence(diagram.cells[i].halfedges);
		blueprint.moveTo(vertices[0].x, vertices[0].y);
		
		for (var j=0;j<vertices.length; j++) {
			
			for (var k=0;k<2;k++) {
				if (k==0) blueprint.lineStyle(8, 0x000000, 0.12); else blueprint.lineStyle(2, 0x000000, 0.2);
				blueprint.moveTo(vertices[j].x, vertices[j].y);
				
				if (j < vertices.length-1) {
					blueprint.lineTo(vertices[j+1].x, vertices[j+1].y);
				}
			}
//			console.log(i+": "+vertices[j].x+" "+vertices[j].y);
			
			if (maxX < vertices[j].x)
				maxX = vertices[j].x;
			if (maxY < vertices[j].y)
				maxY = vertices[j].y;
			if (minX > vertices[j].x)
				minX = vertices[j].x;
			if (minY > vertices[j].y)
				minY = vertices[j].y;
		}
		//blueprint.lineTo(vertices[0].x, vertices[0].y);
		//shape.endFill();
		//draw site
		/*blueprint.beginFill(0xFFFFFF, 1);
		blueprint.moveTo(diagram.cells[i].site.x, diagram.cells[i].site.y);
		blueprint.drawCircle(diagram.cells[i].site.x, diagram.cells[i].site.y, 5);
		blueprint.endFill();*/
		//console.log(minX, minY, maxX-minX, maxY-minY);
		tileBounds = new PIXI.Rectangle(minX, minY, maxX-minX, maxY-minY);
		tile = new PuzzleTile(i,
							  new PIXI.Texture(this.texture, tileBounds),
							  vertices,
							  tileBounds
							  );
		
		tile.id = tile.z = i;
		tile.position.x = minX;
		tile.position.y = minY;
		tile.targetPos = {x: minX, y: minY};
		
		this.tiles.push(tile);
		this.puzzle.addChild(tile);
	}
	
	voronoi = null;
	this.maxTileDepth = i;
	///
	blueprint.blendMode = PIXI.blendModes.MULTIPLY;
	this.frame.addChild(blueprint);
	
	this.puzzle.x = blueprint.x = this.padding;
	this.puzzle.y = blueprint.y = this.padding;
	
};


Puzzle.prototype.shuffle = function(shuffleArea, asPortrait) {
	
	shuffleArea.width *= 1/this.scale.x;
	shuffleArea.height *= 1/this.scale.x;
	
	var getPointInArea = function(offX, offY) {
		var pos = {x: shuffleArea.width*Math.random() + offX, y: shuffleArea.height*Math.random() + offY};
		//console.log(pos);
		return pos;
	};
	var tilesHalf = Math.floor(this.tiles.length*0.5);
	//for the latter shuffle area:
	var offX = shuffleArea.width + this.fullW; 
	var offY = shuffleArea.height + this.fullH;
	/////
	for (var i=0; i<this.tiles.length; i++) {
		if (i<tilesHalf) {
			this.tiles[i].position = asPortrait ?  getPointInArea((-shuffleArea.width + this.fullW)*0.5, -shuffleArea.height) : getPointInArea(-shuffleArea.width, (-shuffleArea.height +this.fullH)*0.5);
			//this.tiles[i].position = {x:0, y:0};
		} else {
			this.tiles[i].position = asPortrait ? getPointInArea(0, this.fullH) : getPointInArea(this.fullW, 0);
		}
		//this.tiles[i].x *= this.scale.x;
		//this.tiles[i].y *= this.scale.x;
		this.tiles[i].x -= this.tiles[i].width*0.5;
		this.tiles[i].y -= this.tiles[i].height*0.5;
	}
};

Puzzle.prototype.clear = function() {
	this.removeChild(this.finalArt);
	this.removeChild(this.frame);
	this.finalArt = null;
	this.frame = null;
};

Puzzle.prototype.checkCompletion = function() {
	this.fixedTileCount++;
	//console.log("Checking puzzle completion: "+this.fixedTileCount+"/"+this.tiles.length);
	if (this.fixedTileCount === this.tiles.length) {
		console.log("Puzzle Completed");
		//Clear tiles 
		for (var i = this.tiles.length - 1; i >= 0; i--) {
			this.puzzle.removeChild(this.tiles[i]);
		}
		this.tiles = null;
		this.addChild(this.finalArt);
		this.removeChild(this.puzzle);
		this.puzzle = null;
		
		//calling the scene's resolution method
		this.parent.onPuzzleCompletion();
	}
};


Puzzle.prototype.getSites = function() {

	var sites = new Array();
	var R = (this.w > this.h ? this.h : this.w)*0.5;
	var r, rand;
	var thetaStep = 2*Math.PI/this.pTileCount;
	var site;
	var toffset;
	for (var i=0; i<this.pTileCount; i++) {
		//http://www.anderswallin.net/2009/05/uniform-random-points-in-a-circle-using-polar-coordinates/
		/*r = R * Math.sqrt(rand);  
		sites.push({x:R+r*Math.cos(rand), y:R+r*Math.sin(rand)});
		console.log("rand: "+rand+"x:"+(r*Math.cos(2*Math.PI*rand))+" y:"+(r*Math.sin(2*Math.PI*rand)));*/
		//OP-2
		/*toffset = (Math.random()>0.5?-1:1)*Math.PI/8;
		site = {x:R+R*Math.cos(thetaStep*i), y:R+R*Math.sin(thetaStep*i)};
		sites.push(step);
		site = {x:R+R*0.5*Math.cos(thetaStep*i), y:R+R*0.5*Math.sin(thetaStep*i)};
		*/
		//OP-3
		site = {x:2*R*Math.random(), y:2*R*Math.random()};
		sites.push(site);
	}
	//console.log(sites);
	return sites;
};

Puzzle.prototype.getVertexSequence = function(edges) {
	
	var ver = new Array();
	var c1;
	var parseUnInt = function(x) {
		x = Number(x) < 0 ? 0 : Number(x);
		return Math.floor(x);
	};
	var parseObjInt = function(pObj) {
		pObj.x = parseUnInt(pObj.x);
		pObj.y = parseUnInt(pObj.y);
		return pObj;
	};
	var lastAdded = first = parseObjInt(edges[0].edge.vb);
	var vaj, vbj;
	edges[0].assigned = true;
	ver.push(lastAdded);
	for(var i=0; i<edges.length;i++) {
		for (var j=0; j<edges.length;j++) {
			if (!edges[j].assigned) {
				vaj = parseObjInt(edges[j].edge.va);
				vbj = parseObjInt(edges[j].edge.vb);
				if (vaj.x === lastAdded.x && vaj.y === lastAdded.y) {
					c1 = true;
					lastAdded = vbj;
					ver.push(lastAdded);
				} else if (vbj.x === lastAdded.x && vbj.y === lastAdded.y) {
					c1 = true;
					lastAdded = vaj;
					ver.push(lastAdded);
				}
				if (c1)
					edges[j].assigned = true;
				c1 = false;
			}
		}
	}
	//console.log(edges);
	ver.push(first);
	return ver;
};

Puzzle.prototype.getNextHighestDepth = function() {
	return ++this.maxTileDepth;
};

Puzzle.prototype.getRandomColor = function() {
	return this.frameColors[parseInt(Math.random()*this.frameColors.length)];
};

/* ==========================================================================
 Class: Puzzle Tile
 ========================================================================== */

function PuzzleTile(id, texture, vertices, shapeBounds) {
	
	//super();
	PIXI.DisplayObjectContainer.call(this);
	
	this.tile = new PIXI.Sprite(texture);
	
	//The desired position within the Puzzle
	this.targetPos = null;
	this.dragging = false;
	this.isFixed = false;
	this.matchOffset = 34;
	
	var hitVer = new Array();
	hitVer.push({});
	var shape = new PIXI.Graphics();
	var shadow = new PIXI.Graphics();
	shape.beginFill(0x000000, 1);	
	hitVer[0].x = vertices[0].x - shapeBounds.x;
	hitVer[0].y = vertices[0].y - shapeBounds.y;
	shape.moveTo(hitVer[0].x, hitVer[0].y);
	for (var j=1; j<vertices.length; j++) {
		hitVer.push({});
		hitVer[j].x = vertices[j].x - shapeBounds.x;
		hitVer[j].y = vertices[j].y - shapeBounds.y;
		shape.lineTo(hitVer[j].x, hitVer[j].y);
		shadow.lineStyle(8, 0x000000, 0.15);
		shadow.moveTo(hitVer[j-1].x, hitVer[j-1].y);
		shadow.lineTo(hitVer[j].x, hitVer[j].y);
		shadow.lineStyle(4, 0x000000, 0.3);
		shadow.moveTo(hitVer[j-1].x, hitVer[j-1].y);
		shadow.lineTo(hitVer[j].x, hitVer[j].y);
	}
	shape.lineTo(hitVer[0].x, hitVer[0].y);
	shadow.lineTo(hitVer[0].x, hitVer[0].y);
	shape.endFill();
	shape.x = 0;
	shape.y = 0;
	this.tile.addChild(shape);
	this.tile.mask = shape;
	///
	//Render the shadow over a texture
	shadow.cacheAsBitmap = true;
	this.shadow = shadow;
	this.addChild(this.shadow);

	/*var shadowTexture = new PIXI.RenderTexture(parseInt(shapeBounds.width), parseInt(shapeBounds.height));
	this.shadow = new PIXI.Sprite(shadowTexture);
	this.addChild(this.shadow);
	shadowTexture.render(shadow);
	shadow.clear();
	delete shadow;*/
	
	//this.addChild(this.tile);
	var renderTexture = new PIXI.RenderTexture(parseInt(shapeBounds.width), parseInt(shapeBounds.height));
	var sprite = new PIXI.Sprite(renderTexture);
	this.addChild(sprite);
	renderTexture.render(this.tile);
	
	shape.clear();
	this.tile = null;
	
	//Mouse/Touch events
	this.interactive = true;
	//TODO: Feed the polygon with the real a/symmetric polygon vertices
	this.hitArea = new PIXI.Polygon(hitVer);
	this.buttonMode = true;
	this.mousedown = this.touchstart = this.onSelection;
	this.mouseup = this.mouseupoutside = this.touchend = this.touchendoutside = this.onDeselection;
	this.mousemove = this.touchmove = this.onDragging;
};

PuzzleTile.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
PuzzleTile.prototype.constructor = PuzzleTile;

PuzzleTile.prototype.onSelection = function(data) {
	data.originalEvent.preventDefault();
	data.originalEvent.stopPropagation();
	//Z-swap
	this.z = this.parent.parent.getNextHighestDepth();
	this.parent.children.sort(GAME.utils.depthCompare);
	//TODO: Focus effect
	//this.shape.visible = true;
	///
	this.dragging = true;
	this.selectionOffset = data.getLocalPosition(this);
	//console.log("Touch start @ tile "+this.id);
};

PuzzleTile.prototype.onDeselection = function(data) {
	//TODO: Blur effect
	//this.shape.visible = false;
	///
	this.dragging = false;
	
	//TILE MATCH
	//Check proximity to target position
	if (Math.abs(this.x-this.targetPos.x) < this.matchOffset && Math.abs(this.y-this.targetPos.y) < this.matchOffset) {
		this.position.x = this.targetPos.x;
		this.position.y = this.targetPos.y;
		///
		this.isFixed = true;
		this.interactive = false;
		this.removeChild(this.shadow);
		this.shadow.clear();
		delete this.shadow;

		this.z = 0;
		this.parent.children.sort(GAME.utils.depthCompare);

		GAME.SoundManager.play("tile-match");

		this.parent.parent.checkCompletion();
	}
	//console.log("Touch end @ tile "+this.id);
};

PuzzleTile.prototype.onDragging = function(data) {
	if (this.dragging) {
		var newPos = data.getLocalPosition(this.parent);
		this.x = newPos.x - this.selectionOffset.x;	
		this.y = newPos.y - this.selectionOffset.y;
	}
};