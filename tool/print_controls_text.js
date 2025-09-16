function printCurrentPageAllControls(limit) {
    if (typeof limit === 'undefined') {
        limit = 300; 
    }
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
        return JSON.stringify({
            status: "no_controls",
            message: "未找到任何控件",
            controls_count: 0,
            controls: []
        });
    }

    console.log("当前页面控件总数:", allControls.length);

    // 截断函数，避免 text 太长
    function truncate(str, maxLen) {
        if (typeof maxLen === 'undefined') {
            maxLen = 50;
        }
        if (!str) return "[空文本]";
        return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
    }

    let count = Math.min(allControls.length, limit);

    for (let i = 0; i < count; i++) {
        let control = allControls[i];
        if (!control) continue;

        // 获取控件文本，用于过滤空文本控件
        let controlText;
        try { 
            controlText = control.text(); 
        } catch (e) { 
            controlText = ""; 
        }

        // 排除空文本的控件
        if (!controlText || controlText.trim() === "" || controlText === "[空文本]") {
            continue;
        }

        let controlData = { index: i + 1 };

        try { controlData.className = control.className(); }
        catch (e) { controlData.className = "解析失败"; }

        try { controlData.text = truncate(controlText); }
        catch (e) { controlData.text = "解析失败"; }

        try { controlData.id = control.id() || "[无ID]"; }
        catch (e) { controlData.id = "解析失败"; }

        try { controlData.desc = control.desc(); }
        catch (e) { controlData.desc = "解析失败"; }

        // try { controlData.bounds = control.bounds().toString(); }
        // catch (e) { controlData.bounds = "解析失败"; }

        controlsData.push(controlData);
    }

    const result = {
        status: "success",
        message: `控件信息获取完成（过滤空文本后收集到 ${controlsData.length} 个有效控件，原始控件总数 ${allControls.length} 个）`,
        summary: {
            total_controls: allControls.length,
            filtered_controls: controlsData.length,
            empty_text_filtered: allControls.length - controlsData.length
        },
        timestamp: new Date().toISOString(),
        controls: controlsData
    };
    
    // 返回格式化的JSON，便于阅读
    return JSON.stringify(result, null, 2);
}

//test


// 调用 
let data = printCurrentPageAllControls(1000);
if (data) {
    console.log("=== 控件信息收集结果 ===");
    console.log(data);
    console.log("=== 结果结束 ===");
} else {
    console.log("未找到任何控件");
}
