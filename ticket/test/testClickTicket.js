function detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains(class_name, trainNo, depart, arrive, log_level, try_time_frequency) {
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
    let views = className(class_name).textContains(trainNo).find();
    var detect_widget_item = null
    for(var i = 0; i < views.size(); i++) {
        var tv = views.get(i)
        var txt = tv.text().split(' ').join('')
        if(txt.indexOf(depart) != -1 && txt.indexOf(arrive) != -1) {
            detect_widget_item = tv
            break
        }
    }
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        let views = className(class_name).textContains(trainNo).find();  
        for(var i = 0; i < views.size(); i++) {
            var tv = views.get(i)
            var txt = tv.text().split(' ').join('')
            if(txt.indexOf(depart) != -1 && txt.indexOf(arrive) != -1) {
                detect_widget_item = tv
                break
            }
        }
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + trainNo + "|" + depart  + "|" + arrive, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}

function detectWidgetItemLog(log_level, item_content, try_time_max) {
    let log_message = "已尝试检测" + try_time_max + "次，均未检测到「" + item_content + "」控件";
    if(item_content != "h5_title|人证核验") {
        // sendOnlineLog(log_level, log_message);
    }

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
        case "none":
            console.verbose(log_message);
            break;
    }
}

function testClickTicket() {
    console.log("testClick");
    
    // 修正车次格式，使用带空格的格式
    var trainButton = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains("android.widget.Button", "G 1", "从北京南出发", "到达上海虹桥,历时", "error", 10);
    
    if(trainButton == null) {
        console.error("找不到车次");
        return 1;
    }
    console.log("找到车次: " + trainButton.text());
    trainButton.parent().click();
    sleep(1000);
    return 0;
}

testClickTicket();