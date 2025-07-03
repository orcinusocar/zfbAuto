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

function isInLiveRoom() {
  // 检测是否进入直播间
  let liveRoomTag = className("android.widget.TextView").find();
  let tvToolBar = className("android.widget.TextView").id("com.alipay.android.phone.wallet.mylive:id/tv_toolbar_item_text").findOne(500);
  //console.log(liveRoomTag[0].id());
  //console.log(tvToolBar != null);

  let flag = false;
  if(liveRoomTag[0].id() == "app" || tvToolBar != null){
    flag = true;
  }
  return flag; 
}

console.log(isInLiveRoom());
