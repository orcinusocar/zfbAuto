function printCurrentPageControls() {
    // 获取当前所有可见控件
    let controls = className("android.widget.TextView").find();
    console.log("当前页面控件数量:", controls.length);

    // 遍历并打印控件信息
    for (let i = 0; i < controls.length; i++) {
        let control = controls[i];
        console.log("--- 控件 " + (i + 1) + " ---");
        console.log("类名:", control.className());
        console.log("文本:", control.text());
        console.log("ID:", control.id());
        console.log("深度:", control.depth());
        console.log("坐标:", control.bounds());
        console.log("是否可点击:", control.clickable());
    }

    let liveRoomTag = className("android.widget.TextView").find();
    console.log(liveRoomTag[0].id());

    // let liveRoomTag2 = className("android.widget.TextView").id("app").findOne(2000);
    // console.log(!!liveRoomTag2);

    let flag = false;
    if(liveRoomTag[0].id() == "app"){
        flag = true;
    }
    console.log(flag);

}

// 检查直播间
function checkLivePreview() {
    // 只匹配坐标有效的控件
    // let enterBtn = text("点击进入直播间").find()
    //     .filter(c => c.bounds().left > 0)[0];
    
    let liveTag = id("com.alipay.android.living.dynamic:id/liv_status")
        .find()
        .filter(c => {
            let bounds = c.bounds();
            return (bounds.right - bounds.left) > 0 ;    // 高度有效
        });

    // console.log(liveTag);

    if (liveTag[0]) {
        toast("找到直播间");
        console.log("识别到【直播中】控件");
        return true;
    } else {
        toast("非直播间");
        console.log("非直播间");
        return false;
    }
}

function getVideoAuthor(){
    let authorTitle = id("com.alipay.android.living.dynamic:id/author_title")
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0);
    console.log(authorTitle[0].text());

    if(authorTitle){
        return authorTitle.text();
    } else {
        return null;
    }
}

printCurrentPageControls();
checkLivePreview();
// getVideoAuthor()
