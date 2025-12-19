<?php

$handle= fopen('../common.php','w');
$string = "<?
\$site_title      = \"$site_title\";
\$travel_id       = \"$travel_id\";
\$email           = \"$email\";
\$site_name       = \"$site_name\";
\$site_url        = \"$site_url\";
?>
";
fputs($handle, $string);
fclose($handle);
exec("cp common.php ..");


?>

<body>

<center>
<br>
<br>
<br>
<table>
<tr>
<td>
<center>
          <p><font size=5> <br>
            <font face="Arial, Helvetica, sans-serif">Success! </font></font></p>
          <p><font size=5><font size="3" face="Arial, Helvetica, sans-serif">The your website 
            should now be installed. If you encounter problems, please contact 
            the author at: </font></font></p>
          <p><font size="3" face="Arial, Helvetica, sans-serif"><a href="crash@traffic-jam.ca">crash@traffic-jam.ca</a></font></p>
          <p>&nbsp;</p>
          <hr>
          <font size="2" face="Arial, Helvetica, sans-serif">It is recommended 
          that you check your site. If everything diplays correctly you should 
          now delete the folder name setup. If you received any errors, check 
          the permissions on <strong>common.php</strong> and run setup again.</font> 
          <p>&nbsp; 
          <p>

</center>
</td>
</tr>
</table>
</center>

