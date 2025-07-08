function switchBtn(){
    let control = boundsInside(44,200,150,300).className("android.view.View").findOne(2000);
    if(control){
        let outBtn = control.parent();
        outBtn.click();
    }
}

function testBtn(){
    toastLog("开始测试");
    switchBtn();
    toastLog("测试结束");
    
}
