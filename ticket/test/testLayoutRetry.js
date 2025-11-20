const layoutInspector = require("__layout_inspector__");
// 捕获当前窗口
const capture = layoutInspector.captureCurrentWindow();
console.log("窗口捕获完成");

// 查找控件
const button = layoutInspector.id("ticket_home_bottom_bar_order").findOnce();
if (button) {
    console.log("find order button success [ retry ]", button.text());
}
