module.exports = {
    autoprefixer:{
        // browsers: ['iOS >= 7', 'Android >= 4', 'Firefox > 20', 'ie >=8'],
        browsers: [">0%"],
        cascade: false, //是否美化属性值 默认：true 像这样：
        //-webkit-transform: rotate(45deg);
        //transform: rotate(45deg);
        remove:true //是否去掉不必要的前缀 默认：true 
    },
    assets: {
        // loadPaths: ['images/','fonts/'],
        loadPaths: ['/'],
        // baseUrl: baseUrl, //服务器域名（如果是空字符串会报错）
        basePath: 'src/',    //根目录 
        // relative: false,     // 使用相对目录 (默认false)
        // cachebuster: true
    }

}