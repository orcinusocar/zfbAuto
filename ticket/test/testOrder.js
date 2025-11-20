var normal = "normal";

function detectWidgetItemLog(log_level, item_content, try_time_max) {
    let log_message = "已尝试检测" + try_time_max + "次，均未检测到「" + item_content + "」控件";
    console.log(log_message);
    
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

function detectWidgetItem(item_type, item_content, log_level, try_time_frequency) {
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
    if (item_type == "text") {
        let detect_widget_item = text(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "id") {
        let detect_widget_item = id(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "textContains") {
        let detect_widget_item = textContains(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "desc") {
        let detect_widget_item = desc(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    } else if(item_type == "className") {
        let detect_widget_item = className(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    } else if(item_type == "textcontains") {
        let detect_widget_item = textContains(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    else {
        console.error("invalid " + item_type)
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

function myCustomClick(obj) {
    if(obj == null) {
        console.error("invalid obj " + obj)
        return
    }
    if(!obj.visibleToUser() || obj.bounds().height() <= 40) {
        console.error("obj不可见 " + obj)
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
        obj.click()
    }
}

function clickBottomOrder() {
    console.log("点击底部订单")
    sleep((random() + random(2, 4)) * 500)
    var orderRadio = detectWidgetItem("id", "ticket_home_bottom_bar_order", "error", normal)
    if(orderRadio != null) {
        myCustomClick(orderRadio)
        sleep((random() + random(2, 4)) * 200)
        var oderPayment2 = detectWidgetItemWithChainClassnameText("android.widget.Button", "待支付", "error", normal)
        if(oderPayment2 != null) {
            sleep((random() + random(2, 4)) * 200)
            myCustomClick(oderPayment2)
            detectWidgetItemWithChainClassnameText("android.widget.Button", "立即支付", "error", normal)
            sleep((random() + random(3, 5)) * 100)
            myCustomClick(detectWidgetItem("id", "h5_tv_nav_back", "error", normal))
        } else {
            console.error("放弃后未进入底部的订单页面")
            return false;
        }
    } else {
        console.error("底部订单按钮不存在")
        return false;
    }
    return true;
}

clickBottomOrder();
