// 提取自 12306_start_549_layout.js
// 测试：仅测试检测并点击"选择乘车人"控件

// ========== 常量定义 ==========
const normal = "normal"

// ========== 辅助函数 ==========

// 日志记录函数
function sendOnlineLog(level, message) {
    console.log("[" + level + "] " + message)
}

// 检测控件日志
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
        case "none":
            console.verbose(log_message);
            break;
    }
}

// 检测控件元素（仅text类型）
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
        let detect_widget_item = text(item_content).findOnce();
        let try_time = 0;
        while (!detect_widget_item) {
            sleep(100);
            detect_widget_item = text(item_content).findOnce();
            try_time++;
            if (try_time > try_time_max) {
                detectWidgetItemLog(log_level, item_content, try_time_max);
                return null;
            }
        }
        return detect_widget_item;
    } else {
        console.error("invalid " + item_type)
        return null;
    }
}

// 自定义点击函数
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

// ========== 测试函数 ==========

// 测试：仅测试检测并点击"选择乘车人"控件
function testClickChoosePassengerButton() {
    console.log("========== 开始测试：检测并点击选择乘车人控件 ==========")
    
    // 检测"选择乘车人"控件
    console.log("正在检测「选择乘车人」控件...")
    var choosePassenger = detectWidgetItem("text", "选择乘车人", "error", normal)
    
    if(choosePassenger != null) {
        console.log("✓ 成功找到「选择乘车人」控件")
        console.log("控件信息: " + choosePassenger.text() + ", " + choosePassenger.id() + ", " + choosePassenger.className())
        
        // 点击控件
        console.log("正在点击「选择乘车人」控件...")
        myCustomClick(choosePassenger)
        
        // 等待一下，观察点击效果
        sleep((random() + random(1, 3)) * 200)
        
        console.log("✓ 已点击「选择乘车人」控件")
        console.log("========== 测试完成 ==========")
        return 0
    } else {
        console.error("✗ 未找到「选择乘车人」控件")
        sendOnlineLog("error", "没有找到选择乘车人按钮")
        console.log("========== 测试完成 ==========")
        return 11
    }
}

// 执行测试
testClickChoosePassengerButton();
