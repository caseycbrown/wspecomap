<?php

include_once "./php/utility.php";
include_once "./php/manager.php";

/**
  Simple object that handles database actions for a privilege
 */
class PrivilegeManager extends Manager{
  
  public function __construct() {
    $this->updatePriv_ = -1;
    $this->addPriv_ = -1;
    $this->deletePriv_ = -1;
    $this->objName_ = "privilege";
  }

  /*
    Returns a privilege that has been created from request
  */
  protected function createObjectFromRequest($dh) {
    $attr = array();
    $attr["code"] = $dh->getParameter("privilegecode");
    $attr["name"] = $dh->getParameter("name");
    $attr["description"] = $dh->getParameter("description");
    
    return new Privilege($attr);
  }

  /*
    Returns a privilege that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new Privilege($row);
  }
  
  /*do not support adding, updating, or deleting privileges*/
  protected function add($dh, $obj, $user) {
    $jd = new JsonData();    
    $jd->set("error", "Cannot add privilege");
    return $jd;
  }
  protected function update($dh, $obj, $user) {
    $jd = new JsonData();    
    $jd->set("error", "Cannot update privilege");
    return $jd;
  }
  protected function delete($dh, $obj, $user) {
    $jd = new JsonData();    
    $jd->set("error", "Cannot delete privilege");
    return $jd;
  }
  
  
  /* 
    Gets privilege(s) from database and returns jsondata object
  */
  protected function findHelper($dh) {    
    $info = array("jsonName" => "privileges");
    
    //if code has been given, use it.  otherwise, null
    $code = $dh->getParameter("privilegecode", true);    
    
    $s = "call get_privilege($code)";    
    $info["sql"] = $s;
    return $info;    
  }
  
    
} //end PrivilegeManager class


/**
   simple object that represents a privilege
 */
class Privilege {

  //now the attributes
  private $code_;
  private $name_;
  private $description_;
  
  public function __construct($attrs) {
    //set default values
    $this->code_ = null;
    $this->name_ = null;
    $this->description_ = null;
    
    $this->setAttributes($attrs);
  }

  /* 
    Adds to database and returns jsondata object
  */
  public function add($dh){    
    $jd = new JsonData();
    $jd->set("error", "Adding privilege functionality is not implemented");
    return $jd;
  }

  /* 
    Updates in database and returns jsondata object
  */
  public function update(){    
    $jd = new JsonData();
    $jd->set("error", "Update privilege functionality not implemented");
    return $jd;
  }
  /* 
    Deletes from database and returns jsondata object
  */
  public function delete(){    
    $jd = new JsonData();
    $jd->set("error", "Delete privilege functionality not implemented");
    return $jd;
  }

  
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "privilege_code":
        case "code":
          if (is_numeric($val)) { //don't want to cast null to int
            $this->code_ = (int) $val;
          }
          break;        
        case "name":
            $this->name_ = $val;
          break;        
        case "description":
            $this->description_ = $val;
          break;        
        default:
          //ignore any others
      }
    }
        
  }
  
  /*returns an array with public attributes*/
  public function getAttributes() {
    $attr = array();
    
    $attr["code"] = $this->code_;
    $attr["name"] = $this->name_;
    $attr["description"] = $this->description_;
    
    return $attr;
  }
  
} //end Privilege class



?>