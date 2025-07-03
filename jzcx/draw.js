"ui";
toastLog("脚本启动"); // 添加调试日志

// 创建悬浮窗
let floatyWindow = floaty.window(
    <frame w="200" h="100">
        <button id="centerBtn" w="auto" h="auto" text="居中按钮"/>
    </frame>
);

// 点击居中按钮后关闭悬浮窗
floatyWindow.centerBtn.on("click", () => {
    toast("点击了居中按钮");
    floatyWindow.close(); // 关闭悬浮窗
});



// 可拖动悬浮窗
floatyWindow.setPosition(1171, 503); // 初始位置
floatyWindow.setTouchable(true); // 允许拖动
floatyWindow.setSize(200, 100); // 显式设置大小
