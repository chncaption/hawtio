module Fabric {

  export class ContainerList {

    public restrict = 'A';
    public replace = true;
    public templateUrl = Fabric.templatePath + "containerList.html";

    public scope = {

    };

    public controller = ($scope, $element, $attrs, jolokia, $location, $templateCache) => {

      $scope.containerArgs = ["id", "alive", "parentId", "profileIds", "versionId", "provisionResult", "jolokiaUrl", "root"];
      $scope.containersOp = 'containers(java.util.List)';
      $scope.ensembleContainerIdListOp = 'EnsembleContainers';

      $scope.containers = [];
      $scope.activeProfiles = [];
      $scope.selectedContainers = [];
      $scope.selectedContainerIds = [];
      $scope.connectToContainerDialog = new Core.Dialog();
      $scope.targetContainer = {};


      $scope.updateContainers = (newContainers) => {

        var response = angular.toJson(newContainers);

        if ($scope.containersResponse !== response) {
          $scope.containersResponse = response;

          var rootContainers = newContainers.exclude((c) => { return !c.root; });
          var childContainers = newContainers.exclude((c) => { return c.root; });

          if (childContainers.length > 0) {
            var tmp = [];
            rootContainers = rootContainers.sortBy('id');
            rootContainers.each((c) => {
              tmp.add(c);
              var children = childContainers.exclude((child) => { return child.parentId !== c.id });
              tmp.add(children.sortBy('id'));
            });
            newContainers = tmp;
          }

          newContainers.each((container) => {
            var c = $scope.containers.find((c) => { return c.id === container.id; });
            if (c) {
              container['selected'] = c.selected;
            } else {
              container['selected'] = false;
            }
            if ($scope.selectedContainerIds.any(container.id)) {
              container.selected = true;
            }
          });

          $scope.containers = newContainers;
          Core.$apply($scope);
        }
      };


      $scope.showContainer = (container) => {
        $location.path('/fabric/container/' + container.id);
      };


      $scope.createChildContainer = (container) => {
        $location.url('/fabric/containers/createContainer').search({ 'tab': 'child', 'parentId': container.id });
      };


      $scope.createChildContainer = (container) => {
        $location.url('/fabric/containers/createContainer').search({ 'tab': 'child', 'parentId': container.id });
      };


      $scope.statusIcon = (row) => {
        if (row) {
          if (row.alive) {
            switch(row.provisionResult) {
              case 'success':
                return "green icon-play-circle";
              case 'downloading':
                return "icon-download-alt";
              case 'installing':
                return "icon-hdd";
              case 'analyzing':
              case 'finalizing':
                return "icon-refresh icon-spin";
              case 'resolving':
                return "icon-sitemap";
              case 'error':
                return "red icon-warning-sign";
            }
          } else {
            return "orange icon-off";
          }
        }
        return "icon-refresh icon-spin";
      };


      $scope.isEnsembleContainer = (containerId) => {
        if ($scope.ensembleContainerIds) {
          return $scope.ensembleContainerIds.any(containerId);
        }
        return false;
      }


      $scope.doConnect = (container) => {
        $scope.targetContainer = container;
        $scope.connectToContainerDialog.open();
      }

      $scope.connect = (row) => {
        if ($scope.saveCredentials) {
          $scope.saveCredentials = false;
          localStorage['fabric.userName'] = $scope.userName;
          localStorage['fabric.password'] = $scope.password;
        }
        Fabric.connect(localStorage, $scope.targetContainer, $scope.userName, $scope.password, true);
        $scope.targetContainer = {};
        $scope.connectToContainerDialog.close();
      };


      $scope.updateEnsembleContainerIdList = (ids) => {
        var response = angular.toJson(ids);
        if ($scope.ensembleContainerIdsResponse !== response) {
          $scope.ensembleContainerIdsResponse = response;
          $scope.ensembleContainerIds = ids;
          Core.$apply($scope);
        }
      }


      $scope.dispatch = (response) => {
        switch (response.request.operation) {
          case($scope.containersOp):
            $scope.updateContainers(response.value);
            return;
        }
        switch (response.request.attribute) {
          case($scope.ensembleContainerIdListOp):
            $scope.updateEnsembleContainerIdList(response.value);
            return;
        }
      };


      Core.register(jolokia, $scope, [
        {type: 'exec', mbean: Fabric.managerMBean, operation: $scope.containersOp, arguments: [$scope.containerArgs]},
        {type: 'read', mbean: Fabric.clusterManagerMBean, attribute: $scope.ensembleContainerIdListOp}
      ], onSuccess($scope.dispatch));





    };

  }




}
