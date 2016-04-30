// initialize a global 'id' variable to hold the user's unique id
var id;
var blocks;
var blockHeight; 
var defaultBlocks = 2;
var loc;
var side = "front";

function createBlocks(val) {
    for(var i = 0; i < val; i++) {
        $(".front").append("<div class='block' id=f" + i + "></div>");
        $(".back").append("<div class='block' id=b" + i + "></div>");
    }
    blocks = $(".front").children().length;
} 

// set a random color for every user
function setColor() { 
    var colorstr = Please.make_color({
        hue: 12, //set your hue manually
        saturation: .7, //set your saturation manually
        value: .8, //set your value manually
        colors_returned: blocks //set number of colors returned
    });
    for(var i = 0; i < blocks; i++) {
        if(blocks == 1) {
            $(".front>#f" + i).css("background-color", colorstr);
            $(".back>#b" + i).css("background-color", colorstr);
        } else {
            $(".front>#f" + i).css("background-color", colorstr[i]);
            $(".back>#b" + i).css("background-color", colorstr[i]);
        }
    }
}

// return the width of the 'targetArea' on the device
function getWidth() {
    return parseInt($("#card").css("width"));
}

// generate a unique ID for each user
function getUniqueId() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

// get the RGB values of 'targetArea', store them in an array, and return them
function getRGB(y) {  
    var rgb = [];
    loc = Math.max(Math.floor(y / (blockHeight + parseInt($(".block").css("margin-top")))), 0);;
    if(loc > blocks - 1) {
        loc = blocks - 1;
    }
    var rgb_string = $("#f" + loc).css('background-color');
    var rgb_array = rgb_string.match(/\b(\d+(\.\d*)?|\.\d+)/g);
    for(var i = 0; i < rgb_array.length; i++) {
        rgb.push(parseInt(rgb_array[i]));       
    }
    return rgb;
}

// get the desired parameters from each action
// store those parameters in the 'gesture' object
// send the call over AJAX with the 'gesture' object
function action(e) {
    // declare gesture object
    var gesture;
    // initialize x_pos
    var x_pos = 0;
    // map the location of the finger/cursor on the device to a value from 0 to 1
    // make sure that it is not greater than 1 or less than 0
    if(e.center.x/getWidth() > 1) {
        x_pos = 1;
    } else {
        x_pos = e.center.x/getWidth();
    }
    if(side == "back") {
        x_pos = 1 - x_pos;
    }
    // store properties in gesture
    gesture = {
        id: id,
        type: e.type,
        x: x_pos,
        speed: e.velocityX,
        color: getRGB(e.center.y)
    }; 
    console.log(gesture);
    // make an AJAX call
    $.ajax({
        type: 'POST',
        // Provide correct Content-Type, so that Flask will know how to process it.
        contentType: 'application/json',
        // Encode your data as JSON.
        data: JSON.stringify(gesture),
        // This is the type of data you're expecting back from the server.
        dataType: 'json',
        url: '/api/touch',
        success: function() {
            console.log("success");
        },
        error: function() {
            console.log("error");
        }
    });
}

function setHeight() {
    var height = parseInt($("html").height());
    $("#buttonContainer").css("height", 0.25 * height + "px");
    var buttonHeights = parseInt($("#buttonContainer").css("height"));
    $(".select").css("height", 0.5 * buttonHeights - 10 + "px");
    $("#newColor").css("height", 0.5 * buttonHeights - 10 + "px");
    $("#flip").css("height", 0.5 * buttonHeights - 10 + "px");
    var blockMargins = parseInt($(".block").css("margin-top"));
    $("#card").css("height", height - buttonHeights + blockMargins + "px");
    var cardHeight = parseInt($("#card").css("height"));
    $(".block").css("height", (cardHeight - blockMargins * blocks) / blocks + "px");
    //maxHeights();
    blockHeight = parseInt($(".block").css("height"));
    hoverOverlay();
}

function newNumber() {
    $(".front").children().remove();
    $(".back").children().remove();
    createBlocks(blocks);
    newColors();
    setColor();
    setHeight();
    targetArea = document.getElementById('card');
    hammer = new Hammer(targetArea);
}

function toggleButtons() {
    $(".select").click(function() {
        if(!$(this).hasClass("active")) {
            blocks = parseInt($(this).text());
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            newNumber();
            loc = undefined;
        }
    });
}

function newColors() {
    $("#newColor").mouseup(function(){
        $(this).blur();
    });
    $("#newColor").on("touchend", function(){ 
        $(this).blur();
    });
    $("#newColor").click(function() {
        setColor();
        setHeight();
        targetArea = document.getElementById('card');
        hammer = new Hammer(targetArea);
        loc = undefined;
    });
}

function startHammerJS() {
    // store DOM's 'targetArea' in a var
    var targetArea = document.getElementById('card');
    // create a new instance of Hammer in targetArea
    var hammer = new Hammer(targetArea);
    // listen to pan, tap, and press events
    hammer.on("pan tap press", action);
}

function maxHeights() {
    if($(window).width() < 980) {
        $("#card").addClass("max-height");
    } else {
        $("#card").removeClass("max-height");
    }
}

function hoverOverlay() {
    var clicking = false;
    $('.block').mousedown(function(){
        clicking = true;
        if(loc != undefined && loc == parseInt($(this).attr("id"))) {
            $("#f" + loc).css({opacity: 0.7});
            $("#b" + loc).css({opacity: 0.7});
        } else {
            $(this).css({opacity: 0.7});
        }
    });
    $(document).mouseup(function(){
        clicking = false;
        $(".block").css({opacity: 1.0});
    });
    $('.block').mousemove(function(){
        if(clicking != false) {
            $(".block").css({opacity: 1.0});
            $("#f" + loc).css({opacity: 0.7});
            $("#b" + loc).css({opacity: 0.7});
        }
    });
    $('.block').on("touchstart", function(){
        clicking = true;
        if(loc != undefined && loc == parseInt($(this).attr("id"))) {
            $("#f" + loc).css({opacity: 0.7});
            $("#b" + loc).css({opacity: 0.7});
        } else {
            $(this).css({opacity: 0.7});
        }    });
    $(document).on("touchend", function(){
        clicking = false;
        $(".block").css({opacity: 1.0});
    });
    $('.block').on("touchmove", function(){
        if(clicking != false) {
            $(".block").css({opacity: 1.0});
            $("#f" + loc).css({opacity: 0.7});
            $("#b" + loc).css({opacity: 0.7});
        }
    });
}

function flip() {
    $("#flip").click(function() { 
        $("#card").flip('toggle');
        if(side == "front") {
            $("#image2").attr("src", "static/flip2.png");
            side = "back";
        } else if (side == "back") {
            $("#image2").attr("src", "static/flip1.png");
            side = "front";
        }
        setHeight();
        loc = undefined;
    });
}

$(window).resize(function() {
    setHeight();
});

$(function() {
    $.get("/runeffect/events");
    createBlocks(defaultBlocks);
    document.ontouchmove = function(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    id = getUniqueId();
    setHeight();
    setColor();
    startHammerJS();
    hoverOverlay();
    newColors();
    toggleButtons();
    $("#card").flip({
        trigger:'manual',
        speed:2000
    });
    flip();
});
