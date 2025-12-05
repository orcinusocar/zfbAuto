const normal = "normal"

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
    if(item_type == "textcontains") {
        let detect_widget_item = textContains(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            // detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    if (item_type == "text") {
        let detect_widget_item = text(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            // detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "id") {
        let detect_widget_item = id(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            // detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "textContains") {
        let detect_widget_item = textContains(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            // detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "desc") {
        let detect_widget_item = desc(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            // detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    } else if(item_type == "className") {
        let detect_widget_item = className(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            // detectWidgetItemLog(log_level, item_content, try_time_max);
            return null;
        }
        return detect_widget_item;
    } else {
        console.error("invalid " + item_type)
    }
}
var choosePassenger = detectWidgetItem("textcontains", "商务", "error", normal)
if(choosePassenger != null) {
    console.log("找到选择按钮");
}else{
    console.log("没有找到按钮");
}
