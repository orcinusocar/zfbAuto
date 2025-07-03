/* 请使用云控_v19222及以上版本 */

/* 
由于手机本地的YOLO安卓7系统无法使用，所有开发了一个服务端部署的框架， 你也可以部署到自己服务器 也支持自己训练的模型 随意可以切换模型 
接口免费使用 速度较慢 供大家学习使用 
查看所有模型http://47.94.105.29:2366/yolo/index


接口地址http://47.94.105.29:2366/yolo/recognition  
类型：POST
参数：
    "base64": 图片的base64编码  
    "model": 模型名称,  浏览器打开http://47.94.105.29:2366/yolo/index就可以看到所有模型名称  方便自由切换模型
    "draw": 是否返回绘制的图片,  测试可以是true,正式跑就false
    "conf": 置信度  一般0.5就可以
参数具体使用可以看下方实例
*/


var cloudMotion = require(context.getFilesDir() + "/project/" + "cloudMotion");
requestScreenCapture(); /*务必使用云控授权工具授权一次即可永久，另外不截图就不需要申请截图权限，手机截图权限同时只能给一个脚本使用，此处使用后其他投屏线程将不能正常进行，可通过切换截图权限解决 */

/* 滑块手柄坐标可以通过控件查找自动获取，由于不同app的滑块手柄的控件是不一样，所有我这里写成固定的 */
var 滑块手柄X = 180;
var 滑块手柄Y = 860;
测试屏幕截图滑动();
// 测试本地图片滑动();



function 测试屏幕截图滑动() {
    var 截图区域 = null; /*如果为null则代表全屏截图 可以通过查找控件 */
    /* 通过查找滑块背景图片的控件获取截图区域 调用控件的bounds()获取，你也可以自定义具体的截图区域格式为{"left":154,"top":861,"right":270,"bottom":979} */
    // var returned = textStartsWith("bgPic?captchaSn=").className("android.widget.Image").findOne(500);
    // if (returned) {
    //     截图区域 = returned.bounds()
    //     sleep(500);
    // } else {
    //     toastLog("未找到符合条件的控件");
    // }

    var 返回数据 = 预测屏幕截图(截图区域);
    log(返回数据);
    if (返回数据 && 返回数据.code === 200) {
        if (返回数据.data.base64) {
            var base64String = 返回数据.data.base64;
            /* 将 base64 转为图片，并保存到指定路径 */
            var savePath = "/sdcard/cloud/photo/滑块目标绘制.png";
            if (savePath) {
                var success = images.save(images.fromBase64(base64String), savePath, "png", 100);
                if (!success) {
                    console.log("保存图片失败");
                } else {
                    toastLog("绘制图片已保存: " + savePath);
                    /* app.viewFile(savePath); //打开图片*/
                }
            } else {
                console.error("未获取到保存路径");
            }
        }
        /* 识别的目标数据 */
        if (返回数据.data.list.length > 0) {
            if (返回数据.data.list.length === 2) {
                var A = 返回数据.data.list[0];
                var B = 返回数据.data.list[1];
                console.log(A);
                console.log(B);
                console.log(A.boxes_xyxy[0]);
                console.log(B.boxes_xyxy[0]);
                var 距离 = A.boxes_xyxy[0] - B.boxes_xyxy[0];
                距离 = Math.abs(距离); /* 如果是负值就转为正值 */
                console.log(距离);

                var returned = text("向右拖动滑块填充拼图").className("android.view.View").findOne(500);
                if (returned) {
                    滑块手柄X = returned.bounds().left + 35;
                    滑块手柄Y = returned.bounds().centerY() + random(-5, 5);
                    console.log("滑块手柄X:" + 滑块手柄X + "滑块手柄Y:" + 滑块手柄Y);
                    sleep(500);
                } else {
                    toastLog("未找到符合条件的控件");
                }

                var 目标坐标X = 滑块手柄X + 距离;
                console.log("目标坐标X" + 目标坐标X);
                /* 曲线滑动 */
                cloudMotion.slidingSlider(滑块手柄X, 滑块手柄Y, 目标坐标X, 滑块手柄Y, 1);
            } else {
                toastLog("只识别到了一个类型");
            }
        } else {
            toastLog("没有识别到");
        }
    }
}

function 预测屏幕截图(bounds) {
    bounds = bounds || null;
    var base64_img = null;
    if (bounds) {
        /*  设置截图区域的左上角和右下角坐标 */
        var left = bounds.left; /* 左边界的横坐标 */
        var top = bounds.top; /* 上边界的纵坐标 */
        var right = bounds.right; /* 右边界的横坐标 */
        var bottom = bounds.bottom; /* 下边界的纵坐标 */
        /*    根据上述坐标设置截图区域的宽度和高度 */
        var width = right - left;
        var height = bottom - top;
        /*  调用截图函数，指定保存路径和区域坐标和尺寸 */
        var imgScale = captureScreen();
        var clip = images.clip(imgScale, left, top, width, height);
        base64_img = images.toBase64(clip, "png", 100);
        imgScale.recycle();
        clip.recycle();
    } else {
        var imgScale = captureScreen();
        base64_img = images.toBase64(imgScale, "png", 100);
        imgScale.recycle();
    }

    var url = "http://47.94.105.29:2366/yolo/recognition";

    if (base64_img) {
        var json = {
            base64: base64_img,
            model: "yolov8_hk_1",
            image: "",
            draw: false,
            conf: 0.5,
        };
        var headers = {
            "User-Agent": "js",
            "Content-Type": "application/json",
        };
        /* 发送 POST 请求并传递 JSON 数据 */
        var postData = sendPostRequest(url, json, headers);
        if (postData) {
            return parseJSON(postData);
        } else {
            toastLog("未获取到响应数据");
        }
    } else {
        toastLog("要识别的图片不存在");
    }
    return null;
}

function 测试本地图片滑动() {
    var imgPath =
        "/sdcard/cloud/photo/滑块/0001.png"; /* 图片路径 由于很多时候 很难遇到滑块，为方便开发可以把滑块界面截图保存到手机上，然后开始直接写代码测试 */
    var 返回数据 = 预测本地图片(imgPath);
    log(返回数据);
    if (返回数据 && 返回数据.code === 200) {
        if (返回数据.data.base64) {
            var base64String = 返回数据.data.base64;
            /* 将 base64 转为图片，并保存到指定路径 */
            var savePath = modifyFileName(imgPath);
            if (savePath) {
                var success = images.save(images.fromBase64(base64String), savePath, "png", 100);
                if (!success) {
                    console.log("保存图片失败");
                } else {
                    toastLog("绘制图片已保存: " + savePath);
                    /* app.viewFile(savePath); //打开图片*/
                }
            } else {
                console.error("未获取到保存路径");
            }
        }
        /* 识别的目标数据 */
        if (返回数据.data.list.length > 0) {
            if (返回数据.data.list.length === 2) {
                var A = 返回数据.data.list[0];
                var B = 返回数据.data.list[1];
                console.log(A);
                console.log(B);
                console.log(A.boxes_xyxy[0]);
                console.log(B.boxes_xyxy[0]);
                var 距离 = A.boxes_xyxy[0] - B.boxes_xyxy[0];
                距离 = Math.abs(距离); /* 如果是负值就转为正值 */
                console.log(距离);
                console.log("滑块手柄X:" + 滑块手柄X + "滑块手柄Y:" + 滑块手柄Y);
                var 目标坐标X = 滑块手柄X + 距离;
                console.log("目标坐标X" + 目标坐标X);
                /* 曲线滑动 */
                cloudMotion.slidingSlider(滑块手柄X, 滑块手柄Y, 目标坐标X, 滑块手柄Y, 1);
            } else {
                toastLog("只识别到了一个类型");
            }
        } else {
            toastLog("没有识别到");
        }
    }
}

function 预测本地图片(imgPath) {
    var url = "http://47.94.105.29:2366/yolo/recognition";
    var base64_img = 本地图片转base64(imgPath);
    if (base64_img) {
        var json = {
            base64: base64_img,
            model: "yolov8_hk_1",
            draw: false,
            conf: 0.5,
        };
        var headers = {
            "User-Agent": "js",
            "Content-Type": "application/json",
        };
        /* 发送 POST 请求并传递 JSON 数据 */
        var postData = sendPostRequest(url, json, headers);
        if (postData) {
            return parseJSON(postData);
        } else {
            toastLog("未获取到响应数据");
        }
    } else {
        toastLog("要识别的图片不存在");
    }
    return null;
}
/* 封装的发送 POST 请求函数 */
function sendPostRequest(url, json, headers) {
    try {
        var res = http.postJson(url, json, {
            headers: headers,
        });
        var data = res.body.string();
        return data;
    } catch (e) {
        if (e instanceof java.net.SocketTimeoutException) {
            toastLog("请求超时");
        } else {
            toastLog("请求出错: " + e);
        }
        return null;
    }
}

/*  响应内容转json对象或数组函数 */
function parseJSON(str) {
    /*  判断字符串是否为空或 null */
    if (str === null || str.trim() === "") {
        return null;
    }
    try {
        /* 尝试解析 JSON 字符串 */
        var json = JSON.parse(str);
        return json;
    } catch (e) {
        /*    解析失败，不是有效的 JSON 字符串 */
        return null;
    }
}

function 本地图片转base64(imgPath) {
    var bitmap = images.read(imgPath);
    if (bitmap) {
        var base64Str = images.toBase64(bitmap, (format = "png"), (quality = 100));
        bitmap.recycle();
        return base64Str;
    } else {
        console.error("文件不存在" + imgPath);
        return null;
    }
}

function modifyFileName(filePath) {
    var file = new java.io.File(filePath);
    if (!file.exists() || !file.isFile()) {
        console.log("不是有效的文件路径");
        return null;
    }

    var parentDir = file.getParent(); /* 获取文件夹路径 */
    var fileName = file.getName(); /* 获取文件名 */
    var dotIndex = fileName.lastIndexOf(".");
    var newName;
    if (dotIndex >= 0) {
        newName = fileName.substring(0, dotIndex) + "_draw" + fileName.substring(dotIndex); /* 拼接文件名 */
    } else {
        newName = fileName + "_draw"; /*  当文件没有后缀时，直接在文件名后面加上"_draw" */
    }
    var newPath = parentDir + "/" + newName; /* 新的文件路径 */
    return newPath;
};