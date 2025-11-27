const layoutInspector = require("__layout_inspector__")(runtime, global);

const timeout = 1000
const normal = "normal"
var global_result = 0

function sendOnlineLog(level, message) {
    console.log("[" + level + "] " + message)
}

function detectWidgetItemLog(log_level, item_content, try_time_max) {
    let log_message = "已尝试检测" + try_time_max + "次，均未检测到「" + item_content + "」控件";
    sendOnlineLog(log_level, log_message);
    switch (log_level) {
        case "info":
            console.info(log_message);
            break;
        case "error":
            console.error(log_message);
            break;
        case "log":
            console.log(log_message);
            break;
        case "warn":
            console.warn(log_message);
            break;
    }
}

function detectWidgetItemWithChainClassnameText(class_name, text_str, log_level, try_time_frequency) {
    let try_time_max = 0;
    if (try_time_frequency == "normal") {
        try_time_max = 50;
    }
    else if (try_time_frequency == "lite") {
        try_time_max = 20;
    }
    else {
        try_time_max = try_time_frequency;
    }
    let detect_widget_item = className(class_name).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = className(class_name).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + text_str, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}

function detectWidgetItemWithChain1(id_str, text_str, log_level, try_time_frequency) {
    let try_time_max = 0;
    if (try_time_frequency == "normal") {
        try_time_max = 50;
    }
    else if (try_time_frequency == "lite") {
        try_time_max = 20;
    }
    else {
        try_time_max = try_time_frequency;
    }
    let detect_widget_item = id(id_str).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = id(id_str).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, id_str + "|" + text_str, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}

function myCustomClick(obj) {
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

    var x1 = Math.ceil(x + random(-w / 3, w / 3)), y1 = Math.ceil(y + random(-h / 3, h / 3))
    var isCicked = click(x1 , y1)
    if(!isCicked) {
        console.log(obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
        sendOnlineLog("error", obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
        obj.click()
    }
}

function clickNodeCenter(obj) {
    if(obj == null) {
        console.error("clickNodeCenter: invalid obj " + obj)
        sendOnlineLog("error", "clickNodeCenter: invalid obj " + obj)
        return
    }
}

function testOrderConfirm() {
    console.log("测试提交订单")
    sleep((random() + random(2, 4)) * 500)
    var orderConfirm2 = detectWidgetItemWithChainClassnameText("android.widget.Button", "提交订单", "error", normal)
    if(orderConfirm2 != null) {
        myCustomClick(orderConfirm2)
    } else {
        console.log("提交订单按钮不存在，尝试使用layoutInspector重试")
        // sendOnlineLog("info", "提交订单按钮不存在，尝试使用layoutInspector重试")
        layoutInspector.captureCurrentWindow()
        orderConfirm2 = layoutInspector.text("提交订单").findOnce()
        if(orderConfirm2 != null) {
            console.log("layoutInspector重试成功，找到提交订单按钮")
            // sendOnlineLog("info", "layoutInspector重试成功，找到提交订单按钮")
        }
    }
}

testOrderConfirm()

