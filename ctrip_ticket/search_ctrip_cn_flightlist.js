
let testLogUrl = "http://10.41.20.223:8020/ws/result";

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
 * @returns {Object} 包含普通航班和临近航班的列表
 */
function extractFlights() {
    let normalFlights = {};
    let nearbyFlights = {};
    
    // 获取临近航班标志控件
    let nearbyFlagControls = descContains("中转NearbyFlightDetail换乘城市快筛列表").find();
    let endFlagControls = descContains("空铁政策").find();
    
    // 改为从航班价格控件开始查找
    let controls = descEndsWith("航班价格").find();
    for(let i = 0; i < controls.length; i++){
        let control = controls[i];
        let price = control.text();
        let parent = control.parent();
        let grandparent = parent.parent();
        let greategrandparent = grandparent.parent();

        // 判断是否为临近航班
        let isNearby = false;
        if (nearbyFlagControls.length > 0) {
            let controlBounds = control.bounds();
            let nearbyFlagBounds = nearbyFlagControls[0].bounds();
            let endFlagBounds = endFlagControls.length > 0 ? endFlagControls[0].bounds() : null;
            
            if (controlBounds.top > nearbyFlagBounds.top) {
                if (!endFlagBounds || controlBounds.top < endFlagBounds.top) {
                    isNearby = true;
                }
            }
        }

        // 在第一级父控件中查找舱位信息
        let controls1 = parent.children();
        let seatType = null;
        
        for (let j = 0; j < controls1.length; j++) {
            let c = controls1[j];
            if (c.desc() && c.desc().includes("航班舱等信息")) {
                seatType = c.text();
            }
        }

        // 在第二级父控件中查找余票量和其他信息
        let controls2 = grandparent.children();
        let ticketCount = null;
        let departureTime = null;
        let arrivalTime = null;
        let departureAirport = null;
        let arrivalAirport = null;
        let airline = null;
        let flightInfoList = []; // 改为数组存储多个文本信息
        
        for (let j = 0; j < controls2.length; j++) {
            let c = controls2[j];
            if (c.desc() && c.desc().includes("余票量")) {
                ticketCount = c.text();
            }
            if (c.desc() && c.desc().includes("航班出发时间")) {
                departureTime = c.text();
            }
            if (c.desc() && c.desc().includes("航班到达时间")) {
                arrivalTime = c.text();
            }
            if (c.desc() && c.desc().includes("航班出发机场+航站楼")) {
                departureAirport = c.text();
            }
            if (c.desc() && c.desc().includes("航班到达机场+航站楼")) {
                arrivalAirport = c.text();
            }
            if (c.desc() && c.desc().includes("航班航司信息")) {
                airline = c.text();
            }
            // 收集所有desc为null但text不为空的控件
            if (c.desc() === null && c.text() !== null && c.text().trim() !== "") {
                flightInfoList.push(c.text().trim());
            }
        }
        
        // 创建航班信息对象
        let flightData = {
            ticketCount: ticketCount,
            price: price,
            seatType: seatType,
            departureTime: departureTime,
            arrivalTime: arrivalTime,
            departureAirport: departureAirport,
            arrivalAirport: arrivalAirport,
            airline: airline,
            flightInfo: flightInfoList, // 改为数组
            flightType: isNearby ? "临近航班" : "普通航班"
        };
        
        // 根据类型添加到对应列表
        if (isNearby) {
            nearbyFlights[`flight_${i}`] = flightData;
        } else {
            normalFlights[`flight_${i}`] = flightData;
        }
    }
    
    //调试信息
    // console.log("normalFlights:",JSON.stringify(normalFlights, null, 2));
    // console.log("nearbyFlights:",JSON.stringify(nearbyFlights, null, 2));

    return {
        status: "success",
        message: "航班信息提取完成",
        normalFlights: Object.values(normalFlights),
        nearbyFlights: Object.values(nearbyFlights),
        normalTotal: Object.keys(normalFlights).length,
        nearbyTotal: Object.keys(nearbyFlights).length,
        total: Object.keys(normalFlights).length + Object.keys(nearbyFlights).length
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
                
                // 整合各个函数的结果
                let flightsResult = extractFlights();
                let trainResult = extractTrainOptions();
                let transferResult = extractTransferOptions();
                let airTrainResult = extractAirTrainOptions();
                
                // 整合所有结果
                let result = {
                    status: "success",
                    message: "携程搜索完成",
                    searchInfo: searchInfo,
                    flights: {
                        normalFlights: flightsResult.normalFlights,
                        nearbyFlights: flightsResult.nearbyFlights,
                        normalTotal: flightsResult.normalTotal,
                        nearbyTotal: flightsResult.nearbyTotal,
                        total: flightsResult.total
                    },
                    trainOptions: trainResult,
                    transferOptions: transferResult,
                    airTrainOptions: airTrainResult,
                    // 计算总方案数
                    totalOptions: (flightsResult.total || 0) + 
                                 (trainResult.total || 0) + 
                                 (transferResult.total || 0) + 
                                 (airTrainResult.total || 0)
                };
                
                let endTime = Date.now();
                let totalDuration = endTime - startTime;
            
                let logMessage = `携程搜索完成，搜索内容: ${searchInfo}，找到 ${result.totalOptions} 个方案 - ` +
                               `普通航班: ${flightsResult.normalTotal}，临近航班: ${flightsResult.nearbyTotal}，` +
                               `火车方案: ${trainResult.total || 0}，中转方案: ${transferResult.total || 0}，` +
                               `空铁方案: ${airTrainResult.total || 0}，` +
                               `总耗时: ${totalDuration}ms`;
                
                uploadLog("search_ctrip_cn_ticket-20250911173437822", logMessage, totalDuration, testLogUrl);
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
                        totalOptions: 0,
                        flights: { normalFlights: [], nearbyFlights: [], normalTotal: 0, nearbyTotal: 0, total: 0 },
                        trainOptions: { status: "error", total: 0, details: [] },
                        transferOptions: { status: "error", total: 0, transferFlights: [], stopoverFlights: [] },
                        airTrainOptions: { status: "error", total: 0, airTrainList: [] }
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
                        totalOptions: 0,
                        flights: { normalFlights: [], nearbyFlights: [], normalTotal: 0, nearbyTotal: 0, total: 0 },
                        trainOptions: { status: "error", total: 0, details: [] },
                        transferOptions: { status: "error", total: 0, transferFlights: [], stopoverFlights: [] },
                        airTrainOptions: { status: "error", total: 0, airTrainList: [] }
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
            totalOptions: 0,
            flights: { normalFlights: [], nearbyFlights: [], normalTotal: 0, nearbyTotal: 0, total: 0 },
            trainOptions: { status: "error", total: 0, details: [] },
            transferOptions: { status: "error", total: 0, transferFlights: [], stopoverFlights: [] },
            airTrainOptions: { status: "error", total: 0, airTrainList: [] }
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
    let control = desc("底部服务保障").findOne(500);
    while(!control){
        gestures([0,1000, [514, 2137], [514, 1600]],[0,500, [514, 1600], [514, 200]]);
        control = desc("底部服务保障").findOne(500);
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
    let trainMap = new Map(); 
    
    try {
        let controls = descMatches(/^(\d+)出发日期$/).find();
        
        for (let i = 0; i < controls.length; i++) {
            let control = controls[i];
            let desc = control.desc();
            let text = control.text();

            let index = desc.replace('出发日期', '');
            let parentControl = control.parent();

            let children = parentControl.children();
            
             let trainInfo = {
                 index: index,
                 departureTime: null,
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
                     if (childDesc === `${index}出发时间` && childText && childText.trim()) {
                         trainInfo.departureTime = childText;
                     } else if (childDesc === `${index}出发站点` && childText && childText.trim()) {
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
                            
                            // 查找后续1-2个子控件作为状态信息
                            let status = "有票"; // 默认状态
                            let skipCount = 0;
                            
                            // 检查下一个控件
                            if (j + 1 < children.length) {
                                let nextChild = children[j + 1];
                                let nextChildText = nextChild.text();
                                let nextChildDesc = nextChild.desc();
                                
                                if (nextChildDesc === null && nextChildText && nextChildText.trim()) {
                                    if (nextChildText.includes("有票") || nextChildText.includes("张") || 
                                        nextChildText.includes("抢") || nextChildText.includes("换座") ||
                                        nextChildText.includes("(") || nextChildText.includes(")")) {
                                        status = nextChildText.trim();
                                        skipCount = 1;
                                        
                                        // 检查再下一个控件
                                        if (j + 2 < children.length) {
                                            let nextNextChild = children[j + 2];
                                            let nextNextChildText = nextNextChild.text();
                                            let nextNextChildDesc = nextNextChild.desc();
                                            
                                            if (nextNextChildDesc === null && nextNextChildText && nextNextChildText.trim()) {
                                                if (nextNextChildText.includes("张") || nextNextChildText.includes("有票") || 
                                                    nextNextChildText.includes("抢")) {
                                                    status += " " + nextNextChildText.trim();
                                                    skipCount = 2;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // 跳过已处理控件
                            j += skipCount;
                            
                            // 添加座位类型
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
            
            // 覆盖同索引的记录
            trainMap.set(index, trainInfo);
        }
        
        trainDetails = Array.from(trainMap.values());
        
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
    // console.log("火车方案提取结果:", JSON.stringify(trainResult, null, 2));
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
                // console.log("提取的航班号:", flightCode); 

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
    // console.log(JSON.stringify(transferResult, null, 2));
    return transferResult;
}

/**
 * 提取临近推荐方案信息-邻近城市&临近日期
 * @returns {Object} 临近推荐方案列表
 */
function extractNearbyOptions() {
    let nearbyList = [];
    try {
        let controlsInfo = getAllControlsInfo();
        if (!controlsInfo.hasControls) {
            return {
                status: "no_controls",
                message: controlsInfo.message,
                total: 0,
                flights: []
            };
        }

        let allControls = controlsInfo.controls;

        // “中转NearbyFlightDetail换乘城市快筛列表”作为邻近航班区块起点
        let startIndex = -1;
        for (let i = 0; i < allControls.length; i++) {
            let d = allControls[i].desc || "";
            if (d && d.includes("中转NearbyFlightDetail换乘城市快筛列表")) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) {
            return {
                status: "not_found",
                message: "未定位到邻近航班起点控件",
                total: 0,
                flights: []
            };
        }

        // 2) 设定一个保守的边界：遇到“空铁政策”等下一个分段标记即停止
        let endIndex = allControls.length - 1;
        for (let i = startIndex + 1; i < allControls.length; i++) {
            let d = allControls[i].desc || "";
            // 可按需扩展更多边界标记
            if (d.includes("空铁政策") || d.includes("空铁联运") || d.includes("AirTrain")) {
                endIndex = i - 1;
                break;
            }
        }

        // 3) 在(startIndex, endIndex]范围内，按“第([A-Z0-9]+)航班”提取信息
        let flightsMap = {};
        for (let i = startIndex + 1; i <= endIndex; i++) {
            try {
                let item = allControls[i];
                let desc = item.desc || "";
                let text = item.text || "";

                let match = desc.match(/第([A-Z0-9]+)航班/);
                if (!match) continue;
                let code = match[1];

                if (!flightsMap[code]) {
                    flightsMap[code] = {
                        flgno: code,
                        airline: null,
                        departureTime: null,
                        arrivalTime: null,
                        nextDayInfo: null,
                        departureAirport: null,
                        arrivalAirport: null,
                        flightDuration: null,
                        transferCities: [],
                        price: null,
                        isNearby: true
                    };
                }

                let f = flightsMap[code];
                if (desc.includes("出发时间")) f.departureTime = text;
                if (desc.includes("到达时间")) f.arrivalTime = text;
                if (desc.includes("隔天信息")) f.nextDayInfo = text;
                if (desc.includes("出发机场")) f.departureAirport = text;
                if (desc.includes("到达机场")) f.arrivalAirport = text;
                if (desc.includes("飞行时长")) f.flightDuration = text;
                if (desc.includes("价格")) f.price = text;
                if (desc.includes("中转城市")) f.transferCities.push(text);
            } catch (e) {
                // 忽略单个控件错误
            }
        }

        // 4) 单独处理航司名称：在范围内查找包含“航空/国航”的文本并回溯最近航班号
        for (let i = startIndex + 1; i <= endIndex; i++) {
            try {
                let item = allControls[i];
                let t = item.text || "";
                if (!t) continue;
                if (t.includes("航空") || t.includes("国航")) {
                    for (let j = i; j >= startIndex + 1; j--) {
                        let prev = allControls[j];
                        let prevId = prev.id || "";
                        let m = prevId.match(/第([A-Z0-9]+)航班/);
                        if (m) {
                            let code = m[1];
                            if (flightsMap[code]) {
                                flightsMap[code].airline = t;
                            }
                            break;
                        }
                    }
                }
            } catch (e) {
                // 忽略单个控件错误
            }
        }

        nearbyList = Object.values(flightsMap);
        // console.log(nearbyList);
        return {
            status: "success",
            message: "邻近航班提取完成",
            total: nearbyList.length,
            flights: nearbyList
        };
    } catch (e) {
        return {
            status: "error",
            message: e.message,
            total: 0,
            flights: []
        };
    }
}

/**
 * 提取飞机+火车方案信息
 * @returns {Object} 空铁列表
 */
function extractAirTrainOptions() {
    let airTrainList = [];
    try{
        let airTrainControls = descStartsWith("空铁政策").descEndsWith("中转城市").find();
        for (let i = 0; i < airTrainControls.length; i++) {
            let airTrainInfo = [];
            let parent = airTrainControls[i].parent();
            let controls = parent.children();

            for (let j = 0; j < controls.length; j++) {
                let control = controls[j];
                let text = control.text();
                
                if (text != null && text.trim() != "") {
                    airTrainInfo.push(text);
                }
            }
            airTrainList.push(airTrainInfo);
        }

        // console.log("飞机+火车方案提取完成", JSON.stringify(airTrainList, null, 2));
    }catch (e) {
            // 忽略单个控件错误
        }
    
    return {
        status: "success",
        message: "飞机+火车方案提取完成",
        airTrainList: airTrainList,
        total: airTrainList.length
    };
    
    }


/**
 * 获取所有方案信息（机票+其他方案）
 * @returns {Object} 所有方案的综合信息
 */
function getAllOptions() {
    
    let flightsResult = extractFlights();
    let allOptions = {
        normalFlights: flightsResult.normalFlights,
        nearbyFlights: flightsResult.nearbyFlights,
        trainOptions: extractTrainOptions(),
        transferOptions: extractTransferOptions(),
        airTrainOptions: extractAirTrainOptions()
    };

    // 汇总所有方案 total
    try {
        let sum = 0;
        sum += flightsResult.normalTotal || 0;
        sum += flightsResult.nearbyTotal || 0;
        sum += (allOptions.trainOptions && typeof allOptions.trainOptions.total === "number") ? allOptions.trainOptions.total : 0;
        sum += (allOptions.transferOptions && typeof allOptions.transferOptions.total === "number") ? allOptions.transferOptions.total : 0;
        sum += (allOptions.airTrainOptions && typeof allOptions.airTrainOptions.total === "number") ? allOptions.airTrainOptions.total : 0;
        allOptions.total = sum;
        console.log("所有方案总数:", sum);
    } catch (e) {
        console.log("汇总总数发生错误:", e.message);
        allOptions.total = 0;
    }

    console.log("\n=== list ===");
    console.log("NormalFlights:", JSON.stringify(allOptions.normalFlights, null, 2));
    console.log("NearbyFlights:", JSON.stringify(allOptions.nearbyFlights, null, 2));
    console.log("TrainOptions:", JSON.stringify(allOptions.trainOptions, null, 2));
    console.log("TransferOptions:", JSON.stringify(allOptions.transferOptions, null, 2));
    console.log("AirTrainOptions:", JSON.stringify(allOptions.airTrainOptions, null, 2));

    return allOptions;
}

// searchCtripInfoMain();

// 测试
load();
// getAllOptions();
// extractFlights();

// extractTrainOptions();
// extractTransferOptions();

// extractAirTrainOptions();