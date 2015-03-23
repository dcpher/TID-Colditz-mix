/*

jQuery.autocompleteWithPanel.js by Jaidev Soin

This plugin configures the autocomplete for use on TID, including support for aliases, and the country selection panel.
For usage, options, and triggers, refer to the parent plugin.

Options passed in to this plugin are passed to parent

*/


(function ($) {
  $.fn.extend({
    autocompleteWithPanel: function (countriesWithAliases, panelData, opt) {
      opt = $.extend({
        // Autocomplete with panel options
        countryPanelID: 'countryPanel', // ID of the country picker panel
        regionsClass: 'regions',        // Class applied to the div that wraps the regions
        regionClass: 'region',          // Class applied to the dl that wraps a region, in addition to the region name
        panelCloseText: 'Close x',      // Text for the link that closes the country picker panel.
        panelCloseClass: 'closePanel',  // Class applied to the close link at the top of the country picker panel
        panelHeader: '<strong>Select</strong> or <strong>Type</strong> the country name', // Title displayed in the country picker panel
        panelFooter: "<strong>Can't find the country in this list?</strong> Type in the country name in the box above.",
        alignment: 'left',
        fadeInSpeed: 200                // Autocompleter options you might want to change
      }, opt);

      var utils = {
        regexToMatchWordStart: function (text) {
          // Regex is there to escape any regex characters that might be in the terms
          var textSafeForRegex = $.trim(text).replace(/([\\\^\$*+[\]?{}.=!:(|)])/g, "\\$1");
          return new RegExp("(?:^|\\s)" + textSafeForRegex, 'i');
        }
      };

      return this.each(function () {

        var self = $(this)

          .bind('init.autocompleteWithPanel', function () {
            self.triggerHandler('createCountryPanel');
            self.triggerHandler('setupAutocompleter');
          })

          .bind('setupAutocompleter', function () {
            // The below options to the autocomplete plugin are overridable just like the ones at the top of this plugin.
            // They are however kept seperate, as a way of indicating that overriding them goes against the purpose of this
            // plugin - In other words, if you feel you need to overrite them, you probably should not be using this plugin
            // at all, and should be writing a seperate wrapper for the autocomplete plugin.

            self.autocomplete(countriesWithAliases, $.extend({
              // Pass in big panel of counties
              instructions: self.data('countryPanel'),

              // Custom matchTemplate method is required as the countries array isn't just country names, but is a combination of ids, names and alises.
              // This checks if the string the user searched for can be found in the country name. If it can't, it picks the shortest alias of the country that contains the string to display as well.
              matchTemplate: function (country, searchText, highlightMethod) {
                var displayText;
                var searchRegex = utils.regexToMatchWordStart(searchText);

                // First check if what the user entered matches the country
                if (!country['aliases'] || country['name'].match(searchRegex)) {
                  displayText = country['name'];
                } else {
                  // Otherwise, find which aliases are matched
                  var matchingAliases = [];

                  $.each(country['aliases'], function (i, alias) {
                    if (alias.match(searchRegex)) {
                      matchingAliases.push(alias);
                    }
                  });

                  // We only want to display one alias, so pick the shortest one
                  matchingAliases = matchingAliases.sort(function (a, b) {
                    return a.length - b.length;
                  });

                  displayText = country['name'] + " (" + matchingAliases[0] + ")";
                }

                return highlightMethod(searchText, displayText);
              }
            }, opt))

            // Clear the autocompleter when a country is selected
            .bind('itemChosen', function (e, data, textUserEntered, selectedListItem) {
              self.val('');
            })

            // When the country panel is shown, add a listener to check for when the countries are clicked on.
            // This causes the country to be searched for using the autocompleter
            .bind('instructionsShown', function (e, instructions) {
              instructions.bind('click.autocompleteWithPanel', function (e) {
                var target = $(e.target);

                if (target.is('a')) {
                  if (!target.hasClass(opt.panelCloseClass)) {
                    self
                      .val(target.text())
                      .triggerHandler('findExactMatches', ['click_on_panel']);
                  }

                  self.triggerHandler('removeInstructions');

                  return false;
                }
              });

            });
          })

        // Build the country menu
          .bind('createCountryPanel', function () {
            var countryPanel = $("<div/>").attr('id', opt.countryPanelID).addClass(opt.alignment);

            $('<h3/>').html(opt.panelHeader).appendTo(countryPanel);

            $('<a/>').text(opt.panelCloseText).addClass(opt.panelCloseClass).appendTo(countryPanel);

            var regions = $('<div/>').addClass(opt.regionsClass).appendTo(countryPanel);

            $.each(panelData, function (i, region) {
              var dl = $("<dl/>").addClass(region.name.toLowerCase()).addClass(opt.regionClass);
              $("<dt/>").text(region.name).appendTo(dl);

              $.each(region.countries, function (i, countryName) {
                $("<dd><a>" + countryName + "</a></dd>").appendTo(dl);
              });

              regions.append(dl);
            });

            $('<div/>').html(opt.panelFooter).addClass('note').appendTo(countryPanel);

            self.data('countryPanel', countryPanel);
          });

        self.triggerHandler('init.autocompleteWithPanel');
      });
    }
  });
})(jQuery);