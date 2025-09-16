let allControls = classNameMatches(/.*/).find();
let flights = {};

if (!allControls || allControls.length === 0) {
    console.log({
        status: "no_controls",
        message: "未找到航班控件",
        flights: []
    });
}

for (let c of allControls) {
    try{

        let text = c.text() || "";

        let match = text.match(/中国国航/);
        if(match){
            console.log(c.desc()+' '+c.id()+' '+c.text());
        }
    }catch(e){
        //skip
    }
}