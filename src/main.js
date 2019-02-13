const fs = require('fs');
const getId = require('./src/get_id');
const getMateById = require('./src/get_mate');
const getPersonById = require('./src/get_person');
const getEpisodeById = require('./src/get_episode');

const idFile = './database/tv_ids.json';   // 只有十几个ID, 本地测试使用
// const idFile = './database/tv_id.json'; // 完整的ID, 到服务器上跑, 大约5500个
const getDataMethod = {
    getId: getId
};

// 读取文件中存储的所有电视节目ID, 转为二维数组, 返回promise
getDataMethod.initIdList = function(fn) {

    // 所有的Id
    let idList = [];

    // 读取文件中的id
    fs.readFile(idFile, 'utf-8', function (err, data) {
        if (err) {
            console.log(err);
        } else {
            idList = data.split('\r\n');         // 每一条字符串id数据放入数组
            idList = idList.map((item, i) => {   // 解析每一条字符串id
                try {
                    return JSON.parse(item);
                }catch(e) {
                    console.log(`第${i}条数据解析错误`);
                }
            });

            // 读取解析完毕
            fn && fn(idList);
        }
    });
}

/**
 * 获取Mate数据
 * @param {*} idList 接收二维数据ID, 每次并发获取一列ID的元数据
 */ 
getDataMethod.getMateByIdList = function(idList, fn) {
    
    (function getOneLineIdData(row) {
        // 异步取每一行ID的数据, 得到所有promise
        let requestList = [];
        idList[row].forEach(id => {
            requestList.push(getMateById(id));
        });
    
        // 当前行的数据获取完毕, 继续下一行
        Promise.all(requestList)
        .then(() => {

            // 最大下标为[length-1]
            if(++row < idList.length) {
                getOneLineIdData(row)
            }else {
                fn && fn();
                console.log('获取完毕了');
            }
        })
        .catch(e => console.log(`在获取第${row}行ID的数据时出错`));
    })(0);
};

/**
 * 获取Person数据
 * @param {*} idList 接收二维数据ID, 每次并发获取一列ID的元数据
 */ 
getDataMethod.getPersonByIdList = function(idList, fn) {
    
    (function getOneLineIdData(row) {
        // 异步取每一行ID的数据, 得到所有promise
        let requestList = [];
        idList[row].forEach(id => {
            requestList.push(getPersonById(id));
        });
    
        // 当前行的数据获取完毕, 继续下一行
        Promise.all(requestList)
        .then(() => {

            // 最大下标为[length-1]
            if(++row < idList.length) {
                getOneLineIdData(row)
            }else {
                fn && fn();
                console.log('获取完毕了');
            }
        })
        .catch(e => console.log(`在获取第${row}行ID的数据时出错`));
    })(0);
};

/**
 * 获取Episode数据
 * @param {*} idList 接收二维数据ID, 每次并发获取一列ID的元数据
 */ 
getDataMethod.getEpisodeByIdList = function(idList, fn) {
    
    (function getOneLineIdData(row) {
        // 异步取每一行ID的数据, 得到所有promise
        let requestList = [];
        idList[row].forEach(id => {
            requestList.push(getEpisodeById(id));
        });
    
        // 当前行的数据获取完毕, 继续下一行
        Promise.all(requestList)
        .then(() => {

            // 最大下标为[length-1]
            if(++row < idList.length) {
                getOneLineIdData(row)
            }else {
                fn && fn();
                console.log('获取完毕了');
            }
        })
        .catch(e => console.log(`在获取第${row}行ID的数据时出错`));
    })(0);
};

// 把回调函数转为promise
function getByIdList(methodName, ...arg) {
    return new Promise(function(resolve, reject) {
        getDataMethod[methodName](...arg, resolve);
    });
}

// 读取本地存储的所有TV_ID, 然后依次获取所需的元数据/演员数据/每一集数据并写入文件
async function getDataAll() {
    await getByIdList('getId', 10);                    // 并发10个请求获取id, 先写入到文件
    let idList = await getByIdList('initIdList');      // 从文件中获取id列表
    await getByIdList('getMateByIdList', idList);      // 获取元数据, 写入到文件
    await getByIdList('getPersonByIdList', idList);    // 获取演员数据, 写入到文件
    await getByIdList('getEpisodeByIdList', idList);   // 获取每一集数据, 写入到文件
}

getDataAll();