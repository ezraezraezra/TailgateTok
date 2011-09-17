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
var TB_VIDEO = function(){
	var apiKey = 4311222;
	var sessionId = "";
	var token = "";
	var session = "";
	var unique_id = "";
	var start_streams = [];
	
	var local_conn_ids = [];
	var	local_fb_ids = [];
	var	local_publish = [];
	var global_table_id = "";
	
	function connect() {
			session.connect(apiKey, token);
	}
	
	//------------------------------------
	// HELPER METHODS
	//------------------------------------
	function publishStream(){
		var divId = 'opentok_publisher';
		OT_LayoutContainer.addStream(divId, true);
		
		session.publish(divId);
	}
	
	function startGetAllStreams(streams) {
		for (var i = 0; i < streams.length; i++) {
			if (streams[i].connection.connectionId != session.connection.connectionId) {
				start_streams.push(streams[i]);
			}
		}
	}
	
	function subscribeToStreams(streams){
		for (var i = 0; i < streams.length; i++) {
			if (streams[i].connection.connectionId != session.connection.connectionId) {
				
				for(var x = 0; x < local_conn_ids.length; x++) {
					if(streams[i].connection.connectionId == local_conn_ids[x]) {
						session.subscribe(streams[i], "fbID_"+local_fb_ids[x]);
					}
				}
			}
		}
	}
	
	//------------------------------------
	// OPENTOK EVENT HANDLERS
	//------------------------------------
	
	function sessionConnectedHandler(event){
		$.get('php/back.php', {
			comm: 'add_conn_id',
			u_id: unique_id,
			conn_id: session.connection.connectionId
		}, function(data){
			//console.log(data);
			//console.log("session_id passed");
		});

		publishStream();
		startGetAllStreams(event.streams);
		OT_LayoutContainer.layout();
	}
	
	function streamCreatedHandler(event){
		startGetAllStreams(event.streams);
		
		$.get('php/back.php', {
			comm: 'get_users',
			t_id: global_table_id
		},function(data){
			for(var y = 0; y < data.fb_uid.length; y++){
				for(var x = 0; x < local_fb_ids.length; x++) {
					if(data.fb_uid[y] == local_fb_ids[x]) {
						local_conn_ids[x] = data.conn_id[y];
					}
				}
			}
			
			console.log(local_conn_ids);
			console.log(local_fb_ids);

			for (var i = 0; i < start_streams.length; i++) {
				for (var x = 0; x < local_conn_ids.length; x++) {
					if (start_streams[i].connection.connectionId == local_conn_ids[x]) {
						session.subscribe(start_streams[i], "fbID_" + local_fb_ids[x]);
					}
				}
			}
			start_streams = [];
			OT_LayoutContainer.layout();
		});
	}
	
	function streamDestroyedHandler(event){
		for (var i = 0; i < event.streams.length; i++) {
			var subscribers = session.getSubscribersForStream(event.streams[i]);
			for (var j = 0; j < subscribers.length; j++) {
				OT_LayoutContainer.removeStream(subscribers[j].id);
			}
		}
		OT_LayoutContainer.layout();
	}
	
	function signalHandler(event) {
		if(session.connection.connectionId != event.fromConnection.connectionId) {
			$.get('php/back.php',{
				comm: 'get_users',
				t_id: global_table_id
			}, function(data_users) {
				console.log(data_users);
				for (var x = 0; x < data_users.token_id.length; x++) {
					var already_on_list = false;
					for(var y = 0; y < local_fb_ids.length; y++) {
						if(data_users.fb_uid[x] == local_fb_ids[y] || session.connection.connectionId == data_users.conn_id[x]) {
							already_on_list = true;
						}
					}
					if(already_on_list === false) {
						console.log(data_users.fb_name[x] + " was not on the list");
						local_fb_ids.push(data_users.fb_uid[x]);
						local_conn_ids.push(data_users.conn_id[x]);
						local_publish.push('false');
						OT_LayoutContainer.addStream("fbID_" + data_users.fb_uid[x], false, data_users.fb_name[x]);
						OT_LayoutContainer.layout();
					}
				}
			});
		}
	}
	
	//------------------------------------
	// LINK CLICK HANDLERS
	//------------------------------------
	return {
		init: function(_sessionId, _token, _unique_id){
			sessionId = _sessionId;
			token = _token;
			unique_id = _unique_id;
			
			session = TB.initSession(sessionId);
			session.addEventListener('sessionConnected', sessionConnectedHandler);
			session.addEventListener('streamCreated', streamCreatedHandler);
			session.addEventListener('streamDestroyed', streamDestroyedHandler);
			session.addEventListener('signalReceived', signalHandler);
			
			OT_LayoutContainer.init("video_container", 300, 500);
			connect();
		},
		disconnect: function() {
			session.disconnect();
		},
		getOldPublishers: function() {
			for(var i = 0; i < start_streams.length; i++) {
				for(var x = 0; x < local_conn_ids.length; x++) {
					if(start_streams[i].connection.connectionId == local_conn_ids[x]) {
						session.subscribe(start_streams[i], "fbID_"+local_fb_ids[x]);
					}
				}
			}
			start_streams = [];
		},
		signal: function() {
			session.signal();
		},
		updateIds: function(_connId, _fb_id, _publish) {
			local_conn_ids = [];
			local_fb_ids = [];
			local_publish = [];
			
			local_conn_ids = _connId;
			local_fb_ids = _fb_id;
			local_publish = _publish;
		},
		updateTableId : function(_table_id) {
			global_table_id = _table_id;
		}
	};
}();
