function uploadLog(message,duration) {
    const data = {
        message: message,
        duration: duration,
        module: testLogModule,
    };
    http.postJson(testLogUrl, data);
}