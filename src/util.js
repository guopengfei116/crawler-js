const cheerio = require('cheerio');

module.exports = {
    /**
     * @创建Primise实例，统一加catche-log
     * @params { fn: Function } 创建Promise实例所需的回调
     * @return Primise
     */
    getPrimise(fn) {
        let p = new Promise(fn);

        // resolve与reject时的最后一个参数认为是log，这里先简单打印，后续可调用专门的日志方法做记录
        p.then((...arg) => {
            let log = arg[arg.length - 1];
            log && console.log(log);
        });
        p.catch((...arg) => {
            let log = arg[arg.length - 1];
            log && console.log(log);
        });

        return p;
    },

    /**
     * @获取页面中所有的a标签链接
     * @params { page: string } html页面
     * @params { selector: string } 选择器
     * @params { fn: Function[optional] } 可选的钩子函数，允许对href进行加工处理
     * @return Array
     */
    getHref(json, result,page, selector, fn) {
        let $ = cheerio.load(page);
        let nodeList = $(selector).toArray();

        // 返回href属性值构成的数组
        return nodeList.map(node => {
            if(fn) {
                return fn(node.attribs.href);
            }else {
                node.attribs.href;
            }
        });
    },

    /**
     * @批量获取页面中所有的a标签链接
     * @params { pageList: Array } html页面列表
     * @params { selector: string } 选择器
     * @params { fn: Function[optional] } 可选的钩子函数，允许对href进行加工处理
     * @return Array
     */
    getHrefs(pageList, selector, fn) {
        return pageList.map((html) => {
            return this.getHref(html, selector, fn);
        });
    },

    /**
     * @获取指定元素的文本内容
     * @params { page: string } 请求回来的页面html
     * @params { selector: string } 选择器
     * @return string
     */ 
    getText(page, selector) {
        let $ = cheerio.load(page);
        return $(selector).text();
    }

};
