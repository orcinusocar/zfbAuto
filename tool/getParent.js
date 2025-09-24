

function getParent(control){
    console.log('parent:',control.parent());
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



let control = descContains("空铁政策").findOne(2000);

let parent = control.parent();
let controls = parent.children();


// 匹配整个文本内容
// let control = textMatches(/^第[A-Z0-9]+航班$/).findOne(2000);

for(let i = 0; i < controls.length; i++){
    let c = controls[i];
    console.log('控件'+i+':'+'desc:'+c.desc()+' '+'text:'+c.text());
}

