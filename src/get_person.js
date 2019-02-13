const axios = require('axios');
const fs = require('fs');

/**
 * 通过TV_ID拿到演员列表
 * url: http://rutube.ru/api/metainfo/tv/:id/person
 * dataStructure: 
 * {
 *  has_next: true,
 *  next: "http://rutube.ru/api/metainfo/tv/7/person?page=2",
 *  page: 1,
 *  per_page: 20,
 *  content: http://rutube.ru/api/metainfo/tv/7/video
 *  results: [
 *    {
 *      person: {
 *          id: 2395
 *          name: "Артур Джанибекян"
 *      }
 *    },
 *    {
 *      person: {
 *          id: 2398
 *          name: "Дмитрий Ефимович"
 *      }
 *    }
 *  ]
 * }
 */
const failedIdList = [];   // 爬取失败的TV_ID列表: [id, id, ...]

function writeIdToFile(data) {
    fs.appendFile('./database/tv_person.json', JSON.stringify(data)+'\r\n', e => {
        e? console.log(e): console.log('写入一条Person数据');
    });
}

// 获取指定TV_ID的所有演员, 返回promise实例
let getPersonById = function(id) {
    
    return new Promise(function(resolve, reject) {

        // 缓存数据
        let cacheData = {[id]: []};

        // 递归获取所有演员数据
        (function getPerson(url) {
            console.log(`正在请求ID为${id}的数据`);
        
            // 发送请求
            axios.get(url)
            .then(resp => {
                let data = resp.data;
                let results = data.results;
        
                // 取出当前页的所有ID
                results.forEach(function(ele) {
                    cacheData[id].push(ele.person.name);
                }, this);

                // 如果还有下一页, 递归获取
                if(data.has_next) {
                    getPerson(data.next);
                }else {
                    // 所有的获取完毕后去重然后存储
                    cacheData[id] = [...new Set(cacheData[id])];
                    writeIdToFile(cacheData);
                    
                    // 所有的抓去完毕, resolve
                    console.log(`ID为${id}的演员数据爬取完毕`);
                    resolve();
                }
            })
            // 发生错误,也尝试写入已拿到的数据
            .catch(err => {
                failedIdList.push(id);
                console.log(`在获取ID为${id}的演员数据时出现错误${err}`);

                // 为了让程序可以继续跑, 即时失败了, 也要resolve
                resolve();
            })
        })(`http://rutube.ru/api/metainfo/tv/${id}/person`);
    });
};

module.exports = getPersonById;
