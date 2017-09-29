module.exports = {
    staticUrl: '//localhost:3030',    
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