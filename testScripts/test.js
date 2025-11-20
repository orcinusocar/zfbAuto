// if(isMask()){
//     autoOut();
// }

function isMask(){
    let control = className("android.widget.EditText").findOne(2000);
    if(!control){
        toastLog("没有找到控件");
        return false;
    }else{
        toastLog("找到控件");
        console.log("control:",control);
        return true;
    }

}


function autoOut(){
    // 滑动参数：从 (x1, y) 到 (x2, y)，持续 duration 毫秒
    let screenWidth = device.width;
    let screenHeight = device.height;
    let startX = 10;        
    let endX = screenWidth / 2; 
    let y = screenHeight / 2; 

    // 执行滑动（模拟手指滑动）
    gesture(500, [startX, y], [endX, y]);
}

isMask();