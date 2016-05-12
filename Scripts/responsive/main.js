// To make images retina, add a class "2x" to the img element
// and add a <image-name>@2x.png image. Assumes jquery is loaded.
 
function isRetina() {
	var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
					  (min--moz-device-pixel-ratio: 1.5),\
					  (-o-min-device-pixel-ratio: 3/2),\
					  (min-resolution: 1.5dppx)";
 
	if (window.devicePixelRatio > 1)
		return true;
 
	if (window.matchMedia && window.matchMedia(mediaQuery).matches)
		return true;
 
	return false;
};
 
 
function retina() {
	
	if (!isRetina())
		return;
	
	$("img.x2").map(function(i, image) {
		
		var path = $(image).attr("src");
		
		path = path.replace(".png", "@x2.png");
		path = path.replace(".jpg", "@x2.jpg");
		
		$(image).attr("src", path);
	});
};
 
$(document).ready(retina);



// Mobile toggle for responsive website
$(function() {
  var $mobileToggle = $('.mobile-toggle');
  var $toggleElements = $('.mobile-toggle-target');

  var toggleElements = function() {
    var $mobileToggle = $('.mobile-toggle');
    if ($mobileToggle.hasClass('open')) {
      $toggleElements.show();
    } else {
      $toggleElements.hide();
    }
  };

  $mobileToggle.on('click', function() {
    $(this).toggleClass('open');
    toggleElements();
  });

  $(window).on('load resize', function() {
    if ($mobileToggle.is(':visible')) {
      if ($mobileToggle.hasClass('open')) {
        $toggleElements.show();
      } else {
        $toggleElements.hide();
      }
    } else {
      $toggleElements.show();
    }
  });
});