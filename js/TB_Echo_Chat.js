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

/** @namespace Holds functionality for the live chat, provided by the ECHO API */
var TB_Echo_Chat = function() {
	/**
	 * Loads chat input
	 * @param {int} MySQL table id, which makes conversations unique to each session.
	 * @param {String} User's facebook name.
	 */
	function startForm(table_id, user_name) {
		// Need unique id for target URL
		new Echo.Submit({
			"target": document.getElementById("submit-form"),
			"appkey": "dev.tokbox",
			"targetURL": "http://tokbox.com/tailgate.php?t_id=" + table_id + ""
		});
		
		// Programatically set the user's name
		$("#submit-form .echo-submit-anonymousUserInfoName").val(user_name);
		// Programatically call the submit button
		$("#submit-form .echo-submit-text").keydown(function(event){
			// Capture Enter Key
			if (event.keyCode == '13') {
				event.preventDefault();
				$('#submit-form .echo-submit-postButton').click();
			}
		});
	}
	/**
	 * Loads chat output
	 * @param {int} MySQL table id, which makes conversations unique to each session.
	 */
	function startClient(table_id) {
		new Echo.Stream({
			"target": document.getElementById("echo-stream"),
			"appkey": "dev.tokbox",
			"query": "scope:http://tokbox.com/tailgate.php?t_id=" + table_id + ""
		});
		
		$('#echo-stream .echo-stream-more').remove();
		$('#echo-stream .echo-stream-brand').remove();
		$('#echo-stream .echo-application-message').remove();
	}
	
	/** @scope TB_Echo_Chat */
	return {
		/**
		 * Initializes instant text chat.  Must be called in order to display & use.
		 * @param {int} MySQL table id, which makes conversations unique to each session.
		 * @param {String} User's facebook name.
		 */
		init: function(table_id, user_name) {
			startForm(table_id, user_name);
			startClient(table_id);
		}
	};
}();
