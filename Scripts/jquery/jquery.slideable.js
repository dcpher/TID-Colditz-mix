;(function ($) {
  $.fn.extend({
    slideable: function(opt) {
      var settings = $.extend({
        'togglerSel' : '.header', // selector for the el that triggers toggle
        'traversal' : 'siblings', // where in the dom can we find the toggle trigger?
        'slideSpeed' : 'fast',
        'defaultOpen' : 'important', // class that opens slider by default onload
        'statusOpen'  : 'slideable-open', // classes for the toggle trigger
        'statusClosed' : 'slideable-closed'
      }, opt);
      
      return this.each(function () {
        var $base = $(this);

        $base.on('slideable.open', function () {
          if (!$base.is(":visible"))
             $base.trigger('slideable.toggle');
        })
        .on('slideable.close', function () {
          if ($base.is(":visible"))
             $base.trigger('slideable.toggle');
        })
        .on('slideable.toggle', function() {
          $base.slideToggle(settings.slideSpeed) // might have to refactor that to avoid jumpy animation caused by margins
          // toggle statusOpen / statusClose classes on the toggler
          .data('toggler').toggleClass(
              settings.statusClosed + " " + settings.statusOpen );
        })
        .data('toggler', $($base[settings.traversal](settings.togglerSel))); // the element that triggers the slideToggle

        $base.data('toggler').on('click.slideable', function () {
          $base.trigger('slideable.toggle');
        })
        .css('cursor', 'pointer') // should be done in css but we want a pointer in every case
        .addClass(settings.statusClosed); 

        // slide me up when i am important enough
        if ($base.hasClass(settings.defaultOpen)) 
          $base.trigger('slideable.toggle');
      });
    } 
  });
})(jQuery);
