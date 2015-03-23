/*globals $:false, document:false, wng:true */

wng.animations = (function (undefined) {
  var
    completeInlineLoadingTimeoutHandle,
    $recentlyHiddenButtonArrow,
    completeWhitewashLoadingTimeoutHandle,
    defaultWhitewashLoadingMessage = 'Please wait',
    whitewashCssClass = 'loading-overlay',
    whitewashSpinnerCssClass = 'loading-spinner',
    inlineSpinnerCssClass = 'spinner',
    loadingIndicatorMaxDurationInSeconds = 30,
    htmlSelectorHookForAppendingWhitewashLoadingDivs = '#footer',

  showInlineLoadingIndicator = function ($caller, displayWithinButton) {
    var
      inlineSpinnerHtml = "<span class='" + inlineSpinnerCssClass + "'></span>";

    if ($("." + inlineSpinnerCssClass).length < 1) {
      $caller.after(inlineSpinnerHtml);

      if (displayWithinButton) {
        $recentlyHiddenButtonArrow = $caller.closest('div').find('.icon-tid-button-arrow');
        if ($recentlyHiddenButtonArrow.length > 0) {
          $recentlyHiddenButtonArrow.css('visibility', 'hidden');
        }
      }
    }

    completeInlineLoadingTimeoutHandle = setTimeout(removeInlineLoadingIndicator,
      loadingIndicatorMaxDurationInSeconds * 1000);
  },

  removeInlineLoadingIndicator = function () {
    $("." + inlineSpinnerCssClass).fadeOut();

    if ($recentlyHiddenButtonArrow && $recentlyHiddenButtonArrow.length > 0) {
      $recentlyHiddenButtonArrow.css('visibility', 'visible');
      $recentlyHiddenButtonArrow = null;
    }

    clearTimeout(completeInlineLoadingTimeoutHandle);
  },

  showWhitewashLoadingIndicator = function ($caller, message) {
    var
      loadingMessage,
      $loadingSpinner,
      $loadingWhiteWash,
      $htmlHook;

    loadingMessage = message || defaultWhitewashLoadingMessage;

    $loadingSpinner = $("<div />")
      .addClass(whitewashSpinnerCssClass)
      .html(loadingMessage);

    $loadingWhiteWash = $("<div />")
      .addClass(whitewashCssClass)
      .append($loadingSpinner);

    $htmlHook = $(htmlSelectorHookForAppendingWhitewashLoadingDivs);
    $htmlHook.append($loadingWhiteWash);

    completeWhitewashLoadingTimeoutHandle = setTimeout(removeWhitewashLoadingIndicator,
      loadingIndicatorMaxDurationInSeconds * 1000);
  },

  removeWhitewashLoadingIndicator = function () {
    var
      $content = $(htmlSelectorHookForAppendingWhitewashLoadingDivs);

    $("." + whitewashSpinnerCssClass, $content).remove();
    $("." + whitewashCssClass, $content).remove();

    clearTimeout(completeWhitewashLoadingTimeoutHandle);
  },

  // Move focus to a given form field, and add a css class to use for any css
  // animation/transition
  moveFocus = function (fieldToFocusSelector, focusClass) {
    if ($('.input-validation-errors label, .input-validation-error').length > 0) {
      // don't move focus if there are validation errors
      return;
    }

    $(fieldToFocusSelector)
      .focus()
      .addClass(focusClass);

    setTimeout(function () {
      $(fieldToFocusSelector)
        .removeClass(focusClass);
    }, 2500);
  },

  // Bind the moveFocus function to the click event on a given input/button
  bindMoveFocusOnClick = function (subjectFieldSelector, fieldToFocusSelector, focusClass) {
    $(document).on('click', subjectFieldSelector, function (e) {
      e.preventDefault();
      moveFocus(fieldToFocusSelector, focusClass);
    });
  },

  fadeOut = function ($element, delayMilliseconds) {
    setTimeout(
      function () {
        $element.fadeOut(
          function () {
            $(this).remove();
          });
      },
      delayMilliseconds
    );
  };

  return {
    showInlineLoadingIndicator: showInlineLoadingIndicator,
    removeInlineLoadingIndicator: removeInlineLoadingIndicator,
    showWhitewashLoadingIndicator: showWhitewashLoadingIndicator,
    removeWhitewashLoadingIndicator: removeWhitewashLoadingIndicator,
    moveFocus: moveFocus,
    bindMoveFocusOnClick: bindMoveFocusOnClick,
    fadeOut: fadeOut
  };
}());
