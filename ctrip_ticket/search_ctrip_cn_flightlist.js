
let testLogUrl = "http://10.41.17.48:8020/ws/result";

function uploadLog(task_id, result, duration, testlogUrl) {
    const data = {
        task_id: task_id,
        result: result,
        duration: duration,
    };
    
    http.postJson(testlogUrl, data);
}

function searchCtripInfo(info) {
    click(305,785);
    click(310,750);
    sleep(1500);
    
    // 输入搜索文本
    input(info);
    sleep(1000);

    click(986,2116);
}

function ismainpage(){
    return text("搜索").exists();
}

/**
 * 从当前页面提取国内航班信息
 * @returns {Object} 航班列表
 */
function extractFlights() {
    let allControls = classNameMatches(/.*/).find();
    let flights = {};

    if (!allControls || allControls.length === 0) {
        return {
            status: "no_controls",
            message: "未找到航班控件",
            flights: []
        };
    }

    for (let c of allControls) {
        try {
            let desc = c.desc() || "";
            let text = c.text() || "";

            let match = desc.match(/第([A-Z0-9]+)航班/);
            if (!match) continue;

            let flightCode = match[1]; 
            if (!flights[flightCode]) {
                flights[flightCode] = {
                    flgno: flightCode,
                    airline: null,
                    departureTime: null,
                    arrivalTime: null,
                    nextDayInfo: null,
                    departureAirport: null,
                    arrivalAirport: null,
                    flightDuration: null,
                    transferCities: [],
                    price: null
                };
            }

            let flight = flights[flightCode];

            // 更新字段匹配逻辑
            if (desc.includes("出发时间")) flight.起飞时间 = text;
            if (desc.includes("到达时间")) flight.到达时间 = text;
            if (desc.includes("隔天信息")) flight.隔天信息 = text;
            if (desc.includes("出发机场")) flight.起飞机场 = text;
            if (desc.includes("到达机场")) flight.到达机场 = text;
            if (desc.includes("飞行时长")) flight.飞行时长 = text;
            if (desc.includes("价格")) flight.价格 = text;
            if (desc.includes("中转城市")) flight.中转城市.push(text);
            
        } catch (e) {
            // 忽略单个控件错误
        }
    }

    // 单独处理航司名称 - 对所有控件都检查
    for (let c of allControls) {
        try {
            let desc = c.desc() || "";
            let text = c.text() || "";
            
            if (text.includes("航空" ) || text.includes("国航")) {
                // 查找最近的航班序号
                let currentIndex = -1;
                for (let i = 0; i < allControls.length; i++) {
                    if (allControls[i] === c) {
                        currentIndex = i;
                        break;
                    }
                }
                
                if (currentIndex >= 0) {
                    // 向前查找最近的航班序号
                    for (let j = currentIndex; j >= 0; j--) {
                        let prevId = allControls[j].id() || "";
                        let prevMatch = prevId.match(/第([A-Z0-9]+)航班/);
                        if (prevMatch) {
                            let flightCode = prevMatch[1]; // 航班号
                            if (flights[flightCode]) {
                                flights[flightCode].航司名称 = text;
                            }
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            // 忽略单个控件错误
        }
    }
    console.log(JSON.stringify(flights, null, 2));
    console.log("航班数量:", Object.keys(flights).length);
    return {
        status: "success",
        message: "航班信息提取完成",
        total: Object.keys(flights).length,
        flights: Object.values(flights)
    };
}

function searchCtripInfoMain() {
    let startTime = Date.now();
    let searchInfo = "北京到上海的机票";
    let retryCount = 0;
    const maxRetries = 3;
    
    try {
        while(true) {
            if(ismainpage()){
                searchCtripInfo(searchInfo);
                sleep(3000);
                load();
                sleep(1000);
                let result = extractFlights();
                let endTime = Date.now();
                let totalDuration = endTime - startTime;
                
                uploadLog("search_ctrip_cn_ticket-20250911173437822", `携程搜索完成，搜索内容: ${searchInfo}，找到 ${result.flights.length} 条航班信息-${JSON.stringify(result.flights)}，总耗时: ${totalDuration}ms`, totalDuration, testLogUrl);
                console.log(JSON.stringify(result, null, 2));
                return result;
                
            }else if(isMask()){
                autoOut();
                sleep(2000); // 等待退出遮罩
                retryCount++; // 增加重试次数
                if(retryCount > maxRetries) {
                    let endTime = Date.now();
                    let totalDuration = endTime - startTime;
                    let errorResult = {
                        status: "error",
                        message: "超过最大重试次数，自动退出",
                        flights: []
                    };
                    uploadLog("search_ctrip_cn_ticket-20250911173437822", `携程搜索失败: 超过最大重试次数，总耗时: ${totalDuration}ms`, totalDuration, testLogUrl);
                    toastLog("超过最大重试次数，自动退出");
                    return errorResult;
                }
                continue; // 重新检查页面状态
                
            }else{
                toastLog("不是主页面或已知遮罩");
                retryCount++; // 增加重试次数
                if(retryCount > maxRetries) {
                    let endTime = Date.now();
                    let totalDuration = endTime - startTime;
                    let errorResult = {
                        status: "error",
                        message: "超过最大重试次数，自动退出",
                        flights: []
                    };
                    uploadLog("search_ctrip_cn_ticket-20250911173437822", `携程搜索失败: 超过最大重试次数，总耗时: ${totalDuration}ms`, totalDuration, testLogUrl);
                    toastLog("超过最大重试次数，自动退出");
                    return errorResult;
                }
                sleep(2000); // 等待2秒后重新检查
                continue; // 重新检查页面状态
            }
        }
    } catch (e) {
        let endTime = Date.now();
        let totalDuration = endTime - startTime;
        let errorResult = {
            status: "error",
            message: `搜索过程中发生错误: ${e.message}`,
            flights: []
        };
        uploadLog("search_ctrip_cn_ticket-20250911173437822", `携程搜索失败: ${e.message}，总耗时: ${totalDuration}ms`, totalDuration, testLogUrl);
        console.error("搜索失败:", e);
        return errorResult;
    }
}

function isMask(){
    let control = id("ctrip.android.view:id/a").findOne(1000);
    if(!control){
        toastLog("没有找到控件");
        return false;
    }else{
        toastLog("找到控件");
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



function load(){
    let control = className("android.widget.ImageView").desc("list_section_title_img").findOne(1000);
    while(!control){
        swipe(
            device.width / 2,
            device.height * 0.8,
            device.width / 2,
            device.height * 0.2,
            200
        );
        control = className("android.widget.ImageView").desc("list_section_title_img").findOne(1000);
    }
    console.log("find");
    return true;
}
  
// searchCtripInfoMain();

// 测试
load();
extractFlights();
