importClass(android.database.sqlite.SQLiteDatabase);

function searchTiku(keyw) {
    //表名
    let tableName = "tiku";
    let ansArray = searchDb(keyw, tableName, "");
    return ansArray;

}

function searchDb(keyw, _tableName, queryStr) {
    let tableName = _tableName;
    //数据文件名
    let dbName = "tiku.db";
    //文件路径
    let path = files.path(dbName);
    //确保文件存在
    if (!files.exists(path)) {
        files.createWithDirs(path);
    }
    //创建或打开数据库
    let db = SQLiteDatabase.openOrCreateDatabase(path, null);
    let query = "";
    if (queryStr == "") {
        query = "SELECT question,answer FROM " + tableName + " WHERE question LIKE '" + keyw + "%'";//前缀匹配
    } else {
        query = queryStr;
    }

    log(query);
    //query="select * from tiku"
    //db.execSQL(query);

    let cursor = db.rawQuery(query, null);
    cursor.moveToFirst();
    let ansTiku = [];
    if (cursor.getCount() > 0) {
        do {
            let timuObj={"question" : cursor.getString(0),"answer":cursor.getString(1)};
            ansTiku.push(timuObj);
        } while (cursor.moveToNext());
    } else {
        log("题库中未找到: " + keyw);
    }
    cursor.close();
    return ansTiku;

}

function executeSQL(sqlstr) {
    //数据文件名
    let dbName = "tiku.db";
    //文件路径
    let path = files.path(dbName);
    //确保文件存在
    if (!files.exists(path)) {
        files.createWithDirs(path);
    }
    //创建或打开数据库
    let db = SQLiteDatabase.openOrCreateDatabase(path, null);
    db.execSQL(sqlstr);
    toastLog(sqlstr);
    db.close();
}


function indexFromChar(str) {
    return str.charCodeAt(0) - "A".charCodeAt(0);
}

function searchNet(keyw) {
    let tableName = "tikuNet";
    let ansArray = searchDb(keyw, tableName, "");
    return ansArray;
}

exports.searchTiku = searchTiku;
exports.searchNet = searchNet;
exports.searchDb = searchDb;
exports.indexFromChar = indexFromChar;
exports.executeSQL = executeSQL;





