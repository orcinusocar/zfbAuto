let controls = className("android.widget.ImageView").desc("list_section_title_img").find();

if(controls.length > 0){
    console.log("找到", controls.length, "个匹配的控件");
    for (let i = 0; i < controls.length; i++) {
        let control = controls[i];
        console.log(control.text());
    }
    }else{
        console.log("未找到匹配的控件");
}