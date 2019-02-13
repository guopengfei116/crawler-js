const axios = require('axios');
const util = require('./util.js');

// 并发数
let config = {
    concurrence: 5
};

// 失败请求，目前只是存储，将来可以封装个专门记录失败请求的模块
let rejectList = [];

module.exports = {

    /**
     * @修改模块内配置
     * @params { option: Object } 要修改的配置项
     */ 
    setConfig(option) {
        Object.assign(config, option);
    },

    /**
     * @并发http请求底层
     * @params { URLList: Array } 并发的url
     * @params { cbk: Function[optional] } 钩子函数，每个请求成功后会尝试调用该函数，传入当前url与data
     * @return Primise
     */ 
    get(URLList, cbk) {
        let result = [];

        return util.getPrimise((resolve, reject) => {
            // 总数与已请求完毕数
            let URLAllTotal = URLList.length, URLloadedTotal = 0;
            console.log('我进入了get方法')
            // 判断全部请求是否完毕
            function isFinish() {
                if(++URLloadedTotal >= URLAllTotal) {
                    console.log('这是判断请求完毕了没result',result.length)
                    resolve(result);
                }
            }

            // 并发请求，结束时把result传递给成功回调
            URLList.forEach(url => {
                axios.get(url)
                .then(
                    (rsp) => {
                        // 每个请求结果都允许使用钩子处理想要的数据格式
                        let data = cbk? cbk(url, rsp.data) : rsp.data; 
                        result.push(data);                // 缓存当前请求的数据
                        isFinish()                        // 判断并发是否结束
                    }
                )
                .catch(
                    (err) => {
                        rejectList.push(url);
                        isFinish()
                    }
                )
            });       

        }); 
    },

    /**
     * @并发请求
     * @params { URLList: Array } 并发的url
     * @params { cbk: Function[optional] } 钩子函数，每个请求成功后会尝试调用该函数，传入当前url与data
     * @return Primise
     */
    getByList(URLList, cbk) {
        let result = [];
        let _this = this
        return util.getPrimise((resolve, reject) => {
            let curretnIndex = 0, tempURLList = [];  // 每次并发的url列表

            // 递归控制并发请求
            (function send() {

                // 按并发数取出当次url列表
                tempURLList = URLList.slice(curretnIndex, config.concurrence);
                curretnIndex += config.concurrence;
                //console.log('我进来http请求这里了',tempURLList)
                // 已经没有了，递归结果
                if(!tempURLList.length) {
                //    console.log('这是递归结果',result.length)
                    resolve(result);
                }

                // 递归发送请求，每次结果都缓存到result
                _this.get(tempURLList, cbk)
                .then(
                    pageList => {
                        result.push(...pageList);
                //        console.log('返回的result',result.length)
                        send();
                    }
                );

            }).call(this); // 为了让内部this指向当前对象，便于调用内部的get方法

        });
    },

    /**
     * @并发请求, 依赖于getByList
     * @params { url: string } 请求的url
     * @params { fn: Function } 钩子函数，递归通过当前url获取下一个url，直到空为止
     * @params { cbk: Function[optional] } 钩子函数，每个请求成功后会尝试调用该函数，传入当前url与data
     * @return Primise
     */
    getByUrl(url, fn, cbk) {
        let URLList = [url], prevURL = url;

        // 利用当前url得到下一个url
        while(prevURL = fn(prevURL)) {
            URLList.push(prevURL);
        }
        
        // 并发请求
        return this.getByList(URLList, cbk);
    },

    // 使用范例
    // getByUrl('http://www.a.com1', function(url) {
    //     let nextId = url.slice(-1)++;
    //     if(nextId < lastPage) {       // lastPage是已经求出的变量
    //         return 'http://www.a.com' + (id++);
    //      }
    // }).then( dataList => console.log(dataList) );

    /**
     * @并发请求, 依赖于getByList
     * @params { url: string } 请求的url
     * @params { startFlag: number } 起始的url页码或者id
     * @params { endFlag: number } 结束的url页码或者id
     * @params { URLList: List[optional] } 默认的URL列表
     * @params { replaceReg: RegExp[optional] } 匹配url中的flag，替换成活的数字
     * @params { cbk: Function[optional] } 钩子函数，每个请求成功后会尝试调用该函数，传入当前url与data
     * @return Primise
     */
    getByNum(url, startFlag, endFlag, URLList = URLList || [], replaceReg = /{{flag}}/, cbk) {
       
        // 生成url列表
        for(let i = startFlag; i <=endFlag; i++) {
            URLList.push(url.replace(replaceReg, i));
        }

        // 并发请求
        return this.getByList(URLList, cbk);
    },

    // 使用范例
    // getByNum(`'http://www.a.com?page={{flag}}'`, 2, 100, [http://www.a.com])
    // .then( dataList => console.log(dataList) );
};
