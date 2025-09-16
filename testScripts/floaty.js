if (!floaty.checkPermission()) {
    // 没有悬浮窗权限，提示用户并跳转请求
    toast(
      "本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本。"
    );
    floaty.requestPermission();
    exit();
  } else {
    toastLog("已有悬浮窗权限");
  }
// 创建悬浮窗来绘制检测框
log('创建悬浮窗');

var w = floaty.window(
<frame gravity="center" bg="#00000000">
    <canvas id="canvas" w="*" h="*"/>
</frame>
);

if (!w) {
log('悬浮窗创建失败！');
}

log('悬浮窗创建成功');

// 设置悬浮窗为全屏
log('设置悬浮窗大小和位置...');
w.setSize(device.width, device.height);
w.setPosition(0, 0);
log('悬浮窗大小: ' + device.width + 'x' + device.height);

// 获取canvas上下文
let canvas = w.canvas;
if (!canvas) {
log('Canvas获取失败！');
}
log('Canvas获取成功');

let paint = new Paint();
if (!paint) {
log('Paint创建失败！');
}
log('Paint创建成功');

// 设置画笔样式
paint.setStyle(Paint.Style.STROKE);
paint.setStrokeWidth(3);
paint.setAntiAlias(true);
log('画笔样式设置完成');

// 设置画笔颜色为红色
paint.setColor(colors.parseColor("#FF0000"));
log('画笔颜色设置为红色');


canvas.drawRect(0, 0, 100,100, paint);

log('悬浮窗绘制完成，按返回键退出');