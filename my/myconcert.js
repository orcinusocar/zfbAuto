var packageName = "com.sankuai.movie"; 
launch(packageName);
waitForPackage(packageName);

//页面处理器
const pageHandlers = {
    guideMask:{
        check: () => {
            //引导遮罩
            let guideMask = className("android.widget.Button").text("知道了").clickable().findOne(2000);
            if(guideMask){
                return true;
            }else{
                return false;
            }
        },
        action: () => {
            console.log("引导遮罩，执行退出操作");
            let guideMask = className("android.widget.Button").text("知道了").clickable().findOne(2000);
            if (guideMask) {
                guideMask.click();
            }
        }
    },
    concertListPage: {
        check: () => {
            //演出票务列表
            return id("com.sankuai.movie:id/dqm").findOne(2000) !== null;
        },
        action: () => {
            console.log("演出票务列表，收集信息");
            collectConcertInfo();
        }
    },
    tabPage: {
        check: () => {
            //tab
            return id("com.sankuai.movie:id/db9").findOne(2000) !== null;
        },
        action: () => {
            console.log("进入首页");
            intoMainPage();
            console.log("进入演唱会");
            intoConcert();
            collectConcertInfo();
        }
    },
    defaultPage: {
        check: () => true, 
        action: () => {
            console.log("未识别到目标页面，尝试进入演唱会页面");
            intoConcert();
        }
    }
};

//执行
function handlePageDetection() {
    for (var name in pageHandlers) {
        if (pageHandlers.hasOwnProperty(name)) {
            var handler = pageHandlers[name];
            if (handler.check()) {
                handler.action();
                return name;
            }
        }
    }
    return "unknown";
}

function intoMainPage(){
    let mainPageParent = id("com.sankuai.movie:id/db9").findOne(2000).parent();
    if (mainPageParent) {
        mainPageParent.click();
        sleep(2000);
    }
}

//收集演唱会信息
function collectConcertInfo() {
    console.log("收集演唱会信息");
    // getComingConcert();
    // getHotConcert();
    let bottomTag = null;
    while(!bottomTag){
        bottomTag = text("只有这么多了").findOnce();
        autoSwipe();
    }
    getAllConcert();
    
}

function getComingConcert(){
    let concertInfo = getComingConcertInfo();
    console.log("即将开抢的演唱会：");
}

function getComingConcertInfo(){
    let bookbtn = text("即将开抢").findOne(2000);
    let bookbtnParent = bookbtn.parent();
    bookbtnParent.click();
    sleep(5000);
    let comingConcertName = getConcertName();
    let comingConcertprice = getConcertprice();
    let comingConcertTime = getConcertTime();
}

function getConcertName(){
    sleep(3000);
    let ConcertNameControls = boundsInside(365,258,1036,500).clickable().find();
    for (let i = 0; i < ConcertNameControls.length; i++) {
        let control = ConcertNameControls[i];
        let text = control.text();
        if (text && text.trim() !== "") {
            console.log("演出名称:", text);
            return text;
        }
    }
    console.log("没有找到演出名称");
    return "演出名称未知";
}

function getConcertprice(){
    let priceExist = text("元").findOne(2000);
    if(priceExist){
        let children = priceExist.parent().children();
        let price = null;
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            let text = child.text() || "";
            if (text.includes("-")) {
                price = text;
                break; 
            }
        }
        if (price) {
            console.log("找到价格文本:", price);
            return price;
        } else {
            console.log("未找到价格文本");
            return "价格未知";
        }
    }else{
        console.log("价格待定");
        return "价格待定";
    }
    
}

function getConcertTime() {
    sleep(2000);
    let controls = boundsInside(44, 600, 1036, 1000).clickable().find();
    for (let i = 0; i < controls.length; i++) {
        let control = controls[i];
        let text = control.text();
        if (text && text.trim() !== "") {
            console.log("演出时间:", text);
            return text;
        }
    }
    console.log("没有找到演出时间");
    return "演出时间未知";
}


function extractTime(text) {
    // 匹配格式：YYYY.MM.DD HH:MM
    let pattern = /\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}/;
    let match = text.match(pattern);
    return match ? match[0] : null;
}

function getConcertLocation(){
    
    let controls = boundsInside(44,800,900,1100).find();
    let text = "";
    for (let i = 0; i < controls.length; i++) { 
        let control = controls[i];
        let txt = control.text();
        if (txt && txt.trim() !== "" && !text.includes("|") ) {
            // console.log("地点:", txt);
            txt += "|";
            text += txt;
        }else if(txt && txt.trim() !== "" && text.includes("|")){
            text += txt;
        }
    }
    console.log("演出地点:", text);
    return text;
}

function getHotConcert(){
    console.log("热门演唱会：");
}

function getAllConcert(){
    let controls = textMatches(/.*￥\d+起|即将开售/).find();

    if (controls.length > 0) {
        console.log("找到", controls.length, "个匹配的控件");
        for (let i = 0; i < controls.length; i++) {
            let control = controls[i];
            console.log("点击控件:");
            let parent = control.parent();
            parent.click(); 
            getConcertDetail();
            sleep(5000);
            autoOutPage();
            sleep(3000);
        }
    } else {
        console.log("未找到匹配的控件");
    }
    console.log("所有演唱会票务信息：");
}

function getConcertDetail(){
    sleep(3000);
    let concertName = getConcertName();
    let concertprice = getConcertprice();
    let concertTime = getConcertTime();
    let concertLocation = getConcertLocation();
    if(concertName && concertprice && concertTime && concertLocation){
        console.log("演唱会详情：",concertName,concertprice,concertTime,concertLocation);
    }else{
        console.log("演唱会详情缺少信息");
    }
}



//进入演唱会页面
function intoConcert() {
    let concertTab = id("com.sankuai.movie:id/dj7").text("演唱会").findOne(3000);
    if (concertTab) {
        concertTab.click();
        sleep(5000);
    } else {
        console.log("未找到演唱会入口");
    }
}

function autoSwipe() {
    let startY = device.height * 0.8;
    let endY = device.height * 0.2;
    swipe(device.width / 2, startY, device.width / 2, endY, 1000);
}

function autoOutPage(){
    // 滑动参数：从 (x1, y) 到 (x2, y)，持续 duration 毫秒
    let screenWidth = device.width;
    let screenHeight = device.height;
    let startX = 10;          // 左边缘起始点（避免太靠边）
    let endX = screenWidth / 2; // 滑动到屏幕中部
    let y = screenHeight / 2;  // 垂直居中

    // 执行滑动（模拟手指滑动）
    gesture(500, [startX, y], [endX, y]);
}

// 启动
handlePageDetection();
