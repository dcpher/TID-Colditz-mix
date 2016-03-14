/*globals wng:false, wng:false, $:false, document:false */

// centralised definition of tracking events for all pages / partials

wng.googleAnalytics.tracking = (function (undefined) {
  var widgetTracking = {};

  widgetTracking.quote = function (options) {
    var opt = $.extend({
    }, options);

    // General quote page tracking

    // Clicked Choose Options button (mousedown to be sure to get in before submit or validation)
    // Use delegation from container selector since some widgets get replaced by ajax
    $(document).on('mousedown', '[data-analytics-id="quote-continue-to-options"]', function () {
      var
        $footerSummary = $(this).closest('[data-analytics-id="quote-footer-summary"]'),
        analyticsLabel = ($footerSummary.length > 0) ? 'Bottom Summary' : 'Top Summary';

      wng.googleAnalytics.trackEvent('Quote Page', 'Clicked Choose Options', {
        'label': analyticsLabel
      });
    });

    // Clicked edit trip button
    $('[data-analytics-id="open-edit-trip"]').on('click.quote', function () {
      wng.googleAnalytics.trackEvent('Quote Page', 'Clicked Edit Your Trip');
    });

    // Clicked email your quote submit (mousedown to be sure to get in before submit)
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="quote-trip-summary-section"]').on('mousedown', '[data-analytics-id="email-quote"]', function () {
      wng.googleAnalytics.trackEvent('Quote Page', 'Emailed Quote', {
        'label': 'Top Email Quote Widget'
      });
    });

    // Expanded all policy benefits
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="quote-main-section"]').on('click', '[data-analytics-id="expand-all-benefits"]', function () {
      wng.googleAnalytics.trackEvent('Quote Page', 'Expanded All Benefits');
    });

    // View the PDS above benefits
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="quote-main-section"]').on('click', '[data-analytics-id="view-pds-top"]', function () {
      wng.googleAnalytics.trackEvent('Quote Page', 'Viewed PDS', {
        'label': 'Above Benefits'
      });
    });

    // View the PDS below benefits
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="quote-main-section"]').on('click', '[data-analytics-id="view-pds-bottom"]', function () {
      wng.googleAnalytics.trackEvent('Quote Page', 'Viewed PDS', {
        'label': 'Below Benefits'
      });
    });

    // Expanded or collapsd a benefit
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="quote-main-section"]').on('click', '[data-analytics-id="benefits-list"] dt', function () {
      var $benefitName = $(this).find('[data-analytics-id="benefit-title"]');

      wng.googleAnalytics.trackEvent('Quote Page', 'Expanded or Collapsed a Benefit', {
        'label': ($benefitName.length > 0) ? $benefitName.text() : ''
      });
    });

    // Email quote (footer)
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="quote-main-section"]').on('mousedown', '[data-analytics-id="email-quote"]', function () {
      wng.googleAnalytics.trackEvent('Quote Page', 'Emailed Quote', {
        'label': 'Bottom Email Quote Widget'
      });
    });

    // Scroll tracking
    $('[data-analytics-id="quote-footer-summary"]').scrollTracking(function () {
      wng.googleAnalytics.trackEvent('Quote Page', 'Saw Bottom Quote Summary');
    });
  };

  widgetTracking.quoteOptions = function (options) {
    var opt = $.extend({
      selectorForContentAjax: '#content',
      promotionCodeContainerId: 'promotion-discount',
      termsAndConditionsClass: 'terms-and-conditions'
    }, options);

    var $recentAjaxCaller = null;

    // 
    // AJAX tracking
    //    

    $(document).on('doAjaxGet.contentAjax doAjaxPost.contentAjax', function (e, $caller) {
      $recentAjaxCaller = $caller;
    });

    $(opt.selectorForContentAjax).on('afterReplaceContent.contentAjax', function (e, data) {
      var
        code,
        i,
        $termsAndConditionsDiv,
        $termsAndConditionsSnowOptErrors,
        $termsAndConditionsOtherErrors,
        $promoCodeDiv,
        $promoCodeErrors,
        $lastTr,
        itemName,
        itemValue;

      for (i = 0; i < data.parts.length; i++) {

        // Track terms and conditions modal
        if (data.parts[i].replaceClass !== undefined &&
            data.parts[i].replaceClass === opt.termsAndConditionsClass) {
          $termsAndConditionsDiv = $('[data-analytics-id="terms-and-conditions"]');
          $termsAndConditionsSnowOptErrors =
            $('[data-analytics-id="terms-and-conditions-snow-check"] .input-validation-errors');
          $termsAndConditionsOtherErrors =
            $('[data-analytics-id="terms-and-conditions-other-check"] .input-validation-errors');

          if ($termsAndConditionsDiv.length > 0 && $termsAndConditionsSnowOptErrors.length > 0) {
            wng.googleAnalytics.trackEvent('Terms and Conditions', 'Failed to check declaration',
              {
                'label': 'No one is doing snow sports'
              }
            );
          }

          if ($termsAndConditionsDiv.length > 0 && $termsAndConditionsOtherErrors.length > 0) {
            wng.googleAnalytics.trackEvent('Terms and Conditions', 'Failed to check declaration',
              {
                'label': 'Standard declarations'
              }
            );
          }

          // Track the modal being shown initially by checking for its content
          // and for zero errors
          if ($termsAndConditionsDiv.length > 0 &&
              $termsAndConditionsDiv.find('.input-validation-errors').length === 0) {
            wng.googleAnalytics.trackVirtualPage('/virtual/purchase_path/terms_and_conditions');
          }
        }

        // Error adding specified item
        if (data.parts[i].replaceId !== undefined &&
            data.parts[i].replaceId == 'specItems') {
          if ($('#specItems .input-validation-errors').length > 0) {
            $lastTr = $('#specItems [data-analytics-id="specified-item-row"]').last();
            itemName = $lastTr.find('[data-analytics-id="item-name"] input').val() || "[No Entry Provided]";
            itemValue = $lastTr.find('[data-analytics-id="item-value"] input').val() || "[No Entry Provided]";
            wng.googleAnalytics.trackEvent('Options Page', 'Failed to Add or Update Specified Item',
              {
                'label': itemName + ' - $' + itemValue
              }
            );
          }
        }

        // Add specified item - when an item is successfully added
        if (data.parts[i].replaceId !== undefined &&
            data.parts[i].replaceId == 'specItems') {
          if ($('#specItems .input-validation-errors').length === 0 &&
              // check that the terms and conditions modal is not showing because
              // the ajax may include a refresh of specified items when in fact the 
              // terms and conditions modal is being shown as the primary action
              $('[data-analytics-id="terms-and-conditions-other-check"]').length === 0) {
            $lastTr = $('#specItems [data-analytics-id="specified-item-row"]').last();
            itemName = $lastTr.find('[data-analytics-id="item-name"] input').val();
            itemValue = $lastTr.find('[data-analytics-id="item-value"] input').val();
            // Check that this is not a new empty row
            if (itemName && itemValue) {
              wng.googleAnalytics.trackEvent('Options Page', 'Added or Updated Specified Item',
                {
                  'label': itemName + ' - $' + itemValue
                }
              );
            }
          }
        }

        if (data.parts[i].replaceId !== undefined &&
            data.parts[i].replaceId === opt.promotionCodeContainerId) {
          $promoCodeDiv = $('[data-analytics-id="promo-code"]');
          $promoCodeErrors = $promoCodeDiv.find('.input-validation-errors');

          // Promo code failed - Fire when a promo code is attempted but fails
          if ($promoCodeDiv.length > 0 && $promoCodeErrors.length > 0 &&
              $recentAjaxCaller.data('analyticsId') === 'update-promo-code') {
            code = $('[data-analytics-id="promo-code-value"]').val() || '';
            wng.googleAnalytics.trackEvent('Options Page', 'Failed on a Promo Code', {
              'label': code.toUpperCase()
            });
          }

          // Promo code success - Fire when a promo code is accepted
          if ($promoCodeDiv.length > 0 && $promoCodeErrors.length === 0 &&
              $recentAjaxCaller.data('analyticsId') === 'update-promo-code') {
            code = $('[data-analytics-id="promo-code-value"]').text() || '';
            wng.googleAnalytics.trackEvent('Options Page', 'Used a Promo Code', {
              'label': code.toUpperCase()
            });
          }

        }

      }
    });

    // 
    // Options tracking
    //

    // Use delegation from container selector since breadcrumb widget gets replaced by ajax
    $('[data-analytics-id="layout-content-container"]').on('mousedown', '[data-analytics-id="breadcrumb-goto-quote"]', function () {
      wng.googleAnalytics.trackEvent('Options Page', 'Clicked Breadcrumb', {
        'label': 'Go back to Quote Page'
      });
    });

    // Clicked Continue button - top (mousedown to be sure to get in before submit or validation)
    $('[data-analytics-id="option-continue-top"]').on('mousedown', function () {
      wng.googleAnalytics.trackEvent('Options Page', 'Clicked Buy Now', {
        'label': 'Top Button'
      });
    });

    // Clicked Continue button - bottom (mousedown to be sure to get in before submit or validation)
    $('[data-analytics-id="option-continue-bottom"]').on('mousedown', function () {
      wng.googleAnalytics.trackEvent('Options Page', 'Clicked Buy Now', {
        'label': 'Bottom Button'
      });
    });

    // Chose to reduce policy excess
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-table"]').on('change', '[data-analytics-id="option-reduce-policy-excess"]', function () {
      if ($(this).prop('checked')) {
        wng.googleAnalytics.trackEvent('Options Page', 'Reduced Policy Excess');
      }
    });

    // Chose to add snow sports cover
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-table"]').on('change', '[data-analytics-id="option-add-snow-sports"]', function () {
      if ($(this).prop('checked')) {
        wng.googleAnalytics.trackEvent('Options Page', 'Added Snow Sports Cover');
      }
    });

    // Remove specified item - fire when removing an item is attempted 
    $('[data-analytics-id="options-table"]').on("mousedown", '[data-analytics-id="option-remove-spec-item"]', function () {
      var $tr = $(this).closest('[data-analytics-id="specified-item-row"]');
      var itemName = $tr.find('[data-analytics-id="item-name"] input').val();
      var itemValue = $tr.find('[data-analytics-id="item-value"] input').val();
      // Check that this is not a row with an empty name/value (due to validation error)
      if (itemName && itemValue) {
        wng.googleAnalytics.trackEvent('Options Page', 'Remove Specified Item',
          {
            'label': itemName + ' - $' + itemValue
          }
        );
      }
    });

    // Changed car excess cover value
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-table"]').on('change', '[data-analytics-id="option-rental-excess"] select', function () {
      var newValue = $(this).find(':selected').text();
      wng.googleAnalytics.trackEvent('Options Page', 'Modified Car Rental Excess', {
        'label': newValue
      });
    });

    // Promo code removed - Fire when the remove promo code button is clicked
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-table"]').on("mousedown", '[data-analytics-id="promo-code-remove"]', function () {
      var code = $('[data-analytics-id="promo-code-value"]').text().toUpperCase();
      wng.googleAnalytics.trackEvent('Options Page', 'Removed Promo Code', {
        'label': code
      });
    });

    // Footprints tracking

    // Clicked 'View Project' on Footprints on options page
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-table"]').on('click', '[data-analytics-id="option-donation-project-view"]', function () {
      wng.googleAnalytics.trackEvent('Footprints', 'Clicked View Project', {
        'label': 'Footprints - Options Page'
      });
    });

    // Clicked to select another Footprints project
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-table"]').on('mousedown', '[data-analytics-id="option-donation-project-change"]', function () {
      wng.googleAnalytics.trackEvent('Footprints', 'Clicked Select Another Project', {
        'label': 'Footprints - Options Page'
      });
    });

    // Chose to donate to footprints
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-table"]').on('change', '[data-analytics-id="option-donation"] select', function () {
      var newValue = $(this).find(':selected').text();
      if (newValue != "0.00") {
        wng.googleAnalytics.trackEvent('Footprints', 'Chose To Donate', {
          'label': 'Footprints - Options Page - Donating $' + newValue
        });
      }
    });

    // Clicked email your quote submit (mousedown to be sure to get in before submit)
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="options-side-bar-content"]').on('mousedown', '[data-analytics-id="email-quote"]', function () {
      wng.googleAnalytics.trackEvent('Options Page', 'Emailed Quote');
    });

    // Scroll tracking

    $('[data-analytics-id="option-rental-excess"]').scrollTracking(function () {
      wng.googleAnalytics.trackEvent('Options Page', 'Saw Rental Excess Option');
    });

    $('[data-analytics-id="option-donation"]').scrollTracking(function () {
      wng.googleAnalytics.trackEvent('Options Page', 'Saw Footprints');
    });

    $('[data-analytics-id="option-total-bottom"]').scrollTracking(function () {
      wng.googleAnalytics.trackEvent('Options Page', 'Saw Bottom Quote Summary');
    });
  };

  widgetTracking.policyDetails = function (options) {
    var
      opt = $.extend({
        selectorForContentAjax: '#detailsForm',
        signInOrForgotPasswordContainerClass: 'sign-in-or-forgot-password',
        verifyExistingMemberContainerClass: 'join-or-sign-in-or-guest'
      }, options);

    $(opt.selectorForContentAjax).on('afterReplaceContent.contentAjax', function (e, data) {
      var
        i,
        $inlineLoginDiv,
        $inlineLoginGlobalErrors,
        $inlineLoginLocalErrors,
        $weThinkYouMightBeAMemberDiv,
        $weThinkYouMightBeAMemberGlobalErrors;

      for (i = 0; i < data.parts.length; i++) {

        // Track inline login failure
        if (data.parts[i].withinClass !== undefined &&
            data.parts[i].withinClass === opt.signInOrForgotPasswordContainerClass) {

          $inlineLoginDiv = $('[data-analytics-id="details-inline-signin"]');
          $inlineLoginGlobalErrors = $('#global-messages');
          $inlineLoginLocalErrors = $inlineLoginDiv.find('.input-validation-errors');
          
          if ($inlineLoginDiv.length > 0 && 
               ($inlineLoginGlobalErrors.length > 0) || ($inlineLoginLocalErrors.length > 0)) {
            wng.googleAnalytics.trackEvent('Your Details Page', 'Failed on Log In', {
              'label': 'From top login panel'
            });
          }
        }

        // Track 'We think you might already be a member
        if (data.parts[i].withinClass !== undefined &&
            data.parts[i].withinClass === opt.verifyExistingMemberContainerClass) {

          $weThinkYouMightBeAMemberDiv = $('[data-analytics-id="details-verify-existing-member"]');
          $weThinkYouMightBeAMemberGlobalErrors = $('#global-messages');

          if ($weThinkYouMightBeAMemberDiv.length > 0 && $weThinkYouMightBeAMemberGlobalErrors.length === 0) {
            wng.googleAnalytics.trackEvent('Your Details Page', 'Prompted to Sign In with corrected password (We think you might be a member panel)');
          }

          if ($weThinkYouMightBeAMemberDiv.length > 0 && $weThinkYouMightBeAMemberGlobalErrors.length > 0) {
            wng.googleAnalytics.trackEvent('Your Details Page', 'Failed on Log In', {
              'label': 'We think you might be a member panel'
            });
          }
        }
      }
    });

    // Use delegation from container selector since breadcrumb widget gets replaced by ajax
    $('[data-analytics-id="layout-content-container"]').on('mousedown', '[data-analytics-id="breadcrumb-goto-quote"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked Breadcrumb', {
        'label': 'Go back to Quote Page'
      });
    });

    // Use delegation from container selector since breadcrumb widget gets replaced by ajax
    $('[data-analytics-id="layout-content-container"]').on('mousedown', '[data-analytics-id="breadcrumb-goto-options"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked Breadcrumb', {
        'label': 'Go back to Options Page'
      });
    });

    // Log in link (bottom panel) is clicked
    $('[data-analytics-id="details-signin-bottom-section"]').on('mousedown', '[data-analytics-id="details-login-link"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked "Bought with us before? Log In" link', {
        label: "bottom"
      });
    });

    // Forgot password top button is clicked
    $('[data-analytics-id="details-signin-top-section"]').on('mousedown', '[data-analytics-id="details-forgot-password"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked Forgot Password', { label: "top" });
    });

    // Forgot password bottom button is clicked
    $('[data-analytics-id="details-signin-bottom-section"]').on('mousedown', '[data-analytics-id="details-forgot-password"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked Forgot Password', { label: "bottom" });
    });

    // Forgot password global pop-up button is clicked
    $('body').on('mousedown', '[data-analytics-id="popup-forgot-password"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked Forgot Password', { label: "global pop-up" });
    });

    // Reset password top button is clicked
    $('[data-analytics-id="details-signin-top-section"]').on('mousedown', '[data-analytics-id="details-reset-password"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked Reset Password', { label: "top" });
    });

    // Reset password global pop-up button is clicked
    $('body').on('mousedown', '[data-analytics-id="popup-reset-password"]', function () {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Clicked Reset Password', { label: "global pop-up" });
    });
  };

  widgetTracking.reviewAndPay = function (options) {
    var
      opt = $.extend({
      }, options);
    
    // Use delegation from container selector since breadcrumb widget gets replaced by ajax
    $('[data-analytics-id="layout-content-container"]').on('mousedown', '[data-analytics-id="breadcrumb-goto-quote"]', function () {
      wng.googleAnalytics.trackEvent('Payment Page', 'Clicked Breadcrumb', {
        'label': 'Go back to Quote Page'
      });
    });

    // Use delegation from container selector since breadcrumb widget gets replaced by ajax
    $('[data-analytics-id="layout-content-container"]').on('mousedown', '[data-analytics-id="breadcrumb-goto-options"]', function () {
      wng.googleAnalytics.trackEvent('Payment Page', 'Clicked Breadcrumb', {
        'label': 'Go back to Options Page'
      });
    });

    // Use delegation from container selector since breadcrumb widget gets replaced by ajax
    $('[data-analytics-id="layout-content-container"]').on('mousedown', '[data-analytics-id="breadcrumb-goto-details"]', function () {
      wng.googleAnalytics.trackEvent('Payment Page', 'Clicked Breadcrumb', {
        'label': 'Go back to Your Details Page'
      });
    });

    if (opt.shouldEmitTrackEventsForSaveAndContinueOptionsOnDetailsPage) {
      wng.googleAnalytics.trackEvent('Your Details Page', 'Purchase type selected (guest/new-member/existing-member)', {
        'label': opt.signedInStateLabel
      });
    }

    // Clicked edit trip button
    $('[data-analytics-id="open-edit-trip"]').on('click.quote', function () {
      wng.googleAnalytics.trackEvent('Payment Page', 'Clicked Edit Your Trip');
    });

    // Clicked edit details (mousedown to be sure to get in before submit)
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="payment-main-section"]').on('mousedown', '[data-analytics-id="edit-details"]', function () {
      wng.googleAnalytics.trackEvent('Payment Page', 'Clicked Edit Your Details');
    });

    // Clicked edit options (mousedown to be sure to get in before submit)
    // Use delegation from container selector since some widgets get replaced by ajax
    $('[data-analytics-id="payment-main-section"]').on('mousedown', '[data-analytics-id="edit-options"]', function () {
      wng.googleAnalytics.trackEvent('Payment Page', 'Clicked Edit Your Options');
    });

  };

  var setup = function (widgetId, options) {
    if (widgetTracking[widgetId]) {
      widgetTracking[widgetId](options);
    } else {
      throw new Error("Tracking is not defined for the identifier " + widgetId);
    }
  };

  return {
    setup: setup
  };
}());
