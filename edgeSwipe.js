// 滑动参数：从 (x1, y) 到 (x2, y)，持续 duration 毫秒
let screenWidth = device.width;
let screenHeight = device.height;
let startX = 10;          // 左边缘起始点（避免太靠边）
let endX = screenWidth / 2; // 滑动到屏幕中部
let y = screenHeight / 2;  // 垂直居中

// 执行滑动（模拟手指滑动）
gesture(500, [startX, y], [endX, y]);