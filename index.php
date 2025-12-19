<?php include("common.php"); ?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">
<html>
<head>
<title><?php echo $site_title ?></title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
</head>

<frameset rows="140,*" frameborder="NO" border="0" framespacing="0">
  <frame src="top.php" name="topFrame" scrolling="NO" noresize >
  <frame src="http://www.travelnow.com/hotels/searchframe.jsp?cid=<? echo $travel_id ?>" name="mainFrame">
</frameset>
<noframes>
<body>

</body></noframes>
</html>
