/*

jquery.scrollTracking.js by Jaidev Soin

// Note: This tracking acts a bit funny on iPhone due to the way it zooms the screen. Ignore mobile in results.

*/

(function ($) {
  $.fn.extend({
    scrollTracking: function (callback) {
      return this.each(function () {
        var win = $(window);
        var scrollCheck;
        
        var self = $(this)
          .on('init.scrollTracking', function() {
            
            scrollCheck = function() {
              self.triggerHandler('checkPosition');
            };
            
            win.on('resize scroll', scrollCheck);
            
            
            self.triggerHandler('checkPosition');
          })
          
          .on('checkPosition', function() {
            if (!self.data('scrollTrackingComplete')) {
              var bottomOfElement = self.offset().top + self.outerHeight(); // Note this can change between checks due to a dynamic page
              var windowHeight = win.height();
              var scrollTop = win.scrollTop();
              var bottomOfWindow = windowHeight + scrollTop;
            
              if (bottomOfWindow >= bottomOfElement) {
                if (callback && typeof(callback) == 'function') {
                  callback();
                } else {
                  throw new Error('No callback supplied for scrollTracking or callback not a function');
                }
              
                win.off('resize scroll', scrollCheck);
                self.data('scrollTrackingComplete', true);
              }
            }
          });
          
        self.triggerHandler('init.scrollTracking');
      });
    }
  });
})(jQuery);