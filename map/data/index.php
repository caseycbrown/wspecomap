<?php


/*handles ajax requests from Washington Square Park map*/

//all includes should be relative to this file's directory
set_include_path(get_include_path() . PATH_SEPARATOR . dirname(__FILE__));


include_once "./php/utility.php";
include_once "./config/config.php";
include_once "./php/tree.php";
include_once "./php/taxon.php";
include_once "./php/observation.php";
include_once "./php/layer.php";
include_once "./php/user.php";



$config = new Config();

session_start(); //assuming we will store some session info...


$jd = new JsonData();

try {

  $dh = new DataHelper();
  $manager = null;
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
    case "layer":
      $manager = new LayerManager();
      break;
    case "user":
      $manager = $um;
      break;
    case "initial-data":
      if ($dh->getParameter("verb") === "get") {
        //want to return both taxa and layer information.  This facilitiates a
        //single call instead of two ajax requests when loading map
        $manager = new LayerManager();
        $jd = $manager->processRequest($dh);
        if (!$jd->get("error")) {
          $manager = new TaxonManager();
          $taxonInfo = $manager->processRequest($dh);
          if ($taxonInfo->get("error")){
            $jd->set("error", $taxonInfo->get("error"));
          } else {
            $jd->set("taxa", $taxonInfo->get("taxa"));
          }
        }
        if (!$jd->get("error")) {
          $manager = new TreeManager();
          $treeInfo = $manager->processRequest($dh);
          if ($treeInfo->get("error")){
            $jd->set("error", $treeInfo->get("error"));
          } else {
            $jd->set("trees", $treeInfo->get("trees"));
          }
        }
        //set manager to null so it's not called again
        $manager = null;
        
      } else {
        throw new Exception("Invalid verb given for basics");
      }
      
      break;
    default:
      throw new Exception("Invalid noun given");
  }
  
  if ($manager) {
    $jd = $manager->processRequest($dh);
  }
  

} catch (Exception $e) {
  $jd->set("error", $e->getMessage());
}


$jd->echoSelf();



?>
