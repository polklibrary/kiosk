jQuery.fn.scrollTo = function(elem, adjust) { 
    $(this).scrollTop($(this).scrollTop() - $(this).offset().top + $(elem).offset().top + adjust); 
    return this; 
};


// Currently viewed tab
var currentTab = "";

// true for feature mode, false for attract mode
var useFeature = true;

// Put feature mode images (for showcasing kiosk features) here.
// var featureData = {
		// "hours" : /* replace me -> */ "ads/downstairs.jpg",
		// "computers" : /* replace me -> */ "ads/downstairs.jpg",
		// "directions" : /* replace me -> */ "ads/downstairs.jpg",
		// "groups" : /* replace me -> */ "ads/downstairs.jpg",
		// "shuttle" : /* replace me -> */ "ads/shuttlesomething.jpg",
	// }

    
// Web service URLs
//var groupsUrl = "http://www.uwosh.edu/library/ws/getGroupFinderEvents?alt=jsonp&callback=?";
var hoursUrl = "http://www.uwosh.edu/library/hours_feed?fmt=jsonp&callback=?";
var computerUrl = "http://www.uwosh.edu/library/getComputerAvailabilityFrame?mode=kiosk";

// Reference for the group table 
var groupRoomIDs = {"Small Group Room" : "sgr", "Large Group Room" : "lgr", "3rd Floor North Group Room" : "3fngr", "3rd Floor South Group Room" : "3fsgr"};

//var attractTimeout = {};
// Seconds to wait before entering attract mode (since last interaction)
//var attractWait = 60; // 15min=900
// Seconds to wait before hiding attract mode to show the next tab
//var hideWait = 10; //10
// Seconds to show tab for before going back into attract mode
//var showWait = 10; //30

var blipTimeout = {};
var closeMapTimeout = {};
var close_map_inactivity = 60; // close map if left open after X seconds

// Initialize json data to empty objects
var groupsData = {};
var hoursData = {};
var hoursStatus = '';

// Error Handler
var computerFailure = null;

// ADA Finger Hide Time
ADA_SUPPRESS = 4000;

var tipData = {
		"hours" : "The hours listed show the current day and upcoming days the library is open.",
		"computers" : "The map displayed shows which computers are currently available or unavailable throughout the library. Tapping on a library wing will show more detailed maps of each area.",
		"directions" : "To get detailed directions to any of the locations displayed, simply touch the location.",
		"groups" : "<span id=\"donttap\">The schedule for the group rooms currently reserved for the day. To reserve a room, please visit the circulation desk.  To get directions to a room, try tapping a reservation.</span>",
		"shuttle" : "This is a map of the campus shuttle route."
	};

$(document).ready(function(){

    // ADA 
    ADA_Helper();

    // Load Computer Availability
    iframeLoad();

    // Process to always look for any data failures, and try immediately resolve them every 2 second
    setInterval(function(){
        checkDataForCorruptions();
    },5000);
    checkDataForCorruptions(); // init
    
    // Process to refresh data, true will force a update
    setInterval(function(){
        checkDataForCorruptions(true,true);
    },1200000);  // 20 minutes = 1200000

	// Reset attract timer on any click
	$("html").mousedown(function(){
        advertisements_pause();
    });
	// Detect clicks on iframe (don't think it actually works - might want to look at this if anything doesn't seem to work right)
	//bindEvent(document.getElementsByTagName("body")[0], "focusout", resetAttract);
	$(document).focusout(function(){
        advertisements_pause();
    });
    $('body').focusout(function(){
        advertisements_pause();
    });
	
	// Tab navigation
	$(".tab").mousedown(function(){
		var id = $(this).attr("id");
		select(id.substring(0,id.indexOf("-tab")));
	});
	
	//Directions table click handler
	$("#directions-table td").mousedown(function(){
        if ($(this).hasClass('no-action')) return; // ignore empty directions
		$("#map-box").show();
		$("#back-shadow, #back-touch").show();
		//table element's id determines the selector for the mapData object
		mapBlip($(this).attr("id").substring(0,$(this).attr("id").indexOf("-")));
	});
	
	
	//Hide directions on tap
	$("#map-box, #back-shadow, #back-touch, #map-location-box").mousedown(function(){
        clearTimeout(closeMapTimeout);
		closeMap();
	});
	
	//Hoo hoo hoo hee hee hee *slaps knee*
	$("#secret").mousedown(function(){
		$(this).hide();
	});
	
	//Show directions to the circulation desk when you click the label below study groups
	$("#groups-info").mousedown(function(){
		$("#circulation-box").trigger('mousedown');
	});
	
/*	$("#content-pane").click(function(e){
		if(e.pageX - $(this).position()["left"] > $(this).width() - 10 && e.pageY - $(this).position()["top"] > $(this).height() - 10 && currentTab == "groups"){
			
		}
	});*/
	
	//Show the hours tab when you tap on the hours in the header
	$("#header-hours").mousedown(function(){
		select("hours");
	});
    
    //Show refresh label
	$("#refresh").mousedown(function(){
		$(this).find('span').show();
	});
	
	// Show tab selected in hash or default to hours tab
	if(location.hash != ""){
		select(location.hash.substring(1));
	}else{
		select("hours");
	}
	
	// Start in attract/feature mode when page loaded
	// if(useFeature){
		// attractTimeout = setTimeout(featureMode, attractWait * 1000);
	// }else{
		// attractMode();
	// }
    
    advertisements(); // Start Ads
});

window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};




/*
    NEW AD MODE
*/
var advertisement_index = 0;
var advertisement_thread = null;
var advertisement_pause_thread = null;
function advertisements() {
    var timer = 0;
    advertisement_thread = setInterval(function(){
        if (timer == 5) {
            transition($('#advertisements').find('img').eq(advertisement_index), function(){
                flipDown();
            });
        }
        if (timer > 10) {
            transition($('#advertisements').find('img').eq(advertisement_index), function(){
                
            });
            next_advertisement();
            timer = 0;
        }
        timer++;
    }, 1000); 
}

function next_advertisement(){
    advertisement_index++;
    if (advertisement_index >= $('#advertisements').find('img').length)
        advertisement_index = 0;
}

function transition(element, callback) {
    var types = ['slide', 'puff', 'clip', 'bounce', 'swirl'];
    var i = Math.floor((Math.random() * types.length)); 
    console.log(types[i]);
    $(element).toggle(types[i], {duration : 1000, complete : function(){
        callback();
    }});
}
 
function advertisements_pause() {
    clearTimeout(advertisement_pause_thread); // Reset
    clearInterval(advertisement_thread); // Turn off
    $('#advertisements').find('img').eq(advertisement_index).hide();
    advertisement_pause_thread = setTimeout(function(){
        advertisements(); // Turn back on
    }, 60*1000);
}








// David:  Process to be run
function checkDataForCorruptions(force_hours, force_groups) {

    if (force_hours == null)
        force_hours == false;
    if (force_groups == null)
        force_groups == false;
        
    // Hours
    if ($.isEmptyObject(hoursData) || force_hours){
        $.getJSON(hoursUrl, function(data, status){
            if (status == "success") {
                console.log('SUCCESS: get json hours');
                hoursData = {};
                $.extend(true, hoursData, data);
                loadHours();
                loadHoursHeader();
            } else {
                console.log("FAILED: Hours Connection");
            }
        });
    }
    
    // Groups
    if ($.isEmptyObject(groupsData) || force_groups){
        
        var process = function(id){
            var start = new Date();
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
            
            var end = new Date();
            end.setHours(23);
            end.setMinutes(59);
            end.setSeconds(59);
            GCAL.APIKEY = 'AIzaSyCcsz_ZN1rNDYzF1ha84Fn_p8ZzgNEyXo4';
            GCAL.get_events(id, start, end, function(data){
                var contents = [];
                for (var i in data.result.items) {
                    var obj = data.result.items[i];
                    summary = obj.summary;
                    if (typeof summary === 'undefined')
                        summary = 'Private';
                    contents.push({
                        'start': new Date(obj.start.dateTime),
                        'end': new Date(obj.end.dateTime),
                        'summary': summary,
                    });
                }
                groupsData[data.result.summary] = contents;
            });
        }
        
        process('uwosh.edu_tkcbj196ms5d9jdnvnlrce2i90@group.calendar.google.com');
        process('uwosh.edu_h157e20v3tccouak2ougfncqa0@group.calendar.google.com');
        process('uwosh.edu_v2i8scsqfmn7hanabro28iurc4@group.calendar.google.com');
        process('uwosh.edu_43eh72k76gj9a6a79t3ss1vvn4@group.calendar.google.com');
        console.log('SUCCESS: processed groups');
    }
    
}


// ADA Help Finger
// The x,y check prevents bug in Chrome
function ADA_Helper() {
    var x=0;
    var y=0;
    var ada_thread = null;
    $(document).mousemove(function(e){
        if (pixel_travel(x,e.pageX,100) || pixel_travel(y,e.pageY,100)) {
            advertisements_pause(); // Clear any ads
            clearTimeout(ada_thread);
            $('body').removeClass('cursor-off');
            $('body').addClass('cursor-on');
            ada_thread = setTimeout(function(){
                $('body').removeClass('cursor-on');
                $('body').addClass('cursor-off');
            },ADA_SUPPRESS);
            x = e.pageX;
            y = e.pageY;
        }
    });
}

function pixel_travel(original, current ,distance) {
    if(current<original)
        return (current <= (original-distance));
    if(current>original)
        return (current >= (original+distance));
}


//Hide directions 
function closeMap() {
	$("#map-box, #back-shadow, #back-touch, #map-location-box").hide();
	clearTimeout(blipTimeout);
}

// Breaks attract mode and resets the interaction timer
// function resetAttract() {
	// // Hide the slideshow
	// $("#attract-container, #feature-container").hide();
	// // Reset the timer
	// if(attractTimeout != {}){
		// clearTimeout(attractTimeout);
	// }
	// // Refocus body (necessary for detecting iframe clicks) (don't think it actually works - might want to look at this if anything doesn't seem to work right)
	// document.getElementsByTagName("body")[0].focus();
	// // Restart the timer
	// attractTimeout = setTimeout((useFeature ? featureMode : attractMode), attractWait * 1000);
// }

// Enters attract mode
// function attractMode(){
	// // Show the slideshow
	// //$("#attract-container").fadeIn();
    // transition("#attract-container");
	
	// // Set timer to show next slide
	// attractTimeout = setTimeout(flipDown, hideWait * 1000);
// }


// Make random transition to prevent screen burn
// function transition(element, callback) {

    // var types = ['slide', 'puff', 'clip', 'bounce', 'swirl'];
    // var i = Math.floor((Math.random() * types.length)); 
    // console.log(types[i]);
    // $(element).toggle(types[i], {duration : 1000, complete : function(){
        // callback();
        // positionGroups();
    // }});

// }


// Highlight kiosk features
// function featureMode(){

	// // Close any map left open before next add
	// closeMap();

	// //Show the feature image (place image path in featureData)
	// $("#feature-container img").prop("src", featureData[currentTab]);

    // transition("#feature-container", function(){
		// //Flip down first, so the correct tab is under the feature image
		// flipDown();	
	// });

	
	// //After hideWait seconds, the feature image is hidden
	// attractTimeout = setTimeout(function(){
		// //$("#feature-container").fadeOut();
        // transition("#feature-container", function(){
            // attractTimeout = setTimeout(featureMode, showWait * 1000);
        // });
		// //After showWait seconds, the cycle repeats with the next tab
	// }, hideWait * 1000);
// }
/**
* Update the flipDown function if you add another tab (or re-add shuttle)
**/
// Cycles through the tabs (used during attract mode)
function flipDown(){
	// Hide the slideshow
	//$("#attract-container").fadeOut();
	
	// Flip down one tab
	if(currentTab == "hours"){
		select("computers");
	}else if(currentTab == "computers"){
		select("directions");
	}else if(currentTab == "directions"){
		select("groups");
	}else if(currentTab == "groups" || currentTab == ""){
		select("hours");
	}
	
	/*if(currentTab == "groups"){
		select("shuttle");
	}else if(currentTab == "shuttle" || currentTab == ""){
		select("hours");
	}*/
	
	// Reset the timer to show the slideshow
	//if(!useFeature)
	//	attractTimeout = setTimeout(attractMode, showWait * 1000);
}


function iframeUnload(){
    $('#computer-availability').attr('src','http://localhost/kiosk/white.html');
}

// Selects a tab
function select(t){
	
	if(t == "computers"){
        iframeLoad();
	}
    
	if(t == "directions"){
        iframeUnload();
	}
    
	// Creates the groups table
	if(t == "groups"){
		loadGroups();
	}
	// Creates the hours page
	if(t == "hours"){
		loadHours();
	}
	// Hide the tab that was
	if(currentTab != ""){
		$("#" + currentTab + "-tab").removeClass("selected-tab");
		$("#" + currentTab + "-div").hide();
	}
	
	$("#kiosk-tips").html(tipData[t]);
	
	currentTab = t;
	// Show the tab that will be
	$("#" + currentTab + "-tab").addClass("selected-tab");
	$("#" + currentTab + "-div").show();
	// Change the hash for future reference	
	location.hash = "#" + t;
	// Comment out this to remove the secret.
	$("#donttap").mousedown(function(){$("#secret").show();	setTimeout(function(){$("#secret").hide();},5000);});
}

// Calls the argument function when a connection is established
function checkConnection(fn){
	$.getJSON(hoursUrl,function(data,status){
        if (status != "success")
            console.log("FAILED: Connection Test");
		fn(status == "success");
	});
}

//This function displays the path to loc on the map
function mapBlip(loc){
	//Show the appropriate floor(s)
	$("#floor3-image").hide();
	$("#floor2-image").hide();
	$("#basement-image").hide();
	$(".pathblip").remove();
	$(".bliptitle").remove();
	var data = mapData[loc];
	var selector = "#" + data["floor"] + "-image";
	var map = $(selector);
	map.show();
	var left = map.position()["left"];
	var top = map.position()["top"];
	var width = map.width();
	var height = map.height();
	
	// Create a list of blips from mapData
	var blipqueue = {};
	var count = 0;
	$.each(data["path"], function(i, pt){
		var selector = "#" + pt["floor"] + "-image";
		var map = $(selector);
		var left = map.position()["left"];
		var top = map.position()["top"];
		var width = map.width();
		var height = map.height();
		var blip = $("<div>").addClass("pathblip").css({"left" : left + (width * pt["x"]), "top" : top + (height * pt["y"])});
		$("#map-box").prepend(blip);
		blipqueue[count] = blip;
		count++;
	});
	
	//Set the destination preview image src
	$("#map-location-image").attr("src", data["img"]);
	
	var x = left + (width * data["destx"]);
	var y = top + (height * data["desty"]);	
	var t = 200;
	var leftside = (data["imgpos"] == "left");
	$("#blip").css({"left" : x, "top" : y});
	clearTimeout(blipTimeout);
	//This starts off the chain that causes the blips to appear in sequence
	blipTimeout = setTimeout(function(){blipQ(blipqueue, t, 0, count, leftside);}, t);
	//This flashes and shows the destination blip
	$("#blip").stop().fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
	
	//Place the title text for the destination
	var title = $("#bliptitle");
	if(data["titlepos"] == "top"){
		title.text(data["title"]).css({"left": x - (title.width() * 0.5) + ($("#blip").width() / 2), "top" : (y - title.height()) - 5});
	}else{
		title.text(data["title"]).css({"left": x - (title.width() * 0.5) + ($("#blip").width() / 2), "top" : y + $("#blip").height() + 5});
	}
}


// This function allows the path to appear in sequence
// q is the list of blips
// t is the time to fade in over
// i is the current blip index (in q)
// end is the total count of q
// leftside is a boolean for which side to show the preview image box on
function blipQ(q, t, i, end, leftside){
	if(i < end){
		q[i].fadeIn(t);
		clearTimeout(blipTimeout);
		blipTimeout = setTimeout(function(){blipQ(q, t, i+1, end, leftside);}, t);
	} else {
		showDestinationBox(leftside);
        clearTimeout(closeMapTimeout);
        closeMapTimeout = setTimeout(function(){ closeMap()}, 1000*close_map_inactivity);
	}
    //if (i == 0)
    //    showDestinationBox(leftside);
}

//This function shows the destination preview image
function showDestinationBox(leftside){
	var x = $("#bliptitle").offset().left;
	var y = $("#bliptitle").offset().top + ($("#bliptitle").height()/2);
	var box = $("#map-location-box");
	var w, h;
	if($("#map-location-image").attr("src") != ""){
		if(leftside){
			$("#map-location-box-arrow-left").hide();
			$("#map-location-box-arrow-right").show();
			w = box.width();
			h = box.height();
			box.css({"left" : (x - w) - 13, "top" : y - (h / 2)});
		}else{
			$("#map-location-box-arrow-left").show();
			$("#map-location-box-arrow-right").hide();
			w = $("#bliptitle").width();
			h = box.height();
			box.css({"left" : (x + w) + 13, "top" : y - (h / 2)});
		}
		box.fadeIn(400);
	}
	
}

// Creates the hours page
function loadHours(){
    $("#right-hours ul li").remove();
    $("#left-hours ul li").remove();
    var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    
    if (!$.isEmptyObject(hoursData)) {
        for (var j in hoursData) {
            hours = hoursData[j];
            for (var i in hours) {
            
                var today = hours[i][0];
                var start = new Date(today.start*1000);
                var end = new Date(today.end*1000);
                
                var label = $('<li>').html(  days[start.getDay()] ).addClass('light-grey');
                var info = $('<li>').html('Error').addClass('light-grey');
                
                if (today.description != '' && today.description != 'nothing to show')
                    info = $(info).html(today.description);
                else if (today.is_open)
                    info = $(info).html(format_hours(start) + ' - ' + format_hours(end));
                else 
                    info = $(info).html('Closed');
                    
                $("#left-hours ul").append(label);
                $("#right-hours ul").append(info);
                
            }
        }
    } 
    
}


// Creates the hours header
function loadHoursHeader() {
    
    if (!$.isEmptyObject(hoursData)) {
        var hours = hoursData[0];
        var today = null;
        for (var i in hours) {
            today = hours[i][0];
            break; // just get first item
        }
        
        var start = new Date(today.start*1000);
        var end = new Date(today.end*1000);
        if (today.description != '')
            $("#header-hours").html('Open: ' + today.description);
        else if (today.is_open)
            $("#header-hours").html('Open: ' + format_hours(start) + ' - ' + format_hours(end));
        else 
            $("#header-hours").html('Closed: ' + format_hours(start) + ' - ' + format_hours(end));
    } 
}


function loadGroupsTimes(){
    
    for (var h=0; h<4; h++) {
        var ul = $('<ul>');
    
        for (var i=0; i<24; i++) {
            for (var j=0; j<60; j+=15) {
                var li = $('<li>').addClass('hour-'+i+'-'+j).html(getTimeString(i,j));
                $(ul).append(li);
            }
        }
        $('#group-container').append(ul);
        
    }
}


function loadGroups(){
    console.log('loadGroups()');
    $('#group-container').empty();
    loadGroupsTimes();

    var index = 1;
    for (var i in groupsData) {
        var room = groupsData[i];
        var label = $('<li>').addClass('room-label').html(i);
        $('#group-container').find('ul:nth-child(' + index +')').prepend(label);
        for (var j in room) {
            var event = room[j];
            
            var scls = 'li.hour-' + event.start.getHours() + '-' + event.start.getMinutes();
            $('#group-container').find('ul:nth-child(' + index +')').find(scls).addClass('group-event-start').html(event.summary);
            
            var ecls = 'li.hour-' + event.end.getHours() + '-' + event.end.getMinutes();
            $('#group-container').find('ul:nth-child(' + index +')').find(ecls).addClass('group-event-end');

        }
        index++;
    }
    
    $('#group-container ul li').each(function(){
        if ($(this).hasClass('group-event-start'))
            $(this).nextUntil('.group-event-end').andSelf().addClass('coverage');
    });
    

    
    positionGroups();
}

function positionGroups(){
    var now = new Date();
    var min = 0;
    if (now.getMinutes() > 45)
        min = 45;
    if (now.getMinutes() > 30)
        min = 30;
    if (now.getMinutes() > 15)
        min = 15;
    
    var markercls = '.hour-' + now.getHours() + '-' + min;
    console.log(markercls);
    $('#group-container').find(markercls).addClass('timeline-current');
    $('#group-container').scrollTo($('#group-container').find(markercls).first(), -200);
}




// // Creates the groups table
// function loadGroups(){

    // //$('#groups-iframe').contents().find(".agenda-more").remove();
    
    // //console.log($('#groups-iframe iframe').contents().find(".agenda-more").html());







	// // Empty old table
	// $(".group-row").remove();
	// // Start at 7:00 AM
	// var t = new Date(0, 0, 0, 7, 0, 0, 0);
	// // Switch for light/dark grey backgrounds
	// var light = false;
	
	// // Build blank table for future use
	// while(t.getHours() != 1){
		// $("#groups-table").append('<tr id="group' + t.getHours() + "" + t.getMinutes() + '" class="' + ((light = !light) ? "light-grey" : "dark-grey") + ' group-row"><th>' + getTimeString(t.getHours(), t.getMinutes()) + '</th><td class="sgr"></td><td class="lgr"></td><td class="3fngr"></td><td class="3fsgr"></td></tr>');
		// // Iterate by half an hour
		// t.setMinutes(t.getMinutes() + 30);
	// }
	
	// for (i in groupsData["today"]){
		// var group = groupsData["today"][i];
		// // Parse start and end times into date objects
		// var start= createDate(group["start"]);
		// var end = createDate(group["end"]);
        
		// // Index to record which block is being modified
		// var n = 0;
		// while(start < end){
			// var temp = new Date(start.getTime());
			// // Iterate by half an hour
			// start.setMinutes(start.getMinutes() + 30);
			// // Modify the appropriate table element to show a group is scheduled
			// $("#group" + temp.getHours() + "" + temp.getMinutes() + " ." + groupRoomIDs[group["location"]]).each(function(){
				// if(n == 0) $(this).text(group["title"]).css({"border-top":"1px solid #666666","font-weight":"bold"});
				// if(n == 1) $(this).text(getTimeString((temp.getMinutes() >= 30 ? temp.getHours() : temp.getHours() - 1), (temp.getMinutes() >= 30 ? temp.getMinutes() - 30 : 30)) + " - " + getTimeString(end.getHours(), end.getMinutes()));
				// if(start.getTime() == end.getTime()) $(this).css("border-bottom","1px solid #666666");
				// $(this).css("background-color","#97E5A3");
			// });
			// n++;
		// }
	// }
	
	// // Highlight current time
	// var today = new Date();
	// var selector = "#group" + today.getHours() + "" + (today.getMinutes() < 30 ? 0 : 30);
	
	// // Highlight the row for the current time slot
	// $(selector).addClass("current-time-row");
	
	// // Show directions if a column is tapped
	// $(".sgr").mousedown(function(){
		// $("#SGR-box").trigger('mousedown');
	// });
	// $(".lgr").mousedown(function(){
		// $("#LGR-box").trigger('mousedown');
	// });
	// $(".3fngr").mousedown(function(){
		// $("#3FNGR-box").trigger('mousedown');
	// });
	// $(".3fsgr").mousedown(function(){
		// $("#3FSGR-box").trigger('mousedown');
	// });
	
	
	// // Refresh the groups data (if connected)
	// // checkConnection(function(ok){
		// // if(ok){
			// // $.getJSON(groupsUrl, function(data){
				// // $.extend(true, groupsData, data);
			// // });
		// // }else{
			// // console.log("no connection");
		// // }
	// // });
	
	// // Refresh the table once per minute
	// //if(currentTab == "groups"){
	// //	setTimeout(loadGroups, 60000);
	// //}
	// //setTimeout(attachGroups, 500); // in tracking.js
// }

function createDate(dateStr) {
    //dateStr example is 2014/12/04 09:00:00 GMT-6
    if (navigator.userAgent.indexOf('Chrome') != -1) {
        var p = dateStr.split(' ');
        var date = p[0];
        var time = p[1];
        var zone = p[2];
        var dp = date.split('/');
        var tp = time.split(':');
        return new Date(dp[0], dp[1], dp[2], tp[0], tp[1], tp[2]);
    }
    return new Date(dateStr);
}

// // Returns the string representation of a weekday
// function getWeekday(d, o){
	// // Check if the day is today or tomorrow
	// if(o == 0){
		// return "Today";
	// }else if(o == 1){
		// return "Tomorrow";
	// }
	// // Return the string representation of the weekday
	// switch(d){
		// case 0:
			// return "Sunday";
		// case 1:
			// return "Monday";
		// case 2:
			// return "Tuesday";
		// case 3:
			// return "Wednesday";
		// case 4:
			// return "Thursday";
		// case 5:
			// return "Friday";
		// case 6:
			// return "Saturday";
	// }
// }

// Get simple string for hours/minutes (only meant for half-hour intervals)
function getTimeString(h, m){
	var ampm = "AM";
	if(m == 0){
		m = "00";
	}
	if(h >= 12){
		ampm = "PM";
		h -= 12;
	}
	if(h == 0){
		h = 12;
	}
	return h + ":" + m + " " + ampm;
}

// Generic event binding function (not needed, was used when trying to detect clicks on an iframe)
function bindEvent(element, type, handler) {
   if(element.addEventListener) {
      element.addEventListener(type, handler, false);
   } else {
      element.attachEvent('on'+type, handler);
   }
}

// IFrame Load, adds failure handler
function iframeLoad() {
    clearTimeout(computerFailure); // In case one is running
    computerFailure = setTimeout(function(){
        console.log("FAILURE: COMPUTER AVAILABILITY");
        $('#computer-availability').hide();
        $('#computer-availability-failure').show();
        iframeLoad(); // Try again
    }, 5000);
    $('#computer-availability').attr('src',computerUrl);
}

function iframeLoadMessage(event) {
    if (event.origin.indexOf('http://www.uwosh.edu' ) != 0)
        return;

    console.log("SUCCESS: COMPUTER AVAILABILITY");
    clearTimeout(computerFailure);
    $('#computer-availability').show();
    $('#computer-availability-failure').hide();
}
window.addEventListener("message", iframeLoadMessage, false);




function format_hours(date) {

    var ampm = "am";
    var h = date.getHours();
    var m = date.getMinutes();
    
    if (h >= 12) 
        ampm = "pm";
    if (h > 12) 
        h = h - 12;
    if (m < 10)
        m = '0' + m; // 0 pad it
        
    if (h == 0) 
        return "Midnight";
    else if (h == 12) 
        return "Noon";
    else
        return h + ':' + m + ' ' + ampm;
    
}


