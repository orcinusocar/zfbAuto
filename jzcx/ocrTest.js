var packageName = "com.jingzhichuxingsj.com"; 
var maxRetry = 3; // 最大重试次数
var launchSuccess = false;

startApp()


let img = captureScreen();
console.log("截图分辨率:", img.width, "x", img.height);
console.log("屏幕分辨率:", device.width, "x", device.height);
// click(device.width/2,device.height/2)

let start = new Date()
let result = paddle.ocr(img)
toastLog('OCR识别耗时：' + (new Date() - start) + 'ms')
console.log(result)

// 输入手机号
findInput()
inputPhoneNumber("13800138000")

clickNext();

function startApp() {
    auto()
    home()
    if(currentPackage() != "com.miui.home"){
        home()
    }
    // 超时重试启动逻辑
    for (let i = 0; i < maxRetry; i++) {
        launch(packageName);
        waitForPackage(packageName);
        toastLog("尝试启动应用，第 " + (i + 1) + " 次");
        
        // 超时检测
        let waitStart = Date.now();
        while (Date.now() - waitStart < 3000) { 
            if (currentPackage() === packageName || currentPackage() === "com.sohu.inputmethod.sogou.xiaomi") {
                launchSuccess = true;
                break;
            }
            console.log(currentPackage())
            sleep(1000);
        }
        
        if (launchSuccess) break;
    }

    if (!launchSuccess) {
        toastLog("启动应用失败，请手动检查");
        exit();
    }

    // 进入应用
    requestScreenCapture(false);
    toastLog("应用启动成功");

    // 等待视频App加载完成
    // waitForPackage(packageName);

}

function findInput() {
    let phoneDialog = result.find(3, e => e.text == "|请输入手机号码" || e.text == "|请输入于机号码" || e.text == "|请输人手机号码" || e.text == "|清输人手机号码" || e.text == "清输入手机号码");
    if (!phoneDialog) {
        toastLog("未找到手机号输入框或bounds无效");
    } else {
        toastLog("找到手机号输入框");
        click(527,814)
        sleep(1000);
    }
}

function clickNext() {
    // 每次检测前重新截图
    let freshImg = captureScreen();
    let targetColor = images.pixel(freshImg, 339, 1094);
    toastLog("目标坐标颜色值: " + colors.toString(targetColor));

    if (images.detectsColor(freshImg, "#ff2d6ac9", 339, 1094)) {
        toastLog("颜色匹配，点击下一步");
        click(339, 1094);
    } else {
        toastLog("未输入手机号，请输入手机号");
    }

}

//输入号码后点击下一步
// function clickCenterRandom(bounds) {
//     let centerX = Math.floor((bounds.left + bounds.right) / 2);
//     let centerY = Math.floor((bounds.top + bounds.bottom) / 2);

//     let offsetRangeX = Math.floor((bounds.right - bounds.left) * 0.3);
//     let offsetRangeY = Math.floor((bounds.bottom - bounds.top) * 0.3);

//     let offsetX = Math.floor(Math.random() * (offsetRangeX * 2 + 1)) - offsetRangeX;
//     let offsetY = Math.floor(Math.random() * (offsetRangeY * 2 + 1)) - offsetRangeY;

//     let randomX = Math.max(bounds.left, Math.min(bounds.right - 1, centerX + offsetX));
//     let randomY = Math.max(bounds.top, Math.min(bounds.bottom - 1, centerY + offsetY));

//     toastLog("点击中心点: (" + centerX + ", " + centerY + ")");
//     toastLog("随机偏移: (" + offsetX + ", " + offsetY + ")");
//     toastLog("最终点击位置: (" + randomX + ", " + randomY + ")");
    
//     click(randomX, randomY); 
// }

function inputPhoneNumber(phoneNumber) {

        // 检测前台应用是否为输入法
        console.log(currentPackage())
        let startTime = Date.now();
        let success = false;
        while (Date.now() - startTime < 3000) { // 3秒超时检测
            if (currentPackage() === "com.sohu.inputmethod.sogou.xiaomi") {
                success = true;
                break;
            }
            sleep(2000);
        }

        if (success) {
            toastLog("点击成功，输入法已弹出");
            // 输入手机号
            setText(phoneNumber);
            toastLog("输入手机号：" + phoneNumber);
        } else {
            toastLog("点击失败，输入法未弹出");
        }
    }








