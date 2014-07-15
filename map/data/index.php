<?php


/*handles ajax requests from Washington Square Park map*/

//all includes should be relative to this file's directory
set_include_path(get_include_path() . PATH_SEPARATOR . dirname(__FILE__));


include_once "./php/utility.php";
include_once "./config/config.php";
include_once "./php/tree.php";
include_once "./php/taxon.php";
include_once "./php/user.php";



$config = new Config();

session_start(); //assuming we will store some session info...



$jd = new JsonData();

try {

  $dbh = new DBHelper();
  $urlHelper = new URLHelper($dbh);
  $manager = null; //will be tree, taxon, or user

  switch ($urlHelper->getParameter("noun")) {
    case "tree":
      $manager = new TreeManager($dbh, $urlHelper);
      break;
    case "taxon":
      $manager = new Taxon($dbh, $urlHelper);
      break;
    case "user":
      $manager = new User($dbh, $urlHelper);
      break;
    default:
      $jd->error_ = "Invalid noun given";
  }

  if (!$jd->error_) {
    switch ($urlHelper->getParameter("verb")) {
      case "get":
        $jd = $manager->get();
        break;
      case "update":
        $jd = $manager->update();
        break;
      case "add":
        $jd = $manager->add();
        break;
      case "delete":
        $jd = $manager->delete();
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
