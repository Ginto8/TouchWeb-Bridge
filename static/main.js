// initialize a global 'id' variable to hold the user's unique id
var id;

// number of color blocks you want on the interface
// 6 seems to be the reasonable limit
var blocks = 4;

function createBlocks() {
    for(var i = 0; i < blocks; i++) {
        $("#targetArea").append("<div class='block' id=" + i + "></div>");
    }
    $("#targetArea").append("<div id='wrapper'><button class='button'>New Colors</button></div>");
}

// select a random color for the user
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// set a random color for every user
function setColor() { 
    var color;
    for(var i = 0; i < $("#targetArea").children().length - 1; i++) {
        color = HSVtoRGB(Math.random(),1,1);//colors[random];
        color = [color.r,color.g,color.b];
        var colorstr = "rgb(" + (color[0]|0) + "," + (color[1]|0) + "," + (color[2]|0) + ")";
        // set the background color of 'targetArea' to the random color
        $("#" + i).css("background-color", colorstr);
    }
}

// return the width of the 'targetArea' on the device
function getWidth() {
    return (parseInt($("#targetArea").css("width")));
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
    var height = parseInt($("#targetArea").height()) / ($("#targetArea").children().length - 1);
    var loc = Math.floor(y / height);
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
            // console.log(x);
        },
        error: function() {
            console.log("error");
        }
    });
}

function setHeight() {
    var height = $("html").height();
    $("#targetArea").css("height", height);
    $(".block").css("height", height / $("#targetArea").children().length);
    $("#wrapper").css("height", height / $("#targetArea").children().length - 40);
    $("#targetArea").css("min-height", "300px");
    $(".block").css("min-height", "50px");
    $("#wrapper").css("min-height", "50px");
}

$(window).resize(function(){
        setHeight();
});

$(function() { 
    $.get("/runeffect/events")
    createBlocks();
    document.ontouchmove = function(e) {
        e.preventDefault();
        e.stopPropagation();
    };
    // set a random color
    setColor();
    setHeight();
    $(".button").click(function() {
        setColor();
    });
    // give the user a unique id
    id = getUniqueId();
    // store DOM's 'targetArea' in a var
    var targetArea = document.getElementById('targetArea');
    // create a new instance of Hammer in targetArea
    var hammer = new Hammer(targetArea);
    // listen to pan, tap, and press events
    hammer.on("pan tap press", action);
});