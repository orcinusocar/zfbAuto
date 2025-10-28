// 通用超时时间
const timeout = 1000

// 检测登录相关元素
function checkLoginElements() {
    console.log("=== 开始检测元素是否存在 ===")
    
    // 检测账号输入框
    // var nameInput = className("android.widget.EditText").findOne(timeout * 2)
    // if(nameInput != null) {
    //     console.log("✅ 找到账号输入框")
    //     console.log("输入框信息:", nameInput.bounds(), nameInput.text())
    // } else {
    //     console.log("❌ 未找到账号输入框")
    // }
    
    // 检测密码输入框
    // var passwordInputs = className("android.widget.EditText").find()
    // console.log("找到", passwordInputs.size(), "个EditText控件")
    // for(var i = 0; i < passwordInputs.size(); i++) {
    //     var input = passwordInputs.get(i)
    //     console.log("EditText", i, ":", input.bounds(), "text:", input.text(), "hint:", input.hint())
    // }
    
    // 检测登录按钮
    // var loginBtn = className("android.widget.Button").text("登录").findOne(timeout)
    // if(loginBtn != null) {
    //     console.log("✅ 找到登录按钮")
    //     console.log("按钮信息:", loginBtn.bounds(), loginBtn.text())
    // } else {
    //     console.log("❌ 未找到登录按钮")
    // }
    
    
    // 检测其他可能的登录按钮
    var buttons = className("android.widget.EditText").find()
    console.log("找到", buttons.size(), "个Button控件")
    for(var i = 0; i < buttons.size(); i++) {
        var btn = buttons.get(i)
        console.log("Button", i, ":", btn.bounds(), "text:", btn.text())
    }
    
    // 检测欢迎登录文本
    // var welcomeText = textContains("欢迎登录").findOne(timeout)
    // if(welcomeText != null) {
    //     console.log("✅ 找到欢迎登录文本")
    //     console.log("文本信息:", welcomeText.bounds(), welcomeText.text())
    // } else {
    //     console.log("❌ 未找到欢迎登录文本")
    // }
    
    
    
    // 检测当前页面所有控件
    // console.log("=== 当前页面所有控件 ===")
    // var allViews = className("android.view.View").find()
    // console.log("找到", allViews.size(), "个View控件")
    // for(var i = 0; i < Math.min(allViews.size(), 10); i++) {
    //     var view = allViews.get(i)
    //     console.log("View", i, ":", view.bounds(), "text:", view.text(), "id:", view.id())
    // }
    
    console.log("=== 检测完成 ===")
}
checkLoginElements()

function checkLoginElements2() {
    // 检测"未登录,点击去登录"按钮
    var notLoginBtn = className("android.widget.Button").text("未登录,点击去登录").findOne(timeout)
    if(notLoginBtn != null) {
        console.log("✅ 找到'未登录,点击去登录'按钮")
        console.log("按钮信息:", notLoginBtn.bounds(), notLoginBtn.text())
        console.log("准备点击此按钮...")
        try {
            notLoginBtn.click()
            console.log("✅ 成功点击'未登录,点击去登录'按钮")
            sleep(2000) // 等待页面跳转
            console.log("等待2秒后重新检测页面元素...")
            
            // 重新检测登录页面元素
            console.log("=== 点击后重新检测登录元素 ===")
            var nameInputAfter = className("android.widget.EditText").findOne(timeout * 3)
            if(nameInputAfter != null) {
                console.log("✅ 点击后找到账号输入框")
                console.log("输入框信息:", nameInputAfter.bounds(), nameInputAfter.text())
            } else {
                console.log("❌ 点击后仍未找到账号输入框")
            }
            
            var loginBtnAfter = className("android.widget.Button").text("登录").findOne(timeout)
            if(loginBtnAfter != null) {
                console.log("✅ 点击后找到登录按钮")
                console.log("按钮信息:", loginBtnAfter.bounds(), loginBtnAfter.text())
            } else {
                console.log("❌ 点击后仍未找到登录按钮")
            }
            
        } catch(e) {
            console.log("❌ 点击按钮失败:", e)
        }
    } else {
        console.log("❌ 未找到'未登录,点击去登录'按钮")
    }
}
// 执行检测
// checkLoginElements2()