/**
 * [formatTime 格式化时间]
 * @param  {[String]} format     [格式，如：yyyy-MM-dd hh:mm:ss]
 * @param  {[Number]} timeNumber [秒数，为空取当前时间]
 * @return {[String]}            [格式化的时间字符串]
 */
module.exports = function(format, timeNumber){
    var newDate = new Date();
    if (timeNumber) {
        newDate = new Date( (timeNumber+'').length == 10 ? timeNumber*1000 : timeNumber)
    }    
    let obj = {
        "M+": newDate.getMonth() + 1, //月份 
        "d+": newDate.getDate(), //日 
        "h+": newDate.getHours(), //小时 
        "m+": newDate.getMinutes(), //分 
        "s+": newDate.getSeconds() //秒
    }; 
    if(/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (newDate.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
  
    let arr = Object.keys(obj);
    for (let i = 0, leg = arr.length; i < leg; i++) {
        let k = arr[i];
        if(new RegExp("("+ k +")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length==1 ? obj[k] : ("00"+ obj[k]).substr((""+ obj[k]).length));
        }
    }
    return format;    
}