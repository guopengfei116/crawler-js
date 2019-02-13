const axios = require('axios');
const fs = require('fs');

/**
 * 通过TV_ID拿到关键元数据
 * url: http://rutube.ru/api/metainfo/tv/:id
 * dataStructure: 
 * {
 *  id: 7
 *  content: http://rutube.ru/api/metainfo/tv/7/video
 *  year_start: 2008,
 *  age_restriction: '16+',
 *  appearance: {
 *    cover_image: "http://pic.rutube.ru/xxx.jpg"
 *  }
 * }
 */
const BASE_URL = "http://rutube.ru/api/metainfo/tv/";
const failedIdList = [];   // 爬取失败的TV_ID列表: [id, id, ...]

function writeToFile(data) {
    return fs.appendFile('./database/tv_mate.json', JSON.stringify(data)+'\r\n', e => {
        e? console.log(e): console.log('写入一条Mate数据');
    });
}

// 提取指定数据
function extractionData(sourceData) {
    return {
        content: sourceData.content,
        year_start: sourceData.year_start,
        age_restriction: sourceData.age_restriction,
        appearance: sourceData.appearance.cover_image
    };
}

// 获取指定TV的元数据, 返回promise实例
function getMateById(id) {

    // 缓存爬取的数据, 数据格式为: { id: {} }, 其中id为key是为了将来好取
    let cacheData = {};  

    return (
        axios.get(BASE_URL+id)
        .then(rsp => {
            let data = rsp.data;
            cacheData[id] = extractionData(data);

            // 写入文件
            return writeToFile(cacheData);
        })
        .catch(err => {
            failedIdList.push(id);
            console.log(`在获取ID为${id}的元数据时出现错误`);
        })
    );
}

module.exports = getMateById;