var Game = {
	dice: 0,
	
	turnNumber: 0,
	
	messages: [],
	
	getNextSpace: function(spaceId, dice) {
		function goAround(arr, index) {
			index += dice - 1;
			if (index >= arr.length)
				return arr[index - arr.length];
			else
				return arr[index];
		}
	
		if (spaceId.substr(0,2) == "r1"){
			return goAround(Game.Map.Roulette1, Number(spaceId.substr(3)));
		} else if (spaceId.substr(0,2) == "r2") {
			return goAround(Game.Map.Roulette2, Number(spaceId.substr(3)));
		} else if (spaceId.substr(0,2) == "cb") {
			return goAround(Game.Map.Criminal, Number(spaceId.substr(2)));
		} else if (spaceId.substr(0,5) == "inner") {
			return goAround(Game.Map.Inner, Number(spaceId.substr(5)));
		} else if (spaceId.substr(0,5) == "outer") {
			return goAround(Game.Map.Outer, Number(spaceId.substr(5)));
		}
	},
	
	getSpaceById: function(spaceId) {
		if (spaceId.substr(0,2) == "r1"){
			return Game.Map.Roulette1[Number(spaceId.substr(3)) -1];
		} else if (spaceId.substr(0,2) == "r2") {
			return Game.Map.Roulette2[Number(spaceId.substr(3)) - 1];
		} else if (spaceId.substr(0,2) == "cb") {
			return Game.Map.Criminal[Number(spaceId.substr(2)) - 1];
		} else if (spaceId.substr(0,5) == "inner") {
			return Game.Map.Inner[Number(spaceId.substr(5)) - 1];
		} else if (spaceId.substr(0,5) == "outer") {
			return Game.Map.Outer[Number(spaceId.substr(5)) - 1];
		}
	},	
	
	rollDice: function() {
		return Math.floor(Math.random() * 6) + 1;
	},
	
	getMafiaOwner: function(mafia){
		return _.find(Game.Players, function(player){
			return player.assets.indexOf(mafia)>=0;
		});
	},

    getCountryOwner: function(country){
       return _.find(Game.Players, function(player){
           return player.assets.indexOf(country)>=0;
       });
    },
	
	turn: function() {
		if (this.ended)
			return;

		this.turnNumber++;
		var messages = [];
		var bankrupts = 0;
		var self = this;
		
		_.each(Game.Players, function(player){
				if (player.bankrupt) {
					bankrupts++;
					return;
				}
					
				//Пропуск хода
				if (player.hold){
					delete player.hold;
					return;
				}				
				var logMessage = "";
				
				(function playerTurn() {
					var dice = self.rollDice();
					var space = self.getNextSpace(player.spaceId, dice);
					player.spaceId = space.id;
					logMessage += player.name + " выпадает " + dice + ". Клетка \"" + space.name + "\"";
					//ДЕНЬГИ
					if (space.money){
						player.money += space.money;
						logMessage += ". Баланс: " + space.money;
					}
					//ПЕРЕХОД НА КЛЕТКУ
					if (space.go){
						player.spaceId = space.go;
						logMessage += ". Игрок переходит на клетку " + space.go;
					}
					//ПРОПУСК ХОДА
					if (space.hold) {
						player.hold = true;
						logMessage += ". Игрок получает пропуск следующего хода";
					}
					//ДОПОЛНИТЕЛЬНЫЙ ХОД
					if (space.extra) {
						logMessage += ". Игрок получает дополнительный ход. ";
						playerTurn();
					}
					//НАЛОГ
					if (space.tax) {
						var tax = self.rollDice()*self.rollDice()*1000;
						player.money -= tax;
						logMessage += ". C игрока удерживается " + tax;
					}
					//КРАСНАЯ МАФИЯ
					if (space.redmafia) {
						var robbed = player.money;
						if (robbed <= 0) {
							logMessage += ". С игрока нечего взять, он в долгах!";
						} else {
							var owner = Game.getMafiaOwner(space.redmafia);
							if (owner && owner.name == player.name)	{
								logMessage +=". Все в порядке, это наши ребята!";
							} 
							else if (player.joker > 0 && robbed >= 150000){
								player.joker--;
								logMessage += ". Игрок откупился от мафии ДЖОКЕРОМ"
							} 
							else if(!owner) {
                                player.money = 0;
                                logMessage += ". Игрок ограблен мафией " + space.redmafia + "! Мафия поделила между собой деньги игрока";
                            }
							else if (owner.name != player.name) {
								owner.money += robbed;
                                player.money = 0;
                                logMessage += ". Игрок ограблен мафией " + space.redmafia + "! Деньги пошли крестному отцу "+owner.name;
							} else {
                                logMessage += ". Непонятная ситуация";
                            }
						}
					}
					//БЕЛАЯ МАФИЯ
					if (space.whitemafia) {
						if (player.ai){
							var owner = Game.getMafiaOwner(space.whitemafia);
							if ((!owner || owner.name != player.name) && player.money >= 300000) {
							//покупаем мафию
								player.money -= 200000;
								player.assets.push(space.whitemafia);
								logMessage += ". Игрок покупает мафию " + space.whitemafia + "!";
								if (owner) {
									owner.removeFromAssets(space.whitemafia);
									owner.money += 200000;
									logMessage += " Предыдущему хозяину возвращены деньги";
								}
							}
						}
					}
					//РУЛЕТКА
					if (space.roulette) {
						var rid = (Game.rollDice() % 2 == 0)? "r2_1": "r1_1";
						var rdice = Game.rollDice();
						var rspace = Game.getNextSpace(rid, rdice);
						var sum = 0;
						while (!rspace.exit){
							sum += rspace.money;
							player.money += rspace.money;
							rdice = Game.rollDice();
							rspace = Game.getNextSpace(rspace.id, rdice);
						}
						player.spaceId = (Math.random > 0.5)? "cb31": "cb12";			
						logMessage += ". Баланс: " + sum;
					}
					//ЗНАК ВОПРОСА
					if (space.question) {
						logMessage += ". Игрок на знаке вопроса";
						if (player.money > 10000) {
							player.money -= 10000;
							logMessage += ". Игрок выбирает заплатить 10000";
						} else {
							player.hold = true;
							logMessage += ". Игрок выбирает пропуск хода.";
						}
					}
					//СТРАНА
                    if (space.country) {
                        var owner = Game.getCountryOwner(space.country);
						var country = Game.Countries[space.country];
                        //покупаем страну
                        if (!owner && player.money >= 1.5*country.cost){
                            player.money -= country.cost;
                            player.assets.push(country.id);
                            logMessage += ". Игрок инвестирует в страну " + country.name + "!";
                        }
                        //платим за попадание на чужую инвестицию, если инвестор не на бюрокруге
                        else if (owner && owner.name != player.name && owner.spaceId.substr(0,5) != "inner") {
							var money = 0;
							if (country.cost == 100000) {
								if (!country.grandsuite)
									money = 50000;
								else {
									var suited = [];
									_.each(Game.Countries, function(c, key){ if (c.grandsuite == country.grandsuite) suited.push(key);});
									if (_.every(suited, function(s){ return owner.assets.indexOf(s) >= 0;}))
										money = 100000;
									else
										money = 50000;
								}
							} else {
								var suited = [];
								_.each(Game.Countries, function(c, key){ if (c.suite == country.suite) suited.push(key);});
								if (_.every(suited, function(s) { return owner.assets.indexOf(s) >= 0; }))
									money = country.cost * 2;
								else
									money = country.cost / 2;
							}							
							
							if (player.money - money < -200000 && player.joker > 0 && owner.joker <2){
								player.joker--;
								owner.joker++;
								logMessage += ". Инвестор " + owner.name + " получил ДЖОКЕР";
							}
							else if (player.money - money < -200000 && player.debtcard > 0 && owner.debtcard <2){
								player.debtcard--;
								owner.debtcard++;
								logMessage += ". Инвестор " + owner.name + " получил ДОЛГОВОЙ КОЗЫРЬ";
							} else {
								player.money -= money;
								owner.money += money;
								logMessage += ". Инвестору " + owner.name + " выплачено " + money;
							}                            
                        }
                    }
					//ЗЕБРА
					if (space.zebra) {
						var c = Game.rollDice()*100 + Game.rollDice()*10 + Game.rollDice();
						var countries = _.map(_.without(player.assets, "bigboy", "panther"), function(id) {
							return {id: id, cost: Game.Countries[id].cost}; }
						);
						countries = _.sortBy(countries, function(c) { return c.cost; });
						
						//MONEY
						var moneymod = 0;
						if ([111,222, 333, 444, 555, 666, 112, 223, 334, 445, 556, 665].indexOf(c) >= 0) moneymod = 100000;
						if ([141, 212, 323, 414, 535, 636].indexOf(c) >= 0) moneymod = 50000;
						if ([125, 315, 514].indexOf(c) >= 0) moneymod = 25000;
						if ([234, 423, 624].indexOf(c) >= 0) moneymod = 20000;
						if ([243, 432, 632].indexOf(c) >= 0) moneymod = 15000;
						if ([154, 354, 543].indexOf(c) >= 0) moneymod = 10000;
						if ([163, 362, 562].indexOf(c) >= 0) moneymod = 5000;
						if ([215, 415, 614].indexOf(c) >= 0) moneymod = -5000;
						if ([342, 532].indexOf(c) >= 0) moneymod = -10000;
						if ([263, 463, 652].indexOf(c) >= 0) moneymod = -15000;
						if ([254, 453, 643].indexOf(c) >= 0) moneymod = -20000;
						if ([134, 324].indexOf(c) >= 0) moneymod = -25000;
						if (moneymod != 0)
						{
							player.money += moneymod;
							logMessage += ". Изменение баланса: " + moneymod;
						}
						//взять у всех по 25000
						if ([161, 262, 313, 434, 545, 656].indexOf(c) >= 0) {
							_.each(Game.Players, function(_p) { 
								if (_p.name != player.name && !_p.bankrupt && _p.money > 25000) {
									_p.money -= 25000;
									player.money += 25000;
								}
								});
							logMessage += ". Взять у всех по 25000";
						}
						//рулетка
						if ([114, 225, 331, 441, 551, 661].indexOf(c) >= 0){
							var rid = (Game.rollDice() % 2 == 0)? "r2_1": "r1_1";
							var rdice = Game.rollDice();
							var rspace = Game.getNextSpace(rid, rdice);
							var sum = 0;
							while (!rspace.exit){
								sum += rspace.money;
								player.money += rspace.money;
								rdice = Game.rollDice();
								rspace = Game.getNextSpace(rspace.id, rdice);
							}
							logMessage += ". Рулетка. Баланс: " + sum;
						}
						//списание долгов
						if ([115, 226, 332, 442, 552, 662].indexOf(c) >= 0){
							if (player.money < 0){
								player.money = 0;
								logMessage += ". Банк списывает долги";
							}
						}
						//джокер
						if ([122, 233, 344, 455, 566, 644].indexOf(c) >= 0) {
							if (player.joker < 2)
								player.joker++;
							logMessage += ". ДЖОКЕР";
						}
						//козырь
						if ([144, 255, 366, 422, 523, 633].indexOf(c) >= 0) {
							if (player.debtcard < 2)
								player.debtcard++;
							logMessage += ". ДОЛГОВОЙ КОЗЫРЬ";
						}
						//кризисы
						if ([155, 116, 211, 266, 322, 336, 411, 443, 515, 533, 611, 663].indexOf(c) >= 0) {
							if (countries.length > 0) {
								player.removeFromAssets(countries[0].id);
								player.money += countries[0].cost;
								logMessage += ". Кризис. Пропадает страна " + countries[0].id + ", но выплачивается компенсация";
							}						
						}
						if ([121, 454, 525].indexOf(c) >= 0) {
							if (countries.length > 0) {
								player.removeFromAssets(countries[0].id);
								logMessage += ". Пожар. Пропадает страна " + countries[0].id;
							}	
						}
						if ([131, 343, 424, 616, 646].indexOf(c) >= 0) {
							if (countries.length > 0) {
								var index = Math.floor(countries.length * Math.random());
								player.removeFromAssets(countries[index].id);
								logMessage += ". Наводнение. Пропадает страна " + countries[index].id;
							}
						}
						if ([353, 565].indexOf(c) >= 0){
							if (countries.length > 0) {
								var index = Math.floor(countries.length * Math.random());
								player.removeFromAssets(countries[index].id);
								logMessage += ". Землетрясение. Пропадает страна " + countries[index].id;
							}
						}
						if ([151, 166, 221, 242, 311, 363, 433, 464, 511, 553, 626, 655].indexOf(c) >= 0){
							if (countries.length > 0) {
								var index = countries.length - 1;
								player.removeFromAssets(countries[index].id);
								logMessage += ". Революция. Пропадает страна " + countries[index].id;
							}
						}
						//путешествия
						if (c == 123){
							logMessage += ". Игрок отправляется на угол № 1. Баланс: 20000";
							player.spaceId = "outer1";
							player.money += 20000;
						}
						if (c == 124){
							logMessage += ". Игрок возвращается на угол № 1. Баланс: -20000";
							player.spaceId = "outer1";
							player.money -= 20000;
						}
						var go = {
							"126": "zaire",
							"136": "cameroon",
							"145": "nigeria",
							"152": "SA",
							"162": "morocco",
							"165": "algeria",
							"214": "egypt",
							"231": "USA",
							"241": "chile",
							"246": "peru",
							"256": "columbia",
							"264": "CANADA",
							"312": "elsalvador",
							"316": "guatemala",
							"326": "honduras",
							"345": "BRAZIL",
							"351": "venezuela",
							"361": "uruguay",
							"365": "argentina",
							"413": "iraq",
							"421": "pakistan",
							"431": "saudi arabia",
							"436": "JAPAN",
							"456": "jordan",
							"463": "lebanon",
							"512": "syria",
							"516": "USSR",
							"526": "italy",
							"534": "spain",
							"541": "france",
							"561": "UK",
							"564": "finland",
							"613": "norway",
							"621": "sweden",
							"631": "GERMANY",
							"635": "netherlands",
							"645": "luxemburg",
							"653": "belgium"
						};
						var comeback = {
							"132": "zaire",
							"142": "cameroon",
							"146": "nigeria",
							"156": "SA",
							"164": "morocco",
							"213": "algeria",
							"216": "egypt",
							"236": "USA",
							"245": "chile",
							"251": "peru",
							"261": "columbia",
							"265": "CANADA",
							"314": "elsalvador",
							"321": "guatemala",
							"341": "honduras",
							"346": "BRAZIL",
							"356": "venezuela",
							"364": "uruguay",
							"412": "argentina",
							"416": "iraq",
							"426": "pakistan",
							"435": "saudi arabia",
							"451": "JAPAN",
							"461": "jordan",
							"465": "lebanon",
							"513": "syria",
							"521": "USSR",
							"531": "italy",
							"536": "spain",
							"546": "france",
							"563": "UK",
							"612": "finland",
							"615": "norway",
							"625": "sweden",
							"634": "GERMANY",
							"641": "netherlands",
							"651": "luxemburg",
							"654": "belgium"
						};
						var country;
						if (go[c.toString()]){
							country = Game.Countries[go[c.toString()]];
							logMessage += ". Игрок отправляется в " + country.name;
							if (Number(player.spaceId.substr(5)) > Number(country.space.substr(5))){
								logMessage += ". Баланс: 20000";
								player.money += 20000;
							}							
							player.spaceId = country.space;
						}
						if (comeback[c.toString()]){
							country = Game.Countries[comeback[c.toString()]];
							logMessage += ". Игрок возвращается в " + country.name;
							if (Number(player.spaceId.substr(5)) < Number(country.space.substr(5))){
								logMessage += ". Баланс: -20000";
								player.money -= 20000;
							}	
							player.spaceId = country.space;
						}
						if (country){
							var owner = Game.getCountryOwner(country.id);
							//покупаем страну
							if (!owner && player.money >= 1.5*country.cost){
								player.money -= country.cost;
								player.assets.push(country.id);
								logMessage += ". Игрок инвестирует в страну " + country.name + "!";
							}
							//платим за попадание на чужую инвестицию, если инвестор не на бюрокруге
							else if (owner && owner.name != player.name && owner.spaceId.substr(0,5) != "inner") {
								var money = 0;
								if (country.cost == 100000) {
									if (!country.grandsuite)
										money = 50000;
									else {
										var suited = [];
										_.each(Game.Countries, function(c, key){ if (c.grandsuite == country.grandsuite) suited.push(key);});
										if (_.every(suited, function(s){ return owner.assets.indexOf(s) >= 0;}))
											money = 100000;
										else
											money = 50000;
									}
								} else {
									var suited = [];
									_.each(Game.Countries, function(c, key){ if (c.suite == country.suite) suited.push(key);});
									if (_.every(suited, function(s) { return owner.assets.indexOf(s) >= 0; }))
										money = country.cost * 2;
									else
										money = country.cost / 2;
								}							
								
								player.money -= money;
								owner.money += money;
								logMessage += ". Инвестору " + owner.name + " выплачено " + money;
							}
						}
					}
				}());
				//Используем долговой козрь, если ушли глубоко в долги
				if (player.money <= -160000 && player.debtcard > 0) {
					player.money = 0;
					player.debtcard--;
					logMessage += ". Игрок покрывает свои долги долговым козырем.";
				}
				//Проверка денег на конце хода
				if (player.money < -200000 && player.spaceId.substr(0,2) != "cb") {
					var assets = _.map(player.assets, function(a){
						if (a == "bigboy" || a == "panther")
							return { id: a, cost: 100000};
						else
							return {id: a, cost: Game.Countries[a].cost/2} 
					});
					assets = _.sortBy(assets, function(a) { return a.cost; });
					while (player.money < -200000 && assets.length > 0) {
						var a = assets.shift();
						player.money += a.cost;
						player.removeFromAssets(a.id);
						logMessage += ". Игрок продает " + a.id;
					}
					while (player.money < -200000 && (player.joker || player.debtcard)){
						if (player.joker > 0){
							player.money += 50000;
							player.joker--;
							logMessage += ". Игрок продает ДЖОКЕР за 50000";
						}
						if (player.debtcard > 0){
							player.money += 40000;
							player.debtcard--;
							logMessage += ". Игрок продает ДОЛГОВОЙ КОЗЫРЬ за 40000";
						}
					}
					if (player.money < -200000) {
						player.spaceId = "";
						player.bankrupt = true;
						player.money = "БАНКРОТ";
						bankrupts++;
						logMessage += ". Игрок банкрот!";
					}
				}
				messages.push(logMessage);
			});
			
		if (bankrupts == 3){
			Game.ended = true;
			messages.push("ИГРА ЗАКОНЧЕНА!");
		}		
		this.messages = messages;
	},

	newGame: function(){
		this.Players = {
			Red: new Player("red", -24, -24),
			Yellow: new Player("yellow", -8, -24),
			Green: new Player("green", -8, -8),
			Grey: new Player("grey", -24, -8)
		};
		this.messages = ["Игра начата. Все игроки стоят на клетке 1"];
	}
};




