// CAPITALIZE Input Fields based on class='capitalize'
$(document).on("focusout", ".capitalize", function () {
    if ($(this).val() != "") {
        $(this).removeClass('capitalize').unbind('focusout');
        var $text = $(this).val();
        var $capitalizeText = toTitleCase($text);
        $(this).val($capitalizeText);
    }
});

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}