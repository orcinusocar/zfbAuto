function extractFlightDetail(){
    let flightData = {
        basicInfo: {
            segments: []  // 多程航班信息
        },
        policies: [],
        priceCalendar: {},
        services: []
    };

    // 提取基本信息
    for (let c of allControls) {
        try{
            let desc = c.desc() || "";
            let text = c.text() || "";
            let id = c.id() || "";
            
            // 跳过空文本和无用控件
            if (!text || text.trim() === "" || text.length === 1) {
                continue;
            }

            // 基本信息提取
            if (desc.includes("列表页头部出发城市") || desc.includes("列表页头部到达城市")) {
                if (desc.includes("列表页头部出发城市")) {
                    flightData.basicInfo.departureCity = text;
                } else if (desc.includes("列表页头部到达城市")) {
                    flightData.basicInfo.arrivalCity = text;
                }
            }
            
            // 多程航班信息提取
            if (desc.includes("程") && (desc.includes("出发日期") || desc.includes("出发时间") || desc.includes("到达时间") || desc.includes("出发机场") || desc.includes("到达机场") || desc.includes("航班信息"))) {
                let segmentIndex = extractSegmentIndex(desc);
                if (segmentIndex > 0) {
                    let segment = flightData.basicInfo.segments[segmentIndex - 1] || {};
                    
                    if (desc.includes("出发日期")) {
                        segment.departureDate = text;
                    } else if (desc.includes("出发时间")) {
                        segment.departureTime = text;
                    } else if (desc.includes("到达时间")) {
                        segment.arrivalTime = text;
                    } else if (desc.includes("出发机场")) {
                        segment.departureAirport = text;
                    } else if (desc.includes("到达机场")) {
                        segment.arrivalAirport = text;
                    } else if (desc.includes("航班信息")) {
                        segment.flightNumber = text;
                    }
                    
                    flightData.basicInfo.segments[segmentIndex - 1] = segment;
                }
            }
            

            // 航班详细信息
            if (text.includes("正餐") || text.includes("空客") || text.includes("准点率")) {
                flightData.basicInfo.flightDetails = text;
            }

            // 公告信息
            if (desc.includes("公告位文案")) {
                flightData.basicInfo.notice = text;
            }

            // 价格政策提取
            if (desc.includes("政策") && desc.includes("运价编码")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.fareCode = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }
            
            if (desc.includes("政策") && desc.includes("成人价格金额")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.adultPrice = text.replace(/[^\d]/g, '');
                    flightData.policies[policyIndex - 1] = policy;
                }
            }
            
            if (desc.includes("政策") && desc.includes("退改信息1")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.baggageInfo = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }
            
            if (desc.includes("政策") && desc.includes("退改信息2")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.refundInfo = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }
            
            if (desc.includes("政策") && desc.includes("退改信息3")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.discountInfo = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }
            
            if (desc.includes("预订按钮") && !desc.includes("裸卖")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.bookButton = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }
            
            if (desc.includes("余票信息")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.remainingTickets = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }

            // 服务包信息
            if (desc.includes("政策") && desc.includes("浮层服务包文案")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.servicePackage = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }

            // 优惠券信息
            if (desc.includes("政策") && desc.includes("优惠券文案")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.couponInfo = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }

            // 推荐标题
            if (desc.includes("政策") && desc.includes("推荐标题")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    policy.recommendTitle = text;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }

            // 限制信息
            if (desc.includes("政策") && desc.includes("限制信息")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    if (!policy.restrictions) policy.restrictions = [];
                    policy.restrictions.push(text);
                    flightData.policies[policyIndex - 1] = policy;
                }
            }

            // 裸卖产品信息
            if (desc.includes("政策") && desc.includes("裸卖")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    if (!policy.bareProduct) policy.bareProduct = {};
                    if (desc.includes("副文案")) {
                        policy.bareProduct.subTitle = text;
                    } else if (desc.includes("子项文案")) {
                        if (!policy.bareProduct.items) policy.bareProduct.items = [];
                        policy.bareProduct.items.push(text);
                    }
                    flightData.policies[policyIndex - 1] = policy;
                }
            }

            // 选购产品信息
            if (desc.includes("政策") && desc.includes("选购") && desc.includes("产品")) {
                let policyIndex = extractPolicyIndex(desc);
                if (policyIndex > 0) {
                    let policy = flightData.policies[policyIndex - 1] || {};
                    if (!policy.optionalProducts) policy.optionalProducts = [];
                    let productIndex = extractProductIndex(desc);
                    let product = policy.optionalProducts[productIndex - 1] || {};
                    
                    if (desc.includes("金额名称")) {
                        product.name = text;
                    } else if (desc.includes("卖点")) {
                        if (!product.features) product.features = [];
                        product.features.push(text);
                    } else if (desc.includes("投保须知")) {
                        product.insuranceNotice = text;
                    }
                    
                    policy.optionalProducts[productIndex - 1] = product;
                    flightData.policies[policyIndex - 1] = policy;
                }
            }

            // 价格日历提取
            if (desc.includes("前一天最低价")) {
                flightData.priceCalendar.previousDayPrice = text.replace(/[^\d]/g, '');
            }
            
            if (desc.includes("当天最低价")) {
                flightData.priceCalendar.currentDayPrice = text.replace(/[^\d]/g, '');
            }
            
            if (desc.includes("后一天最低价")) {
                flightData.priceCalendar.nextDayPrice = text.replace(/[^\d]/g, '');
            }
            
            if (desc.includes("最低价") && !desc.includes("天")) {
                flightData.priceCalendar.otherDaysPrice = text.replace(/[^\d]/g, '');
            }

            // 价格日历日期信息
            if (desc.includes("前一天日期")) {
                flightData.priceCalendar.previousDayDate = text;
            }
            
            if (desc.includes("当天日期")) {
                flightData.priceCalendar.currentDayDate = text;
            }
            
            if (desc.includes("后一天日期")) {
                flightData.priceCalendar.nextDayDate = text;
            }

            // 更多价格信息
            if (desc.includes("更多价格金额")) {
                flightData.priceCalendar.morePriceAmount = text.replace(/[^\d]/g, '');
            }

            // 其他价格信息
            if (desc.includes("其他价格文案")) {
                flightData.priceCalendar.otherPriceText = text;
            }

            // 服务信息提取
            if (desc.includes("服务包") && desc.includes("描述")) {
                let serviceIndex = extractServiceIndex(desc);
                if (serviceIndex > 0) {
                    let service = flightData.services[serviceIndex - 1] || {};
                    service.description = text;
                    flightData.services[serviceIndex - 1] = service;
                }
            }

        }catch(e){
            //skip
        }
    }

    return {
        status: "success",
        message: "航班详情提取完成",
        data: flightData
    };
}

// 提取政策索引
function extractPolicyIndex(desc) {
    let match = desc.match(/第(\d+)个政策/);
    return match ? parseInt(match[1]) : 0;
}

// 提取服务索引
function extractServiceIndex(desc) {
    let match = desc.match(/第(\d+)个.*服务包/);
    return match ? parseInt(match[1]) : 0;
}

// 提取产品索引
function extractProductIndex(desc) {
    let match = desc.match(/第(\d+)个.*产品/);
    return match ? parseInt(match[1]) : 0;
}

// 提取航段索引
function extractSegmentIndex(desc) {
    let match = desc.match(/第(\d+)程/);
    return match ? parseInt(match[1]) : 0;
}

// 调用函数
let result = extractFlightDetail();
console.log("=== 携程机票详情提取结果 ===");
console.log(JSON.stringify(result, null, 2));