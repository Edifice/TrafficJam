app.controller('GameCtrl', function(
	$scope,
	$state,
	$stateParams,
	$document,
	$ionicActionSheet
	) {
	console.log('Starting game');

	var that = this;
	var speedModifier = 15;
	var numberOfCars = 200;

	gameObjects = [];

	running = true;
	gameOver = false;
	player = {
		speed: 20,			// current speed
		acceleration: 0,
		position: 42,		// percent from left
		width: 16,			// width of the car in percent
		height: 16,			// height of the car in percent
		topPosition: 100 - (16 + 4), // percent of the top of the player
		breaking: false,	// is it breaking currently?
		parameters: {
			// modification in the speed / frame
			acceleration: 0.2,
			breaking: -2
		},
		max: {
			speed: 120
		},
		min:{
			speed: 10
		}
	}

	score = 0;

	backgroundPosition = 0;

	/////////////// Helper functions
	var random = function(min,max){
		return Math.floor(Math.random()*(max-min+1)+min);
	}

	var roundSpeed = function(_speed){
		return Math.round(_speed);
	}

	/////////////// Menu
	$scope.exitToMenu = function(){
		running = false;
		$ionicActionSheet.show({
			buttons: [
				{ text: 'Continue game' },
				{ text: 'Exit' },
				{ text: 'Give up' },
			],
			titleText: 'Menu',
			buttonClicked: function(index) {
				switch(index){
					case 0: 
						running = true;
						break;
					case 1:
						$state.go('menu');
						break;
					case 2:
						die();
						break;
				}
				return true;
			}
		});
	}

	var startAgain = function(){
		$state.transitionTo($state.current, $stateParams, {
			reload: true,
			inherit: false,
			notify: true
		});
	}
	$('#startAgain').on('click touch', function(){
		startAgain();
	});

	/////////////// Animation helpers
	var updateSpeed = function(){
		if (player.breaking){
			if (player.speed > player.min.speed) {
				player.speed += player.parameters.breaking;
			}else{
				player.speed = player.min.speed;
			}
		}else{
			if (player.speed < player.max.speed) {
				player.speed += player.parameters.acceleration;
			}
		}
	}

	var updateBackground = function(){
		var _val = backgroundPosition + (player.speed / (speedModifier / 2));

		if (_val > 32000000) {
			_val = 0;
		};
		backgroundPosition = _val;
		score = Math.round(_val / 60);
	}

	var isDeviceOrientationEventRegistered = false;
	var globalTiltingModifier = 0; // only used when using the program from the browser
	var globalTiltingModifierButton = 0; // only used when using the program from the browser
	var updatePlayerPosition = function() {
		if (navigator.accelerometer) {
			navigator.accelerometer.getCurrentAcceleration(function(acceleration){
				var modifier = (acceleration.x * -1) / 10;
				var newPosition = player.position + modifier;

				// if it's not going out from the road
				if (newPosition > 5 && newPosition < (95 - player.width)) {
					player.position = newPosition;
					player.speed -= Math.abs(modifier); // when turning, we reduce the speed a little
				};
			}, function(){
				console.error('uhh, baj van');
			});
		}else{
			if(window.DeviceOrientationEvent){
				if(!isDeviceOrientationEventRegistered) {
					window.addEventListener("deviceorientation", function (event) {
						globalTiltingModifier = ((event.alpha * -1) / 6) / 10;
					}, true);
					window.addEventListener("keydown", function (event) {
						if(event.keyCode == 37){
							globalTiltingModifierButton = -0.5;
						}
						if(event.keyCode == 39){
							globalTiltingModifierButton = 0.5;
						}
					}, true);
				}

				globalTiltingModifier += globalTiltingModifierButton;
				var newPosition = player.position + globalTiltingModifier;

				// if it's not going out from the road
				if (newPosition > 5 && newPosition < (95 - player.width)) {
					player.position = newPosition;
					player.speed -= Math.abs(globalTiltingModifier / 2); // when turning, we reduce the speed a little
					globalTiltingModifierButton = 0;
				};
				isDeviceOrientationEventRegistered = true;
			}
		}
	}

	var _checkPlayerForOverlaping = function(){
		for(var _j = gameObjects.length; _j > 0; _j--){
			var obj = gameObjects[_j - 1];

			// percentage from left for this object
			var objLeft = (function(line){
				switch(line){
					case 1: return 7;
					case 2: return 30;
					case 3: return 54;
					case 4: return 77;
				}
			})(obj.line);


			// when they are overlapping vertically
			if (
				(player.topPosition + player.height) >= obj.position &&
				(obj.position + player.height) > player.topPosition ){
				// when they are overlapping horizontaly
				if (
					objLeft - player.width < player.position &&
					player.position < objLeft + player.width) {
					return true;
				};
			};
		}
		return false;
	}

	var _checkGameObjectOverlaping = function(obj, otherObj){
		if(obj.id === otherObj.id){
			return false;
		}
		// cars not changing lines, so we only have to check the given line
		if (obj.line != otherObj.line) {
			return false; // there is no overlap
		};

		if(
			(obj.position - player.height) < otherObj.position &&
			(obj.position + player.height) > otherObj.position){
			return true;
		}

		return false;
	}

	var generateGameObject = function(){
		var assignNewValue = function(obj){
			obj.line = random(1, 4);
			obj.speed = random(20, 80);
			obj.position = random(-20, -10000);
		}
		for (var i = 0; i < numberOfCars; i++) {
			var obj = {};
			obj.id = i + 1;
			obj.crashed = false;

			// check for overlaping
			var overlaping = true;
			while(overlaping){
				overlaping = false;
				assignNewValue(obj);
				for(var _j = gameObjects.length; _j > 0; _j--){
					var otherObj = gameObjects[_j - 1];
					if (_checkGameObjectOverlaping(obj, otherObj)) {
						overlaping = true;
					};
				}
			}

			obj.run = function(){

				this.position += ((player.speed - this.speed) * player.parameters.acceleration) / speedModifier;

				var onScreen = function (subject){
					var tolerance = 2
					return (subject.position + player.height) > (0 - tolerance) && subject.position <= (100 + tolerance)
				}

				// check if crashing to other AI cars
				for(var _j = gameObjects.length; _j > 0; _j--){
					var otherObj = gameObjects[_j - 1];
					if (_checkGameObjectOverlaping(this, otherObj)) {
						var crashing = {};
						if(this.position > otherObj.position){
							crashing = this;
						}else{
							crashing = otherObj;
						}
						crashing.speed = 0;
						crashing.crashed = true;
						$('#obj_' + crashing.id).css('background-color', 'red');
					};
				}

				// updateStyle
				if(onScreen(this)){
					$('#obj_' + this.id).css('top', this.position + '%');
				}
				
			};

			obj.dispose = function(){
				delete this;
			};

			gameObjects.push(obj);
			$('#player').after('<div class="car" id="obj_' + obj.id + '"></div>');
			$('#obj_' + obj.id).css('top', obj.position + '%').addClass('line' + obj.line);
		};
	}
	generateGameObject();

	var die = function(){
		gameOver = true;
		running = false;

		//clearInterval(interval);
	}

	/////////////// Breaking
	
	var initBreaking = function(){
		var br = document.getElementById('break');
		if (br == undefined) {
			throw 'Break element is not defined';
		};

		br.addEventListener('touchstart', function(){
			player.breaking = true;
		});

		br.addEventListener('touchend', function(){
			player.breaking = false;
		});
	};
	initBreaking();

	///////////////  Rendering

	// Clear KeyEvent
	function clearKeyEvent() {
		for (var code in that.keys) {
			if (that.keys.hasOwnProperty(code)) {
				that.keys[code] = false;
			}
		}
	}

	// Game Loop
	function gameLoop (argument) {
		var i;

		if(running){
			updateSpeed();
			updateBackground();
			updatePlayerPosition();
			for (i = 0; i < gameObjects.length; i++) {
				gameObjects[i].run();
			}
			if(_checkPlayerForOverlaping()){
				die();
			}
			updateDOM();
		}

		clearKeyEvent();
	}

	var interval = setInterval(gameLoop, 1000 / 60);

	// Update DOM elements
	var updateDOM = function(){
		// Break
		if(player.breaking)
			$('#break').addClass('active');
		else
			$('#break').removeClass('active');

		// Player
		$('#player').css('left', player.position + '%');

		// Gameover sign
		if (gameOver)
			$('#gameover').show();
		else
			$('#gameover').hide();

		// road
		$('#background').css('background-position-y', backgroundPosition + 'px');

		// Stats
		$('#stat_speed').html(roundSpeed(player.speed));
		$('#stat_score').html(score);
	}
});