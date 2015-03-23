(function ($) {
  $.fn.extend({
    donationPanel: function (options) {
      // Options
      
      var opt = $.extend({
        projectImageSelector: '.project',                 // Selector for each donation project image.
        projectSelector: '.item',                         // Selector for each donation project block.
        chosenProjectClass: 'selected'                    // Class that denotes the currently chosen project.
      }, options);

      opt.chosenProjectSelector = "." + opt.chosenProjectClass;
      
      // Set up handlers for each item JQuery object in the set.

      return this.each(function () {

        var $self = $(this)

          .on('init.donationPanel', function () {
            // Mark the chosen project as selected.
            $("input[type='radio']:checked", $self)
              .closest(opt.projectSelector)
              .addClass(opt.chosenProjectClass);

            // Hook up radio click
            $("input[type='radio']", $self)
            .off('click.donationPanel')
            .on('click.donationPanel', function () {
              $(opt.chosenProjectSelector, $self)
                .removeClass(opt.chosenProjectClass);
              $(this)
                .closest(opt.projectSelector)
                .addClass(opt.chosenProjectClass);
            });

            // Hook up project block click
            $(opt.projectSelector, $self)
            .off('click.donationPanel')
            .on('click.donationPanel', function () {
              $(this).children(":radio")[0].click();
            });

            // Hook up project image click.
            $(opt.projectImageSelector, $self)
            .off('click.donationPanel')
            .on('click.donationPanel', function () {
              $(this).siblings(":radio")[0].click();
            });
          });
        
        // On plugin load, fire off init

        $self.trigger('init.donationPanel');
      });
    }
  });
})(jQuery);
