function printCurrentPageAllControls() {
    // 存储所有控件信息的数组
    let controlsData = [];

    let allControls;
    try {
        allControls = classNameMatches(/.*/).find();
    } catch (e) {
        console.error("find() 出错，已忽略:", e);
        allControls = [];
    }

    if (!allControls || allControls.length === 0) {
        console.error("未找到任何控件");
        return JSON.stringify({
            status: "no_controls",
            message: "未找到任何控件",
            controls_count: 0,
            controls: []
        });
    }

    console.log("当前页面控件总数:", allControls.length);

    for (let i = 0; i < allControls.length; i++) {
        let control = allControls[i];
        if (!control) {
            console.warn(`控件 ${i + 1}: 无效，跳过`);
            continue;
        }

        let controlData = { index: i + 1 };

        // 每个属性单独 try/catch，避免因一个 getter 出错而中断
        try { controlData.className = control.className(); }
        catch (e) { controlData.className = "解析失败"; }

        try { controlData.text = control.text() || "[空文本]"; }
        catch (e) { controlData.text = "解析失败"; }

        try { controlData.id = control.id() || "[无ID]"; }
        catch (e) { controlData.id = "解析失败"; }

        try { controlData.depth = control.depth(); }
        catch (e) { controlData.depth = -1; }

        try { controlData.bounds = control.bounds().toString(); }
        catch (e) { controlData.bounds = "解析失败"; }

        try { controlData.clickable = control.clickable(); }
        catch (e) { controlData.clickable = false; }

        controlsData.push(controlData);
    }

    // 构造完整的JSON数据
    return JSON.stringify({
        status: "success",
        message: "控件信息获取完成",
        controls_count: controlsData.length,
        timestamp: new Date().toISOString(),
        controls: controlsData
    });
}


let data = printCurrentPageAllControls();
if (data) {
    console.log("print_current_page_all_controls-20250904133040510", data, 0);
} else {
    console.log("print_current_page_all_controls-20250904133040510", "未找到任何控件", 0);
}
