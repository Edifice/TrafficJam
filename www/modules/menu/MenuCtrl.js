app.controller('MenuCtrl', function(
	$scope,
	$state,
	$ionicPlatform
	){

	$scope.startGame = function(){
		$state.go('game');
	}

	$scope.openLeaderboard = function(){
		$state.go('stats');
	}

	$scope.exitGame = function(){
		ionic.Platform.exitApp();
	}
});