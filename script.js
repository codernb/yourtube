var app = angular.module('yourtube', ['onsen']);

app.run(function () {
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

app.config( function ($httpProvider) {
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.service('VideosService', ['$window', '$rootScope', function ($window, $rootScope) {

  var service = this;

  var youtube = {
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: '100%',
    playerWidth: '100%',
    state: 'stopped'
  };
  var results = [];
  var history = [];

  $window.onYouTubeIframeAPIReady = function () {
    youtube.ready = true;
    service.bindPlayer('placeholder');
    service.loadPlayer();
    $rootScope.$apply();
  };

  this.bindPlayer = function (elementId) {
    youtube.playerId = elementId;
  };

  this.createPlayer = function () {
    return new YT.Player(youtube.playerId, {
      height: youtube.playerHeight,
      width: youtube.playerWidth,
      playerVars: {
        rel: 0,
        showinfo: 0
      }
    });
  };

  this.loadPlayer = function () {
    if (youtube.ready && youtube.playerId) {
      if (youtube.player) {
        youtube.player.destroy();
      }
      youtube.player = service.createPlayer();
    }
  };

  this.launchPlayer = function (id) {
    youtube.player.loadVideoById(id);
    youtube.state = 'playing';
    return youtube;
  }

  this.listResults = function (data, append) {
    if (!append) {
      results.length = 0;
    }
    for (var i = data.items.length - 1; i >= 0; i--) {
      results.push({
        id: data.items[i].id.videoId,
        title: data.items[i].snippet.title,
        description: data.items[i].snippet.description,
        thumbnail: data.items[i].snippet.thumbnails.default.url,
        author: data.items[i].snippet.channelTitle
      });
    }
    return results;
  }

  this.getYoutube = function () {
    return youtube;
  };

  this.getResults = function () {
    return results;
  };

}]);

app.controller('MainController', function ($scope, $http, $interval, VideosService) {

    $scope.youtube = VideosService.getYoutube();
    
    $scope.next = function() {
        $http.get('/?next').success(function (data) {
            $scope.launch(data.id);
        });
    };
    
    $scope.clear = function() {
        $http.get('/?clear').success(function (data) {
            $scope.update();
        });
    };
    
    $scope.launch = function(videoId) {
      VideosService.launchPlayer(videoId);
    };
    
    $scope.remove = function(video) {
        video = JSON.stringify(video);
        video = encodeURIComponent(video);
        $http.get('/?remove=' + video).success(function (data) {
            $scope.update();
        });
    }
    
    $scope.update = function() {
        $http.get('/?update').success(function (data) {
            data = Object.keys(data).map(function (key) {return data[key]});
            for (var i = 0; i < data.length; i++)
                data[i] = JSON.parse(data[i]);
            $scope.videos = data;
        });
    }
    
    $interval(function(){
        $http.get('/?version').success(function (data) {
            if ($scope.version === data)
                return;
            $scope.version = data;
            $scope.update();
        });
        $http.get('/?volume').success (function (data) {
            if ($scope.youtube.player.getVolume() !== data)
                $scope.youtube.player.setVolume(data);
        });
        var state = $scope.youtube.player.getPlayerState();
        if (!$scope.youtube.ready || (state !== -1 && state !== 5 && state !== 0))
            return;
        $scope.next();
    }, 1000);
    
});

app.controller('UIController', function ($scope, $http, $interval, VideosService) {

    $scope.results = VideosService.getResults();
    
    $scope.update = function() {
        $http.get('?update').success(function (data) {
            data = Object.keys(data).map(function (key) {return data[key]});
            for (var i = 0; i < data.length; i++) {
                data[i] = JSON.parse(data[i]);
            }
            $scope.videos = data;
        });
    };
    
    $scope.enterVideo = function (video) {
        video = JSON.stringify(video);
        video = encodeURIComponent(video);
        $http.get('?video=' + video).success(function (data) {
            $scope.update();
        });
    };
    
    $scope.volumeUp = function () {
        $http.get('?volumeup');
    };
    
    $scope.volumeDown = function () {
        $http.get('?volumedown');
    };
    
    $interval(function(){
        $http.get('?version').success(function (data) {
            if ($scope.version === data)
                return;
            $scope.version = data;
            $scope.update();
        });
    }, 3000);

    $scope.search = function (isNewQuery) {
      $scope.loading = true;
      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: 'AIzaSyCDx2qUdt0KTmNqSjErNeiYrx1tr6xVc6Q',
          type: 'video',
          maxResults: '10',
          pageToken: isNewQuery ? '' : $scope.nextPageToken,
          part: 'id,snippet',
          fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle,nextPageToken',
          q: this.query
        }
      })
      .success( function (data) {
        if (data.items.length === 0) {
          $scope.label = 'No results were found!';
        }
        VideosService.listResults(data, $scope.nextPageToken && !isNewQuery);
        $scope.nextPageToken = data.nextPageToken;
      })
      .error( function () {
      })
      .finally( function () {
        $scope.loadMoreButton.stopSpin();
        $scope.loadMoreButton.setDisabled(false);
        $scope.loading = false;
      });
    };
    
});
