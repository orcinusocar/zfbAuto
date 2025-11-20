var normal = "normal";

var theTrainFormat = "D197";
var departStaName = "柳州";
var arriveStaShorcut = "来宾北";

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

function findTrainTicket() {
    console.log("查找车次: " + theTrainFormat + "次，从" + departStaName + "出发，到达" + arriveStaShorcut);
    var trainButton = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains(
        "android.widget.Button", 
        theTrainFormat + "次", 
        "从" + departStaName + "出发", 
        "到达" + arriveStaShorcut + ",历时", 
        "error", 
        100
    );
    
    if(trainButton != null) {
        console.log("找到车次控件");
        console.log("控件文本: " + trainButton.text());
        console.log("控件ID: " + trainButton.id());
        console.log("控件可见: " + trainButton.visibleToUser());
        console.log("控件高度: " + trainButton.bounds().height());
        return trainButton;
    } else {
        console.error("未找到指定车次控件");
        return null;
    }
}

var trainButton = findTrainTicket();
if(trainButton != null) {
    console.log("成功找到车票控件");
} else {
    console.log("未找到车票控件");
}
