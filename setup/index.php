<?php include("../common.php"); ?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title>Untitled Document</title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
</head>

<body>
<table width="500" border="0" align="center" cellpadding="4" cellspacing="0">
  <tr>
    <td><p><font size="2" face="Arial, Helvetica, sans-serif">Welcome to your 
        new website. Setting up this site is very simple and requires you setting 
        persmissions on one file and following the instructions on the page. Your 
        first step is to set permissions on the common.php file to 666 which you 
        should have already done. </font></p>
      <p>&nbsp;</p>
      </td>
  </tr>
  <tr>
    <td> 
      

<form method=post action="setup.php">
        <table width="545" align=center valign=middle>
          <caption align=center>
          <b><font size="2" face="Arial, Helvetica, sans-serif">Basic Site Installation:<br>
          </font></b><font size="2" face="Arial, Helvetica, sans-serif">This is 
          installer will write your basic site information. NOTE: IF you make 
          a mistake and encounter a problem. Re upload common.php. Some servers 
          will mix up the common file if you use this installer more than once 
          without uploading the original file.<br>
          </font> 
          </caption>
          <tr> 
            <td width="141"><font size="2" face="Arial, Helvetica, sans-serif">Site 
              Title :</font></td>
            <td width="144"><input name="site_title" type=text id="site_title" value="<? echo $site_title ?>"></td>
            <td width="244">&nbsp;</td>
          </tr>
          <tr> 
            <td><font size="2" face="Arial, Helvetica, sans-serif">TravelNow ID:</font></td>
            <td><input name="travel_id" type=text id="travel_id" value="<? echo $travel_id ?>"></td>
            <td>&nbsp;</td>
          </tr>
          <tr> 
            <td><font size="2" face="Arial, Helvetica, sans-serif">Site Email:</font></td>
            <td><input name="email" type=text id="email" value="<? echo $email ?>" size="30"></td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td valign="top"><font size="2" face="Arial, Helvetica, sans-serif">Site 
              Name:</font></td>
            <td valign="top"><input name="site_name" type=text value="<? echo $site_name ?>" size="30"></td>
            <td>&nbsp;</td>
          </tr>
          <tr> 
            <td valign="top"><font size="2" face="Arial, Helvetica, sans-serif">Site 
              Url::</font></td>
            <td valign="top"><input name="site_url" type=text id="url" value="<? echo $site_url ?>" size="30"></td>
            <td><font color="#FF0000" size="2" face="Arial, Helvetica, sans-serif">url 
              to the location where your jobsite is. No trailing slash. (/)</font></td>
          </tr>
          <tr> 
            <td></td>
            <td><input name="submit" type=submit id="submit" value="Install"></td>
            <td><br> <br> </td>
          </tr>
        </table>

</form>

<center>
</center>


</td>
  </tr>
</table>
</body>
</html>
