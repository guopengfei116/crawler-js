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
}

/**
 * GET分页并发请求
 * @params { config: Object } 参数配置对象
 * @params { config.entryURL: String } 入口url
 * @params { config.isNext: Function } 钩子函数，传入rsp对象，要求返回boolean值判断是否还有下一页
 * @return Promise.Response
 */
async function pagingConcurrent({entryURL, isNext}) {
    let currentIndex = 0, retry = 10;
    let result = [];

    // 自动生成不同页码的url进行请求，
    while(true) {
        let urls = getBuildURL(entryURL, currentIndex, currentIndex += 10)
        let rsps = await request.multi(urls);
        result.push(...rsps);

        // 当没有下一页的时候返回所有的rsp对象
        if(rsps.every(isNext)) {
            return result;
        }
    }
}
