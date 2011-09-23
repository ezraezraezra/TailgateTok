<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<!-- 
 _____     _ _             _      _____     _    
|_   _|   (_) |           | |    |_   _|   | |   
  | | __ _ _| | __ _  __ _| |_  ___| | ___ | | __
  | |/ _` | | |/ _` |/ _` | __|/ _ \ |/ _ \| |/ /
  | | (_| | | | (_| | (_| | |_|  __/ | (_) |   < 
  \_/\__,_|_|_|\__, |\__,_|\__|\___\_/\___/|_|\_\
                __/ |                            
               |___/                             

 -->
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<script src="http://staging.tokbox.com/v0.91/js/TB.min.js" type="text/javascript" charset="utf-8"></script>
<script type="text/javascript" src="js/jquery-1.5.1.min.js"></script>
<script src="http://cdn.echoenabled.com/clientapps/v2/jquery-pack.js"></script>
<script src="http://cdn.echoenabled.com/clientapps/v2/submit.js"></script>
<script src="http://cdn.echoenabled.com/clientapps/v2/stream.js"></script>
<script src="js/OT_LayoutContainer.js" type="text/javascript" charset="utf-8"></script>
<script src="js/TB_Video.js" type="text/javascript" charset="utf-8"></script>
<script src="js/TB_Tailgate_App.js" type="text/javascript" charset="utf-8"></script>
<script src="js/TB_Friend_Search.js" type="text/javascript" charset="utf-8"></script>
<script src="js/TB_Echo_Chat.js"></script>
<link rel="stylesheet" type="text/css" href="css/style.css" />
<link rel="stylesheet" href="css/echo.css" type="text/css" />
<title>TailgateTok</title>
</head>
<?php
class Tailgate {
	var $invited;
	var $user_id;
	var $table_id;
	var $origin_url;
	
	function Tailgate($i, $u, $t, $o) {
		$this->user_id = $u;
		$this->table_id = $t;
		$this->origin_url = $o;
		
		$this->invited = $this->setInvited($i);
	}
	
	function setInvited($i) {
		if($i == 'true') {
			return 'true';
		}
		else {
			return 'false';
		}
	}
}

$invited = $_GET['invited'];
$u = $_GET['u'];
$t = $_GET['t'];
$o = $_GET['o'];

$tailgate_app = new Tailgate($invited, $u, $t, $o);

?>
<body>
	<script type="text/javascript">
		TB_VIDEO.updateTableId('<?php echo $tailgate_app->table_id; ?>');
		TB_TAILGATE_APP.updateGlobal('<?php echo $tailgate_app->invited; ?>', '<?php echo $tailgate_app->user_id; ?>', '<?php echo $tailgate_app->table_id; ?>', '<?php echo $tailgate_app->origin_url; ?>');
	</script>
	<div id="container">
		<div id="splash_container">
			<div id="splash_copy">Watch live with friends</div>
			<button id="fb_connect">Connect using <span style="font-weight:bold;">Facebook</span></button>
		</div>
		<div id="tb_widget">
			<div id="search_container">
				<input type="text" name="search_input" id="search_input" placeholder="Enter Friend's Name" />
			</div>
			<ul id="search_results_container">
			</ul>
			<div id="video_container"></div>
			<div id="echo_container">
				<div id="echo-stream"></div>
				<div id="submit-form"></div>
			</div>
		</div>
	</div>
	<div id="fb-root"></div>
	<script type="text/javascript" src="http://connect.facebook.net/en_US/all.js"></script>
<script type="text/javascript">
	FB.init({
		appId  : '132007266896357',
		status : true,
		cookie : true,
		xfbml  : true,
		channelUrl: 'http://ezraezraezra.com/tb/echotok/prototype/channel.html',
		oauth  : true
	});
</script>
</body>
</html>