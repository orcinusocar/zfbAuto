

function getParent(control){
    return control.parent();
}

function getChildren(control){
    let Controls = control.children();

    // 遍历打印子控件信息
    for (let i = 0; i < Controls.length; i++) {
        console.log(`子控件 ${i + 1}:\n`, Controls[i]);
        console.log("文本:", Controls[i].text() || "[空]");
        console.log("类名:", Controls[i].className());
    }

}


// let controls = className("android.view.View").depth(18).find();
// for (let i = 0; i < controls.length; i++) {
//     let control = controls[i];
//     let parent = getParent(control);
//     console.log("第",i,"个父控件:",parent);
//     getChildren(parent);
// }

let controls = boundsInside(44,900,866,1100).find();

for (let i = 0; i < controls.length; i++) {
    let control = controls[i];
    let text = control.text();
    if (text && text.trim() !== "") {
        console.log("文本不为空的控件:", text);
    }
}

// console.log(control);

// let control = textContains("2025.08.16").findOne(2000);
// let parent = getParent(control);
// getChildren(parent);

// let control = className("android.view.View").findOne(2000);
// let controls = text("2025华语辩论世界杯总决赛").find();


// parent.click();
// let control2 = bounds(365,258,1036,390).findOne(2000);
// console.log(control2);
// 获取父控件的所有子控件
// let children = parent.children();
// let price = null;
// for (let i = 0; i < children.length; i++) {
//     let child = children[i];
//     let text = child.text() || "";
//     if (text.includes("-")) {
//         price = text;
//         break; 
//     }
// }

// if (price) {
//     console.log("找到价格文本:", price);
// } else {
//     console.log("未找到包含 '-' 的价格文本");
// }
// let child = getChildren(children[0]);

// preparent = getParent(parent);
// console.log(preparent);
// prechild = getChildren(preparent);
// child = getChildren(prechild);


