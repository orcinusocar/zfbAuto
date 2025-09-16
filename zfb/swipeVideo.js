
// 导入 AutoJS 的相关模块
var packageName = "com.smile.gifmaker"; // 视频App的包名

// 设置刷视频次数限制
var maxSwipeCount = 10; // 可以根据需要调整次数
var currentSwipeCount = 0;

// 打开视频App
launch(packageName);

// 等待视频App加载完成
waitForPackage(packageName);

// 自动刷视频
autoSwipe();

// 自动刷视频函数
function autoSwipe() {
  while (currentSwipeCount < maxSwipeCount) {
    // 模拟向下滑动操作
    swipe(
      device.width / 2,
      device.height * 0.8,
      device.width / 2,
      device.height * 0.2,
      1000
    );

    // 增加计数器
    currentSwipeCount++;
    
    // 显示当前进度
    console.log("已刷视频 " + currentSwipeCount + "/" + maxSwipeCount + " 次");

    // 等待一段时间，模拟观看视频
    sleep(5000); // 可以根据实际情况调整等待时间
  }
  
  // 达到限制后停止
  console.log("已达到刷视频次数限制，程序结束");
  exit();
}


