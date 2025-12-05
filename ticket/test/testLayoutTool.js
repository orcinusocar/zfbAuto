const layoutInspector = require("__layout_inspector__")(runtime, global);
function testLayoutTool() {
    console.log("testLayoutTool")
    layoutInspector.captureCurrentWindow();

}

testLayoutTool()