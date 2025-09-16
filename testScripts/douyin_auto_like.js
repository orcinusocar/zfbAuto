// 抖音自动点赞脚本 - 基于Context7 AutoX.js文档

// 全局变量定义
let startTime = Date.now();
let resultData = {};
let errorLog = [];
let likeCount = 0;
let maxLikes = 50; // 最大点赞数量
let scrollCount = 0;
let maxScrolls = 20; // 最大滑动次数

// 日志函数
function logInfo(message) {
    console.log(`[INFO] ${new Date().toLocaleTimeString()}: ${message}`);
    toast(message);
}

function logError(message) {
    console.error(`[ERROR] ${new Date().toLocaleTimeString()}: ${message}`);
    errorLog.push(message);
    toast(`错误: ${message}`);
}

// 检查是否在抖音界面
function checkDouyinApp() {
    let currentApp = currentPackage();
    if (currentApp !== "com.ss.android.ugc.aweme") {
        logError("请先打开抖音应用");
        return false;
    }
    return true;
}

// 查找点赞按钮
function findLikeButton() {
    // 多种方式查找点赞按钮
    let likeButton = null;
    
    // 方式1: 通过文本查找
    likeButton = text("赞").findOne(1000);
    if (likeButton) {
        logInfo("通过文本找到点赞按钮");
        return likeButton;
    }
    
    // 方式2: 通过描述查找
    likeButton = desc("赞").findOne(1000);
    if (likeButton) {
        logInfo("通过描述找到点赞按钮");
        return likeButton;
    }
    
    // 方式3: 通过类名和可点击属性查找
    likeButton = className("android.widget.ImageView").clickable(true).findOne(1000);
    if (likeButton) {
        logInfo("通过类名找到可能的点赞按钮");
        return likeButton;
    }
    
    return null;
}

// 执行点赞操作
function performLike() {
    let likeButton = findLikeButton();
    if (!likeButton) {
        logError("未找到点赞按钮");
        return false;
    }
    
    try {
        // 检查按钮是否可点击
        if (!likeButton.clickable()) {
            logError("点赞按钮不可点击");
            return false;
        }
        
        // 执行点击
        likeButton.click();
        likeCount++;
        logInfo(`点赞成功! 已点赞 ${likeCount} 次`);
        
        // 添加随机延迟，模拟人类行为
        sleep(1000 + Math.random() * 2000);
        return true;
    } catch (error) {
        logError(`点赞失败: ${error.message}`);
        return false;
    }
}

// 向上滑动到下一个视频
function scrollToNextVideo() {
    try {
        // 获取屏幕尺寸
        let screenWidth = device.width;
        let screenHeight = device.height;
        
        // 从屏幕中央向上滑动
        let startX = screenWidth / 2;
        let startY = screenHeight * 0.7;
        let endY = screenHeight * 0.3;
        
        // 执行滑动
        swipe(startX, startY, startX, endY, 500);
        scrollCount++;
        logInfo(`滑动到下一个视频 (${scrollCount}/${maxScrolls})`);
        
        // 等待视频加载
        sleep(2000 + Math.random() * 1000);
        return true;
    } catch (error) {
        logError(`滑动失败: ${error.message}`);
        return false;
    }
}

// 检查是否已经点赞过
function isAlreadyLiked() {
    try {
        // 查找已点赞的标识（红色心形图标）
        let likedButton = findColorEquals(captureScreen(), "#ff0050");
        return likedButton !== null;
    } catch (error) {
        return false;
    }
}

// 主执行函数
function main() {
    try {
        logInfo("抖音自动点赞脚本启动");
        
        // 检查是否在抖音应用
        if (!checkDouyinApp()) {
            throw new Error("请先打开抖音应用");
        }
        
        // 请求截图权限
        if (!requestScreenCapture()) {
            throw new Error("无法获取截图权限");
        }
        
        logInfo("开始自动点赞，按音量下键停止");
        
        // 主循环
        while (likeCount < maxLikes && scrollCount < maxScrolls) {
            // 检查是否已经点赞
            if (!isAlreadyLiked()) {
                // 执行点赞
                if (performLike()) {
                    // 点赞成功后等待一下
                    sleep(1000);
                }
            } else {
                logInfo("该视频已点赞，跳过");
            }
            
            // 滑动到下一个视频
            if (!scrollToNextVideo()) {
                break;
            }
            
            // 随机暂停，避免被检测
            if (Math.random() < 0.3) {
                let pauseTime = 3000 + Math.random() * 5000;
                logInfo(`随机暂停 ${Math.round(pauseTime/1000)} 秒`);
                sleep(pauseTime);
            }
        }
        
        // 完成统计
        resultData = {
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                totalLikes: likeCount,
                totalScrolls: scrollCount,
                maxLikes: maxLikes,
                maxScrolls: maxScrolls
            },
            count: likeCount,
            duration: Date.now() - startTime,
            errors: errorLog
        };
        
        logInfo(`脚本完成! 共点赞 ${likeCount} 次，滑动 ${scrollCount} 次`);
        
    } catch (error) {
        resultData = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            data: {
                totalLikes: likeCount,
                totalScrolls: scrollCount
            },
            errors: errorLog
        };
        logError(`脚本执行失败: ${error.message}`);
    }
}

// 监听音量键停止脚本
events.observeKey();
events.on("key", function(keyCode, event) {
    if (keyCode === 25) { // 音量下键
        logInfo("检测到音量下键，停止脚本");
        resultData = {
            success: true,
            stopped: true,
            timestamp: new Date().toISOString(),
            data: {
                totalLikes: likeCount,
                totalScrolls: scrollCount
            },
            duration: Date.now() - startTime,
            errors: errorLog
        };
        exit();
    }
});

// 启动脚本
main();

// 输出最终结果
console.log("=== 脚本执行结果 ===");
console.log(JSON.stringify(resultData, null, 2));
