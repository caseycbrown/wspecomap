<?php

include_once "./php/utility.php";
include_once "./php/user.php";

/**
  subclassed by TreeManager, TaxonManager, ObservationManager
 */
abstract class Manager {

  protected $updatePriv_; //set to one of UPDATE_TREE, UPDATE_TAXON, UPDATE_OBSERVATION
  protected $addPriv_;
  protected $deletePriv_;
  protected $objName_; //string for tree, taxon, observation
  
  /*
    Determines what to do based on request parameters
  */
  public function processRequest($dh) {
    $jd = new JsonData();
    
    //there are some verbs that are common to all Managers, others that are not.
    //this function handles the former and passes the latter off to another function
    
    $verb = $dh->getParameter("verb");
    
    
    if ($verb === "get") {
      $jd = $this->find($dh);
    } else if (($verb === "add") || ($verb === "update") || ($verb === "delete")) {
      $user = $this->getLoggedInUser(); //these actions require being logged in
      if ($user === null) {
        $jd->set("error", "That action requires being logged in");
      } else {
        $obj = $this->createObjectFromRequest($dh);
        
        switch ($verb) {
          case "update":
            if ($user->hasPrivilege($this->updatePriv_)) {
              $jd = $obj->update($dh);
            } else {
              $jd->set("error", "User does not have permission to update $this->objName_");
            }
            break;
          case "add":
            if ($user->hasPrivilege($this->addPriv_)) {
              $jd = $obj->add($dh);
            } else {
              $jd->set("error", "User does not have permission to add $this->objName_");
            }

            break;
          case "delete":
            if ($user->hasPrivilege($this->deletePriv_)) {
              $jd = $obj->delete($dh);
            } else {
              $jd->set("error", "User does not have permission to delete $this->objName_");
            }
            break;
          default:
            //shouldn't see this case
            $jd->set("error", "Incorrect verb");
        }
        
      }
    } else {
      $jd = $this->processOtherVerbs($dh);
    }

    return $jd;
    
  }
  
  /*
    Returns an instance of the object that manager is managing
  */
  abstract protected function createObjectFromRequest($dh);
  abstract protected function createObjectFromRow($row);
  /*
    returns info that is unique to this manager for finding
  */
  abstract protected function findHelper($dh);
  
  /*
    Most managers are managing only for get/update/add/delete.  If one of those
    is not encountered, this function will be called
  */
  protected function processOtherVerbs ($dh) {
    //by default, return error
    $jd = new JsonData();
    $jd->set("error", "Invalid verb given");
    return $jd;
  }
  
  /*
    returns a new user if values for one were saved.
    returns null otherwise
  */
  protected function getLoggedInUser() {
    $user = null;
    if (isset($_SESSION[Constants::USER_SESSION_VAR])) {
      $user = new User();
      $user->setAttributes($_SESSION[Constants::USER_SESSION_VAR]);
    }
    
    
    // temp just to test
    $user = new User();
    $user->setAttributes(array("privileges" => "10"));
          

    
    
    return $user;
  }

  
  /* 
    Returns jsondata object containing zero or more objects
  */
  protected function find($dh){    
    $jd = new JsonData();
    
    $info = $this->findHelper($dh);
    
    $r = $dh->executeQuery($info["sql"]);
    if ($r["error"]) {
      $jd->set("error", $r["error"]);
    } else {
    
      $objects = array();
      while ($curRow = $r["result"]->fetch_assoc()) {
        $obj = $this->createObjectFromRow($curRow);
        $objects[] = $obj;            
      }
      
      //now get out the attributes for json return.  This extra step of
      //creating the object by giving it attributes and then calling getAttributes
      //seems redundant but allows the object to control just which 
      //attributes get make public (along with their names, etc)
      $output = array();
      foreach($objects as $obj) {
        $output[] = $obj->getAttributes();
      }
      
      $jd->set($info["jsonName"], $output);
      
    }
    
    return $jd;
  }
  
  
} //end Manager class

?>