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
var TAILGATE_APP = function() {
	var appID = 132007266896357;
	var t;
	var friend_list;
	var display_friend_list = [];
	var index_select = 0;
	var max_display;
	var fb_token;
	var table_id = 0;
	var fb_id = 0;
	
	var local_fb_ids = [];
	var local_conn_ids = [];
	var local_publish = [];
	var global_fb_id = 0;
	
	var invited = "";
	var global_unique_id = "";
	var global_table_id = "";
	
	var $search_results_container;
	var $splash_container;
	var $search_input;
	var $fb_connect;
	var $search_result_user_container;
	
	$(document).ready(function() {
		$search_results_container = $("#search_results_container");
		$splash_container = $("#splash_container");
		$search_input = $('#search_input');
		$fb_connect = $("#fb_connect");
		
		// Connect to TB
		$fb_connect.click(function() {
			FB.login(function(response) {
				if(response.authResponse) {
					fb_id = response.authResponse.userID;
					global_fb_id = fb_id;
					FB.api('/me', function(data) {
						var fb_name = data.name;
						
						if (invited == 'false') {
							$.get('php/back.php', {
								comm: 'create',
								fb_uid: fb_id,
								fb_name: fb_name
							}, function(data){
								console.log(data);
								table_id = data.table_id;
								global_table_id = table_id;
								global_fb_id = fb_id;
								TB_VIDEO.init(data.session_id, data.token_id, data.unique_id);
								TB_VIDEO.updateTableId(global_table_id);
							});
						}
						else {
							// User was invited
							// A) Get session & user token from server
							//       - Already have unique_id & table_id. Get from address bar
							console.log("Else was called");
							$.get('php/back.php', {
								comm: 'get_sess_id',
								t_id: global_table_id
							}, function(data_session) {
								table_id = global_table_id;
								// D) Get other users info from server (and user at the same time)
								$.get('php/back.php', {
									comm: 'get_users',
									t_id: global_table_id
								}, function(data_users) {
									for(var x = 0; x < data_users.token_id.length; x++) {
										if(data_users.fb_uid[x] != fb_id) {
											local_fb_ids.push(data_users.fb_uid[x]);
											local_conn_ids.push(data_users.conn_id[x]);
											local_publish.push('false');
											
											TB_VIDEO.updateIds(local_conn_ids, local_fb_ids, local_publish);
										}
									}
									// B) Set up camera client side
									for(var z = 0; z < data_users.token_id.length; z++) {
										if(data_users.unique_id[z] == global_unique_id) {
											TB_VIDEO.init(data_session.session_id, data_users.token_id[z], data_users.unique_id[z]);
										}
									}
									
									// E) Set up pic_holder of other users on client side
									for(var y= 0; y < local_fb_ids.length ; y++) {
										var id_compare = false;
										for(var x = 0; x < data_users.token_id.length; x++) {
											if(data_users.fb_uid[x] === local_fb_ids[y] && data_users.fb_uid[x] != fb_id) {
												OT_LayoutContainer.addStream("fbID_"+data_users.fb_uid[x], false, data_users.fb_name[x]);
												OT_LayoutContainer.layout();
											}
										}
									}
									// F) Subscribe to anyone actually currently publishing
									setTimeout(function(){
										TB_VIDEO.getOldPublishers();
									}, 4000);
								});
							});
						}
					});
					fb_token = response.authResponse.accessToken;
					console.log('the access token: '+fb_token);
					$splash_container.fadeOut('slow');
					getFriends(fb_token);
				}
				else {
					console.log('logg in error');
				}
			}, {scope: 'email', scope: 'friends_online_presence', scope: 'publish_stream'});
		});
	});
	
	function getFriends(access_tkn) {
		$.getJSON('https://graph.facebook.com/me/friends?callback=?',
			{
				access_token : access_tkn
			},
			function(data){
				friend_list = data;
				
				$search_input.keyup(function(evt) {
					if(evt.keyCode == '13') {
						// Enter Key
						$search_result_user_container.css("display", "none");
						inviteToTB(display_friend_list[index_select - 1]);
						evt.preventDefault();
						return;
					}
					else if(evt.keyCode == '38') {
						// Up Arrow Key
						var pos = this.selectionStart;
						keyHighlight(0, 1, -1);
						this.selectionStart = pos; this.selectionEnd = pos;
						evt.preventDefault();
						return;
					}
					else if(evt.keyCode == '40') {
						// Down Arrow Key
						var pos = this.selectionStart;
						keyHighlight(6, 5, 1);
						this.selectionStart = pos; this.selectionEnd = pos;
						evt.preventDefault();
						return;
					}	
						
					else if ($search_input.val().length >= 2) {
						display_friend_list = [];
						$search_results_container.html("");
						
						friend_list.data.filter(function(val_to_match){
							var valval = $search_input.val();
							if(valval.indexOf(" ") != -1) {
								if (val_to_match.name.toLowerCase().indexOf(valval.toLowerCase(), 0) === 0) {
									display_friend_list.push(val_to_match);
								}
							}
							else {
								split_name = val_to_match.name.split(" ");
								for (names in split_name) {
									if (split_name[names].toLowerCase().indexOf(valval.toLowerCase(), 0) === 0) {
										display_friend_list.push(val_to_match);
									}
								}
							}
							
						});
						// Display top 5 users
						if(display_friend_list.length < 5) {
							max_display = display_friend_list.length;
						}
						else {
							max_display = 5;
						}
						for(var i = 0; i < max_display; i ++) {
							$(document.createElement('li'))
								.attr("class", "search_result_user_container")
								.attr("id", display_friend_list[i].id)
								.appendTo($("#search_results_container"));
							$(document.createElement('div'))
								.attr("class", "search_result_user_img")
								.html('<img src="https://graph.facebook.com/'+ display_friend_list[i].id+'/picture?access_token='+access_tkn+'"/>')
								.appendTo($("#"+display_friend_list[i].id));
							$(document.createElement('div'))
								.attr("class", "search_result_user_name")
								.html(display_friend_list[i].name)
								.appendTo($("#"+display_friend_list[i].id));
								
							findAffiliation(display_friend_list[i].id);
						}
						$search_result_user_container = $(".search_result_user_container");
						
						//MOUSE EVENTS
						$search_result_user_container.mouseenter(function() {
							fbFriendColor($search_result_user_container.not("#"+$(this).attr("id")), true);
							fbFriendColor($(this), false);
							index_select = ($("li").index(this) + 1);
						});
						$search_result_user_container.click(function() {
							$search_result_user_container.css("display", "none");
							inviteToTB(display_friend_list[index_select - 1]);
						});	
					}
					else {
						// Hide top 5 users
						$search_results_container.html("");
					}
				})
				.keydown(function(evt) {
					if(evt.keyCode == 38 || evt.keyCode == 40) {
						evt.preventDefault();
					}
				})
				.keypress(function(evt) {
					if(evt.keyCode == 38 || evt.keyCode == 40) {
						evt.preventDefault();
					}
				})
				.focus(function() {
					$search_results_container.css("display", "block");
				})
				.blur(function() {
					var delay_timer = setTimeout(function() {
						$search_results_container.css("display", "none");
					}, 200);
					
				});
			});
	}
	
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
	
	function findAffiliation(u_id){
		
		//Find all of friends network
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
	
	function inviteToTB(usr_object) {
		
		$.get('php/back.php', {
			comm: 'add_user',
			t_id: table_id,
			fb_uid: usr_object.id,
			fb_name: usr_object.name
		}, function(data){
			TB_VIDEO.signal();
			
			var publish = {
				method: 'stream.publish',
				name: 'ESPN Online Tailgate',
				link: 'http://ezraezraezra.com/tb/echotok/prototype/index.php?invited=true&t='+data.table_id+'&u='+data.unique_id
			};
			
			FB.api('/'+usr_object.id+'/feed', 'POST', publish, function(response) {
				// Blah
			});
		
		});
		
		OT_LayoutContainer.addStream("fbID_"+usr_object.id, false, usr_object.name);
		OT_LayoutContainer.layout();
		
		local_fb_ids.push(usr_object.id);
		local_conn_ids.push("0");
		local_publish.push('false');
		
		TB_VIDEO.updateIds(local_conn_ids, local_fb_ids, local_publish);
	}
	
	return {
		updateGlobal : function(_invited, _unique_id, _table_id) {
			invited = _invited;
			global_table_id = _table_id;
			global_unique_id = _unique_id;
		}
	};
}();