var data = {"path" : {}};
var points = 0;
var gridx = 160;
var gridy = 56;


$(document).ready(function(){
	var output = $("#output");
	var select = $("#select");
	var image = $("#image");
	var xgrid = $("#x");
	var ygrid = $("#y");
	
	select.val("0");
	xgrid.val(gridx);
	ygrid.val(gridy);
	
	xgrid.change(function(){ gridx = $(this).val();});
	ygrid.change(function(){ gridy = $(this).val();});
	
	image.change(function(){
		data["img"] = "images/" + image.val();
		output.text(JSON.stringify(data));
	});
	
	select.change(function(){
		var select = $("#select");
		$("img").hide();
		$("#floor1").show();
		console.log(select.val());
		$("#"+ select.val()).show();
		data["floor"] = select.val();
		output.text(JSON.stringify(data));
	});
	
	$("img").click(function(e){
		var floor = $(this).attr("id");
		var x = Math.round(((e.pageX - $(this).offset().left) / $(this).width()) * gridx)/gridx;
		var y = Math.round(((e.pageY - $(this).offset().top) / $(this).height()) * gridy)/gridy;
		console.log("floor: " + floor);
		console.log("x: " + x);
		console.log("y: " + y);	
		if(e.ctrlKey){
			data["destx"] = x;
			data["desty"] = y;
			$("#end").remove();
			var blip = $("<div>").addClass("blip").attr("id", "end").css({"left" : $(this).position().left + ($(this).width() * x), "top" : $(this).position().top + ($(this).height() * y)});
			$("#maparea").prepend(blip);
		}else{
			data["path"][points] = {"floor" : floor, "x" : x, "y" : y};
			var blip = $("<div>").addClass("blip").attr("id", ""+points).css({"left" : $(this).position().left + ($(this).width() * x), "top" : $(this).position().top + ($(this).height() * y)});
			blip.click(function(){ clickblip($(this).attr("id"));});
			$("#maparea").prepend(blip);
			points++;
		}
		output.text(JSON.stringify(data));
	});
	
	$("img").mouseover(function(e){
		$("#vbar").css("left", e.pageX+1);
		$("#hbar").css("top", e.pageY+1);
		$("#vbar").show();
		$("#hbar").show();
	});
	
	$("img").mousemove(function(e){
		$("#vbar").css("left", e.pageX+1);
		$("#hbar").css("top", e.pageY+1);
	});
	
	$("img").mouseout(function(e){
		$("#vbar").css("left", e.pageX+1);
		$("#hbar").css("top", e.pageY+1);
		$("#vbar").hide();
		$("#hbar").hide();
	});
	
	function clickblip(id){
		$("#" + id).remove();
		delete data["path"][id];
		output.text(JSON.stringify(data));
	}
});

