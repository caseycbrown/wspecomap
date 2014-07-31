<?php


/*handles ajax requests from Washington Square Park map*/

//all includes should be relative to this file's directory
set_include_path(get_include_path() . PATH_SEPARATOR . dirname(__FILE__));


include_once "./php/utility.php";
include_once "./config/config.php";
include_once "./php/tree.php";
include_once "./php/taxon.php";
include_once "./php/observation.php";
include_once "./php/user.php";



$config = new Config();

session_start(); //assuming we will store some session info...


$jd = new JsonData();

try {

  $dh = new DataHelper();
  $manager = null; //will be tree, taxon, or user
  $um = new UserManager();

  switch ($dh->getParameter("noun")) {
    case "tree":
      $manager = new TreeManager();
      break;
    case "taxon":
      $manager = new TaxonManager();
      break;
    case "observation":
      $manager = new ObservationManager();
      break;
    case "user":
      $manager = $um;
      break;
    default:
      throw new Exception("Invalid noun given");
  }
  
  $jd = $manager->processRequest($dh);

  

} catch (Exception $e) {
  $jd->set("error", $e->getMessage());
}


$jd->echoSelf();



?>
