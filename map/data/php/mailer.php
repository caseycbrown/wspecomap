<?php
include_once "./config/config.php";

class Mailer {

  /*tries to send first with Pear (to use SMTP server) and then by default*/
  public function send($to, $subject, $body) {        
    
    //$success = $this->sendWithPear($to, $subject, $body);  
    $success = $this->sendWithDefault($to, $subject, $body);  
    
    //TODO: i don't presently have SMTP info for this site, so use default only
    //$success = false;
    
    if (!$success) {
      $success = $this->sendWithPear($to, $subject, $body);  
      //$success = $this->sendWithDefault($to, $subject, $body);  
    }
    
    return $success;
  }

  public function sendWithPear($to, $subject, $body) {    
    $toReturn = false;

    try {
      if (! @include_once ("Mail.php")) {//don't need if Pear isn't used
        throw new Exception ("Mail.php does not exist");
      }
      if (! @include_once ("Mail/mime.php")) {//don't need if Pear isn't used
        throw new Exception ("Mail/mime does not exist");
      }
      
      //pear has some older code which doesn't meet newer strict standards.
      //to avoid the warnings, shut off strict reporting for this call
      $er = error_reporting(E_ERROR | E_PARSE);
      //error_reporting($er ^ E_STRICT);


      $config = new Config();
      $from = $config->email["from"];

      $headers = array (
        "From" => $from,
        "To" => $to,
        "Subject" => $subject);
      
      //want to send as html, so use mail_mime
      $mime = new Mail_mime();
      $mime->setTXTBody($body);
      $mime->setHTMLBody("<html><body>$body</body></html>");    
      
      //update body and headers
      $body = $mime->get();
      $headers = $mime->headers($headers);
      
      $smtp = Mail::factory("smtp",
        array (
          "host" => $config->email["host"],
          "port" => $config->email["port"],
          "auth" => true,
          "username" => $config->email["username"],
          "password" => $config->email["password"]));
          
      $mail = $smtp->send($to, $headers, $body);

      $toReturn = (!PEAR::isError($mail));
      
      //echo "ERROR IS" . $mail->getMessage();
      
      //now set error reporting back to original
//      error_reporting($er);
    } catch (Exception $e) {
      //echo $e;
    }

    return $toReturn;

  }
  
  /*returns true on success, false on failure
  */
  public function sendWithDefault($to, $subject, $body) {
    $toReturn = false;
    
    $config = new Config();
    $from = $config->email["from"];
    
    //send using mail,
    $headers = "From: $from" . "\r\n" .
      "Reply-To: $from" . "\r\n" .
      'MIME-Version: 1.0' . "\r\n" .
      'Content-type: text/html; charset=iso-8859-1' . "\r\n" .
      'X-Mailer: PHP/' . phpversion();
    try {
      $toReturn = mail($to, $subject, $body, $headers);
    } catch (Exception $e) {
      
    }
    return $toReturn;
  }
}
  
?>