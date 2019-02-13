const axios = require('axios');
const fs = require('fs');

/**
 * 获取所有TV的ID属性
 * url: http://rutube.ru/api/metainfo/tv/
 * dataStructure: 
 * {
 *  has_next: true,
 *  next: http://rutube.ru/api/metainfo/tv/?page=2,
 *  page: 1,
 *  per_page: 20,
 *  results: [
 *    {
 *      id: 1
 *    },
 *    {
 *      id: 2
 *    }
 *  ]
 * }
 */ 

function writeIdToFile(data) {
    fs.appendFile('./database/tv_id.json', JSON.stringify(data)+'\r\n', e => {
        e? console.log(e): console.log('写入一页ID数据');
    });
}

// 是否还有下一页
let hasNext = true;

// 请求一页数据, 返回promise实例
function getOnepageId(url) {
    let idList = []; 

    return (
        axios.get(url)
        .then(resp => {
            let data = resp.data;
            let results = data.results;

            // 取出当前页的所有ID
            results.forEach(function(ele) {
                idList.push(ele.id);
            }, this);

            // 写入文件
            writeIdToFile(idList);

            // 没有下一页修改flag, 证明id获取完毕
            if(!data.has_next) {
                hasNext = false;
            }
        })
        .catch(err => {
            console.log(err);
            writeIdToFile(idList);
        })
    );
}

// 获取ID, 可以指定并发数
let getId = function(num, fn) {
    let pageIndex = 0;

    // 为递归准备的函数
    (function getMultipageId() {
        let requestList = [];

        // 并发请求
        for(let i = 0; i < num; i++) {
            requestList.push(getOnepageId(`http://rutube.ru/api/metainfo/tv/?page=${pageIndex++}`));
        }

        // 并发结束如果还有下一页,继续并发请求
        Promise.all(requestList)
        .then(() => {
            if(hasNext) {
                getMultipageId();
            }else {
                console.log('爬取结束');
                fn && fn();
            }
        })
        .catch((e) => console.log(`在并发第${pageIndex}页时出现错误`));
    })();
};

module.exports = getId;
