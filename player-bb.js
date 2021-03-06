var Player = Backbone.Model.extend({
	defaults: {
		money: 100000.0,
		ai: true,
		assets
	}

});

function Player(name, xoffset, yoffset){
	this.name = name;
	this.money = 100000.0;
	this.ai = true;
	this.assets = [];
	this.spaceId = "inner1";
	this.xoffset = xoffset;
	this.yoffset = yoffset;
}

Player.prototype.removeFromAssets = function(asset){
	for (var i=0; i<this.assets.length; i++){
		if (this.assets[i] == asset){
			this.assets.splice(i, 1);
			break;
		}
	}
}