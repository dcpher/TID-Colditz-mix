/*

jquery.timePicker.js by Jaidev Soin

Written for jQuery 1.7.1

Note: There is a set of unit tests for this plugin, if you are updating the plugin, please update the unit tests and ensure they pass

Triggers you might want to listen for:
  timePickerDrawn(datePickerDiv)
  writeOutDate(time) - Time is in minutes
  
Triggers you might want to use yourself:
  writeOutTime(time) - Time is in minutes
  writeOutTimeString(timeString)
  focus.timePicker
  hourIncrement
  hourDecrement
  hourSet(hour, useTwelveHourClock)
  minuteIncrement
  minuteDecrement
  minuteSet(minutes)
  periodIncrement/periodDecrement (they do the same thing)
  periodSet(period)

Key for time format:
  h - hour, 12 hour time
  hh - hour, 12 hour time with leading zero
  H - hour, 24 hour time
  HH - hour, 24 hour time with leading zero
  mm - minute with leading zero
  p - am / pm
  pp - a.m. / p.m.
  P - AM / PM
  PP - A.M. / P.M.

*/

(function ($) {
  var KEY = {
    BACKSPACE: 8,
    TAB: 9,
    RETURN: 13,
    SHIFT: 16,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DEL: 46,
    ZERO: 48,
    NINE: 57,
    A: 65,
    P: 80,
    SEMICOLON: 186, // Without checking for shift this also covers colon
    COMMA: 188,
    PERIOD: 190
  };

 var amRegex = /^a/i;
 var pmRegex = /^p/i;

  $.fn.extend({
    timePicker: function (opt) {
      opt = $.extend({
        timePickerClass: 'timepicker',
        timePickerOpenClass: 'timepicker-open', // Class applied to the input when the timePicker is visible 
        fadeInSpeed: 200,                     // Number of miliseconds fading in takes
        fadeOutSpeed: 200,                    // Number of miliseconds fading out takes
        alignment: 'left',                    // Time picker will be left aligned with the left side of the input. Alternative is 'right'
        topOffset: 0,                         // Number of pixels to tweak the timePicker's top offset by
        leftOffset: 0,                        // Number of pixels to tweak the timePicker's left offset by
        anchorTo: null,                       // Element to anchor the timePicker to - if null defaults to input
        ignoreClicksOn: null,                 // jQuery elements that when clicked on have no effect on the state of the timePicker
        timeFormat: 'h:mm P',                 // As per key in the comments at the top of file
        defaultHour: 12,                      // hour to use if the input the plugin is applied to is empty, or if user enters junk
        defaultMinute: 0,                     // minute to use if the input the plugin is applied to is empty, or if user enters junk
        minuteInterval: 5,                    // 1, 2, 3, 4, 5, 6, 10, 12, 15, 30 - Any factor of 60. No primes please =).
        headerText: 'Select a time',          // Text displayed in the header of the timepicker, null for none
        panelCloseText: 'Close x',            // Text displayed on close link in the time picker panel, null for none
        doneText: null,                       // Text displayed on done link in the time picker panel, null for none
        formContainerSelector: 'form'         // Containing element selector
      }, opt);

      var utils = {
        // Parses a string of time and tries to return a time, if not possible it falls back to default options
        //   string: A string representation of time to try and parse
        timeFromString: function(string) {
          var hour, minute;

          var hourAndMinuteRegex = /^[^ap]*/i;
          var numberRegex = /^\d+$/;

          // First strip out any time period (am/pm)
          var timePeriod = string.replace(hourAndMinuteRegex, function(time) {

            // With the remainder, try splitting it
            var splitTime = $.trim(time).split(/[^0-9]+/);

            // If it didn't split cleanly, try and parse the time as one long number e.g. 1245
            if (splitTime.length == 1 && splitTime[0] != '' && splitTime[0].match(numberRegex)) {
              if (splitTime[0].length <= 2) {
                hour = Number(splitTime[0]);
                minute = 0;
              } else {
                var paddedTime = '0' + splitTime[0];
                // Slice is used as IE is happy with it and negative indexes, unlike substring
                hour = Number(paddedTime.slice(-4, -2));
                minute = Number(paddedTime.slice(-2));  
              }
            } else if (splitTime.length == 2 && splitTime[0].match(numberRegex) && splitTime[1].match(numberRegex)) {
              // If it split cleanly, great!
              hour = Number(splitTime[0]);
              minute = Number(splitTime[1]);
            }

            return '';
          });

          // If there was an AM / PM, adust the hour value accordingly
          if (timePeriod.match(amRegex) && hour == 12)  {
            hour = 0;
          } else if (timePeriod.match(pmRegex) && hour < 12 && hour != 0) {
            hour = hour + 12;
          }

          if (utils.validHour(hour) && utils.validMinute(minute)) {
            return hour * 60 + minute;
          } else {
            return opt.defaultHour * 60 + opt.defaultMinute;
          }
        },

        // Tests whether a passed in hour value is valid
        //   hour: Hour to test in 24 hour time
        validHour: function(hour) {
          return !isNaN(hour) && hour >= 0 && hour < 24;
        },

        // Tests whether a passed in minute is valid
        //   minute: Minute to test
        validMinute: function(minute) {
          return !isNaN(minute) && minute >= 0 && minute < 60;
        },

        // Parses opt.timeFormat into it's component parts. Returns an array of the components, includes any preceeding, separating, and ending characters
        getComponentsFromTimeFormat: function() {
          var prefixAndUnitRegex = /^([^hmp]*)(h+|m+|p+)/i;
          var containsUnitRegex = /[hmp]/i;

          // This function is recursively called until there is no more timeFormat to parse
          var getComponents = function(components, remainingTimeFormat) {
            if (remainingTimeFormat.match(containsUnitRegex)) {
              var prefixAndUnit;

              // Strip the first unit (h, m, or p) from the time format, and keep track of that prefix and unit so we can add it to the components list
              var remainder = remainingTimeFormat.replace(prefixAndUnitRegex, function(match, prefix, unit) {
                prefixAndUnit = [prefix, unit];
                return '';
              });

              return getComponents(components.concat(prefixAndUnit), remainder);
            } else {
              return components.concat(remainingTimeFormat);
            }
          };
          
          return getComponents([], opt.timeFormat);
        },

        // Pads out a number < 10 with a leading zero if required for string representation to the user
        //   number: Value to add 0 to
        addLeadingZero: function (number) {
          return (number >= 10) ? number : '0' + String(number);
        },

        // For a given component from opt.timeFormat, return the value to display to the user based on timeInMinutes
        //   component: component from opt.timeFormat, e.g. hh or mm
        //   timeInMinutes: minute representation of time
        getValueForComponent: function(component, timeInMinutes) {
          var hours = (timeInMinutes - (timeInMinutes % 60)) / 60;
          var minutes = timeInMinutes % 60;
          var am = hours < 12;

          switch (component) {
            case 'h': return (hours == 0 || hours == 12) ? 12 : (hours % 12);
            case 'hh': return utils.addLeadingZero((hours == 0 || hours == 12) ? 12 : (hours % 12));
            case 'H': return hours;
            case 'HH': return utils.addLeadingZero(hours);
            case 'mm': return utils.addLeadingZero(minutes);
            case 'p': return am ? 'am' : 'pm';
            case 'pp': return am ? 'a.m.' : 'p.m.';
            case 'P': return am ? 'AM' : 'PM';
            case 'PP': return am ? 'A.M.' : 'P.M.';
            default: return '* time format parse error *';
          }
        },

        // Grabs a parsed version of opt.timeFormat, and substitutes in time values based on timeInMinutes
        //   timeInMinutes: minute representation of time
        getTimeString: function(timeInMinutes) {
          return $.map(utils.getComponentsFromTimeFormat(), function(component) {
            if (component.match(/[hmp]/i)) {
              return utils.getValueForComponent(component, timeInMinutes);
            } else {
              return component;
            }
          }).join('');
        },

        // Used to insert an element into the dom, positioning it based on the anchor.
        //   anchor: an element already in the dom to position new element relative to
        //   element: the element to be inserted into the dom
        insertAbsoluteElement: function (anchor, element) {
          element.css('position', 'absolute').appendTo('body');
          utils.setAbsoluteElementsTopProperty(anchor, element);
    
          // This has to happen once the timePicker is loaded into the dom so we know how wide it is. The user won't see it move at all.
          utils.setAbsoluteElementsLeftProperty(anchor, element);
        },

        // Sets the CSS left property of the element based on the position of the anchor and opt.alignment
        //   anchor: The element to position relative to
        //   element: The element to position
        setAbsoluteElementsLeftProperty: function (anchor, element) {
          var left = anchor.offset().left + opt.leftOffset;

          if (opt.alignment == 'right') {
            left = left + anchor.outerWidth() - element.outerWidth();
          }

          element.css('left', left + 'px');
        },

        // Sets the CSS top property of the element based on the position of the anchor and opt.alignment
        //   anchor: The element to position relative to
        //   element: The element to position
        setAbsoluteElementsTopProperty: function (anchor, element) {
          var top = anchor.offset().top + anchor.outerHeight(false) + opt.topOffset;
          element.css('top', top + 'px');
        },

        // Retuns the the field in the same form that is plus or minus the passed in index
        //   field: the form field to begin the search from
        //   relativeIndex: how far back or forward to look through the tabindex stack
        getFieldByRelativeTabIndex: function (field, relativeIndex) {
          var fields = $(field.closest(opt.formContainerSelector)
          .find('a[href], button, input, select, textarea')
          .filter(':visible').filter(':enabled')
          .toArray());

          return fields.eq((fields.index(field) + relativeIndex) % fields.length);
        },

        // Convinience method to grab the next field
        //   field: the form field to find the next field of
        nextField: function (field) {
          return utils.getFieldByRelativeTabIndex(field, 1);
        },

        // Convinience method to grab the previous field
        //   field: the form field to find the previous field of
        previousField: function (field) {
          return utils.getFieldByRelativeTabIndex(field, -1);
        },

        // Returns the next element in a jQuery collection, or null if the current element is the last
        //   element: element to find the next of
        //   collection: set of elements
        nextJQueryElement: function(element, collection) {
          var index = collection.index(element);
          return (index + 1 >= collection.length) ? null : collection.eq(index + 1);
        },

        // Returns the previous element in a jQuery collection, or null if the current element is the first
        //   element: element to find the previous of
        //   collection: set of elements
        previousJQueryElement: function(element, collection) {
          var index = collection.index(element);
          return (index == 0) ? null : collection.eq(index - 1);
        }
      };

      return this.each(function () {
        var self = $(this)

          // When user focuses on input, build and dispay the timePicker if it doesn't already exist
          .on('focus.timePicker', function() {
            if (!self.data('timePicker')) {
              self.data('time-component-inputs', { 'hour': [], 'minute': [], 'period': []});
              self.triggerHandler('drawTimePicker');
              self.triggerHandler('addPageListeners');
              self.addClass(opt.timePickerOpenClass);
            }
            self.blur();
          })

          // Main event for creating the timePicker. Responsible for building all dom elements, and 
          // adding all listeners to timePicker inputs and up/down anchors
          .on('drawTimePicker', function () {
            var timePicker = $('<div/>', {
              'class': opt.timePickerClass
            });

            if (opt.headerText) {
              $("<h3>" + opt.headerText + "</h3>").appendTo(timePicker);
            }

            if (opt.panelCloseText) {
              $("<a class='close'>" + opt.panelCloseText + "</a>")
                .one('click', function(e) {
                  self.triggerHandler('removeTimePicker');
                  e.preventDefault();
                })
                .appendTo(timePicker);
            }

            self.data('timePicker', timePicker);

            timePicker.append.apply(timePicker, $.map(utils.getComponentsFromTimeFormat(), function(component) {
              var componentMatch = component.match(/^h+|m+|p+$/i);

              if (componentMatch) {
                var componentType = { 'h':'hour', 'm':'minute', 'p':'period'}[componentMatch[0].substring(0, 1).toLowerCase()];

                var next = $('<a/>', {
                  'href': 'javascript:void(0)',
                  'click': function(e) {
                    e.preventDefault();
                    self.triggerHandler(componentType + 'Increment'); },
                  'class': 'component-button next-button next-' + componentType
                });

                next.append('<span class="fa fa-chevron-down"/>');

                var prev = $('<a/>', {
                  'href': 'javascript:void(0)',
                  'click': function(e) { 
                    e.preventDefault();
                    self.triggerHandler(componentType + 'Decrement'); },
                  'class': 'component-button prev-button prev-' + componentType
                });

                prev.append('<span class="fa fa-chevron-up"/>');

                var input = $('<input/>', {
                  'class': componentType + '-input component-input',
                  'blur': function() { self.triggerHandler(componentType + 'Set', [input.val(), (component.substring(0,1) == 'h')]); }, // If 12 hour time, pass true as second argument
                  'focus': function() { input.select(); },
                  'mouseup': function(e) { e.preventDefault(); },
                  'max-length': component.match(/pp/i) ? 4 : 2 // Max length should be 2, unless we are allowing a.m or A.M.
                })
                  .data('timeFormat', componentMatch[0])
                  .data('componentType', componentType)
                  .on('keydown.timePicker', function(e) {
                    // This switch statement makes use of fallthrough to group cases. 
                    // Note that if return is not explicitly stated, it will be caught by the final return at the end of the function
                    switch (e.keyCode) {
                      case KEY.ESC:
                      case KEY.RETURN:
                        return true;
                      case KEY.TAB:                  
                        if (e.shiftKey) {
                          self.triggerHandler('tabToPreviousComponentOrFormField', input);
                        } else {
                          self.triggerHandler('tabToNextComponentOrFormField', input);
                        }
                        return false;
                      case KEY.PERIOD:
                      case KEY.COMMA:
                      case KEY.SEMICOLON:
                        if (componentType == 'hour') {
                          self.triggerHandler('tabToNextComponentOrFormField', input);
                        }
                        return false;
                      case KEY.DOWN:
                        self.triggerHandler(componentType + 'Decrement');
                        return false;
                      case KEY.UP:
                        self.triggerHandler(componentType + 'Increment');
                        return false;
                      case KEY.BACKSPACE:
                      case KEY.DEL:
                      case KEY.LEFT:
                      case KEY.RIGHT:
                        return true;
                      case KEY.SPACE:
                        var nextComponent = utils.nextJQueryElement(input, self.data('timePicker').find('input'));

                        if (nextComponent) {
                          nextComponent.focus();
                        }

                        return false;
                      case KEY.A:
                      case KEY.P:
                        if (componentType == 'period') {
                          self.triggerHandler('periodSet', (e.keyCode == KEY.A) ? 'a' : 'p');
                        } else {
                          var nextComponent = utils.nextJQueryElement(input, self.data('timePicker').find('input'));

                          if (nextComponent && nextComponent.data('componentType') == 'period') {
                            // The blur is required for IE
                            input.triggerHandler('blur');
                            nextComponent.focus().trigger(e);
                          }                          
                        }
                        return false;  
                      default:
                        if (componentType != 'period' && KEY.ZERO <= e.keyCode && e.keyCode <= KEY.NINE) {
                          return true;
                        }

                        return false;
                    }
                  });

                self.data('time-component-inputs')[componentType].push(input);

                return $('<div/>', {
                  'class': componentType + '-component timepicker-section'
                }).append(prev).append(input).append(next);
              } else {
                return $("<div/>", {
                  'text': component,
                  'class': 'timepicker-seperator timepicker-section'
                });
              }
            }));

            if (opt.doneText) {
              $('<a/>', {
                'text': opt.doneText,
                'class': 'done',
                'href': 'javascript:void(0)',
                'click': function(e) {
                  utils.nextField(self).focus();
                  self.triggerHandler('removeTimePicker');
                  e.preventDefault();
                }
              }).appendTo(timePicker);
            }
            
            utils.insertAbsoluteElement(opt.anchorTo || self, timePicker);

            self.triggerHandler('writeOutTimeString', self.val());

            timePicker.hide().fadeIn(opt.fadeInSpeed, function() {
              self.triggerHandler('timePickerDrawn', timePicker);
            });

            // Must come after the fadein as IE doesn't like focusing hidden inputs (fair call!)
            timePicker.find('a').first().focus();
          })

          // Goes to the next field - If there are more component fields in the time picker it will go to those,
          // otherwise it will go to the next form field after the plugin owners field.
          //   input: field to find the next field of
          .on('tabToNextComponentOrFormField', function(e, input) {
            var nextComponent = utils.nextJQueryElement(input, self.data('timePicker').find('input'));

            if (nextComponent) {
              nextComponent.focus();
            } else {
              utils.nextField(self).focus();
              self.triggerHandler('removeTimePicker');
            }
          })

          // Goes to the previous field - If there are previous component fields in the time picker it will go to those,
          // otherwise it will go to the previous form field before the plugin owners field.
          //   input: field to find the previous field of
          .on('tabToPreviousComponentOrFormField', function(e, input) {
            var previousComponent = utils.previousJQueryElement(input, self.data('timePicker').find('input'));

            if (previousComponent) {
              previousComponent.focus();
            } else {
              utils.previousField(self).focus();
              self.triggerHandler('removeTimePicker');
            }
          })

          // Increment the hour by 1
          .on('hourIncrement', function() {
            var time = utils.timeFromString(self.val());
            time = (time + 60) % (60 * 24);
            self.triggerHandler('writeOutTime', time);
          })

          // Decrement the hour by 1
          .on('hourDecrement', function() {
            var time = utils.timeFromString(self.val());
            var minutesPerDay= 60 * 24;
            time = (minutesPerDay + time - 60) % minutesPerDay;
            self.triggerHandler('writeOutTime', time);
          })

          // Set the hour
          //  newHour: Hour to set
          //  useTwelveHourClock: if set to true, the supplied hour is relative to the current period (either am or pm)
          .on('hourSet', function(e, newHour, useTwelveHourClock) {
            if (utils.validHour(newHour)) {
              var time = utils.timeFromString(self.val());
              var currentMinutes = time % 60;  
              var currentHour = (time - currentMinutes) / 60;

              if (useTwelveHourClock && currentHour >= 12) {
                newHour = Number(newHour) + 12;
              }

              self.triggerHandler('writeOutTime', Number(newHour) * 60 + currentMinutes);
            } else {
              self.triggerHandler('writeOutTime', utils.timeFromString(self.val()));  
            }
          })

          // Increment the minutes by at max, opt.minuteInterval. Otherwise moves up to next interval.
          // e.g. 4:23 incremented with a 5 minute interval will go to 4:25, then again to 4:30
          .on('minuteIncrement', function() {
            var time = utils.timeFromString(self.val());
            var currentMinutes = time % 60;
            var timeWithoutMinutes = time - currentMinutes;
            var newMinutes = ((currentMinutes - currentMinutes % opt.minuteInterval) + opt.minuteInterval) % 60;
            self.triggerHandler('writeOutTime', timeWithoutMinutes + newMinutes);
          })

          // Decrement the minutes by at max, opt.minuteInterval. Otherwise moves down to previous interval.
          // e.g. 4:23 decremented with a 5 minute interval will go to 4:20, then again to 4:15
          .on('minuteDecrement', function() {
            var time = utils.timeFromString(self.val());
            var currentMinutes = time % 60;
            var timeWithoutMinutes = time - currentMinutes;
            var remainder = currentMinutes % opt.minuteInterval;
            var newMinutes = (currentMinutes - (remainder == 0 ? opt.minuteInterval : remainder) + 60) % 60;
            self.triggerHandler('writeOutTime', timeWithoutMinutes + newMinutes);
          })

          // Set the minutes
          //  newMinutes: Minutes to set
          .on('minuteSet', function(e, newMinutes) {
            if (utils.validMinute(newMinutes)) {
              var time = utils.timeFromString(self.val());
              var timeWithoutMinutes = time - (time % 60);
              self.triggerHandler('writeOutTime', timeWithoutMinutes + Number(newMinutes));
            } else {
              self.triggerHandler('writeOutTime', utils.timeFromString(self.val()));  
            }
          })

          // Switch the period, am -> pm, and pm -> am
          .on('periodIncrement periodDecrement', function() {
            var time = utils.timeFromString(self.val());
            self.triggerHandler('writeOutTime', (time + 12 * 60) % (24 * 60));
          })

          // Set the period. Any supplied period that starts with an a matches am, and starts with a p matches pm
          //   period: period to set to (am or pm)
          .on('periodSet', function(e, period) {
            var time = utils.timeFromString(self.val());

            if (period.match(amRegex) && time >= 12 * 60) {
              time = time - 12 * 60;
            } else if (period.match(pmRegex) && time < 12 * 60) {
              time = time + 12 * 60;
            }

            self.triggerHandler('writeOutTime', time);
          })

          // Parse timeString and handball it to writeOutTime
          //   timeString: string to parse
          .on('writeOutTimeString', function(e, timeString) {
            self.triggerHandler('writeOutTime', utils.timeFromString(timeString));
          })

          // Write out timeInMinutes to all the inputs in the timePicker, as well as the input with the plugin applied to it
          //   timeInMinutes: Time to write out.
          .on('writeOutTime', function(e, timeInMinutes) {
            if (self.data('time-component-inputs')) {
              for (var componentType in self.data('time-component-inputs')) {
                $.each(self.data('time-component-inputs')[componentType], function(i, component) {
                  component.val(utils.getValueForComponent(component.data('timeFormat'), timeInMinutes));
                });
              }  
            }

            self.val(utils.getTimeString(timeInMinutes));
          })

          // Add listeners to the page to move the timepicker if the page is resized, and to remove it if the user either
          // clicks outside the timepicker, or presses escape or return
          .on('addPageListeners', function() {
            self.data('clickOutSideListener', function (e) {
              if (self.data('timePicker') && $(e.target).closest(self.add(self.data('timePicker')).add(opt.ignoreClicksOn)).length == 0) {
                self.triggerHandler('removeTimePicker');
              }
            });

            self.data('windowResizeListener', function () {
              if (self.data('timePicker')) {
                utils.setAbsoluteElementsLeftProperty(self, self.data('timePicker'));
              }
            });

            self.data('documentKeyupListener', function(e) {
              if (e.keyCode == KEY.RETURN) {
                utils.nextField(self).focus();
                self.triggerHandler('removeTimePicker');
              } else if (e.keyCode == KEY.ESC) {
                self.triggerHandler('removeTimePicker');
              }
            });

            $(document).on('click.timePicker', self.data('clickOutSideListener'));
            $(window).on('resize.timePicker', self.data('windowResizeListener'));
            $(document).on('keyup.timePicker', self.data('documentKeyupListener'));
          })

          // Remove timePicker from the dom and clear out our reference to it, also remove any page listeners
          .on('removeTimePicker', function (e) {
            if (self.data('timePicker')) {
              $(document).off('click.timePicker', self.data('clickOutSideListener'));
              $(window).off('resize.timePicker', self.data('windowResizeListener'));
              $(document).off('keyup.timePicker', self.data('documentKeyupListener'));
              self.removeData('time-component-inputs');

              self.data('timePicker').fadeOut(opt.fadeOutSpeed, function () {
                self.data('timePicker').remove();
                self.data('timePicker', null);
                self.removeClass(opt.timePickerOpenClass);
              });
            }
          });
      });
    }
  });
})(jQuery);
