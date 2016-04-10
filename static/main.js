$(function() {
    $.get("/runeffect/events")
})
$(function() {
    
    // array of color choices
    var colors = ["red", "green", "orange", "purple"];
    
    // generate a random digit between 0 and 3
    var random = Math.floor(Math.random() * 4);
    
    // select a random color for the user
    var color = colors[random];
    
    // set the background color of 'targetArea' to the random color
    $('#targetArea').css("background-color", color);
    
    // declare gesture object
    var gesture;

    // store DOM's 'targetArea' in a var
    var targetArea = document.getElementById('targetArea');
    
    // create a new instance of Hammer in targetArea
    var hammer = new Hammer(targetArea);
    
    // listen to pan, tap, and press events
    hammer.on("pan tap press", action);
    
    // get the desired parameters from each action
    // store those parameters in the 'gesture' object
    function action(e) {
        getRGB();
        var x_pos = 0;
        if(e.center.x/getWidth() > 1) {
            x_pos = 1;
        } else {
            x_pos = e.center.x/getWidth();
        }

        gesture = {
            id: getUniqueId(),
            type: e.type,
            x: x_pos,
            speed: e.velocityX,
            color: getRGB()
        };  
        
        targetArea.textContent = gesture.x;

        // log 'gesture' object for debugging purposes
        console.log(gesture);
        
        $.ajax({
            type: 'POST',
            // Provide correct Content-Type, so that Flask will know how to process it.
            contentType: 'application/json',
            // Encode your data as JSON.
            data: JSON.stringify(gesture),
            // This is the type of data you're expecting back from the server.
            dataType: 'json',
            // bridge IP address: 192.168.1.7
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
});

function getWidth() {
    return (parseInt($("#targetArea").css("width")));
}

function getUniqueId() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function getRGB() {
    var rgb = [];
    var rgb_string = ($("#targetArea").css('background-color'));
    var rgb_array = rgb_string.match(/\b(\d+(\.\d*)?|\.\d+)/g);
    for(var i = 0; i < rgb_array.length; i++) {
        rgb.push(parseInt(rgb_array[i]));       
    }
    return rgb;
}
