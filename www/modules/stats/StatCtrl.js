app.controller('StatCtrl', function(
	$scope,
	$state
	){

	$scope.exitToMenu = function(){
		$state.go('menu');
	}
});