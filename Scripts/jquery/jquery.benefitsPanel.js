(function ($) {
  $.fn.extend({
    benefitsPanel: function(options) {
      // Options

      var opt = $.extend({
        outClass: 'o',                                    // The class that denotes an opened out benefit summary block.
        inClass: 'i',                                     // The class that denotes a closed in benefit summary block.
        benefitSelector: '#benefits-list dd',             // Selector for a benefit summary block.
        toggleButtonSelector: 'dt',                       // Selector for the toggle benefit summary block button.
        contractAllLabel: '[ - ] Contract all benefits',  // Text label for the contract-all-benefits button.
        expandAllLabel: '[ + ] Expand all benefits'       // Text label for the expand-all-benefits button.
      }, options);
      
      // Set up handlers for each item JQuery object in the set.

      return this.each(function () {
        
        var $self = $(this)

          .on('init.benefitsPanel', function() {
            $(opt.benefitSelector).hide().slideable({
               "togglerSel": opt.toggleButtonSelector
            });
          })
        
          .on('click.benefitsPanel', function() {
            if ($self.hasClass(opt.outClass)) {
              $(opt.benefitSelector).trigger("slideable.open");
              $self
                .removeClass(opt.outClass)
                .addClass(opt.inClass)
                .html(opt.contractAllLabel);
            }
            else if ($self.hasClass(opt.inClass)) {
              $(opt.benefitSelector).trigger("slideable.close");
              $self
                .removeClass(opt.inClass)
                .addClass(opt.outClass)
                .html(opt.expandAllLabel);
            }
          });
        
        // On plugin load, fire off init

        $self.trigger('init.benefitsPanel');
      });
    }
  });
})(jQuery);
