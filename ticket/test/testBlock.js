// 需要手动开启无障碍服务，前台服务，传输nanohttp，显示在其它屏幕前面
// 添加联系人
importPackage(Packages["okhttp3"]); 
importClass(android.content.Context);
importClass(android.provider.Settings);
importClass(java.util.concurrent.TimeUnit);
const autojs_package_name = "org.autojs.autoxjs.v6"
// const autojs_package_name = "com.script.ongo"
try {
    var enabledServices = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
    console.log('当前已启用的辅助服务\n', enabledServices);
    if (enabledServices != null && enabledServices.indexOf(autojs_package_name) >= 0 && auto.service != null) {
        console.log("已经开启无障碍服务，无需重复开启");
        } else {
        var Services = ""
        if(enabledServices == null) {
            Services = autojs_package_name + "/com.stardust.autojs.core.accessibility.AccessibilityService";
        } else {
            Services = enabledServices + ":" + autojs_package_name + "/com.stardust.autojs.core.accessibility.AccessibilityService";
        }
        Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, Services);
        Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED, '1');
        toastLog("成功开启AutoJS的辅助服务");
    }
} catch (error) {
    log(error)
    sendOnlineLog("error", "开启无障碍服务失败")
    //授权方法：开启usb调试并使用adb工具连接手机，执行 adb shell pm grant org.autojs.autojspro android.permission.WRITE_SECURE_SETTING
    toastLog("\n请确保已给予 WRITE_SECURE_SETTINGS 权限\n\n授权代码已复制，请使用adb工具连接手机执行(重启不失效)\n\n", error);
    setClip("adb shell pm grant" + autojs_package_name  + "android.permission.WRITE_SECURE_SETTINGS");
    threads.shutDownAll()
    engines.myEngine().forceStop();
}
try {
    if(autojs_package_name == "org.autojs.autoxjs.v6"){
        // auto.waitFor()
        runtime.loadJar("/sdcard/ly/nanohttpd-2.3.1.jar")
    } else {
        // auto.waitFor()
        runtime.loadJar("./nanohttpd-2.3.1.jar")
    }
} catch (error) {
    sendOnlineLog("error", error)
}
importPackage(Packages.fi.iki.elonen.util);
importPackage(Packages.fi.iki.elonen);

importClass("java.net.InetAddress");
importClass("java.net.NetworkInterface");
importClass("java.net.Inet6Address");

// http 服务的端口
const HttpPort = 38080
// 返回错误信息的url
const errUrl = "http://127.0.0.1:41781/error"
// 执行js的url接口
const execUrl = "http://127.0.0.1:41781/execJS"
// 通用超时时间
const timeout = 1000
// 尝试次数
const try_time_frequency_lite = 20
const try_time_frequency_normal = 50
const lite = "lite"
const normal = "normal"
// 在温馨提示中设置的结果
var global_result = 0
// 接受到的错误信息
var error_code = 0

// ========== JS假死监控 ==========
var jsFreezeMonitor = {
    lastUpdate: Date.now(),
    currentFunction: "",
    currentOperation: "",
    freezeThreshold: 30000,
    checkInterval: 5000,
    freezeRecords: [],
    operationRecords: []
};

function updateMonitorStatus(functionName, operation) {
    jsFreezeMonitor.lastUpdate = Date.now();
    jsFreezeMonitor.currentFunction = functionName;
    jsFreezeMonitor.currentOperation = operation;
}

function recordFreeze(duration, reason, location, troubleshooting) {
    var record = {
        time: Date.now(),
        duration: duration,
        reason: reason,
        location: location,
        troubleshooting: troubleshooting,
        function: jsFreezeMonitor.currentFunction,
        operation: jsFreezeMonitor.currentOperation
    };
    jsFreezeMonitor.freezeRecords.push(record);
    console.error("[JS假死检测] 检测到假死: " + duration + "ms");
    console.error("[JS假死检测] 位置: " + location);
    console.error("[JS假死检测] 原因: " + reason);
    console.error("[JS假死检测] 排查方法: " + troubleshooting);
    sendOnlineLog("error", "[JS假死] " + duration + "ms, " + location + ", " + reason);
}

function startJsFreezeMonitor() {
    if (jsFreezeMonitorThread != null) {
        return;
    }
    jsFreezeMonitor.lastUpdate = Date.now();
    jsFreezeMonitorThread = threads.start(function() {
        while (true) {
            var now = Date.now();
            var timeSinceLastUpdate = now - jsFreezeMonitor.lastUpdate;
            
            if (timeSinceLastUpdate > jsFreezeMonitor.freezeThreshold) {
                var reason = "脚本长时间未更新(" + timeSinceLastUpdate + "ms)";
                var location = jsFreezeMonitor.currentFunction + " -> " + jsFreezeMonitor.currentOperation;
                var troubleshooting = "1.检查函数是否在循环中卡死\n2.检查是否有大量UI控件导致find()方法阻塞\n3.检查是否需要添加超时机制\n4.考虑使用findOne()替代findOnce()";
                recordFreeze(timeSinceLastUpdate, reason, location, troubleshooting);
            }
            
            sleep(jsFreezeMonitor.checkInterval);
        }
    });
}

function stopJsFreezeMonitor() {
    if (jsFreezeMonitorThread != null) {
        jsFreezeMonitorThread.interrupt();
        jsFreezeMonitorThread = null;
    }
}

function getTroubleshootingTips(operationType, selector) {
    var tips = [];
    tips.push("1.检查页面是否已完全加载");
    
    if (operationType.indexOf("find") !== -1) {
        tips.push("2.检查页面控件数量是否过多(可能导致find()阻塞)");
        tips.push("3.考虑使用findOne(timeout)替代find()或findOnce()");
        tips.push("4.检查selector是否过于宽泛(如className(\"android.widget.Button\"))");
    }
    
    if (operationType.indexOf("日期") !== -1 || selector.indexOf("月") !== -1) {
        tips.push("5.检查日期格式是否正确(如\"月31日\"应该是\"月\" + 日期 + \"日\")");
        tips.push("6.检查是否需要滚动页面查看更多日期");
        tips.push("7.检查日期控件是否包含\"农历\"标识");
    }
    
    if (operationType.indexOf("车站") !== -1) {
        tips.push("5.检查车站名称是否正确");
        tips.push("6.检查是否需要等待搜索结果加载");
    }
    
    return tips.join("\n");
}

function printFreezeReport() {
    console.log("\n========== JS假死监控报告 ==========");
    console.log("检测到的假死次数: " + jsFreezeMonitor.freezeRecords.length);
    
    if (jsFreezeMonitor.freezeRecords.length > 0) {
        console.log("\n假死详情:");
        jsFreezeMonitor.freezeRecords.forEach(function(record, index) {
            console.log("\n[" + (index + 1) + "] 假死记录:");
            console.log("  时间: " + new Date(record.time).toLocaleString());
            console.log("  持续时长: " + record.duration + "ms");
            console.log("  函数: " + record.function);
            console.log("  操作: " + record.operation);
            console.log("  位置: " + record.location);
            console.log("  原因: " + record.reason);
            console.log("  排查方法:");
            var tips = record.troubleshooting.split("\n");
            tips.forEach(function(tip) {
                console.log("    " + tip);
            });
        });
        
        var maxDuration = jsFreezeMonitor.freezeRecords.reduce(function(max, record) {
            return Math.max(max, record.duration);
        }, 0);
        var avgDuration = jsFreezeMonitor.freezeRecords.reduce(function(sum, record) {
            return sum + record.duration;
        }, 0) / jsFreezeMonitor.freezeRecords.length;
        
        console.log("\n统计信息:");
        console.log("  最大假死时长: " + maxDuration + "ms");
        console.log("  平均假死时长: " + Math.round(avgDuration) + "ms");
    } else {
        console.log("未检测到JS假死");
    }
    console.log("=====================================\n");
}
// ========== JS假死监控 ==========

// 国家名称和简称表
const countryMap = [{id:"CN",value:"中国CHINA",pinyin:"ZhongGuoCHINA"},{id:"US",value:"美国UNITEDSTATES",pinyin:"MeiGuoUNITEDSTATES"},{id:"AF",value:"阿富汗AFGHANISTANA",pinyin:"AFuHanAFGHANISTANA"},{id:"AL",value:"阿尔巴尼亚ALBANIA",pinyin:"AErBaNiYaALBANIA"},{id:"DZ",value:"阿尔及利亚ALGERIA",pinyin:"AErJiLiYaALGERIA"},{id:"AD",value:"安道尔ANDORRA",pinyin:"AnDaoErANDORRA"},{id:"AO",value:"安哥拉ANGOLA",pinyin:"AnGeLaANGOLA"},{id:"AG",value:"安提瓜和巴布达ANTIGUABARBUDA",pinyin:"AnTiGuaHeBaBuDaANTIGUABARBUDA"},{id:"AE",value:"阿拉伯联合酋长国ARAB",pinyin:"ALaBoLianHeQiuChangGuoARAB"},{id:"AR",value:"阿根廷ARGENTINA",pinyin:"AGenTingARGENTINA"},{id:"AM",value:"亚美尼亚ARMENIA",pinyin:"YaMeiNiYaARMENIA"},{id:"AW",value:"阿鲁巴ARUBA",pinyin:"ALuBaARUBA"},{id:"AU",value:"澳大利亚AUSTRALIA",pinyin:"AoDaLiYaAUSTRALIA"},{id:"AT",value:"奥地利AUSTRIA",pinyin:"AoDiLiAUSTRIA"},{id:"AZ",value:"阿塞拜疆共和国AZERBAIJAN",pinyin:"ASaiBaiJiangGongHeGuoAZERBAIJAN"},{id:"BS",value:"巴哈马BAHAMAS",pinyin:"BaHaMaBAHAMAS"},{id:"BH",value:"巴林BAHRAIN",pinyin:"BaLinBAHRAIN"},{id:"BD",value:"孟加拉国BANGLADESH",pinyin:"MengJiaLaGuoBANGLADESH"},{id:"BB",value:"巴巴多斯BARBADOS",pinyin:"BaBaDuoSiBARBADOS"},{id:"BY",value:"白俄罗斯BELARUS",pinyin:"BaiELuoSiBELARUS"},{id:"BE",value:"比利时BELGIUM",pinyin:"BiLiShiBELGIUM"},{id:"BZ",value:"伯里兹BELIZE",pinyin:"BoLiZiBELIZE"},{id:"BZ",value:"伯利兹BELIZE",pinyin:"BoLiZiBELIZE"},{id:"BJ",value:"贝宁BENIN",pinyin:"BeiNingBENIN"},{id:"BT",value:"不丹BHUTAN",pinyin:"BuDanBHUTAN"},{id:"BO",value:"玻利维亚BOLIVIA",pinyin:"BoLiWeiYaBOLIVIA"},{id:"BA",value:"波斯尼亚和黑塞哥维那BOSNIA",pinyin:"BoSiNiYaHeHeiSaiGeWeiNaBOSNIA"},{id:"BW",value:"博茨瓦纳BOTSWANA",pinyin:"BoCiWaNaBOTSWANA"},{id:"BR",value:"巴西BRAZIL",pinyin:"BaXiBRAZIL"},{id:"BG",value:"保加利亚BULGARIA",pinyin:"BaoJiaLiYaBULGARIA"},{id:"BF",value:"布基纳法索BURKINAFASO",pinyin:"BuJiNaFaSuoBURKINAFASO"},{id:"BI",value:"布隆迪BURUNDI",pinyin:"BuLongDiBURUNDI"},{id:"BN",value:"文莱BruneiDarussalam",pinyin:"WenLaiBruneiDarussalam"},{id:"KH",value:"柬埔寨CAMBODIA",pinyin:"JianPuZhaiCAMBODIA"},{id:"CM",value:"喀麦隆CAMEROON",pinyin:"KaMaiLongCAMEROON"},{id:"CA",value:"加拿大CANADA",pinyin:"JiaNaDaCANADA"},{id:"KY",value:"佛得角CAPEVERDE",pinyin:"FuDeJiaoCAPEVERDE"},{id:"TD",value:"乍得CHAD",pinyin:"ZhaDeCHAD"},{id:"CL",value:"智利CHILE",pinyin:"ZhiLiCHILE"},{id:"CO",value:"哥伦比亚COLOMBIA",pinyin:"GeLunBiYaCOLOMBIA"},{id:"CO",value:"哥伦比亚COLUMBIA",pinyin:"GeLunBiYaCOLUMBIA"},{id:"KM",value:"科摩罗COMOROS",pinyin:"KeMoLuoCOMOROS"},{id:"CG",value:"刚果（布）CONGO",pinyin:"GangGuoBuCONGO"},{id:"CK",value:"库克群岛COOKISLANDS",pinyin:"KuKeQunDaoCOOKISLANDS"},{id:"CI",value:"科特迪瓦COTEDLVOIRE",pinyin:"KeTeDiWaCOTEDLVOIRE"},{id:"HR",value:"克罗地亚CROATIA",pinyin:"KeLuoDiYaCROATIA"},{id:"CU",value:"古巴共和国CUBA",pinyin:"GuBaGongHeGuoCUBA"},{id:"CY",value:"塞浦路斯CYPRUS",pinyin:"SaiPuLuSiCYPRUS"},{id:"CZ",value:"捷克共和国CZECHREPUBLIC",pinyin:"JieKeGongHeGuoCZECHREPUBLIC"},{id:"CF",value:"中非共和国Central Africa Republic",pinyin:"ZhongFeiGongHeGuoCentral-Africa-Republic"},{id:"CRC",value:"哥斯达黎加CostaRica",pinyin:"GeSiDaLiJiaCostaRica"},{id:"CD",value:"刚果（金）DEMOCRATIC REPUBLIC OF CONGO",pinyin:"GangGuoJinDEMOCRATIC-REPUBLIC-OF-CONGO"},{id:"YD",value:"也门民主人民共和国DEMOCRATICYEMEN",pinyin:"YeMenMinZhuRenMinGongHeGuoDEMOCRATICYEMEN"},{id:"DK",value:"丹麦DENMARK",pinyin:"DanMaiDENMARK"},{id:"DJ",value:"吉布提DJIBOUTI",pinyin:"JiBuTiDJIBOUTI"},{id:"DM",value:"多米尼克DOMINICA",pinyin:"DuoMiNiKeDOMINICA"},{id:"DO",value:"多米尼加DOMINICAN REPUBLIC",pinyin:"DuoMiNiJiaDOMINICAN-REPUBLIC"},{id:"EC",value:"厄瓜多尔ECUADOR",pinyin:"EGuaDuoErECUADOR"},{id:"EG",value:"埃及EGYPT",pinyin:"AiJiEGYPT"},{id:"EV",value:"萨尔瓦多EL SALVADOR",pinyin:"SaErWaDuoEL-SALVADOR"},{id:"GQ",value:"赤道几内亚EQUATORIALGUINEA",pinyin:"ChiDaoJiNaYaEQUATORIALGUINEA"},{id:"ER",value:"厄立特里亚ERITREA",pinyin:"ELiTeLiYaERITREA"},{id:"EE",value:"爱沙尼亚ESTONIA",pinyin:"AiShaNiYaESTONIA"},{id:"ET",value:"埃塞俄比亚ETHIOPIA",pinyin:"AiSaiEBiYaETHIOPIA"},{id:"FJ",value:"斐济FIJI",pinyin:"FeiJiFIJI"},{id:"FI",value:"芬兰FINLAND",pinyin:"FenLanFINLAND"},{id:"FR",value:"法国FRANCE",pinyin:"FaGuoFRANCE"},{id:"GA",value:"加蓬GABON",pinyin:"JiaPengGABON"},{id:"GM",value:"冈比亚GAMBIA",pinyin:"GangBiYaGAMBIA"},{id:"CE",value:"格鲁吉亚GEORGIA",pinyin:"GeLuJiYaGEORGIA"},{id:"DE",value:"德国GERMANY",pinyin:"DeGuoGERMANY"},{id:"GH",value:"加纳GHANA",pinyin:"JiaNaGHANA"},{id:"GR",value:"希腊GREECE",pinyin:"XiLaGREECE"},{id:"GL",value:"格林纳达GRENADA",pinyin:"GeLinNaDaGRENADA"},{id:"GN",value:"几内亚GUINEA",pinyin:"JiNaYaGUINEA"},{id:"GW",value:"几内亚比绍GUINEA-BISSAU",pinyin:"JiNaYaBiShaoGUINEA-BISSAU"},{id:"GW",value:"几内亚比绍GUINEABISSAU",pinyin:"JiNaYaBiShaoGUINEABISSAU"},{id:"GY",value:"圭亚那GUYANA",pinyin:"GuiYaNaGUYANA"},{id:"GT",value:"危地马拉Guatemala",pinyin:"WeiDiMaLaGuatemala"},{id:"HT",value:"海地HAITI",pinyin:"HaiDiHAITI"},{id:"NL",value:"荷兰HOLLAND",pinyin:"HeLanHOLLAND"},{id:"HN",value:"洪都拉斯HONDURAS",pinyin:"HongDuLaSiHONDURAS"},{id:"HU",value:"匈牙利HUNGARY",pinyin:"XiongYaLiHUNGARY"},{id:"IS",value:"冰岛ICELAND",pinyin:"BingDaoICELAND"},{id:"IN",value:"印度INDIA",pinyin:"YinDuINDIA"},{id:"ID",value:"印度尼西亚INDONESIA",pinyin:"YinDuNiXiYaINDONESIA"},{id:"IR",value:"伊朗IRAN",pinyin:"YiLangIRAN"},{id:"IQ",value:"伊拉克IRAQ",pinyin:"YiLaKeIRAQ"},{id:"IE",value:"爱尔兰IRELAND",pinyin:"AiErLanIRELAND"},{id:"IL",value:"以色列ISRAEL",pinyin:"YiSeLieISRAEL"},{id:"IT",value:"意大利ITALY",pinyin:"YiDaLiITALY"},{id:"JM",value:"牙买加JAMAICA",pinyin:"YaMaiJiaJAMAICA"},{id:"JP",value:"日本JAPAN",pinyin:"RiBenJAPAN"},{id:"JO",value:"约旦JORDAN",pinyin:"YueDanJORDAN"},{id:"KZ",value:"哈萨克斯坦KAZAKHSTAN",pinyin:"HaSaKeSiTanKAZAKHSTAN"},{id:"KE",value:"肯尼亚KENYA",pinyin:"KenNiYaKENYA"},{id:"KG",value:"吉尔吉斯共和国KIRGIZSTAN",pinyin:"JiErJiSiGongHeGuoKIRGIZSTAN"},{id:"KI",value:"基里巴斯KIRIBATI",pinyin:"JiLiBaSiKIRIBATI"},{id:"KR",value:"韩国ROK",pinyin:"HanGuoKOREA"},{id:"KW",value:"科威特KUWAIT",pinyin:"KeWeiTeKUWAIT"},{id:"DPR",value:"朝鲜Korea",pinyin:"ChaoXianKorea"},{id:"LA",value:"老挝LAOS",pinyin:"LaoWoLAOS"},{id:"LV",value:"拉脱维亚LATVIA",pinyin:"LaTuoWeiYaLATVIA"},{id:"LB",value:"黎巴嫩LEBANON",pinyin:"LiBaNenLEBANON"},{id:"LS",value:"莱索托LESOTHO",pinyin:"LaiSuoTuoLESOTHO"},{id:"LR",value:"利比里亚LIBERIA",pinyin:"LiBiLiYaLIBERIA"},{id:"LY",value:"利比亚LIBYA",pinyin:"LiBiYaLIBYA"},{id:"LI",value:"列支敦士登LIECHTENSTEIN",pinyin:"LieZhiDunShiDengLIECHTENSTEIN"},{id:"LT",value:"立陶宛LITHUANIA",pinyin:"LiTaoWanLITHUANIA"},{id:"LU",value:"卢森堡LUXEMBOURG",pinyin:"LuSenBaoLUXEMBOURG"},{id:"MK",value:"马其顿MACEDONIA",pinyin:"MaQiDunMACEDONIA"},{id:"MG",value:"马达加斯加MADAGASCAR",pinyin:"MaDaJiaSiJiaMADAGASCAR"},{id:"MW",value:"马拉维MALAWI",pinyin:"MaLaWeiMALAWI"},{id:"MY",value:"马来西亚MALAYSIA",pinyin:"MaLaiXiYaMALAYSIA"},{id:"MV",value:"马尔代夫MALDIVES",pinyin:"MaErDaiFuMALDIVES"},{id:"ML",value:"马里MALI",pinyin:"MaLiMALI"},{id:"MT",value:"马耳他MALTA",pinyin:"MaErTaMALTA"},{id:"MH",value:"马绍尔群岛MARSHALL ISLANDS",pinyin:"MaShaoErQunDaoMARSHALL-ISLANDS"},{id:"MR",value:"毛里塔尼亚MAURITANIA",pinyin:"MaoLiTaNiYaMAURITANIA"},{id:"MU",value:"毛里求斯MAURITIUS",pinyin:"MaoLiQiuSiMAURITIUS"},{id:"MX",value:"墨西哥MEXICO",pinyin:"MoXiGeMEXICO"},{id:"FM",value:"密克罗尼西亚联邦MICRONESIA",pinyin:"MiKeLuoNiXiYaLianBangMICRONESIA"},{id:"MD",value:"摩尔多瓦MOLDOVA",pinyin:"MoErDuoWaMOLDOVA"},{id:"MC",value:"摩纳哥MONACO",pinyin:"MoNaGeMONACO"},{id:"MN",value:"蒙古MONGOLIA",pinyin:"MengGuMONGOLIA"},{id:"ME",value:"黑山MONTENEGRO",pinyin:"HeiShanMONTENEGRO"},{id:"MA",value:"摩洛哥MOROCCO",pinyin:"MoLuoGeMOROCCO"},{id:"MZ",value:"莫桑比克MOZAMBIQUE",pinyin:"MoSangBiKeMOZAMBIQUE"},{id:"MM",value:"缅甸MYANMAR",pinyin:"MianDianMYANMAR"},{id:"NA",value:"纳米比亚NAMIBIA",pinyin:"NaMiBiYaNAMIBIA"},{id:"NR",value:"瑙鲁NAURU",pinyin:"NaoLuNAURU"},{id:"NP",value:"尼泊尔NEPAL",pinyin:"NiBoErNEPAL"},{id:"NZ",value:"新西兰NEWZEALAND",pinyin:"XinXiLanNEWZEALAND"},{id:"NI",value:"尼加拉瓜NICARAGUA",pinyin:"NiJiaLaGuaNICARAGUA"},{id:"NE",value:"尼日尔NIGER",pinyin:"NiRiErNIGER"},{id:"NG",value:"尼日利亚NIGERIA",pinyin:"NiRiLiYaNIGERIA"},{id:"NO",value:"挪威NORWAY",pinyin:"NuoWeiNORWAY"},{id:"OM",value:"阿曼OMAN",pinyin:"AManOMAN"},{id:"PK",value:"巴基斯坦PAKISTAN",pinyin:"BaJiSiTanPAKISTAN"},{id:"PW",value:"帕劳PALAU",pinyin:"PaLaoPALAU"},{id:"BL",value:"巴勒斯坦PALESTINE",pinyin:"BaLeSiTanPALESTINE"},{id:"PA",value:"巴拿马PANAMA",pinyin:"BaNaMaPANAMA"},{id:"PG",value:"巴布亚新几内亚PAPUANEWGUINEA",pinyin:"BaBuYaXinJiNaYaPAPUANEWGUINEA"},{id:"PY",value:"巴拉圭PARAGUAY",pinyin:"BaLaGuiPARAGUAY"},{id:"PE",value:"秘鲁PERU",pinyin:"MiLuPERU"},{id:"PH",value:"菲律宾PHILIPPINES",pinyin:"FeiLvBinPHILIPPINES"},{id:"PL",value:"波兰POLAND",pinyin:"BoLanPOLAND"},{id:"PT",value:"葡萄牙PORTUGAL",pinyin:"PuTaoYaPORTUGAL"},{id:"PR",value:"波多黎各PUERTO RICO",pinyin:"BoDuoLiGePUERTO-RICO"},{id:"QA",value:"卡塔尔QATAR",pinyin:"KaTaErQATAR"},{id:"RO",value:"罗马尼亚ROMANIA",pinyin:"LuoMaNiYaROMANIA"},{id:"RU",value:"俄罗斯RUSSIA",pinyin:"ELuoSiRUSSIA"},{id:"RW",value:"卢旺达RWANDA",pinyin:"LuWangDaRWANDA"},{id:"KNA",value:"圣基茨和尼维斯SAINT KITTS",pinyin:"ShengJiCiHeNiWeiSiSAINT-KITTS"},{id:"VC",value:"圣文森特和格林纳丁斯SAINT VINCENT AND THE GRENADIN",pinyin:"ShengWenSenTeHeGeLinNaDingSiSAINT-VINCENT-AND-THE-GRENADIN"},{id:"LC",value:"圣卢西亚SAINTLUCIA",pinyin:"ShengLuXiYaSAINTLUCIA"},{id:"WS",value:"美属萨摩亚SAMOA",pinyin:"MeiShuSaMoYaSAMOA"},{id:"SM",value:"圣马力诺SANMARINO",pinyin:"ShengMaLiNuoSANMARINO"},{id:"ST",value:"圣多美和普林西比SAOTOMEPRINCIPE",pinyin:"ShengDuoMeiHePuLinXiBiSAOTOMEPRINCIPE"},{id:"SA",value:"沙特阿拉伯SAUDIARABIA",pinyin:"ShaTeALaBoSAUDIARABIA"},{id:"SN",value:"塞内加尔SENEGAL",pinyin:"SaiNaJiaErSENEGAL"},{id:"CS",value:"塞尔维亚SERBIA",pinyin:"SaiErWeiYaSERBIA"},{id:"SC",value:"塞舌尔SEYCHELLES",pinyin:"SaiSheErSEYCHELLES"},{id:"SL",value:"塞拉利昂SIERRALEONE",pinyin:"SaiLaLiAngSIERRALEONE"},{id:"SG",value:"新加坡SINGAPORE",pinyin:"XinJiaPoSINGAPORE"},{id:"SK",value:"斯洛伐克SLOVAKIA",pinyin:"SiLuoFaKeSLOVAKIA"},{id:"SK",value:"斯洛伐克共和国SLOVAKREPUBLIC",pinyin:"SiLuoFaKeGongHeGuoSLOVAKREPUBLIC"},{id:"SI",value:"斯洛文尼亚SLOVENIA",pinyin:"SiLuoWenNiYaSLOVENIA"},{id:"SB",value:"所罗门群岛SOLOMON ISLANDS",pinyin:"SuoLuoMenQunDaoSOLOMON-ISLANDS"},{id:"SO",value:"索马里SOMALI",pinyin:"SuoMaLiSOMALI"},{id:"SO",value:"索马里SOMALIA",pinyin:"SuoMaLiSOMALIA"},{id:"ZA",value:"南非SOUTHAFRICA",pinyin:"NanFeiSOUTHAFRICA"},{id:"ES",value:"西班牙SPAIN",pinyin:"XiBanYaSPAIN"},{id:"LK",value:"斯里兰卡SRILANKA",pinyin:"SiLiLanKaSRILANKA"},{id:"SD",value:"苏丹SUDAN",pinyin:"SuDanSUDAN"},{id:"SR",value:"苏里南SURINAM",pinyin:"SuLiNanSURINAM"},{id:"SZ",value:"斯威士兰SWAZILAND",pinyin:"SiWeiShiLanSWAZILAND"},{id:"SE",value:"瑞典SWEDEN",pinyin:"RuiDianSWEDEN"},{id:"CH",value:"瑞士SWITZERLAND",pinyin:"RuiShiSWITZERLAND"},{id:"SY",value:"叙利亚SYRIA",pinyin:"XuLiYaSYRIA"},{id:"TJ",value:"塔吉克斯坦TAJIKISTAN",pinyin:"TaJiKeSiTanTAJIKISTAN"},{id:"TZ",value:"坦桑尼亚TANZANIA",pinyin:"TanSangNiYaTANZANIA"},{id:"TH",value:"泰国THAILAND",pinyin:"TaiGuoTHAILAND"},{id:"UGA",value:"乌干达THE REPUBLIC OF UGANDA",pinyin:"WuGanDaTHE-REPUBLIC-OF-UGANDA"},{id:"TL",value:"东帝汶TIMOR",pinyin:"DongDiWenTIMOR"},{id:"TG",value:"多哥TOGO",pinyin:"DuoGeTOGO"},{id:"TO",value:"汤加TONGA",pinyin:"TangJiaTONGA"},{id:"TT",value:"特立尼达和多巴哥TRINIDADANDTOBAGO",pinyin:"TeLiNiDaHeDuoBaGeTRINIDADANDTOBAGO"},{id:"TN",value:"突尼斯TUNISIA",pinyin:"TuNiSiTUNISIA"},{id:"TR",value:"土耳其TURKEY",pinyin:"TuErQiTURKEY"},{id:"TM",value:"土库曼斯坦TURKMENISTAN",pinyin:"TuKuManSiTanTURKMENISTAN"},{id:"UKR",value:"乌克兰UKRAINE",pinyin:"WuKeLanUKRAINE"},{id:"GB",value:"英国UNITED KINGDOM",pinyin:"YingGuoUNITED-KINGDOM"},{id:"UZB",value:"乌兹别克斯坦UZBEKISTAN",pinyin:"WuZiBieKeSiTanUZBEKISTAN"},{id:"UY",value:"乌拉圭Uruguay",pinyin:"WuLaGuiUruguay"},{id:"VU",value:"瓦努阿图VANUATU",pinyin:"WaNuATuVANUATU"},{id:"VA",value:"梵蒂冈VATICAN",pinyin:"FanDiGangVATICAN"},{id:"VIE",value:"越南VIETNAM",pinyin:"YueNanVIETNAM"},{id:"VE",value:"委内瑞拉Venezuela",pinyin:"WeiNaRuiLaVenezuela"},{id:"ZM",value:"赞比亚ZAMBIA",pinyin:"ZanBiYaZAMBIA"},{id:"ZW",value:"津巴布韦ZIMBABWE",pinyin:"JinBaBuWeiZIMBABWE"}]
// 车票类型和简称表
const ticketShorcutMap = {
    "0": "棚车",
    "1": "硬座",
    "1_none": "硬座",
    "2": "软座",
    "3": "硬卧",
    "4": "软卧",
    "5": "包厢硬卧",
    "6": "高级软卧",
    "7": "一等软",
    "8": "二等软",
    "9": "商务",
    "A": "高级动卧",
    "B": "混编硬座",
    "C": "混编硬卧",
    "D": "包厢软座",
    "E": "特等软座",
    "F": "动卧",
    "G": "二人软包",
    "H": "一人软包",
    "I": "一等卧",
    "J": "二等卧",
    "K": "混编软座",
    "L": "混编软卧",
    "M": "一等",
    "O": "二等",
    "O_none": "二等",
    "P": "特等",
    "Q": "多功能",
    "S": "二等包"
}
// id类型
const idTypeMap = {
    "0": '中国居民身份证',
    "1": '中国居民身份证',
    "2": '一代身份证',
    "C": '港澳居民来往内地通行证',
    "G": '台湾居民来往大陆通行证',
    "B": '护照',
    "H": '外国人永久居留身份证'  
}
// 车票类型
const passengerTypeMap = {
    1: "成人",
    2: "儿童",
    3: "学生",
    4: "残军"
}

// 
// 错误信息和状态码对应
const errorMaps_actual = {
    0: "成功",
    1: "12306未安装",
    2: "没法返回home界面",
    3: "没法设置始发站",
    4: "没法设置到达站",
    5: "没法设置日期",
    6: "车次未找到，任务失败",
    7: "需要登录",
    8: "余票不足",
    9: "没有找到坐席",
    10: "实际乘车人和已经添加的乘车人不符合",
    11: "没有找到选择乘车人按钮",
    12: "没有找到确认订单页面",
    13: "选择乘客后没法进入确认订单页面",
    14: "确认订单后没法进入未完成页面",
    15: "放弃后未进入底部的订单页面",
    16: "目前您还有未处理的订单，请您到[未完成订单]进行处理!",
    17: "启动后没法进入home界面",
    18: "没法找到查询车票按钮",
    19: "查询后没进入火车列表页面",
    20: "没法进入选择乘客界面",
    21: "存在与本次购票行程冲突的车票",
    22: "已被法院依法限制高消费，限制乘坐G字头列车",
    23: "请及时采集学生资质",
    24: "出票失败",
    240: "出票失败",
    25: "身份未通过",
    26: "已购本趟列车车票，您此次购票需要占用原供镇江站至南京站旅客使用的运输能力，系统将按延长乘车区间为您办理，不收取手续费。",
    27: "本次列车已无满足您需求的",
    28: "余票不足",
    29: "本次申请席位的结果为硬卧代硬座，请确认",
    30: "已订车票与本次所购车票两车间隔时间较短",
    31: "您的请求已在处理中，请在未完成订单中查询订单状态",
    32: "受车站施工改造影响",
    33: "网络无法连接",
    34: "您的请求过于频繁，请稍后重试",
    35: "没法修改乘车人类型",
    36: "余票不足",
    37: "排队后无法进入支付界面",
    40: "没法找到到乘车人按钮",
    41: "没法导航到乘车人页面",
    42:"没法找到添加乘车人按钮",
    43:"没法导航到添加乘车人页面",
    44:"没法找到下一步按钮",
    45:"没法导航到联系方式核验页面",
    46: "没法找到删除按钮",
    47: "乘车人不存在",
    48: "与已购车票行程无法衔接",
    49:"排队人数现已超过余票数",
    50: "请输入正确的身份证号！",
    51: "请填写姓名",
    52: "该联系人已存在，请使用不同的姓名和证件。",
    53: "日前不允许删除",
    54: "请输入有效的手机号码。",
    55: "请选择您的证件有效期截止日期",
    56: "请输入正确的身份证号",
    57: "请输入有效的港澳居民通行证号码",
    58: "请输入有效的台湾居民通行证号码",
    59: "姓名只能包含英文或者空格",
    60: "添加乘车人成功",
    61: "您的账号尚未通过身份信息核验，不可购票，详见《铁路互联网购票身份核验须知》。(M0013)",
    62: "该车次在互联网已停止办理业务！(M0013)",
    63: "身份待核验",
    64: "为了保障您的个人信息安全，请您购票前在“我的12306”的“账号安全”中选择“手机核验”，核验后再请办理购票业务，谢谢您的支持。(M0013)",
    65: "请求次数过多，验证码已失效，请重新获取。",
    68: "余票不足",
    69: "余票不足",
    70: "乘车人联系方式格式错误，请完善联系方式。(M0013)",
    101: "没法导航到我的页面",
    102: "没法导航登录页面1",
    103: "没法导航登录页面2",
    104: "没法找到登录按钮",
    105: "没法找到退出登录按钮2",
    106: "没法找到登录按钮",
    107: "登录失败，原因未知",
    108: "在信息验证界面没有找到完成校验按钮",
    109: "手机验证码错误",
    110: "发送短信666至12306",
    111: "您的短信验证码已失效，请重新获取",
    112: "您的密码很久没有修改了，为降低安全风险，请您重新设置密码后再登录",
    113: "乘车人需要手机验证",
    114: "很抱歉，当日该车次票已售完",
    115: "排队中",
    116: "目前排队人数已经超过余票张数，请您选择其他席别或车次",
    117: "系统忙，请稍后再试（C0001）",
    118: "用户名或密码错误",
    119: "该账户已被注销，您可继续注册成为12306用户。",
    120: "您的用户已经被锁定",
    121: "很抱歉，您输入的短信验证码有误",
    122: "找到退出登录按钮",
    123: "账号人脸认证",
    124: "用户核验成功",
    125: "未满14周岁，可购买儿童票",
    200: "没有找到添加乘车人按钮",
    201: "没有找到证件类型按钮",
    202: "没有找到证件类型",
    241:"quick order"
}

const errorMaps = {
    0: "成功",
    1: "12306未安装",
    2: "30秒检测JS假死到时",
    3: "30秒检测JS假死到时",
    4: "30秒检测JS假死到时",
    5: "30秒检测JS假死到时",
    6: "车次未找到，任务失败",
    7: "需要登录",
    8: "余票不足",
    9: "没有找到坐席",
    10: "实际乘车人和已经添加的乘车人不符合",
    11: "30秒检测JS假死到时",
    12: "30秒检测JS假死到时",
    13: "30秒检测JS假死到时",
    14: "30秒检测JS假死到时",
    15: "30秒检测JS假死到时",
    16: "目前您还有未处理的订单，请您到[未完成订单]进行处理!",
    17: "30秒检测JS假死到时",
    18: "30秒检测JS假死到时",
    19: "30秒检测JS假死到时",
    20: "30秒检测JS假死到时",
    21: "存在与本次购票行程冲突的车票",
    22: "已被法院依法限制高消费，限制乘坐G字头列车",
    23: "请及时采集学生资质",
    24: "出票失败",
    240: "出票失败",
    25: "身份未通过",
    26: "已购本趟列车车票，您此次购票需要占用原供镇江站至南京站旅客使用的运输能力，系统将按延长乘车区间为您办理，不收取手续费。",
    27: "本次列车已无满足您需求的",
    28: "余票不足",
    29: "本次申请席位的结果为硬卧代硬座，请确认",
    30: "已订车票与本次所购车票两车间隔时间较短",
    31: "您的请求已在处理中，请在未完成订单中查询订单状态",
    32: "受车站施工改造影响",
    33: "网络无法连接",
    34: "您的请求过于频繁，请稍后重试",
    35: "30秒检测JS假死到时",
    36: "余票不足",
    37: "订单排队中",
    40: "30秒检测JS假死到时",
    41: "30秒检测JS假死到时",
    43: "30秒检测JS假死到时",
    44: "30秒检测JS假死到时",
    45: "30秒检测JS假死到时",
    46: "30秒检测JS假死到时",
    47: "乘车人不存在",
    48: "与已购车票行程无法衔接",
    49:"排队人数现已超过余票数",
    50: "请输入正确的身份证号！",
    51: "30秒检测JS假死到时",
    52: "该联系人已存在，请使用不同的姓名和证件",
    53: "日前不允许删除",
    54: "请输入有效的手机号码。",
    55: "请选择您的证件有效期截止日期",
    56: "请输入正确的身份证号",
    57: "请输入有效的港澳居民通行证号码",
    58: "请输入有效的台湾居民通行证号码",
    59: "姓名只能包含英文或者空格", 
    60: "添加乘车人成功",
    61: "您的账号尚未通过身份信息核验，不可购票，详见《铁路互联网购票身份核验须知》。(M0013)",
    62:"该车次在互联网已停止办理业务！(M0013)",
    63:"身份待核验",
    64: "为了保障您的个人信息安全，请您购票前在“我的12306”的“账号安全”中选择“手机核验”，核验后再请办理购票业务，谢谢您的支持。(M0013)",
    65: "请求次数过多，验证码已失效，请重新获取。",
    68: "余票不足",
    69: "余票不足",
    70: "乘车人联系方式格式错误，请完善联系方式。(M0013)",
    101: "30秒检测JS假死到时",
    102: "30秒检测JS假死到时",
    103: "30秒检测JS假死到时",
    104: "30秒检测JS假死到时",
    105: "30秒检测JS假死到时",
    106: "30秒检测JS假死到时",
    107: "30秒检测JS假死到时",
    108: "30秒检测JS假死到时",
    109: "手机验证码错误",
    110: "发送短信666至12306",
    111: "您的短信验证码已失效，请重新获取",
    112: "您的密码很久没有修改了，为降低安全风险，请您重新设置密码后再登录",
    113: "乘车人需要手机验证",
    114: "很抱歉，当日该车次票已售完",
    115: "排队中",
    116: "目前排队人数已经超过余票张数，请您选择其他席别或车次",
    117: "系统忙，请稍后再试（C0001）",
    118: "用户名或密码错误",
    119: "该账户已被注销，您可继续注册成为12306用户。",
    120: "您的用户已经被锁定",
    121: "很抱歉，您输入的短信验证码有误",
    122: "找到退出登录按钮",
    123:"账号人脸认证",
    124: "用户核验成功",
    125: "未满14周岁，可购买儿童票",
    200: "30秒检测JS假死到时",
    201: "30秒检测JS假死到时",
    202: "30秒检测JS假死到时",
    241:"quick order"
}

const errorMaps2 = {
    0: "成功",
    1: "网络无法连接",
    2: "设备封禁"
}
// 是否显示控制台
const isShowConsole = true
// 日志和截屏目录
const logPath = "/sdcard/ly/log/"

// 点击温馨提示的线程是否再运行中
var clickTipThread = null
var clickTipThread2 = null
var clickTipThread3 = null
var clickRetryView = null
var clickCancelUpdateThread = null
var checkWaitResultThread = null
var clickAccessibilityThread = null
var clickPermissionDialogThread = null
var clickFengKongThread = null
var checkNeedLoginThread = null
var checkQuickOrderThread = null

var workThread = null
var jsFreezeMonitorThread = null
var isWait = false     // 是否在排队等待中
var latestTimestampReceivePing = Math.ceil(new Date().getTime() / 1000)
var userName = "", userPasswd = "", smsCode = ""
var needSmsVerify = false
var departStaName = "", arriveStaName = ""
// 站点首拼音缩写，"Hs" "Tg"
var departStaShorcut = departStaName,  arriveStaShorcut = arriveStaName
var departDate = "", departSpecifiedDate= departDate.split("-")[2]
var theTrain = "", theTrainFormat = theTrain.split('').join(' ')
var need_verify_user = ""
var passengers = []
var passenger_names = []
var passenger_identity_types = []
var traverllers_identity_nos = []
var traverllers_passenger_type = []
var traverllers_modified_passenger_type = {}

var current_work = ""
var crud_passenger = {}
var isInOrdering = false
var seatNos = []
var ticketType = ""
var has_seat = true
// "G 1 3 5 0"
var taskId = ""
var latestTaskId = ""
var lock = threads.lock()
var lock2 = threads.lock()
var runningTaskThread = null
// 设置每天重启
var needRestart = true
var startCount = 0

var width = device.width
var height = device.height
console.log(width, height)
setScreenMetrics(width, height);
var aes_key = new java.lang.String("password12345678");
var intervalId = 0
var is_pay_by_point = false

// 新线程中启动控制台
// threads.start(function () {
//     if (isShowConsole) {
//         console.show(true);
//         console.setSize(width - 50, height / 3);
//     }
// });
// 设置日志
// 写入的日志级别，默认为"ALL"（所有日志），可以为"OFF"(关闭), "DEBUG", "INFO", "WARN", "ERROR", "FATAL
// const logName = logPath + "12306_" + GetDateTimeToString() + ".log"
// console.log("日志为：" + logName)
// console.setGlobalLogConfig({
//     "file": logName,
//     "maxFileSize": 16 * 1024 * 1024,
//     "rootLevel": "DEBUG",
//     "maxBackupSize": 5
// });
// doRequestScreenCapturePermission()

// try {
var myApp = {
    serve: function(session) {
        var method = session.getMethod();
        var uri = session.getUri();
        if(method.toString() == "GET") {
            var result = {}
            if(uri.indexOf("quit") !== -1) {
                myObject.stop()
                // var id = getPid()
                // console.log("pid " + id)
                try {
                    clearInterval(intervalId)
                } catch(e) {
                    console.log(e)
                }
                threads.shutDownAll()
                engines.myEngine().forceStop();
            } else if(uri.indexOf("ping") !== -1) {
                latestTimestampReceivePing = Math.ceil(new Date().getTime() / 1000)
                // console.log("ping")
                result = {"code":0, "msg":"success", "data":"心跳"};
            } else if(uri.indexOf("restart") !== -1) {
                restart12306()
                result = {"code":0, "msg":"success", "data":"restart"};
            } else if(uri.indexOf("start0") !== -1) {
                start12306()
                result = {"code":0, "msg":"success", "data":"start"};
            } else if(uri.indexOf("kill") !== -1) {
                kill12306()
                result = {"code":0, "msg":"success", "data":"start"};
            }  else if(uri.indexOf("clear") !== -1) {
                clear_data()
                result = {"code":0, "msg":"success", "data":"clear"};
            } else {
                result = {"code":0, "msg":"fail", "data":"无效的请求"};
            }
            return NanoHTTPD.newFixedLengthResponse(NanoHTTPD$Response$Status.OK, "application/json;charset=utf-8", JSON.stringify(result))
        } else if(method.toString() == "POST") {
            // console.info("do " + uri + "!");
            console.log("method: " + method + ", uri " + uri)
            // var inStream = session.getInputStream()
            // // if(inStream.available() > 0) {
            // console.verbose("available " + inStream.available());
            var files = new java.util.HashMap()
            session.parseBody(files);
            var info = files.get("postData")
            console.verbose("content: " + info)
            var infoObject = JSON.parse(info)  
            sendOnlineLog("info", uri + " " + info)
            if(uri.indexOf("order") !== -1 || uri.indexOf("login") !== -1 || uri.indexOf("crudPassenger") !== -1) {
                runningTaskThread = threads.start(function(){
                // if(runningTask != "") {
                //     runningTaskThread.interrupt()
                //     console.log("结束任务runningTask " + runningTask)
                //     sendOnlineLog("结束任务runningTask " + runningTask)
                // }
                    lock2.lock()
                    latestTaskId = infoObject.id + "_" + Date.now()
                    lock2.unlock()
                    lock.lock()
                    var runningTask = taskId
                    lock.unlock()
                    var sleepCount = 0
                    while(runningTask != "") {
                        sleep(1000 * 5)
                        console.log("等待任务runningTask " + runningTask + " 结束")
                        sendOnlineLog("info", "等待任务runningTask " + runningTask + " 结束")
                        lock.lock()
                        runningTask = taskId
                        lock.unlock()
                        sleepCount++
                        if(sleepCount > 2) {
                            workThread.interrupt()
                            console.log("结束任务runningTask " + runningTask)
                            sendOnlineLog("info", "结束任务runningTask " + runningTask)
                            break
                        }
                    }
                    taskId = latestTaskId
                    need_verify_user = ""
                    global_result = 0
                    error_code = 0
                    current_work = ""
                    crud_passenger = {}
                    has_seat = true
                    workThread = null

                    if(uri.indexOf("order") !== -1) {
                        isWait = false
                        // get the order detail
                        // C7413  三 亚
                        departStaShorcut = infoObject.query.depart_station
                        arriveStaShorcut = infoObject.query.arrive_station
                        departStaName = infoObject.query.depart_station.split(' ').join('')
                        arriveStaName = infoObject.query.arrive_station.split(' ').join('')
                        departDate = infoObject.query.depart_date
                        departSpecifiedDate= departDate.split("-")[2]
                        if(departSpecifiedDate[0] === "0") {
                            departSpecifiedDate = departSpecifiedDate.substring(1)
                        }
                        departSpecifiedDate = "月" + departSpecifiedDate + "日"
                        theTrain = infoObject.order.code
                        theTrainFormat = theTrain.split('').join(' ')
                        passenger_names = []
                        passenger_identity_types = []
                        traverllers_identity_nos = []
                        traverllers_passenger_type = []
                        passengers = infoObject.order.passengers
                        infoObject.order.passengers.forEach(function(i){ passenger_names = passenger_names.concat(i.passenger_name)})
                        infoObject.order.passengers.forEach(function(i){ passenger_identity_types = passenger_identity_types.concat(i.identity_type)})
                        infoObject.order.passengers.forEach(function(i){ traverllers_identity_nos = traverllers_identity_nos.concat(i.identity_no.split('').join(' '))})
                        // infoObject.order.passengers.forEach(function(i){ traverllers_identity_nos = traverllers_identity_nos.concat(i.identity_no)})
                        infoObject.order.passengers.forEach(function(i){ traverllers_passenger_type = traverllers_passenger_type.concat(i.passenger_type)})
                        traverllers_modified_passenger_type = {}
                        seatNos = infoObject.order.seat_no
                        ticketType = infoObject.order.seat_type_code
                        has_seat = infoObject.order.has_seat
                        is_pay_by_point = infoObject.order.is_pay_by_point
                        // sendOnlineLog("info",  "order_" + infoObject.login.username + "_" + infoObject.id)
                        // order ticket
                        workThread = threads.start(function () {
                            startJsFreezeMonitor();
                            try {
                                var currentTask = taskId
                                console.info("开始下单, 任务id " + taskId);
                                sendOnlineLog("info", "开始下单, 任务id " + taskId)
                                isInOrdering = false
                                var result = doMainProcess()
                                isInOrdering = false

                                if(error_code != 0) {
                                    try {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        // if(newestTaskId == currentTask) {
                                        //     r = http.postJson(errUrl, {
                                        //         code: error_code,
                                        //         msg: "fail",
                                        //         data: errorMaps2[error_code],
                                        //     });
                                        // }
                                        var send_body = {
                                                    code: error_code,
                                                    msg: "fail",
                                                    data: errorMaps2[error_code],
                                                };
                                            my_http_post(send_body, error_code);
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                        sendOnlineLog("error", "Exception when posting error result " + result + ",  " + e)
                                    }
                                    finally {
                                        console.info("taskId " + taskId + ", error_code " + error_code + ", " + errorMaps2[error_code])
                                        sendOnlineLog("info", "taskId " + taskId + ", error_code " + error_code + ", " + errorMaps2[error_code])    
                                        error_code = 0;
                                        global_result = 0;
                                        lock.lock()
                                        taskId = "";
                                        lock.unlock()
                                        stopJsFreezeMonitor();
                                        return
                                    }
                                }
                                // 26 
                                if(global_result != 0 && global_result != 26 && global_result != 241) {
                                    try {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                            // r = http.postJson(errUrl, {
                                            //     code: global_result,
                                            //     msg: "fail",
                                            //     data: errorMaps[global_result],
                                            // });
                                            var send_body = {
                                                code: global_result,
                                                msg: "fail",
                                                data: errorMaps[global_result],
                                            };
                                            my_http_post(send_body, global_result);
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                        sendOnlineLog("error", "Exception when posting error result " + result + ",  " + e)
                                    }
                                    finally {
                                        console.info("taskId " + taskId + ", global_result " + global_result + ", " + errorMaps[global_result])
                                        sendOnlineLog("info", "taskId " + taskId + ", global_result " + global_result + ", " + errorMaps[global_result] + ", " + errorMaps_actual[global_result])
                                        global_result = 0;
                                        lock.lock()
                                        taskId = "";
                                        lock.unlock()
                                        stopJsFreezeMonitor();
                                        return
                                    }
                                }
                                console.info("taskId " + taskId + ", result " + result + ", " + errorMaps_actual[result])
                                sendOnlineLog("info", "taskId " + taskId + ", result " + result + ", "  + errorMaps[result] + ", " + errorMaps_actual[result])
                                if(result == 6) {
                                    errorMaps[result] = "车次" + theTrain + "未找到，任务失败！"
                                }
                                var errorPost = 0
                                if(result != 0) {
                                    try {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                            // r = http.postJson(errUrl, {
                                            //     code: result,
                                            //     msg: "fail",
                                            //     data: errorMaps[result],
                                            // });
                                            var send_body = {
                                                code: result,
                                                msg: "fail",
                                                data: errorMaps[result],
                                            };
                                            my_http_post(send_body, result);
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                        sendOnlineLog("error", "Exception when posting error result " + result + ",  " + e)
                                        lock.lock()
                                        taskId = "";
                                        lock.unlock()
                                        // 界面卡死了，需要重启
                                        errorPost = 1
                                    }
                                // } else {
                                //     global_result = 0
                                // }
                              }
                              lock.lock()
                              global_result = 0
                              taskId = "";
                              lock.unlock()
                              console.log("taskId finished: " + taskId + ", reset to empty")
                              sendOnlineLog("info", "taskId finished: " + taskId + ", reset to empty")
                              if(errorPost == 1 && (result == 2 || result == 3|| result == 4)) {
                                console.error("界面卡死了，需要重启")
                                sendOnlineLog("error", "界面卡死了，需要重启")
                                restart12306()
                            }
                            } finally {
                                stopJsFreezeMonitor();
                            }
                        })
                    } else if(uri.indexOf("login") !== -1){
                        userName = infoObject.login.username
                        userPasswd = infoObject.login.password
                        smsCode = infoObject.login.smscode
                        workThread = threads.start(function () {
                            startJsFreezeMonitor();
                            try {
                                var currentTask = taskId
                                console.info("开始登录, 任务id " + taskId);
                                sendOnlineLog("info", "开始登录, 任务id " + taskId)
                                var result = doLogin(userName, userPasswd, smsCode)
                                if(error_code != 0) {
                                    try {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                            // r = http.postJson(errUrl, {
                                            //     code: error_code,
                                            //     msg: "fail",
                                            //     data: errorMaps2[error_code],
                                            // });
                                            var send_body = {
                                                code: error_code,
                                                msg: "fail",
                                                data: errorMaps2[error_code],
                                            };
                                            my_http_post(send_body, error_code);
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                    }
                                    console.info("taskId " + taskId + ", error_code " + error_code + ", " + errorMaps2[error_code])
                                    sendOnlineLog("info", "taskId " + taskId + ", error_code " + error_code + ", " + errorMaps2[error_code])
                                    error_code = 0;
                                    global_result = 0;
                                    lock.lock()
                                    taskId = "";
                                    lock.unlock()
                                    stopJsFreezeMonitor();
                                    return
                                }
                                if(global_result != 0) {
                                    try {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                            // r = http.postJson(errUrl, {
                                            //     code: global_result,
                                            //     msg: "fail",
                                            //     data: errorMaps[global_result],
                                            // });
                                            var send_body = {
                                                code: global_result,
                                                msg: "fail",
                                                data: errorMaps[global_result],
                                            };
                                            my_http_post(send_body, global_result);
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                    }

                                    console.info("taskId " + taskId + ", global_result " + global_result + ", " + errorMaps[global_result])
                                    sendOnlineLog("info", "taskId " + taskId + ", global_result " + global_result + ", " + errorMaps[global_result] + ", " + errorMaps_actual[global_result])
                                    global_result = 0;
                                    lock.lock()
                                    taskId = "";
                                    lock.unlock()
                                    stopJsFreezeMonitor();
                                    return
                                }
                                console.info("taskId " + taskId + ", result " + result + ", " + errorMaps_actual[result])
                                sendOnlineLog("info", "taskId " + taskId + ", result " + result + ", "  + errorMaps[result] + ", " + errorMaps_actual[result])
                                if(result != 0) {
                                    try {
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                            // r = http.postJson(errUrl, {
                                            //     code: result,
                                            //     msg: "fail",
                                            //     data: errorMaps[result],
                                            // });
                                            var send_body = {
                                                code: result,
                                                msg: "fail",
                                                data: errorMaps[result],
                                            };
                                            my_http_post(send_body, result);
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                    }
                                } else {
                                    global_result = 0;
                                }
                                lock.lock()
                                taskId = "";
                                lock.unlock()
                            } finally {
                                stopJsFreezeMonitor();
                            }
                        })
                    } else if(uri.indexOf("crudPassenger") !== -1){
                        current_work = infoObject.work
                        // add_passenger 
                        // modify_passenger
                        // del_passenger
                        // query_passenger_list
                        // query_passenger_info

                        // query_user_info   user_info
                        // modify_user_info  user_info
                        crud_passenger = infoObject.passenger
                        workThread = threads.start(function () {
                            startJsFreezeMonitor();
                            try {
                                var currentTask = taskId
                                console.info("开始 " + current_work + " , 任务id " + taskId);
                                sendOnlineLog("info", "开始 " + current_work + " , 任务id " + taskId)
                                var result = doCrudPassenger(crud_passenger, current_work)
                                if(error_code != 0) {
                                    try {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                            r = http.postJson(errUrl, {
                                                code: error_code,
                                                msg: "fail",
                                                data: errorMaps2[error_code],
                                            });
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                    }
                                    console.info("taskId " + taskId + ", error_code " + error_code + ", " + errorMaps2[error_code])
                                    sendOnlineLog("info", "taskId " + taskId + ", error_code " + error_code + ", " + errorMaps2[error_code])
                                    error_code = 0;
                                    global_result = 0;
                                    lock.lock()
                                    taskId = "";
                                    lock.unlock()
                                    stopJsFreezeMonitor();
                                    return
                                }
                                if(global_result != 0 && global_result != 60) {
                                    try {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                            r = http.postJson(errUrl, {
                                                code: global_result,
                                                msg: "fail",
                                                data: errorMaps[global_result],
                                            });
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                    }

                                    console.info("taskId " + taskId + ", global_result " + global_result + ", " + errorMaps[global_result])
                                    sendOnlineLog("info", "taskId " + taskId + ", global_result " + global_result + ", " + errorMaps[global_result] + ", " + errorMaps_actual[global_result])
                                    global_result = 0;
                                    lock.lock()
                                    taskId = "";
                                    lock.unlock()
                                    stopJsFreezeMonitor();
                                    return
                                }
                                console.info("taskId " + taskId + ", result " + result + ", " + errorMaps_actual[result])
                                sendOnlineLog("info", "taskId " + taskId + ", result " + result + ", "  + errorMaps[result] + ", " + errorMaps_actual[result])
                                if(result != 0) {
                                    try {
                                        lock2.lock()
                                        var newestTaskId = latestTaskId
                                        lock2.unlock()
                                        if(newestTaskId == currentTask) {
                                        // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                                            r = http.postJson(errUrl, {
                                                code: result,
                                                msg: "fail",
                                                data: errorMaps[result],
                                            });
                                        }
                                    } catch(e) {
                                        console.error("Exception when posting error result " + result + ",  " + e)
                                    }
                                } else {
                                    global_result = 0;
                                }
                                lock.lock()
                                taskId = "";
                                lock.unlock()
                            } finally {
                                stopJsFreezeMonitor();
                            }
                        })
                    }                     
                }) 
            // } else {
            //         console.log("uri " + uri + " , 没有数据");
            //     }
                var result = {"id": taskId, "code":0, "msg":"succ", "data":"OK"};
                return NanoHTTPD.newFixedLengthResponse(NanoHTTPD$Response$Status.OK, "application/json;charset=utf-8", JSON.stringify(result)) 
            }
            else if(uri.indexOf("error") !== -1) {
                error_code = infoObject.code
                sendOnlineLog("info", "error " + JSON.stringify(infoObject))
                var result = {"code":0, "msg":"succ", "data":"收到请求"};
                return NanoHTTPD.newFixedLengthResponse(NanoHTTPD$Response$Status.OK, "application/json;charset=utf-8", JSON.stringify(result))
            }
        }
        var result = {"code":0, "msg":"fail", "data":"无效的请求"};
        return NanoHTTPD.newFixedLengthResponse(NanoHTTPD$Response$Status.BAD_REQUEST, "application/json;charset=utf-8", JSON.stringify(result))
    }     
}


try {
    // 解除端口占用
    http.get("http://127.0.0.1:" + HttpPort + "/quit")
} catch (e) {
    console.log("httpserver already stop");
}

try {
    // 启动服务
    var myObject = new JavaAdapter(NanoHTTPD, myApp, HttpPort)
    myObject.start()
    doClickTipWindow()
    doClickTipWindow2()
    doClickTipWindow3()
    // doClickAccessibilityWindow()
    // doClickHMSWindow()
    doClickHwMarketNotifications()
    doClickRetryView()
    doCheckLoginWindow()
    // doClickCancelUpdateThread()
    doCheckWaitResult()
    doCheckQuickOrder()
    // doClickPermissionDialog()
    // doClickFengKongDialog()
    sendOnlineLog("info", "httpserver start success")
    sleep(1000)
    } catch (e) {
    console.error(e)
}

intervalId = setInterval(guardThread, 2 * 60 * 1000);
// setInterval(function() {
//     needRestart = true
// }, 86400 * 1000);
// 86400

// 购票主流程
function doMainProcess() {
    console.time(taskId);
    var result = prepare12306App("order")
    if(!result) {
        result = doPrepareQueryParameters()
        isInOrdering = true
        if(!result) {
            result = doQueryAndSelectTrain()
            if(!result) {
                // 测试版本：如果任务已成功（检测到未登录），跳过确认订单部分
                if(global_result == 0) {
                    console.log("任务已成功（检测到未登录），跳过确认订单部分");
                    sendOnlineLog("info", "任务已成功（检测到未登录），跳过确认订单部分");
                    console.timeEnd(taskId);
                    return result;
                }
                
                // login
                sleep((random() + random(1, 3)) * 100)
                sleep((random() + random(3, 5)) * 300)
    
                // sleep((random() + random(2, 4)) * 300)
                // choose Passenger
                // text("确认订单").waitFor()
                // var orderConfirm1 = className("android.widget.Button").text("提交订单").findOne(timeout * 2);
                updateMonitorStatus("doMainProcess", "确认订单-查找提交订单按钮");
                var orderConfirm1 = detectWidgetItemWithChainClassnameText("android.widget.Button", "提交订单", "error", 100)
                if(orderConfirm1 != null) {
                    // 如果没有找到车次，直接返回错误
                    // var trainButton = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains("android.view.View", theTrainFormat + "次", "从" + departStaName + "出发", "到达" + arriveStaName.slice(0,1), arriveStaName.slice(1) + "历时", "error", normal)
                    // C 7 4 4 1次列车,14点24分从海口东出发16点16分到达三  亚历时1时52分
                    // D 7 9 3 2次列车,16点21分从依兰出发18点9分到达哈  尔  滨历时1时48分
                    updateMonitorStatus("doMainProcess", "确认订单-验证车次信息");
                    var trainButton = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains("android.view.View", theTrainFormat + "次", "从" + departStaName + "出发", "到达" + arriveStaShorcut + "历时", "error", normal)
                    if(trainButton == null) {
                        console.error("找到错误的车次")
                        sendOnlineLog("error", "找到错误的车次")
                        doCaptureAndSaveImage("doFailFindTrain")
                        return 6;
                    }
                 
                    sleep((random() + random(1, 3)) * 100)
                    result = doChooseTicketType(ticketType)
                    if(!result) {
                        sleep((random() + random(1, 3)) * 100)
                        if(is_pay_by_point) {
                            result = doChoosePointPassenger()
                        } else {
                            result = doChoosePassenger()
                        }
                        if(passenger_names.length == 5 && Object.keys(traverllers_modified_passenger_type).length > 0) {
                            sleep((random() + random(1, 3)) * 100)
                            var x_random = random() + random(0,2) -2
                            swipe(width / 2  + x_random * 100 , height / 2 + (random() +1) * 100 , width / 2  + (x_random + random()) * 100, height / 2 - (random()  + 1) * 100 , (random() + random(2, 4)) * 100)
                            sleep((random() + 5) * 300)
                        }

                        for (key in traverllers_modified_passenger_type) {
                            sleep((random() + random(2, 3)) * 200)
                            console.log(key, traverllers_modified_passenger_type[key]);
                            updateMonitorStatus("doMainProcess", "修改乘车人类型-查找删除乘车人按钮(" + key + ")");
                            var passenger = detectWidgetItemWithChainClassnameText("android.widget.Button", "删除乘车人" + key, "error", normal)
                            if(passenger != null) {
                                var p = passenger.parent() 
                                if(p != null && p.childCount() >= 4) {
                                    sendOnlineLog("info", "修改乘车人类型 " + traverllers_modified_passenger_type[key])
                                    myCustomClickNotClickable(p.child(1))
                                    // console.log(p.child(1))
                                    // p.child(1).click()
                                    sleep((random() + random(2, 3)) * 100)
                                    // var t = detectWidgetItemWithChain("text1", traverllers_modified_passenger_type[key] + "票", "error", normal)
                                    // myCustomClick(t)
                                    updateMonitorStatus("doMainProcess", "修改乘车人类型-查找票种选项(" + traverllers_modified_passenger_type[key] + ")");
                                    t = detectWidgetItemWithChainClassnameTextcontains("android.widget.CheckedTextView", traverllers_modified_passenger_type[key], "error", normal)
                                    var count = 0
                                    while(t == null) {
                                        count++;
                                        updateMonitorStatus("doMainProcess", "修改乘车人类型-重试查找删除乘车人按钮(" + key + ",第" + count + "次)");
                                        var passenger = detectWidgetItemWithChainClassnameText("android.widget.Button", "删除乘车人" + key, "error", normal)
                                        if(passenger != null) {
                                            var p = passenger.parent() 
                                            if(p != null && p.childCount() >= 4) {
                                                sendOnlineLog("info", "第" + count + "次修改乘车人类型 " + traverllers_modified_passenger_type[key])
                                                myCustomClickNotClickable(p.child(1))
                                            }
                                        }
                                        sleep((random() + random(2, 3)) * 100)
                                        updateMonitorStatus("doMainProcess", "修改乘车人类型-重试查找票种选项(" + traverllers_modified_passenger_type[key] + ",第" + count + "次)");
                                        t = detectWidgetItemWithChainClassnameTextcontains("android.widget.CheckedTextView", traverllers_modified_passenger_type[key], "error", 20)
                                        if(count > 5) {
                                            break
                                        }
                                    }
                                    if(t == null) {
                                        console.error("没法修改乘车人类型")
                                        sendOnlineLog("error", "没法修改乘车人类型")
                                        doCaptureAndSaveImage("doFailChangePassengerType")
                                        return 35;                            
                                    }
                                    myCustomClick(t)
                                    sleep((random() + random(1, 3)) * 100)
                                }
                            }
                        }

                        if(!result) {
                            // var orderConfirm2 = className("android.widget.Button").text("提交订单").findOne(timeout * 2);
                            updateMonitorStatus("doMainProcess", "选择乘客后-查找提交订单按钮");
                            var orderConfirm2 = detectWidgetItemWithChainClassnameText("android.widget.Button", "提交订单", "error", normal)
                            if(orderConfirm2 != null) {
                                // text("提交订单").waitFor()
                                // 选择座位
                                doChooseSeat(seatNos)
                                sleep((random() + random(3, 5)) * 200) 
                                // Todo 提交订单按钮可能不可见
                                orderConfirm2.click()
                                sleep((random() + random(1, 2)) * 200)    
                                // orderConfirm2 = detectWidgetItemWithChainClassnameText("android.widget.Button", "提交订单", "error", lite)
                                // if(orderConfirm2 != null) {
                                //     sendOnlineLog("info", "再次点击提交订单")
                                //     sendOnlineLog("info", orderConfirm2)
                                //     orderConfirm2.click()
                                // }
                                // myCustomClick(orderConfirm2)
                                sleep((random() + random(1, 3)) * 300)               
                                // id("h5_title").text("未完成").waitFor()
                                // 提交订单后需要等待较长时间才能进入未完成页面
                                // var oderPayment1 = id("h5_title").text("未完成").findOne(timeout * 30)
                                updateMonitorStatus("doMainProcess", "提交订单后-查找未完成页面");
                                var oderPayment1 = detectWidgetItemWithChain1("h5_title", "未完成", "error", 100 * 6)
                                if(global_result == 16) {
                                    console.warn("有未完成订单")
                                    sendOnlineLog("warn", "有未完成订单")
                                    result = 16;
                                } else {
                                    if(oderPayment1 != null || global_result == 115) {
                                        // 等待一定时间再点击返回
                                        sleep((random() + random(2, 3)) * 1000)
                                        // id("h5_tv_nav_back").click()
                                        // myCustomClick(id("h5_tv_nav_back").findOne(timeout))
                                        if(global_result == 115) {
                                            console.warn("开始排队")
                                            sendOnlineLog("warn", "开始排队")
                                            var t1 = Date.now()
                                            console.time("开始排队")
                                            global_result = 0;
                                            // sleep(1000 * 60 * 10)
                                            updateMonitorStatus("doMainProcess", "排队后-查找立即支付按钮");
                                            oderPayment1 = detectWidgetItemWithChainClassnameText2("android.widget.Button", "立即支付", "error", 12 * 100);
                                            var t2 = Date.now()
                                            if(Math.ceil((t2 - t1) / 1000 ) >  10) {
                                                sendOnlineLogTime("warn", "排队耗时 " + (t2 - t1) / 1000 + "秒", Math.ceil((t2 - t1) / 1000) )
                                            }
                                            console.timeEnd("开始排队")
                                        } 
                    
                                        if(global_result == 241) {
                                            console.warn("quick order, result = " + result + ",  global_result = " + global_result)
                                            sendOnlineLog("info", "quick order")
                                            console.timeEnd(taskId);
                                            return result
                                        }
                                        if(oderPayment1 == null) {
                                            console.error("排队后无法进入支付界面")
                                            sendOnlineLog("error", "排队后无法进入支付界面")
                                            doCaptureAndSaveImage("goToOrderPaymentPageError2")
                                            result = 37;
                                        } else {
                                            sleep((random() + random(1, 3)) * 300)    
                                            // wait the train info page
                                            updateMonitorStatus("doMainProcess", "支付页面-验证车次信息");
                                            detectWidgetItemWithChainClassnameTextcontainsTextcontains("android.view.View", theTrainFormat + "次", "从" + departStaName, "error", normal) 
                                            updateMonitorStatus("doMainProcess", "支付页面-查找返回按钮");
                                            myCustomClick(detectWidgetItem("id", "h5_tv_nav_back", "error", normal))  
                                            // id("content").textContains("确定要放弃支付吗").waitFor()
                                            // sleep((random() + random(1, 3)) * 100)
                                            // id("sure").textContains("确定").click()
                                            // className("android.widget.Button").text("待支付").waitFor()
                                            // sleep((random() + random(1, 3)) * 300)
                                            // var oderPayment2 = className("android.widget.Button").text("待支付").findOne(timeout * 5) 
                                            sleep((random() + random(2, 4)) * 500)
                                            if(!isWait) {

                                                console.log("点击底部订单")
                                                sleep((random() + random(2, 4)) * 500)
                                                updateMonitorStatus("doMainProcess", "返回后-查找底部订单按钮");
                                                var orderRadio = detectWidgetItem("id", "ticket_home_bottom_bar_order", "error", normal)
                                                if(orderRadio != null) {
                                                    myCustomClick(orderRadio)
                                                    sleep((random() + random(2, 4)) * 200)
                                                    updateMonitorStatus("doMainProcess", "订单页面-查找待支付按钮");
                                                    var oderPayment2 = detectWidgetItemWithChainClassnameText("android.widget.Button", "待支付", "error", normal)
                                                    if(oderPayment2 != null) {
                                                        sleep((random() + random(2, 4)) * 200)
                                                        // oderPayment2.click()
                                                        myCustomClick(oderPayment2)
                                                        updateMonitorStatus("doMainProcess", "订单详情-查找立即支付按钮");
                                                        detectWidgetItemWithChainClassnameText("android.widget.Button", "立即支付", "error", normal)
                                                        // id("h5_title").text("未完成").waitFor()
                                                        sleep((random() + random(3, 5)) * 100)
                                                        // id("h5_tv_nav_back").click()
                                                        // myCustomClick(id("h5_tv_nav_back").findOne(timeout))
                                                        updateMonitorStatus("doMainProcess", "订单详情-查找返回按钮");
                                                        myCustomClick(detectWidgetItem("id", "h5_tv_nav_back", "error", normal))
                                                    } else {
                                                        console.error("放弃后未进入底部的订单页面")
                                                        sendOnlineLog("error", "放弃后未进入底部的订单页面")
                                                        doCaptureAndSaveImage("goToHomeOrderPageError1")
                                                        result = 15;
                                                    }
                                                } else {
                                                    console.error("底部订单按钮不存在")
                                                    sendOnlineLog("error", "底部订单按钮不存在")
                                                    result = 15;
                                                }
                                            } else {
                                                console.log("排队订单不用进入未完成订单页面")
                                                sendOnlineLog("info", "排队订单不用进入未完成订单页面")
                                            }
                                        }
                                    } else {
                                        console.error("确认订单后没法进入未完成页面")
                                        sendOnlineLog("error", "确认订单后没法进入未完成页面")
                                        doCaptureAndSaveImage("goToOrderPaymentPageError1")
                                        result = 14;
                                    }
                                }
                            } else {
                                console.error("选择乘客后没法进入确认订单页面")
                                sendOnlineLog("error", "选择乘客后没法进入确认订单页面")
                                doCaptureAndSaveImage("goToOrderPageError2")
                                result = 13;
                            }
                        } else {
                            // 没有找到乘车人
                            console.error(errorMaps[result])
                            sendOnlineLog("error", errorMaps[result])
                            doCaptureAndSaveImage("doChoosePassenger")
                        }
                    } else {
                        console.error("车票类型无效")
                        sendOnlineLog("error", "车票类型无效")
                        doCaptureAndSaveImage("doChooseTicketType")
                    }
                } else {
                    console.error("没有找到确认订单页面")
                    sendOnlineLog("error", "没有找到确认订单页面")
                    doCaptureAndSaveImage("goToOrderPageError1")
                    result = 12;
                }
            } else {
                // 没有找到火车
                console.error("没有找到火车")
                sendOnlineLog("error", "没有找到火车")
                doCaptureAndSaveImage("doQueryAndSelectTrain")
            }
        } else {
            // 始发站，到达站，日期 有设置出错
            console.error("始发站，到达站，日期 有设置出错")
            sendOnlineLog("error", "始发站，到达站，日期 有设置出错")
            doCaptureAndSaveImage("doPrepareQueryParameters")
        }
    } else {
        // 没法返回home界面
        console.error("没法返回home界面")
        sendOnlineLog("error", "没法返回home界面")
        doCaptureAndSaveImage("doGoToMainPage")
    }

    console.timeEnd(taskId);
    
    if (jsFreezeMonitor.freezeRecords.length > 0) {
        printFreezeReport();
    }
    
    return result
}

// 使用账号密码登录，手机验证码
function doLogin(name, password, smscode) {
    console.time(taskId); 
    var result = prepare12306App("login")
    if(result !== 0) {
        return result
    } 
    // 先导航到我的页面
    console.log("开始登录")
    sendOnlineLog("info", "开始登录")
    // var mineRadio = id("ticket_home_bottom_bar_mine").findOne(timeout)
    updateMonitorStatus("doLogin", "导航到我的页面-查找底部我的按钮");
    var mineRadio = detectWidgetItem("id", "ticket_home_bottom_bar_mine", "error", normal)
    if(mineRadio != null) {
        // mineRadio.click()
        myCustomClick(mineRadio)
    } else {
        console.error("没法导航到我的页面")
        sendOnlineLog("error", "没法导航到我的页面")
        doCaptureAndSaveImage("failToGoToMinePage")
        console.timeEnd(taskId);
        return 101
    }

    sleep((random() + random(2, 4)) * 100)
    var loginStatus = className("android.widget.Button").text("未登录,点击去登录").findOne(timeout)
    var views = className("android.view.View").find()
    if(views.empty()) {
        console.error("没法导航登录页面1")
        sendOnlineLog("error", "没法导航登录页面1")
        doCaptureAndSaveImage("failToGoToAccountPage1")
        console.timeEnd(taskId);
        back()
        return 102
    }
    sleep((random() + random(2, 4)) * 100)
    var isGoToLoginPage = false
    for(var i = 0; i < views.size(); i++) {
        var tv = views.get(i)
        var notLoginBtn = className("android.widget.Button").text("未登录,点击去登录").findOne(timeout)
        if(tv.id() == "vmc-titlebar-inner") {
            console.log("找到账号信息区域，点击后进入登录界面")
            if(notLoginBtn != null) {
                myCustomClick(notLoginBtn)
            } 
            isGoToLoginPage = true
            sleep((random() + random(2, 5)) * 100)
            break
        }
    }
    if(!isGoToLoginPage) {
        console.error("没法导航登录页面2")
        doCaptureAndSaveImage("failToGoToAccountPage2")
        console.timeEnd(taskId);
        return 103
    }

    if(loginStatus == null) {
        // 已经登录，需要先退出来
        console.log("已经登录，需要先退出")
        // var logoutPage = id("h5_title").text("我的账户").findOne(timeout * 2)
        updateMonitorStatus("doLogin", "已登录状态-查找我的账户页面");
        var logoutPage = detectWidgetItemWithChain("h5_title", "我的账户", "error", normal)
        if(logoutPage != null) {
            sleep((random() + random(2, 4)) * 100)
            // var logoutBtn = className("android.widget.Button").text("退出登录").findOne(timeout)
            updateMonitorStatus("doLogin", "退出登录-查找退出登录按钮");
            var logoutBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "退出登录", "error", normal)
            if(logoutBtn != null) {
                console.error("找到退出登录按钮")
                sendOnlineLog("error", "找到退出登录按钮")
                doCaptureAndSaveImage("failToFindLogoutBtn1")
                console.timeEnd(taskId);
                return 122
                // myCustomClick(logoutBtn)
                // sleep((random() + random(2, 5)) * 100)
            } else {
                updateMonitorStatus("doLogin", "退出登录-查找欢迎登录页面");
                var loginPage = detectWidgetItemWithChainClassnameText("android.view.View", "欢迎登录", "error", normal)
                if(loginPage == null) {
                    console.error("没法找到退出登录按钮2")
                    doCaptureAndSaveImage("failToFindLogoutBtn1")
                    console.timeEnd(taskId);
                    return 105
                }
            }
        } else {
            updateMonitorStatus("doLogin", "未登录状态-查找欢迎登录页面");
            var loginPage = detectWidgetItemWithChainClassnameText("android.view.View", "欢迎登录", "error", normal)
            if(loginPage == null) {
                console.error("没法找到登录按钮")
                sendOnlineLog("error", "没法找到登录按钮")
                doCaptureAndSaveImage("failToFindLoginBtn2")
                console.timeEnd(taskId);
                return 104
            }
        }
    }
    // 登录页面
    // var nameInput = className("android.widget.EditText").findOne(timeout * 3)
    updateMonitorStatus("doLogin", "登录页面-查找账号输入框");
    var nameInput = detectWidgetItem("className", "android.widget.EditText", "error", normal)
    if(nameInput == null) {
        console.error("没法找到账号输入框")
        sendOnlineLog("error", "没法找到账号输入框")
        doCaptureAndSaveImage("failToFindAccountInput")
        console.timeEnd(taskId);
        return 104
    }
    // console.verbose("nameInput " + nameInput)
    if(nameInput !== null && nameInput.text() !== "" && nameInput.text() !== name) {
        // 点击后会出现键盘
        // nameInput.click()
        // myCustomClick(nameInput)
        // console.verbose("nameInput " + nameInput)
        var clearBtn = className("android.widget.Button").text("清空").findOne(timeout / 2)
        if(clearBtn != null) {
            // clearBtn.click()
            // myCustomClick(clearBtn)
        }
        setText(0, name)
    } else {
        setText(0, name)
    }
    sleep((random() + random(1, 2)) * 100)
    setText(1, password)
    sleep((random() + random(1, 2)) * 100)
    // text("登录").findOne(timeout).click()
    // var loginBtn = text("登录").findOne(timeout)
    updateMonitorStatus("doLogin", "登录页面-查找登录按钮");
    var loginBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "登录", "error", normal)
    // var loginBtn = detectWidgetItem("text", "登录", "error", normal)
    if(loginBtn != null) {
        // loginBtn.click()
        console.log("点击登录按钮")
        sendOnlineLog("info", "点击登录按钮")
        // console.log(loginBtn)
        myCustomClick(loginBtn)
        // 登录后等待时长
        sleep((random() + random(2, 4)) * 200)
        // 如果有验证码界面需要输入验证码
        updateMonitorStatus("doLogin", "登录后-查找短信核验按钮");
        var smsVerify = detectWidgetItemWithChainClassnameText1("android.widget.Button", "短信核验", "info", lite)
        if(smsVerify != null & smsCode.length == 0) {
            console.error("请输入获取的短信验证码")
            sendOnlineLog("error", "请输入获取的短信验证码")
            doCaptureAndSaveImage("failToVerifyAccount")

            doGoBackToMinePage()
            console.timeEnd(taskId);
            return 110
        }
        
        if(smsVerify != null )
        {
            console.log("开始短信验证账号")
            sendOnlineLog("info", "开始短信验证账号")
            sleep((random() + random(2, 4)) * 100)
            sleep((random() + random(2, 4)) * 100)
            sleep((random() + random(2, 4)) * 100) 
            smsVerify.click()
            // myCustomClick(smsVerify)

            sleep((random() + random(2, 4)) * 100)
            // var finishVerifyBtn = className("android.widget.Button").text("完成校验").findOne(timeout * 2) 
            updateMonitorStatus("doLogin", "短信验证-查找完成校验按钮");
            var finishVerifyBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "完成校验", "error", normal)
            if(finishVerifyBtn != null) {
                // smscode为空时直接返回
                if(smsCode.length == 0) {
                    console.error("请输入获取的短信验证码")
                    sendOnlineLog("error", "请输入获取的短信验证码")
                    doCaptureAndSaveImage("failToVerifyAccount")

                    doGoBackToMinePage()
                    console.timeEnd(taskId);
                    return 110
                }
                setText(0, smscode)
                sleep((random() + random(1, 3)) * 100)
                myCustomClick(finishVerifyBtn)
                sleep((random() + random(2, 4)) * 200)
            } else {
                console.error("没有找到完成校验按钮")
                sendOnlineLog("error", "没有找到完成校验按钮")
                doCaptureAndSaveImage("failToFindFinishVerifyBtn")
                console.timeEnd(taskId);
                doGoBackToMinePage()
                return 108
            }
        }

        // 登录成功直接跳转到首页或者我的 
        updateMonitorStatus("doLogin", "登录成功-验证首页底部按钮");
        var succPage =  detectWidgetItem1("id", "ticket_home_bottom_bar_ticket", "error", 10 * 2)
        if(succPage != null || global_result == 124) {
            console.log("登录成功")
            console.timeEnd(taskId);
            global_result = 0;
            return 0
        } else {
            console.error("登录失败，原因未知")
            sendOnlineLog("error", "登录失败，原因未知")
            doCaptureAndSaveImage("failToLogin")
            console.timeEnd(taskId);
            return 107
        }
    } else {
        console.error("没法找到登录按钮")
        sendOnlineLog("error", "没法找到登录按钮")
        doCaptureAndSaveImage("failToFindLoginBtn2")
        console.timeEnd(taskId);
        return 106
    }
}

// 添加乘车人
function doCrudPassenger(passenger, work) {
    // 先到我的页面
    console.time(taskId); 
    var result = prepare12306App("login")
    if(result !== 0) {
        return result
    } 
    // 先导航到我的页面
    console.log("开始 Crud Passenger")
    sendOnlineLog("info", "开始 Crud Passenger")
    // var mineRadio = id("ticket_home_bottom_bar_mine").findOne(timeout)
    var mineRadio = detectWidgetItem("id", "ticket_home_bottom_bar_mine", "error", normal)
    if(mineRadio != null) {
        // mineRadio.click()
        myCustomClick(mineRadio)
    } else {
        console.error("没法导航到我的页面")
        sendOnlineLog("error", "没法导航到我的页面")
        doCaptureAndSaveImage("failToGoToMinePage")
        console.timeEnd(taskId);
        return 101
    }

    sleep((random() + random(2, 4)) * 100)
    if(work == "query_user_info") {
        sleep((random() + random(2, 4)) * 500)
        sendOnlineLog("info", "开始 " + work)
        result = 47

        var views = className("android.view.View").find()
        if(views.empty()) {
            console.error("没法导航登录页面1")
            sendOnlineLog("error", "没法导航登录页面1")
            doCaptureAndSaveImage("failToGoToAccountPage1")
            console.timeEnd(taskId);
            return 102
        }
        sleep((random() + random(2, 4)) * 100)
        var isGoToLoginPage = false
        for(var i = 0; i < views.size(); i++) {
            var tv = views.get(i)
            if(tv.id() == "vmc-titlebar-inner") {
                console.log("找到账号信息区域，点击后进入登录界面")
                if(tv.childCount() >= 1) {
                    myCustomClick(tv.child(0))
                } 
                isGoToLoginPage = true
                sleep((random() + random(2, 5)) * 100)
                break
            }
        }
        sleep((random() + random(2, 4)) * 100)
        var loginPage = text("欢迎登录").findOne(timeout * 2)
        if(loginPage != null) {
            console.log("需要登录 - 测试版本：检测到未登录，任务成功")
            sendOnlineLog("info", "需要登录 - 测试版本：检测到未登录，任务成功")
            // do login
            // doLogin(userName, userPasswd)
            sleep((random() + random(1, 3)) * 100)
            // className("android.widget.Button").text("返回").click()
            // myCustomClick(className("android.widget.Button").text("返回").findOne(timeout))
            myCustomClick(detectWidgetItemWithChainClassnameText("android.widget.Button", "返回", "error", normal))
            console.timeEnd(taskId);
            return 0; // 测试版本：检测到未登录视为成功
        }
        if(isGoToLoginPage) {
            result = 0;
        }
    } else {
    // 默认已经登录
        var passengers = detectWidgetItemWithChainClassnameText("android.widget.Button", "乘车人", "error", normal)
        if(passengers == null) {
            console.error("没法找到乘车人按钮")
            sendOnlineLog("error", "没法找到乘车人按钮")
            doCaptureAndSaveImage("failToFindPassengerButton")
            console.timeEnd(taskId);
            return 40
        }
        myCustomClick(passengers)
        sleep((random() + random(2, 4)) * 100)
        var loginPage = text("欢迎登录").findOne(timeout * 2)
        if(loginPage != null) {
            console.log("需要登录 - 测试版本：检测到未登录，任务成功")
            sendOnlineLog("info", "需要登录 - 测试版本：检测到未登录，任务成功")
            // do login
            // doLogin(userName, userPasswd)
            sleep((random() + random(1, 3)) * 100)
            // className("android.widget.Button").text("返回").click()
            // myCustomClick(className("android.widget.Button").text("返回").findOne(timeout))
            myCustomClick(detectWidgetItemWithChainClassnameText("android.widget.Button", "返回", "error", normal))
            console.timeEnd(taskId);
            return 0; // 测试版本：检测到未登录视为成功
        }
        var passengerPage = detectWidgetItemWithChain("h5_title", "乘车人", "error", normal)
        if(passengerPage == null) {
            console.error("没法导航到乘车人页面")
            sendOnlineLog("error", "没法导航到乘车人页面")
            doCaptureAndSaveImage("failToGoToPassengerPage")
            console.timeEnd(taskId);
            return 41
        }     
        sleep((random() + random(2, 4)) * 500)
        sendOnlineLog("info", "开始 " + work)
        result = 47
        switch (work) {
            case "add_passenger":
            {
                // 添加乘车人
                var addPassengerBtn = detectWidgetItemWithChain("h5_bt_text", "添加", "error", normal)
                if(addPassengerBtn == null) {
                    console.error("没法找到添加乘车人按钮")
                    sendOnlineLog("error", "没法找到添加乘车人按钮")
                    doCaptureAndSaveImage("failToFindAddPassengerButton")
                    console.timeEnd(taskId);
                    return 42
                }
                myCustomClick(addPassengerBtn)
                sleep((random() + random(2, 4)) * 300)
                var addPassengerPage = detectWidgetItemWithChain("h5_title", "添加乘车人", "error", normal)
                if(addPassengerPage == null) {
                    console.error("没法导航到添加乘车人页面")
                    sendOnlineLog("error", "没法导航到添加乘车人页面")
                    doCaptureAndSaveImage("failToGoToAddPassengerPage")
                    console.timeEnd(taskId);
                    return 43
                }
                // todo execute add passenger
                var addPassengerStr = generateAddPassengerString(passenger)
                // console.info(addPassengerStr)
                // sendOnlineLog("info", addPassengerStr)

                r = http.postJson(execUrl, {
                    code: 0,
                    msg: "success",
                    data: "javascript:" + addPassengerStr,
                });
                sleep((random() + random(2, 3)) * 300)
                // sleep((random() + random(3, 5)) * 1000)
                // // sometimes may be fail, exec once more
                // r = http.postJson(execUrl, {
                //     code: 0,
                //     msg: "success",
                //     data: "javascript:" + addPassengerStr,
                // });
                // sleep((random() + random(3, 5)) * 1000)

                var nextBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "下一步", "error", normal)
                if(nextBtn == null) {
                    console.error("没法找到下一步按钮")
                    sendOnlineLog("error", "没法找到下一步按钮")
                    doCaptureAndSaveImage("failToFindNextButton")
                    console.timeEnd(taskId);
                    return 44
                }
                myCustomClick(nextBtn)

                sleep((random() + random(2, 4)) * 400)

                // 请仔细核对个人信息   .btn-cancel   .btn-confirm
                r = http.postJson(execUrl, {
                    code: 0,
                    msg: "success",
                    data: "javascript:document.querySelector('.btn-confirm').click()",
                });
                sleep((random() + random(2, 3)) * 300)
                var passengerVerifyPage = detectWidgetItemWithChain2("h5_title", "联系方式核验", "error", normal)
                // if(passengerVerifyPage == null) {
                //     console.error("没法导航到联系方式核验页面")
                //     sendOnlineLog("error", "没法导航到联系方式核验页面")
                //     doCaptureAndSaveImage("failToGoToPassengerVerifyPage")
                //     console.timeEnd(taskId);
                //     return 45
                // }
                sleep((random() + random(2, 3)) * 300)
                result = 0
            }
            break;
            case "del_passenger":
            {
                var contact_list = className("android.widget.CheckBox").find()
                var identity_no = passenger.identity_no.split('').join(' ')
                if(!contact_list.empty()) {
                    for(var k = 0; k < contact_list.size(); k++) {
                        var tv = contact_list.get(k)
                        console.verbose(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc() + ", " + tv.enabled());
                        var userSatisfied = false
                        switch (passenger.identity_type) {
                            case "1":
                                userSatisfied = tv.text().indexOf(passenger.passenger_name) !== -1 && tv.text().indexOf(identity_no.substr(0,7)) !== -1 && tv.text().indexOf(identity_no.substr(-5, 5)) !== -1;
                                break;
                            case "C":
                            case "G":
                            case "H":
                                userSatisfied = tv.text().indexOf(passenger.passenger_name) !== -1 && tv.text().indexOf(identity_no.substr(0,3)) !== -1 && tv.text().indexOf(identity_no.substr(-3, 3)) !== -1;
                                break;
                        }
                        if(userSatisfied) {
                            // tv.click()
                            myCustomClick(tv.parent())   
                            sleep((random() + random(3, 4)) * 200)

                            var deleteBtn = detectWidgetItemWithChain("h5_bt_text", "删除", "error", normal)
                            if(deleteBtn == null) {
                                console.error("没法找到删除按钮")
                                sendOnlineLog("error", "没法找到删除按钮")
                                doCaptureAndSaveImage("failToFindDeleteButton")
                                console.timeEnd(taskId);
                                return 46
                            }
                            sleep((random() + random(5, 7)) * 100)
                            myCustomClick(deleteBtn)
                            result = 0
                            // 可能需要很长时间才能删除成功
                            sleep((random() + random(3, 5)) * 1000)
                            break;
                        }
                        sleep((random() + random(3, 5)) * 200)
                        // }
                    }
                    if(result !== 0) {
                        var err_msg = "乘车人<" + passenger.passenger_name + ">不存在" 
                        console.error(err_msg)
                        sendOnlineLog("error", err_msg)
                        doCaptureAndSaveImage("failToFindPassenger")
                        result = 47
                        errorMaps[result] = err_msg
                        errorMaps_actual[result] = err_msg
                    }
                }           
            }
            break;
            case "modify_passenger":
            {
                var contact_list = className("android.widget.CheckBox").find()
                var identity_no = passenger.identity_no.split('').join(' ')
                if(!contact_list.empty()) {
                    for(var k = 0; k < contact_list.size(); k++) {
                        var tv = contact_list.get(k)
                        console.verbose(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc() + ", " + tv.enabled());
                        // for(var i = 0; i < passenger_names.length; i++) {
                            // console.log("id " +  traverllers_identity_nos[i])
                        var userSatisfied = false
                        switch (passenger.identity_type) {
                            case "1":
                                userSatisfied = tv.text().indexOf(passenger.passenger_name) !== -1 && tv.text().indexOf(identity_no.substr(0,7)) !== -1 && tv.text().indexOf(identity_no.substr(-5, 5)) !== -1;
                                break;
                            case "C":
                            case "G":
                            case "H":
                                userSatisfied = tv.text().indexOf(passenger.passenger_name) !== -1 && tv.text().indexOf(identity_no.substr(0,3)) !== -1 && tv.text().indexOf(identity_no.substr(-3, 3)) !== -1;
                                break;
                        }
                        if(userSatisfied) {
                            // tv.click()
                            myCustomClick(tv.parent())   
                            sleep((random() + random(2, 4)) * 100)

                            var modifyPassengerStr = generateModifyPassengerString(passenger)
                            // console.info(modifyPassengerStr)
                            // sendOnlineLog("info", modifyPassengerStr)
                            r = http.postJson(execUrl, {
                                code: 0,
                                msg: "success",
                                data: "javascript:" + modifyPassengerStr,
                            });
                            sleep((random() + random(3, 5)) * 300)
                            // sleep((random() + random(3, 5)) * 1000)

                            // // sometimes may be fail, exec once more
                            // r = http.postJson(execUrl, {
                            //     code: 0,
                            //     msg: "success",
                            //     data: "javascript:" + modifyPassengerStr,
                            // });
                            // sleep((random() + random(2, 4)) * 1000)

                            var nextBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "下一步", "error", normal)
                            if(nextBtn == null) {
                                console.error("没法找到下一步按钮")
                                sendOnlineLog("error", "没法找到下一步按钮")
                                doCaptureAndSaveImage("failToFindNextButton")
                                console.timeEnd(taskId);
                                return 44
                            }
                            myCustomClick(nextBtn)
                            sleep((random() + random(2, 4)) * 200)
                            // var passengerVerifyPage = detectWidgetItemWithChain("h5_title", "联系方式核验", "error", normal)
                            // if(passengerVerifyPage == null) {
                            //     console.error("没法导航到联系方式核验页面")
                            //     sendOnlineLog("error", "没法导航到联系方式核验页面")
                            //     doCaptureAndSaveImage("failToGoToPassengerVerifyPage")
                            //     console.timeEnd(taskId);
                            //     return 45
                            // }
                            result = 0
                            sleep((random() + random(2, 4)) * 300)
                            break;
                        }
                        // }
                    }

                    if(result !== 0) {
                        var err_msg = "乘车人<" + passenger.passenger_name + ">不存在" 
                        console.error(err_msg)
                        sendOnlineLog("error", err_msg)
                        doCaptureAndSaveImage("failToFindPassenger")
                        result = 47
                        errorMaps[result] = err_msg
                        errorMaps_actual[result] = err_msg
                    }
                }
                sleep((random() + random(1, 2)) * 1000);
            }
            break;
            case "query_passenger_list":
                {
                    result = 0;
                }
            break;
            case "query_passenger_info":
                {
                    result = 0;
                }
                break;
        }
    }    
    back()
    sleep((random() + random(2, 4)) * 300)
    console.timeEnd(taskId);
    return result
}


function prepare12306App(command) {
    var result = 1
    var currentApp = currentPackage()
    console.log("当前App: " + currentApp)
    sendOnlineLog("info", "当前App: " + currentApp)
    if(currentApp != "com.MobileTicket") {        
        console.log((currentApp !== "com.MobileTicket") + ", 需要将12306拉到前台")
        sendOnlineLog("info", "需要将12306拉到前台")
        var pkgname = app.getPackageName("铁路12306")
        if(pkgname == null) {
            console.error("12306未安装")
            return result
        }
        // launch时不会重启已经启动的12306
        var isMobileTicketAppExist = app.launch(pkgname);
        // app.openAppSetting(pkgname);
        sleep(1 * 1000)
        var count = 0
        // currentApp = currentPackage()
        // if(currentApp != "com.MobileTicket") {
        //     app.launch(autojs_package_name);
        //     sleep(1000)
        //     app.launch(pkgname);
        //     sleep(3000)
        // }
        currentApp = currentPackage()
        if(currentApp != "com.MobileTicket") {
            sendOnlineLog("info", "当前App: " + currentApp)
            console.log("12306没法拉到前台")
            sendOnlineLog("info", "12306没法拉到前台")
            kill12306()
            sleep(3000)
            start12306()
            sleep(5000)
        }
        currentApp = currentPackage()
        while(currentApp != "com.MobileTicket") {
            app.launch(pkgname);
            sleep(1 * 1000)
            currentApp = currentPackage()
            console.log("当前App1: " + currentApp)
            sendOnlineLog("info", "当前App1: " + currentApp)
            count++
            if(count > 7) {
                console.error("无法将12306拉取到前台")
                sendOnlineLog("error", "无法将12306拉取到前台")
                doCaptureAndSaveImage("failToBring12306ToFront")
                return 1
            }
        }
        // waitForPackage(pkgname)
        // 第一次启动，需要多等一会
        // sleep((random() + random(2, 5)) * 200)
        // Todo 清理后，需要点击隐私和动态页面
        // doSkipPersonalPrivacyGuide()
        // var mainPage = detectWidgetItem("id", "ticket_home_btn_search", "error", normal)
        // if(mainPage == null) {
        //             // 没法返回home界面
        //     console.error("启动后没法进入home界面")
        //     doCaptureAndSaveImage("doFailGoToMainPageAfterStartup")
        //     return 17
        // }

        var currentApp = currentPackage()
        console.log("当前App2: " + currentApp)
    } 
    // 如果不在首页则转到首页
    if(command == "order") {
        result = doGoToMainPage2()
    } else if(command == "login") {
        result = doGoToMainPage3()
    }
    
    if(result) {
        // 没法返回home界面
        console.error("没法返回home界面")
        sendOnlineLog("error", "没法返回home界面")
        doCaptureAndSaveImage("doGoToMainPage")
    }
    return result
}

// 登录失败后从短信验证界面返回到我的界面
function doGoBackToMinePage() {
    // 返回我的界面界面
    // sleep((random() + random(2, 4)) * 200)
    // myCustomClick(id("h5_tv_nav_back").desc("返回").findOne(timeout))
    // sleep((random() + random(3, 5)) * 200)
    // myCustomClick(className("android.widget.Button").text("返回").findOne(timeout))
}

// 跳过第一次打开的个人信息保护指引
function doSkipPersonalPrivacyGuide() {
    var guide = id("permission_title").text("12306个人信息保护指引").findOne(timeout / 5)
    if(guide != null) {
        // id("permission_msg_button").click()
        console.log("点击 12306个人信息保护指引")
        myCustomClick(id("permission_msg_button").findOne(timeout))
        sleep((random() + random(5, 6)) * 1000)
        guide = id("permission_title").text("12306个人信息保护指引").findOne(timeout / 5)
        if(guide != null) {
            packageName("com.MobileTicket").id("permission_msg_button").click()
            sleep((random() + random(5, 6)) * 1000)
            guide = id("permission_title").text("12306个人信息保护指引").findOne(timeout / 5)
            if(guide != null) {
                sendOnlineLog("error", "无法点击12306个人信息保护指引")
                kill12306()
                return
            }
        }
    }
        
    var guidePage = descContains("行程动态").findOne(timeout * 5) 
    if(guidePage != null) {
        console.log("进入 行程动态")
        // need do swipe
        swipe(width / 2 + 3 * 150, height / 2 + (random() - 1) * 500, width / 2 - 3 * 150, height / 2 + (random() - 1) * 400, (random() + random(3, 5)) * 100)
        sleep((random() + random(4, 5)) * 200)   
        var enterBtn = text("即刻体验").findOne(timeout)
        var swipe_count = 0
        while(enterBtn == null) {
            swipe(width / 2 + 3 * 150, height / 2 + (random() - 1) * 500, width / 2 - 3 * 150, height / 2 + (random() - 1) * 400, (random() + random(3, 5)) * 100)
            sleep((random() + random(4, 5)) * 200)    
            swipe_count ++
            var enterBtn = text("即刻体验").findOne(timeout)
            if(swipe_count == 5) {
                break
            }
        }
        // enterBtn.click()
        myCustomClick(enterBtn)
        sleep((random() + random(2, 4)) * 100)
    }    
}

// 选择乘车人
// Todo
function doChoosePassenger() {
    var allUsersAdded = 10
    var traverllersCount = 0

    // var choosePassenger = text("选择乘车人").findOne(timeout)
    var choosePassenger = detectWidgetItem("text", "选择乘车人", "error", normal)
    if(choosePassenger != null) {
        // choosePassenger.click() 
        myCustomClick(choosePassenger)
        sleep((random() + random(1, 3)) * 200)
        // id("h5_title").text("选择乘车人").waitFor()
        var choosePassengerPage = detectWidgetItemWithChain("h5_title", "选择乘车人", "error", 100)
        if(choosePassengerPage == null) {
            return 20
        }
        sleep((random() + random(2, 4)) * 200)
        detectWidgetItem("className", "android.widget.CheckBox", "error", normal)
        var contact_list = className("android.widget.CheckBox").find()
        var passengers_index = []
        if(!contact_list.empty()) {
            // 3月28日, com.MobileTicket:id/tv_weather_date, android.widget.TextView, false, null
            for(var k = 0; k < contact_list.size(); k++) 
            {
                var tv = contact_list.get(k)
                console.verbose(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc() + ", " + tv.enabled());
                for(var i = 0; i < passenger_names.length; i++) {
                    // console.log("id " +  traverllers_identity_nos[i])
                    var userSatisfied = false
                    // var tvtext = String(tv.text()).replace(/\s+/g, '').trim()
                    // userSatisfied = tv.text().indexOf(passenger_names[i]) !== -1 && tvtext.indexOf(traverllers_identity_nos[i]) !== -1;
                    switch (passenger_identity_types[i]) {
                        case "1":
                            userSatisfied = tv.text().startsWith(passenger_names[i] + "，") && tv.text().indexOf(traverllers_identity_nos[i].substr(0,7)) !== -1 && tv.text().indexOf(traverllers_identity_nos[i].substr(-5, 5)) !== -1;
                            break;
                        case "C":
                        case "G":
                        case "H":
                        case "B": // 护照
                            userSatisfied = tv.text().startsWith(passenger_names[i]) !== -1 && tv.text().indexOf(traverllers_identity_nos[i].substr(0,3)) !== -1 && tv.text().indexOf(traverllers_identity_nos[i].substr(-3, 3)) !== -1;
                            break;
                    }
                    if(userSatisfied) {
                        // tv.click()
                        if(!tv.enabled()) {
                            console.error(passenger_names[i] + "身份未通过")
                            sendOnlineLog("error", passenger_names[i] + "身份未通过")
                            need_verify_user = passenger_names[i].split(' ').join('')
                            allUsersAdded = 25
                            errorMaps[allUsersAdded] = "乘客<" + need_verify_user + ">身份未通过"
                        } 
                        if(tv.text().indexOf("待核验") !== -1) {
                            need_verify_user = passenger_names[i].split(' ').join('')
                            console.log(need_verify_user + "身份待核验")
                            sendOnlineLog("info", need_verify_user + "身份待核验")
                            // allUsersAdded = 26
                            allUsersAdded = 63
                            errorMaps[allUsersAdded] = "乘客<" + need_verify_user + ">身份待核验"
                        }
                        // 需要修改乘客类型
                        if(tv.text().indexOf(passenger_names[i] + "，" + passengerTypeMap[traverllers_passenger_type[i]]) == -1) {
                            // 需要修改信息
                            // myCustomClick(tv.parent().child(1))
                            console.verbose(passenger_names[i] + ": " + passengerTypeMap[traverllers_passenger_type[i]])
                            sendOnlineLog("info", "需要修改乘客类型: " + passengerTypeMap[traverllers_passenger_type[i]])
                            traverllers_modified_passenger_type[passenger_names[i]] = passengerTypeMap[traverllers_passenger_type[i]]
                        }

                        // k = 5时部分乘客信息被确认按钮遮挡
                        if(k >= 5) {
                            myCustomClickObject(tv)
            } else {
                            myCustomClick(tv)
                        }
                        console.log(tv)
                        traverllersCount++
                        sleep((random() + random(2, 4)) * 250)
                        if(need_verify_user != "") {
                            break
                        }
                        passengers_index = passengers_index.concat(i)
                    }
                    // 可能有乘车人信息需要确认
                }
                if(need_verify_user != "") {
                    break
                }
                // 如果已经添加了所有乘车人，就不需要再继续添加了
                if(traverllersCount == passenger_names.length) {
                    break
                }
            }
        } else {
            console.error("contact_list is empty")
            sendOnlineLog("error", "contact_list is empty")
        }
        if(traverllersCount == passenger_names.length && need_verify_user == "") {
            // id("h5_bt_text").click()
            // myCustomClick(id("h5_bt_text").findOne(timeout))
            myCustomClick(detectWidgetItem("id", "h5_bt_text", "error", normal))
            allUsersAdded = 0
        } else {
            console.error("实际乘车人和已经添加的乘车人不符合")
            sendOnlineLog("error", "实际乘车人和已经添加的乘车人不符合")
        }
    } else {
        console.error("没有找到选择乘车人按钮")
        sendOnlineLog("error", "没有找到选择乘车人按钮")
        allUsersAdded = 11
    }
    sleep((random() + random(1, 3)) * 100)
    return allUsersAdded
}

// 选择乘车人
// Todo
function doChoosePointPassenger() {
    var allUsersAdded = 10
    var traverllersCount = 0

    // var choosePassenger = text("选择乘车人").findOne(timeout)
    var choosePassenger = detectWidgetItem("text", "积分受让人", "error", normal)
    if(choosePassenger != null) {
        // choosePassenger.click() 
        myCustomClick(choosePassenger)
        sleep((random() + random(1, 3)) * 200)
        // id("h5_title").text("选择乘车人").waitFor()
        var choosePassengerPage = detectWidgetItemWithChainIdTextcontains("h5_title", "已选择", "error", 100)
        if(choosePassengerPage == null) {
            return 20
        }
        sleep((random() + random(2, 4)) * 200)
        detectWidgetItem("className", "android.widget.CheckBox", "error", normal)
        var contact_list = className("android.widget.CheckBox").find()
        var passengers_index = []
        if(!contact_list.empty()) {
            // 3月28日, com.MobileTicket:id/tv_weather_date, android.widget.TextView, false, null
            for(var k = 0; k < contact_list.size(); k++) 
            {
                var tv = contact_list.get(k)
                console.verbose(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc() + ", " + tv.enabled());
                for(var i = 0; i < passenger_names.length; i++) {
                    // console.log("id " +  traverllers_identity_nos[i])
                    var userSatisfied = false
                    // var tvtext = String(tv.text()).replace(/\s+/g, '').trim()
                    var tvtext = tv.text().split('').join(' ')
                    // userSatisfied = tv.text().indexOf(passenger_names[i]) !== -1 && tvtext.indexOf(traverllers_identity_nos[i]) !== -1;
                    switch (passenger_identity_types[i]) {
                        case "1":
                            userSatisfied = (tv.text().startsWith(passenger_names[i] + ",") || tv.text().startsWith(passenger_names[i] + "，")) && tvtext.indexOf(traverllers_identity_nos[i].substr(0,7)) !== -1 && tvtext.indexOf(traverllers_identity_nos[i].substr(-5, 5)) !== -1;
                            break;
                        case "C":
                        case "G":
                        case "H":
                        case "B": // 护照
                            userSatisfied = tv.text().startsWith(passenger_names[i]) !== -1 && tvtext.indexOf(traverllers_identity_nos[i].substr(0,3)) !== -1 && tvtext.indexOf(traverllers_identity_nos[i].substr(-3, 3)) !== -1;
                            break;
                    }
                    if(userSatisfied) {
                        // tv.click()
                        if(!tv.enabled()) {
                            console.error(passenger_names[i] + "身份未通过")
                            sendOnlineLog("error", passenger_names[i] + "身份未通过")
                            need_verify_user = passenger_names[i].split(' ').join('')
                            allUsersAdded = 25
                            errorMaps[allUsersAdded] = "乘客<" + need_verify_user + ">身份未通过"
                        } 
                        if(tv.text().indexOf("已生效") == -1 && tv.text().indexOf("当前用户") == -1) {
                            need_verify_user = passenger_names[i].split(' ').join('')
                            console.log(need_verify_user + "未生效")
                            sendOnlineLog("info", need_verify_user + "未生效")
                            // allUsersAdded = 26
                            allUsersAdded = 63
                            errorMaps[allUsersAdded] = "乘客<" + need_verify_user + ">未生效"
                        }

                        // k = 5时部分乘客信息被确认按钮遮挡
                        if(k >= 5) {
                            myCustomClickObject(tv)
                        } else {
                            myCustomClick(tv)
                        }
                        console.log(tv)
                        traverllersCount++
                        sleep((random() + random(2, 4)) * 250)
                        if(need_verify_user != "") {
                            break
                        }
                        passengers_index = passengers_index.concat(i)
                    }
                    // 可能有乘车人信息需要确认
                }
                if(need_verify_user != "") {
                    break
                }
                // 如果已经添加了所有乘车人，就不需要再继续添加了
                if(traverllersCount == passenger_names.length) {
                    break
                }
            }
        } else {
            console.error("contact_list is empty")
            sendOnlineLog("error", "contact_list is empty")
        }
        if(traverllersCount == passenger_names.length && need_verify_user == "") {
            // id("h5_bt_text").click()
            // myCustomClick(id("h5_bt_text").findOne(timeout))
            myCustomClick(detectWidgetItem("id", "h5_bt_text", "error", normal))
            allUsersAdded = 0
        } else {
            console.error("实际乘车人和已经添加的乘车人不符合")
            sendOnlineLog("error", "实际乘车人和已经添加的乘车人不符合")
        }
    } else {
        console.error("没有找到选择乘车人按钮")
        sendOnlineLog("error", "没有找到选择乘车人按钮")
        allUsersAdded = 11
    }
    sleep((random() + random(1, 3)) * 100)
    return allUsersAdded
}

// 处理温馨提示界面
function doClickTipWindow() {
    clickTipThread = threads.start(function () {
        // 可能有温馨提示的界面
        // 提示不到20分钟
        while (true) {
            var tip = id("title").textContains("温馨提示").findOne()
            if(tip != null) {
                var content = idMatches("com.MobileTicket:id/(html_tv4|content)").findOne(timeout)
                if(content != null) {
                    var contentText = content.text()
                    console.log("温馨提示content: " + contentText)
                    sendOnlineLog("info", "温馨提示: " + contentText)
                    if(contentText.indexOf("目前您还有未支付订单") !== -1) {
                        // id("sure").text("查看订单").click()
                        myCustomClick(id("cancel").text("我知道了").findOne(timeout))
                        console.info("查看未完成订单");
                        global_result = 16
                        // if(global_result != 0) {
                        //     try {
                        //         // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                        //         r = http.postJson(errUrl, {
                        //             code: global_result,
                        //             msg: "fail",
                        //             data: errorMaps[global_result],
                        //         });
                        //     } catch(e) {
                        //         console.error("Exception when posting error result " + global_result + ",  " + e)
                        //     }
                        // }
                    } else if(contentText.indexOf("确定要放弃支付吗") !== -1){
                        sleep((random() + random(1, 3)) * 100)
                        // id("sure").text("确定").click()
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } 
                    else if(contentText.indexOf("确保是您本人操作") !== -1) {
                        // console.log("开始验证账号")
                        // sendOnlineLog("info", "开始验证账号")
                        // needSmsVerify = true
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // var accountVerify = detectWidgetItemWithChain("h5_title", "人证核验", "log", 10) 
                        // if(accountVerify != null) {
                        //     global_result = 123
                        // }

                    } else if(contentText.indexOf("请核对发送验证短信的手机号码是否为") !== -1) {
                        // console.error("手机验证码错误")
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // // Todo需要发送错误信息
                        // global_result = 109
                        // errorMaps[global_result] = contentText
                        // // 返回我的界面界面
                        // doGoBackToMinePage()
                    } else if(contentText.indexOf("您的短信验证码已失效") !== -1) {
                        // console.error("您的短信验证码已失效，请重新获取")
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // // Todo需要发送错误信息
                        // global_result = 111
                        // errorMaps[global_result] = contentText
                        // // 返回我的界面界面
                        // doGoBackToMinePage()
                    }else if(contentText.indexOf("您的密码很久没有修改了") !== -1) {
                        // console.error("您的密码很久没有修改了，为降低安全风险，请您重新设置密码后再登录。")
                        // myCustomClick(id("cancel").text("取消").findOne(timeout))
                        // // Todo需要发送错误信息
                        // global_result = 112
                        // errorMaps[global_result] = contentText
                        // // 返回我的界面界面
                        // doGoBackToMinePage()
                    }
                     else if(contentText.indexOf("支付有效时间已过") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } 
                    else if(contentText.indexOf("用户核验成功！") !== -1){
                        // 用户登录成功
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 124
                    }
                     else if(contentText.indexOf("请至少添加一位乘客！") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } else if(contentText.indexOf("请先登录系统！") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } else if(contentText.indexOf("请提供乘车人真实有效的联系方式") !== -1){
                        myCustomClick(id("cancel").text("取消").findOne(timeout))
                        global_result = 113
                        // errorMaps[global_result] = "乘客<" + need_verify_user + ">需要校验"
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("该车次票已售完") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 114
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("您选择的列车距开车时间很近了") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } else if(contentText.indexOf("购买学生票吗") !== -1){
                        // myCustomClick(id("sure").text("是").findOne(timeout))
                        myCustomClick(id("sure").findOne(timeout))
                    }
                    //  else if(contentText.indexOf("排队中") !== -1){
                    //     // myCustomClick(id("sure").text("排队").findOne(timeout))
                    //     global_result = 115
                    //     errorMaps[global_result] = contentText
                    //     // if(global_result != 0) {
                    //     //     try {
                    //     //         // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                    //     //         r = http.postJson(errUrl, {
                    //     //             code: global_result,
                    //     //             msg: "fail",
                    //     //             data: errorMaps[global_result],
                    //     //         });
                    //     //     } catch(e) {
                    //     //         console.error("Exception when posting error result " + global_result + ",  " + e)
                    //     //     }
                    //     // }
                    // } 
                    else if(contentText.indexOf("本次列车已无满足您需求的") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        // todo 是否需要返回错误信息
                        // global_result = 27
                        // errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("目前排队人数已经超过余票张数") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 116
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("系统忙，请稍后") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 117
                        errorMaps[global_result] = contentText
                    } 
                    else if(contentText.indexOf("用户名或密码错误") !== -1){
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 118
                        // errorMaps[global_result] = contentText
                        // // 返回我的界面界面
                        // doGoBackToMinePage()
                    }
                     else if(contentText.indexOf("行程冲突") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 21
                        // errorMaps[global_result] = contentText
                    } 
                    else if(contentText.indexOf("该账户已被注销") !== -1){
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 119
                        // errorMaps[global_result] = contentText
                        // // 返回我的界面界面
                        // doGoBackToMinePage()
                    }
                     else if(contentText.indexOf("限制高消费") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 22
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("无学生资质") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 23
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("出票失败") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 24
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("已购本趟列车车票") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 26
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("办理学生优惠资质核验") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } else if(contentText.indexOf("验证未通过，登录失败") !== -1){
                        id("sure").text("确定").findOne(timeout).click()
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                    }
                     else if(contentText.indexOf("您的用户已经被锁定") !== -1){
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 120
                        // errorMaps[global_result] = contentText
                        // doGoBackToMinePage()
                    }
                     else if(contentText.indexOf("本次申请席位的结果为硬卧代硬座") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 29
                        // errorMaps[global_result] = contentText
                    } 
                    // else if(contentText.indexOf("请输入密码") !== -1){
                    //     myCustomClick(id("sure").text("确定").findOne(timeout))
                    // }
                     else if(contentText.indexOf("已订车票与本次所购车票两车间隔时间较短") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 30
                        // errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("您的请求已在处理中，请在未完成订单中查询订单状态") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 31
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("受车站施工改造影响") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 32
                        // errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("您的请求过于频繁，请稍后重试") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 34
                        errorMaps[global_result] = contentText
                    } 
                    else if(contentText.indexOf("很抱歉，您输入的短信验证码有误") !== -1){
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        // global_result = 121
                        // errorMaps[global_result] = contentText
                    } 
                    else if(contentText.indexOf("请重新查询车票信息") !== -1){
                        // 余票不足,请重新查询车票信息！
                        // 余票不足，请重新查询车票信息
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 36
                    } else if(contentText.indexOf("您是否接受系统为您分配残疾人专用席位") !== -1){
                        // myCustomClick(id("sure").text("是").findOne(timeout))
                        myCustomClick(id("sure").findOne(timeout))
                    } else if(contentText.indexOf("与已购车票行程无法衔接") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 48
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("排队人数现已超过余票数") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 49
                    } else if(contentText.indexOf("请填写姓名") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 51
                    } else if(contentText.indexOf("该联系人已存在，请使用不同的姓名和证件") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 52
                    } else if(contentText.indexOf("日前不允许删除") !== -1){
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 53
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("确定要删除联系人吗") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } else if(contentText.indexOf("请输入有效的手机号码") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 54
                    } else if(contentText.indexOf("请选择您的证件有效期截止日期") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 55
                    } else if(contentText.indexOf("请输入正确的身份证号") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 56
                    } else if(contentText.indexOf("请输入有效的港澳居民通行证号码") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 57
                    } else if(contentText.indexOf("请输入有效的台湾居民通行证号码") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 58
                    } else if(contentText.indexOf("姓名只能包含英文或者空格") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 59
                    } else if(contentText.indexOf("添加乘车人成功") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 60
                    } else if(contentText.indexOf("您的账号尚未通过身份信息核验，不可购票") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 61
                    } else if(contentText.indexOf("该车次在互联网已停止办理业务") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 62
                    } else if(contentText.indexOf("为了保障您的个人信息安全") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 64
                    } else if(contentText.indexOf("验证码已失效，请重新获取") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                        global_result = 65
                    } else if(contentText.indexOf("您是要购买残军票吗") !== -1) {
                        myCustomClick(id("sure").text("是").findOne(timeout))
                    } else if(contentText.indexOf("当前余票数量不足，请选择其他席别或车次") !== -1) {
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        back()
                        global_result = 69
                    } else if(contentText.indexOf("当乘车人联系方式格式错误，请完善联系方式") !== -1) {
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        back()
                        global_result = 70
                    } else if(contentText.indexOf("可购买儿童票") !== -1) {
                        // myCustomClick(id("sure").text("确定").findOne(timeout))
                        back()
                        global_result = 125
                        errorMaps[global_result] = contentText
                    } else if(contentText.indexOf("校验通过，登录成功") !== -1) {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    } else {
                        myCustomClick(id("sure").text("确定").findOne(timeout))
                    }

                    sleep((random() + random(1, 3)) * 100)
                } 
            }
            sleep((random() + random(4, 6)) * 1000)
         }
    })
}

// 处理温馨提示界面
function doClickTipWindow2() {
    clickTipThread2 = threads.start(function () {
        while (true) {
            // var tip = className("android.view.View").textContains("您可选择候补购票").findOne()
            var tip = id("com.MobileTicket:id/title").text("车票已售罄").findOne()
            if(tip != null) {
                var contentText = tip.text()
                console.log("tip2 content: " + contentText)
                sendOnlineLog("warn", "tip2 content: " + contentText)
                // myCustomClick(className("android.view.View").text("重新选择").findOne(timeout))
                myCustomClick(className("android.widget.Button").text("重新选择").findOne(timeout))
                global_result = 28
                // if(global_result != 0) {
                //     try {
                //         // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
                //         r = http.postJson(errUrl, {
                //             code: global_result,
                //             msg: "fail",
                //             data: errorMaps[global_result],
                //         });
                //     } catch(e) {
                //         console.error("Exception when posting error result " + global_result + ",  " + e)
                //     }
                // }
            }
            sleep((random() + random(1, 3)) * 100)
        }
    })
}

function doClickTipWindow3() {
    clickTipThread3 = threads.start(function () {
        while (true) {
            // var tip = className("android.view.View").textContains("订单已提交，系统正在处理中，请稍等").findOne()
            // 
            var tip = className("android.view.View").textContains("正在努力为您占座").findOne()
            if(tip != null && !isWait) {
                var contentText = tip.text()
                console.log("tip3 content: " + contentText)
                sendOnlineLog("warn", "tip3 content: " + contentText)
                // console.log("tip3 : " + tip)
                // sendOnlineLog("warn", "tip3 : " + tip)
                // myCustomClick(className("android.view.View").text("进入未完成订单").findOne(timeout))
                isWait = true
                global_result = 115
            //     if(global_result != 0) {
            //         try {
            //             // r = http.post(errUrl, errorMaps[result], {"Content-Type": "text/plain;charset=utf-8"})
            //             r = http.postJson(errUrl, {
            //                 code: global_result,
            //                 msg: "fail",
            //                 data: errorMaps[global_result],
            //             });
            //         } catch(e) {
            //             console.error("Exception when posting error result " + global_result + ",  " + e)
            //         }
            //     }
            }
            sleep((random() + random(4, 6)) * 1000)
        }
    })
}

// 处理排队时出票失败的情况
function doCheckWaitResult() {
    checkWaitResultThread = threads.start(function () {
        while (true) {
            // var tip = className("android.view.View").textContains("订单已提交，系统正在处理中，请稍等").findOne()
            // 
            var tip = className("android.view.View").text("出票失败").findOne()
            if(tip != null && global_result != 240) {
                var contentText = tip.text()
                console.log("checkWaitResult content: " + contentText)
                sendOnlineLog("warn", "checkWaitResult content: " + contentText)


                var t = tip.parent()
                if(t != null && t.childCount() > 3) {
                    // 
                    console.log("checkWaitResult content2: " + t.child(2).text())
                    sendOnlineLog("warn", "checkWaitResult content2: " + t.child(2).text())
                    if(t.child(2).text() != "" && t.child(2).text().indexOf("已订车票与本次购票行程冲突") == -1) {
                        global_result = 240
                        errorMaps[global_result] = contentText
                        errorMaps[global_result] = t.child(2).text()
                    }
                }
            }
            sleep((random() + random(4, 6)) * 1000)
        }
    })
}

// 处理点击重试界面
function doClickRetryView() {
    clickRetryView = threads.start(function () {
        while (true) {
            var RetryView = className("android.view.View").text("点击重试").findOne()
            if(RetryView != null) {
                var contentText = RetryView.text()
                console.log("RetryView content: " + contentText)
                sendOnlineLog("warn", "RetryView content: " + contentText)
                myCustomClick(RetryView)
            }
            sleep((random() + random(1, 3)) * 100)
        }
    })
}

// 处理登录界面
function doCheckLoginWindow() {
    checkNeedLoginThread = threads.start(function () {
        while (true) {
            var loginPage = packageName("com.MobileTicket").className("android.view.View").text("欢迎登录").findOne()
            if(isInOrdering && loginPage != null) {
                console.log("需要登录, isInOrdering: " + isInOrdering + " - 测试版本：检测到未登录，任务成功")
                sendOnlineLog("info", "需要登录, isInOrdering: " + isInOrdering + " - 测试版本：检测到未登录，任务成功")
                // do login
                // doLogin(userName, userPasswd)
                sleep((random() + random(1, 3)) * 100)
                // className("android.widget.Button").text("返回").click()
                // myCustomClick(className("android.widget.Button").text("返回").findOne(timeout))
                isInOrdering = false
                if(global_result != 115) {
                    global_result = 0 // 测试版本：检测到未登录视为成功
                }
            } 
            sleep((random() + random(8, 10)) * 1000)
        }
    })
}

// 处理排队后直接跳到暂无订单界面
// 处理登录界面
function doCheckQuickOrder() {
    checkQuickOrderThread = threads.start(function () {
        while (true) {
            var loginPage = packageName("com.MobileTicket").className("android.view.View").text("暂无订单").findOne()
            if(isInOrdering && loginPage != null) {
                console.log("暂无订单, isInOrdering: " + isInOrdering + " , is quick order!")
                sendOnlineLog("info", "暂无订单, isInOrdering: " + isInOrdering  + " , is quick order!")
                // do login
                // doLogin(userName, userPasswd)
                sleep((random() + random(1, 3)) * 100)
                // className("android.widget.Button").text("返回").click()
                // myCustomClick(className("android.widget.Button").text("返回").findOne(timeout))
                isInOrdering = false
                global_result = 241
            } 
            sleep((random() + random(8, 10)) * 1000)
        }
    })
}

// 处理提示升级界面
function doClickCancelUpdateThread() {
    clickCancelUpdateThread = threads.start(function () {
        while (true) {
            // var tip = className("android.view.View").textContains("您可选择候补购票").findOne()
            var tip = className("android.widget.TextView").text("最新版本升级内容").findOne()
            if(tip != null) {
                var contentText = tip.text()
                console.log("update content: " + contentText)
                sendOnlineLog("warn", "update content: " + contentText)
                // myCustomClick(className("android.view.View").text("重新选择").findOne(timeout))
                myCustomClick(id("com.MobileTicket:id/cancel_btn").text("稍后再说").findOne(timeout))
            }
            sleep((random() + random(1, 3)) * 100)
        }
    })
}

// 处理弹出无障碍服务的界面
function doClickAccessibilityWindow() {
    clickAccessibilityThread = threads.start(function () {
        while (true) {
            var tip = text("无障碍").findOne()
            if(tip != null) {
                // className("android.widget.ImageButton").desc("向上导航").click()
                var backBtn =  className("android.widget.ImageButton").desc("向上导航").findOne(timeout * 2)
                if(backBtn != null) {
                    backBtn.click()
                }
                sleep((random() + random(1, 3)) * 100)
            }
        }
    })
}

// 处理权限弹窗
// v5.6.0.8不弹出权限框
function doClickPermissionDialog() {
    clickPermissionDialogThread = threads.start(function () {
        while (true) {
            var tip = id("permission_dialog_title").textContains("铁路12306需要申请下列权限").findOne()
            if(tip != null) {
                var contentText = id("item_info").findOne(timeout)
                console.log("PermissionDialog content: " + contentText.text())
                sendOnlineLog("warn", "PermissionDialog: " + contentText.text())
                myCustomClick(id("permission_confirm_btn").text("开启").findOne(timeout))
                sleep((random() + random(2, 4)) * 300)
                var tip2 = textContains("铁路12306权限管理").findOne(timeout) 
                if(tip2 != null) {
                    // close 位置权限
                    var locationPermission = text("位置信息").findOne(timeout)
                    if(locationPermission != null) {
                        locationPermission.parent().parent().child(1).click()
                        sleep((random() + random(2, 4)) * 100)
                    }
                    className("android.widget.Button").text("确定").click()
                    sleep((random() + random(2, 4)) * 200)
                    console.log("开启权限")
                } else {
                    console.error("没有找到权限管理界面")
                }
                // var btn = detectWidgetItemWithChain("btn_enter", "即刻体验", "error", 100)
                // if(btn != null) {
                //     myCustomClick(btn)
                //     console.log("即刻体验")
                // }
            }
            sleep((random() + random(1, 3)) * 100)
        }
    })
}


// 
function doClickFengKongDialog() {
    clickFengKongThread = threads.start(function () {
        while (true) {
            var tip = text("“铁路12306”被检视为风险软件").findOne()
            if(tip != null) {
                var contentText = text("不再提示").findOne(timeout)
                console.log("风险提示: " + tip.text())
                sendOnlineLog("warn", "风险提示: " + tip.text())
                if(contentText != null) {
                    contentText.parent().child(0).click()
                }
                sleep((random() + random(2, 4)) * 300)
                var continueBtn = text("继续使用").findOne(timeout)
                if(continueBtn != null) {
                    continueBtn.click()
                }
                sleep((random() + random(2, 4)) * 300)     
                var tip2 = textContains("移入风险管控中心").findOne(timeout) 
                if(tip2 != null) {
                    // close 位置权限
                    text("取消").click()
                    sleep((random() + random(2, 4)) * 200)
                    console.log("取消移入风险管控中心")
                } else {
                    console.error("没有找到移入风险管控中心")
                }
                // var btn = detectWidgetItemWithChain("btn_enter", "即刻体验", "error", 100)
                // if(btn != null) {
                //     myCustomClick(btn)
                //     console.log("即刻体验")
                // }
            }
            sleep((random() + random(1, 3)) * 100)
        }
    })
}


// 处理huawei弹窗
function doClickHMSWindow() {
    threads.start(function () {
        while (true) {
            // var tip = packageName("com.huawei.appmarket").id("message").findOne()
            var tip = textContains("该服务需安装以下应用的最新版本才能使用").findOne()
            if(tip != null) {
                console.log("发现HMS Core窗口")
                // myCustomClick(packageName("com.huawei.appmarket").className("android.widget.Button").id("button2").findOne(timeout))
                text("取消").click()          
                sleep((random() + random(1, 3)) * 100)
                // back()
            }
        }
    })
}

// 处理华为应用市场通知
function doClickHwMarketNotifications() {
    threads.start(function () {
        while (true) {
            // var tip = packageName("com.huawei.appmarket").id("message").findOne()
            var tip = textContains("华为应用市场通知").findOne()
            if(tip != null) {
                console.log("华为应用市场通知")
                // myCustomClick(packageName("com.huawei.appmarket").className("android.widget.Button").id("button2").findOne(timeout))
                text("同意").click()          
                sleep((random() + random(1, 3)) * 100)
                // back()
            }
        }
    })
}

// 选择车票类型
function doChooseTicketType(ticketType) {
    var result = 8
    var firstClassSeat = className("android.widget.RadioButton").textContains(ticketShorcutMap[ticketType]).findOne(timeout)
    if(firstClassSeat != null) {
        if(firstClassSeat.text().indexOf("售罄") == -1) {
            // firstClassSeat.click()
            myCustomClick(firstClassSeat)
            result = 0
        } else {
            // 判断是否可以允许无座
            if(has_seat == false) {
                var firstClassSeat = className("android.widget.RadioButton").textContains("无座").findOne(timeout)
                if(firstClassSeat != null) {
                    if(firstClassSeat.text().indexOf("售罄") == -1) {
                        // firstClassSeat.click()
                        myCustomClick(firstClassSeat)
                        result = 0
                    } else {
                        console.error("此车票类型无票：" + "无座")
                        sendOnlineLog("error", "此车票类型无票：" + "无座")
                        result = 8
                    }
                } 
            } else {
                console.error("此车票类型无票：" + ticketShorcutMap[ticketType])
                sendOnlineLog("error", "此车票类型无票：" + ticketShorcutMap[ticketType])
                result = 8
            }
        }
    } else {
        // 判断是否可以允许无座
        if(has_seat == false) {
            var firstClassSeat = className("android.widget.RadioButton").textContains("无座").findOne(timeout)
            if(firstClassSeat != null) {
                if(firstClassSeat.text().indexOf("售罄") == -1) {
                    // firstClassSeat.click()
                    myCustomClick(firstClassSeat)
                    result = 0
                } else {
                    console.error("此车票类型无票：" + ticketShorcutMap[ticketType])
                    sendOnlineLog("error", "此车票类型无票：" + ticketShorcutMap[ticketType])
                    result = 8
                }
            } 
        } else {
            console.error("没有找到坐席：" + ticketShorcutMap[ticketType])
            sendOnlineLog("error", "没有找到坐席：" + ticketShorcutMap[ticketType])
            result = 9
        }
    }

    sleep((random() + random(1, 3)) * 100)
    return result
}

// 选择座位
function doChooseSeat(seatNos) {
    if(seatNos == null || seatNos.length == 0) {
        console.info("不需要选座")
        return
    }
    if(seatNos instanceof Array) {
        var chooseSeatService = text("选座服务").findOne(timeout * 2)
        if(chooseSeatService != null) {
            seatNos.forEach(function(e) {
                var num = parseInt(e.split("")[0]) - 1
                var alph = e.split("")[1]        
                console.info("选择座位: " + num + " " + alph)
                sendOnlineLog("info", "选择座位: " + num + " " + alph)
                var seats = className("android.widget.Button").text(alph).find()

                // seats.each(function(seat){
                //     // console.log(seat.text() + ", " + seat.id() + ", " + seat.className() + ", " + seat.clickable() + ", " + seat.desc());
                //     if(seat.text().indexOf(seatName) !== -1) {
                //         seat.click()
                //     }
                // })
                sleep((random() + random(3, 5)) * 100)
                if(seats.size() > num) {
                    // console.log(seats.get(num))
                    seats.get(num).click()
                    // myCustomClick(seats.get(num))
                }
                
                // 出现温馨服务界面
                // if(id("sure").className("android.widget.Button").text("确定").exists()) {
                //     // id("sure").className("android.widget.Button").text("确定").click()
                //     myCustomClick(id("sure").className("android.widget.Button").text("确定").findOne(timeout))
                //     sleep((random() + random(1, 3)) * 100)
                // }
            } )
        } else {
            console.info("没有选座服务")
        }
    } else {
        console.error("待选座位信息有误: " + seatNos)
        sendOnlineLog("error", "待选座位信息有误: " + seatNos)
    }
}

// 返回主界面
// 返回值：  0 返回到主界面
//          2 没法返回home界面 
function doGoToMainPage2() {
    var searchBtn = id("ticket_home_btn_search").findOne(timeout / 4) 
    if(searchBtn != null) {
        console.log("searchBtn")
        sendOnlineLog("info", "doGoToMainPage2 searchBtn")
        return 0
    }

    // com.MobileTicket:id/ticket_home_bottom_bar_ticket
    var homeRadio = detectWidgetItemWithChain("ticket_home_bottom_bar_ticket", "首页", "error", 5)
    var count = 0 
    while(homeRadio == null) {
        if(count > 10) {
            break
        }
        back()
        count++
        sleep((random() + random(2, 4)) * 200)
        console.log("ticket_home_bottom_bar_ticket count: " + count)
        homeRadio = detectWidgetItemWithChain("ticket_home_bottom_bar_ticket", "首页", "error", 5)
        console.log("homeRadio " + homeRadio)
    }
    if(homeRadio == null ) {
        console.log("failed to goto main page ")
        sendOnlineLog("info", "doGoToMainPage2 homeRadio twice")
        return 2
    }
    if(homeRadio != null) {
        // homeRadio.click()
        myCustomClick(homeRadio)
        sleep((random() + random(2, 4)) * 200)
        console.log("homeRadio")
        sendOnlineLog("info", "doGoToMainPage2 homeRadio")

        var searchBtn = id("ticket_home_btn_search").findOne(timeout / 4) 
        if(searchBtn != null) {
            console.log("searchBtn twice")
            sendOnlineLog("info", "doGoToMainPage2 searchBtn twice")
            return 0
        }

        homeRadio = detectWidgetItemWithChain("ticket_home_bottom_bar_ticket", "首页", "error", 5)
        // while(homeRadio == null) {
        //     back()
        //     sleep((random() + random(2, 4)) * 200)
        //     homeRadio = detectWidgetItemWithChain("ticket_home_bottom_bar_ticket", "首页", "error", 5)
        // }

        myCustomClick(homeRadio)
        sleep((random() + random(2, 4)) * 200)
        console.log("homeRadio twice")
        sendOnlineLog("info", "doGoToMainPage2 homeRadio twice")
        return 0
    } 

    var backBtn = id("h5_tv_nav_back").findOne(timeout / 4)
    while(backBtn != null) {
        // backBtn.click()
        myCustomClick(backBtn)
        sleep((random() + random(2, 4)) * 200)
        backBtn = id("h5_tv_nav_back").findOne(timeout)
    }

    var searchBtn = id("ticket_home_btn_search").findOne(timeout) 
    if(searchBtn != null) {
        return 0
    }

    var homeRadio = id("ticket_home_bottom_bar_ticket").findOne(timeout * 5)
    if(homeRadio != null) {
        // homeRadio.click()
        myCustomClick(homeRadio)
        return 0
    }

    console.error("没法返回home界面")
    return 2
}

// 返回我的界面
// 返回值：  0 返回到主界面
//          2 没法返回home界面 
function doGoToMainPage3() {
    var passengersBtn = className("android.widget.Button").text("乘车人").findOne(timeout / 4)
    if(passengersBtn != null) {
        console.log("passengers")
        sendOnlineLog("info", "doGoToMainPage3 passengersBtn")
        return 0
    }

    // com.MobileTicket:id/ticket_home_bottom_bar_ticket
    var mineRadio = id("ticket_home_bottom_bar_mine").text("我的").findOne(timeout / 4)
    var count = 0 
    while(mineRadio == null) {
        back()
        count++
        sleep((random() + random(2, 4)) * 200)
        mineRadio = id("ticket_home_bottom_bar_mine").text("我的").findOne(timeout / 4)
        if(count > 10) {
            console.error("没法返回home界面")
            return 2
        }
    }

    return 0
}

// 返回主界面
// 返回值：  0 返回到主界面
//          2 没法返回home界面 
function doGoToMainPage() {
    var backBtn0 = detectWidgetItemWithChainClassnameText("android.widget.Button", "返回", "log", 10) 
    while(backBtn0 != null) {
        myCustomClick(backBtn0)
        sleep((random() + random(2, 4)) * 200)
        backBtn0 = detectWidgetItemWithChainClassnameText("android.widget.Button", "返回", "log", 10) 
    }

    var searchBtn = id("ticket_home_btn_search").findOne(timeout / 4) 
    if(searchBtn != null) {
        return 0
    }

    // com.MobileTicket:id/ticket_home_bottom_bar_ticket
    var homeRadio = id("ticket_home_bottom_bar_ticket").findOne(timeout / 4)
    if(homeRadio != null) {
        // homeRadio.click()
        myCustomClick(homeRadio)
        return 0
    } 

    var backBtn = id("h5_tv_nav_back").findOne(timeout / 4)
    while(backBtn != null) {
        // backBtn.click()
        myCustomClick(backBtn)
        sleep((random() + random(2, 4)) * 200)
        backBtn = id("h5_tv_nav_back").findOne(timeout)
    }

    var searchBtn = id("ticket_home_btn_search").findOne(timeout) 
    if(searchBtn != null) {
        return 0
    }

    var homeRadio = id("ticket_home_bottom_bar_ticket").findOne(timeout * 5)
    if(homeRadio != null) {
        // homeRadio.click()
        myCustomClick(homeRadio)
        return 0
    }

    console.error("没法返回home界面")
    return 2
}


// 设置站点和日期
function doPrepareQueryParameters() {
    updateMonitorStatus("doPrepareQueryParameters", "开始");
    console.log("开始doPrepareQueryParameters")
    sendOnlineLog("info", "开始doPrepareQueryParameters")
    var isDepOk = false, isArrOk = false, isDateOk = false
    // 出发站
    // var dep1 = id("home_page_train_dep1").findOne(timeout)
    sleep((random() + random(2, 4)) * 100)
    
    // 始发站设置重试机制
    var depRetryCount = 3
    for (var retry = 0; retry < depRetryCount; retry++) {
        updateMonitorStatus("doPrepareQueryParameters", "设置始发站-查找始发站元素(home_page_train_dep1)");
        var dep1 = detectWidgetItem("id", "home_page_train_dep1", "error", normal)
        if(dep1 != null) {
            // dep1.click()
            // console.time("始发站")
            sleep((random() + random(2, 4)) * 100)
            myCustomClick(dep1)
            // textContains("我的位置").waitFor();
            // var chooseSatationPage = detectWidgetItemWithChainClassnameText("android.view.View", "热门车站", "error", normal)
            // if(chooseSatationPage == null) {
            //     return 3
            // }
            sleep((random() + random(3, 5)) * 100)
            // className("android.widget.EditText").findOne(timeout).click()
            // myCustomClick(className("android.widget.EditText").findOne(timeout))
            
            // 文本编辑框查找重试
            updateMonitorStatus("doPrepareQueryParameters", "设置始发站-查找文本编辑框(android.widget.EditText)");
            var stationEdit = detectWidgetItem("className", "android.widget.EditText", "error", 100)
            
            if(stationEdit == null && dep1 == null) {
                //始发站页面没加载出来
                console.error("设置始发站时 没有找到文本文本编辑框")
                sendOnlineLog("error", "设置始发站时 没有找到文本文本编辑框")
                if (retry < depRetryCount - 1) {
                    console.log("第" + (retry + 1) + "次始发站设置失败，重试...")
                    back()
                    sleep(1000)
                    continue
                }
                updateMonitorStatus("doPrepareQueryParameters", "返回3-始发站设置失败");
                return 3
            }else if(stationEdit == null && dep1 != null) {
                //仍在首页，重新进入始发站页面
                console.log("进入始发站界面失败，重新点击设置始发站")
                sendOnlineLog("error", "进入始发站界面失败，重新点击设置始发站")
                continue
            }else{
                myCustomClick(stationEdit)
            }
            // sleep((random() + random(2, 5)) * 100)
            // text("取消").waitFor()
            
            updateMonitorStatus("doPrepareQueryParameters", "设置始发站-查找取消按钮");
            var cancelBtn = detectWidgetItem("text", "取消", "error", normal)
            if(cancelBtn == null) {
                console.error("设置始发站时 没有找到文本取消取消按钮")
                sendOnlineLog("error", "设置始发站时 没有找到文本取消取消按钮")
                back()
                updateMonitorStatus("doPrepareQueryParameters", "返回3-找不到取消按钮");
                return 3
            }
            input(0, departStaName)
            sleep((random() + random(2, 5)) * 100)
            // className("android.widget.Button").textContains(departStaName).waitFor()
            updateMonitorStatus("doPrepareQueryParameters", "设置始发站-查找车站按钮(" + departStaName + ")");
            detectWidgetItemWithChainClassnameTextcontains("android.widget.Button", departStaName, "error", normal)
            // textContains(departStaName).find().forEach(function(tv){    
            //     // 北京, com.MobileTicket:id/home_page_train_dep1, android.widget.TextView, true, 出发站: 北京
            //     // 北京--上海, null, android.widget.TextView, true, 根据查询历史将目的地切换为 北京  到 上海
            //     // 北京, com.MobileTicket:id/tv_city, android.widget.TextView, false, null
            //     console.log(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc());
            // });
            
            var sts = className("android.widget.Button").textContains("火车站 " + departStaName + "站").find()
            if(sts.size() >= 1) {
                // sts.get(0).click()
                myCustomClick(sts.get(0))
                isDepOk = true
                break // 成功设置始发站，跳出重试循环
            } else {
                console.error("设置始发站时 没有找到车站按钮")
                sendOnlineLog("error", "设置始发站时 没有找到车站按钮")
                if (retry < depRetryCount - 1) {
                    console.log("第" + (retry + 1) + "次始发站设置失败，返回重试...")
                    back()
                    sleep(2000)
                    continue
                }
            }
        } else {
            console.info("dep1: " + dep1)
            sendOnlineLog("dep1: " + dep1)
            if (retry < depRetryCount - 1) {
                console.log("第" + (retry + 1) + "次查找始发站元素失败，等待重试...")
                sleep(2000)
                continue
            }
            updateMonitorStatus("doPrepareQueryParameters", "返回3-找不到始发站元素");
            return 3
        }
        // console.timeEnd("始发站")
    }

    if(!isDepOk) {
        // UiSelector.descStartsWith(prefix)
        var dep1 = className("android.widget.TextView").descStartsWith("出发站: ").findOnce();
        console.info("dep1: " + dep1)
        sendOnlineLog("debug", "dep1: " + dep1)
        if(dep1 == null) {
            var texts = className("android.widget.TextView").find()
            for(var k = 0; k < texts.size(); k++) {
                var tv = texts.get(k)
                console.log(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.desc());
                sendOnlineLog("debug", "dep1: " + tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.desc())
            }
        }
        updateMonitorStatus("doPrepareQueryParameters", "返回3-始发站未设置成功");
        return 3;
    }
    // 到达站
    var arrRetryCount = 3
    for (var retry = 0; retry < arrRetryCount; retry++) {
        sleep((random() + random(2, 4)) * 200)
        updateMonitorStatus("doPrepareQueryParameters", "设置到达站-查找到达站元素(home_page_train_arr1)");
        var arr1 = detectWidgetItem("id", "home_page_train_arr1", "error", normal)
        if(arr1 != null) {
            sleep((random() + random(3, 5)) * 200)
            myCustomClick(arr1)
            sleep((random() + random(3, 5)) * 100)
            updateMonitorStatus("doPrepareQueryParameters", "设置到达站-查找文本编辑框(android.widget.EditText)");
            var stationEdit = detectWidgetItem("className", "android.widget.EditText", "error", 100)
            if(stationEdit == null) {
                console.error("设置到达站时 没有找到文本编辑框")
                sendOnlineLog("error", "设置到达站时 没有找到文本编辑框")
                if (retry < arrRetryCount - 1) {
                    console.log("第" + (retry + 1) + "次到达站设置失败，返回重试...")
                    back()
                    sleep(2000)
                    continue
                }
                updateMonitorStatus("doPrepareQueryParameters", "返回4-找不到文本编辑框");
                return 4
            }
            myCustomClick(stationEdit)
            updateMonitorStatus("doPrepareQueryParameters", "设置到达站-查找取消按钮");
            var cancelBtn = detectWidgetItem("text", "取消", "error", normal)
            if(cancelBtn == null) {
                console.error("设置到达站时 没有找到文本取消取消按钮")
                sendOnlineLog("error", "设置到达站时 没有找到文本取消取消按钮")
                back()
                updateMonitorStatus("doPrepareQueryParameters", "返回4-找不到取消按钮");
                return 4
            }
            input(0, arriveStaName)
            sleep((random() + random(2, 5)) * 100)
            updateMonitorStatus("doPrepareQueryParameters", "设置到达站-查找车站按钮(" + arriveStaName + ")");
            detectWidgetItemWithChainClassnameTextcontains("android.widget.Button", arriveStaName, "error", normal)
            var sts = className("android.widget.Button").textContains("火车站 " + arriveStaName + "站").find()
            if(sts.size() >= 1) {
                myCustomClick(sts.get(0))
                isArrOk = true
                break
            } else {
                console.error("设置到达站时 没有找到车站按钮")
                sendOnlineLog("error", "设置到达站时 没有找到车站按钮")
                if (retry < arrRetryCount - 1) {
                    console.log("第" + (retry + 1) + "次到达站设置失败，返回重试...")
                    back()
                    sleep(2000)
                    continue
                }
            }
        } else {
            console.info("arr1: " + arr1)
            sendOnlineLog("arr1: " + arr1)
            if (retry < arrRetryCount - 1) {
                console.log("第" + (retry + 1) + "次查找到达站元素失败，等待重试...")
                sleep(2000)
                continue
            }
            updateMonitorStatus("doPrepareQueryParameters", "返回4-找不到到达站元素");
            return 4
        }
    }
    if(!isArrOk) {
        updateMonitorStatus("doPrepareQueryParameters", "返回4-到达站未设置成功");
        return 4;
    }

    // var dates = id("home_page_depart_date_view_container").findOne(timeout)
    sleep((random() + random(2, 4)) * 200)
    updateMonitorStatus("doPrepareQueryParameters", "设置日期-查找日期容器(home_page_depart_date_view_container)");
    var dates = detectWidgetItem("id", "home_page_depart_date_view_container", "error", normal)
    if(dates != null){  
        sleep((random() + random(3, 5)) * 200)  
        // 明天, com.MobileTicket:id/home_page_depart_week_day, android.widget.TextView, false, null
        console.verbose(dates.text() + ", "  + dates.desc() + ", " + dates.id() + ", " + dates.className() + ", " + dates.clickable() + ", " + dates.bounds());
        // dates.click()
        var valid = dates.desc().indexOf(departSpecifiedDate)
        console.log("valid: " + valid)
        if(valid != -1) {
            console.log("日期已经是指定日期")
            sendOnlineLog("日期已经是指定日期")
            isDateOk = true
        } else {
            myCustomClick(dates)
            // sleep((random() + random(2, 5)) * 100)
            // text("选择日期").waitFor()
            updateMonitorStatus("doPrepareQueryParameters", "设置日期-查找选择日期页面");
            var chooseDatePage = detectWidgetItem("text", "选择日期", "error", 100)
            if(chooseDatePage == null) {
                console.error("设置日期时 没有跳到选择日期页面")
                sendOnlineLog("error", "设置日期时 没有跳到选择日期页面")
                updateMonitorStatus("doPrepareQueryParameters", "返回5-未跳到选择日期页面");
                return 5
            }
            // text("今天").waitFor()
            sleep((random() + random(2, 3)) * 200)
            var try_time = 0
            console.log("depart_date " + departSpecifiedDate)
            
            updateMonitorStatus("doPrepareQueryParameters", "日期查找: className(\"android.widget.Button\").textContains(\"" + departSpecifiedDate + "\").find()");
            var dateFindStartTime = Date.now();
            var toBeChoosedDate = className("android.widget.Button").textContains(departSpecifiedDate).find()
            var dateFindElapsed = Date.now() - dateFindStartTime;
            
            if (dateFindElapsed > 5000) {
                var reason = "日期find()调用耗时过长(" + dateFindElapsed + "ms)，可能页面控件过多导致阻塞";
                var location = "doPrepareQueryParameters日期查找: className(\"android.widget.Button\").textContains(\"" + departSpecifiedDate + "\").find()";
                var troubleshooting = getTroubleshootingTips("find 日期", departSpecifiedDate);
                recordFreeze(dateFindElapsed, reason, location, troubleshooting);
            }
            
            while(toBeChoosedDate.empty()) {
                var loopStartTime = Date.now();
                sleep(100)
                toBeChoosedDate = className("android.widget.Button").textContains(departSpecifiedDate).find()
                var loopElapsed = Date.now() - loopStartTime;
                try_time++
                
                if (loopElapsed > 5000) {
                    var reason = "日期find()循环调用耗时过长(" + loopElapsed + "ms)，第" + try_time + "次尝试";
                    var location = "doPrepareQueryParameters日期查找循环: className(\"android.widget.Button\").textContains(\"" + departSpecifiedDate + "\").find()";
                    var troubleshooting = getTroubleshootingTips("find 日期", departSpecifiedDate);
                    troubleshooting += "\n8.当前尝试次数: " + try_time + "/" + try_time_frequency_normal;
                    troubleshooting += "\n9.检查日期文本是否完全匹配";
                    recordFreeze(loopElapsed, reason, location, troubleshooting);
                }
                
                var totalElapsed = Date.now() - dateFindStartTime;
                if (totalElapsed > 30000) {
                    var reason = "日期查找总耗时超过30秒(" + totalElapsed + "ms)，可能JS假死";
                    var location = "doPrepareQueryParameters日期查找: 已尝试" + try_time + "次";
                    var troubleshooting = getTroubleshootingTips("find 日期", departSpecifiedDate);
                    troubleshooting += "\n8.当前尝试次数: " + try_time + "/" + try_time_frequency_normal;
                    troubleshooting += "\n9.建议: 使用findOne()替代find()，或添加超时机制";
                    troubleshooting += "\n10.检查页面是否需要滚动查看更多日期";
                    recordFreeze(totalElapsed, reason, location, troubleshooting);
                }
                
                if(try_time > try_time_frequency_normal) {
                    console.error("没法找到指定日期")
                    sendOnlineLog("error", "没法找到指定日期")
                    var finalElapsed = Date.now() - dateFindStartTime;
                    var reason = "日期查找失败，总耗时" + finalElapsed + "ms，尝试" + try_time + "次";
                    var location = "doPrepareQueryParameters日期查找: className(\"android.widget.Button\").textContains(\"" + departSpecifiedDate + "\").find()";
                    var troubleshooting = getTroubleshootingTips("find 日期", departSpecifiedDate);
                    troubleshooting += "\n8.已尝试" + try_time + "次均失败";
                    troubleshooting += "\n9.检查日期格式: 期望格式为\"月XX日\"，当前为\"" + departSpecifiedDate + "\"";
                    troubleshooting += "\n10.检查页面上是否存在该日期控件";
                    troubleshooting += "\n11.检查是否需要滚动页面";
                    recordFreeze(finalElapsed, reason, location, troubleshooting);
                    break;
                }
            }
            
            var totalDateFindElapsed = Date.now() - dateFindStartTime;
            if (totalDateFindElapsed > 10000) {
                console.log("[日期监控] 日期查找总耗时: " + totalDateFindElapsed + "ms, 找到控件数: " + (toBeChoosedDate.empty() ? 0 : toBeChoosedDate.size()));
            }
            
            for(var i=0;i<toBeChoosedDate.size();i++) {
                var tv = toBeChoosedDate.get(i)
                console.verbose(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc());
                if(tv.clickable() && tv.text().indexOf("农历") !== -1) {
                    // tv.click()
                    myCustomClick(tv)
                    isDateOk = true
                    break;
                }
            }         
        }
    } else {
        console.info("dates: " + dates)
        sendOnlineLog("dates: " + dates)
        updateMonitorStatus("doPrepareQueryParameters", "返回5-找不到日期容器");
        return 5
    }
    sleep((random() + random(2, 4)) * 200)

    if(!isDateOk) {
        updateMonitorStatus("doPrepareQueryParameters", "返回5-日期未设置成功");
        return 5;
    }

    updateMonitorStatus("doPrepareQueryParameters", "完成");
    return 0;
}

// 查询
function doQueryAndSelectTrain() {
    var foundResult = 6
    // text("查询车票").waitFor()
    updateMonitorStatus("doQueryAndSelectTrain", "查询车票-查找查询车票按钮");
    var queryTickets = detectWidgetItem("text", "查询车票", "error", normal)
    if(queryTickets == null) {
        return 18
    } 
    sleep((random() + random(3, 5)) * 100)
    // textContains("查询车票").find().forEach(function(tv){    
    //     console.log(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc());
    // });
    // id("ticket_home_btn_search").click()
    myCustomClick(detectWidgetItem("id", "com.MobileTicket:id/ticket_home_btn_search", "error", normal))
    sleep((random() + random(2, 5)) * 200)
    // className("android.widget.Button").text("直达").waitFor()
    // var zhida = detectWidgetItem("text", "直达", "error", 100)
    var zhida = detectWidgetItemWithChainClassnameTextcontains("android.view.View", "直达", "error", 100 * 2)
    if(zhida == null) {
        return 19
    } 
    console.log("zhida: find")
    sleep((random() + random(2, 5)) * 100)
    // 查找超时
    // var trainButton = className("android.widget.Button").textContains(theTrainFormat).textContains(arriveStaName + ",").findOne(timeout * 10);
    // C 7 4 4 1次列车14点24分从海口东出发16点16分到达三 亚,历时1时52分,
    // D 7 9 3 3次列车15点12分从双鸭山西出发18点9分到达哈  尔  滨,历时2时57分,
    // todo  三 亚 有空格
    // var trainButton = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains("android.widget.Button", theTrainFormat + "次", "从" + departStaName + "出发" ,"到达" + arriveStaName.slice(0,1), arriveStaName.slice(1) + ",历时", "error", 100)
    console.log(theTrainFormat)
    updateMonitorStatus("doQueryAndSelectTrain", "查询结果-查找指定车次(" + theTrainFormat + "次)");
    var trainButton = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains("android.widget.Button", theTrainFormat + "次", "从" + departStaName + "出发" ,"到达" + arriveStaShorcut + ",历时", "error", 100)
    if(trainButton != null && trainButton.bounds().height() <= 20) {
        //不可见
        var swipe_count = random(0, 2)
        for(var i = 0; i < swipe_count; i++) {
            sleep((random() + random(1, 3)) * 100)
            swipe(width / 2  + (random() + random(0,2) -2) * 100 , height / 2 + (random() + random(2,5)) * 100 , width / 2  + (random() + random(0,2) -2) * 100, height / 2 - (random() + random(2,5)) * 100 , (random() + random(1, 4)) * 100)
            // sleep((random() + random(2, 5)) * 100)
            // swipe(width / 2  + (random() + random(0,2) -2) * 100 , height / 2 + (random() + random(2,5)) * 100 , width / 2  + (random() + random(0,2) -2) * 100, height / 2 - (random() + random(2,5)) * 100 , random() * 500)    
        }
    }

    // sleep((random() + random(2, 5)) * 100)
    // swipe(582 + random(40, 100) * 100 , 1104 + random(40, 100) * 100 , 609 + random(40, 100) * 100 , 467 + random(40, 100) * 100 , random(70, 100) * 100)

    // textContains("长沙南").find().forEach(function(tv){    
    //     console.log(tv.text() + ", " + tv.id() + ", " + tv.className() + ", " + tv.clickable() + ", " + tv.desc());
    // });

    sleep((random() + random(3, 4)) * 200)
    if(trainButton != null) {
        // Todo 预定的火车可能不在屏幕上
        // console.log(trainButton.parent())
        trainButton.parent().click()
        // myCustomClick(trainButton.parent())
        // wait for 预定 按钮
        sleep((random() + random(2, 4)) * 200)
        // console.log(trainButton)
        // console.log(trainButton.parent())
        // console.log(trainButton.parent().childCount())
        // console.log(trainButton.parent().parent())
        // console.log(trainButton.parent().parent().childCount())
        updateMonitorStatus("doQueryAndSelectTrain", "选择车次后-重新验证车次信息(" + theTrainFormat + "次)");
        trainButton = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains("android.widget.Button", theTrainFormat + "次", "从" + departStaName + "出发" ,"到达" + arriveStaShorcut + ",历时", "error", 100)
        var index = trainButton.parent().parent().childCount() - 1
        console.log("index: " + index)
        var ticketInfo = trainButton.parent().parent().child(index)
        for(var i = 0; i < ticketInfo.childCount(); i++){
            var child = ticketInfo.child(i);
            // for(var j = 0; j < child.childCount(); j++){
            //     var child2 = child.child(j);
            //     console.log(child2.text() + ", " + child2.id() + ", " + child2.className() + ", " + child2.clickable() + ", " + child2.desc());
            // }
            if(child.childCount() >= 2) {
                for(var j = 0; j < child.childCount(); j++){
                    if(j >= 2) {
                        if(child.child(j).text() == "预订" && child.child(j - 1).text() != "售罄" && child.child(j - 1).text() != "无") {
                            console.log("预订")
                            sendOnlineLog("info", "预订")
                            child.child(j).click()
                            foundResult = 0
                            break
                        }
                    }
                }
                // var childIndex = 0
                // if (i == ticketInfo.childCount() - 1) {
                //     childIndex = child.childCount() - 1
                // } else {
                //     childIndex = child.childCount() - 2
                // }
                
                // if(child.child(childIndex - 1).text() != "售罄" && child.child(childIndex).text() == "预订") 
                // {
                //     console.log("预订")
                //     sendOnlineLog("预订")
                //     child.child(childIndex).click()
                //     foundResult = 0
                //     break
                // }
            }
            if(foundResult == 0)
                break
        }
        // var trainButton2 = detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains("android.widget.Button", theTrainFormat + "次", "从" + departStaName + "出发" ,"到达" + arriveStaName + ",历时", "error", 100)
        // console.log(trainButton2.parent().parent().childCount())
        // var bookings = className("android.view.View").text("预订").find()
        // for(var i = 0; i < bookings.length; i++) {
        //     console.log(bookings[i].text() + ", " + bookings[i].id() + ", " + bookings[i].className() + ", " + bookings[i].clickable() + ", " + bookings[i].desc());
        //     if(bookings[i].parent().child(3).text() != "售罄") {
        //         bookings[i].click()
        //         foundResult = 0
        //         break
        //     }
          
        // }

        if(foundResult != 0) { 
            foundResult = 68
        }
    } else {
        console.error("train not found!")
    }
    sleep((random() + random(1, 3)) * 100)
    return foundResult
}

function GetDateTimeToString()
{
    var date_ = new Date();
    var year = date_.getFullYear();
    var month = date_.getMonth() + 1;
    var day = date_.getDate();
    if(month<10) month = "0"+month;
    if(day<10) day = "0"+day;

    var hours = date_.getHours();
    var mins = date_.getMinutes();
    var secs = date_.getSeconds();
    if(hours<10) hours = "0"+hours;
    if(mins<10) mins = "0"+mins;
    // if(secs<10) secs = "0"+secs;
    return year + '' +month + '' +day + '' + hours + '' +mins;
}

function padZero(value) {
    return String(value).padStart(2, '0');
}

function formatLogDate()
{
    var date = new Date();
    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1);
    const day = padZero(date.getDate());
    const hour = padZero(date.getHours());
    const minute = padZero(date.getMinutes());
    const second = padZero(date.getSeconds());
  
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 获取截屏权限
function doRequestScreenCapturePermission(){
    var requestRight = false
    threads.start(function () {
        requestRight = requestScreenCapture()
        console.info("截屏权限 " + requestRight)
    });

    sleep((random() + random(2, 5)) * 500)
    if(!requestRight) {
        packageName("com.android.systemui").textContains("截取您的屏幕上显示的所有内容").waitFor()
        var confirmScreenRight = packageName("com.android.systemui").id("remember").className("android.widget.CheckBox").findOne(timeout)
        if(confirmScreenRight != null) {
            sleep((random() + random(2, 5)) * 100)
            if(!confirmScreenRight.checked()) {
                confirmScreenRight.click()
            }
            packageName("com.android.systemui").className("android.widget.Button").text("立即开始").click()
        } else {
            console.info("permission window 没找到")
        }
    }
}

// 截屏并且保存图片
function doCaptureAndSaveImage(name) {
    // if(name == "doPrepareQueryParameters") {
    //     sleep((random() + random(1, 3)) * 100)
    //     var img = captureScreen();
    //     var savePath = name + GetDateTimeToString() + ".jpg"
    //     console.info(savePath)
    //     images.save(img, logPath + savePath, "jpg", 50);
    // }
}

// 自定义点击
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

function myCustomClickObject(obj) {
    // console.log("obj " + obj)
    if(obj == null) {
        console.error("invalid obj " + obj)
        sendOnlineLog("error", "invalid obj " + obj)
        return
    }

    // console.error("obj被遮挡 " + obj)
    // sendOnlineLog("error", "obj被遮挡 " + obj)
    obj.click()
    return

}

function myCustomClickNotClickable(obj) {
    // console.log("obj " + obj)
    if(obj == null) {
        console.error("invalid obj " + obj)
        return
    }
    // console.log("visibleToUser " + obj.visibleToUser())
    // console.log("height " + obj.bounds().height())
    if(obj.bounds().height() <= 40) {
        console.error("obj不可见 " + obj)
        obj.click()
        return
    }
    var bound = obj.bounds()
    var x = bound.centerX()
    var y = bound.centerY()
    var w = bound.width()
    var h = bound.height()

    var x1 = Math.ceil(x + random(-w / 3, w / 3)), y1 = Math.ceil(y + random(-h / 3, h / 3))
    var isCicked = click(x1 , y1)
    if(!isCicked) {
        console.log(obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
        sendOnlineLog("error", obj.text() + ", " + obj.id() + ", isCicked " + isCicked +", x1 = " + x1 + ", y1 = " + y1 )
    }
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
    
    var operation = item_type + "(\"" + item_content + "\").findOne()";
    updateMonitorStatus("detectWidgetItem", operation);
    
    var startTime = Date.now();
    var result = null;
    
    if (item_type == "text") {
        let detect_widget_item = text(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            result = null;
        } else {
            result = detect_widget_item;
        }
    }
    else if (item_type == "id") {
        let detect_widget_item = id(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            result = null;
        } else {
            result = detect_widget_item;
        }
    }
    else if (item_type == "textContains") {
        let detect_widget_item = textContains(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            result = null;
        } else {
            result = detect_widget_item;
        }
    }
    else if (item_type == "desc") {
        let detect_widget_item = desc(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            result = null;
        } else {
            result = detect_widget_item;
        }
    } else if(item_type == "className") {
        let detect_widget_item = className(item_content).findOne(try_time_max * 100);
        if(!detect_widget_item) {
            detectWidgetItemLog(log_level, item_content, try_time_max);
            result = null;
        } else {
            result = detect_widget_item;
        }
    } else {
        console.error("invalid " + item_type)
        result = null;
    }
    
    var elapsed = Date.now() - startTime;
    if (elapsed > 10000) {
        var reason = "findOne()调用耗时过长(" + elapsed + "ms)，可能页面控件过多";
        var location = "detectWidgetItem: " + operation;
        var troubleshooting = getTroubleshootingTips("find", item_content);
        recordFreeze(elapsed, reason, location, troubleshooting);
    }
    
    updateMonitorStatus("detectWidgetItem", "完成");
    return result;
}

function detectWidgetItem1(item_type, item_content, log_level, try_time_frequency) {
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
        let detect_widget_item = text(item_content).findOnce();
        let try_time = 0;
        while (!detect_widget_item) {
            sleep(100);
            detect_widget_item = text(item_content).findOnce();
            try_time++;
            if (try_time > try_time_max) {
                detectWidgetItemLog(log_level, item_content, try_time_max);
                return null;
            }
        }
        return detect_widget_item;
    }
    else if (item_type == "id") {
        let detect_widget_item = id(item_content).findOnce();
        let try_time = 0;
        while (!detect_widget_item) {
            sleep(100);
            detect_widget_item = id(item_content).findOnce();
            try_time++;
            if (try_time > try_time_max) {
                detectWidgetItemLog(log_level, item_content, try_time_max);
                return null;
            }

            if(global_result != 0) {
                console.log("global_result: " + global_result)
                return null;
            }

        }
        return detect_widget_item;
    }
    else if (item_type == "textContains") {
        let detect_widget_item = textContains(item_content).findOnce();
        let try_time = 0;
        while (!detect_widget_item) {
            sleep(100);
            detect_widget_item = textContains(item_content).findOnce();
            try_time++;
            if (try_time > try_time_max) {
                detectWidgetItemLog(log_level, item_content, try_time_max);
                return null;
            }
        }
        return detect_widget_item;
    }
    else if (item_type == "desc") {
        let detect_widget_item = desc(item_content).findOnce();
        let try_time = 0;
        while (!detect_widget_item) {
            sleep(100);
            detect_widget_item = desc(item_content).findOnce();
            try_time++;
            if (try_time > try_time_max) {
                detectWidgetItemLog(log_level, item_content, try_time_max);
                return null;
            }
        }
        return detect_widget_item;
    } else if(item_type == "className") {
        let detect_widget_item = className(item_content).findOnce();
        let try_time = 0;
        while (!detect_widget_item) {
            sleep(100);
            detect_widget_item = className(item_content).findOnce();
            try_time++;
            if (try_time > try_time_max) {
                detectWidgetItemLog(log_level, item_content, try_time_max);
                return null;
            }
        }
        return detect_widget_item;
    } else {
        console.error("invalid " + item_type)
    }
}

//         id("h5_title").text("选择乘车人").waitFor()
function detectWidgetItemWithChain(id_str, text_str, log_level, try_time_frequency) {
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
    let detect_widget_item = id(id_str).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = id(id_str).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, id_str + "|" + text_str, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}

//         id("h5_title").text("选择乘车人").waitFor()
function detectWidgetItemWithChainIdTextcontains(id_str, text_str, log_level, try_time_frequency) {
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
    let detect_widget_item = id(id_str).textContains(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = id(id_str).textContains(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, id_str + "|" + text_str, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}


//         id("h5_title").text("选择乘车人").waitFor()
function detectWidgetItemWithChain1(id_str, text_str, log_level, try_time_frequency) {
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
    let detect_widget_item = id(id_str).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = id(id_str).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, id_str + "|" + text_str, try_time_max);
            return null;
        }
        if(global_result != 0) {
            console.log("global_result: " + global_result)
            return null;
        }
    }
    return detect_widget_item;
}

function detectWidgetItemWithChain2(id_str, text_str, log_level, try_time_frequency) {
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
    let detect_widget_item = id(id_str).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = id(id_str).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, id_str + "|" + text_str, try_time_max);
            return null;
        }
        if(global_result != 0 && global_result == 60) {
            console.log("global_result: " + global_result)
            return null;
        }
    }
    return detect_widget_item;
}

// var orderConfirm1 = className("android.widget.Button").text("提交订单").findOne(timeout * 2);
function detectWidgetItemWithChainClassnameText1(class_name, text_str, log_level, try_time_frequency) {
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
    let detect_widget_item = className(class_name).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = className(class_name).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + text_str, try_time_max);
            return null;
        }

        if(global_result != 0) {
            console.log("global_result: " + global_result)
            return null;
        }
    }
    return detect_widget_item;
}

// var orderConfirm1 = className("android.widget.Button").text("提交订单").findOne(timeout * 2);
function detectWidgetItemWithChainClassnameText2(class_name, text_str, log_level, try_time_frequency) {
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
    let detect_widget_item = className(class_name).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = className(class_name).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + text_str, try_time_max);
            return null;
        }

        if(global_result == 240) {
            console.log("global_result: " + global_result)
            return null;
        }
        if(global_result == 241) {
            console.log("global_result: " + global_result)
            return null;
        }

    }
    return detect_widget_item;
}

// var orderConfirm1 = className("android.widget.Button").text("提交订单").findOne(timeout * 2);
function detectWidgetItemWithChainClassnameText(class_name, text_str, log_level, try_time_frequency) {
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
    let detect_widget_item = className(class_name).text(text_str).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = className(class_name).text(text_str).findOnce();
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + text_str, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}

// var orderConfirm1 = className("android.widget.Button").text("提交订单").findOne(timeout * 2);
function detectWidgetItemWithChainClassnameTextcontains(class_name, text_str, log_level, try_time_frequency) {
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
    
    var operation = "className(\"" + class_name + "\").textContains(\"" + text_str + "\").findOnce()";
    updateMonitorStatus("detectWidgetItemWithChainClassnameTextcontains", operation);
    
    var startTime = Date.now();
    let detect_widget_item = className(class_name).textContains(text_str).findOnce();
    let try_time = 0;
    
    while (!detect_widget_item) {
        var loopStartTime = Date.now();
        sleep(100);
        detect_widget_item = className(class_name).textContains(text_str).findOnce();
        try_time++;
        
        var loopElapsed = Date.now() - loopStartTime;
        if (loopElapsed > 5000) {
            var reason = "findOnce()在循环中耗时过长(" + loopElapsed + "ms)，可能页面控件过多导致阻塞";
            var location = "detectWidgetItemWithChainClassnameTextcontains循环第" + try_time + "次: " + operation;
            var troubleshooting = getTroubleshootingTips("find 日期", text_str);
            recordFreeze(loopElapsed, reason, location, troubleshooting);
        }
        
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + text_str, try_time_max);
            var totalElapsed = Date.now() - startTime;
            if (totalElapsed > 10000) {
                var reason = "整体循环耗时过长(" + totalElapsed + "ms)，尝试" + try_time + "次均失败";
                var location = "detectWidgetItemWithChainClassnameTextcontains: " + operation;
                var troubleshooting = getTroubleshootingTips("find 日期", text_str);
                recordFreeze(totalElapsed, reason, location, troubleshooting);
            }
            updateMonitorStatus("detectWidgetItemWithChainClassnameTextcontains", "完成-失败");
            return null;
        }
    }
    
    var totalElapsed = Date.now() - startTime;
    if (totalElapsed > 10000) {
        var reason = "整体执行耗时过长(" + totalElapsed + "ms)，尝试" + try_time + "次";
        var location = "detectWidgetItemWithChainClassnameTextcontains: " + operation;
        var troubleshooting = getTroubleshootingTips("find 日期", text_str);
        recordFreeze(totalElapsed, reason, location, troubleshooting);
    }
    
    updateMonitorStatus("detectWidgetItemWithChainClassnameTextcontains", "完成-成功");
    return detect_widget_item;
}

//    var trainButton = className("android.widget.Button").textContains(theTrainFormat).textContains(arriveStaName).findOne(timeout * 10);
function detectWidgetItemWithChainClassnameTextcontainsTextcontains(class_name, text_str, text_str2, log_level, try_time_frequency) {
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
    let detect_widget_item = className(class_name).textContains(text_str).textContains(text_str2).findOnce();
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        detect_widget_item = className(class_name).textContains(text_str).textContains(text_str2).findOnce();;
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + text_str + "|" + text_str2, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}


//    var trainButton = className("android.widget.Button").textContains(theTrainFormat).textContains(arriveStaName).findOne(timeout * 10);
function detectWidgetItemWithChainClassnameTextcontainsTextcontainsTextcontains(class_name, trainNo, depart, arrive, log_level, try_time_frequency) {
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
    let views = className(class_name).textContains(trainNo).find();
    var detect_widget_item = null
    for(var i = 0; i < views.size(); i++) {
        var tv = views.get(i)
        var txt = tv.text().split(' ').join('')
        if(txt.indexOf(depart) != -1 && txt.indexOf(arrive) != -1) {
            detect_widget_item = tv
            break
        }
    }
    let try_time = 0;
    while (!detect_widget_item) {
        sleep(100);
        let views = className(class_name).textContains(trainNo).find();  
        for(var i = 0; i < views.size(); i++) {
            var tv = views.get(i)
            var txt = tv.text().split(' ').join('')
            if(txt.indexOf(depart) != -1 && txt.indexOf(arrive) != -1) {
                detect_widget_item = tv
                break
            }
        }
        try_time++;
        if (try_time > try_time_max) {
            detectWidgetItemLog(log_level, class_name + "|" + trainNo + "|" + depart  + "|" + arrive, try_time_max);
            return null;
        }
    }
    return detect_widget_item;
}

function detectWidgetItemLog(log_level, item_content, try_time_max) {
    let log_message = "已尝试检测" + try_time_max + "次，均未检测到「" + item_content + "」控件";
    if(item_content != "h5_title|人证核验") {
        sendOnlineLog(log_level, log_message);
    }

    switch (log_level) {
        case "info":
            console.info(log_message);
            break;
        case "error":
            console.error(log_message);
            break;
        case "log":
            console.log(log_message);
            break;
        case "warn":
            console.warn(log_message);
            break;
        case "none":
            console.verbose(log_message);
            break;
    }
}

function guardThread() {
    if(clickTipThread != null) {
        if(!clickTipThread.isAlive()) {
            console.log("clickTipThread " + clickTipThread.isAlive())
            doClickTipWindow()
        }
    }
    if(clickTipThread2 != null) {
        if(!clickTipThread2.isAlive()) {
            console.log("clickTipThread2 " + clickTipThread2.isAlive())
            doClickTipWindow2()
        }
    }

    if(clickTipThread3 != null) {
        if(!clickTipThread3.isAlive()) {
            console.log("clickTipThread3 " + clickTipThread3.isAlive())
            doClickTipWindow3()
        }
    }

    if(checkWaitResultThread != null) {
        if(!checkWaitResultThread.isAlive()) {
            console.log("checkWaitResultThread " + checkWaitResultThread.isAlive())
            doCheckWaitResult()
        }
    }

    if(clickRetryView != null) {
        if(!clickRetryView.isAlive()) {
            console.log("clickRetryView " + clickRetryView.isAlive())
            doClickRetryView()
        }
    }
    if(checkNeedLoginThread != null) {
        if(!checkNeedLoginThread.isAlive()) {
            console.log("checkNeedLoginThread " + checkNeedLoginThread.isAlive())
            doCheckLoginWindow()
        }
    }
    if(checkQuickOrderThread != null) {
        if(!checkQuickOrderThread.isAlive()) {
            console.log("checkQuickOrderThread " + checkQuickOrderThread.isAlive())
            doCheckQuickOrder()
        }
    }

    // if(clickCancelUpdateThread != null) {
    //     if(!clickCancelUpdateThread.isAlive()) {
    //         console.log("clickCancelUpdateThread " + clickCancelUpdateThread.isAlive())
    //         doClickCancelUpdateThread()
    //     }
    // }

    // if(clickAccessibilityThread != null) {
    //     if(!clickAccessibilityThread.isAlive()) {
    //         console.log("clickAccessibilityThread " + clickAccessibilityThread.isAlive())
    //         doClickAccessibilityWindow()
    //     }
    // }

    // if(clickPermissionDialogThread != null) {
    //     if(!clickPermissionDialogThread.isAlive()) {
    //         console.log("clickPermissionDialogThread " + clickPermissionDialogThread.isAlive())
    //         doClickPermissionDialog()
    //     }
    // }

    // if(clickFengKongThread != null) {
    //     if(!clickFengKongThread.isAlive()) {
    //         console.log("clickFengKongThread " + clickFengKongThread.isAlive())
    //         doClickFengKongDialog()
    //     }
    // }

    // var cur = currentPackage()
    // // console.log("当前package " + cur)
    // if("com.MobileTicket" != cur) {
    //     console.log("当前package " + cur + ", 拉取12306到前台")
    //     sleep(60 * 1000);
    //     app.launchApp("铁路12306")
    //     sleep(5000);
    // }

    // if(needRestart && taskId == "") {
    //     console.log("重启12306")
    //     sendOnlineLog("info", "重启12306")
    //     restart1P2306()
    //     needRestart = false
    // }
    var currentTimeStamp = Math.ceil(new Date().getTime() / 1000)
    // console.log("currentTimeStamp " + currentTimeStamp + ", latestTimestampReceivePing " + latestTimestampReceivePing + ", " + (currentTimeStamp - latestTimestampReceivePing))
    // sendOnlineLog("info", "currentTimeStamp " + currentTimeStamp + ", latestTimestampReceivePing " + latestTimestampReceivePing + ", " + (currentTimeStamp - latestTimestampReceivePing))
    if(currentTimeStamp - latestTimestampReceivePing > 290) {
        console.error("需要启动12306")
        sendOnlineLog("error", "需要启动12306")

        // clear_data()
        if(startCount == 3) {
            kill12306()
            sleep(3000);
        }
        sleep((random() + random(2, 5)) * 200)
        start12306()
    }
}

function restart12306() {
    sleep(6000)
    kill12306()
    // sleep(6000)
    // clear_data()
    sleep(3000)
    start12306()

    // if(workThread != null) {
    //     console.log("重置状态")
    //     workThread.interrupt()
    //     error_code = 0;
    //     global_result = 0;
    //     lock.lock()
    //     taskId = "";
    //     lock.unlock() 
    // }


    // var currentTimeStamp = Math.ceil(new Date().getTime() / 1000)
    // if(currentTimeStamp - latestTimestampReceivePing > 68) {
    //     console.error("需要重启12306")
        // var sh = new Shell(false);
        //强制停止微信
        // shell("am force-stop com.MobileTicket");
        
        // sleep(3000)
        // app.launchApp("铁路12306")

        // var pkgname = app.getPackageName("铁路12306")
        // // launch时不会重启已经启动的12306
        // var isMobileTicketAppExist = app.launch(pkgname);
        // if(!isMobileTicketAppExist) {
        //     console.error("12306未安装")
        //     return 
        // }
        // latestTimestampReceivePing = Math.ceil(new Date().getTime() / 1000)
        // sh.exec("am start -n com.MobileTicket/com.MobileTicket.ui.activity.WelcomeGuideActivity");
        // sh.exit();
    // }
}

function kill12306()  {
    kill_app("铁路12306")
    startCount = 0
}

function start12306() {
    // org.autojs.autoxjs.v6
    // 需要将autojs 拿到前台，否则无法拉起12306
    startCount++
    var currentApp = currentPackage()
    if(currentApp != autojs_package_name) {
        app.launch(autojs_package_name);
        sleep(1000)
    }
    sleep(1000)
    console.info("启动12306")
    sendOnlineLog("info", "启动12306")
    app.launchApp("铁路12306")
    sleep(3 * 1000)
    var pkgname = app.getPackageName("铁路12306")
    // launch时不会重启已经启动的12306
    app.launch(pkgname);
    // waitForPackage(pkgname)
        // 第一次启动，需要多等一会
    sleep((random() + random(3, 5)) * 1000)
        // Todo 清理后，需要点击隐私和动态页面
    doSkipPersonalPrivacyGuide()
    // if(!isMobileTicketAppExist) {
    //     console.error("12306未安装")
    //     return 
    // }
    latestTimestampReceivePing = Math.ceil(new Date().getTime() / 1000)
}

function kill_app(packageName) {
    var name = getPackageName(packageName);
    console.log("kill " + name)
    if (!name) {
        if (getAppName(packageName)) {
            name = packageName;
        } else {
            console.log("没有安装" + packageName);

            return false;
        }
    }
    app.openAppSetting(name);
    sleep((random() + random(2, 5)) * 200)
    var app_settings = detectWidgetItem("text", app.getAppName(name), "info", normal)
    if(app_settings != null) {
        var clearBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "清除数据", "info", normal)
        if(clearBtn != null) {
            back()
            sleep((random() + random(2, 5)) * 200)
        }

        let is_sure = textMatches(/(.*强.*|.*停.*|.*结.*|.*行.*)/).findOne();
        if (is_sure.enabled()) {
            textMatches(/(.*强.*|.*停.*|.*结.*|.*行.*)/).findOne().click();
            sleep(1000);
            text("强行停止").findOne().click();
            // textMatches(/(.*确.*|.*定.*)/).findOne().click();
            console.log(app.getAppName(name) + "应用已被关闭");
            sendOnlineLog("info", app.getAppName(name) + "应用已被关闭")
            // className("android.widget.ImageButton").findOne().click()
            sleep(1000);
            back();
        } else {
            console.log(app.getAppName(name) + "应用不能被正常关闭或不在后台运行");
            sendOnlineLog("warn", app.getAppName(name) + "应用不能被正常关闭或不在后台运行")
            back();
        }
    }
}

function clear_data() {
    console.log("清理数据")
    sendOnlineLog("info", "清理数据")
    var packageName = "铁路12306"
    var name = getPackageName(packageName);
    if (!name) {
        if (getAppName(packageName)) {
            name = packageName;
        } else {
            console.log("应用未安装")
            return false;
        }
    }
    app.openAppSetting(name);
    sleep((random() + random(2, 5)) * 200)
    var app_settings = detectWidgetItem("text", app.getAppName(name), "info", normal)
    if(app_settings != null) {
        sleep((random() + random(2, 5)) * 200)
        var storageBtn = detectWidgetItem("textContains", "内部存储空间已使用", "info", normal)
        if(storageBtn != null) {
            var click = storageBtn.parent().parent().parent().click();
            sendOnlineLog("info", "点击内部存储空间已使用" + click)
            sleep((random() + random(2, 5)) * 200)
            if(!click) {
                myCustomClick(storageBtn)
                sleep((random() + random(2, 5)) * 200)
                sendOnlineLog("info", "myCustomClick 点击内部存储空间已使用") 
            }
            var clearBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "清除数据", "info", normal)
            if(clearBtn != null) {
                clearBtn.click()
                sleep((random() + random(2, 5)) * 200)
                if(className("android.widget.Button").text("删除").exists()) {
                    className("android.widget.Button").text("删除").click();
                    sendOnlineLog("info", "点击删除,清理数据成功")
                    sleep((random() + random(2, 5)) * 200)
                }
            } else {         
                return false
            }
        }else {
            var clearBtn = detectWidgetItemWithChainClassnameText("android.widget.Button", "清除数据", "info", normal)
            if(clearBtn != null) {
                clearBtn.click()
                sleep((random() + random(2, 5)) * 200)
                if(className("android.widget.Button").text("删除").exists()) {
                    className("android.widget.Button").text("删除").click();
                    sendOnlineLog("info", "点击删除,清理数据成功")
                    sleep((random() + random(2, 5)) * 200)
                }
            } else {       
                return false
            }
        }
        return true;
    } else {
        return false
    }
}

    // 获取内网IP地址
function getIntranetIP() {
    let networkInterfaces = NetworkInterface.getNetworkInterfaces();
    while (networkInterfaces.hasMoreElements()) {
      let networkInterface = networkInterfaces.nextElement();
      let inetAddresses = networkInterface.getInetAddresses();
      while (inetAddresses.hasMoreElements()) {
        let inetAddress = inetAddresses.nextElement();
        if (inetAddress instanceof Inet6Address) {
          continue;
        }
        let ip = inetAddress.getHostAddress();
        // console.log(ip);
        if (!"127.0.0.1".equals(ip)) {
          return inetAddress.getHostAddress();
        }
      }
    }
  }


// 查询pid
function getPid() {
    var packageName = "com.MobileTicket";
    // var processName = "com.MobileTicket";
    var am = context.getSystemService(java.lang.Class.forName("android.app.ActivityManager"));
    var list = am.getRunningAppProcesses();
    for (var i = 0; i < list.size(); i++) {
        var info = list.get(i);
        if (info.processName == packageName) {
            return info.pid;
        }
    }
    return -1;
}


// 发送日志
function sendOnlineLog(level, message) {
    // 注释掉日志上报服务器代码，只保留console输出
    // threads.start(function () {
    //     try {
    //         if(new String(message).startsWith("/order {")) {
    //             console.log("加密数据")
    //             var info = JSON.parse(message.substring(7));
    //             info.proxy = encryptData(info.proxy);
    //             info.login.username = encryptData(info.login.username);
    //             info.login.password = encryptData(info.login.password);
    //             var accountInfo = JSON.parse(info.login.session.accountInfoStr);
    //             accountInfo.user_name = encryptData(accountInfo.user_name);
    //             info.login.session.accountInfoStr = JSON.stringify(accountInfo
    //                 ).replace(/\\u003d/g, '=')
    //             info.login.session.userName = encryptData(info.login.session.userName);
    //             var ps = info.order.passengers
    //             for(var i = 0; i < ps.length; i++) {
    //                 var i_t = ps[i].identity_type
    //                 switch (i_t) {
    //                     case "1": {
    //                         if(ps[i].identity_no.indexOf('*') == -1) {
    //                             var i_no = ps[i].identity_no
    //                             ps[i].identity_no = i_no.substr(0,4) + "***********" + i_no.substr(15,3);
    //                         }
    //                         if(ps[i].phone.indexOf('*') == -1) {
    //                             var phone = ps[i].phone
    //                             ps[i].phone = phone.substr(0,3) + "****" + phone.substr(7,4)
    //                         }
    //                     }
    //                     break;
    //                     default:
    //                     break
    //                 }
    //
    //             }
    //
    //             var info_str = JSON.stringify(info);
    //             message = "/order " + info_str.replace(/\\u003d/g, '=')
    //             // console.log("加密数据 " + message)
    //         }
    //         var url = "http://10.188.200.8:12204/gelf";
    //         var res = http.postJson(url, {
    //             time: formatLogDate,
    //             level: level,
    //             short_message: message,
    //             tag: taskId + "_android_click",
    //             facility: "android_click",
    //             secondfacility: "12306_request_fg",
    //             elapsedtime: "0",
    //             duration: 12,
    //             host: getIntranetIP() + '/unknown',
    //             branch: "",
    //             commit: "",
    //             line: "self_new3"//基线
    //         }, {}, function(res, err){
    //             if(err){
    //                 console.error("sendOnlineLog " + err);
    //                 return;
    //             }
    //             // log("code = " + res.statusCode);
    //             // log("html = " + res.body.string());
    //         });
    //     } catch (error) {
    //         console.error("sendOnlineLog catch " + err);
    //     }
    // });
    
    // 只保留console输出
    if (level == "error") {
        console.error(message);
    } else if (level == "warn") {
        console.warn(message);
    } else if (level == "info") {
        console.info(message);
    } else {
        console.log(message);
    }
}

function sendOnlineLogTime(level, message, duration) {
    // 注释掉日志上报服务器代码，只保留console输出
    // threads.start(function () {
    //     try {
    //         if(new String(message).startsWith("/order {")) {
    //             console.log("加密数据")
    //             var info = JSON.parse(message.substring(7));
    //             info.proxy = encryptData(info.proxy);
    //             info.login.username = encryptData(info.login.username);
    //             info.login.password = encryptData(info.login.password);
    //             var accountInfo = JSON.parse(info.login.session.accountInfoStr);
    //             accountInfo.user_name = encryptData(accountInfo.user_name);
    //             info.login.session.accountInfoStr = JSON.stringify(accountInfo
    //                 ).replace(/\\u003d/g, '=')
    //             info.login.session.userName = encryptData(info.login.session.userName);
    //             var ps = info.order.passengers
    //             for(var i = 0; i < ps.length; i++) {
    //                 var i_t = ps[i].identity_type
    //                 switch (i_t) {
    //                     case "1": {
    //                         if(ps[i].identity_no.indexOf('*') == -1) {
    //                             var i_no = ps[i].identity_no
    //                             ps[i].identity_no = i_no.substr(0,4) + "***********" + i_no.substr(15,3);
    //                         }
    //                         if(ps[i].phone.indexOf('*') == -1) {
    //                             var phone = ps[i].phone
    //                             ps[i].phone = phone.substr(0,3) + "****" + phone.substr(7,4)
    //                         }
    //                     }
    //                     break;
    //                     default:
    //                     break
    //                 }
    //
    //             }
    //
    //             var info_str = JSON.stringify(info);
    //             message = "/order " + info_str.replace(/\\u003d/g, '=')
    //             // console.log("加密数据 " + message)
    //         }
    //         var url = "http://10.188.200.8:12204/gelf";
    //         var res = http.postJson(url, {
    //             time: formatLogDate,
    //             level: level,
    //             short_message: message,
    //             tag: taskId + "_android_click",
    //             facility: "android_click",
    //             secondfacility: "12306_request_fg",
    //             elapsedtime: "0",
    //             duration: duration,
    //             host: getIntranetIP() + '/unknown',
    //             branch: "",
    //             commit: "",
    //             line: "self_new3"//基线
    //         }, {}, function(res, err){
    //             if(err){
    //                 console.error("sendOnlineLog " + err);
    //                 return;
    //             }
    //             // log("code = " + res.statusCode);
    //             // log("html = " + res.body.string());
    //         });
    //     } catch (error) {
    //         console.error("sendOnlineLog catch " + err);
    //     }
    // });
    
    // 只保留console输出
    if (level == "error") {
        console.error(message);
    } else if (level == "warn") {
        console.warn(message);
    } else if (level == "info") {
        console.info(message);
    } else {
        console.log(message);
    }
}

function encryptData(data) {
    if(data == null || data == "") {
        return "";
    }

    let cipher = javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
    let secretKeySpec = new javax.crypto.spec.SecretKeySpec(aes_key.getBytes(), "AES");
    let ivParameterSpec = new javax.crypto.spec.IvParameterSpec(aes_key.getBytes());
    cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, secretKeySpec, ivParameterSpec);
    let encrypted = cipher.doFinal(new java.lang.String(data).getBytes());

    // var aes = $crypto.encrypt(data, aes_key, "AES/ECB/PKCS5padding");
    return android.util.Base64.encodeToString(encrypted, android.util.Base64.NO_WRAP);
    // 解码
// let decoded = new java.lang.String(android.util.Base64.decode(encoded, android.util.Base64.DEFAULT));
}

function dumpBytesAsHex(data) {
    var bytes = new java.lang.String(data).getBytes('utf-8'); // 将字符串转换为字节数组
    var hexArray = bytes.map(function(byte) {
        return ("0" + (byte & 0xff).toString(16)).slice(-2); // 将每个字节转换为16进制字符串
    });
    var hexStr = hexArray.join(""); // 用空格将16进制字符串拼接起来
    return hexStr;
}

function generateAddPassengerString(addPassenger) {
    var result = ''
    // var addPassenger=JSON.stringify(addPassenger);
    result += "var app=document.querySelector('.passenger-container').__vue__;"
    result += "var store=app.$store;"
    result += 'var passenger=store.state.passenger;'
    result += "passenger.card_type='" + addPassenger.identity_type+ "';"
    switch(addPassenger.identity_type){
    case'1':
    //'二代身份证'
        if(parseInt(addPassenger.identity_no.substr(16,1))%2===1){
            result += "passenger.sex_code='M';"
        }else{
            result += "passenger.sex_code='F';"
        }
        result += "passenger.born_date='" + addPassenger.identity_no.substr(6,8)+ "';"
        break
    case'2':
    //'一代身份证'
        if(parseInt(addPassenger.identity_no.substr(14,1))%2===1){
            result += "passenger.sex_code='M';"
        }else{
            result += "passenger.sex_code='F';"
        }
        result += "passenger.born_date='19'"+addPassenger.identity_no.substr(6,6)+"';"
        break
    case'C':
    //'港澳通行证'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        break
    case'G':
    //'台湾通行证'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        break
    case'B':
    //'护照'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        result += "passenger.country_code='" + addPassenger.country_code + "';"
        result += "passenger.userCountry='" + getCountryPinyinById(addPassenger.country_code) + "';"
        break
    case'H':
    //'外国人永久居留身份证'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        result += "passenger.country_code='" + addPassenger.country_code + "';"
        result += "passenger.userCountry='" + getCountryPinyinById(addPassenger.country_code) + "';"
        break
    }
    
    result += "passenger.name='" + addPassenger.passenger_name + "';"
    result += "passenger.card_no='" + addPassenger.identity_no + "';"
    result += "passenger.passenger_type='" + addPassenger.passenger_type+ '' + "';"
    result += "passenger.mobile_code='" + addPassenger.mobile_code + "';"
    result += "passenger.mobile_no='" + addPassenger.mobile_no + "';"
    return result
}

function generateModifyPassengerString(addPassenger) {
    var result = ''
    // var addPassenger=JSON.stringify(addPassenger);
    result += "var app=document.querySelector('.passenger-container').__vue__;"
    result += "var store=app.$store;"
    result += 'var passenger=store.state.passenger;'
    result += "passenger.card_type='" + addPassenger.identity_type+ "';"
    switch(addPassenger.identity_type){
    case'1':
    //'二代身份证'
        if(parseInt(addPassenger.identity_no.substr(16,1))%2===1){
            result += "passenger.sex_code='M';"
        }else{
            result += "passenger.sex_code='F';"
        }
        result += "passenger.born_date='" + addPassenger.identity_no.substr(6,8)+ "';"
        break
    case'2':
    //'一代身份证'
        if(parseInt(addPassenger.identity_no.substr(14,1))%2===1){
            result += "passenger.sex_code='M';"
        }else{
            result += "passenger.sex_code='F';"
        }
        result += "passenger.born_date='19'"+addPassenger.identity_no.substr(6,6)+"';"
        break
    case'C':
    //'港澳通行证'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        // result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        break
    case'G':
    //'台湾通行证'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        // result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        break
    case'B':
    //'护照'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        // result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        result += "passenger.country_code='" + addPassenger.country_code + "';"
        result += "passenger.userCountry='" + getCountryPinyinById(addPassenger.country_code) + "';"
        break
    case'H':
    //'外国人永久居留身份证'
        result += "passenger.gat_born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.born_date='" + addPassenger.GAT_born_date + "';"
        result += "passenger.sex_code='" + addPassenger.sex_code + "';"
        // result += "passenger.gat_valid_date_end='" + addPassenger.GAT_valid_date_end + "';"
        result += "passenger.country_code='" + addPassenger.country_code + "';"
        result += "passenger.userCountry='" + getCountryPinyinById(addPassenger.country_code) + "';"
        break
    }
    
    result += "passenger.name='" + addPassenger.passenger_name + "';"
    result += "passenger.card_no='" + addPassenger.identity_no + "';"
    result += "passenger.passenger_type='" + addPassenger.passenger_type+ '' + "';"
    result += "passenger.mobile_code='" + addPassenger.mobile_code + "';"
    result += "passenger.mobile_no='" + addPassenger.mobile_no + "';"
    result += "passenger.enc_no='" + addPassenger.passenger_enc_no + "';"
    result += "passenger.passenger_uuid='" + addPassenger.passenger_uuid + "';"
    result += "passenger.old_name='" + addPassenger.old_passenger_name + "';"
    result += "passenger.old_card_type='" + addPassenger.old_passenger_id_type_code + "';"
    result += "passenger.old_card_no='" + addPassenger.old_passenger_id_no + "';"
    return result
}


function generatePassengerString2(addPassenger) {
    var result = ''
    // var addPassenger=JSON.stringify(addPassenger);
    result += "var app=document.querySelector('.passenger-container').__vue__;"
    result += "var store=app.$store;"
    result += 'var passenger=store.state.passenger;'
    result += "passenger.card_type='" + addPassenger.certType+ "';"
    switch(addPassenger.certType){
    case'1':
    //'二代身份证'
        // if(parseInt(addPassenger.certNo.substr(16,1))%2===1){
        //     result += "passenger.sex_code='M';"
        // }else{
        //     result += "passenger.sex_code='F';"
        // }
        // result += "passenger.born_date='" + addPassenger.identity_no.substr(6,8)+ "';"
        result += "passenger.born_date='" + addPassenger.bornDate + "';"
        result += "passenger.sex_code='" + addPassenger.sexCode + "';"
        break
    case'2':
    //'一代身份证'
        if(parseInt(addPassenger.identity_no.substr(14,1))%2===1){
            result += "passenger.sex_code='M';"
        }else{
            result += "passenger.sex_code='F';"
        }
        result += "passenger.born_date='19'"+addPassenger.identity_no.substr(6,6)+"';"
        break
    case'C':
    //'港澳通行证'
        result += "passenger.gat_born_date='" + addPassenger.bornDate + "';"
        result += "passenger.born_date='" + addPassenger.bornDate + "';"
        result += "passenger.sex_code='" + addPassenger.sexCode + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.expiryDate + "';"
        break
    case'G':
    //'台湾通行证'
        result += "passenger.gat_born_date='" + addPassenger.bornDate + "';"
        result += "passenger.born_date='" + addPassenger.bornDate + "';"
        result += "passenger.sex_code='" + addPassenger.sexCode + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.expiryDate + "';"
        break
    case'B':
    //'护照'
        result += "passenger.gat_born_date='" + addPassenger.bornDate + "';"
        result += "passenger.born_date='" + addPassenger.bornDate + "';"
        result += "passenger.sex_code='" + addPassenger.sexCode + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.expiryDate + "';"
        result += "passenger.userCountry='" + addPassenger.countryCode + "';"
        break
    case'H':
    //'外国人永久居留身份证'
        result += "passenger.gat_born_date='" + addPassenger.bornDate + "';"
        result += "passenger.born_date='" + addPassenger.bornDate + "';"
        result += "passenger.sex_code='" + addPassenger.sexCode + "';"
        result += "passenger.gat_valid_date_end='" + addPassenger.expiryDate + "';"
        result += "passenger.userCountry='" + addPassenger.countryCode + "';"
        break
    }
    
    result += "passenger.name='" + addPassenger.passengerName + "';"
    result += "passenger.card_no='" + addPassenger.certNo + "';"
    result += "passenger.passenger_type='" + addPassenger.passengeType+ '' + "';"
    result += "passenger.mobile_code='" + addPassenger.mobile_code + "';"
    result += "passenger.mobile_no='" + addPassenger.mobileNo + "';"
    return result
}


function getCountryPinyinById(id) {
    var value = ""
    countryMap.forEach(function(tv) { if(tv.id == id) { value = tv.value; return}})
    return value;
}


/*
**脚本编写:魚離ヤ吥開氺
**脚本作用:仿真随机滑动
**测试系统:安卓8.1
**测试版本:4.1.1 Alpha2
使用说明: 
复制粘贴两个关键函数到自己脚本
sml_move()调用即可
*/
//长距离测试
// sml_move(400, 1800, 800, 230, 1000);
//短距离测试
//sml_move(400, 1000, 800, 600, 1000);

//此代码由飞云脚本圈整理提供（www.feiyunjs.com）
function bezier_curves(cp, t) {
    cx = 3.0 * (cp[1].x - cp[0].x); 
    bx = 3.0 * (cp[2].x - cp[1].x) - cx; 
    ax = cp[3].x - cp[0].x - cx - bx; 
    cy = 3.0 * (cp[1].y - cp[0].y); 
    by = 3.0 * (cp[2].y - cp[1].y) - cy; 
    ay = cp[3].y - cp[0].y - cy - by; 
    
    tSquared = t * t; 
    tCubed = tSquared * t; 
    result = {
        "x": 0,
        "y": 0
    };
    result.x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x; 
    result.y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y; 
    return result; 
};

//仿真随机带曲线滑动  
//qx, qy, zx, zy, time 代表起点x,起点y,终点x,终点y,过程耗时单位毫秒
function sml_move(qx, qy, zx, zy, time) {
    var xxy = [time];
    var point = [];
    var dx0 = {
        "x": qx,
        "y": qy
    };

    var dx1 = {
        "x": random(qx - 100, qx + 100),
        "y": random(qy , qy + 50)
    };
    var dx2 = {
        "x": random(zx - 100, zx + 100),
        "y": random(zy , zy + 50),
    };
    var dx3 = {
        "x": zx,
        "y": zy
    };
    for (var i = 0; i < 4; i++) {

        eval("point.push(dx" + i + ")");

    };
    log(point[3].x)

    for (let i = 0; i < 1; i += 0.08) {
        xxyy = [parseInt(bezier_curves(point, i).x), parseInt(bezier_curves(point, i).y)]

        xxy.push(xxyy);

    }

    log(xxy);
    gesture.apply(null, xxy);
};


function my_http_post(data, result_code) {
    try {
        console.log("posting result " + result_code + ",  " + JSON.stringify(data))
        sendOnlineLog("info", "posting result " + result_code + ",  " + JSON.stringify(data))
        var JSON_TYPE = MediaType.parse("application/json; charset=utf-8");
        var client = new OkHttpClient.Builder()
        .retryOnConnectionFailure(false)
        .readTimeout(5, TimeUnit.SECONDS) //读取超时
        .writeTimeout(5, TimeUnit.SECONDS) //写超时
        .build();
        var body = RequestBody.create(JSON_TYPE, JSON.stringify(data))
        var request = new Request.Builder().url(errUrl).post(body).build(); 
        var response = client.newCall(request).execute();
        console.log(response.code())
    } catch (e) {
        console.error("Exception when posting error result " + result_code + ",  " + e)
        sendOnlineLog("error", "Exception when posting error result " + result_code + ",  " + e)
    }   
}

