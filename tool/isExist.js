const DEFAULT_TIMEOUT = 1000

/**
 * 检测元素是否存在
 * @param {Object} selector - 选择器对象，支持多种查找方式
 * @param {Number} timeout - 超时时间，默认1000ms
 * @param {Boolean} findAll - 是否查找所有匹配元素，默认false（只找第一个）
 * @returns {Object|Array|null} 找到的元素或元素数组，未找到返回null
 * 
 * 使用示例:
 * // 按类名查找
 * isExist({className: "android.widget.Button"}, 2000)
 * 
 * // 按文本查找
 * isExist({text: "登录"})
 * 
 * // 按文本包含查找
 * isExist({textContains: "欢迎"})
 * 
 * // 按ID查找
 * isExist({id: "com.example:id/button"})
 * 
 * // 组合查找
 * isExist({className: "android.widget.Button", text: "登录"})
 * 
 * // 查找所有匹配元素
 * isExist({className: "android.widget.EditText"}, 1000, true)
 */
function isExist(selector, timeout, findAll) {
    timeout = timeout || DEFAULT_TIMEOUT
    findAll = findAll || false
    
    try {
        var query = null
        
        if (selector.className) {
            query = className(selector.className)
        } else if (selector.text) {
            query = text(selector.text)
        } else if (selector.textContains) {
            query = textContains(selector.textContains)
        } else if (selector.id) {
            query = id(selector.id)
        } else if (selector.desc) {
            query = desc(selector.desc)
        } else if (selector.descContains) {
            query = descContains(selector.descContains)
        } else {
            console.log("无效的选择器类型")
            return null
        }
        
        if (selector.className && selector.text) {
            query = className(selector.className).text(selector.text)
        } else if (selector.className && selector.textContains) {
            query = className(selector.className).textContains(selector.textContains)
        } else if (selector.className && selector.id) {
            query = className(selector.className).id(selector.id)
        }
        
        if (findAll) {
            var elements = query.find()
            return elements.size() > 0 ? elements : null
        } else {
            return query.findOne(timeout)
        }
    } catch(e) {
        console.log("查找元素时出错:", e)
        return null
    }
}

/**
 * 检测元素是否存在（简化版，返回布尔值）
 * @param {Object} selector - 选择器对象
 * @param {Number} timeout - 超时时间
 * @returns {Boolean} 元素是否存在
 */
function checkExist(selector, timeout) {
    var element = isExist(selector, timeout, false)
    return element != null
}

/**
 * 查找元素并返回详细信息
 * @param {Object} selector - 选择器对象
 * @param {Number} timeout - 超时时间
 * @param {Boolean} findAll - 是否查找所有匹配元素
 * @param {Boolean} showInfo - 是否打印详细信息，默认true
 * @returns {Object} 包含元素和信息的对象
 */
function findElement(selector, timeout, findAll, showInfo) {
    showInfo = showInfo !== false
    timeout = timeout || DEFAULT_TIMEOUT
    findAll = findAll || false
    
    var element = isExist(selector, timeout, findAll)
    
    if (showInfo) {
        if (findAll && element != null) {
            console.log("找到", element.size(), "个匹配元素")
            for(var i = 0; i < element.size(); i++) {
                var el = element.get(i)
                console.log("元素", i, ":", el.bounds(), "text:", el.text(), "desc:", el.desc())
            }
        } else if (element != null) {
            console.log("找到元素")
            console.log("元素信息:", element.bounds(), "text:", element.text(), "desc:", element.desc())
        } else {
            console.log("未找到元素")
        }
    }
    
    return {
        element: element,
        exists: element != null,
        count: findAll && element != null ? element.size() : (element != null ? 1 : 0)
    }
}

/**
 * 如果元素存在则点击
 * @param {Object} selector - 选择器对象
 * @param {Number} timeout - 超时时间
 * @param {Number} waitAfterClick - 点击后等待时间（毫秒），默认0
 * @returns {Boolean} 是否成功点击
 */
function clickIfExist(selector, timeout, waitAfterClick) {
    timeout = timeout || DEFAULT_TIMEOUT
    waitAfterClick = waitAfterClick || 0
    
    var element = isExist(selector, timeout, false)
    
    if (element != null) {
        try {
            element.click()
            console.log("成功点击元素")
            if (waitAfterClick > 0) {
                sleep(waitAfterClick)
            }
            return true
        } catch(e) {
            console.log("点击元素失败:", e)
            return false
        }
    } else {
        console.log("元素不存在，无法点击")
        return false
    }
}

/**
 * 等待元素出现
 * @param {Object} selector - 选择器对象
 * @param {Number} timeout - 超时时间
 * @param {Number} checkInterval - 检查间隔（毫秒），默认500
 * @returns {Object|null} 找到的元素，超时返回null
 */
function waitForElement(selector, timeout, checkInterval) {
    timeout = timeout || DEFAULT_TIMEOUT * 5
    checkInterval = checkInterval || 500
    var startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
        var element = isExist(selector, checkInterval, false)
        if (element != null) {
            return element
        }
        sleep(checkInterval)
    }
    
    return null
}

