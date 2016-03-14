/*globals window:false, document:false, FB:false, wng:true */

// Options available: 
//  {
//   'url': null,
//   'preliminaryUrl': null,
//   'brand': null,
//   'enable_cross_domain_tracking': null,
//   'quote': {
//     'countries': null,
//     'price': null, // Full dollar value as int
//     'plan': null,
//     'campaign_code': null,
//     'campaign_code_discount': null, 
//     'duration': null,
//     'ages': null
//    }
//  }

var _gaq = _gaq || [];
var dataLayer = dataLayer || [];

var wng = (function ($, undefined) {
  var opt, transactionID, groupedDuration, groupedAges, singleOrFamily, orderedCountries, limitedCountries, allSubdomains;

  var trackPageOnNextLoadCookieName = 'trackPageOnNextLoad';
  var trackEventOnNextLoadCookiePrefix = 'trackEventOnNextLoad';
  var trackEventOnNextLoadCounter = 1;
  var googleAnalyticsScriptLoaded = false;

  $.googleAnalytics = function (googleAnalyticsTrackingCode, googleTagManagerCode, options) {
    opt = options || {};
    $.googleAnalytics.options = opt;

    allSubdomains = document.location.hostname.replace(/^www|service/, '');

    // Set the tracking code
    _gaq.push(['_setAccount', googleAnalyticsTrackingCode]);

    _gaq.push(function () {
      googleAnalyticsScriptLoaded = true;
    });

    // Set the domain to .travelinsurancedirect.suffix
    _gaq.push(['_setDomainName', allSubdomains]);

    // Enable cross domain tracking
    if (opt.enable_cross_domain_tracking) {
      _gaq.push(['_setAllowLinker', true]);
    }

    // Set custom variable for brand
    if (opt.brand) {
      _gaq.push(['_setCustomVar', 5, 'Brand', opt.brand, 2]);
    }

    // Set custom variables for quote
    if (opt.quote) {
      // Plan and countries
      if (opt.quote.countries) {
        orderedCountries = utils.orderCountries(opt.quote.countries);
        limitedCountries = utils.limitCountries(orderedCountries);
        var plan = opt.quote.plan || 'No Plan';
        // Custom variable requires limited countries as custom variables have a max length: Documented 64 bites for Key and Value, but up to 128 seems fine
        _gaq.push(['_setCustomVar', 1, plan, limitedCountries, 2]);
      }

      // Duration
      if (opt.quote.duration) {
        groupedDuration = utils.groupDuration(opt.quote.duration);
        // Key is 
        _gaq.push(['_setCustomVar', 2, groupedDuration, String(opt.quote.duration), 2]);
      }

      // Ages 
      if (opt.quote.ages) {
        groupedAges = utils.groupAges(opt.quote.ages);

        // Technically they are already sorted as utils.groupAges performs a sort on the ages object, but if that goes these still should be sorted, and if that method is used stand alone it should sort as well.
        opt.quote.ages.sort(function (a, b) {
          return a - b;
        });

        singleOrFamily = (opt.quote.ages.length === 1) ? 'Single' : 'Family';
        _gaq.push(['_setCustomVar', 3, groupedAges, opt.quote.ages.join(', '), 2]);
      }

      // Campaign code
      if (opt.quote.campaign_code && opt.quote.campaign_code_discount) {
        _gaq.push(['_setCustomVar', 4, opt.quote.campaign_code_discount, opt.quote.campaign_code, 2]);
      } else {
        _gaq.push(['_setCustomVar', 4, 'No Discount', 'None', 2]);
      }
    }

    // Up the sitespeed sampling rate from 1% to 100% - note that the current maximum google gives 
    // you is 10%.
    _gaq.push(['_setSiteSpeedSampleRate', 10]);

    // Track any urls passed in from the previous page
    var urlFromLastPage = utils.getCookie(trackPageOnNextLoadCookieName);

    if (urlFromLastPage) {
      _gaq.push(['_trackPageview', urlFromLastPage]);
      utils.deleteCookie(trackPageOnNextLoadCookieName);
    }

    // Track the preliminaryUrl if it exists
    if (opt.preliminaryUrl) {
      _gaq.push(['_trackPageview', opt.preliminaryUrl]);
    }

    // Track the initial page load
    if (opt.url) {
      _gaq.push(['_trackPageview', opt.url]);
    } else {
      _gaq.push(['_trackPageview']);
    }

    // Load GA javascript asynchronously
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);

    // Track any events passed in from the previous page
    var eventsFromLastPage = utils.findCookies(new RegExp("^" + trackEventOnNextLoadCookiePrefix));

    for (var key in eventsFromLastPage) {
      var decodedEvent = utils.decodeEvent(eventsFromLastPage[key]);
      wng.googleAnalytics.trackEvent.apply(this, decodedEvent);
      utils.deleteCookie(key);
    }

    // Set the fbAsyncInit value to be a callback that tracks FB social actions
    window.fbAsyncInit = function () {
      wng.googleAnalytics.listenForFacebookSocialEvents();
    };

    // Set up for Google Tag Manager
    dataLayer.push({ 'Custom Tracking URL': opt.url });

    if (opt.preliminaryUrl) {
      dataLayer.push({ 'Preliminary URL': opt.preliminaryUrl });
    }

    if (opt.quote) {
      // Send quote destinations to Google Tag Manager
      if (opt.quote.countries) {
        dataLayer.push({ 'Destination Countries': utils.limitCountries(utils.orderCountries(opt.quote.countries)) });
      }

      // Send price to Google Tag Manager
      if (opt.quote.price) {
        dataLayer.push({ 'Quote Price': Number(opt.quote.price) });
      }
    }

    // Load Google Tag Manager
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true;
      j.src = '//www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', googleTagManagerCode);
  };

  // Track a virtual page, this is in addition to the inital page tracking
  $.googleAnalytics.trackVirtualPage = function (url) {
    _gaq.push(['_trackPageview', url]);
  };

  // Track a virtual page, but not until just before the next page is tracked.
  // Useful for when the page will unload before a request can be sent to Google Analytics.
  // Note that there can only be one page tracked this way.
  $.googleAnalytics.trackVirtualPageOnNextLoad = function (url) {
    utils.setCookie(trackPageOnNextLoadCookieName, url);
  };

  // Track an event
  // Note: the value option must be an integer
  $.googleAnalytics.trackEvent = function (category, action, eventOptions) {
    // Options available:
    // {
    //   'label': null,
    //   'value': null
    // }

    if (eventOptions == undefined) {
      eventOptions = {};
    }

    _gaq.push(['_trackEvent', category, action, eventOptions['label'], eventOptions['value']]);
  };


  // Track an event, but not until just before the next page is tracked.
  // Useful for when the page will unload before a request can be sent to Google Analytics.
  $.googleAnalytics.trackEventOnNextLoad = function (category, action, eventOptions) {
    var encodedEvent = utils.encodeEvent(category, action, eventOptions);
    var cookieName = trackEventOnNextLoadCookiePrefix + trackEventOnNextLoadCounter;
    utils.setCookie(cookieName, encodedEvent);
    trackEventOnNextLoadCounter++;
  };

  // Create a transaction. Note order ID should be unique and allow the looking up of the order in the DB. Total should just be an int.
  $.googleAnalytics.createTransaction = function (orderID, total) {
    transactionID = orderID;
    _gaq.push(['_addTrans',
      String(transactionID),    // order ID - required
      '',                       // affiliation or store name
      String(total),            // total - required
      '0',                      // tax
      '0',                      // shipping
      '',                       // city
      '',                       // state or province
      ''                        // country
    ]);
  };

  // Add policy details to a transaction, this method is required. singleOrFamily should be 'Single' or 'Family', both days
  // and price should be an int 
  $.googleAnalytics.addPolicyDetails = function (price) {
    var variation = singleOrFamily + ' ' + groupedDuration;

    _gaq.push(['_addItem',
      String(transactionID),  // order ID - required
      variation,              // SKU/code - required
      'Policy',               // product name - not required by spec but appears to be required anyway
      orderedCountries,       // category or variation
      String(price),          // unit price - required
      '1'                     // quantity - required
    ]);
  };

  // Add policy excess reduction, both newPolicyExcess and price should be an int
  $.googleAnalytics.addPolicyExcessReduction = function (newPolicyExcess, price) {
    _gaq.push(['_addItem',
      String(transactionID),                      // order ID - required
      '$' + newPolicyExcess + ' policy excess',   // SKU/code - required
      'Policy excess reduction',                  // product name - not required by spec but appears to be required anyway
      orderedCountries,                           // category or variation
      String(price),                              // unit price - required
      '1'                                         // quantity - required
    ]);
  };

  // Add car rental excess cover increase, both newExcessCover and price should be an int  
  $.googleAnalytics.addCarRentalExcessIncrease = function (newExcessCover, price) {
    _gaq.push(['_addItem',
      String(transactionID),                  // order ID - required
      '$' + newExcessCover + ' car excess',   // SKU/code - required
      'Car excess cover increased',           // product name - not required by spec but appears to be required anyway
      orderedCountries,                       // category or variation
      String(price),                          // unit price - required
      '1'                                     // quantity - required
    ]);
  };

  // Add aditional item, both value and price should be an int, description is a string of what the user entered as 'item name'
  $.googleAnalytics.addAdditionalItem = function (value, description, price) {
    _gaq.push(['_addItem',
      String(transactionID),            // order ID - required
      '$' + value + ' ' + description,  // SKU/code - required
      'Additional item',                // product name - not required by spec but appears to be required anyway
      orderedCountries,                 // category or variation
      String(price),                    // unit price - required
      '1'                               // quantity - required
    ]);
  };

  // Add Footprints, price should be an int, projectName is a string
  $.googleAnalytics.addFootprints = function (projectName, price) {
    _gaq.push(['_addItem',
      String(transactionID),            // order ID - required
      projectName,                      // SKU/code - required
      'Footprints donation',            // product name - not required by spec but appears to be required anyway
      orderedCountries,                 // category or variation
      String(price),                    // unit price - required
      '1'                               // quantity - required
    ]);
  };

  // Add Pre-Ex, price should be an int
  $.googleAnalytics.addPreEx = function (price) {
    _gaq.push(['_addItem',
      String(transactionID),            // order ID - required
      'Medial premium',                 // SKU/code - required
      'Pre-Ex cover',                   // product name - not required by spec but appears to be required anyway
      orderedCountries,                 // category or variation
      String(price),                    // unit price - required
      '1'                               // quantity - required
    ]);
  };

  // Add Business benefits cover, price should be an int
  $.googleAnalytics.addBusinessBenefitCover = function (price) {
    _gaq.push(['_addItem',
      String(transactionID),            // order ID - required
      'Business premium',                 // SKU/code - required
      'Business Benefit cover',                   // product name - not required by spec but appears to be required anyway
      orderedCountries,                 // category or variation
      String(price),                    // unit price - required
      '1'                               // quantity - required
    ]);
  };

  // Add Snow sports cover, price should be an int
  $.googleAnalytics.addSnowSportsCover = function (price) {
    _gaq.push(['_addItem',
      String(transactionID),            // order ID - required
      'Snow sports premium',                 // SKU/code - required
      'Snow sports cover',                   // product name - not required by spec but appears to be required anyway
      orderedCountries,                 // category or variation
      String(price),                    // unit price - required
      '1'                               // quantity - required
    ]);
  };

  // This has to be called after the transaction has been built to submit it.
  $.googleAnalytics.submitTransaction = function () {
    _gaq.push(['_trackTrans']);
  };

  // This adds listeners to track Facebook likes, unlikes, and shares. This has to be called after the FB object has been created.
  $.googleAnalytics.listenForFacebookSocialEvents = function () {
    try {
      if (FB && FB.Event && FB.Event.subscribe) {
        FB.Event.subscribe('edge.create', function (opt_target) {
          _gaq.push(['_trackSocial', 'Facebook', 'Like', opt_target]);
        });

        FB.Event.subscribe('edge.remove', function (opt_target) {
          _gaq.push(['_trackSocial', 'Facebook', 'Unlike', opt_target]);
        });

        FB.Event.subscribe('message.send', function (opt_target) {
          _gaq.push(['_trackSocial', 'Facebook', 'Send', opt_target]);
        });
      }
    } catch (e) { }
  };

  // Load a script tag when window load fires
  $.googleAnalytics.loadScriptOnLoad = function (url) {
    utils.fireOnWindowLoad(function () {
      utils.loadScript(url);
    });
  };

  // TODO: Might be better to use _getLinkerUrl for both of the following! This would better line up with how
  // universal analytics behaves

  // Call this whenever an internal, cross domain link is clicked. Let the link continue as normal
  $.googleAnalytics.adjustLinkForCrossDomainTracking = function (link) {
    if (googleAnalyticsScriptLoaded) {
      _gaq.push(['_link', url]);
    }
  }

  // Call this whenever an internal, cross domain form is submitted. Prevent default on the form 
  // itself depending on the value returned
  // Note: This code is not unit tested due to it's effect on page state
  $.googleAnalytics.crossDomainPostWithSuccess = function (formDomElement) {
    if (googleAnalyticsScriptLoaded) {
      _gaq.push(['_linkByPost', formDomElement]);

      return true;
    } else {
      return false;
    }
  }

  var utils = $.googleAnalytics.utils = {
    // Convert an int value for days into a standardised string format
    groupDuration: function (days) {
      var approximateMonth = 365 / 12;

      if (days < 28) {
        return days + (days == 1 ? ' day' : ' days');
      } else if (days < Math.round(3 * approximateMonth)) {
        return Math.floor(days / 7) + ' weeks';
      } else {
        return Math.floor((days + 1) / approximateMonth) + ' months'; // +1 on days to fudge the numbers slightly, so 91 days = 3 months (instead of 91.25+), and 12 months is guaranteed for 365 / 12 * 12 in case of a rounding error
      }
    },

    // Convert days into weeks
    weekDuration: function (days) {
      var weeks = Math.floor(days / 7);

      return weeks + (weeks == 1 ? ' week' : ' weeks');
    },

    // Group an array of ages into meaningful strings
    groupAges: function (ages) {
      var groupedAges = [];

      ages.sort(function (a, b) {
        return a - b;
      });

      for (var i = 0; i < ages.length; i++) {
        var groupedAge;
        var age = ages[i];

        if (age < 18) {
          groupedAge = 'Under 18';
        } else if (age < 25) {
          groupedAge = '18 - 24';
        } else if (age < 35) {
          groupedAge = '25 - 34';
        } else if (age < 45) {
          groupedAge = '35 - 44';
        } else if (age >= 45) {
          groupedAge = '45+';
        }

        groupedAges.push(groupedAge);
      }

      return groupedAges.join(', ');
    },

    // Order the country list alphabetically
    orderCountries: function (countryList) {
      var countries = countryList.split('|');

      countries.sort();

      return countries.join('|');
    },

    // Limit countries to 100 characters max, truncating before the | - this is important for custom variables as they have a max length (speced 64 bytes, 128 seems okay)
    limitCountries: function (countryList) {
      var match = countryList.match(/^(.{0,100})(?:\|.*)?$/);

      return match[1];
    },

    // Set an individual cookie
    setCookie: function (name, value, options) {
      options = options || {};

      var cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);

      if (options.expires) {
        var expires;

        if (typeof options.expires == 'number') {
          // A number of days was passed in, convert it into a date from now
          expires = new Date();
          expires.setDate(expires.getDate() + options.expires);
        } else {
          // A date was passed in, just use the date
          expires = options.expires;
        }

        cookie += '; expires=' + expires.toUTCString();
      }

      // Even though cookies normally default to current path, it is more useful to default to root for analytics
      cookie += '; path=' + (options.path || '/');

      // Even though cookies normally default to current domain, it is more useful to default to parent domain for analytics. 
      // Note that this means we lose the ability to set a domain without a . prefix, as the only way to do that is to not add a 'domain=' to the cookie.
      cookie += '; domain=' + (options.domain || allSubdomains);

      if (options.secure) {
        cookie += '; secure';
      }

      document.cookie = cookie;

      return cookie;
    },

    // Get an individual cookie by name.
    // Keep in mind, it's possible to have multiple cookies with the same name, eg: one for .demo.com, another for subdomain.demo.com, and a third for .demo.com/cheese.
    // There is no way to differentiate between these, and a random one will be returned. In other words, don't reuse names between domain / path levels.
    getCookie: function (name) {
      var cookies = utils.getCookies();

      for (var cookieName in cookies) {
        if (cookieName == name) {
          return cookies[cookieName];
        }
      }

      return null;
    },

    // Finds cookies by name based on a passed in regex. Returns an filtered object of cookies
    findCookies: function (pattern) {
      var allCookies = utils.getCookies();
      var matchingCookies = {};

      for (var cookieName in allCookies) {
        if (cookieName.match(pattern)) {
          matchingCookies[cookieName] = allCookies[cookieName];
        }
      }

      return matchingCookies;
    },

    // Returns an object of all cookies decoded
    getCookies: function () {
      var rawCookies = document.cookie.split('; ');
      var cookies = {};

      for (var i = 0; i < rawCookies.length; i++) {
        var rawCookie = rawCookies[i].split('=');
        cookies[decodeURIComponent(rawCookie[0])] = decodeURIComponent(rawCookie[1] || ''); // IE saves empty cookie strings as just the cookie name, sans =, so cookie[1] might be null
      }

      return cookies;
    },

    // Remove a cookie, this is done by setting a cookie with a date of yesterday.
    // Keep in mind that if you specify path or domain when you create the cookie, you have to also specify them when you destroy it.
    deleteCookie: function (name, options) {
      options = options || {};
      options.expires = -1;

      utils.setCookie(name, '', options);
    },

    // Accepts an event, and encodes as a string - makes use of encodeURIComponent to make sure things can be split safely later
    encodeEvent: function (category, action, eventOptions) {
      eventOptions = eventOptions || {};

      var categoryString = 'category:' + encodeURIComponent(category);
      var actionString = 'action:' + encodeURIComponent(action);
      var labelString = 'label:' + encodeURIComponent(eventOptions['label'] || '');
      var valueString = 'value:' + (eventOptions['value'] || '');

      return [categoryString, actionString, labelString, valueString].join(';');
    },

    // Accepts an encoded event, and returns an array of arguments
    decodeEvent: function (encodedEvent) {
      var match = encodedEvent.match(/^category:(.+);action:(.+);label:(.+)?;value:(.+)?$/);
      var options = {};

      if (match[3]) {
        options['label'] = decodeURIComponent(match[3]);
      }

      if (match[4]) {
        options['value'] = Number(match[4]);
      }

      return [decodeURIComponent(match[1]), decodeURIComponent(match[2]), options];
    },

    // Attaches passed in callbacks to the browsers window load event
    fireOnWindowLoad: function (toFire) {
      if (window.addEventListener) {
        // One for normal browsers
        window.addEventListener('load', toFire, false);
      } else if (window.attachEvent) {
        // One for IE 8 and below
        window.attachEvent('onload', toFire);
      }
    },

    // Load a script tag
    loadScript: function (url) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = url;
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
    }
  };

  return $;

})(wng || {});

// Namespaced under wng, but also assigned to window.googleAnalytics for backwards compatibility across brands
window.googleAnalytics = wng.googleAnalytics;
