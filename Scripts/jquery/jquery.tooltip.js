(function ($) {
  $.fn.extend({
    tooltip: function($tooltipPanel, options) {
      // Options

      var opt = $.extend({
        closeButtonSelector: '.close',       // The selector for the close button on the tooltip panel
        panelShownClass: 'o',                // The class that denotes that the tooltip panel is visible.
        panelHiddenClass: 'i'                // The class that denotes that the tooltip panel is invisible.
      }, options);
      
      // Set up handlers for each JQuery object in the set.

      return this.each(function () {
        
        var $self = $(this)

          .on('init.tooltip', function () {
            $tooltipPanel.hide();
            // Set up the close button.
            var $closeButton = $(opt.closeButtonSelector, $tooltipPanel);
            $closeButton
              .off('click.tooltip')
              .on('click.tooltip', function (e) {
                $tooltipPanel
                  .removeClass(opt.panelHiddenClass)
                  .addClass(opt.panelShownClass)
                  .fadeOut();
                e.preventDefault();
                return false;
              });
          })

          .on('click.tooltip', function (e) {
            $tooltipPanel
              .removeClass(opt.panelShownClass)
              .addClass(opt.panelHiddenClass)
              .fadeIn();
            e.preventDefault();
            return false;
          });

        // On plugin load, fire off init

        $self.trigger('init.tooltip');
      });
    }
  });
})(jQuery);
