angular.module('exampleApp').directive('editable', function(
    $rootScope,
    $location,
    $window,
    $compile
) { 'use strict';

    return {
      restrict: 'E',
      transclude: true,
      templateUrl: '/fritz/views/editable.html',
      scope: {
        // editableName: '=name'
      },
      link: function ($scope, $ielem, $iattrs, ctrl, transclude) {

          console.log($scope);

        $scope.editableName = $iattrs.name;

        var html = $ielem.html();

        $scope.beginEdit = function (name) {
          document.querySelector("editable[name='" + name + "']").contentEditable = "true";
        };

        $scope.cancelEdit = function (name) {
          document.querySelector("editable[name='" + name + "']").contentEditable = "false";
        };

        $scope.saveEdit = function (name) {
          $scope.cancelEdit(name);
          var newHTML = document.querySelector("editable[name='" + name + "'] .editable-inner-wrap").innerHTML;
          console.log(newHTML);
        };

        // $scope.first = 'row';
        // $scope.second = 'center';

        // console.log($ielem);

        // transclude($scope.$parent, function(clone, $scope) {
        //   $ielem.append(clone);
        // });

        // html.replace(/\{\{(.*?)\}\}/, "DYNAMIC CONTENT!");
        // var e = $compile(html)($scope);
        // $ielem.replaceWith(e);
      }
    };

});
