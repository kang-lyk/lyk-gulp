// 引入gulp和 gulp插件
const gulp = require('gulp'),
    //删除文件
    del = require('del'),
    // gulp流中if判断
    gulpIf = require('gulp-if'),
    source = require('vinyl-source-stream'), 
    buffer = require('vinyl-buffer'),
    // 共享共享 stream （流）
    lazypipe = require('lazypipe'),
    // 匹配文件
    globby = require('globby'), 
    // 模板插件
    mustache = require('gulp-mustache'),
    // 过滤或还原“流”中文件
    filter = require('gulp-filter'),
    // 文件改名
    rename = require('gulp-rename'),
    // 生成map文件开发环境调试用
    sourcemaps = require('gulp-sourcemaps'),
    // js es6转es5
    babelify = require('babelify'),
    // js代码压缩
    uglify = require('gulp-uglify'),
    // js模块化
    browserify = require('browserify'),
    //生成md5的文件指纹
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    // css处理器
    postcss = require('gulp-postcss'),
    // 自动加前缀
    autoprefixer = require('autoprefixer'),
    // 可以在css中插入图片尺寸和内联文件
    assets  = require('postcss-assets'),
    // 可以在postcss中写scss
    precss = require('precss'),
    // 压缩css
    cleanCSS = require('gulp-clean-css'),
    // 模拟接口数据
    mockjs = require('mockjs'),
    // gulp-postcss 相关插件的配置
    postcssConfig = require('./postcss.config.js'),
    // 启动本地服务和自动刷新浏览器等功能
    browserSync = require('browser-sync').create(),
    // 刷新浏览器
    reload = browserSync.reload,    
    // 命令行参数分析工具
    minimist = require('minimist'),
    //npm script运行的名称
    node_env = process.env.npm_lifecycle_event,
    // package.json中的版本号
    webVersion = process.env.npm_package_version,  
    // 命令行里的参数
    args = minimist(process.argv.slice(2)); 

let argsConfig  = args.config, //命令行参数config的值
    // 用来判断引入哪个build.config.js文件
    buildConfig = argsConfig ? `.${argsConfig}` : '',
    // 是否开发或测试环境，用来给gulp-if判断，让生产环境不生成.map文件
    isDevelopment = (buildConfig == '.build') ? false : true ;

const {staticUrl, uglifyConfig, browserSyncConfig} = require(`./build${buildConfig}.config.js`)
console.log(uglifyConfig)
// 删除所有压缩好的文件
gulp.task('clearAll', function(){
    del(['rev/**/*','dist/**/*'])
})

/*处理图片*/
gulp.task('images', function() {
    return gulp
        .src([
            'src/**/*.{png,jpg,jpeg,gif,svg,webp}',
            '!src/**/_*.{png,jpg,jpeg,gif,svg,webp}',
            '!src/fonts/**/*.svg'
        ])
        .pipe(rev())
        .pipe(gulp.dest('dist'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/images'));    
});

/*处理字体*/
gulp.task('fonts', function() {
    return gulp.src('src/fonts/**/*{svg,eot,ttf,woff}', {base: 'src'})
        .pipe(rev())
        .pipe(gulp.dest('dist'))  
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/fonts'));
});

/*处理css*/
gulp.task('css', ['images', 'fonts'], function() { 
    
    let plugins = [
            autoprefixer(postcssConfig.autoprefixer),
            precss(),
            assets({
                loadPaths: ['/'],
                // baseUrl: baseUrl, //服务器域名（如果是空字符串会报错）
                basePath: 'src',    //根目录 
                // relative: false,     // 使用相对目录 (默认false)
                cachebuster: true  // 加随机数如 /icons/baz.png?14a931c501f
            })
        ],
        filterCss = filter('**/*.css', {restore: true});
  
    return gulp
        .src([     
            'rev/{fonts,images}/*.json',       
            'src/**/*.css',
            '!src/**/_*.css'
        ])
        .pipe(filterCss)        
        .pipe(postcss(plugins))
        .pipe(gulpIf(isDevelopment, sourcemaps.init({loadMaps: true}))) //.map文件配置     
        .pipe(cleanCSS())  
        .pipe(rev()) //生成md5文件  
        .pipe(gulpIf(isDevelopment, sourcemaps.write('./') ))  //成生.map文件 
        .pipe(filterCss.restore)
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest('dist'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/css'));   
});

/*处理js文件*/
gulp.task('js', function(){   
    del('[rev/js]')    
    return globby(['src/**/*.js', '!src/**/_*.js']).then(function(entries) {
        // 遍历文件
        entries.forEach(function(file) {            
            // var filename = file.substr(file.lastIndexOf('/') + 1); // 取出文件名
            var filePath = file.replace(/src\//, '') ;
            browserify(file)
                .transform("babelify", { presets: ["es2015"] }) //js es6语法转es5
                .bundle()
                .pipe(source(filePath))  // 将常规流转换为包含 Stream 的 vinyl 对象
                .pipe(buffer())     // 将 vinyl 对象内容中的 Stream 转换为 Buffer
                .pipe(gulpIf(isDevelopment, sourcemaps.init({loadMaps: true}) )) //.map文件配置
                .pipe(uglify(uglifyConfig))//压缩
                .pipe(rev())   //生成md5文件
                .pipe(gulpIf(isDevelopment, sourcemaps.write('./') ))//成生.map文件            
                .pipe(gulp.dest('dist'))  // 输出js文件
                // 生成rev-manifest.json文件
                .pipe(rev.manifest({
                    path: `rev/js/rev-${filePath.split('/').join('_')}.json`,
                    merge: true
                }))
                .pipe(gulp.dest('./')); //输出rev-manifest.json文件
        });
    }).catch(function(err) {
        console.log(err);
    });     
})

/**
 * [模板处理]
 */
var templateTransform = lazypipe()
    .pipe(function(){
        return revCollector({
            replaceReved: true,
            dirReplacements: {
                '@static/': function(manifest_value) {
                    return `${staticUrl}/${manifest_value}?v=${webVersion}`
                }
            }
        })
    });

gulp.task('template', ['js','css'], function(){
    let paths = ['rev/{css,js,images}/*.json','src/template/**/*.mustache'],
        isServer = !!(node_env == 'server') ;

    let tData = require('./mock/doem.js');
    console.log(tData)
    if (node_env == 'server') {
        return gulp.src(paths)            
            .pipe(templateTransform())
            .pipe(
                mustache(tData)
            )
            .pipe(rename({extname: ".html"}))
            .pipe(gulp.dest('dist/www'))
    } else {
        return gulp.src(paths)            
            .pipe(templateTransform())
            .pipe(gulp.dest('dist/template'))
    }
})

// gulp.task('html', ['js','css'], function(){
//     gulp.src(['rev/{css,js,images}/*.json','src/html/**/*.html'])   
//         .pipe(revCollector({
//             replaceReved: true,
//             dirReplacements: {
//                 '@static/': function(manifest_value) {
//                     return `${staticUrl}/${manifest_value}?v=${webVersion}`
//                 }
//             }
//         }))
//         .pipe(gulp.dest('dist/html'))        
// })

/*构建所有*/
var startTime = new Date()*1;
gulp.task('build', ['template'], function(){    
    let endTime = new Date()*1
    console.log(`--------总共用时${endTime - startTime}ms`)
    reload() //刷新浏览器
})

/*临听src目录下的文件变化,如有修改就进行构建*/
gulp.task('watch', function(){
    gulp.watch('src/**/*', ['build'], function(){
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    })
})

gulp.task('server', ['template', 'watch'],  function(){    
    browserSync.init(browserSyncConfig)   
})