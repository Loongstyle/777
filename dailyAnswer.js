//import {searchTiku,executeSQL} from "./tikuCommon.js";
let tikuCommon = require("./tikuCommon.js");

function getTimuArray() {
    let timuArray = [];
    if (descStartsWith("填空题").exists()) {
        let timuCollections = className("EditText").findOnce().parent().parent();
        if (timuCollections.childCount() == 1) {//法1
            timuCollections = className("EditText").findOnce().parent();
            let findBlank = false;
            let blankCount = 0;
            let blankNumStr = "";
            timuCollections.children().forEach(item => {
                if (item.className() != "android.widget.EditText") {
                    if (item.desc() != "") { //题目段
                        if (findBlank) {
                            blankNumStr = "|" + blankCount.toString();
                            //log(blankNumStr);
                            timuArray.push(blankNumStr);
                            findBlank = false;
                            blankCount=0;
                        }
                        //log(item.desc());
                        timuArray.push(item.desc());
                    } else {
                        findBlank = true;
                        blankCount += 1;
                    }
                }
            });
            // toastLog("法1" + timuArray);
        } else {//法2   
            timuCollections.children().forEach(item => {
                if (item.childCount() == 0) { //题目段
                    timuArray.push(item.desc());
                } else {
                    let blankNumStr = "|" + (item.childCount() - 1).toString();
                    timuArray.push(blankNumStr);
                }
            });
            // toastLog("法2" + timuArray);
        }
    } else { //选择题
        let timuCollections = className("ListView").findOnce().parent().child(1);
        timuArray.push(timuCollections.desc());
    }
    return timuArray;
}

function getTipsStr() {
    let _tipsStr = "";
    while (_tipsStr == "") {
        if (desc("提示").exists()) { //正确捕获提示
            let tipsLine = desc("提示").findOnce().parent();
            //获取提示内容
            let tipsView = tipsLine.parent().child(1).child(0);
            _tipsStr = tipsView.desc();
            //关闭提示
            tipsLine.child(1).click();
            break;
        }
        if (desc("查看提示").exists()) {
            let seeTips = desc("查看提示").findOnce();
            seeTips.click();
            sleep(1000);
            click(device.width * 0.5, device.height * 0.41);
            sleep(800);
            click(device.width * 0.5, device.height * 0.35);
        } else {
            log("Not found 查看提示");
            //continue;
        }

    }
    return _tipsStr;
}

function getFromTips(timu, tipsStr) {
    let ansTips = "";
    for (let i = 1; i < timu.length - 1; i++) {
        if (timu[i].charAt(0) == "|") {
            let blankLen = timu[i].substring(1);
            let indexKey = tipsStr.indexOf(timu[i + 1]);
            let ansFind = tipsStr.substr(indexKey - blankLen, blankLen);
            ansTips += ansFind;
        }
    }
    return ansTips;
    //let answer = !ansFind.length ? "0".repeat(blankLen) : ansFind;
}

function clickByTips(tipsStr) {
    let clickStr = "";
    let isFind = false;
    if (className("ListView").exists()) {
        let listArray = className("ListView").findOne().children();
        listArray.forEach(item => {
            let ansStr = item.child(0).child(2).desc();
            if (tipsStr.indexOf(ansStr) >= 0) {
                item.child(0).click();
                clickStr += item.child(0).child(1).desc().charAt(0);
                isFind = true;
            }
        });
        if (!isFind) { //没有找到 点击第一个
            listArray[0].child(0).click();
            clickStr += listArray[0].child(0).child(1).desc().charAt(0);

        }
    }
    return clickStr;
}

function clickByAnswer(answer) {
    if (className("ListView").exists()) {
        let listArray = className("ListView").findOnce().children();
        listArray.forEach(item => {
            let listIndexStr = item.child(0).child(1).desc().charAt(0);
            //单选答案为非ABCD
            let listDescStr = item.child(0).child(2).desc();
            if (answer.indexOf(listIndexStr) >= 0 || answer == listDescStr) {
                item.child(0).click();
            }
        });
    }
}

function checkAndSql(timuStr, ansTiku, answer) {
    if (desc("下一题").exists() || desc("完成").exists()) {
        //swipe(100, device.height - 100, 100, 100, 500);
        className("android.webkit.WebView").findOnce().child(2).child(0).scrollDown();
        let nCout = 0;
        let sqlstr="";
        while (nCout < 10) {
            if (descStartsWith("正确答案").exists()) {
                let correctAns = descStartsWith("正确答案").findOnce().desc().substr(5);
                //toastLog(descStartsWith("正确答案").findOnce().desc());
                if (ansTiku == "") { //题库为空则插入正确答案                
                    sqlstr = "INSERT INTO tiku VALUES ('" + timuStr + "','" + correctAns + "','')";
                } else { //更新题库答案
                    sqlstr = "UPDATE tiku SET answer='" + correctAns + "' WHERE question LIKE '" + timuStr + "'";
                }
                //执行sql语句
                // toastLog(sqlstr);
                tikuCommon.executeSQL(sqlstr);
                break;
            } else {
                let clickPos = className("android.webkit.WebView").findOnce().child(2).child(0).child(1).bounds();
                click(clickPos.left + device.width * 0.13, clickPos.top + device.height * 0.1);
                log("未捕获 正确答案，尝试修正");
            }
            nCout++;
        }
    } else { //正确后进入下一题，或者进入再来一局界面
        if (ansTiku == "" && answer != "") { //正确进入下一题，且题库答案为空
            //插入正确答案                
            let sqlstr = "INSERT INTO tiku VALUES ('" + timuStr + "','" + answer + "','')";
            tikuCommon.executeSQL(sqlstr);
        }
    }

}

function clickBtn() {
    let webkitView = className("android.webkit.WebView").findOnce();
    if (webkitView.childCount > 2 && webkitView.child(2).desc() != "") {
        webkitView.child(1).click();
        return;
    }
    if (desc("再来一组").exists()) {
        desc("再来一组").findOnce().click();
        return;
    }
    // if (desc("完成").exists()) {
    //     desc("完成").findOnce().click();
    //     return;
    // }
    // if (desc("下一题").exists()) {
    //     desc("下一题").findOnce().click();
    //     return;
    // }
    click(device.width * 0.85, device.height * 0.06);
}

function doAnswer(delayedTime) {
    clickBtn();
    sleep(500);
    // clickBtn();
    // sleep(500);
    //获得题目数组
    let timuArray = getTimuArray();
    let blankArray = [];
    //toastLog("timuArray=" + timuArray.toString());

    //由题目数组获得题目字符串
    let timuStr = "";
    timuArray.forEach(item => {
        if (item != null && item.charAt(0) == "|") { //是空格数
            blankArray.push(item.substring(1));
        } else { //是题目段
            timuStr += item;
        }
    });
    timuStr = timuStr.replace(/\s/g, "");
    //toastLog("timuStr = " + timuStr + "blankArray = " + blankArray.toString());

    //检索题库
    let ansSearchArray = tikuCommon.searchTiku(timuStr);
    let ansTiku = "";
    if (ansSearchArray.length == 0) {
        ansSearchArray = tikuCommon.searchNet(timuStr);
    }
    if (ansSearchArray.length > 0) {
        ansTiku = ansSearchArray[0].answer;
    }


    //获取答案
    let answer = ansTiku.replace(/(^\s*)|(\s*$)/g, "");//去除前后空格，解决历史遗留问题
    //toastLog("answer=" + answer);
    if (descStartsWith("填空题").exists()) {
        //toastLog("填空题");
        if (answer == "") {
            let tipsStr = getTipsStr();
            answer = getFromTips(timuArray, tipsStr);
        }

        //点击 文本框
        //editCollections[0].parent().child(1).click();
        //className("EditText").findOnce().parent().child(1).click();
        //输入答案
        log("answer= " + answer);
        setText(0, answer.substr(0, blankArray[0]));
        if (blankArray.length > 1) {
            for (let i = 1; i < blankArray.length; i++) {
                setText(i, answer.substr(blankArray[i - 1], blankArray[i]));
            }
        }
        //setText(answer);


    } else { //选择题，包括单选 双选
        //toastLog("选择题");
        if (answer == "") {
            let tipsStr = getTipsStr();
            answer = clickByTips(tipsStr);
        } else {
            toastLog("ansTiku= " + ansTiku);
            clickByAnswer(answer);
        }

    }
    //判断是否正确
    //sleep(1000);
    //延时点击
    sleep(delayedTime*1000);
    clickBtn();
    sleep(300);
    checkAndSql(timuStr, ansTiku, answer);

}


function main() {
    let storage = storages.create("LazyStudy");
    if (!storage.contains("delayedTime") || parseInt(storage.get("delayedTime"))<1) {
        storage.put("delayedTime", 1);
    }
    let delayedTime=storage.get("delayedTime");
    while (true) {
        doAnswer(delayedTime);
        sleep(1000);
    }
}

module.exports = main;