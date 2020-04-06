"ui";
importClass(android.view.View);
let tikuCommon = require("./tikuCommon.js");
let deviceWidth = device.width;

let margin = parseInt(deviceWidth * 0.02);

//记录集数组 重要！！！
let qaArray = [];
//设置本地存储
let appVersion = "2.5.6";
let storage = storages.create("LazyStudy");
if (!storage.contains("delayedTime") || parseInt(storage.get("delayedTime")) < 1) {
    storage.put("delayedTime", 1);
}
if (!storage.contains("browseWithCSC") || typeof (storage.get("browseWithCSC")) != "boolean") {
    storage.put("browseWithCSC", false);
}

//答题延迟时间
let delayedTime = storage.get("delayedTime");
//三连开关
let browseWithCSC = storage.get("browseWithCSC");

ui.layout(
    <drawer id="drawer">
        <vertical>
            <appbar>
                <toolbar id="toolbar" title="懒人学习" />
                <tabs id="tabs" />
            </appbar>
            <viewpager id="viewpager">
                <frame>
                    <img src="https://cdn.mom1.cn/?mom=302" scaleType="centerCrop" alpha="0.3" />
                    <vertical gravity="center">
                        <horizontal gravity="center">
                            <text text="答题延时：" />
                            <input id="delayedTime" text={delayedTime} />
                            <text text="秒" />
                        </horizontal>
                        <horizontal gravity="center">
                            <text text="浏览同时收藏分享评论：" />
                            <Switch id="browseWithCSC" checked={browseWithCSC} />
                        </horizontal>
                        <button id="showFloating" text="打开悬浮窗" w="150" h="60" circle="true" layout_gravity="center" style="Widget.AppCompat.Button.Colored" />
                    </vertical>
                </frame>
                <frame>
                    <vertical>
                        <horizontal gravity="center">
                            <input margin={margin + "px"} id="keyword" hint=" 输入题目或答案关键字" h="auto" />
                            <radiogroup orientation="horizontal" >
                                <radio id="rbQuestion" text="题目" checked="true" />
                                <radio id="rbAnswer" text="答案" />
                            </radiogroup>
                            <button id="search" text=" 搜索 " />
                        </horizontal>
                        <horizontal gravity="center">
                            <button id="lastTen" text=" 最近十条 " />
                            <button id="prev" text=" 上一条 " />
                            <button id="next" text=" 下一条 " />
                            <button id="reset" text=" 重置 " />
                        </horizontal>
                        <horizontal gravity="center">
                            <button id="update" text=" 修改 " />
                            <button id="delete" text=" 删除 " />
                            <button id="insert" text=" 新增 " />
                            <button id="updateTikuNet" text=" 更新题库 " />
                        </horizontal>
                        <progressbar id="pbar" indeterminate="true" style="@style/Base.Widget.AppCompat.ProgressBar.Horizontal" />
                        <text id="resultLabel" text="" gravity="center" />
                        <horizontal>
                            <vertical>
                                <text id="questionLabel" text="题目" />
                                <horizontal>
                                    <text id="questionIndex" text="0" />
                                    <text id="slash" text="/" />
                                    <text id="questionCount" text="0" />
                                </horizontal>
                            </vertical>
                            <input margin={margin + "px"} id="question" w="*" h="auto" />
                        </horizontal>
                        <horizontal>
                            <text id="answerLabel" text="答案" />
                            <input id="answer" w="*" h="auto" />
                        </horizontal>
                    </vertical>
                </frame>
                <frame>
                    <vertical>
                        <webview id="webview" h="*" w="auto" />
                    </vertical>
                </frame>
            </viewpager>
        </vertical>
    </drawer>
);

//标签名
ui.viewpager.setTitles(["功能", "题库", "程序介绍"]);
//联动
ui.tabs.setupWithViewPager(ui.viewpager);
//选项菜单右上角
ui.emitter.on("create_options_menu", menu => {
    menu.add("检查更新");
    menu.add("关于");
});
ui.emitter.on("options_item_selected", (e, item) => {
    switch (item.getTitle()) {
        case "检查更新":
            threads.shutDownAll();
            threads.start(function () {
                checkUpdate(appVersion,true);
            });
            //app.openUrl("https://glare.now.sh/lgpersonal/LazyStudy/LazyStudy");
            break;
        case "关于":
            alert("关于", "当前版本 " + appVersion);
            break;

    }
    e.consumed = true;
});
activity.setSupportActionBar(ui.toolbar);

//帮助页加载
let src = "https://github.com/lgpersonal/LazyStudy/blob/master/README.md";
ui.webview.loadUrl(src);

//进度条不可见
ui.run(() => {
    ui.pbar.setVisibility(View.INVISIBLE);
});

//加载悬浮窗
ui.showFloating.click(() => {
    //获取UI中输入值
    let uiDelayedTime = parseInt(ui.delayedTime.getText());
    let uiBrowseWithCSC = ui.browseWithCSC.checked;
    //判断并存储
    if (uiDelayedTime >= 0 && uiDelayedTime != delayedTime) {
        storage.put("delayedTime", uiDelayedTime);
    }
    if (uiBrowseWithCSC != browseWithCSC) {
        storage.put("browseWithCSC", uiBrowseWithCSC);
    }
    console.log("延迟时间: " + storage.get("delayedTime"));
    console.log("三连开关: " + storage.get("browseWithCSC"));
    engines.execScriptFile("floating.js");
});

//查询
ui.search.click(() => {
    //预先初始化
    qaArray = [];
    threads.shutDownAll();
    ui.run(() => {
        ui.question.setText("");
        ui.answer.setText("");
        ui.questionIndex.setText("0");
        ui.questionCount.setText("0");
    });
    //查询开始
    threads.start(function () {
        if (ui.keyword.getText() != "") {
            let keyw = ui.keyword.getText();
            if (ui.rbQuestion.checked) {//按题目搜
                let sqlStr = util.format("SELECT question,answer FROM tiku WHERE %s LIKE '%%%s%'", "question", keyw);
            } else {//按答案搜
                let sqlStr = util.format("SELECT question,answer FROM tiku WHERE %s LIKE '%%%s%'", "answer", keyw);
            }
            qaArray = tikuCommon.searchDb(keyw, "tiku", sqlStr);
            let qCount = qaArray.length;
            if (qCount > 0) {
                ui.run(() => {
                    ui.question.setText(qaArray[0].question);
                    ui.answer.setText(qaArray[0].answer);
                    ui.questionIndex.setText("1");
                    ui.questionCount.setText(String(qCount));
                });
            } else {
                toastLog("未找到");
                ui.run(() => {
                    ui.question.setText("未找到");
                });
            }
        } else {
            toastLog("请输入关键字");
        }
    });
});

//最近十条
ui.lastTen.click(() => {
    threads.start(function () {
        let keyw = ui.keyword.getText();
        qaArray = tikuCommon.searchDb(keyw, "", "SELECT question,answer FROM tiku ORDER BY rowid DESC limit 10");
        let qCount = qaArray.length;
        if (qCount > 0) {
            //toastLog(qCount);
            ui.run(() => {
                ui.question.setText(qaArray[0].question);
                ui.answer.setText(qaArray[0].answer);
                ui.questionIndex.setText("1");
                ui.questionCount.setText(qCount.toString());
            });
        } else {
            toastLog("未找到");
            ui.run(() => {
                ui.question.setText("未找到");
            });
        }
    });
});

//上一条
ui.prev.click(() => {
    threads.start(function () {
        if (qaArray.length > 0) {
            let qIndex = parseInt(ui.questionIndex.getText()) - 1;
            if (qIndex > 0) {
                ui.run(() => {
                    ui.question.setText(qaArray[qIndex - 1].question);
                    ui.answer.setText(qaArray[qIndex - 1].answer);
                    ui.questionIndex.setText(String(qIndex));
                });
            } else {
                toastLog("已经是第一条了！");
            }
        } else {
            toastLog("题目为空");
        }
    });
});

//下一条
ui.next.click(() => {
    threads.start(function () {
        if (qaArray.length > 0) {
            //toastLog(qaArray);
            let qIndex = parseInt(ui.questionIndex.getText()) - 1;
            if (qIndex < qaArray.length - 1) {
                //toastLog(qIndex);
                //toastLog(qaArray[qIndex + 1].question);
                ui.run(() => {
                    ui.question.setText(qaArray[qIndex + 1].question);
                    ui.answer.setText(qaArray[qIndex + 1].answer);
                    ui.questionIndex.setText(String(qIndex + 2));
                });
            } else {
                toastLog("已经是最后一条了！");
            }
        } else {
            toastLog("题目为空");
        }
    });
});

//修改
ui.update.click(() => {
    threads.start(function () {
        if (ui.question.getText() && qaArray.length > 0 && parseInt(ui.questionIndex.getText()) > 0) {
            let qIndex = parseInt(ui.questionIndex.getText()) - 1;
            let questionOld = qaArray[qIndex].question;
            let questionStr = ui.question.getText();
            let answerStr = ui.answer.getText();
            let sqlstr = "UPDATE tiku SET question = '" + questionStr + "' , answer = '" + answerStr + "' WHERE question=  '" + questionOld + "'";
            tikuCommon.executeSQL(sqlstr);
        } else {
            toastLog("请先查询");
        }
    });
});

//删除
ui.delete.click(() => {
    threads.start(function () {
        if (qaArray.length > 0 && parseInt(ui.questionIndex.getText()) > 0) {
            let qIndex = parseInt(ui.questionIndex.getText()) - 1;
            let questionOld = qaArray[qIndex].question;
            let sqlstr = "DELETE FROM tiku WHERE question = '" + questionOld + "'";
            tikuCommon.executeSQL(sqlstr);
        } else {
            toastLog("请先查询");
        }
    });
});

//新增
ui.insert.click(() => {
    threads.start(function () {
        if (ui.question.getText() != "" && ui.answer.getText() != "") {
            let questionStr = ui.question.getText();
            let answerStr = ui.answer.getText();
            let sqlstr = "INSERT INTO tiku VALUES ('" + questionStr + "','" + answerStr + "','')";
            tikuCommon.executeSQL(sqlstr);
        } else {
            toastLog("请先输入 问题 答案");
        }
    });
});

//重置
ui.reset.click(() => {
    threads.shutDownAll();
    threads.start(function () {
        qaArray = [];
        ui.run(() => {
            ui.keyword.setText("");
            ui.question.setText("");
            ui.answer.setText("");
            ui.questionIndex.setText("0");
            ui.questionCount.setText("0");
            ui.rbQuestion.setChecked(true);
        });
        toastLog("重置完毕!");
    });
});

//更新网络题库
ui.updateTikuNet.click(() => {
    dialogs.build({
        title: "更新网络题库",
        content: "确定更新？",
        positive: "确定",
        negative: "取消",
    })
        .on("positive", update)
        .show();

    function update() {
        threads.start(function () {
            ui.run(() => {
                ui.resultLabel.setText("正在更新网络题库...");
                ui.pbar.setVisibility(View.VISIBLE);
            });
            let ss = "./updateTikuNet.js";
            let begin = require(ss);
            let resultNum = begin();
            let resultStr = "更新" + resultNum + "道题！";
            ui.run(() => {
                ui.resultLabel.setText("");
                ui.pbar.setVisibility(View.INVISIBLE);
                ui.resultLabel.setVisibility(View.INVISIBLE);
            });
            alert(resultStr);
        });
    }
});

//
function checkUpdate(appVersion, alertFlag) {
    //let appVersion = "2.5.4"
    let r = http.get("https://api.github.com/repos/lgpersonal/LazyStudy/releases/latest");
    let rjson = r.body.json();
    let remoteAppVersion = rjson.tag_name;
    let remoteAppDownloadUrl = rjson.assets[0].browser_download_url;
    if (appVersion != remoteAppVersion && remoteAppDownloadUrl != "") {
        // toastLog("发现新版本: " + remoteAppVersion + "\n下载地址: " + remoteAppDownloadUrl);
        dialogs.build({
            title: "发现新版本",
            content: remoteAppVersion,
            positive: "更新",
            negative: "取消"
        })
            .on("positive", () => {
                app.openUrl(remoteAppDownloadUrl);
            })
            .show();
    };
    if (appVersion == remoteAppVersion && alertFlag) {
        alert("已经是最新版本 " + appVersion);
    };
};

threads.start(function () {
    checkUpdate(appVersion, false);
});
