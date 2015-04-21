$(document).ready(function(){
	$("img.in").hover(
	function() {
	$(this).stop().animate({"opacity": "0"}, "slow");
	},
	function() {
	$(this).stop().animate({"opacity": "1"}, "slow");
	});
});

month= --month;
dateFuture = new Date(year,month,day,hour,min,sec);

function GetCount(){

        var localDateOffset = new Date().getTimezoneOffset(); 
        var targetOffset = -660 - localDateOffset;
        var targetOffsetInMs = targetOffset * 60000;

        amount = dateFuture.getTime() - new Date().getTime() + targetOffsetInMs;
        delete dateNow;

        /* time is already past */
        if(amount < 0){
                out=
				"<li id='days'>0<div id='days_text'>Days</div></li>" + 
				"<li id='hours'>0<div id='hours_text'>Hours</div></li>" + 
				"<li id='mins'>0<div id='mins_text'>Minutes</div></li>"; 
				//"<li id='secs'>0<div id='secs_text'>Seconds</div></li>" ;
                document.getElementById('countbox').innerHTML=out;       
        }
        /* date is still good */
        else{
                days=0;hours=0;mins=0;secs=0;out="";

                amount = Math.floor(amount/1000); /* kill the milliseconds */

                days=Math.floor(amount/86400); /* days */
                amount=amount%86400;

                hours=Math.floor(amount/3600); /* hours */
                amount=amount%3600;

                mins=Math.floor(amount/60); /* minutes */
                amount=amount%60;

                
                //secs=Math.floor(amount); /* seconds */


                out=
				"<li id='days'>" + days +"<div id='days_text'>Days</div></li>" + 
				"<li id='hours'>" + hours +"<div id='hours_text'>Hours</div></li>" + 
				"<li id='mins'>" + mins +"<div id='mins_text'>Minutes</div></li>";
				//"<li id='secs'>" + secs +"<div id='secs_text'>Seconds</div></li>" ;
                document.getElementById('countbox').innerHTML=out;
			

                setTimeout("GetCount()", 60 * 1000);
        }
}

window.onload=function(){GetCount();}


