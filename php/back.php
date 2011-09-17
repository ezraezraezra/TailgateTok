<?php
header('Content-type: application/json; charset=utf-8');
require "info.php";
require "sdk/OpenTokSDK.php";

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

$comm = mysql_escape_string($_GET['comm']);
$table_id = mysql_escape_string($_GET['t_id']);
$fb_uid = mysql_escape_string($_GET['fb_uid']);
$fb_name = mysql_escape_string($_GET['fb_name']);
$conn_id = mysql_escape_string($_GET['conn_id']);
$unique_id = mysql_escape_string($_GET['u_id']);

	/**
	 * Connecting to database
	 */
	$connection = mysql_connect($hostname, $user, $pwd);
	if(!$connection) {
		die("Error ".mysql_errno()." : ".mysql_error());
	}
	$db_selected = mysql_select_db($database, $connection);
	if(!$db_selected) {
		die("Error ".mysql_errno()." : ".mysql_error());
	}

// Create & Add Session
// Also add user who created the session
if($comm == 'create') {
	$table_id = createSession($db_selected, $connection);
	$arr = addUser($db_selected, $connection, $table_id, $fb_uid, $fb_name);
}

// Add my connectionId
if($comm == 'add_conn_id') {
	// It can be either be done via fb_uid or unique_id
	$arr = addConnId($db_selected, $connection, $unique_id, $conn_id);
}

// Get Session ID
if($comm == 'get_sess_id') {
	$arr = getSessId($db_selected, $connection, $table_id);
}

// Get users
if($comm == 'get_users') {
	$arr = getUsers($db_selected, $connection, $table_id);
}

if($comm == 'add_user') {
	$arr = addUser($db_selected, $connection, $table_id, $fb_uid, $fb_name);
}

	/**
 	* Close connection
 	*/
	mysql_close($connection);
	$output = json_encode($arr);
	echo $output;

function createSession($db_selected, $connection) {
	// Create Session
	$a = new OpenTokSDK(API_Config::API_KEY,API_Config::API_SECRET);
	try {
		$session_id =  $a->create_session('127.0.0.1')->getSessionId();
	}catch(OpenTokException $e) {
		print $e->getMessage();
 	}
 	
 	//Add session to DB
 	$session_create = "INSERT INTO espn_session (session) VALUES('$session_id')";
	$session_create = submit_info($session_create, $connection, false);
	$table_id = mysql_insert_id();
	
	return $table_id;
}

function addUser($db_selected, $connection, $table_id, $fb_uid, $fb_name) {
	// Get TB session id
	$session_request = "SELECT * FROM espn_session WHERE id='$table_id'";
	$session_request = submit_info($session_request, $connection, true);
	while(($rows[] = mysql_fetch_assoc($session_request)) || array_pop($rows));
	foreach ($rows as $row):
		$session_id =  "{$row['session']}";
	endforeach;
	
	// Create Token
	$a = new OpenTokSDK(API_Config::API_KEY,API_Config::API_SECRET);
	$token_id = $a->generate_token("$session_id", RoleConstants::MODERATOR);
	// Add user to user_table
	$insertUser = "INSERT INTO espn_users (session_X_id, token_id, fb_uid, fb_name) VALUES('$table_id','$token_id','$fb_uid','$fb_name')";
	$insertUser = submit_info($insertUser, $connection, false);
	$unique_id = mysql_insert_id();
	
	$arr = array("status"=>"200", "unique_id"=>$unique_id, "token_id"=> $token_id, "table_id"=>$table_id, "session_id"=>$session_id);
	
	return $arr;
}

function addConnId($db_selected, $connection, $unique_id, $conn_id) {
	// Set conn_id to fb_uid
	$id_pair = "UPDATE espn_users SET conn_id='$conn_id' WHERE id='$unique_id'";
	$id_pair = submit_info($id_pair, $connection, false);
	
	$arr = array("status"=>"200");
	
	return $arr;
}

function getSessId($db_selected, $connection, $table_id) {
	// Get session ID using its unique ID ($table_id)
	// Get TB session id
	$session_request = "SELECT * FROM espn_session WHERE id='$table_id'";
	$session_request = submit_info($session_request, $connection, true);
	while(($rows[] = mysql_fetch_assoc($session_request)) || array_pop($rows));
	foreach ($rows as $row):
		$session_id =  "{$row['session']}";
	endforeach;
	
	$arr = array("status"=>"200", "session_id"=>$session_id);
	
	return $arr;
}

function getUsers($db_selected, $connection, $table_id) {
	// Get users via table_id
	$users_request = "SELECT * FROM espn_users WHERE session_X_id='$table_id'";
	$users_request = submit_info($users_request, $connection, true);
	while(($rows[] = mysql_fetch_assoc($users_request)) || array_pop($rows));
	$counter = 0;
	foreach ($rows as $row):
		$token_id[$counter] =  "{$row['token_id']}";
		$conn_id[$counter] =  "{$row['conn_id']}";
		$fb_uid[$counter] =  "{$row['fb_uid']}";
		$fb_name[$counter] =  "{$row['fb_name']}";
		$unique_id[$counter] = "{$row['id']}";
		$counter = $counter + 1;
	endforeach;
	
	$arr = array("status"=>"200", "token_id"=>$token_id, "conn_id"=>$conn_id, "fb_uid"=>$fb_uid, "fb_name"=>$fb_name, "unique_id"=>$unique_id);
	
	return $arr;
}

function submit_info($data, $conn, $return) {
	$result = mysql_query($data,$conn);
	if(!$result) {
		die("Error ".mysql_errno()." : ".mysql_error());
	}
	else if($return == true) {
		return $result;
	}
}

?>