// initialize a global 'id' variable to hold the user's unique id
var id;
var blocks;
var blockHeight; 
var defaultBlocks = 2;

function createBlocks(val) {
    for(var i = 0; i < val; i++) {
        $("#wrapper2").append("<div class='block' id=" + i + "></div>");
    }
    blocks = $("#wrapper2").children().length;
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
            $("#" + i).css("background-color", colorstr);
        } else {
            $("#" + i).css("background-color", colorstr[i]);
        }
    }
}

// return the width of the 'targetArea' on the device
function getWidth() {
    return (parseInt($("#wrapper2").css("width")));
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
    var loc = Math.max(Math.floor(y / (blockHeight + parseInt($(".block").css("margin-top")))), 0);;
    if(loc > blocks - 1) {
        loc = blocks - 1;
    }
    console.log(loc);
    var rgb_string = $("#" + loc).css('background-color');
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
    // store properties in gesture
    gesture = {
        id: id,
        type: e.type,
        x: x_pos,
        speed: e.velocityX,
        color: getRGB(e.center.y)
    }; 
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
    
    $("#button").css("height", 0.5 * buttonHeights - 10 + "px");
    
    var blockMargins = parseInt($(".block").css("margin-top"));
        
    $("#wrapper2").css("height", height - buttonHeights + blockMargins + "px");
    
    var wrapper2Height = parseInt($("#wrapper2").css("height"));
    
    $(".block").css("height", (wrapper2Height - blockMargins * blocks) / blocks + "px");            
    
    blockHeight = parseInt($(".block").css("height"));
    blockTouch();
}

function newNumber() {
    $("#wrapper2").children().remove();
    createBlocks(blocks);
    $("#button").click(function() {
        setColor();
    });
    setColor();
    setHeight();
    targetArea = document.getElementById('wrapper2');
    hammer = new Hammer(targetArea);
}

function toggleButtons() {
    $(".select").click(function() {
        if(!$(this).hasClass("active")) {
            blocks = parseInt($(this).text());
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            newNumber();
        }
    });
}

function newColors() {
    $("#button").mouseup(function(){
        $(this).blur();
    });
    $("#button").on("touchend", function(){ 
        $(this).blur();
    });
    $("#button").click(function() {
        setColor();
        setHeight();
        targetArea = document.getElementById('wrapper2');
        hammer = new Hammer(targetArea);
    });
}

function startHammerJS() {
    // store DOM's 'targetArea' in a var
    var targetArea = document.getElementById('wrapper2');
    // create a new instance of Hammer in targetArea
    var hammer = new Hammer(targetArea);
    // listen to pan, tap, and press events
    hammer.on("pan tap press", action);
}

function blockTouch() {
    $(".block").mousedown(function() {
       $(this).addClass("overlay"); 
    });
    $(".block").mouseup(function() {
       $(this).removeClass("overlay"); 
    });
    
    $(".block").on("touchstart", function() {
       $(this).addClass("overlay"); 
    });
    $(".block").on("touchend", function() {
       $(this).removeClass("overlay"); 
    });
//    $(".block").mouseenter(function() {
//       $(this).addClass("overlay"); 
//    });
//    $(".block").mouseleave(function() {
//       $(this).removeClass("overlay"); 
//    });
//    $(".block").hover(
//        function() {
//            $(this).addClass("overlay");
//        }, function() {
//            $(this).removeClass("overlay");
//        }
//    );
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
    blockTouch();
    setHeight();
    setColor();
    startHammerJS();
    newColors();
    toggleButtons();
});