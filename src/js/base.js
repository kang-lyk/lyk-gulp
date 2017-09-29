var jQuery = require("jQuery");
(function(win, doc, $){
	const formatTime = require('./utils/_formatTime.js')
    $('.j-time1').text(formatTime('yyyy-MM-dd hh:mm:ss'))     
})(window, document, jQuery)