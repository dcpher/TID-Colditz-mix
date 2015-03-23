; (function ($) {
  $.fn.extend({
    carousel: function (opt) {
      var settings = $.extend({
        'panelWidth' : '100',
        'animationDuration' : '1000',
        'classNav' : 'carouselNav', // Class name for the carousel UL
        'classPrev' : 'carouselPrev', // Class name for the 'previous' LI
        'classNext' : 'carouselNext', // Class name for the 'next' LI
        'classDot' : 'carouselDot' // Class name for the other LIs (the dots)
      }, opt);

      var utils = {
        genMenuMarkup: function (n) {
          var markup = "<ul class='" + settings.classNav + "'><li class='" + settings.classPrev + "'>&lt;</li>";
          for (i = 1; i <= n; i++) {
            if (i == 1) {
              // Chuck active class on the first dot
              markup += "<li class='" + settings.classDot + " active'>" + i + "</li>";
            }
            else {
              markup += "<li class='" + settings.classDot + "'>" + i + "</li>";
            }
          }
          markup += "<li class='" + settings.classNext + "'>&gt;</li></ul>";
          return markup;
        },
        animateTo: function($base) {
          var currentLocation = $base.data('currentLocation');

          // Needs refactor... quickly done for footprints release
          // Remove active class from previously active li and add to new one
          $("." + settings.classNav + " .active").removeClass("active");
          $("." + settings.classNav + " ." + settings.classDot).eq(currentLocation - 1).addClass("active");

          var targetPosition = settings.panelWidth * (currentLocation - 1);
          $base.animate(
            {
              left: -targetPosition
            },
            {
              duration: settings.animationDuration,
              queue: false
            }
          );
        }
      };

      return this.each(function () {
        
        var $base = $(this);

        $base
          // Store some data about the panels in the base object
          .data('$panels', $base.children("li"))
          .data('totalPanels', $base.data('$panels').length)
          .data('currentLocation', 1)

          .on('carousel.init', function () {
            $('.carousel-wrapper').after(utils.genMenuMarkup($base.data('totalPanels')));

            $menuElements = $base.closest("div").siblings("." + settings.classNav).children("li." + settings.classDot);
            $menuElements.each(function (index) {
              $(this).data('position', index + 1);
            });

            // Remove the class from each of the image li's
            $base.children("li").each(function () {
              $image = $(this);
              if($image.hasClass("hideMe")) {
                $(this).removeClass("hideMe");
              }
            });
          })
          .on('carousel.clickDot', function (event, li) {
            $base.data('currentLocation', $(li).data('position'));
            currentLocation = $base.data('currentLocation');
            utils.animateTo($base);
          })
          .on('carousel.clickPrev', function (event, li) {
            
            if ($base.data('currentLocation') == 1) {
              $base.data('currentLocation', $base.data('totalPanels'));
            }
            else {
              $base.data('currentLocation', $base.data('currentLocation') - 1);
            }
            utils.animateTo($base);

          })
          .on('carousel.clickNext', function (event, li) {

            if ($base.data('currentLocation') == $base.data('totalPanels')) {
              $base.data('currentLocation', 1);
            }
            else {
              $base.data('currentLocation', $base.data('currentLocation') + 1);
            }
            utils.animateTo($base);

          })
          .trigger('carousel.init')

          // Traverse to the nav dots
          .closest("div").siblings("." + settings.classNav).children("li." + settings.classDot)

          .on("click", function () {
            $base.trigger('carousel.clickDot', this);
          })
          // Traverse to the Prev button
          .siblings("li." + settings.classPrev)
          .on("click", function () {
            $base.trigger('carousel.clickPrev', this);
          })

          // Traverse to the Next button
          .siblings("li." + settings.classNext)
          
          .on("click", function () {
            $base.trigger('carousel.clickNext', this);
          })
        ;

      });

    }
  });
})(jQuery);
