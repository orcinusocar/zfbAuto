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
 * 从当前页面提取航班信息
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
            let id = c.id() || "";
            let text = c.text() || "";

            // 只处理包含 "第X条航班" 的控件
            let match = id.match(/第(\d+)条航班/);
            if (!match) continue;

            let flightIndex = match[1]; // 航班序号（只要数字）
            if (!flights[flightIndex]) {
                flights[flightIndex] = {
                    航班序号: flightIndex,
                    航司名称: null,
                    起飞时间: null,
                    到达时间: null,
                    隔天信息: null,
                    起飞机场: null,
                    到达机场: null,
                    飞行时长: null,
                    中转城市: [],
                    价格: null
                };
            }

            let flight = flights[flightIndex];

            if (id.includes("起飞时间")) flight.起飞时间 = text;
            if (id.includes("到达时间")) flight.到达时间 = text;
            if (id.includes("隔天信息")) flight.隔天信息 = text;
            if (id.includes("起飞机场")) flight.起飞机场 = text;
            if (id.includes("到达机场")) flight.到达机场 = text;
            if (id.includes("飞行时长")) flight.飞行时长 = text;
            if (id.includes("价格")) flight.价格 = text;
            if (id.includes("中转城市")) flight.中转城市.push(text);

        } catch (e) {
            // 忽略单个控件错误
        }
    }

    // 单独处理航司名称 - 对所有控件都检查
    for (let c of allControls) {
        try {
            let text = c.text() || "";
            
            if (text.includes("航空")) {
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
                        let prevMatch = prevId.match(/第(\d+)条航班/);
                        if (prevMatch) {
                            let flightIndex = prevMatch[1]; // 只要数字部分
                            if (flights[flightIndex]) {
                                flights[flightIndex].航司名称 = text;
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

    return {
        status: "success",
        message: "航班信息提取完成",
        total: Object.keys(flights).length,
        flights: Object.values(flights)
    };
}


let retryCount = 0;
const maxRetries = 3;

while(true) {
    if(ismainpage()){
        searchCtripInfo("北京到奥克兰的机票");
        sleep(5000);
        let result = extractFlights();
        console.log(JSON.stringify(result, null, 2));
        break; // 搜索完成后退出循环

    }else if(isMask()){
        autoOut();
        sleep(2000); // 等待退出遮罩
        retryCount++; // 增加重试次数
        if(retryCount > maxRetries) {
            toastLog("超过最大重试次数，自动退出");
            break;
        }
        continue; // 重新检查页面状态

    }else{
        toastLog("不是主页面或已知遮罩");
        retryCount++; // 增加重试次数
        if(retryCount > maxRetries) {
            toastLog("超过最大重试次数，自动退出");
            break;
        }
        sleep(2000); // 等待2秒后重新检查
        continue; // 重新检查页面状态
    }
}

function isMask(){
    let control = id("ctrip.android.view:id/a").findOne(2000);
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
  


