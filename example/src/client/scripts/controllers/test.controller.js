angular.module('exampleApp').controller('testController', function(
    $scope
) { 'use strict';
    $scope.drag = function() {
        console.log('works');
    }
});
