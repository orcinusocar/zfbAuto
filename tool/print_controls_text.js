function printCurrentPageAllControls(limit, batchSize) {
    if (typeof limit === 'undefined') {
        limit = 500; // 降低默认限制
    }
    if (typeof batchSize === 'undefined') {
        batchSize = 100; // 分批处理大小
    }
    
    // 存储所有控件信息的数组
    let controlsData = [];
    let processedCount = 0;
    let filteredCount = 0;

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

    function truncate(str, maxLen) {
        if (typeof maxLen === 'undefined') {
            maxLen = 30; 
        }
        if (!str) return "";
        return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
    }

    function isValidControl(control) {
        if (!control) return false;
        
        let text = "";
        let desc = "";
        
        try { 
            text = control.text() || ""; 
        } catch (e) { 
            return false; 
        }
        
        try { 
            desc = control.desc() || ""; 
        } catch (e) { 
            desc = ""; 
        }

        if (!text || text.trim() === "" || text.length > 100) {
            return false;
        }
        
        if (/^[\d\s\-_\.]+$/.test(text)) {
            return false;
        }
        
        // 排除常见的无用文本
        const uselessTexts = ["", "null", "undefined", "[空文本]", "解析失败", "无ID"];
        if (uselessTexts.includes(text)) {
            return false;
        }
        
        return true;
    }

    // 分批处理控件
    let totalCount = Math.min(allControls.length, limit);
    
    for (let i = 0; i < totalCount; i++) {
        let control = allControls[i];
        processedCount++;
        
        if (!isValidControl(control)) {
            continue;
        }

        let controlData = {};
        
        try { 
            controlData.t = truncate(control.text(), 30); 
        } catch (e) { 
            continue; 
        }

        try{
            controlData.id = control.id();
        } catch (e) {
            continue;
        }

        try { 
            let desc = control.desc();
            if (desc && desc.trim() !== "" && desc !== controlData.t) {
                // controlData.d = truncate(desc, 20); 
                controlData.d = desc;
            }
        } catch (e) { 
            continue;
        }


        controlsData.push(controlData);
        filteredCount++;
        
        // 如果达到批次大小，可以在这里进行中间处理
        if (controlsData.length >= batchSize && controlsData.length % batchSize === 0) {
            console.log(`已处理 ${processedCount}/${totalCount} 个控件，筛选出 ${filteredCount} 个有效控件`);
        }
    }

    // // 进一步去重（基于文本内容）
    // let uniqueControls = [];
    // let seenTexts = new Set();
    
    // for (let control of controlsData) {
    //     if (!seenTexts.has(control.t)) {
    //         seenTexts.add(control.t);
    //         uniqueControls.push(control);
    //     }
    // }

    const result = {
        status: "success",
        message: `控件信息获取完成（处理 ${processedCount} 个，筛选出 ${controlsData.length} 个有效控件）`,
        summary: {
            total_processed: processedCount,
            filtered_controls: controlsData.length,
            duplicates_removed: controlsData.length - controlsData.length
        },
        controls: controlsData
    };

    return JSON.stringify(result);
}

// 高级筛选函数 - 支持自定义筛选条件
function printCurrentPageAllControlsAdvanced(limit, batchSize, customFilter) {
    if (typeof limit === 'undefined') {
        limit = 500;
    }
    if (typeof batchSize === 'undefined') {
        batchSize = 100;
    }
    
    let controlsData = [];
    let processedCount = 0;
    let filteredCount = 0;

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

    function truncate(str, maxLen) {
        if (typeof maxLen === 'undefined') {
            maxLen = 30;
        }
        if (!str) return "";
        return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
    }

    // 默认筛选条件
    function defaultFilter(control) {
        if (!control) return false;
        
        let text = "";
        try { 
            text = control.text() || ""; 
        } catch (e) { 
            return false; 
        }

        if (!text || text.trim() === "" || text.length > 100) {
            return false;
        }
        
        if (/^[\d\s\-_\.]+$/.test(text)) {
            return false;
        }
        
        const uselessTexts = ["", "null", "undefined", "[空文本]", "解析失败", "无ID"];
        if (uselessTexts.includes(text)) {
            return false;
        }
        
        return true;
    }

    // 使用自定义筛选或默认筛选
    const filterFunction = typeof customFilter === 'function' ? customFilter : defaultFilter;

    let totalCount = Math.min(allControls.length, limit);
    
    for (let i = 0; i < totalCount; i++) {
        let control = allControls[i];
        processedCount++;
        
        if (!filterFunction(control)) {
            continue;
        }

        let controlData = {};
        
        try { 
            controlData.t = truncate(control.text(), 30);
        } catch (e) { 
            continue;
        }

        try { 
            let desc = control.desc();
            if (desc && desc.trim() !== "" && desc !== controlData.t) {
                controlData.d = truncate(desc, 20);
            }
        } catch (e) { 
            // 忽略
        }

        try {
            let bounds = control.bounds();
            if (bounds) {
                controlData.b = `${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}`;
            }
        } catch (e) {
            // 忽略
        }

        controlsData.push(controlData);
        filteredCount++;
        
        if (controlsData.length >= batchSize && controlsData.length % batchSize === 0) {
            console.log(`已处理 ${processedCount}/${totalCount} 个控件，筛选出 ${filteredCount} 个有效控件`);
        }
    }

    // 去重
    let uniqueControls = [];
    let seenTexts = new Set();
    
    for (let control of controlsData) {
        if (!seenTexts.has(control.t)) {
            seenTexts.add(control.t);
            uniqueControls.push(control);
        }
    }

    const result = {
        status: "success",
        message: `控件信息获取完成（处理 ${processedCount} 个，筛选出 ${uniqueControls.length} 个有效控件）`,
        summary: {
            total_processed: processedCount,
            filtered_controls: uniqueControls.length,
            duplicates_removed: controlsData.length - uniqueControls.length
        },
        controls: uniqueControls
    };
    
    return JSON.stringify(result);
}

//test


let data = printCurrentPageAllControls(2000, 50); // 限制800个控件，每50个一批
if (data) {
    console.log("=== 控件信息收集结果 ===");
    console.log(data);
    console.log("=== 结果结束 ===");
} else {
    console.log("未找到任何控件");
}

// 2. 高级调用 - 自定义筛选条件（只获取包含特定关键词的控件）
/*
let customFilter = function(control) {
    if (!control) return false;
    
    let text = "";
    try { 
        text = control.text() || ""; 
    } catch (e) { 
        return false; 
    }
    
    // 只保留包含"登录"、"注册"、"按钮"等关键词的控件
    const keywords = ["登录", "注册", "按钮", "确定", "取消", "提交"];
    return keywords.some(keyword => text.includes(keyword));
};

let advancedData = printCurrentPageAllControlsAdvanced(500, 30, customFilter);
console.log("=== 高级筛选结果 ===");
console.log(advancedData);
*/

// 3. 严格筛选 - 只获取可见且可点击的控件
/*
let strictFilter = function(control) {
    if (!control) return false;
    
    let text = "";
    let desc = "";
    
    try { 
        text = control.text() || ""; 
    } catch (e) { 
        return false; 
    }
    
    try { 
        desc = control.desc() || ""; 
    } catch (e) { 
        desc = ""; 
    }
    
    // 必须有文本或描述
    if (!text && !desc) return false;
    
    // 文本长度在合理范围内
    if (text && (text.length < 2 || text.length > 50)) return false;
    
    // 排除纯数字
    if (text && /^[\d\s\-_\.]+$/.test(text)) return false;
    
    return true;
};

let strictData = printCurrentPageAllControlsAdvanced(300, 20, strictFilter);
console.log("=== 严格筛选结果 ===");
console.log(strictData);
*/
