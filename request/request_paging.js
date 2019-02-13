const request = require('./request.js');

/**
 * @构建url
 * @params { config: Object } 参数配置对象
 * @params { config.url: string } url
 * @params { config.urls: Array.optional } 存储构建后url的容器
 * @params { config.start: number } 起始页码或有序id
 * @params { config.end: number } 结束页码或有序id
 * @params { config.flagReg: RegExp.optional } 匹配url中的参数标识符，替换页码或其他有序数值
 * @return Primise
 */
let getBuildURL = function({url, urls=[], start=1, end=1, flagReg=/{{flag}}/}) {

    for(let i = start; i <= end; i++) {
        urls.push(url.replace(flagReg, i));
    }

    return urls;
};

/**
 * GET并发请求具有分页特性的URL
 * @params { config: Object } 参数配置对象
 * @params { config.entryURL: String } 入口url
 * @params { config.concurrent: Number } 并发量
 * @params { config.hasNext: Function } 钩子函数，传入rsp对象，要求返回boolean值判断是否还有下一页
 * @return Promise.Response
 */
async function onePaging({entryURL, concurrent=10, hasNext}) {
    let currentIndex = 0;
    let result = [];

    // 自动生成不同页码的url进行请求
    while(true) {
        let urls = getBuildURL(entryURL, currentIndex, currentIndex += concurrent)
        let rsps = await request.more(urls);
        result.push(...rsps);

        // 只要有一个为false，证明没有下一页了，返回所有的rsp对象
        if(!rsps.every(hasNext)) {
            return result;
        }
    }
};

/**
 * GET并发请求多个具有分页特性的URL
 * @params { config: Object } 参数配置对象
 * @params { config.entryURLS: Array[String] } 入口url
 * @params { config.concurrent: Number } 并发量
 * @params { config.hasNext: Function } 钩子函数，传入rsp对象，要求返回boolean值判断是否还有下一页
 * @return Promise.Array[Object.Response] 结果为含有多个对象的数组，每个对象的key为入口url, value位置当前入口url分页获取的所有response
 */
async function morePaging({entryURLS, concurrent=10, isNext}) {
    let currentIndex = 0, retry = 10;
    let result = [];

    // 依次请求所有分页URL, 最终所有的response对象以url为key的形式进行存储并返回
    for(let i = 0, len = entryURLS.length; i< len; i++) {
        let rsps = await onePaging({entryURL: entryURLS[i], concurrent, isNext});
        result.push({ [entryURL]: rsps });
    }

    return result;
};
