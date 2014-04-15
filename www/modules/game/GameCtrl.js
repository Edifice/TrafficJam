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

	$scope.gameObjects = [];

	$scope.running = true;
	$scope.gameOver = false;
	$scope.player = {
		speed: 20,			// current speed
		acceleration: 0,
		position: 42,		// percent from left
		width: 16,			// width of the car in percent
		height: 16,			// height of the car in percent
		topPosition: 100 - (16 + 4), // percent of the top of the player
		breaking: false,	// is it breaking currently?
		parameters: {
			// modification in the speed / frame
			acceleration: 0.3,
			breaking: -2
		},
		max: {
			speed: 120
		},
		min:{
			speed: 10
		},
		style:{
			left: '42%'
		}
	}

	$scope.score = 0;

	$scope.backgroundPosition = 0;
	$scope.backgroundStyle = {
		'background-position-y': '0px'		
	}

	$scope.$watch('backgroundPosition', function(_val) {
		if (_val > 32000000) {
			_val = 0;
		};
		$scope.backgroundStyle['background-position-y'] = _val + 'px';
	});
	$scope.$watch('player.position', function(_val) {
		$scope.player.style['left'] = _val + '%';
	});

	/////////////// Helper functions
	var random = function(min,max){
		return Math.floor(Math.random()*(max-min+1)+min);
	}

	$scope.roundSpeed = function(_speed){
		return Math.round(_speed);
	}

	/////////////// Menu
	$scope.exitToMenu = function(){
		$scope.running = false;
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
						$scope.running = true;
						break;
					case 1:
						$state.go('menu');
						break;
					case 2:
						$scope.die();
						break;
				}
				return true;
			}
		});
	}

	$scope.startAgain = function(){
		$state.transitionTo($state.current, $stateParams, {
			reload: true,
			inherit: false,
			notify: true
		});
	}

	/////////////// Animation helpers
	var updateSpeed = function(){
		if ($scope.player.breaking){
			if ($scope.player.speed > $scope.player.min.speed) {
				$scope.player.speed += $scope.player.parameters.breaking;
			}else{
				$scope.player.speed = $scope.player.min.speed;
			}
		}else{
			if ($scope.player.speed < $scope.player.max.speed) {
				$scope.player.speed += $scope.player.parameters.acceleration;
			}
		}
	}

	var updateBackground = function(){
		$scope.backgroundPosition += $scope.player.speed / (speedModifier / 2);
		$scope.score = Math.round($scope.backgroundPosition / 80);
	}

	var isDeviceOrientationEventRegistered = false;
	var globalTiltingModifier = 0; // only used when using the program from the browser
	var globalTiltingModifierButton = 0; // only used when using the program from the browser
	var updatePlayerPosition = function() {
		if (navigator.accelerometer) {
			navigator.accelerometer.getCurrentAcceleration(function(acceleration){
				var modifier = (acceleration.x * -1) / 10;
				var newPosition = $scope.player.position + modifier;

				// if it's not going out from the road
				if (newPosition > 5 && newPosition < (95 - $scope.player.width)) {
					$scope.player.position = newPosition;
					$scope.player.speed -= Math.abs(modifier); // when turning, we reduce the speed a little
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
				var newPosition = $scope.player.position + globalTiltingModifier;

				// if it's not going out from the road
				if (newPosition > 5 && newPosition < (95 - $scope.player.width)) {
					$scope.player.position = newPosition;
					$scope.player.speed -= Math.abs(globalTiltingModifier / 2); // when turning, we reduce the speed a little
					globalTiltingModifierButton = 0;
				};
				isDeviceOrientationEventRegistered = true;
			}
		}
	}

	var _checkPlayerForOverlaping = function(){
		for(var _j = $scope.gameObjects.length; _j > 0; _j--){
			var obj = $scope.gameObjects[_j - 1];

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
				($scope.player.topPosition + $scope.player.height) >= obj.position &&
				(obj.position + $scope.player.height) > $scope.player.topPosition ){
				// when they are overlapping horizontaly
				if (
					objLeft - $scope.player.width < $scope.player.position &&
					$scope.player.position < objLeft + $scope.player.width) {
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
			(obj.position - $scope.player.height) < otherObj.position &&
			(obj.position + $scope.player.height) > otherObj.position){
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
				for(var _j = $scope.gameObjects.length; _j > 0; _j--){
					var otherObj = $scope.gameObjects[_j - 1];
					if (_checkGameObjectOverlaping(obj, otherObj)) {
						overlaping = true;
					};
				}
			}

			obj.style = {
				top: obj.position + '%'
			};

			obj.run = function(){

				// check if crashing to other AI cars
				for(var _j = $scope.gameObjects.length; _j > 0; _j--){
					var otherObj = $scope.gameObjects[_j - 1];
					if (_checkGameObjectOverlaping(this, otherObj)) {
						var crashing = {};
						if(this.position > otherObj.position){
							crashing = this;
						}else{
							crashing = otherObj;
						}
						crashing.style['background-color'] = 'red';
						crashing.speed = 0;
						crashing.crashed = true;
					};
				}

				this.position += (($scope.player.speed - this.speed) * $scope.player.parameters.acceleration) / speedModifier;

				// updateStyle
				this.style['top'] = this.position + '%';
				
			};

			obj.dispose = function(){
				delete this;
			};

			$scope.gameObjects.push(obj);
		};
	}
	generateGameObject();

	$scope.die = function(){
		$scope.gameOver = true;
		$scope.running = false;
	}

	/////////////// Breaking
	
	var initBreaking = function(){
		var br = document.getElementById('break');
		if (br == undefined) {
			throw 'Break element is not defined';
		};

		br.addEventListener('touchstart', function(){
			$scope.player.breaking = true;
		});

		br.addEventListener('touchend', function(){
			$scope.player.breaking = false;
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

		$scope.$apply(function () {
			if($scope.running){
				updateSpeed();
				updateBackground();
				updatePlayerPosition();
				for (i = 0; i < $scope.gameObjects.length; i++) {
					$scope.gameObjects[i].run();
				}
				if(_checkPlayerForOverlaping()){
					$scope.die();
				}
			}
		});

		clearKeyEvent();
	}

	var interval = setInterval(gameLoop, 1000 / 60);

	// STOP Game Loop
	$scope.stop = function () {
		clearInterval(interval);
	};
});