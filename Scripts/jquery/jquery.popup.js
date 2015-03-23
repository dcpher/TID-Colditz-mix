(function ($) {
  $.fn.extend({
    popup: function(options) {
      var

        opt = $.extend({
          url: null,
          popupDivId: 'popup',
          showOverlay: true,
          respondToEsc: true,
          popupLinkSelector: null,
          ajaxPostSelector: "input[type=submit]",
          ajaxGetSelector: "a.load-by-ajax",
          closeButtonSelector: ".close"
        }, options),

        popupContentDivId = 'popup-content',

        appendToElement = $('body'),

        $popupDiv = $("<div></div>")
          .attr('class', 'javascript-popup loading')
          .attr('id', opt.popupDivId),

        $popupContentDiv = $("<div></div>")
          .attr('class', 'javascript-popup-content')
          .attr('id', popupContentDivId),

        $overlayDiv = $("<div></div>")
          .attr('class', 'javascript-popup-overlay'),

        $closeButton = $("<a href='#'>&times; Close</a>")
          .attr('class', 'close');

      // Set up handlers for each item JQuery object in the set.

      return this.each(function() {

        var $self = $(this)

          // Event handlers
          .on('init.popup', function () {
            // Set up click event.
            $self.on('click.popup', opt.popupLinkSelector, function (e) {
              // Popup function is actually attached to the container of the link that needs 
              // to open the popup, and we use event delegation to pick up whether it was bubbled 
              // up by the link. This is done rather than hooking into the link directly because 
              // the link itself might be replaced by AJAX operations. This also assumes use of
              // withinId as opposed to replaceId.
              var $caller = $(e.currentTarget);
              e.preventDefault();
              $self.trigger('setupClose.popup');
              $self.trigger('display.popup');
              $self.trigger('setupAjax.popup', [$caller]);
            });
          })

          .on('display.popup', function () {
            // Render the overlay
            if (opt.showOverlay == true) {
              $overlayDiv.appendTo(appendToElement);
            }

            $popupContentDiv.empty();
            $popupContentDiv.appendTo($popupDiv);
            $popupDiv.appendTo(appendToElement);
          })

          .on('setupAjax.popup', function (e, $caller) {
            var url = opt.url;
            if (url === undefined || url === null) {
              if ($caller.is('a')) {
                url = $caller.attr('href');
              }
            }

            $popupContentDiv.contentAjax({
              initialAjaxGetUrl: url,
              indicateAjaxInProgressFn: wng.animations.showInlineLoadingIndicator,
              indicateAjaxCompleteFn: wng.animations.removeInlineLoadingIndicator
            })
              .on('beforeReplaceContent.contentAjax', function(e, contentData) {
                // Close this popup if so flagged in the data.
                if (contentData.redirectUrl !== undefined || contentData.closePopup === true) {
                  $self.trigger('close.popup');
                }
                $popupDiv.removeClass('loading');
              })
              .on('afterReplaceContent.contentAjax', function() {
                // This popup may now be closed or its contents might have been replaced.
                // So reselect the popupContentDiv from the DOM.
                $popupContentDiv = $('#' + popupContentDivId);
              });
          })

          .on('setupClose.popup', function () {
            // Set up close button functionality
            $closeButton.appendTo($popupDiv);
            $closeButton.on('click', function (e) {
              e.preventDefault();
              $self.trigger('close.popup');
              return false;
            });
            if (opt.respondToEsc) {
              appendToElement.on('keyup', function (keyup) {
                if (keyup.which == 27) { // Escape key
                  $self.trigger('close.popup');
                }
              });
            }
          })

          .on('close.popup', function () {
            appendToElement.off('keyup');
            $popupDiv.remove();
            $overlayDiv.remove();
          });


        // On plugin load, fire off init

        $self.trigger('init.popup');
      });
    }
  });
})(jQuery);
