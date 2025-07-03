// events.observeToast();
// events.onToast(function (toast) {
//   log("Toast内容: " + toast.getText() + " 包名: " + toast.getPackageName());
// });

// // 自动停止脚本
// setTimeout(function () {
//   log("脚本已运行1分钟，自动退出。");
//   engines.stopAll();
// }, 1 * 60 * 1000);

// let mask = depth(12).id("followGuide-mask").findOne();
// let mask = className("android.widget.TextView").depth(12).findOne();
// console.log(mask.id());
// // console.log("控件属性:", JSON.stringify(mask, null, 2)); // 查看是否有异常属性

// // let mask2 = className("android.widget.TextView").depth(12).id("followGuide-mask").findOne();
// // console.log(mask2.id());

// let mask3 = className("android.widget.TextView").depth(12).id("com.eg.android.AlipayGphone:id/followGuide-mask").findOne();
// console.log(mask3.id());
// if(mask != null){
//     console.log("识别到引导遮罩");
// }else{
//     console.log("未识别到引导遮罩");
// }

// let desc = className("android.widget.TextView")
//         .depth(24)
//         .clickable(true)
//         .find()
//         .filter(c => (c.bounds().right - c.bounds().left) > 0);

// if (desc.length > 0) {
//     console.log("Description:", desc[0].text());
// } else {
//     console.log("No description elements found");
// }

// function isInLiveRoom() {
//   // 检测是否进入直播间
//   let liveRoomTag = className("android.widget.TextView").id("app").findOne(1000);
//   return !!liveRoomTag; 
// }

// function isInLiveRoom() {
//   // 检测是否进入直播间
//   let liveRoomTag = className("android.widget.TextView").find();
//   let tvToolBar = className("android.widget.TextView").id("com.alipay.android.phone.wallet.mylive:id/tv_toolbar_item_text").findOne(500);
//   //console.log(liveRoomTag[0].id());
//   //console.log(tvToolBar != null);

//   let flag = false;
//   if(liveRoomTag[0].id() == "app" || tvToolBar != null){
//     flag = true;
//   }
//   return flag; 
// }

// console.log(isInLiveRoom());


let packageName = "com.eg.android.AlipayGphone";
launch(packageName);
waitForPackage(packageName);

// 点击底部导航栏的"视频"标签
// let videoTab = id("com.alipay.android.tablauncher:id/tab_description").text("视频").findOne(500);
// if (videoTab) {
//     let parent = videoTab.parent();
//     if(parent != null){
//       parent.click();
//       log("已点击",parent);
//     }

//     console.log("已点击");
// } else {
//     toast("未找到视频入口");
// }

function isInVideo(){
  let video = id("com.alipay.android.living.dynamic:id/author_title").findOne(500);
  return video != null; 
}

console.log(isInVideo());

function intoVideo() {
  // 1. 定位视频标签控件
  let videoTab = id("com.alipay.android.tablauncher:id/tab_description")
      .text("视频")
      .findOne(5000); // 增加等待时间

  if (!videoTab) {
      toast("未找到视频入口");
      return false;
  }

  // 2. 尝试点击父控件（提高兼容性）
  let parent = videoTab.parent();
  if (parent) {
      parent.click();
      console.log("已点击视频入口");
      sleep(2000); // 等待界面跳转
  } else {
      videoTab.click();
      console.log("直接点击视频标签");
      sleep(2000);
  }

  // 3. 验证是否成功进入视频界面
  let isSuccess = id("com.alipay.android.living.dynamic:id/video_view").findOne(3000) 
                 || textMatches(/.*点赞.*/).findOne(3000);
  
  if (isSuccess) {
      console.log("成功进入视频界面");
      return true;
  } else {
      toast("跳转视频界面失败");
      return false;
  }
}

intoVideo();