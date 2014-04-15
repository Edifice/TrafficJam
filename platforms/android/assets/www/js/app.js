// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('trafficjam', ['ionic'])

.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		if(window.StatusBar) {
			StatusBar.hide();
		}
	});
})

.config(function($stateProvider, $urlRouterProvider) {

	$stateProvider
	.state('menu', {
		url: '/',
		templateUrl: 'modules/menu/menu.html',
		controller: 'MenuCtrl'
	})
	.state('game', {
		url: '/game',
		templateUrl: 'modules/game/game.html',
		controller: 'GameCtrl'
	})
	.state('stats', {
		url: '/stats',
		templateUrl: 'modules/stats/stats.html',
		controller: 'StatCtrl'
	});

	$urlRouterProvider.otherwise("/");

});
