<?php

include_once "./php/utility.php";
include_once "./php/manager.php";

/**
  Simple object that handles database actions for a layer
 */
class LayerManager extends Manager{
  
  public function __construct() {
    $this->updatePriv_ = UserPrivilege::UPDATE_LAYER;
    $this->addPriv_ = UserPrivilege::ADD_LAYER;
    $this->deletePriv_ = UserPrivilege::DELETE_LAYER;
    $this->objName_ = "layer";
  }

  /*
    Returns a layer that has been created from request
  */
  protected function createObjectFromRequest($dh) {
    $attr = array();
    $attr["id"] = $dh->getParameter("layerid");
    $attr["name"] = $dh->getParameter("name");
    $attr["description"] = $dh->getParameter("description");
    
    return new Layer($attr);
  }

  /*
    Returns a layer that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new Layer($row);
  }
  
  /* 
    Gets layer(s) from database and returns jsondata object
  */
  protected function findHelper($dh) {    
    $info = array("jsonName" => "layers");
    
    //there are a number of optional parameters to pass which must be the
    //string 'null' if they are not given in url
    $id = $dh->getParameter("id", true);    
    $s = "call get_layer($id)";    
    $info["sql"] = $s;
    return $info;    
  }
  
    
} //end LayerManager class


/**
   simple object that represents a layer
 */
class Layer {

  //now the attributes
  private $id_;
  private $name_;
  private $description_;
  
  public function __construct($attrs) {
    //set default values
    $this->id_ = null;
    $this->name_ = null;
    $this->description_ = null;
    
    $this->setAttributes($attrs);
  }

  /* 
    Adds a layer to database and returns jsondata object
  */
  public function add($dh){    
    $jd = new JsonData();
    $jd->set("error", "Adding layer functionality is not yet implemented");
    return $jd;
  }

  /* 
    Updates a layer in database and returns jsondata object
  */
  public function update(){    
    $jd = new JsonData();
    $jd->set("error", "Update layer functionality not yet implemented");
    return $jd;
  }
  /* 
    Deletes a layer from database and returns jsondata object
  */
  public function delete(){    
    $jd = new JsonData();
    $jd->set("error", "Delete layer functionality not yet implemented");
    return $jd;
  }

  
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "layer_id":
        case "id":
          if (is_numeric($val)) { //don't want to cast null to int
            $this->id_ = (int) $val;
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
    
    $attr["id"] = $this->id_;
    $attr["name"] = $this->name_;
    $attr["description"] = $this->description_;
    
    return $attr;
  }
  
} //end Layer class



?>