// let comingConcertName = bounds(365,258,1036,390).text();

// let comingConcert = bounds(365,258,1036,390).clickable().findOne(2000);
// let comingConcert2 = bounds(365,258,1036,403).clickable().findOne(2000);
// if(comingConcert){
//     console.log(comingConcert.text());
// }else if(comingConcert2){
//     console.log(comingConcert2.text());
// }else{
//     console.log("没有找到即将开抢的演出");
// }

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


function getConcertName(){
    sleep(3000);
    let Concert = boundsInside(365,258,1036,500).clickable().findOne(2000);
    if(Concert){
        console.log(Concert.text());
    }else{
        console.log("没有找到演出名称");
    }
}

function getConcertDetail(){
    let showTag = text("精彩演出").findOne(2000);

    let controls = textMatches(/.*￥\d+起|即将开售/).find();

    if (controls.length > 0) {
        console.log("找到", controls.length, "个匹配的控件");
        for (let i = 0; i < controls.length; i++) {
            let control = controls[i];
            console.log("点击控件:");
            let parent = control.parent();
            parent.click(); 
            sleep(3000);
            getConcertName();
            sleep(5000);
            autoOutPage();
            sleep(3000);
        }
    } else {
        console.log("未找到匹配的控件");
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
    return null;
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
// getConcertDetail();

getConcertName();
getConcertTime();
getConcertLocation();
getConcertprice();

// let bottomTag = null;
// while(!bottomTag){
//     bottomTag = text("只有这么多了").findOnce();
//     autoSwipe();
// }
// console.log("滑动结束");
// bottomTag = text("只有这么多了").findOnce();
// console.log(bottomTag.text());