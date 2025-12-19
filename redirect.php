<?php

include ("common.php");


if ($url) {

$lines_array = file($url);
$lines_string = implode('', $lines_array);
eregi("<head>(.*)</head>", $lines_string, $head);

?>
<HTML>
<HEAD>
<title><? echo $site_title ?></title>
<?php echo $head[0]; ?>

</HEAD>
<FRAMESET ROWS="140,*" cols="*" framespacing="0" FRAMEBORDER="no" border="0">
  <FRAME SRC="top.php" SCROLLING="NO">
  <FRAME SRC="<?php echo $url; ?>">
  <NOFRAMES>
  <BODY>
  Viewing this page requires a browser capable of displaying frames. 
  </BODY>
  </NOFRAMES>
</FRAMESET>
</HTML>
<?php
exit();

} else {

header("Location: $site_url");
exit();

}

?>