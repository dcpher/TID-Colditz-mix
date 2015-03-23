/*

jQuery.placeholderPlus.js by Jaidev Soin

Version 1

*/

// For future dev, maybe support:
// - Registering a form to listen to a submit method from
// - Remove placeholder if required call that has to be explicitly called instead

(function ($) {
  $.fn.extend({
    placeholderPlus: function (placeholderText, opt) {
      opt = $.extend({
        placeholderClass: 'placeholder'
      }, opt);

      return this.each(function () {
        var mouseIsDown;

        var self = $(this)

          .bind('init.placeholderPlus', function () {
            self.triggerHandler('blur.placeholderPlus');
            self.triggerHandler('addBodyListener');
          })

          .bind('focus.placeholderPlus', function(e) {
            if (self.data('defaultValue')) {
              self.select()

              if (mouseIsDown) {
                // This allows the select to persist even after a click event, but ensures the field can then be manually deselected using the mouse
                self.one('mouseup.placeholderPlus', function (e) {
                  e.preventDefault();
                });
              }
            } else if (self.val() == placeholderText) {
              self.removeClass(opt.placeholderClass).val('');
            }
          })

          .bind('mousedown.placeholderPlus', function() {
            mouseIsDown = true;
          })

          .bind('addBodyListener', function() {
            $('body').bind('mouseup.placeholderPlus', function() {
              mouseIsDown = false;
            });
          })

          .bind('blur.placeholderPlus', function() {
            if (self.data('defaultValue')) {
              self.val(self.data('defaultValue'));
            } else if (self.val() == '') {
              self.addClass(opt.placeholderClass).val(placeholderText);
            }
          })

          .bind('setDefaultValue', function(e, defaultValue) {
            self.val(defaultValue).removeClass(opt.placeholderClass);
            self.data('defaultValue', defaultValue);
          });

        self.triggerHandler('init.placeholderPlus');
      });
    }
  });
})(jQuery);
