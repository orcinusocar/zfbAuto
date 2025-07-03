/* 请使用云控_v19222及以上版本  >=安卓9系统*/
/*YOLOv8官方仓库地址 https://github.com/ultralytics/ultralytics */

var publicMethod = require(context.getFilesDir() + "/project/" + "publicMethod");
/* 初始化悬浮绘制 */
publicMethod.drawFloaty.init();


if (!requestScreenCapture()) {
    toast("请求截图失败");
    exit();
}
/* 官方模型的的类别 */
var labels = [
    "人",
    "自行车",
    "汽车",
    "摩托车",
    "飞机",
    "公共汽车",
    "火车",
    "卡车",
    "船",
    "交通灯",
    "消火栓",
    "停车标志",
    "停车计时器",
    "长凳",
    "鸟",
    "猫",
    "狗",
    "马",
    "绵羊",
    "牛",
    "大象",
    "熊",
    "斑马",
    "长颈鹿",
    "背包",
    "雨伞",
    "手提包",
    "领带",
    "手提箱",
    "飞盘",
    "滑雪板",
    "滑雪板",
    "运动球",
    "风筝",
    "棒球棒",
    "棒球手套",
    "滑板",
    "冲浪板",
    "网球拍",
    "瓶子",
    "酒杯",
    "杯子",
    "叉子",
    "刀",
    "勺子",
    "碗",
    "香蕉",
    "苹果",
    "三明治",
    "橙子",
    "西兰花",
    "胡萝卜",
    "热狗",
    "披萨",
    "甜甜圈",
    "蛋糕",
    "椅子",
    "沙发",
    "盆栽",
    "床",
    "餐桌",
    "马桶",
    "电视",
    "笔记本电脑",
    "鼠标",
    "遥控器",
    "键盘",
    "手机",
    "微波炉",
    "烤箱",
    "烤面包机",
    "水槽",
    "冰箱",
    "书",
    "时钟",
    "花瓶",
    "剪刀",
    "泰迪熊",
    "吹风机",
    "牙刷",
];
本地使用YOLOv8模型();

function 本地使用YOLOv8模型() {
    var YOLOv8Obj = publicMethod.YOLOv8();
    /* 初始化图像检测 */
    YOLOv8Obj.initDetect();
    /**
     * 清除模型，如果不再使用模型，可以调用此方法清除模型，接着用loadModel加载新模型
     * @return true:清除成功 false:清除失败
     */
    YOLOv8Obj.clearModel();
    /* 模型文件的路径 */
    var modelPath = "/sdcard/cloud/yolo/yolov8n"; //yolov8_hk_1
    /* 先判断模型文件是否存在 */
    if (!files.exists(modelPath + ".param") || !files.exists(modelPath + ".bin")) {
        toastLog("模型不存在，请检查配置文件：" + modelPath + ".param  权重文件：" + modelPath + ".bin");
        return false;
    }
    /***
     * 加载模型，全局只能同时有一个模型，如果需要加载新模型，需要先调用clearModel清除旧模型
     * @param assetManager AssetManager 对象
     * @param modelName 模型路径
     * @param classNumber 类别数量
     * @param cpugpu 0:CPU 1:GPU
     * @param targetSize 模型图像输入尺寸
     * @return true:加载成功 false:加载失败
     */
    //var ret = YOLOv8Obj.loadModel(context.getAssets(), modelPath, 2, 0, 640);
    var ret = YOLOv8Obj.loadModel(context.getAssets(), modelPath, 80, 0, 640); /* 官方模型下载地址 https://www.123pan.com/s/hoYwjv-EVavd.html   */
    console.log(ret);
    if (!ret) {
        console.log("模型加载失败");
        return false;
    }

    var probThreshold = 0.5; /* 预测值，返回大于该值的锚框，该值越大返回的锚框数量越少 */
    var nmsThresh = 0.9; /*  非极大值抑制，返回的锚框中重合面积不大于该值，该值越大返回的锚框重合率越高 */
    var number = 1;
    while (true) {
        number++;
        var t1 = new Date();
        /* 本地图片文件 */
        // var IMG = images.read("/sdcard/Pictures/01.png");
        /* 屏幕截图 */
        var IMG = captureScreen();
        var yourSelectedImage = IMG.getBitmap();
        /* 进行推理识别 */
        var result = YOLOv8Obj.detect(yourSelectedImage, probThreshold, nmsThresh);
        log(result)
        if (result) {
            log("预测:" + number + "次", "用时:" + (new Date() - t1), "找到:" + result.length);

            if (result.length > 0) {
                /* 绘制 */
                boxesDraw(result);
            }
        }
        /* 检测一次休息一秒 检测10此跳出循环结束脚本 */
        sleep(1000);
        if (number >= 10) {
            break;
        }
    }
}

/* 
 * 在屏幕上画出对应锚框
 * @param boxes 识别的信息
 * @param DisplayDuration 绘制的显示时间 可选

*/
function boxesDraw(boxes, DisplayDuration) {
    publicMethod.drawFloaty.t1 = publicMethod.drawFloaty.t1 || new Date() - 100;
    let toDraw = [];
    for (let i2 = 0; i2 < boxes.length; i2++) {
        let box = boxes[i2];
        /* 识别到的信息 */
        /*   
        log(box.x);
        log(box.y);
        log(box.w);
        log(box.h);
        log(box.conf);
        log(box.cls); 
        */
        let x1 = box.x;
        let y1 = box.y;
        let x2 = x1 + box.w;
        let y2 = y1 + box.h;
        let conf = box.conf;
        let cls = box.cls;
        toDraw.push({
            region: [x1, y1, x2, y2],
            color: "orange" /*绘制框的颜色： red  orange green */ ,
            text: labels[cls] + " " + sixNum(conf, 3),
        });
    }
    publicMethod.drawFloaty.t2 = new Date();
    var time = DisplayDuration || publicMethod.drawFloaty.t2 - publicMethod.drawFloaty.t1;

    toDraw.forEach((i) => {
        i.et = new Date().getTime() + time;
    });

    publicMethod.drawFloaty.draw(toDraw);
    publicMethod.drawFloaty.t1 = publicMethod.drawFloaty.t2;
}

function sixNum(num, retain) {
    var cont = Math.pow(10, retain);
    return parseInt(num * cont) / cont;
}
/* 销毁悬浮绘制实例 */
publicMethod.drawFloaty.destroy();
/* 结束脚本运行 */
exit();