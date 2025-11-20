

// 使用 findOne 的 detectWidgetItemWithChainClassnameTextcontains 
function detectWidgetItemWithChainClassnameTextcontains_findOne(class_name, text_str, log_level, try_time_frequency) {
    let try_time_max = 0;
    if (try_time_frequency == "normal") {
        try_time_max = 50;
    }
    else if (try_time_frequency == "lite") {
        try_time_max = 20;
    }
    else {
        try_time_max = try_time_frequency;
    }
    let detect_widget_item = className(class_name).textContains(text_str).findOne(try_time_max * 100);
    if(!detect_widget_item) {
        return null;
    }
    return detect_widget_item;
}

function myCustomClick(obj) {
    // console.log("obj " + obj)
    if(obj == null) {
        console.error("invalid obj " + obj)
        sendOnlineLog("error", "invalid obj " + obj)
        return
    }
    if(!obj.visibleToUser() || obj.bounds().height() <= 40) {
        console.error("obj不可见 " + obj)
        sendOnlineLog("error", "obj不可见 " + obj)
        obj.click()
        return
    }
    var bound = obj.bounds()
    var x = bound.centerX()
    var y = bound.centerY()
    var w = bound.width()
    var h = bound.height()

    // console.log(bound + ", " + x + ", " + y + ", " + w +", " + h)

    var x1 = Math.ceil(x + random(-w / 3, w / 3)), y1 = Math.ceil(y + random(-h / 3, h / 3))
    // sleep((random() + random(3,4)) * 100)
    // obj.click()
    var isCicked = click(x1 , y1)
    if(!isCicked) {
        console.log(obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
        sendOnlineLog("error", obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
        obj.click()
    }
    // press(x1, y1, random(200, 300))
    // console.log("isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
}

function detectWidgetItem(item_type, item_content, log_level, try_time_frequency) {
    let try_time_max = 0;
    if (try_time_frequency == "normal") {
        try_time_max = 50;
    }
    else if (try_time_frequency == "lite") {
        try_time_max = 20;
    }
    else {
        try_time_max = try_time_frequency;
    }
    if (item_type == "text") {
        let detect_widget_item = text(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "id") {
        let detect_widget_item = id(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "textContains") {
        let detect_widget_item = textContains(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            return null;
        }
        return detect_widget_item;
    }
    else if (item_type == "desc") {
        let detect_widget_item = desc(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            return null;
        }
        return detect_widget_item;
    } else if(item_type == "className") {
        let detect_widget_item = className(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            return null;
        }
        return detect_widget_item;
    } else {
        console.error("invalid " + item_type)
    }
}

// test findOne
function doPrepareQueryParameters_findOne(departStaName, arriveStaName) {
    let isDepOk = false, isArrOk = false;
    let normal = "normal";
    
    // 出发站
    let depRetryCount = 3;
    for (let retry = 0; retry < depRetryCount; retry++) {
        sleep((random() + random(2, 4)) * 100);
        
        let dep1 = detectWidgetItem("id", "home_page_train_dep1", "error", normal);
        if(dep1 != null) {
            sleep((random() + random(2, 4)) * 100);
            myCustomClick(dep1);
            sleep((random() + random(3, 5)) * 100);
            
            let stationEdit = detectWidgetItem("className", "android.widget.EditText", "error", 100);
            
            if(stationEdit == null && dep1 == null) {
                if (retry < depRetryCount - 1) {
                    back();
                    sleep(1000);
                    continue;
                }
                return {success: false, step: "dep", reason: "找不到编辑框"};
            } else if(stationEdit == null && dep1 != null) {
                continue;
            } else {
                myCustomClick(stationEdit);
            }
            
            let cancelBtn = detectWidgetItem("text", "取消", "error", normal);
            if(cancelBtn == null) {
                back();
                return {success: false, step: "dep", reason: "找不到取消按钮"};
            }
            input(0, departStaName);
            sleep((random() + random(2, 5)) * 100);
            
            detectWidgetItemWithChainClassnameTextcontains_findOne("android.widget.Button", departStaName, "error", normal);
            
            let sts = className("android.widget.Button").textContains("火车站 " + departStaName + "站").find();
            if(sts.size() >= 1) {
                myCustomClick(sts.get(0));
                isDepOk = true;
                break;
            } else {
                if (retry < depRetryCount - 1) {
                    back();
                    sleep(2000);
                    continue;
                }
                return {success: false, step: "dep", reason: "找不到车站按钮"};
            }
        } else {
            if (retry < depRetryCount - 1) {
                sleep(2000);
                continue;
            }
            return {success: false, step: "dep", reason: "找不到始发站元素"};
        }
    }

    if(!isDepOk) {
        return {success: false, step: "dep", reason: "设置失败"};
    }
    
    // 到达站
    let arrRetryCount = 3;
    for (let retry = 0; retry < arrRetryCount; retry++) {
        sleep((random() + random(2, 4)) * 200);
        let arr1 = detectWidgetItem("id", "home_page_train_arr1", "error", normal);
        if(arr1 != null) {
            sleep((random() + random(3, 5)) * 200);
            myCustomClick(arr1);
            sleep((random() + random(3, 5)) * 100);
            let stationEdit = detectWidgetItem("className", "android.widget.EditText", "error", 100);
            if(stationEdit == null) {
                if (retry < arrRetryCount - 1) {
                    back();
                    sleep(2000);
                    continue;
                }
                return {success: false, step: "arr", reason: "找不到编辑框"};
            }
            myCustomClick(stationEdit);
            let cancelBtn = detectWidgetItem("text", "取消", "error", normal);
            if(cancelBtn == null) {
                back();
                return {success: false, step: "arr", reason: "找不到取消按钮"};
            }
            input(0, arriveStaName);
            sleep((random() + random(2, 5)) * 100);
            detectWidgetItemWithChainClassnameTextcontains_findOne("android.widget.Button", arriveStaName, "error", normal);
            let sts = className("android.widget.Button").textContains("火车站 " + arriveStaName + "站").find();
            if(sts.size() >= 1) {
                myCustomClick(sts.get(0));
                isArrOk = true;
                break;
            } else {
                if (retry < arrRetryCount - 1) {
                    back();
                    sleep(2000);
                    continue;
                }
                return {success: false, step: "arr", reason: "找不到车站按钮"};
            }
        } else {
            if (retry < arrRetryCount - 1) {
                sleep(2000);
                continue;
            }
            return {success: false, step: "arr", reason: "查不到到达站元素"};
        }
    }
    
    if(!isArrOk) {
        return {success: false, step: "arr", reason: "设置失败"};
    }
    
    return {success: true};
}

// 使用 findOnce 的版本（detectWidgetItem1 + detectWidgetItemWithChainClassnameTextcontains）
function doPrepareQueryParameters_findOnce(departStaName, arriveStaName) {
    let isDepOk = false, isArrOk = false;
    let normal = "normal";
    
    // 出发站
    let depRetryCount = 3;
    for (let retry = 0; retry < depRetryCount; retry++) {
        sleep((random() + random(2, 4)) * 100);
        
        let dep1 = detectWidgetItem("id", "home_page_train_dep1", "error", normal);
        if(dep1 != null) {
            sleep((random() + random(2, 4)) * 100);
            myCustomClick(dep1);
            sleep((random() + random(3, 5)) * 100);
            
            let stationEdit = detectWidgetItem("className", "android.widget.EditText", "error", 100);
            
            if(stationEdit == null && dep1 == null) {
                if (retry < depRetryCount - 1) {
                    back();
                    sleep(1000);
                    continue;
                }
                return {success: false, step: "dep", reason: "找不到编辑框"};
            } else if(stationEdit == null && dep1 != null) {
                continue;
            } else {
                myCustomClick(stationEdit);
            }
            
            let cancelBtn = detectWidgetItem("text", "取消", "error", normal);
            if(cancelBtn == null) {
                back();
                return {success: false, step: "dep", reason: "找不到取消按钮"};
            }
            input(0, departStaName);
            sleep((random() + random(2, 5)) * 100);
            
            detectWidgetItemWithChainClassnameTextcontains("android.widget.Button", departStaName, "error", normal);
            
            let sts = className("android.widget.Button").textContains("火车站 " + departStaName + "站").find();
            if(sts.size() >= 1) {
                myCustomClick(sts.get(0));
                isDepOk = true;
                break;
            } else {
                if (retry < depRetryCount - 1) {
                    back();
                    sleep(2000);
                    continue;
                }
                return {success: false, step: "dep", reason: "找不到车站按钮"};
            }
        } else {
            if (retry < depRetryCount - 1) {
                sleep(2000);
                continue;
            }
            return {success: false, step: "dep", reason: "找不到始发站元素"};
        }
    }

    if(!isDepOk) {
        return {success: false, step: "dep", reason: "设置失败"};
    }
    
    // 到达站
    let arrRetryCount = 3;
    for (let retry = 0; retry < arrRetryCount; retry++) {
        sleep((random() + random(2, 4)) * 200);
        let arr1 = detectWidgetItem("id", "home_page_train_arr1", "error", normal);
        if(arr1 != null) {
            sleep((random() + random(3, 5)) * 200);
            myCustomClick(arr1);
            sleep((random() + random(3, 5)) * 100);
            let stationEdit = detectWidgetItem("className", "android.widget.EditText", "error", 100);
            if(stationEdit == null) {
                if (retry < arrRetryCount - 1) {
                    back();
                    sleep(2000);
                    continue;
                }
                return {success: false, step: "arr", reason: "找不到编辑框"};
            }
            myCustomClick(stationEdit);
            let cancelBtn = detectWidgetItem("text", "取消", "error", normal);
            if(cancelBtn == null) {
                back();
                return {success: false, step: "arr", reason: "找不到取消按钮"};
            }
            input(0, arriveStaName);
            sleep((random() + random(2, 5)) * 100);
            detectWidgetItemWithChainClassnameTextcontains("android.widget.Button", arriveStaName, "error", normal);
            let sts = className("android.widget.Button").textContains("火车站 " + arriveStaName + "站").find();
            if(sts.size() >= 1) {
                myCustomClick(sts.get(0));
                isArrOk = true;
                break;
            } else {
                if (retry < arrRetryCount - 1) {
                    back();
                    sleep(2000);
                    continue;
                }
                return {success: false, step: "arr", reason: "找不到车站按钮"};
            }
        } else {
            if (retry < arrRetryCount - 1) {
                sleep(2000);
                continue;
            }
            return {success: false, step: "arr", reason: "查不到到达站元素"};
        }
    }
    
    if(!isArrOk) {
        return {success: false, step: "arr", reason: "设置失败"};
    }
    
    return {success: true};
}

// 测试函数
function testDoPrepareQueryParameters(testTimes, departStaName, arriveStaName) {
    console.log("=== 开始测试 doPrepareQueryParameters ===");
    console.log(`测试次数: ${testTimes}`);
    console.log(`出发站: ${departStaName}, 到达站: ${arriveStaName}`);
    
    let deadlockThreshold = 30000; // 30秒认为卡死
    
    // 全局监控变量
    let globalMonitor = {
        lastUpdate: Date.now(),
        currentTest: "",
        currentIteration: 0,
        lagTimes: [],
        lagReasons: [],
        lagThreshold: 10000, // 10秒认为卡顿
        checkInterval: 5000  // 每5秒检查一次
    };
    
    // 启动全局监控线程
    let monitorThread = threads.start(function() {
        while (true) {
            let now = Date.now();
            let timeSinceLastUpdate = now - globalMonitor.lastUpdate;
            
            if (timeSinceLastUpdate > globalMonitor.lagThreshold) {
                let lagInfo = {
                    time: now,
                    duration: timeSinceLastUpdate,
                    test: globalMonitor.currentTest,
                    iteration: globalMonitor.currentIteration,
                    reason: `长时间未更新 (${timeSinceLastUpdate}ms)`
                };
                globalMonitor.lagTimes.push(lagInfo);
                console.log(`[监控] 检测到卡顿: ${globalMonitor.currentTest} 第${globalMonitor.currentIteration}次测试已卡顿 ${timeSinceLastUpdate}ms`);
            }
            
            sleep(globalMonitor.checkInterval);
        }
    });
    
    // 更新监控状态的函数
    function updateMonitor(testName, iteration) {
        globalMonitor.lastUpdate = Date.now();
        globalMonitor.currentTest = testName;
        globalMonitor.currentIteration = iteration;
    }
    
    // 测试 findOne 版本
    // console.log("\n测试 findOne 版本...");
    // let findOneStats = {
    //     success: 0,
    //     failed: 0,
    //     deadlock: 0,
    //     times: [],
    //     errors: {}
    // };
    
    // for (let i = 0; i < testTimes; i++) {
    //     updateMonitor("findOne", i + 1);
    //     let begin = Date.now();
    //     let deadlockDetected = false;
        
    //     try {
    //         let monitor = threads.start(function() {
    //             sleep(deadlockThreshold);
    //         });
            
    //         let result = doPrepareQueryParameters_findOne(departStaName, arriveStaName);
    //         monitor.interrupt();
            
    //         let elapsed = Date.now() - begin;
    //         findOneStats.times.push(elapsed);
            
    //         if (elapsed > deadlockThreshold) {
    //             findOneStats.deadlock++;
    //             deadlockDetected = true;
    //             console.log(`[${i+1}] findOne 版本疑似卡死: ${elapsed}ms`);
    //             globalMonitor.lagReasons.push({
    //                 time: Date.now(),
    //                 test: "findOne",
    //                 iteration: i + 1,
    //                 reason: `整体执行卡死 (${elapsed}ms)`
    //             });
    //         }
            
    //         if (result.success) {
    //             findOneStats.success++;
    //         } else {
    //             findOneStats.failed++;
    //             let key = result.step + ":" + result.reason;
    //             findOneStats.errors[key] = (findOneStats.errors[key] || 0) + 1;
    //         }
            
    //         if ((i + 1) % 5 == 0) {
    //             console.log(`findOne 进度: ${i+1}/${testTimes}, 成功=${findOneStats.success}, 失败=${findOneStats.failed}, 卡死=${findOneStats.deadlock}`);
    //         }
            
    //     } catch (e) {
    //         let elapsed = Date.now() - begin;
    //         console.error(`[${i+1}] findOne 版本异常: ${e}, 耗时=${elapsed}ms`);
    //         findOneStats.failed++;
    //         findOneStats.errors["异常:" + e] = (findOneStats.errors["异常:" + e] || 0) + 1;
    //         globalMonitor.lagReasons.push({
    //             time: Date.now(),
    //             test: "findOne",
    //             iteration: i + 1,
    //             reason: `异常: ${e}`
    //         });
    //     }
        
    //     sleep(1000); // 每次测试间隔
    // }
    
    // 测试 findOnce 版本
    console.log("\n测试 findOnce 版本...");
    let findOnceStats = {
        success: 0,
        failed: 0,
        deadlock: 0,
        times: [],
        errors: {}
    };
    
    for (let i = 0; i < testTimes; i++) {
        updateMonitor("findOnce", i + 1);
        let begin = Date.now();
        let deadlockDetected = false;
        
        try {
            let monitor = threads.start(function() {
                sleep(deadlockThreshold);
            });
            
            let result = doPrepareQueryParameters_findOnce(departStaName, arriveStaName);
            monitor.interrupt();
            
            let elapsed = Date.now() - begin;
            findOnceStats.times.push(elapsed);
            
            if (elapsed > deadlockThreshold) {
                findOnceStats.deadlock++;
                deadlockDetected = true;
                console.log(`[${i+1}] findOnce 版本疑似卡死: ${elapsed}ms`);
                globalMonitor.lagReasons.push({
                    time: Date.now(),
                    test: "findOnce",
                    iteration: i + 1,
                    reason: `整体执行卡死 (${elapsed}ms)`
                });
            }
            
            if (result.success) {
                findOnceStats.success++;
            } else {
                findOnceStats.failed++;
                let key = result.step + ":" + result.reason;
                findOnceStats.errors[key] = (findOnceStats.errors[key] || 0) + 1;
            }
            
            if ((i + 1) % 5 == 0) {
                console.log(`findOnce 进度: ${i+1}/${testTimes}, 成功=${findOnceStats.success}, 失败=${findOnceStats.failed}, 卡死=${findOnceStats.deadlock}`);
            }
            
        } catch (e) {
            let elapsed = Date.now() - begin;
            console.error(`[${i+1}] findOnce 版本异常: ${e}, 耗时=${elapsed}ms`);
            findOnceStats.failed++;
            findOnceStats.errors["异常:" + e] = (findOnceStats.errors["异常:" + e] || 0) + 1;
            globalMonitor.lagReasons.push({
                time: Date.now(),
                test: "findOnce",
                iteration: i + 1,
                reason: `异常: ${e}`
            });
        }
        
        sleep(1000);
    }
    
    // 停止监控线程
    monitorThread.interrupt();
    
    // 输出卡顿统计
    console.log("\n=== 卡顿监控统计 ===");
    console.log(`检测到的卡顿次数: ${globalMonitor.lagTimes.length}`);
    if (globalMonitor.lagTimes.length > 0) {
        console.log("卡顿详情:");
        globalMonitor.lagTimes.forEach((lag, index) => {
            console.log(`  [${index + 1}] ${lag.test} 第${lag.iteration}次: 卡顿${lag.duration}ms`);
        });
    }
    
    console.log(`异常记录次数: ${globalMonitor.lagReasons.length}`);
    if (globalMonitor.lagReasons.length > 0) {
        console.log("异常详情:");
        globalMonitor.lagReasons.forEach((reason, index) => {
            console.log(`  [${index + 1}] ${reason.test} 第${reason.iteration}次: ${reason.reason}`);
        });
    }
    
    // 输出统计结果
    console.log("\n=== 测试结果 ===");
    
    // findOne 统计
    findOneStats.times.sort((a, b) => a - b);
    let avg1 = findOneStats.times.length > 0 ? (findOneStats.times.reduce((a, b) => a + b, 0) / findOneStats.times.length) : 0;
    let p50_1 = findOneStats.times.length > 0 ? findOneStats.times[Math.floor(findOneStats.times.length * 0.5)] : 0;
    let p95_1 = findOneStats.times.length > 0 ? findOneStats.times[Math.floor(findOneStats.times.length * 0.95)] : 0;
    let p99_1 = findOneStats.times.length > 0 ? findOneStats.times[Math.floor(findOneStats.times.length * 0.99)] : 0;
    
    console.log("\nfindOne 版本结果:");
    console.log(`  成功=${findOneStats.success}, 失败=${findOneStats.failed}, 卡死=${findOneStats.deadlock}`);
    console.log(`  平均耗时=${avg1.toFixed(2)}ms, P50=${p50_1}ms, P95=${p95_1}ms, P99=${p99_1}ms`);
    console.log(`  卡死率=${(findOneStats.deadlock/testTimes*100).toFixed(2)}%`);
    if (Object.keys(findOneStats.errors).length > 0) {
        console.log("  错误分布:");
        for (let key in findOneStats.errors) {
            console.log(`    ${key}: ${findOneStats.errors[key]}`);
        }
    }
    
    // findOnce 统计
    findOnceStats.times.sort((a, b) => a - b);
    let avg2 = findOnceStats.times.length > 0 ? (findOnceStats.times.reduce((a, b) => a + b, 0) / findOnceStats.times.length) : 0;
    let p50_2 = findOnceStats.times.length > 0 ? findOnceStats.times[Math.floor(findOnceStats.times.length * 0.5)] : 0;
    let p95_2 = findOnceStats.times.length > 0 ? findOnceStats.times[Math.floor(findOnceStats.times.length * 0.95)] : 0;
    let p99_2 = findOnceStats.times.length > 0 ? findOnceStats.times[Math.floor(findOnceStats.times.length * 0.99)] : 0;
    
    console.log("\nfindOnce 版本结果:");
    console.log(`  成功=${findOnceStats.success}, 失败=${findOnceStats.failed}, 卡死=${findOnceStats.deadlock}`);
    console.log(`  平均耗时=${avg2.toFixed(2)}ms, P50=${p50_2}ms, P95=${p95_2}ms, P99=${p99_2}ms`);
    console.log(`  卡死率=${(findOnceStats.deadlock/testTimes*100).toFixed(2)}%`);
    if (Object.keys(findOnceStats.errors).length > 0) {
        console.log("  错误分布:");
        for (let key in findOnceStats.errors) {
            console.log(`    ${key}: ${findOnceStats.errors[key]}`);
        }
    }
    
    console.log("\n=== 对比总结 ===");
    console.log(`卡死率: findOne=${(findOneStats.deadlock/testTimes*100).toFixed(2)}%, findOnce=${(findOnceStats.deadlock/testTimes*100).toFixed(2)}%`);
    console.log(`成功率: findOne=${(findOneStats.success/testTimes*100).toFixed(2)}%, findOnce=${(findOnceStats.success/testTimes*100).toFixed(2)}%`);
}

// test
testDoPrepareQueryParameters(200, "北京南", "上海虹桥");