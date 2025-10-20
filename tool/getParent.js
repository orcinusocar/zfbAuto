

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



// 将初始匹配控件改为航班价格
// let control = descEndsWith("出发时间").findOne(2000);
// let control = descEndsWith("航班价格").findOne(2000);
// let control = descMatches(/^\d+出发日期$/).findOne(2000);
let control = textContains("应急援助").findOne(2000);
// let control = desc("中转TrainAndBus筛选条件快筛列表").findOne(2000);

console.log("control",control);
let parent = control.parent();
console.log("parent:",parent);

let grandparent = parent.parent();
let greategrandparent = grandparent.parent();
let greatergrandparent = greategrandparent.parent();

let children = control.children();
console.log("children:",children);


let controls = parent.children();        
let controls2 = grandparent.children();  
let contorls3 = greategrandparent.children(); 
let controls4 = greatergrandparent.children();

console.log('---controls---')
for(let i = 0; i < controls.length; i++){
    let c = controls[i];
    console.log('控件'+i+':'+'desc:'+c.desc()+' '+'text:'+c.text());
}

console.log('---controls2---')
for(let i = 0; i < controls2.length; i++){
    let c = controls2[i];
    console.log('控件'+i+':'+'desc:'+c.desc()+' '+'text:'+c.text());
}

console.log('---controls3---')
for(let i = 0; i < contorls3.length; i++){
    let c = contorls3[i];
    console.log('控件'+i+':'+'desc:'+c.desc()+' '+'text:'+c.text());
}
console.log('---controls4---')
for(let i = 0; i < controls4.length; i++){
    let c = controls4[i];
    console.log('控件'+i+':'+'desc:'+c.desc()+' '+'text:'+c.text());
}
