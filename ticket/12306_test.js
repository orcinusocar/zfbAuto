// 12306_test.js - 基础功能测试脚本
const testConfig = {
    baseUrl: "http://127.0.0.1:38080",
    testTimeout: 300000,  // 增加到5分钟
    retryCount: 3
};

// 测试用例配置
const testCases = {
    // 心跳测试
    // ping: {
    //     url: "/ping",
    //     method: "GET",
    //     expectedResponse: { code: 0, msg: "success", data: "心跳" }
    // },
    
    // 启动测试
    // start: {
    //     url: "/start0",
    //     method: "GET", 
    //     expectedResponse: { code: 0, msg: "success", data: "start" }
    // },
    
    // // 重启测试
    // restart: {
    //     url: "/restart",
    //     method: "GET",
    //     expectedResponse: { code: 0, msg: "success", data: "restart" }
    // },
    
    // 清理数据测试
    // clear: {
    //     url: "/clear",
    //     method: "GET",
    //     expectedResponse: { code: 0, msg: "success", data: "clear" }
    // },
    
    // 登录测试
    // login: {
    //     url: "/login",
    //     method: "POST",
    //     data: {
    //         id: "test_login_" + Date.now(),
    //         login: {
    //             username: "test_user",
    //             password: "test_password",
    //             smscode: ""
    //         }
    //     }
    // },
    
    // 订票测试 - 格式1
    order1: {
        url: "/order",
        method: "POST", 
        data: {
            id: "test_order_" + Date.now(),
            query: {
                depart_station: "北京南",
                arrive_station: "上海虹桥",
                depart_date: "2025-11-03"
            },
            order: {
                code: "G103",
                passengers: [{
                    passenger_name: "test",
                    identity_type: "1",
                    identity_no: "test", 
                    passenger_type: "1"
                }],
                seat_no: ["1A"],
                seat_type_code: "M",
                has_seat: true,
                is_pay_by_point: false
            }
        }
    },
    

};

// HTTP请求工具函数
function makeRequest(url, method, data) {
    method = method || "GET";
    data = data || null;
    try {
        if (method === "GET") {
            return http.get(url);
        } else if (method === "POST") {
            return http.postJson(url, data);
        }
    } catch (e) {
        console.error("请求失败:", e);
        return null;
    }
}

// 测试执行函数
function runTest(testName, testCase) {
    console.log(`\n=== 开始测试: ${testName} ===`);
    
    const fullUrl = testConfig.baseUrl + testCase.url;
    console.log(`请求URL: ${fullUrl}`);
    console.log(`请求方法: ${testCase.method}`);
    
    if (testCase.data) {
        console.log(`请求数据: ${JSON.stringify(testCase.data, null, 2)}`);
    }
    
    const startTime = Date.now();
    const response = makeRequest(fullUrl, testCase.method, testCase.data);
    const endTime = Date.now();
    
    if (!response) {
        console.error(`❌ 测试失败: ${testName} - 请求无响应`);
        return false;
    }
    
    console.log(`响应状态码: ${response.statusCode}`);
    console.log(`响应时间: ${endTime - startTime}ms`);
    
    try {
        const responseData = JSON.parse(response.body.string());
        console.log(`响应数据: ${JSON.stringify(responseData, null, 2)}`);
        
        if (testCase.expectedResponse) {
            const isSuccess = responseData.code === testCase.expectedResponse.code &&
                            responseData.msg === testCase.expectedResponse.msg;
            
            if (isSuccess) {
                console.log(`✅ 测试通过: ${testName}`);
                return true;
            } else {
                console.error(`❌ 测试失败: ${testName} - 响应不匹配`);
                console.error(`期望: ${JSON.stringify(testCase.expectedResponse)}`);
                console.error(`实际: ${JSON.stringify(responseData)}`);
                return false;
            }
        } else {
            console.log(`✅ 测试完成: ${testName} - 无预期结果验证`);
            return true;
        }
    } catch (e) {
        console.error(`❌ 测试失败: ${testName} - 响应解析错误: ${e}`);
        return false;
    }
}

// 重试机制
function runTestWithRetry(testName, testCase, retryCount) {
    retryCount = retryCount || testConfig.retryCount;
    for (let i = 0; i < retryCount; i++) {
        console.log(`\n第 ${i + 1} 次尝试测试: ${testName}`);
        const result = runTest(testName, testCase);
        if (result) {
            return true;
        }
        if (i < retryCount - 1) {
            console.log(`等待 2 秒后重试...`);
            sleep(2000);
        }
    }
    return false;
}

// 主测试函数
function runAllTests() {
    console.log("🚀 开始12306订票脚本测试");
    console.log(`测试配置: ${JSON.stringify(testConfig, null, 2)}`);
    
    const results = {};
    let passedTests = 0;
    let totalTests = 0;
    
    // 执行所有测试用例
    const testEntries = Object.entries(testCases);
    for (let i = 0; i < testEntries.length; i++) {
        let testName = testEntries[i][0];
        let testCase = testEntries[i][1];
        totalTests++;
        const result = runTestWithRetry(testName, testCase);
        results[testName] = result;
        if (result) {
            passedTests++;
        }
    }
    
    // 输出测试结果
    console.log("\n" + "=".repeat(50));
    console.log("📊 测试结果汇总");
    console.log("=".repeat(50));
    
    const resultEntries = Object.entries(results);
    for (let i = 0; i < resultEntries.length; i++) {
        let testName = resultEntries[i][0];
        let testResult = resultEntries[i][1];
        console.log(`${testResult ? '✅' : '❌'} ${testName}: ${testResult ? '通过' : '失败'}`);
    }
    
    console.log(`\n总计: ${passedTests}/${totalTests} 个测试通过`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    
    if (passedTests === totalTests) {
        console.log("🎉 所有测试通过！");
    } else {
        console.log("⚠️  部分测试失败，请检查日志");
    }
    
    return results;
}

// 性能测试
function performanceTest() {
    console.log("\n🔬 开始性能测试");
    
    const testCount = 10;
    const times = [];
    
    for (let i = 0; i < testCount; i++) {
        const startTime = Date.now();
        const response = makeRequest(testConfig.baseUrl + "/ping", "GET");
        const endTime = Date.now();
        
        if (response && response.statusCode === 200) {
            times.push(endTime - startTime);
        }
        
        sleep(100); // 避免请求过于频繁
    }
    
    if (times.length > 0) {
        const avgTime = times.reduce(function(a, b) { return a + b; }, 0) / times.length;
        const minTime = Math.min.apply(Math, times);
        const maxTime = Math.max.apply(Math, times);
        
        console.log(`平均响应时间: ${avgTime.toFixed(2)}ms`);
        console.log(`最快响应时间: ${minTime}ms`);
        console.log(`最慢响应时间: ${maxTime}ms`);
    }
}

// 错误处理测试
function errorHandlingTest() {
    console.log("\n🚨 开始错误处理测试");
    
    const errorTests = [
        {
            name: "无效URL测试",
            url: "/invalid_url",
            method: "GET"
        },
        {
            name: "无效POST数据测试", 
            url: "/order",
            method: "POST",
            data: "invalid_json"
        }
    ];
    
    for (let i = 0; i < errorTests.length; i++) {
        const test = errorTests[i];
        console.log(`\n测试: ${test.name}`);
        const response = makeRequest(testConfig.baseUrl + test.url, test.method, test.data);
        
        if (response) {
            console.log(`状态码: ${response.statusCode}`);
            try {
                const data = JSON.parse(response.body.string());
                console.log(`响应: ${JSON.stringify(data)}`);
            } catch (e) {
                console.log(`响应解析失败: ${e}`);
            }
        } else {
            console.log("请求失败");
        }
    }
}

// 启动测试
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 环境
    module.exports = { runAllTests, performanceTest, errorHandlingTest };
} else {
    // AutoJS 环境
    console.log("在AutoJS环境中运行测试...");
    
    // 检查服务是否运行
    try {
        const pingResponse = http.get(testConfig.baseUrl + "/ping");
        if (pingResponse && pingResponse.statusCode === 200) {
            console.log("✅ 12306服务正在运行");
            runAllTests();
            // performanceTest();
            // errorHandlingTest();
        } else {
            console.error("❌ 12306服务未运行，请先启动服务");
        }
    } catch (e) {
        console.error("❌ 无法连接到12306服务:", e);
        console.log("请确保:");
        console.log("1. 12306_start.js 脚本正在运行");
        console.log("2. 服务监听端口 38080");
        console.log("3. 设备网络连接正常");
    }
}