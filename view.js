var View = {
	
	renderPlayers: function() {
		_.each(Game.Players, function(player){
			if (!player.spaceId) {
				$("#" + player.name).css("display", "none");
			} else {			
				var space = Game.getSpaceById(player.spaceId);
				var x = space.X;
				var y = space.Y;
				$("#" + player.name).css("display", "block").css("left", x + player.xoffset).css("top", y + player.yoffset);
			}

			$("#" + player.name + "_money").text(player.money).toggleClass("debtor", player.money < 0).toggleClass("bankrupt", !!player.bankrupt);
			$("#" + player.name + "_assets").text(player.assets.join(", "));
			if (player.joker == 0){
				$("#" + player.name + "_info").find(".joker").css("display", "none");
			}			
			if (player.joker == 1) {
				$("#" + player.name + "_info").find(".joker").css("display", "none");
				$("#" + player.name + "_info").find(".joker").first().css("display", "inline-block");
			}			
			if (player.joker == 2) {
				$("#" + player.name + "_info").find(".joker").css("display", "inline-block");
			}			
			if (player.debtcard == 0){
				$("#" + player.name + "_info").find(".trump").css("display", "none");
			}			
			if (player.debtcard == 1) {
				$("#" + player.name + "_info").find(".trump").css("display", "none");
				$("#" + player.name + "_info").find(".trump").first().css("display", "inline-block");
			}			
			if (player.debtcard == 2) {
				$("#" + player.name + "_info").find(".trump").css("display", "inline-block");
			}
		});
	},
	
	render: function(){
		this.renderPlayers();
		this.renderLog(Game.messages);
	},
	
	renderLog: function(msgs){
        var ol = $("#log_message");
		ol.append("<li class='turn'> ------- ХОД № " + Game.turnNumber + " -------</li>");
        _.each(msgs, function(msg){
            ol.append("<li class='msg'>" + msg + "</li>");
        });
		ol.scrollTop(ol[0].scrollHeight);
	},
	
	newGame: function(){
		this.render();
	}
};
