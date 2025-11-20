function clickButton(selector) {
    var button = selector.findOne(1000);
    if(button != null) {
        button.parent().click();
        console.log("button exist",button);
        console.log("button parent",button.parent());
    } else {
        console.log("This button is not found");
    }
}

function clickButtonCenter(selector) {
    var button = selector.findOne(1000);
    if(button != null) {
        var bounds = button.bounds();
        // var centerX = bounds.centerX();
        // var centerY = bounds.centerY();
        // click(centerX, centerY);

        // button.parent().click();
        // console.log(button.parent());
        
    }
}

clickButton(text("清除数据"));