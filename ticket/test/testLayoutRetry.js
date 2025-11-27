const layoutInspector = require("__layout_inspector__")(runtime, global);
var button = id('ticket_home_bottom_bar_1').findOne(1000);
if(button == null){
    console.log("find order button failed, retry with layoutInspector\n");
    layoutInspector.captureCurrentWindow();
    button = layoutInspector.id("ticket_home_bottom_bar_order").findOnce();
}
if (button) {
    console.log(button);  
    console.log(typeof button);
    commonClick(button);
}

function clickNodeCenter(obj) {
    if(obj == null) {
        console.error("clickNodeCenter: invalid obj " + obj)
        sendOnlineLog("error", "clickNodeCenter: invalid obj " + obj)
        return
    }
    
    var match = obj.bounds.match(/\((\d+),(\d+),(\d+),(\d+)\)/)
    if(!match) {
        console.error("clickNodeCenter: 无法解析bounds字符串 " + obj.bounds)
        sendOnlineLog("error", "clickNodeCenter: 无法解析bounds字符串 " + obj.bounds)
        return
    }
    
    var left = parseInt(match[1])
    var top = parseInt(match[2])
    var right = parseInt(match[3])
    var bottom = parseInt(match[4])
    var x = Math.floor((left + right) / 2)
    var y = Math.floor((top + bottom) / 2)
    var w = right - left
    var h = bottom - top
    
    var x1 = Math.ceil(x + random(-w / 3, w / 3))
    var y1 = Math.ceil(y + random(-h / 3, h / 3))
    var isClicked = click(x1, y1)
    if(!isClicked) {
        console.log("clickNodeCenter点击失败, x1 = " + x1 + ", y1 = " + y1)
        sendOnlineLog("error", "clickNodeCenter点击失败, x1 = " + x1 + ", y1 = " + y1)
    }
}

function commonClick(obj) {
    if(obj == null) {
        console.error("commonClick: invalid object " + obj)
        sendOnlineLog("error", "commonClick: invalid object " + obj)
        return
    }
    
    if(typeof obj.click === 'function') {
        myCustomClick(obj)
    } else {
        clickNodeCenter(obj)
    }
}

// 自定义点击
function myCustomClick(obj) {
    // console.log("obj " + obj)
    if(obj == null) {
        console.error("invalid obj " + obj)
        sendOnlineLog("error", "invalid obj " + obj)
        return
    }
    if(!obj.visibleToUser() || obj.bounds().height() <= 40) {
        console.error("obj不可见 " + obj)
        sendOnlineLog("error", "obj不可见 " + obj)
        obj.click()
        return
    }
    var bound = obj.bounds()
    var x = bound.centerX()
    var y = bound.centerY()
    var w = bound.width()
    var h = bound.height()

    // console.log(bound + ", " + x + ", " + y + ", " + w +", " + h)

    var x1 = Math.ceil(x + random(-w / 3, w / 3)), y1 = Math.ceil(y + random(-h / 3, h / 3))
    // sleep((random() + random(3,4)) * 100)
    // obj.click()
    var isCicked = click(x1 , y1)
    if(!isCicked) {
        console.log(obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
        sendOnlineLog("error", obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
        obj.click()
    }
    // press(x1, y1, random(200, 300))
    // console.log("isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
}
