$(document).ready(function(){
	Game.newGame();
	View.render();
	$("#go").click(function() {
		Game.turn();
		View.render();
	});
	$("body").keypress(function (e) {
		var key = e.which;
		if(key == 13)  // the enter key code
		{
			Game.turn();
			View.render();
			return false;  
		}
	});
});