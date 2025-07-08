const testLogUrl = "http://10.188.4.56:12201/gelf";
const testLogModule = "testlog";

 
function uploadLog(message) {
    const data = {
        message: message,
        module: testLogModule
    };
    http.postJson(testLogUrl, data);
}

uploadLog("test_uploadLog");
