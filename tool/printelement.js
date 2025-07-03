function printCurrentPageControls() {
    // 获取当前所有可见控件
    let controls = className("android.widget.TextView").find();
    console.log("当前页面控件数量:", controls.length);

    // 遍历并打印控件信息
    for (let i = 0; i < controls.length; i++) {
        let control = controls[i];
        console.log("--- 控件 " + (i + 1) + " ---");
        console.log("类名:", control.className());
        console.log("文本:", control.text());
        console.log("ID:", control.id());
        console.log("深度:", control.depth());
        console.log("坐标:", control.bounds());
        console.log("是否可点击:", control.clickable());
    }

    let liveRoomTag = className("android.widget.TextView").find();
    console.log(liveRoomTag[0].id());

    // let liveRoomTag2 = className("android.widget.TextView").id("app").findOne(2000);
    // console.log(!!liveRoomTag2);

    let flag = false;
    if(liveRoomTag[0].id() == "app"){
        flag = true;
    }
    console.log(flag);

}

function printCurrentPageAllControls(){

    // 遍历并打印控件信息
      // 1. 获取当前页面所有控件（包括容器控件）
      let allControls = classNameMatches(/.*/).find();
      if (!allControls || allControls.length === 0) {
          console.error("未找到任何控件");
          return;
      }
      console.log("当前页面控件总数:", allControls.length);
  
      // 2. 遍历并打印控件信息（带错误处理）
      for (let i = 0; i < allControls.length; i++) {
          let control = allControls[i];
          if (!control) {
              console.warn(`控件 ${i+1}: 无效，跳过`);
              continue;
          }
  
          try {
              console.log(`--- 控件 ${i+1} ---`);
              console.log("类名:", control.className());
              console.log("文本:", control.text() || "[空文本]");
              console.log("ID:", control.id() || "[无ID]");
              console.log("深度:", control.depth());
              console.log("坐标:", control.bounds().toString());
              console.log("可点击:", control.clickable());
          } catch (e) {
              console.error(`解析控件 ${i+1} 出错:`, e);
          }
      }
    
}

printCurrentPageAllControls();
// printCurrentPageControls();
// checkLivePreview();
// getVideoAuthor()

//uiautomator
// let allElements = selector().depth(10).find();
// console.log("Detected elements:", allElements.length);


// 检查当前页面是否包含 WebView
// let webViews = className("android.webkit.WebView").find();
// if (webViews.length > 0) {
//     console.log("检测到 WebView，数量:", webViews.length);
//     // 通过坐标点击等方式间接操作
//     click(webViews[0].bounds().centerX(), webViews[0].bounds().centerY());
// } else {
//     console.log("未检测到 WebView");
// }