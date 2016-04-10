// initialize a global 'id' variable to hold the user's unique id
var id;
// set a random color for every user
function setColor() {  
    // array of color choices
    var colors = ["red", "green", "orange", "purple"];
    // generate a random digit between 0 and 3
    var random = Math.floor(Math.random() * 4);
    // select a random color for the user
    var color = colors[random];
    // set the background color of 'targetArea' to the random color
    $('#targetArea').css("background-color", color);
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
function getRGB() {
    var rgb = [];
    var rgb_string = ($("#targetArea").css('background-color'));
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
        color: getRGB()
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
            console.log(x);
        },
        error: function() {
            console.log("error");
        }
    });
}

$(function() { 
    // set a random color
    setColor();
    // give the user a unique id
    id = getUniqueId();
    // store DOM's 'targetArea' in a var
    var targetArea = document.getElementById('targetArea');
    // create a new instance of Hammer in targetArea
    var hammer = new Hammer(targetArea);
    // listen to pan, tap, and press events
    hammer.on("pan tap press", action);
});