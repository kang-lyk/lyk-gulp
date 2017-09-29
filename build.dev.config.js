module.exports = {
    staticUrl: '//static.eelly.dev',
    uglifyConfig: {
        compress: true,
        ie8: true   
    },
    browserSyncConfig: {
        server: {
            baseDir: ['dist','dist/www'],
            index: 'dome.html'
        }, 
        port: 3030,     
        files: ['dist/**/*.html']
    }
}