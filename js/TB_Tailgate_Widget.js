/*
 * Project:     TailgateTok
 * Description: Video chat and intant message while watching a live game.
 * Website:     http://tailgate.opentok.com
 * 
 * Author:      Ezra Velazquez
 * Website:     http://ezraezraezra.com
 * Date:        September 2011
 * 
 */

/** @namespace Gather's host URL and injects widget onto page*/
var TB_TAILGATE_WIDGET = function(){
	// URL of the widget itself.
	var widget_src = "http://tailgate.opentok.com/app_container.php";
	
	var tb_invited = false;
	var tb_userId = "";
	var tb_tableId = "";
	var origin_address = "";
	
	/**
	 * Get hash data (invited, table id, user id) from host's URL
	 */
	var getHashData = function(){
		var page_hash = location.href;
		var index_hash = page_hash.indexOf("?");
		origin_address = page_hash.substring(0,page_hash.length);

		if (index_hash != -1) {
			origin_address = page_hash.substring(0, index_hash);
			page_hash = page_hash.substring(index_hash + 2, page_hash.length);
			page_hash = page_hash.split("&");
			
			// Pull required info
			tb_invited = getValue(page_hash[0]);
			tb_tableId = getValue(page_hash[1]);
			tb_userId = getValue(page_hash[2]);
		}
		/**
		 * Seperate key & value pair, returns value
		 * @param {String} key_value - key value pair as a string, delimited with an equal sign
		 */
		function getValue(key_value){
			return key_value.split("=")[1];
		}
	}();
	
	/**
	 * Inject tailgate onto host's website via iFrame
	 */
	var injectWidget = function(){
		iframe = document.createElement("iframe");
		iframe.src = widget_src + "?o='" + origin_address + "'";
		if (tb_invited === "true") {
			iframe.src = widget_src + "?invited=true&u=" + tb_userId + "&t=" + tb_tableId + "&o='" + origin_address + "'";
		}
		
		iframe.height = 650;
		iframe.width = 300;
		iframe.setAttribute("name", "tb_iframe");
		iframe.setAttribute("id", "tb_iframe");
		iframe.style.position = "absolute";
		iframe.style.border = "none";
		iframe.style.background = "transparent";
		iframe.setAttribute("frameBorder", "0");
		iframe.setAttribute("scrolling", "none");
		iframe.scrolling = "no";
		iframe.style.zIndex = "999999995";
		document.body.appendChild(iframe);
	}();
}();