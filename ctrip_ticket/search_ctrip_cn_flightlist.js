
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
 * 统一获取所有控件信息
 * @returns {Object} 控件信息对象
 */
function getAllControlsInfo() {
    let allControls = classNameMatches(/.*/).find();
    
    if (!allControls || allControls.length === 0) {
        return {
            controls: [],
            hasControls: false,
            message: "未找到任何控件"
        };
    }

    // 预处理控件信息，避免重复解析
    let controlsInfo = allControls.map((c, index) => {
        try {
            return {
                index: index,
                control: c,
                desc: c.desc() || "",
                text: c.text() || "",
                id: c.id() || "",
                bounds: c.bounds()
            };
        } catch (e) {
            return {
                index: index,
                control: c,
                desc: "",
                text: "",
                id: "",
                bounds: null,
                error: e.message
            };
        }
    });

    return {
        controls: controlsInfo,
        hasControls: true,
        total: controlsInfo.length,
        message: `成功获取 ${controlsInfo.length} 个控件`
    };
}

/**
 * 从当前页面提取国内航班信息
 * @returns {Object} 航班列表
 */
function extractFlights() {
    let controlsInfo = getAllControlsInfo();
    
    if (!controlsInfo.hasControls) {
        return {
            status: "no_controls",
            message: controlsInfo.message,
            flights: []
        };
    }

    let allControls = controlsInfo.controls;
    let flights = {};

    for (let c of allControls) {
        try {
            let desc = c.desc;
            let text = c.text;

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
            let desc = c.desc;
            let text = c.text;
            
            if (text.includes("航空" ) || text.includes("国航")) {
                // 查找最近的航班序号
                let currentIndex = c.index;
                
                if (currentIndex >= 0) {
                    // 向前查找最近的航班序号
                    for (let j = currentIndex; j >= 0; j--) {
                        let prevId = allControls[j].id;
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
  
/**
 * 提取火车方案信息 - 基于子控件信息提取
 * @returns {Object} 火车方案列表
 */
function extractTrainOptions() {
    let trainDetails = [];
    let trainMap = new Map(); // 用于存储每个索引的最新记录
    
    try {
        let departureTimeControls = descContains("出发时间").find();
        
        for (let i = 0; i < departureTimeControls.length; i++) {
            let departureControl = departureTimeControls[i];
            let desc = departureControl.desc();
            let text = departureControl.text();
            
            // 匹配出发时间控件描述，提取索引
            let trainMatch = desc.match(/(\d+)出发时间/);
            if (!trainMatch) {
                continue;
            }
            
            let index = parseInt(trainMatch[1]);
            
    
            
            // 获取父控件
            let parentControl = departureControl.parent();
            if (!parentControl) {
                continue;
            }
            
            // 从父控件的子控件中提取信息
            let children = parentControl.children();
            
             let trainInfo = {
                 index: index,
                 departureTime: text && text.trim() ? text : null,
                 departureStation: null,
                 arrivalTime: null,
                 arrivalStation: null,
                 trainNumber: null,
                 duration: null,
                 price: null,
                 discount: null,
                 seatTypes: []
             };
            
            // 遍历子控件提取信息
            for (let j = 0; j < children.length; j++) {
                let child = children[j];
                let childDesc = child.desc();
                let childText = child.text();
                
                 try {
                     if (childDesc === `${index}出发站点` && childText && childText.trim()) {
                         trainInfo.departureStation = childText;
                     } else if (childDesc === `${index}中转时长` && childText && childText.trim()) {
                         trainInfo.duration = childText;
                     } else if (childDesc === `${index}中转城市` && childText && childText.trim()) {
                         trainInfo.trainNumber = childText;
                     } else if (childDesc === "undefined到达时间" && childText && childText.trim()) {
                         trainInfo.arrivalTime = childText;
                     } else if (childDesc === "undefined到达站点" && childText && childText.trim()) {
                         trainInfo.arrivalStation = childText;
                     } else if (childDesc === "undefined价格" && childText && childText.trim()) {
                         trainInfo.price = childText;
                     } else if (childDesc === "undefined折扣" && childText && childText.trim()) {
                         trainInfo.discount = childText;
                     } else if (childDesc === null && childText && childText.trim()) {
                        // 座位类型信息（desc为null的控件）
                        if (childText.includes("硬座") || childText.includes("硬卧") || 
                            childText.includes("软卧") || childText.includes("无座") || 
                            childText.includes("二等") || childText.includes("一等") || 
                            childText.includes("商务")) {
                            
                            // 座位类型名称（去掉状态信息）
                            let seatType = childText.replace(/\s*有票|\s*\d+张|\s*抢|\s*\(换座\)/g, "").trim();
                            
                            // 查找下一个子控件作为状态信息
                            let status = "有票"; // 默认状态
                            if (j + 1 < children.length) {
                                let nextChild = children[j + 1];
                                let nextChildText = nextChild.text();
                                let nextChildDesc = nextChild.desc();
                                
                                // 如果下一个子控件也是desc为null且包含状态信息
                                if (nextChildDesc === null && nextChildText && nextChildText.trim()) {
                                    if (nextChildText.includes("有票") || nextChildText.includes("张") || 
                                        nextChildText.includes("抢") || nextChildText.includes("换座")) {
                                        status = nextChildText.trim();
                                        // 跳过下一个子控件，避免重复处理
                                        j++;
                                    }
                                }
                            }
                            
                            // 检查是否已经添加过这个座位类型
                            let existingSeat = trainInfo.seatTypes.find(s => s.type === seatType);
                            if (!existingSeat && seatType) {
                                trainInfo.seatTypes.push({
                                    type: seatType,
                                    status: status
                                });
                            }
                        }
                    }
                } catch (e) {
                    // 忽略单个子控件错误
                }
            }
            
            // 直接覆盖同索引的记录（保留最后一个，即第二个）
            trainMap.set(index, trainInfo);
        }
        
        // 将Map中的值转换为数组
        trainDetails = Array.from(trainMap.values());
        
        // 按索引排序
        trainDetails.sort((a, b) => a.index - b.index);
        
    } catch (e) {
        console.error(`提取火车信息时出错: ${e.message}`);
        return {
            status: "error",
            message: e.message,
            total: 0,
            details: []
        };
    }

    let trainResult = {
        status: "success",
        message: "火车方案提取完成",
        total: trainDetails.length,
        details: trainDetails
    };
    console.log("火车方案提取结果:", JSON.stringify(trainResult, null, 2));
    return trainResult;
}

/**
 * 提取飞机中转方案信息
 * @returns {Object} 飞机中转方案列表：中转 & 联程
 */
function extractTransferOptions() {
    let transferFlights = [];
    let stopoverFlights = [];
    
    // 中转
    let transferControls = descContains("航班中转地").find();
    if (transferControls && transferControls.length > 0) {
        for (let i = 0; i < transferControls.length; i++) {
            try {
                let transferCityText = transferControls[i].text();
                let parent = transferControls[i].parent();
                if (!parent) continue;
                parent = parent.parent();
                if (!parent) continue;

                let baseDesc = parent.desc() || "";
                
                // 提取航班号
                let flightCode = baseDesc.replace(/^第(.+)航班$/, "$1");
                console.log("提取的航班号:", flightCode); 

                let flightInfo = {
                    flightCode: flightCode,
                    departureTime: null,
                    arrivalTime: null,
                    transferDuration: null,
                    transferCity: transferCityText || null,
                    departureAirport: null,
                    arrivalAirport: null,
                    ticketCount: null,
                    price: null,
                    cabinClass: null,
                    airline_1: null,
                    airline_2: null,
                    totalDuration: null,
                    benefits: [],
                    type: "transfer" // 标记为中转
                };
                let control = descContains(flightCode).find();
                for (let j = 0; j < control.length; j++) {
                    try {
                        let c = control[j];
                        let desc = c.desc() || "";
                        let text = c.text() || "";
                        if (desc.includes(`${flightCode}航班出发时间`)) {
                            flightInfo.departureTime = text;
                        } else if (desc.includes(`${flightCode}航班到达时间`)) {
                            flightInfo.arrivalTime = text;
                        } else if (desc.includes(`${flightCode}航班出发机场+航站楼`)) {
                            flightInfo.departureAirport = text;
                        } else if (desc.includes(`${flightCode}航班到达机场+航站楼`)) {
                            flightInfo.arrivalAirport = text;
                        } else if (desc.includes(`${flightCode}条航班中转地`)) {
                            flightInfo.transferCity = text;
                        } else if (desc.includes(`${flightCode}条航班中转时长`)) {
                            flightInfo.transferDuration = text;
                        } else if (desc.includes(`${flightCode}航班余票量`)) {
                            flightInfo.ticketCount = text;
                        } else if (desc.includes(`${flightCode}航班价格`)) {
                            flightInfo.price = text;
                        } else if (desc.includes(`${flightCode}航班舱等信息`)) {
                            flightInfo.cabinClass = text;
                        } else if (desc.includes(`${flightCode}航班第一段航司信息`)) {
                            flightInfo.airline_1 = text;
                        } else if (desc.includes(`${flightCode}航班第二段航司信息`)) {
                            flightInfo.airline_2 = text;
                        } else if (desc.includes(`${flightCode}航班总时长`)) {
                            flightInfo.totalDuration = text;
                        } else if (desc.includes(`${flightCode}航班未展开的`)) {
                            flightInfo.benefits.push(text);
                        }
                    } catch (e) {
                        // 忽略单个子控件错误   
                    }
                }

                transferFlights.push(flightInfo);
            } catch (e) {
                // 忽略单个控件错误
            }
        }
    }

    // 联程
    let stopoverControls = descContains("航班经停地").find();
    if (stopoverControls && stopoverControls.length > 0) {
        for (let i = 0; i < stopoverControls.length; i++) {
            try {
                let stopoverCityText = stopoverControls[i].text();
                let parent = stopoverControls[i].parent();
                if (!parent) continue;
                parent = parent.parent();
                if (!parent) continue;

                let baseDesc = parent.desc() || "";
                
                // 提取航班号
                let flightCode = baseDesc.replace(/^第(.+)航班$/, "$1");
                console.log("经停航班号:", flightCode);

                let flightInfo = {
                    flightCode: flightCode,
                    departureTime: null,
                    arrivalTime: null,
                    stopoverDuration: null,
                    stopoverCity: stopoverCityText || null,
                    departureAirport: null,
                    arrivalAirport: null,
                    ticketCount: null,
                    price: null,
                    cabinClass: null,
                    airline_1: null,
                    airline_2: null,
                    totalDuration: null,
                    benefits: [],
                    type: "stopover" 
                };
                let control = descContains(flightCode).find();
                for (let j = 0; j < control.length; j++) {
                    try {
                        let c = control[j];
                        let desc = c.desc() || "";
                        let text = c.text() || "";
                        if (desc.includes(`${flightCode}航班出发时间`)) {
                            flightInfo.departureTime = text;
                        } else if (desc.includes(`${flightCode}航班到达时间`)) {
                            flightInfo.arrivalTime = text;
                        } else if (desc.includes(`${flightCode}航班出发机场+航站楼`)) {
                            flightInfo.departureAirport = text;
                        } else if (desc.includes(`${flightCode}航班到达机场+航站楼`)) {
                            flightInfo.arrivalAirport = text;
                        } else if (desc.includes(`${flightCode}条航班经停地`)) {
                            flightInfo.stopoverCity = text;
                        } else if (desc.includes(`${flightCode}条航班经停时长`)) {
                            flightInfo.stopoverDuration = text;
                        } else if (desc.includes(`${flightCode}航班余票量`)) {
                            flightInfo.ticketCount = text;
                        } else if (desc.includes(`${flightCode}航班价格`)) {
                            flightInfo.price = text;
                        } else if (desc.includes(`${flightCode}航班舱等信息`)) {
                            flightInfo.cabinClass = text;
                        } else if (desc.includes(`${flightCode}航班航司信息`)) {
                            flightInfo.airline_1 = text;
                        } else if (desc.includes(`${flightCode}航班总时长`)) {
                            flightInfo.totalDuration = text;
                        } else if (desc.includes(`${flightCode}航班未展开的`)) {
                            flightInfo.benefits.push(text);
                        }
                    } catch (e) {
                        // 忽略单个子控件错误   
                    }
                }

                stopoverFlights.push(flightInfo);
            } catch (e) {
                // 忽略单个控件错误
            }
        }
    }

    let transferResult = {
        status: "success",
        message: "飞机中转方案提取完成",
        transferFlights: transferFlights,
        stopoverFlights: stopoverFlights,
        total: transferFlights.length + stopoverFlights.length
    };
    console.log(JSON.stringify(transferResult, null, 2));
    return transferResult;
}

/**
 * 提取临近推荐方案信息
 * @returns {Object} 临近推荐方案列表
 */
function extractNearbyOptions() {
    let controlsInfo = getAllControlsInfo();
    
    if (!controlsInfo.hasControls) {
        return {
            status: "no_controls",
            message: controlsInfo.message,
            options: []
        };
    }

    let allControls = controlsInfo.controls;

    // 1. 提取临近推荐方案概览
    let nearbyOverview = null;
    for (let c of allControls) {
        try {
            let desc = c.desc;
            let text = c.text;

            // 匹配临近推荐方案
            if (desc.includes("中转推荐tab_名称3") && text.includes("临近推荐")) {
                let priceControl = allControls.find(control => 
                    control.desc() && control.desc().includes("中转推荐tab_价格3")
                );
                nearbyOverview = {
                    type: "临近推荐",
                    name: text,
                    price: priceControl ? priceControl.text() : null
                };
                break;
            }
        } catch (e) {
            // 忽略单个控件错误
        }
    }

    // 2. 提取临近城市信息
    let nearbyCities = [];
    for (let c of allControls) {
        try {
            let desc = c.desc;
            let text = c.text;

            if (desc.includes("邻近城市")) {
                if (text.includes("¥") && text.includes("起")) {
                    let cityInfo = {
                        route: text.split(" ¥")[0],
                        price: text.split("¥")[1],
                        isSelected: desc.includes("已选")
                    };
                    nearbyCities.push(cityInfo);
                }
            }
        } catch (e) {
            // 忽略单个控件错误
        }
    }

    // 3. 提取具体临近航班信息
    let nearbyFlights = [];
    for (let c of allControls) {
        try {
            let desc = c.desc;
            let text = c.text;

            // 匹配临近航班信息（单个航班号，不包含+号）
            let flightMatch = desc.match(/第([A-Z0-9]+)航班/);
            if (flightMatch && !desc.includes("+")) {
                let flightCode = flightMatch[1];
                let flightInfo = {
                    flightCode: flightCode,
                    departureTime: null,
                    arrivalTime: null,
                    departureAirport: null,
                    arrivalAirport: null,
                    cabinClass: null,
                    airline: null,
                    aircraftType: null,
                    mealService: null,
                    price: null
                };

                // 查找相关控件
                for (let otherControl of allControls) {
                    let otherDesc = otherControl.desc() || "";
                    let otherText = otherControl.text() || "";

                    if (otherDesc.includes(`${flightCode}航班出发时间`)) {
                        flightInfo.departureTime = otherText;
                    } else if (otherDesc.includes(`${flightCode}航班到达时间`)) {
                        flightInfo.arrivalTime = otherText;
                    } else if (otherDesc.includes(`${flightCode}航班出发机场+航站楼`)) {
                        flightInfo.departureAirport = otherText;
                    } else if (otherDesc.includes(`${flightCode}航班到达机场+航站楼`)) {
                        flightInfo.arrivalAirport = otherText;
                    } else if (otherDesc.includes(`${flightCode}航班舱等信息`)) {
                        flightInfo.cabinClass = otherText;
                    } else if (otherDesc.includes(`${flightCode}航班航司信息`)) {
                        flightInfo.airline = otherText;
                    } else if (otherDesc.includes(`${flightCode}航班价格标签`)) {
                        flightInfo.price = otherText;
                    }
                }

                // 查找机型和服务信息
                for (let otherControl of allControls) {
                    let otherText = otherControl.text() || "";
                    if (otherText.includes("中机型") || otherText.includes("大机型") || otherText.includes("小机型")) {
                        flightInfo.aircraftType = otherText;
                    } else if (otherText.includes("有小食") || otherText.includes("无餐食") || otherText.includes("有餐食")) {
                        flightInfo.mealService = otherText;
                    }
                }

                nearbyFlights.push(flightInfo);
            }
        } catch (e) {
            // 忽略单个控件错误
        }
    }

    // 4. 提取临近日期信息
    let nearbyDates = [];
    for (let c of allControls) {
        try {
            let desc = c.desc;
            let text = c.text;

            if (desc.includes("临近日期") || (text.includes("9月") && text.includes("¥") && text.includes("起"))) {
                let dateInfo = {
                    date: text.split(" ¥")[0],
                    price: text.split("¥")[1],
                    isSelected: desc.includes("已选")
                };
                nearbyDates.push(dateInfo);
            }
        } catch (e) {
            // 忽略单个控件错误
        }
    }

    return {
        status: "success",
        message: "临近推荐方案提取完成",
        overview: nearbyOverview,
        nearbyCities: nearbyCities,
        nearbyDates: nearbyDates,
        total: nearbyFlights.length,
        flights: nearbyFlights
    };
}

/**
 * 提取飞机+火车方案信息
 * @returns {Object} 空铁列表
 */
function extractAirTrainOptions() {
    let airTrainList = [];
    try{
        let airTrainControls = descContains("空铁政策").find();
        for (let i = 0; i < airTrainControls.length; i++) {

            let parent = airTrainControls[i].parent();

            
        }
        return {
            status: "success",
            message: "飞机+火车方案提取完成",
            overview: airTrainOverview,
            transferCities: transferCities,
            total: airTrainList.length,
            policies: airTrainList
        };
    }catch (e) {
            // 忽略单个控件错误
        }
    
    return {
        status: "success",
        message: "飞机+火车方案提取完成",
        overview: airTrainOverview,
        transferCities: transferCities,
        total: airTrainPolicies.length,
        policies: airTrainPolicies
    };
    
    }


/**
 * 获取所有方案信息（机票+其他方案）
 * @returns {Object} 所有方案的综合信息
 */
function getAllOptions() {
    console.log("=== 开始提取所有方案信息 ===");
    
    // 统一获取控件信息，避免重复匹配
    let controlsInfo = getAllControlsInfo();
    
    let allOptions = {
        flights: extractFlights(),
        trainOptions: extractTrainOptions(),
        transferOptions: extractTransferOptions(),
        nearbyOptions: extractNearbyOptions(),
        airTrainOptions: extractAirTrainOptions()
    };


    console.log("\n=== 详细方案信息 ===");
    console.log("机票方案:", JSON.stringify(allOptions.flights, null, 2));
    console.log("火车方案:", JSON.stringify(allOptions.trainOptions, null, 2));
    console.log("飞机中转方案:", JSON.stringify(allOptions.transferOptions, null, 2));
    console.log("  - 中转航班:", JSON.stringify(allOptions.transferOptions.transferFlights, null, 2));
    console.log("  - 经停航班:", JSON.stringify(allOptions.transferOptions.stopoverFlights, null, 2));
    console.log("临近推荐方案:", JSON.stringify(allOptions.nearbyOptions, null, 2));
    console.log("飞机+火车方案:", JSON.stringify(allOptions.airTrainOptions, null, 2));

    return allOptions;
}

/**
 * 调试函数：打印所有控件的详细信息
 */
function debugAllControls() {
    console.log("=== 开始调试所有控件 ===");
    let controlsInfo = getAllControlsInfo();
    
    if (!controlsInfo.hasControls) {
        console.log(controlsInfo.message);
        return;
    }

    console.log(`总共找到 ${controlsInfo.total} 个控件`);
    
    for (let c of controlsInfo.controls) {
        try {
            let desc = c.desc;
            let text = c.text;
            let id = c.id;
            
            if (desc || text || id) {
                console.log(`控件 ${c.index}:`);
                console.log(`  描述: ${desc}`);
                console.log(`  文本: ${text}`);
                console.log(`  ID: ${id}`);
                if (c.bounds) {
                    console.log(`  位置: (${c.bounds.left}, ${c.bounds.top}, ${c.bounds.right}, ${c.bounds.bottom})`);
                }
                console.log("---");
            }
        } catch (e) {
            console.log(`控件 ${c.index} 解析错误: ${e.message}`);
        }
    }
}

// searchCtripInfoMain();

// 测试
load();
// getAllOptions();
// extractTrainOptions();
// extractTransferOptions();
extractNearbyOptions();