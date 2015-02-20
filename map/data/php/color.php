<?php

include_once "./php/utility.php";
include_once "./php/manager.php";

/**
  Simple object that handles database actions for a color
 */
class ColorManager extends Manager{
  
  public function __construct() {
    $this->updatePriv_ = -1; //UserPrivilege::UPDATE_COLOR;
    $this->addPriv_ = -1; //UserPrivilege::ADD_COLOR;
    $this->deletePriv_ = -1; // UserPrivilege::DELETE_COLOR;
    $this->objName_ = "color";
  }

  /*
    Returns a color that has been created from request
  */
  protected function createObjectFromRequest($dh) {
    $attr = array();
    $attr["id"] = $dh->getParameter("colorid");
    $attr["hex_value"] = $dh->getParameter("hexvalue");
    $attr["description"] = $dh->getParameter("description");
    
    return new Color($attr);
  }

  /*
    Returns a color that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new Color($row);
  }
  
  /* 
    Gets color(s) from database and returns jsondata object
  */
  protected function findHelper($dh) {    
    $info = array("jsonName" => "colors");
    
    //there are a number of optional parameters to pass which must be the
    //string 'null' if they are not given in url
    $id = $dh->getParameter("id", true);    
    $s = "call get_color($id)";    
    $info["sql"] = $s;
    return $info;    
  }
  
    
} //end ColorManager class


/**
   simple object that represents a color
 */
class Color {

  //now the attributes
  private $id_;
  private $hexValue_;
  private $description_;
  
  public function __construct($attrs) {
    //set default values
    $this->id_ = null;
    $this->hexValue_ = null;
    $this->description_ = null;
    
    $this->setAttributes($attrs);
  }

  /* 
    Adds a color to database and returns jsondata object
  */
  public function add($dh){    
    $jd = new JsonData();
    $jd->set("error", "Adding color functionality is not yet implemented");
    return $jd;
  }

  /* 
    Updates a color in database and returns jsondata object
  */
  public function update(){    
    $jd = new JsonData();
    $jd->set("error", "Update color functionality not yet implemented");
    return $jd;
  }
  /* 
    Deletes a color from database and returns jsondata object
  */
  public function delete(){    
    $jd = new JsonData();
    $jd->set("error", "Delete color functionality not yet implemented");
    return $jd;
  }

  
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "color_id":
        case "id":
          if (is_numeric($val)) { //don't want to cast null to int
            $this->id_ = (int) $val;
          }
          break;        
        case "hex_value":
            $this->hexValue_ = $val;
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
    
    $attr["id"] = $this->id_;
    $attr["hexValue"] = $this->hexValue_;
    $attr["description"] = $this->description_;
    
    return $attr;
  }
  
} //end Color class



?>