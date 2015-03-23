(function ($) {
  $.fn.extend({
    toggleSwitch: function($toggleValueHidden, $manualUpdate, options) {
      // Options

      var opt = $.extend({
        isEditEnabled: true,          // Whether the toggle switch is currently enabled for editing
        switchedOnClass: 'o',         // The class that denotes that the toggle is in the 'on' state.
        switchedOnValue: 'True',      // The hidden field value to set when in switched on state.
        switchedOffValue: 'False'     // The hidden field value to set when in switched off state.
      }, options);
      
      // Set up handlers for each JQuery object in the set.

      return this.each(function () {
        
        var $self = $(this)

          .on('init.toggleSwitch', function () {
            var $this;
            $this = $(this);
            if ($toggleValueHidden.attr("value") === opt.switchedOnValue) {
              $this.addClass(opt.switchedOnClass);
            }
          })

          .on('click.toggleSwitch', function () {
            var $this;
            if (opt.isEditEnabled) {
              $this = $(this);
              if ($toggleValueHidden.attr("value") === opt.switchedOffValue) {
                $this.addClass(opt.switchedOnClass);
                $toggleValueHidden.attr("value", opt.switchedOnValue);
              } else {
                $this.removeClass(opt.switchedOnClass);
                $toggleValueHidden.attr("value", opt.switchedOffValue);
              }
              if ($manualUpdate !== undefined && $manualUpdate !== null) {
                $manualUpdate.click();
              }
            }
          })

          .on('disableEdit.toggleSwitch', function() {
            opt.isEditEnabled = false;
          })

          .on('enableEdit.toggleSwitch', function() {
            opt.isEditEnabled = true;
          });

        // On plugin load, fire off init

        $self.trigger('init.toggleSwitch');
      });
    }
  });
})(jQuery);
