/**
 * GET请求
 * @params { url: String || Object } url或配置对象
 * @params { retry: Number } 失败后重试次数
 * @params config { url: String } url
 * @params config { retry: Number } 失败后重试次数
 * @return Promise.Any 默认返回rsp对象，遇到失败时返回含有url信息的对象
 */
async function one(url, retry) {
    let config = null;
    url = typeof url === 'string'? url: ((config = url) && config.url);
    retry = typeof retry === 'number'? retry: (config.retry || 1);

    // 成功返回rsp, 失败则重试, 
    try {
        return await axios.get(url);         // 必须使用await才可用try捕获失败
    }catch(e) {
        if(retry >= 1) {
            return get(url, retry - 1);
        }else {
            return Promise.reject({e, url}); // 请求失败后返回错误对象与url, 并做log记录
        }
    }
};

/**
 * GET一次性并发请求
 * @params { config: Object } 参数配置
 * @params { config.urls: Array } url列表
 * @params { config.retry: Number } 错误重试次数
 * @return Promise.Responese
 */
async function multi({ urls, retry }) {
    return await Promise.all(urls.map(v => one(url, retry)));
};

/**
 * GET并发请求
 * @params { config: Object } 参数配置
 * @params { config.urls: Array } url列表
 * @params { config.concurrent: Number } 并发量
 * @params { config.retry: Number } 错误重试次数
 * @params { config.tranformSingle: Function.optional } 数据转换的钩子函数，传入response对象, 要求返回新的itemData
 * @params { config.tranformAll: Function.optional } 数据转换的钩子函数，传入所有itemData构成的数组, 要求返回新的resultData
 * @return Promise.Any 默认会返回一个数组, 也可通过钩子函数设定最终的返回结果
 */
async function concurrent({ urls, retry, concurrent, tranformSingle, tranformAll }) {
    let tempUrls = null, result = [];

    while((tempUrls = urls.slice(currentIndex, currentIndex + concurrent)) && tempUrls.length) {
        result.push(await Promise.all(tempUrls.map(v => one(url, retry))))
    }

    return result;
};

// 导出两个请求方法
module.exports = {
    one,
    multi,
    concurrent
};
