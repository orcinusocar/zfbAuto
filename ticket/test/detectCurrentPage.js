function detectCurrentPage(){
    console.log("开始检测失误界面")
    
    var pageConfigs = [
        { name: "tip", selector: id("title").textContains("温馨提示"), msg: "卡在[温馨提示]界面；温馨提示未点击" },
        { name: "uncompleted", selector: id("h5_title").text("未完成"), msg: "卡在[未完成]界面；确认订单成功但无法离开未完成界面" },
        { name: "choose_date", selector: id("h5_title").text("选择日期"), msg: "卡在[选择日期]界面" },
        { name: "choose_passenger", selector: id("h5_title").text("选择乘车人"), msg: "卡在[选择乘车人]界面；乘车人不可选择-身份错误" },
        { name: "add_recipient", selector: className("android.widget.Button").text("添加受让人"), msg: "卡在[添加积分受让人]界面" },
        { name: "confirm_order", selector: id("h5_title").text("确认订单"), msg: "卡在[确认订单&提交订单]界面；提交订单失败" },
        { name: "home", selector: id("ticket_home_bottom_bar_ticket"), msg: "卡在[首页]界面；停在首页/无法进入待支付" },
        { name: "ticket_waiting", selector: textContains("订单处理中"), msg: "刚提交订单，出现[订单处理中]弹窗，时间超过脚本等待时间" },
        { name: "queue", selector: textContains("排队中"), msg: "卡在[排队中]界面;排队时间超过脚本等待处理的时间" },
        { name: "ticket_list", selector: text("直达"), msg: "卡在选择车次界面；意外卡顿"}
    ];
    
    var result = pageConfigs.find(function(config) {
        return config.selector.findOnce() != null;
    });
    
    if(result != null) {
        // console.log(result.msg);
        return result.msg;
    }
    
    // console.log("卡在其他界面；新界面需要添加");
    return "卡在其他界面；新界面需要添加";
}

msg = detectCurrentPage()
console.log(msg)