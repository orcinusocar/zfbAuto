requestScreenCapture(false);
 sleep(2000);
 var x = 781;
 var y = 100;
 //获取在点(x, y)处的颜色
 var c = images.pixel(captureScreen(), x, y);
 //显示该颜色
 var msg = "";
 msg += "在位置(" + x + ", " + y + ")处的颜色为" + colors.toString(c);
 msg += "\nR = " + colors.red(c) + ", G = " + colors.green(c) + ", B = " + colors.blue(c);
 console.log(msg)
 //#ff2d6ac9