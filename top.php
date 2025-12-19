<?php include("common.php"); ?>

<html>
<head>
<title><?php echo $site_title ?></title>

<link href="styles.css" rel="stylesheet" type="text/css">
<SCRIPT LANGUAGE="JavaScript">
<!-- Begin
var Message="Your Travel and Vacation Source! Flights | Hotels | Cars | Vacation Rentals | Destination Guides ";
var place=1;
function scrollIn() {
window.status=Message.substring(0, place);
if (place >= Message.length) {
place=1;
window.setTimeout("scrollOut()",300); 
} else {
place++;
window.setTimeout("scrollIn()",50); 
   } 
}
function scrollOut() {
window.status=Message.substring(place, Message.length);
if (place >= Message.length) {
place=1;
window.setTimeout("scrollIn()", 100);
} else {
place++;
window.setTimeout("scrollOut()", 50);
   }
}
// End -->
</SCRIPT>
</head>
<body bgcolor="#ffffff" leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" onload="scrollIn()">
<div align="left">
  <table width="778" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td width="797"><table width="778" border="0" cellspacing="0" cellpadding="0">
          <tr> 
            <td width="778"><table width="702" border="0" cellspacing="0" cellpadding="0">
                <tr> 
                  <td><img src="images/top.jpg" width="777" height="29" border="0" usemap="#Map"></td>
                </tr>
              </table>
              <table width="796" border="0" cellspacing="0" cellpadding="0">
                <tr> 
                  <td width="179" valign="top" background="images/logobg.jpg"><table width="100" border="0" cellspacing="0" cellpadding="0">
                      <tr> 
                        <td><img src="images/logo.jpg" width="179" height="58"></td>
                      </tr>
                      <tr> 
                        <td><div align="center"> 
                            <p class="SIRsort-off2"><font color="#FFFFFF"><?php echo $site_name ?></font></p>
                          </div></td>
                      </tr>
                    </table></td>
                  <td width="617"><object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" width="598" height="110">
                      <param name="movie" value="images/nflash.swf">
                      <param name="quality" value="high">
                      <embed src="images/nflash.swf" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" width="598" height="110"></embed></object></td>
                </tr>
              </table></td>
          </tr>
          <tr> 
            <td valign="top" background="images/bg.jpg"><table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr> 
                  <td width="100%" colspan="2" valign="top"><TABLE cellSpacing=0 cellPadding=0 width=770 border=0>
                      <TBODY>
                        <TR> 
                          <TD class=top-iconbg width=418><IMG height=70 alt="" 
      src="images/p.gif" width=418 border=0></TD>
                          <TD class=top-iconbg align=right width=335>&nbsp; </TD>
                          <TD><IMG src="images/top-right-curve.gif" width="17" height="70" 
border=0></TD>
                        </TR>
                      </TBODY>
                    </TABLE>
                    
                  </td>
                </tr>
              </table></td>
          </tr>
        </table></td>
    </tr>
    <tr>
      <td>&nbsp;</td>
    </tr>
  </table>
</div>
<map name="Map">
  <area shape="rect" coords="611,7,652,23" href="<? echo $site_url ?>" target="_parent">
  <area shape="rect" coords="667,7,744,25" href="mailto:<? echo $email ?>">
</map>
</body>
</html>
