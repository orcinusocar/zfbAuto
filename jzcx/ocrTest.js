
if (!requestScreenCapture()) {
    toastLog('请求截图权限失败')
    exit()
  }else{
    toastLog('请求截图权限成功')
  }
  
let img = captureScreen();
console.log("截图分辨率:", img.width, "x", img.height);
console.log("屏幕分辨率:", device.width, "x", device.height);

let result = paddle.ocr(img);


console.log("OCR识别结果:", result);
