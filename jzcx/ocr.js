var packageName = "com.jingzhichuxingsj.com"; 
// 打开App
launch(packageName);

// 等待App加载完成
waitForPackage(packageName);

requestScreenCapture(false);

let img = captureScreen();

let result = paddle.ocr(img)
toastLog(JSON.stringify(result));
clickBtn("下一步");


// 使用按钮中心点坐标 (left+right)/2, (top+bottom)/2
// click(540, 1084);

function clickBtn(btnText){
    // 找到匹配的文本
    for(let item of result){
        if(item.text === btnText){
            let bounds = item.bounds;
            // 计算按钮中心点坐标
            let x = Math.floor((bounds.left + bounds.right) / 2);
            let y = Math.floor((bounds.top + bounds.bottom) / 2);
            // 点击按钮
            click(x, y);
            sleep(1000);
            return true;
        }
    }
    toastLog("未找到文本：" + btnText);
    return false;
}