var packageName = "com.sankuai.movie"; 
launch(packageName);
waitForPackage(packageName);

const testLogUrl = "http://10.188.4.56:12201/gelf";
const testLogModule = "testlog";

// 检测是否为首页
function isCorrectPage(tab) {
    return tab.findOne(2000) !== null;
}

// 进入首页
function ensureMainPage() {
    let mainPageTab = id("com.sankuai.movie:id/db9");
    while (!isCorrectPage(mainPageTab)) {
        console.log("当前不是首页，尝试返回...");
        outBtn();
        sleep(2000);
    }
    let mainPageBtn = mainPageTab.findOne(2000).parent();
    mainPageBtn.click();
    console.log("已进入首页");
}

// 进入演出票务列表
function intoConcert() {
    try {
        ensureMainPage();
        const maxRetries = 3; // 最大重试次数
        let retryCount = 0;
        let isSuccess = false;

        while (retryCount < maxRetries && !isSuccess) {
            let concertTab = id("com.sankuai.movie:id/dj7").text("演唱会").findOne(5000);
            if (concertTab) {
                concertTab.click();
                console.log(`第 ${retryCount + 1} 次尝试进入演出票务列表...`);
                sleep(3000);
                //是否成功进入
                let isConcertListPage = id("com.sankuai.movie:id/dqm").findOne(2000);
                if (isConcertListPage) {
                    console.log("成功进入演出票务列表");
                    isSuccess = true;
                } else {
                    console.log("未成功进入演出票务列表，尝试返回首页重试...");
                    outBtn();
                    sleep(2000);
                    ensureMainPage(); 
                }
            } else {
                console.log("未找到演唱会入口");
            }
            retryCount++;
        }

        if (!isSuccess) {
            console.log("多次尝试后仍未能进入演出票务列表");
            return false; // 失败标志
        }
        return true; // 成功标志
    } catch (e) {
        console.log("进入演出列表失败:", e);
        return false;
    }
}

function getCurrentCity(){
    const maxRetries = 5;
    let retryCount = 0;
    while (retryCount < maxRetries) {
        let cityTag = className("android.view.View").boundsInside(44,200,150,300).clickable(false).findOne(2000);
        let city = "";
        if(cityTag && cityTag.text() != ""){
            city = cityTag.text();
            console.log("当前城市:",city);
            return city;
        }
        
        retryCount++;
        console.log(`第 ${retryCount} 次重试...`);
    }
    console.log("未找到城市")
    return "unknown";
}

// 收集城市演唱会信息
function collectConcertInfo() {
    let city = getCurrentCity();
    let bottomTag = null;
    while (!bottomTag) {
        bottomTag = text("只有这么多了").findOnce();
        autoSwipe();
    }
    sleep(2000);
    let allConcert = getAllConcert();
    return {"城市：":city,"演唱会详情":allConcert};
}

// 主逻辑
function main() {
    try {
        const startTime = new Date();

        intoConcert();
        let singleCityConcert = collectConcertInfo();
        
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        uploadLog(JSON.stringify(singleCityConcert, null, 2), duration + "s");
    } catch (e) {
        console.log("全局捕获异常:", e);
        uploadLog(`脚本异常: ${e.message}`, "0s (失败)");
    }
}

// 启动
main();

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
    gesture(200, [startX, y], [endX, y]);
}

function outBtn() {
    let control = boundsInside(10, 50, 100, 300).className("android.widget.ImageView").findOne(2000);
    if (control && control.parent()) {
        control.parent().click();
    } else {
        console.log("返回按钮未找到");
    }
}

function getAllConcert() {
    let controls = textMatches(/.*[¥￥].*\d+.*|即将开售|[¥￥]/).find();
    let allConcerts = []; 
    let uniqueNames = new Set();
    
    if (controls && controls.length > 0) {
        console.log("找到", controls.length, "个匹配的控件");
        for (let i = 0; i < controls.length; i++) {
            let control = controls[i];
            console.log("点击控件:");
            let parent = control.parent();
            if (!parent) {
                console.log("控件父元素不存在，跳过");
                continue;
            }
            parent.click();
            sleep(3000);
            
            let concertDetails = getConcertDetail();
            if (!concertDetails || !concertDetails.name) {
                console.log("获取演唱会详情失败，跳过");
                outBtn();
                sleep(2000);
                continue;
            }
            
            if (!uniqueNames.has(concertDetails.name)) {
                allConcerts.push(concertDetails);
                uniqueNames.add(concertDetails.name);
            } else {
                console.log("跳过重复演唱会:", concertDetails.name);
            }
            sleep(1000);
            outBtn();
            sleep(2000);
        }
    } else {
        console.log("未找到匹配的控件");
    }

    console.log("所有演唱会票务信息：", JSON.stringify(allConcerts, null, 2));
    return {
        数量: uniqueNames.size,
        详情: allConcerts
    };
}

function getConcertDetail() {
    let concertDetailTap = null;
    while (!concertDetailTap) {
        sleep(1000);
        concertDetailTap = className("android.widget.TextView").id("com.sankuai.movie:id/dqm").text("猫眼演出详情").findOnce();
    }
    sleep(3000);
    
    return {
        name: getConcertName() || "演出名称未知",
        price: getConcertprice() || "价格待定",
        time: getConcertTime() || "时间待定",
        location: getConcertLocation() || "地点待定"
    };
}

function uploadLog(message,duration) {
    let androidId = device.getAndroidId();
    const data = {
        androidId: androidId,
        message: message,
        duration: duration,
        module: testLogModule,
    };
    http.postJson(testLogUrl, data);
}

function getConcertName() {
    const maxRetries = 2;
    let retryCount = 0;
    while (retryCount < maxRetries) {
        let ConcertNameControls = boundsInside(360, 200, 1200, 500).className("android.view.View").find();
        if (ConcertNameControls && ConcertNameControls.length > 0) {
            for (let control of ConcertNameControls) {
                let text = control ? control.text() : "";
                if (text && text.trim() !== "") {
                    console.log("演出名称:", text);
                    return text;
                }
            }
        }
        
        retryCount++;
        console.log(`第 ${retryCount} 次重试...`);
    }
    console.log("没有找到演出名称");
    return "演出名称未知";
}

function getConcertprice(){
    const maxRetries = 2;
    let retryCount = 0;
    while(retryCount < maxRetries) {
        let priceExist = text("元").findOne(2000);
        if(priceExist){
            let children = priceExist.parent().children();
            let price = null;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                let text = child.text() || "";
                if (text.includes("-")||/\d/.test(text)) {
                    price = text;
                    break; 
                }
            }
            if (price) {
                console.log("找到价格文本:", price);
                return price;
            }
        }else{
            console.log("价格待定");
            return "价格待定";
        }
        retryCount++;
        console.log(`第 ${retryCount} 次重试...`);
    }
    console.log("没有找到价格");
    return "价格待定";
    
}

function getConcertTime() {
    const maxRetries = 2;
    let retryCount = 0;
    while(retryCount < maxRetries) {
        let controls = boundsInside(44, 600, 1036, 1000).find();
        for (let i = 0; i < controls.length; i++) {
            let control = controls[i];
            let text = control.text();
            if (text && text.trim() !== "") {
                let pattern = /^\d{4}\.\d{2}\.\d{2}/;
                if (pattern.test(text)) {
                    console.log("演出时间:", text);
                    return text;
                } 
            }
        }
        retryCount++;
        console.log(`第 ${retryCount} 次重试...`);
    }
    
    console.log("没有找到符合格式的演出时间");
    return "演出时间待定";
}

function extractTime(text) {
    // 匹配格式：YYYY.MM.DD HH:MM
    let pattern = /\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}/;
    let match = text.match(pattern);
    return match ? match[0] : null;
}

function getConcertLocation() {
    const maxRetries = 2;
    let retryCount = 0;
    while (retryCount < maxRetries) {
        let controls = boundsInside(44, 800, 900, 1100).find();
        let text = "";
        let foundValidText = false;

        for (let i = 0; i < Math.min(controls.length, 2); i++) {
            let control = controls[i];
            let txt = control.text();
            if (txt && txt.trim() !== "") {
                if (!text.includes("|")) {
                    text += txt + "|";
                } else {
                    text += txt;
                }
                foundValidText = true;
            }
        }

        if (foundValidText) {
            console.log("演出地点:", text);
            return text;
        }

        retryCount++;
        console.log(`第 ${retryCount} 次重试...`);
    }

    console.log("未找到有效地点信息");
    return "地点待定";
}

function getHotConcert(){
    console.log("热门演唱会：");
}

