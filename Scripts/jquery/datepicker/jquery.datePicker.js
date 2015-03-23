/*

jquery.datePicker.js by Jaidev Soin

Version 2.1

Note: Currently highlighted dates in range doesn't work properly - not sure if fixing it is bloat as it really clutters the date pickers look

Triggers you might want to listen for:

datePickerDrawn(datePickerDiv)
writeOutDate(date)
datePickerRemoveStart(selectedDate, datePickerDiv) - selectedDate may be null
datePickerRemoveDone(selectedDate) - selectedDate may be null
  
Triggers you might want to use yourself:

writeOutDate(date)
click.datePicker
showNextMonth
showPastMonth
removeDatePicker(selectedDate) - selectedDate may be null
  
Date formatting:

d           Day of the month as digits; no leading zero for single-digit days.
dd          Day of the month as digits; leading zero for single-digit days.
ddd         Day of the month as ordinalized number (eg: 23rd)
m           Month as digits; no leading zero for single-digit months.
mm          Month as digits; leading zero for single-digit months.
mmm         Month as a three-letter abbreviation.
mmmm        Month as its full name.
yy          Year as last two digits; leading zero for years less than 10.
yyyy        Year represented by four digits.
*/

(function ($) {
  var KEY = {
    ESC: 27,
    RETURN: 13,
    TAB: 9,
    BS: 8
  };

  $.fn.extend({
    datePicker: function (opt) {
      opt = $.extend({
        fieldName: "date",
        monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        shortMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        shortDayNames: ["S", "M", "T", "W", "T", "F", "S"],
        startOfWeek: 1, // 0 = Sunday
        pastMonthSymbol: '&laquo;',
        nextMonthSymbol: '&raquo;',
        numberOfMonths: 1, // Number of months to show
        dateFormat: 'dd/mm/yy',
        fadeInSpeed: 200,
        fadeOutSpeed: 200,
        topOffset: 0,
        leftOffset: 0,
        delayHideOnSelectBy: 0,
        minDate: null, // Date object
        maxDate: null, // Date object
        earliest20thCenturyYear: 1940, // if only two year digits are pre-filled or typed in the input, this represents the earliest year that will be handled as a 20th century value (rather than 21st century) e.g. 1950.
        calculateMaxDateBasedOnCompanion: null, // Callback that returns a Date object. Expects the companion date (Date object) to be passed in. If this option is set maxDate will be ignored.
        companionPicker: null, // jQuery object
        useCompanionDateAsMin: false,
        startCalendarAtCompanionDate: false, // The month the calendar stats on is based on the value of the companion date
        header: null, // dom / jQuery element
        preventManualEntry: true, // Prevent manual date entry. 
        showOnFocus: true, // Show the datepicker when the field is tabbed to. Note: setting this to false without setting preventManualEntry to false will result in a weird interface
        alignment: 'left', // Datepicker will be left aligned with the left side of the input. Alternative is 'right',
        focusNextFieldOnDateSelect: true, // Automatically go to the next field based on tabindex when a date is chosen
        minDateErrorMessage: function (fieldName, minDateString) {
          return "Please enter a " + fieldName + " later than " + minDateString;
        },
        maxDateErrorMessage: function (fieldName, maxDateString) {
          return "Please enter a " + fieldName + " earlier than " + maxDateString;
        },
        lessThanCompanionDateErrorMessage: function (fieldName, companionDateString) {
          return "Please enter a " + fieldName + " later than " + companionDateString;
        },
        generalDateErrorMessage: function (fieldName, dateString) {
          return 'Please enter a valid ' + fieldName;
        },
        noDateEnteredErrorMessage: function (fieldName) {
          return "Please enter a " + fieldName;
        }
      }, opt);

      var utils = {
        calendarForMonth: function (month, year, selectedDate, selectedCompanionDate) {
          var tbody = $("<tbody></tbody>");

          // Generate day names
          var dayNames = $('<tr/>');

          for (var i = 0; i < 7; i++) {
            $('<th/>').html(opt.shortDayNames[(i + opt.startOfWeek) % 7]).appendTo(dayNames);
          }

          tbody.append(dayNames);

          // Generate the weeks
          var monthStartsOn = utils.monthStartsOn(month, year);
          var daysThisMonth = utils.daysInMonth(month, year);

          // Take into account startOfWeek, with the -7 % 7 to ensure the calendar starts at day -6 to 0
          var dayIndex = (monthStartsOn * -1 + opt.startOfWeek - 7) % 7;

          var today = utils.simplifyOrCorrectDate(new Date());

          var effectiveMaxDate = utils.getEffectiveMaxDate();

          while (dayIndex < daysThisMonth) {
            var week = $('<tr/>');

            for (var i = 0; i < 7; i++) {
              if (dayIndex < 0 || dayIndex >= daysThisMonth) {
                $('<td/>').appendTo(week);
              } else {
                var classes = [];

                // Valid day for this month
                var thisDay = utils.newDSTSafeDate(year, month, dayIndex + 1);

                // Direct comparrison fails for some reason.
                if (selectedDate - thisDay == 0) {
                  classes.push('selected');
                }

                if (today - thisDay == 0) {
                  classes.push('today');
                }

                if (selectedCompanionDate && selectedCompanionDate - thisDay == 0) {
                  classes.push('selectedCompanion');
                }

                if (selectedDate && selectedCompanionDate && ((selectedDate > thisDay && selectedCompanionDate < thisDay) || (selectedDate < thisDay && selectedCompanionDate > thisDay))) {
                  classes.push('inSelectionRange');
                }

                if ((opt.minDate && opt.minDate > thisDay) || (effectiveMaxDate && effectiveMaxDate < thisDay) || selectedCompanionDate && opt.useCompanionDateAsMin && selectedCompanionDate > thisDay) {
                  classes.push('disabled');
                }

                $(utils.sub("<td class='day'><a>#{day}</a></td>", {
                  day: thisDay.getDate()
                }))
                .addClass(classes.join(' '))
                .appendTo(week);
              }

              dayIndex++;
            };

            tbody.append(week);
          }

          var calendar = $(utils.sub("\
            <div class='datepicker-calendar'>\
              <div class='datepicker-calendar-title'>\
                <span class='datepicker-month'>#{month}</span> <span class='datepicker-year'>#{year}</span>\
              </div>\
              <table></table>\
            </div>\
          ", {
            month: opt.monthNames[month],
            year: year
          }))
          .data('month', month)
          .data('year', year);

          calendar.find('table').append(tbody);

          return calendar;
        },
        monthStartsOn: function (month, year) {
          return utils.newDSTSafeDate(year, month, 1).getDay();
        },
        daysInMonth: function (month, year) {
          // Look at how many days the month overflows by when you check what the 32nd day would be
          return 32 - utils.newDSTSafeDate(year, month, 32).getDate();
        },
        sub: function (html, values) {
          return html.replace(/#\{(\w*)\}/g, function (token, key) {
            return values[key] || token;
          });
        },
        dateFromInput: function (input) {
          if (input && input[0] && $.trim(input.val()).length > 0) {
            return utils.dateFromString(input.val());
          } else {
            return null;
          }
        },
        dateFromString: function (dateString) {
          // This utility strives for robustness. Whether whitespace is added / removed, numbers start with leading zeros or not, and whether years are 2 or 4 digits 
          // are all handled gracefully. Also allows use of numbers and strings for months to be interchangable. Eg: 03 will work if March is expected.
          var day, month, year, yearAsNumber, isTwoDigitYear, centuryForParsingTwoDigitYear;

          var dateFormat = opt.dateFormat;
          dateString = $.trim(dateString);

          // Treat the first non-word character as the seperator.
          var dateSeperators = dateString.replace(/[\w+\s+]/g, '');
          var dateSeperator = dateSeperators.length > 0 ? dateSeperators.substr(0, 1) : '';

          var formatSeperators = dateFormat.replace(/[dmy\s+]/g, '');
          var formatSeperator = formatSeperators.length > 0 ? formatSeperators.substr(0, 1) : '';

          // If date string has a different seperator to the date format, then for the purpose of parsing, change the seperator of the date format.
          if (dateSeperator != formatSeperator) {
            // Empty string means white space for either seperator. Gotta deal with that greedily.
            if (formatSeperator.length > 0) {
              dateFormat = dateFormat.replace(new RegExp(formatSeperator, 'g'),
                dateSeperator.length > 0 ? dateSeperator : ' ');
            } else {
              dateFormat = dateFormat.replace(/\s+/g, dateSeperator.length > 0 ? dateSeperator : ' ');
            }
          }

          // If the date string seperator is white space, be greedy.
          if (dateSeperator.length == 0) {
            dateSeperator = /\s+/;
          }

          var splitFormat = dateFormat.split(dateSeperator);
          var splitDate = dateString.split(dateSeperator);

          for (var i = 0; i < splitFormat.length; i++) {
            var formatSection = $.trim(splitFormat[i]).substr(0, 1);
            var dateSection = $.trim(splitDate[i]);

            switch (formatSection) {
              case 'd':
                day = Number(dateSection.replace(/\D/g, ''));
                break;

              case 'm':
                if (isNaN(dateSection)) {
                  var lowerCaseMonth = dateSection.toLowerCase();

                  for (var j = 0; j < opt.shortMonthNames.length; j++) {
                    if (opt.shortMonthNames[j].toLowerCase() == lowerCaseMonth) {
                      month = j;
                      break;
                    }
                  }

                  if (month == undefined) {
                    for (var j = 0; j < opt.shortMonthNames.length; j++) {
                      if (opt.monthNames[j].toLowerCase() == lowerCaseMonth) {
                        month = j;
                        break;
                      }
                    }
                  }
                } else {
                  month = Number(dateSection) - 1;
                }
                break;

              case 'y':
                yearAsNumber = Number(dateSection);
                isTwoDigitYear = (yearAsNumber < 100);
                if (!isTwoDigitYear) {
                  year = yearAsNumber;
                  break;  
                }
                // Handle a two digit year
                if (yearAsNumber >= (opt.earliest20thCenturyYear - 1900)) {
                  centuryForParsingTwoDigitYear = 1900;
                } else {
                  centuryForParsingTwoDigitYear = 2000;
                }
                year = Number(dateSection) + centuryForParsingTwoDigitYear;
                break;
            }
          }

          // If there is an invalid date in the input, nothing should be selected
          if (isNaN(year) || isNaN(month) || isNaN(day) || year < 0 || month < 0 || day < 1) {
            return null;
          } else {
            return utils.newDSTSafeDate(year, month, day);
          }
        },
        getDateError: function (date, checkAgainstCompanionDateIfMin) {

          if (checkAgainstCompanionDateIfMin && opt.useCompanionDateAsMin) {
            var companionDate = utils.dateFromInput(opt.companionPicker);
          }

          var effectiveMaxDate = utils.getEffectiveMaxDate();

          if ((opt.minDate && opt.minDate > date) || (companionDate && companionDate > date)) {
            // We want to return based on the larger of either min date or companion date
            if (companionDate && companionDate > opt.minDate) {
              return opt.lessThanCompanionDateErrorMessage(
                opt.fieldName, utils.getDateString(companionDate));
            } else {
              return opt.minDateErrorMessage(opt.fieldName, utils.getDateString(opt.minDate));
            }
          } else if (effectiveMaxDate && effectiveMaxDate < date) {
            return opt.maxDateErrorMessage(opt.fieldName, utils.getDateString(effectiveMaxDate));
          } else {
            return null;
          }
        },
        getDateString: function (date) {
          // Convert the passed in date format into something sub can use.
          var dateFormatForOutput = opt.dateFormat.replace(/(?:d+|m+|y+)/g, function (token) {
            return "#{" + token + "}";
          });

          var day = date.getDate();
          var month = date.getMonth() + 1;
          var year = date.getFullYear();

          // Sub will only sub in what tokens exist in the dateFormatForOutput string
          return utils.sub(dateFormatForOutput, {
            d: day,
            dd: utils.addLeadingZero(day),
            ddd: utils.ordinalize(day),
            m: month,
            mm: utils.addLeadingZero(month),
            mmm: opt.shortMonthNames[month - 1],
            mmmm: opt.monthNames[month - 1],
            yy: String(year).substr(2, 2),
            yyyy: year
          });
        },
        simplifyOrCorrectDate: function (date) {
          // This method does two things:
          // 1) Specific hours / minutes / seconds in the min and max dates mess with comparrisons
          // 2) There exists a bug with certain browsers (e.g. Safari) where creating a date on the first day of daylight savings 
          //    instead creates one for 11pm the night before. This method tests for those broken dates and fixes them.
          //
          // Note: Things can still go funny once a year around the hour of the DST change over. I don't think there is much
          // we can do about this, as the Javascript Date object just is fundamentally broken. Also, the following code could shift 
          // date by sheer luck if the time is legitimately 11pm and 0 miliseconds on DST eve, but the probability of this doing
          // harm is very very low.

          var dayAfter = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
          var twoDaysAfter = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2);

          var exactly11pm = date.getHours() == 23 && date.getMinutes() == 0 && date.getSeconds() == 0 && date.getMilliseconds() == 0;
          var dayAfterSameTimezone = date.getTimezoneOffset() == dayAfter.getTimezoneOffset();
          var offsetHoursDifference = (date.getTimezoneOffset() - twoDaysAfter.getTimezoneOffset())/60;
          var twoDaysAfterLaterTimezone = offsetHoursDifference > 0;

          if (exactly11pm && dayAfterSameTimezone && twoDaysAfterLaterTimezone) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, offsetHoursDifference);
          } else {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
          }
        },
        ordinalize: function (number) {
          if (11 <= number % 100 && number % 100 <= 13) {
            return number + "th";
          } else {
            var extenions = { 1: 'st', 2: 'nd', 3: 'rd' };
            return number + (extenions[number % 10] || 'th');
          }
        },
        addLeadingZero: function (number) {
          return (number >= 10) ? number : '0' + String(number);
        },
        getFieldByRelativeTabIndex: function (field, relativeIndex) {
          var fields = $(field.closest('form')
          .find('a[href], button, input, select, textarea')
          .filter(':visible').filter(':enabled')
          .toArray()
          .sort(function (a, b) {
            return ((a.tabIndex > 0) ? a.tabIndex : 1000) - ((b.tabIndex > 0) ? b.tabIndex : 1000);
          }));

          return fields.eq((fields.index(field) + relativeIndex) % fields.length);
        },
        nextField: function (field) {
          return utils.getFieldByRelativeTabIndex(field, 1);
        },
        previousField: function (field) {
          return utils.getFieldByRelativeTabIndex(field, -1);
        },
        getEffectiveMaxDate: function () {
          if (typeof opt.calculateMaxDateBasedOnCompanion === 'function') {
            return utils.getMaxDateBasedOnCompanion();
          } else {
            return opt.maxDate;
          }
        },
        getMaxDateBasedOnCompanion: function() {
          var companionDate = utils.dateFromInput(opt.companionPicker);
          return utils.simplifyOrCorrectDate(opt.calculateMaxDateBasedOnCompanion(companionDate));
        },
        // This is to help fix a Safari 7 / iOS 7 bug referred to in utils.simplifyOrCorrectDate()
        newDSTSafeDate: function(year, month, day) {
          var date = new Date(year, month, day);

          if (date.getDate() != day) {
            return utils.simplifyOrCorrectDate(date);
          } else {
            return date;
          }
        }
      };

      if (opt.minDate) {
        opt.minDate = utils.simplifyOrCorrectDate(opt.minDate);
      }

      if (opt.maxDate) {
        opt.maxDate = utils.simplifyOrCorrectDate(opt.maxDate);
      }

      return this.each(function () {
        var self = $(this)

          .bind('focus.datepicker', function () {
            if (opt.showOnFocus) {
              self.triggerHandler('setup.datepicker');
            }
          })

          .bind('blur.datepicker', function () {
            if (!opt.preventManualEntry) {
              if ($.trim(self.val()).length > 0) {
                var selectedDate = utils.dateFromInput(self);

                if (selectedDate) {
                  var dateError = utils.getDateError(selectedDate, true);

                  if (dateError) {
                    self.triggerHandler('displayDateError', dateError, [selectedDate]);
                  } else {
                    self.triggerHandler('writeOutDate', [selectedDate]);
                    self.triggerHandler('removeDateError');
                  }
                } else {
                  self.triggerHandler('displayDateError', 
                    opt.generalDateErrorMessage(opt.fieldName, self.val()), [self.val()]);
                }
              } else {
                self.triggerHandler('displayDateError', 
                  opt.noDateEnteredErrorMessage(opt.fieldName));
              }
            }
          })

          .bind('click.datepicker', function () {
            self.triggerHandler('setup.datepicker');
          })

          .bind('setup.datepicker', function () {
            if (!self.data('datepicker')) {
              if (opt.useCompanionDateAsMin) {
                var companionDate = utils.dateFromInput(opt.companionPicker);
                var dateError = utils.getDateError(companionDate);

                if (!dateError && companionDate > utils.dateFromInput(self)) {
                  self.triggerHandler('writeOutDate', [companionDate]);
                }
              }

              self.triggerHandler('drawDatePicker');
            }

            if (opt.preventManualEntry) {
              self.val(self.val()); // IE fix - while the input is blurred, the text remains selected which is confusing to the user. This deselects the text. 
              // Slight hack required to blur the datepicker when focus is manually triggered in the JS - Previously it was performing both a blur and a return false, but
              // I don't believe a return false does anything in this case (just returns false to the triggerHandler call). Note preventing default on the blur does not 
              // work as it doesn't cause the previously selected element to blur
              setTimeout(function() {
                self.trigger('blur.datepicker');
              }, 1);
            } else {
              self.select();
            }
          })

          .bind('drawDatePicker', function () {
            var top = self.offset().top + self.outerHeight() + opt.topOffset;

            var datePickerDiv = $(utils.sub("\
              <div class='datepicker #{alignment}'>\
                <div class='datepicker-calendars'>\
                  <a class='datepicker-show-past-month'>#{pastMonth}</a>\
                  <a class='datepicker-show-next-month'>#{nextMonth}</a>\
                </div>\
              </div>\
            ", {
              pastMonth: opt.pastMonthSymbol,
              nextMonth: opt.nextMonthSymbol,
              alignment: opt.alignment
            }))
            .css({
              'position': 'absolute',
              'display': 'none',
              'top': top + 'px',
              'z-index': '99999'
            });

            if (opt.headerText || opt.panelCloseText) {
              var header = $("<h3>" + opt.headerText + "</h3>" +
                "<a class='" + opt.panelCloseClass + "'>" + opt.panelCloseText + "</a>")
              datePickerDiv.prepend(header);
            }

            var selectedDate = utils.dateFromInput(self);
            var companionDate = utils.dateFromInput(opt.companionPicker);
            var firstCalendarMonth;

            if (companionDate && opt.startCalendarAtCompanionDate) {
              firstCalendarMonth = companionDate;
            } else if (selectedDate) {
              firstCalendarMonth = selectedDate;
            } else {
              firstCalendarMonth = utils.simplifyOrCorrectDate(new Date());
            }

            for (var i = 0; i < opt.numberOfMonths; i++) {
              var month = utils.newDSTSafeDate(firstCalendarMonth.getFullYear(), firstCalendarMonth.getMonth() + i, 1);
              datePickerDiv.find('.datepicker-calendars').append(utils.calendarForMonth(month.getMonth(), month.getFullYear(), selectedDate, companionDate));
            };

            self.data('datepicker', datePickerDiv);

            $('body').append(datePickerDiv);

            self.addClass('datepicker-open');
            self.triggerHandler('addListeners');

            datePickerDiv.fadeIn(opt.fadeInSpeed, function () {
              self.triggerHandler('datePickerDrawn', [datePickerDiv]);
            });

            // This has to happen once the datepicker is loaded into the dom so we know how wide it is. The user won't see it move at all.
            self.triggerHandler('setDatePickersLeftProperty');
          })

          .bind('setDatePickersLeftProperty', function () {
            var left = self.offset().left + opt.leftOffset;

            if (opt.alignment == 'right') {
              left = left + self.outerWidth() - self.data('datepicker').outerWidth();
            }

            self.data('datepicker').css('left', left + 'px');
          })

          .bind('addListeners', function () {
            self.data('datepicker').bind('click.datepicker', function (e) {
              var a = $(e.target).closest('a');

              if (a.hasClass('datepicker-show-next-month')) {
                self.triggerHandler('showNextMonth');
              } else if (a.hasClass('datepicker-show-past-month')) {
                self.triggerHandler('showPastMonth');
              } else if (!a.closest('td').hasClass('disabled') && a.closest('td.day')[0] && a[0]) {
                self.triggerHandler('selectDay', [a]);
              }

              return false;
            });

            // We need to keep proper track of these methods so we can unbind them without unbinding the events set by any other datePicker instance.
            self.data('checkForClickOutside', function (e) {
              if (e.target != self[0]) {
                self.triggerHandler('removeDatePicker');
              }
            });

            $(document).bind('click.datepicker', self.data('checkForClickOutside'));

            self.data('checkForActionKeydowns', function (e) {
              if (e.keyCode == KEY.ESC || e.keyCode == KEY.TAB) {
                if (e.keyCode == KEY.TAB) {
                  if (e.shiftKey) {
                    utils.previousField(self).focus();
                  } else {
                    utils.nextField(self).focus();
                  }
                }

                self.triggerHandler('removeDatePicker');

                return false;
              }
              else if (e.keyCode == KEY.BS && opt.preventManualEntry) {
                // This handles the case where the user has clicked the input, and presses backspace in order to clear it, but intead the browser navigates back
                return false;
              }
            });

            $(document).bind('keydown.datepicker', self.data('checkForActionKeydowns'));

            self.data('checkForWindowResize', function () {
              self.triggerHandler('setDatePickersLeftProperty');
            });

            $(window).bind('resize.datepicker', self.data('checkForWindowResize'));
          })

          .bind('showNextMonth', function () {
            var lastVisibleMonth = self.data('datepicker').find('.datepicker-calendar:last');
            var nextMonth = utils.newDSTSafeDate(lastVisibleMonth.data('year'), lastVisibleMonth.data('month') + 1, 1);
            lastVisibleMonth.after(utils.calendarForMonth(nextMonth.getMonth(), nextMonth.getFullYear(), utils.dateFromInput(self), utils.dateFromInput(opt.companionPicker)));
            self.data('datepicker').find('.datepicker-calendar:first').remove();
          })

          .bind('showPastMonth', function () {
            var firstVisibleMonth = self.data('datepicker').find('.datepicker-calendar:first');
            var lastMonth = utils.newDSTSafeDate(firstVisibleMonth.data('year'), firstVisibleMonth.data('month') - 1, 1);
            firstVisibleMonth.before(utils.calendarForMonth(lastMonth.getMonth(), lastMonth.getFullYear(), utils.dateFromInput(self), utils.dateFromInput(opt.companionPicker)));
            self.data('datepicker').find('.datepicker-calendar:last').remove();
          })

          .bind('selectDay', function (e, a) {
            var calendar = a.closest('.datepicker-calendar');
            var selectedDate = utils.newDSTSafeDate(calendar.data('year'), calendar.data('month'), a.text());

            self.data('datepicker').find('.selected').removeClass('selected');
            a.closest('td').addClass('selected');

            self.triggerHandler('writeOutDate', [selectedDate]);
            self.triggerHandler('removeDatePicker', [selectedDate]);
            self.triggerHandler('removeDateError');
          })

          .bind('writeOutDate', function (e, date) {
            if (date) {
              self.val(utils.getDateString(date));
            }
          })

          .bind('setCalculateMaxDateBasedOnCompanion', function(e, newValue) {
            opt.calculateMaxDateBasedOnCompanion = newValue;
            if (typeof opt.calculateMaxDateBasedOnCompanion === 'function') {
              var maxDate = utils.getMaxDateBasedOnCompanion();
              var currentDate = utils.dateFromInput(self);
              if (currentDate > maxDate) {
                self.triggerHandler('writeOutDate', maxDate);
              }
            }
          })

          .bind('removeDatePicker', function (e, selectedDate) {
            if (self.data('datepicker')) {
              $(document).unbind('click.datepicker', self.data('checkForClickOutside'));
              $(document).unbind('keydown.datepicker', self.data('checkForActionKeydowns'));
              $(window).unbind('resize.datepicker', self.data('checkForWindowResize'));
              self.data('datepicker').unbind('click.datepicker');
              self.removeClass('datepicker-open');

              self.triggerHandler('datePickerRemoveStart', [selectedDate, self.data('datepicker')]);

              setTimeout(function () {
                self.data('datepicker').fadeOut(opt.fadeOutSpeed, function () {
                  self.data('datepicker').remove();
                  self.data('datepicker', null);
                  self.data('checkForClickOutside', null);

                  if (selectedDate && opt.focusNextFieldOnDateSelect) {
                    utils.nextField(self).focus();
                  }

                  self.triggerHandler('datePickerRemoveDone', [selectedDate]);
                });
              }, selectedDate ? opt.delayHideOnSelectBy : 0);
            }
          });
      });
    }
  });
})(jQuery);