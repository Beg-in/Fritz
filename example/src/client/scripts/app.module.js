angular.module('exampleApp', [
    'ngAnimate',
    'ngRoute'
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
        templateUrl: '/home.html',
        controller: 'staticController'
    }).when('/index.html', {
        redirectTo: '/'
    }).when('/testedit', {
        //test for page editing
        templateUrl: '/test-edit.html',
        controller: 'staticController'
    }).when('/404', {
        //404 error
        templateUrl: '/404.html',
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

    // $rootScope.$on('$routeChangeStart', function(event, next) {
    //     $window.scrollTo(0,0);
    //     var c = next.$$route.controller ? next.$$route.controller.indexOf('Controller') : -1;
    //     if(c === -1) {
    //         $rootScope.pageName = '';
    //         return;
    //     }
    //     $rootScope.pageName = next.$$route.controller.substring(0, c) + 'Page';
    // });
    //
    // $rootScope.$on('$routeChangeSuccess', function() {
    //     if ($rootScope.pageName === 'homePage') {
    //         $rootScope.noBootstrap = true;
    //         $rootScope.firstLoad = true;
    //     } else {
    //         $rootScope.noBootstrap = false;
    //         $rootScope.firstLoad = true;
    //     }
    // });

});
