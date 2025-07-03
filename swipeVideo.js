
// 导入 AutoJS 的相关模块
var packageName = "com.smile.gifmaker"; // 视频App的包名

// 打开视频App
launch(packageName);

// 等待视频App加载完成
waitForPackage(packageName);

// 自动刷视频
autoSwipe();

// 自动刷视频函数
function autoSwipe() {
  while (true) {
    // 模拟向下滑动操作
    swipe(
      device.width / 2,
      device.height * 0.8,
      device.width / 2,
      device.height * 0.2,
      1000
    );

    // 等待一段时间，模拟观看视频
    sleep(5000); // 可以根据实际情况调整等待时间
  }
}


