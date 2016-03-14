// For the JSONP Trustpilot callback function;
var trustpilot_jsonp_callback;

wng.utils = (function (undefined) {
  var
    preload = function(arrayOfImages) {
      $(arrayOfImages).each(function() {
        $('<img/>')[0].src = this;
      });
    },

    navigate = function(url) {
      window.location.replace(url);
    },

    getUrlParamValue = function(key, url) {
      if (url === undefined) {
        url = window.location.search;
      }
      var re = new RegExp("[?|&]" + key + "=(.*?)&");
      var matches = re.exec(url + "&");
      if (!matches || matches.length < 2) {
        return "";
      }
      return decodeURIComponent(matches[1].replace("+", " "));
    },

    getPromoParamFromUrl = function() {
      var regex = RegExp('(?:\\?|^|&)campaign=(.+?)(?:&|$)');
      var promoParam = decodeURI(
      (regex.exec(location.search.toLowerCase()) || [, null])[1]);
      if (promoParam == "null") {
        return '';
      }
      return "campaign=" + promoParam;
    },

    addParamToUrl = function(url, param) {
      var urlSplit,
        baseUrl,
        urlQuery = '',
        paramPairs = [],
        paramPair,
        newParamSplit,
        newKey,
        newValue,
        i;

      urlSplit = url.split('?');
      if (urlSplit === undefined || urlSplit === null || urlSplit.length < 1) {
        return url;
      }
      baseUrl = urlSplit[0];
      if (baseUrl.charAt(baseUrl.length - 1) != '/') {
        baseUrl = baseUrl + '/';
      }
      if (urlSplit.length > 1) {
        urlQuery = urlSplit[1];
        paramPairs = urlQuery.split('&');
      }

      newParamSplit = param.split('=');
      if (newParamSplit === undefined || newParamSplit === null || newParamSplit.length < 2) {
        return url;
      }
      newKey = newParamSplit[0];
      newValue = newParamSplit[1];

      if (paramPairs.length == 0) {
        return baseUrl + '?' + newKey + '=' + newValue;
      } else {
        i = paramPairs.length;
        while (i--) {
          paramPair = paramPairs[i].split('=');

          if (paramPair[0] == newKey) {
            paramPair[1] = newValue;
            paramPairs[i] = paramPair.join('=');
            break;
          }
        }

        if (i < 0) {
          paramPairs[paramPairs.length] = [newKey, newValue].join('=');
        }

        return baseUrl + '?' + paramPairs.join('&');
      }
    },

    disableEnterSubmittingFormsInIE = function() {
      // Special functionality to stop enter submitting forms in <= IE8
      if ($.browser.msie && $.browser.version <= 8) {
        var disableEnterSelector = "form";
        $(disableEnterSelector).bind("keypress", function(e) {
          if (e.keyCode == 13) {
            return false;
          }
        });
      }
    },

    initTrustPilotStats = function() {
      var targetTpContainerClass = 'trustpilot-display';
      var tpJsonpUrl = 'https://s.trustpilot.com/tpelements/8255786/f.jsonp?callback=?';

      trustpilot_jsonp_callback = function(data) {

        var trustScoreRaw,
          trustScoreRating,
          trustScoreHuman,
          numberOfStars,
          $tpStarIcons,
          $tpHuman,
          $tpRating,
          $targetTpContainer;

        trustScoreRaw = data.TrustScore.Score;
        trustScoreRating = trustScoreRaw / 10 + '/10';
        trustScoreHuman = data.TrustScore.Human;
        numberOfStars = data.TrustScore.Stars;

        $tpStarIcons = $('<div/>').addClass('tp-stars stars-' + numberOfStars);
        $tpHuman = $('<span>').html(trustScoreHuman).addClass('tp-human');
        $tpRating = $('<span>').html(trustScoreRating).addClass('tp-rating');
        $targetTpContainer = $('.' + targetTpContainerClass);

        $targetTpContainer.empty()
          .append($tpStarIcons)
          .append($tpHuman)
          .append($tpRating);

      };

      $(function() {
        if ($('.' + targetTpContainerClass).length > 0) {
          $.getJSON(tpJsonpUrl);
        }
      });


    };
    
  return {
    preload: preload,
    navigate: navigate,
    getUrlParamValue: getUrlParamValue,
    getPromoParamFromUrl: getPromoParamFromUrl,
    addParamToUrl: addParamToUrl,
    disableEnterSubmittingFormsInIE: disableEnterSubmittingFormsInIE,
    initTrustPilotStats: initTrustPilotStats
  };
}());