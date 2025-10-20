// 通用超时时间
const timeout = 1000

var guidePage = descContains("行程动态").findOne(timeout * 5) 
if(guidePage != null) {
    console.log("存在行程动态")
} else {
    console.log("不存在行程动态")
}