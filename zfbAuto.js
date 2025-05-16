// 导入 AutoJS 的相关模块
var packageName = "com.eg.android.AlipayGphone"; // 视频App的包名


// 打开视频App
launch(packageName);

// 等待视频App加载完成
waitForPackage(packageName);

// 收集信息
// collectInfo();

//测试识别直播image.png
testDetection();

//打印当前页面控件信息
// printCurrentPageControls();

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机自动刷视频
function autoSwipe() {
    // 随机滑动参数（增大滑动距离）
    let startY = random(device.height * 0.8, device.height * 0.9);  // 起始点更靠下
    let endY = random(device.height * 0.1, device.height * 0.2);    // 结束点更靠上
    let duration = random(1000, 1500);                              // 延长滑动时间

    // 模拟带随机弧度的滑动
    swipe(
        device.width / 2 + random(-100, 100),  // 横向偏移范围从 -100 到 100
        startY,
        device.width / 2 + random(-100, 100),
        endY,
        duration
    );

}

function watchVideo(){
    // 模拟观看视频（随机停留时间）
    sleep(random(5000, 10000));
}   

function autoOutLive(){
    // 滑动参数：从 (x1, y) 到 (x2, y)，持续 duration 毫秒
    let screenWidth = device.width;
    let screenHeight = device.height;
    let startX = 10;          // 左边缘起始点（避免太靠边）
    let endX = screenWidth / 2; // 滑动到屏幕中部
    let y = screenHeight / 2;  // 垂直居中

    // 执行滑动（模拟手指滑动）
    gesture(500, [startX, y], [endX, y]);
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
        //toast("找到直播间");
        //console.log("识别到【直播中】控件");
        return true;
    } else {
        //toast("非直播间");
        //console.log("非直播间");
        return false;
    }
}


//收集直播信息
function collectLiveInfo() {
    let author = getLiveAuthor();
    let desc = getLiveDesc();
    let like = getLiveLike();
    // console.log("作者:", author);
    // console.log("描述:", desc);
    // console.log("赞数:", like);
}

//收集视频信息
function collectVideoInfo() {
    let author = getVideoAuthor();
    let desc = getVideoDesc();
    let like = getVideoLike();
    let comment = getVideoComment();
    let collect = getVideoCollect();
    console.log("用户名: " + author);
    console.log("视频描述: " + desc);
    console.log("赞数: " + like);
    console.log("评论: " + comment);
    console.log("收藏: " + collect);
}

function getLiveLike() {

    let like = className("android.widget.TextView")
    .textMatches(/.*点赞.*/)
    .find(); 

    if (like[0] && like[0].text) {
        let text = like[0].text();
        return text.replace("点赞", "").trim(); // 返回赞数（如 "1.6万"）
    } else {
        return null; 
    }
}   

//视频发布者名称
function getVideoAuthor(){
    let authorTitle = id("com.alipay.android.living.dynamic:id/author_title")
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0);
    if(authorTitle[0]){
        return authorTitle[0].text();
    } else {
        return null;
    }
}


//视频描述
function getVideoDesc(){
    let desc = className("android.widget.TextView").clickable(true).depth(24)
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0);
    if(desc[0]){              
        return desc[0].text();
    } else {
        return null;
    }   
}


//视频赞数
function getVideoLike(){
    let like = id("com.alipay.android.living.dynamic:id/praise_text")
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0);
    if(like[0]){
        return like[0].text();
    } else {
        return null;
    }
}

//评论数
function getVideoComment(){
    let comment = id("com.alipay.android.living.dynamic:id/text").depth(23)
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0);
    if(comment[0]){
        return comment[0].text();
    } else {
        return null;
    }
}

//收藏量
function getVideoCollect(){
    let collect = id("com.alipay.android.living.dynamic:id/collect_text")
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0);
    if(collect[0]){
        return collect[0].text();
    } else {
        return null;
    }
}

// 获取直播作者（排除负坐标控件）
function getLiveAuthor() {
    let author = className("android.widget.TextView")
        .depth(24)
        .id("com.alipay.android.living.dynamic:id/author_title")
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0); 

    if (author[0]) {
        console.log("作者:", author[0].text());
        return author[0].text();
    } else {
        console.log("未找到作者控件");
        return null;
    }
}

// 获取直播描述
function getLiveDesc() {
    let desc = className("android.widget.TextView")
        .depth(24)
        .clickable(true)
        .find()
        .filter(c => (c.bounds().right - c.bounds().left) > 0);

    if (desc[0]) {
        console.log("Description:", desc[0].text());
        return desc[0].text();
    } else {
        console.log("No description elements found");
        return null;
    }
}

function collectInfo() {
    //收集数量
    let collectVideoNum = 2;
    let collectLiveNum = 2;
    
    //开始收集
    while (collectVideoNum > 0 || collectLiveNum > 0) {
        if (checkLivePreview()) {
            collectLiveInfo();
            collectLiveNum--;
            toast("收集到直播信息");
            takeScreenshot();
            autoSwipe();
            sleep(2000); // 等待滑动完成
        } else {
            collectVideoInfo();
            collectVideoNum--;
            toast("收集到视频信息");
            takeScreenshot();
            autoSwipe();
            sleep(2000); // 等待滑动完成
        }

        // 无论是否找到直播，都执行一次滑动
        if (collectVideoNum > 0 || collectLiveNum > 0) {
            autoSwipe();
            sleep(2000);
        }
    }
}

// 测试直播&视频识别
function testDetection() {
    let count = 0;
    let maxTests = 30; // 测试次数
    
    while (count < maxTests) {
        console.log("--------------------------------");
        console.log("第" + (count + 1) + "次测试");

        // 检测是否在直播预览界面
        if (checkLivePreview()) {
            console.log("识别到直播，收集直播信息");
            takeScreenshot();
            collectLiveInfo();
            watchVideo();
            sleep(1000);
        } else if (isInLiveRoom()) {
            console.log("检测到进入直播间，执行退出操作");
            autoOutLive(); // 退出直播间
            sleep(1000);   // 等待退出完成
        }else if (hasGuideMask()) {
            console.log("检测到引导遮罩，执行两次滑动退出");
            autoOutLive();
            autoOutLive();
            sleep(1000);
        }else {
            console.log("识别到视频，收集视频信息");
            takeScreenshot();
            collectVideoInfo();
            watchVideo();
            toast("收集到视频信息");
        }
        
        //模拟滑动
        autoSwipe();
        count++;
    }
    console.log("测试完成，共测试" + count + "次");
}

// 打印当前页面控件信息
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

    let author = className("android.widget.TextView")
        .depth(24)
        .id("com.alipay.android.living.dynamic:id/author_title")
        .find()
        .filter(c => c.bounds().left > 0)[0]; 

    if (author) {
        console.log("作者:", author.text());
    } else {
        console.log("未找到作者控件");
    }


    let like = className("android.widget.TextView")
        .textMatches(/.*点赞.*/)
        .findOne(); 

    if (like && like.text) {
        console.log("点赞:", like.text());
    } else {
        console.log("未找到点赞控件");
    }

    let descs = className("android.widget.TextView")
        .depth(24)
        .find()
        .filter(c => c.bounds().left > 0 && c.text().length > 0);

    if (descs && descs.length > 0) {
        console.log("直播描述:", descs[2].text());
    } else {
        console.log("未找到直播描述");
    }
}


function isInLiveRoom() {
    // 检测是否进入直播间
    let liveRoomTag = className("android.widget.TextView").find();
    let tvToolBar = className("android.widget.TextView").id("com.alipay.android.phone.wallet.mylive:id/tv_toolbar_item_text").findOne(500);
    //console.log(liveRoomTag[0].id());
    //console.log(tvToolBar != null);
  
    let flag = false;
    if(liveRoomTag[0] && liveRoomTag[0].id() == "app" || tvToolBar != null){
      flag = true;
    }
    return flag; 
  }

function hasGuideMask() {
    // 检测是否弹出关注主播控件
    let mask = className("android.widget.TextView").depth(12).findOne(500);
    return mask && mask.id() == "followGuide-mask"; 
}



