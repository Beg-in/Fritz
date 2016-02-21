angular.module('exampleApp', [
    'ngAnimate',
    'ngRoute',
    'templates'
]).config(function(
    $locationProvider,
    $routeProvider,
    $provide,
    $compileProvider
) { 'use strict';


    // $locationProvider.html5Mode(true);
    // $locationProvider.hashPrefix('!');

    $routeProvider.when('/', {
        //home page
        templateUrl: 'edit.html',
        controller: 'editController'
    }).when('/index.html', {
        redirectTo: '/'
    }).when('/edit', {
        //edit page
        templateUrl: 'edit.html',
        controller: 'editController'
    }).when('/404', {
        //404 error
        templateUrl: '404.html',
        controller: 'staticController'
    }).otherwise({
        redirectTo: '/404'
    });

}).run(function(
    $rootScope,
    $window,
    $route,
    $location
) { 'use strict';

    $rootScope.$on('$routeChangeStart', function(event, next) {
        $window.scrollTo(0,0);
        var c = next.$$route.controller ? next.$$route.controller.indexOf('Controller') : -1;
        if(c === -1) {
            $rootScope.pageName = '';
            return;
        }
        $rootScope.pageName = next.$$route.controller.substring(0, c) + 'Page';
    });

});
