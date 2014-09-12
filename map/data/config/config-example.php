<?php
/*
IMPORTANT - Ensure that this file is inaccessible to outside world.

This file is an example.  Copy it to config.php and then change the values
as appropriate.  .gitignore is set up to ignore config.php

*/
 
 /*a class instead of a global variable
  varibles are arrays instead of ints/strings/whatever in case they are added
  to later on
 */
class Config {

  public $defaultConnection = array(
    "host" => "localhost",
    "username" => "user name here",
    "password" => "password here",
    "database" => "database name here",
    "displayErrorMessages" => false //set to false unless debugging.  a value
                                    //of true will display detailed db errors
  );
  
  /*settings for the generation of password hashes*/
  public $password = array(
    "iterationCount" => 6
  );

  /*for sending emails to users*/
  public $email = array (
    "from" => "",//email from address
    "username" => "", //login info for smtp server
    "password" => "", //login info
    "host" => "", //e.g. smtp.gmail.com
    "port" => "25",
     //now where to direct user in reset link
    "resetUrl" => "someurl"
  );

}

?>