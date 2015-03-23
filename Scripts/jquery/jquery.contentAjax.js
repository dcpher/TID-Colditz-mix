/*globals window:false, jQuery:false */

(function ($) {

  $.fn.extend({
    contentAjax: function (options) {
      var
        opt = $.extend({
          bindSubmits: true,                                                    // Whether to hook into submits matching the selector and POST using AJAX
          bindLinks: true,                                                      // Whether to hook into anchors matching the selector and GET using AJAX
          bindManualUpdates: true,                                              // Whether to hook up other types of elements to auto-POST using AJAX upon change
          initialAjaxGetUrl: null,                                              // The URL for an AJAX GET to be done upon init. If null, no intial AJAX GET happens.
          submitSelector: 'input[type=submit], button[type!=button]',           // The selector for submits that need to POST using AJAX
          linkSelector: 'a.load-by-ajax',                                       // The selector for links that need to GET using AJAX
          manualUpdateSelector: '.manual-update-trigger',                       // The selector for other types of elements that need to auto-POST using AJAX
          indicateAjaxInProgressFn: wng.animations.showWhitewashLoadingIndicator, // Function for indicating that AJAX operation is starting, default adds whitewash and spinner.
          indicateAjaxCompleteFn: wng.animations.removeWhitewashLoadingIndicator, // Function for indicating that AJAX operation has completed, default hides spinner.
          modifyUrl: function(url) { return url; },                             // Function to modify (e.g. add params) to the AJAX GET/POST URL.
          showAjaxError: function(errorMessageHtml) { // Function to show failure error message. Default appends to global messages.
            var $messagesPanel = $('#global-messages');

            if ($messagesPanel.length > 0) {
              $messagesPanel.replaceWith(errorMessageHtml);
            } else {
              $('.global-messages-container').html(errorMessageHtml);
            }
          }
        }, options),
        
        indicateAjaxInProgress = function($caller, contentData) {
          opt.indicateAjaxInProgressFn($caller);
          return $caller;
        },
        
        indicateAjaxComplete = function(contentData) {
          if (contentData.redirectUrl === undefined) {
            // We only want to indicate completion of AJAX if not redirecting anywhere.
            // Otherwise, the indicator disappears while the redirectUrl loads. Looks odd.
            opt.indicateAjaxCompleteFn();
          }
        };

      // Utility functions

      var utils = {
        replaceContent: function (contentPart) {
          var $matched;
          if (contentPart.hideId !== undefined) {
            $matched = $('#' + contentPart.hideId);
            if ($matched.length > 0) {
              $matched.css("display", "none");
              return;
            }
          }

          if (contentPart.hideClass !== undefined) {
            $matched = $('.' + contentPart.hideClass);
            if ($matched.length > 0) {
              $matched.css("display", "none");
              return;
            }
          }

          if (contentPart.showId !== undefined) {
            $matched = $('#' + contentPart.showId);
            if ($matched.length > 0) {
              $matched.css("display", "block");
              return;
            }
          }

          if (contentPart.showClass !== undefined) {
            $matched = $('.' + contentPart.showClass);
            if ($matched.length > 0) {
              $matched.css("display", "block");
              return;
            }
          }

          var newContent = $.trim(contentPart.content.html);

          if (contentPart.withinId !== undefined) {
            $matched = $('#' + contentPart.withinId);
            if ($matched.length > 0) {
              $matched.html(newContent);
              return;
            }
          }

          if (contentPart.replaceId !== undefined) {
            $matched = $('#' + contentPart.replaceId);
            if ($matched.length > 0) {
              $matched.replaceWith(newContent);
              return;
            }
          }

          if (contentPart.afterId !== undefined) {
            $matched = $('#' + contentPart.afterId);
            if ($matched.length > 0) {
              $matched.after(newContent);
              return;
            }
          }

          if (contentPart.beforeId !== undefined) {
            $matched = $('#' + contentPart.beforeId);
            if ($matched.length > 0) {
              $matched.before(newContent);
              return;
            }
          }

          if (contentPart.withinClass !== undefined) {
            $matched = $('.' + contentPart.withinClass);
            if ($matched.length > 0) {
              $matched.html(newContent);
              return;
            }
          }

          if (contentPart.replaceClass !== undefined) {
            $matched = $('.' + contentPart.replaceClass);
            if ($matched.length > 0) {
              $matched.replaceWith(newContent);
              return;
            }
          }

          if (contentPart.afterClass !== undefined) {
            $matched = $('.' + contentPart.afterClass);
            if ($matched.length > 0) {
              $matched.after(newContent);
              return;
            }
          }

          if (contentPart.beforeClass !== undefined) {
            $matched = $('.' + contentPart.beforeClass);
            if ($matched.length > 0) {
              $matched.before(newContent);
              return;
            }
          }
        }
      };

      // Set up handlers for each item JQuery object in the set.

      return this.each(function () {

        var $self = $(this)

          // Event Handlers

          .on('init.contentAjax', function () {
            if (opt.initialAjaxGetUrl) {
              $self.trigger('doAjaxGet.contentAjax', [null, opt.initialAjaxGetUrl]);
            } else {
              if (opt.bindSubmits) {
                $self.trigger('bindSubmits.contentAjax');
              }
              if (opt.bindLinks) {
                $self.trigger('bindLinks.contentAjax');
              }
              if (opt.bindManualUpdates) {
                $self.trigger('bindManualUpdates.contentAjax');
              }
            }
          })

          .on('bindSubmits.contentAjax', function () {
            var $clickableElements = $(opt.submitSelector, $self);
            $clickableElements.off('click.contentAjax');
            $clickableElements.on('click.contentAjax', function (ev) {
              ev.preventDefault();
              $self.trigger('doAjaxPost.contentAjax', [$(this)]);
              return false;
            });
          })

          .on('bindLinks.contentAjax', function () {
            var $clickableElements = $(opt.linkSelector, $self);
            $clickableElements.off('click.contentAjax');
            $clickableElements.on('click.contentAjax', function (ev) {
              ev.preventDefault();
              $self.trigger('doAjaxGet.contentAjax', [$(this)]);
              return false;
            });
          })

          .on('bindManualUpdates.contentAjax', function () {
            var $manualUpdateTriggers = $(opt.manualUpdateSelector, $self);
            $manualUpdateTriggers.each(function () {
              var $manualUpdateTrigger, $manualUpdateContainer;
              $manualUpdateTrigger = $(this);
              $manualUpdateContainer =
                $manualUpdateTrigger.closest('.manual-update-container');

              $manualUpdateContainer.find('.manual-update').hide();

              if ($manualUpdateTrigger.attr("type") == 'text') {
                $manualUpdateTrigger.off('blur.contentAjax');
                $manualUpdateTrigger.on('blur.contentAjax', function () {
                  $manualUpdateContainer.find('input[type="submit"]').eq(0).click();
                });
              } else {
                $manualUpdateTrigger.off('change.contentAjax');
                $manualUpdateTrigger.on('change.contentAjax', function () {
                  $manualUpdateContainer.find('input[type="submit"]').eq(0).click();
                });
              }
            });
          })

          .on('doAjaxPost.contentAjax', function (e, $caller) {
            var $form, url, formData;
            $self.trigger('beforeGetFormData.contentAjax', [$caller]);
            $form = $caller.parents('form');
            url = opt.modifyUrl($form.attr('action'));
            $form.find("input[placeholder]").trigger('submitCheck.placeholder');
            formData = $form.serialize();
            // JQuery does not include the submit button in the serialized form, but we need it.
            formData += '&' + $caller.attr('name') + '=' + $caller.attr('value');
            $self.trigger('afterGetFormData.contentAjax', [$caller]);
            indicateAjaxInProgress($caller);
            $.ajax({
              type: 'POST',
              url: url,
              cache: false,
              data: formData,
              dataType: 'json',
              success: function (contentData) {
                $self.trigger('ajaxSuccessful.contentAjax', [contentData]);
              },
              error: function (contentData) {
                $self.trigger('ajaxFailed.contentAjax', [contentData]);
              }
            });
          })

          .on('doAjaxGet.contentAjax', function (e, $caller, url) {
            if (url === undefined || url === null) {
              url = $caller.attr('href');
            }
            url = opt.modifyUrl(url);
            if ($caller !== undefined && $caller !== null) {
              indicateAjaxInProgress($caller);
            }
            $.ajax({
              type: 'GET',
              url: url,
              cache: false,
              data: null,
              dataType: 'json',
              success: function (contentData) {
                $self.trigger('ajaxSuccessful.contentAjax', [contentData]);
              },
              error: function (contentData) {
                $self.trigger('ajaxFailed.contentAjax', [contentData]);
              }
            });
          })

          .on('ajaxSuccessful.contentAjax', function (e, contentData) {
            $self.trigger('beforeReplaceContent.contentAjax', [contentData]);

            // Redirect URL trumps everything, so check that first.
            if (contentData.redirectUrl !== undefined) {
              window.location.href = contentData.redirectUrl;
              return;
            }

            // Not navigating. Page content will now be modified. 

            // Start by removing spinners and any ajax operation indicators
            indicateAjaxComplete(contentData);

            // Iterate over each content block and perform replacement.
            try {
              $.each(contentData.parts, function (i, contentPart) {
                utils.replaceContent(contentPart);
              });
              if (opt.bindSubmits) {
                $self.trigger('bindSubmits.contentAjax');
              }
              if (opt.bindLinks) {
                $self.trigger('bindLinks.contentAjax');
              }
              if (opt.bindManualUpdates) {
                $self.trigger('bindManualUpdates.contentAjax');
              }
            }
            catch (err) {
              $self.trigger('ajaxFailed.contentAjax', [contentData]);
            }

            $self.trigger('afterReplaceContent.contentAjax', [contentData]);
          })

          .on('ajaxFailed.contentAjax', function (e, contentData) {
            var errorMessageHtml =
              '<div id="global-messages">' +
              '<div class="messages error">' +
              '<h3>Oops!</h3>' +
              '<ul>' +
              '<li>' +
              'Something went wrong. Please try again.' +
              '</li>' +
              '</ul>' +
              '</div>' +
              '</div>';

            // Remove spinners and any ajax operation indicators
            indicateAjaxComplete(contentData);

            opt.showAjaxError(errorMessageHtml);
          });


        // On plugin load, fire off init

        $self.trigger('init.contentAjax');
      });
    }
  });
})(jQuery);
