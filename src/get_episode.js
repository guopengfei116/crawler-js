const axios = require('axios');
const fs = require('fs');

/**
 * 通过TV_ID拿到每一集数据
 * url: http://rutube.ru/api/metainfo/tv/:id/video/?season=[season_id]&type=2&page=1
 * dataStructure: 
 * {
 *  has_next: true,
 *  next: "http://rutube.ru/api/metainfo/tv/7/video/?season=1&type=2&page=2",
 *  page: 1,
 *  per_page: 20,
 *  content: http://rutube.ru/api/metainfo/tv/7/video
 *  results: [
 *    {
 *      title: "Comedy Woman, 1 сезон, 1 выпуск",
 *      description: "Первый выпуск Comedy Woman посвящен международному женскому дню. Наталья Андреевна требует от Хрусталева подарки, вместо поздравительных слов и комплиментов. После представления участниц, Дмитрий дарит",
 *      created_ts: "2011-08-31T14:37:15",
 *      video_url: "http://rutube.ru/video/f3992e6fb86edcf64223ec633fa3ed08/",
 *      author: {
 *        name: "Comedy Woman",
 *        avatar_url: "http://pic.rutube.ru/user/35/1c/351caecd3431b259361d4ee39b4ac988.jpg"
 *      },
 *      duration: 3161,
 *      season: 1,
 *      episode: 1,
 *      thumbnail_url: "http://pic.rutube.ru/video/ec/cc/eccc7509933670097636685a7164896b.jpg",
 *    }
 *  ]
 * }
 */ 
const failedIdList = [];   // 爬取失败的TV_ID列表: [id, id, ...]

function writeIdToFile(data) {
    fs.appendFile('./database/tv_episode.json', JSON.stringify(data)+'\r\n', e => {
        e? console.log(e): console.log('写入一条Episode数据');
    });
}

// 提取指定数据
function extractionData(sourceData) {
    console.log(sourceData);
    return {
        title: sourceData.title,
        description: sourceData.description,
        created_ts: sourceData.created_ts,
        video_url: sourceData.video_url,
        author_name: sourceData.author.name,
        author_avatar_url: sourceData.author.avatar_url,
        duration: sourceData.duration,
        season: sourceData.season,
        episode: sourceData.episode,
        thumbnail_url: sourceData.thumbnail_url
    };
}

// 获取指定TV_ID的每一集数据, 返回promise实例
let getEpisodeById = function(id) {
    
    return new Promise(function(resolve, reject) {

        // 缓存爬取的数据, 数据格式为: { id: [{}, {}, ...] }, 其中id为key是为了将来好取, 数组里面存放每一集数据
        let cacheData = {[id]: []};
        let currentSeason = 1;

        // 递归获取每一页数据
        (function getPerson(url) {
            console.log(`正在请求ID为${id}的数据`);
        
            // 发送请求
            axios.get(url)
            .then(resp => {
                let data = resp.data;
                let results = data.results;
        
                // 取出当前页的所有ID
                results.forEach(function(ele) {
                    cacheData[id].push(extractionData(ele));
                }, this);

                // 有下一页递归获取
                if(data.has_next) {
                    getPerson(data.next);
                }
                // 没有下一页,看看会不会还有下一季(只要page不为1, result不为空,就认为有下一季)
                else if(!/page=1/.test(url) && results.length) {
                    getPerson(`http://rutube.ru/api/metainfo/tv/${id}/video/?season=${++currentSeason}&type=2&page=1`);
                }
                // 没有下一页也没有下一季了, 把结果写入文件
                else {
                    writeIdToFile(cacheData);
                    
                    // 所有的抓去完毕, resolve
                    console.log(`ID为${id}的每一集数据爬取完毕`);
                    // resolve();
                }
            })
            // 发生错误,也尝试写入已拿到的数据
            .catch(err => {
                failedIdList.push(id);
                console.log(`在获取ID为${id}的每一集数据时出现错误${err}`);

                // 为了让程序可以继续跑, 即时失败了, 也要resolve
                resolve();
            })
        })(`http://rutube.ru/api/metainfo/tv/${id}/video/?season=1&type=2&page=1`);
    });
};

module.exports = getEpisodeById;