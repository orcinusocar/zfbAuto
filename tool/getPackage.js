

// let appName = "嘀嗒出行"; 
// let packageName = app.getPackageName(appName); 
// if(packageName){
//     console.log(appName + "的包名是：" + packageName);
// } else {
//     console.log("未找到" + appName + "的包名");
// }

let currentPackageName = currentPackage();
console.log("当前前台应用的包名是: " + currentPackageName);

let currentActivity = currentActivity();
console.log("当前 Activity:", currentActivity);
// let pname = getPackageName("鲸志出行");
// console.log(pname);