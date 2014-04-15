app.controller('GameCtrl', function(
	$scope,
	$state,
	$document
	) {
	console.log('Starting game');

	var that = this;

	$scope.gameObjects = [];

	$scope.running = false;
	$scope.player = {
		speed: 20,			// current speed
		acceleration: 0,
		position: 42,		// percent from left
		width: 16,			// width of the car in percent
		breaking: false,	// is it breaking currently?
		parameters: {
			// modification in the speed / frame
			acceleration: 0.3,
			breaking: -3
		},
		max: {
			speed: 120
		},
		style:{
			left: '42%'
		}
	}


	$scope.backgroundPosition = 0
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

	$scope.roundSpeed = function(_speed){
		return Math.round(_speed);
	}

	$scope.exitToMenu = function(){
		$state.go('menu');
	}

	var updateSpeed = function(){
		if ($scope.player.breaking){
			if ($scope.player.speed > 10) {
				$scope.player.speed += $scope.player.parameters.breaking;
			}else{
				$scope.player.speed = 10;
			}
		}else{
			if ($scope.player.speed < $scope.player.max.speed) {
				$scope.player.speed += $scope.player.parameters.acceleration;
			}
		}
	}

	var updateBackground = function(){
		$scope.backgroundPosition += $scope.player.speed / 15;
	}

	var isDeviceOrientationEventRegistered = false;
	var globalTiltingModifier = 0; // only used when using the program from the browser
	var updatePlayerPosition = function() {
		if (navigator.accelerometer) {
			navigator.accelerometer.getCurrentAcceleration(function(acceleration){
				var modifier = (acceleration.x * -1) / 10;
				var newPosition = $scope.player.position + modifier;

				// if it's not going out from the road
				if (newPosition > 5 && newPosition < (95 - $scope.player.width)) {
					$scope.player.position = newPosition;
					$scope.player.speed -= Math.abs(modifier / 2); // when turning, we reduce the speed a little
				};
			}, function(){
				console.error('uhh, baj van');
			});
		}else if(window.DeviceOrientationEvent){
			if(!isDeviceOrientationEventRegistered) {
				window.addEventListener("deviceorientation", function (event) {
					globalTiltingModifier = ((event.alpha * -1) / 6) / 10;
				}, true);
			}

			var newPosition = $scope.player.position + globalTiltingModifier;

			// if it's not going out from the road
			if (newPosition > 5 && newPosition < (95 - $scope.player.width)) {
				$scope.player.position = newPosition;
				$scope.player.speed -= Math.abs(globalTiltingModifier / 2); // when turning, we reduce the speed a little
			};
			isDeviceOrientationEventRegistered = true;
		}
	}

	/////////////// Breaking
	
	var initBreaking = function(){
		var br = document.getElementById('break');
		if (br == undefined) {
			throw 'Break element is not defined';
		};

		br.addEventListener('touchstart', function(){
			console.log(1);
			$scope.player.breaking = true;
		});

		br.addEventListener('touchend', function(){
			console.log(2);
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
			updateSpeed();
			updateBackground();
			updatePlayerPosition();
			for (i = 0; i < $scope.gameObjects.length; i++) {
				$scope.gameObjects[i].run();
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