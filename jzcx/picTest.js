
showTouchColor();

function showTouchColor() {
    requestScreenCapture();
    console.show(true);
    events.observeTouch();
    events.setTouchEventTimeout(30);
    events.on("touch", function(point){
        var c = colors.toString(images.pixel(captureScreen(), point.x, point.y));
        log("(" + point.x + ", " + point.y + "): " + c);
    });
}