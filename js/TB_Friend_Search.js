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

/** @namespace Holds functionality for the friend search bar, the ONLY way invite friends into this talk session */
var TB_Friend_Search = function() {
	var $search_input;
	var $search_result_user_container;
	var $search_results_container;
	
	var friend_list;
	var display_friend_list = [];
	var index_select = 0;
	var max_display;
	var access_token;
	
	// Set variables automatically
	$(document).ready(function() {
		$search_results_container = $("#search_results_container");
		$splash_container = $("#splash_container");
		$search_input = $('#search_input');
	});
	
	/**
	 * Highlight the current user being selected
	 * @param {int} Floor value
	 * @param {int} Ceiling value
	 * @param {int} Increment the counter
	 */
	function keyHighlight(base_case, new_value, increment_value){
		fbFriendColor($("#search_results_container li:nth-child(" + index_select + ")"), true);
		index_select += increment_value;
		
		if (index_select === base_case) {
			index_select = new_value;
			fbFriendColor($("#search_results_container li:nth-child(" + index_select + ")"), false);
		}
		else {
			fbFriendColor($("#search_results_container li:nth-child(" + index_select + ")"), false);
		}
	}
	/**
	 * Find & display network of individuals in search results
	 * @param {String} User's Facebook ID
	 */
	function findAffiliation(u_id){
		FB.api({
			method: 'fql.query',
			query: 'SELECT affiliations FROM user WHERE uid= ' + u_id
		}, function(data){
			if ($("#aff_" + u_id).length === 0) {
				$("#aff_" + u_id).html("");
				var affiliation = "";
				for (var x = 0; x < data[0].affiliations.length; x++) {
					affiliation += data[0].affiliations[x].name;
					if (x != data[0].affiliations.length - 1) {
						affiliation += " &#149; ";
					}
				}
				$(document.createElement('div'))
					.attr("class", "search_result_user_affiliation")
					.attr("id", "aff_" + u_id).html(affiliation)
					.appendTo($("#" + u_id));
			}	
		});
	}
	/**
	 * Change CSS properties of individual search results
	 * @param {Object} jQuery DIV object
	 * @param {Boolean} If current object is selected
	 */
	function fbFriendColor(u_object, selected) {
		if(selected === true) {
			u_object.css({
				'background-color': "white",
				'border-color': "white",
				'color': '#3B5998'
			});
		}
		else {
			u_object.css({
				'background-color': "#6D84B4",
				'border-color': "#3B5998",
				'color': "white"
			});
		}
	}	
	/**
	 * Send invitation to selected user & add them to MySQL table & local instance
	 * @param {Object} Facebook object
	 */
	function inviteToTB(usr_object) {
		var table_id = TB_TAILGATE_APP.getValue('table_id');
		var link_to_widget = TB_TAILGATE_APP.getValue('link_to_widget');
		// Add invited user to MySQL table
		$.get('php/back.php', {
			comm: 'add_user',
			t_id: table_id,
			fb_uid: usr_object.id,
			fb_name: usr_object.name
		}, function(data){
			// Publish to invited friend's wall
			var publish = {
				method: 'stream.publish',
				name: 'ESPN Online Tailgate',
				link: link_to_widget + '?invited=true&t='+data.table_id+'&u='+data.unique_id
			};
			FB.api('/'+usr_object.id+'/feed', 'POST', publish, function(response) {
				// Message posted to wall
				
				// Update Image placeholder & signal other users to check the session MySQL tables
				TB_TAILGATE_APP.updateLayoutContainer("fbID_"+usr_object.id, false, usr_object.name);
				TB_TAILGATE_APP.setLocalArrayIDs(usr_object.id, "0", 'false');
			});
		});
	}
	/**
	 * Search Algorithm
	 */
	function filterFriends() {
		friend_list.data.filter(function(val_to_match){
			var valval = $search_input.val();
			// Search by first name only
			if (valval.indexOf(" ") != -1) {
				if (val_to_match.name.toLowerCase().indexOf(valval.toLowerCase(), 0) === 0) {
					display_friend_list.push(val_to_match);
				}
			}
			// Search by first, middle, and last names
			else {
				split_name = val_to_match.name.split(" ");
				for (names in split_name) {
					if (split_name[names].toLowerCase().indexOf(valval.toLowerCase(), 0) === 0) {
						display_friend_list.push(val_to_match);
					}
				}
			}
		});
	}
	/**
	 * Insert friend results into the DOM
	 */
	function displayFriendResults(){
		if (display_friend_list.length < 5) {
			max_display = display_friend_list.length;
		}
		else {
			max_display = 5;
		}
		for (var i = 0; i < max_display; i++) {
			$(document.createElement('li')).attr("class", "search_result_user_container").attr("id", display_friend_list[i].id).appendTo($("#search_results_container"));
			$(document.createElement('div')).attr("class", "search_result_user_img").html('<img src="https://graph.facebook.com/' + display_friend_list[i].id + '/picture?access_token=' + access_token + '"/>').appendTo($("#" + display_friend_list[i].id));
			$(document.createElement('div')).attr("class", "search_result_user_name").html(display_friend_list[i].name).appendTo($("#" + display_friend_list[i].id));
			// Display networks	
			findAffiliation(display_friend_list[i].id);
		}
		$search_result_user_container = $(".search_result_user_container");
	}
	/**
	 * Select current highlighted user
	 */
	function selectUser(){
		$search_result_user_container.css("display", "none");
		// Send invitation via FB
		inviteToTB(display_friend_list[index_select - 1]);
		index_select = 0;
		$search_results_container.html("");
	}
	
	/*** @scope TB_Friend_Search */
	return {
		/**
		 * Custom Facebook search bar
		 * @param {String} Facebook's access token
		 */
		getFriends: function(access_tkn){
			access_token = access_tkn;
			$.getJSON('https://graph.facebook.com/me/friends?callback=?', {
				access_token: access_tkn
			}, function(data){
				friend_list = data;
				// Capture keyboard input
				$search_input.keyup(function(evt){
					var pos;
					if (evt.keyCode == '13') {
						// Enter Key
						evt.preventDefault();
						selectUser();
						return;
					}
					else 
						if (evt.keyCode == '38') {
							// Up Arrow Key
							pos = this.selectionStart;
							keyHighlight(0, 1, -1);
							this.selectionStart = pos;
							this.selectionEnd = pos;
							evt.preventDefault();
							return;
						}
						else 
							if (evt.keyCode == '40') {
								// Down Arrow Key
								pos = this.selectionStart;
								keyHighlight(6, 5, 1);
								this.selectionStart = pos;
								this.selectionEnd = pos;
								evt.preventDefault();
								return;
							}
							// Only display search results when greater than 2 typed characters	
							else 
								if ($search_input.val().length >= 2) {
									display_friend_list = [];
									$search_results_container.html("");
									
									// Run search algorithm
									filterFriends();
									
									// Display top 5 users
									displayFriendResults();
									
									//MOUSE EVENTS
									$search_result_user_container.mouseenter(function(){
										fbFriendColor($search_result_user_container.not("#" + $(this).attr("id")), true);
										fbFriendColor($(this), false);
										index_select = ($("li").index(this) + 1);
									});
									$search_result_user_container.click(function(){
										selectUser();
									});
								}
								else {
									// Hide top 5 users
									$search_results_container.html("");
								}
				}).keydown(function(evt){
					if (evt.keyCode == 38 || evt.keyCode == 40) {
						evt.preventDefault();
					}
				}).keypress(function(evt){
					if (evt.keyCode == 38 || evt.keyCode == 40) {
						evt.preventDefault();
					}
				}).focus(function(){
					$search_results_container.css("display", "block");
				}).blur(function(){
					var delay_timer = setTimeout(function(){
						$search_results_container.css("display", "none");
						$search_input.val("");
						$search_results_container.html("");
						index_select = 0;
					}, 200);
					
				});
			});
		}
	};
}();