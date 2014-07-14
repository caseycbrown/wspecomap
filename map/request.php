<?php


/*handles ajax requests from Washington Square Park map*/


//all includes should be relative to this file's directory
set_include_path(get_include_path() . PATH_SEPARATOR . dirname(__FILE__));

include_once "./php/utility.php";
include_once "./php/tree.php";
include_once "./php/taxon.php";
include_once "./php/user.php";
include_once "./config/config.php";


$config = new Config();

session_start(); //assuming we will store some session info...



$jd = new JsonData();

try {

  $dbh = new DBHelper();
  $urlHelper = new URLHelper($dbh);
  $object = null; //will be tree, taxon, or user

  switch ($urlHelper->getParameter("noun")) {
    case "tree":
      $object = new Tree($dbh, $urlHelper);
      break;
    case "taxon":
      $object = new Taxon($dbh, $urlHelper);
      break;
    case "user":
      $object = new User($dbh, $urlHelper);
      break;
    default:
      $jd->error_ = "Invalid noun given";
  }

  if (!$jd->error_) {
    switch ($urlHelper->getParameter("verb")) {
      case "get":
        $jd = $object->get();
        break;
      case "update":
        $jd = $object->update();
        break;
      case "add":
        $jd = $object->add();
        break;
      case "delete":
        $jd = $object->delete();
        break;
      default:
        $jd->error_ = "Invalid verb given";
    }
  }
    

} catch (Exception $e) {
  $jd->error_ = $e->getMessage();
}


$jd->echoSelf();



?>
