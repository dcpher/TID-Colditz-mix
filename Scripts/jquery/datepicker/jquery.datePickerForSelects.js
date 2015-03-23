/*

jquery.datePickerForSelects.js by Jaidev Soin

This plugin configures a date picker with support for reading and writing to selects for non JS support.
For usage, options, and triggers, refer to the parent plugin.

Options passed in to this plugin are passed to parent

*/

(function ($) {

    $.fn.extend({
        datePickerForSelects: function (daySelect, monthSelect, yearSelect, opt) {
            var utils = {
                dateFromSelects: function () {
                    var day = daySelect.val();
                    var month = monthSelect.val() - 1;
                    var year = yearSelect.val();
                    return this.newDSTSafeDate(year, month, day);
                },
                maxDateFromSelects: function () {
                    var day = daySelect.find('option:last').val();
                    var month = monthSelect.find('option:last').val() - 1;
                    var year = yearSelect.find('option:last').val();
                    return this.newDSTSafeDate(year, month, day);
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
                    var offsetHoursDifference = (date.getTimezoneOffset() - twoDaysAfter.getTimezoneOffset()) / 60;
                    var twoDaysAfterLaterTimezone = offsetHoursDifference > 0;

                    if (exactly11pm && dayAfterSameTimezone && twoDaysAfterLaterTimezone) {
                        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, offsetHoursDifference);
                    } else {
                        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    }
                },
                // This is to help fix a Safari 7 / iOS 7 bug referred to in utils.simplifyOrCorrectDate()
                newDSTSafeDate: function (year, month, day) {
                    var date = new Date(year, month, day);

                    if (date.getDate() != day) {
                        return utils.simplifyOrCorrectDate(date);
                    } else {
                        return date;
                    }
                }
            };

            opt = $.extend({
                headerText: "",                 // Title on the date picker panel
                panelCloseText: "Close x",      // Text displayed on close link in the date picker panel.
                panelCloseClass: "closePanel",  // Class applied to the close link in the date picker panel
                numberOfMonths: 2,              // Number of months to display in the date picker panel
                dateFormat: 'ddd mmmm yyyy',    // Date format of 1st Jan 2012
                minDate: new Date(),            // Minimum date allowed in the date picker
                maxDate: utils.maxDateFromSelects()  // Max date for the date picker, it is based on the max date the selects allow
            }, opt);

            return this.each(function () {
                var self = $(this)

                  .on('init.quotePanelDatePicker', function () {
                      // Hide selects
                      daySelect.add(monthSelect).add(yearSelect).hide();

                      // Init date from selects
                      self
                        .datePicker(opt)
                      // Add a listener to the "Close" link at the top of the datepicker
                        .on('datePickerDrawn', function (e, datePicker) {
                            datePicker.find('.' + opt.panelCloseClass).on('click', function () {
                                self.triggerHandler('removeDatePicker');
                            });
                        })

                        .on('writeOutDate', function (e, date) {
                            self.data('date', date);

                            daySelect.val(date.getDate());
                            monthSelect.val(date.getMonth() + 1);
                            yearSelect.val(date.getFullYear());
                        })

                        .trigger('writeOutDate', [utils.dateFromSelects()]);
                  });

                self.triggerHandler('init.quotePanelDatePicker');
            });
        }
    });
})(jQuery);