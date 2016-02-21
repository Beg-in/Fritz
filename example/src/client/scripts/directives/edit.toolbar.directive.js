angular.module('exampleApp').directive('editToolbarDirective', function(
    $rootScope,
    $location,
    $window
) { 'use strict';

    return {
        templateUrl: 'edit-toolbar.html',
        link: function($scope) {
        }
    };
});
