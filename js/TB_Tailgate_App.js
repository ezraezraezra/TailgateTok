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

/** @namespace Holds functionality for the splash screen. Everything is based off a proper Facebook Connect session */
var TB_TAILGATE_APP = function() {
	var appID = 132007266896357;
	var t;
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
	
	var link_to_widget = ""; //"http://ezraezraezra.com/tb/echotok/prototype/index.php";
	
	var $splash_container;
	var $fb_connect;
	
	$(document).ready(function() {
		$splash_container = $("#splash_container");
		$fb_connect = $("#fb_connect");
		
		// Connect to TB
		$fb_connect.click(function() {
			FB.login(function(response) {
				if(response.authResponse) {
					fb_id = response.authResponse.userID;
					global_fb_id = fb_id;
					FB.api('/me', function(data) {
						var fb_name = data.name;
						/**
						 * User is creating a new session
						 */
						if (invited == 'false') {
							$.get('php/back.php', {
								comm: 'create',
								fb_uid: fb_id,
								fb_name: fb_name
							}, function(data){
								table_id = data.table_id;
								global_table_id = table_id;
								global_fb_id = fb_id;
								// Initiate OpenTok & Echo Chat locally
								TB_VIDEO.init(data.session_id, data.token_id, data.unique_id);
								TB_VIDEO.updateTableId(global_table_id);
								TB_Echo_Chat.init(table_id, fb_name);
							});
						}
						/**
						 * User was invited to the session
						 */
						else {
							// A) Get session & user token from server
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
											TB_Echo_Chat.init(table_id, data_users.fb_name[z]);
										}
									}
									
									// E) Set up pic_holder of other users on client side
									for(var y= 0; y < local_fb_ids.length ; y++) {
										var id_compare = false;
										for(var r = 0; r < data_users.token_id.length; r++) {
											if(data_users.fb_uid[r] === local_fb_ids[y] && data_users.fb_uid[r] != fb_id) {
												OT_LayoutContainer.addStream("fbID_"+data_users.fb_uid[r], false, data_users.fb_name[r]);
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
					$splash_container.fadeOut('slow');
					// Populate friend list
					TB_Friend_Search.getFriends(fb_token);
				}
				else {
					console.log('Tailgate App: Log in error');
				}
			}, {scope: 'email', scope: 'friends_online_presence', scope: 'publish_stream'});
		});
	});
	/** @scope TB_Tailgate_App */
	return {
		/**
		 * Update required variables
		 * @param {String} If user was invited to session
		 * @param {String} User's unique ID on MySQL table
		 * @param {String} User's table ID, which contains session info, on MySQL table
		 * @param {String} URL of website that injected widget
		 */
		updateGlobal : function(_invited, _unique_id, _table_id, _origin_address) {
			invited = _invited;
			global_table_id = _table_id;
			global_unique_id = _unique_id;
			link_to_widget = _origin_address.substring(1, _origin_address.length-1);
		},
		/**
		 * Return value of give key
		 * @param {String} Which value to return
		 */
		getValue : function(_key) {
			var returnValue;
			switch(_key) {
				case 'table_id':
					returnValue = table_id; 
					break;
				case 'link_to_widget':
					returnValue = link_to_widget;
					break;
				default:
					returnValue = "";
			}
			return returnValue;
		},
		/**
		 * Add values to arrays
		 * @param {String} User Facebook ID
		 * @param {String} User's TB connection ID
		 * @param {String} Is user publishing currently
		 */
		setLocalArrayIDs : function(_fb_id, _conn_id, _publish) {
			local_fb_ids.push(_fb_id);
			local_conn_ids.push(_conn_id);
			local_publish.push(_publish);
			
			TB_VIDEO.updateIds(local_conn_ids, local_fb_ids, local_publish);
		},
		/**
		 * Update the OpenTok section of widget
		 * @param {String} ID of user
		 * @param {Boolean} Is this object a the publisher
		 * @param {String} Name of user
		 */
		updateLayoutContainer : function(_id, _boolean, _name) {
			// Tell other users in session to check the MySQL table for their session
			TB_VIDEO.signal();
			// Image placeholder
			OT_LayoutContainer.addStream(_id, _boolean, _name);
			OT_LayoutContainer.layout();
		}
	};
}();