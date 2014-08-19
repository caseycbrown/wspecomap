<?php

include_once "./php/utility.php";
include_once "./php/manager.php";

/**
  Simple object that handles database actions for a tree
 */
class TreeManager extends Manager{

  public function __construct() {
    $this->updatePriv_ = UserPrivilege::UPDATE_TREE;
    $this->addPriv_ = UserPrivilege::ADD_TREE;
    $this->deletePriv_ = UserPrivilege::DELETE_TREE;
    $this->objName_ = "tree";
  
  }
  
 
  /*
    Returns a tree that has been created from request
  */
  protected function createObjectFromRequest($dh) {
    $attr = array();
    $attr["id"] = $dh->getParameter("treeid");
    $attr["taxon_id"] = $dh->getParameter("taxonid");
    $attr["dbh"] = $dh->getParameter("dbh");
    $attr["lat"] = $dh->getParameter("lat");
    $attr["lng"] = $dh->getParameter("lng");
    
    return new Tree($attr);
  }
  
  /*
    Returns a tree that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new Tree($row);
  }

  
  
  /* 
    Returns jsondata object containing zero or more trees
  */
  protected function findHelper($dh){    
    $info = array("jsonName" => "trees");

    //there are a number of optional parameters to pass which must be the
    //string 'null' if they are not given in url
    $id = $dh->getParameter("treeid", true);
    $taxonId = $dh->getParameter("taxonid", true);
    $dbhmin = $dh->getParameter("dbhmin", true);
    $dbhmax = $dh->getParameter("dbhmax", true);
    $north = $dh->getParameter("north", true);
    $south = $dh->getParameter("south", true);
    $east = $dh->getParameter("east", true);
    $west = $dh->getParameter("west", true);
    
    //TODO: could check that they are proper numbers
    
    $s = "call get_tree($id, $taxonId, $dbhmin, $dbhmax, " . 
      "$north, $south, $east, $west)";

    $info["sql"] = $s;
    return $info;
      
  }
  
} //end TreeManager class


/**
   relatively simple object that represents a tree
 */
class Tree {

  //following are attributes
  private $id_;
  private $taxonId_;
  private $dbh_;
  private $lat_;
  private $lng_;
  
  public function __construct($attrs) {
    
    //set default values
    $this->id_ = null;
    $this->taxonId_ = null;
    $this->dbh_ = null;
    $this->lat_ = null;
    $this->lng_ = null;
    
    $this->setAttributes($attrs);
  }

  /* 
    Adds a tree to database and returns jsondata object
  */
  public function add($dh){    
    $jd = new JsonData();
  
    //need to replace any null values with word 'null'
    $dbh = ($this->dbh_ === null) ? "null" : "'$this->dbh_'";
    
    $s = "call add_tree($this->taxonId_, $dbh, $this->lat_, $this->lng_)";
    
    $r = $dh->executeQuery($s);
    
    if ($r["error"]) {
      $jd->set("error", "Error attempting to add tree" . "..." . $r["error"]);
    } else { 
      //want to grab returned id
      $curRow = $r["result"]->fetch_assoc(); //should only be one row
      $this->id_ = (int) $curRow["tree_id"];
      
      $jd->set("tree", $this->getAttributes());
    }
    
    return $jd;
  }  
  
  /*
    updates self in database
  */
  public function update($dh) {
    $jd = new JsonData();
    
    //need to replace any null values with word 'null'
    $id = ($this->id_ === null) ? "null" : $this->id_;
    $tid = ($this->taxonId_ === null) ? "null" : $this->taxonId_;
    $dbh = ($this->dbh_ === null) ? "null" : $this->dbh_;
    $lat = ($this->lat_ === null) ? "null" : $this->lat_;
    $lng = ($this->lng_ === null) ? "null" : $this->lng_;
    
    $s = "call update_tree($id, $tid, $dbh, $lat, $lng)";
    $r = $dh->executeQuery($s);
    
    if ($r["error"]) {
      $jd->set("error", "Error attempting to update tree" . "..." . $r["error"]);
    } else {      
      $jd->set("tree", $this->getAttributes());
    }
    
    return $jd;
  }
 

  /* 
    Deletes a tree from database and returns jsondata object
  */
  public function delete($dh){    
    $jd = new JsonData();
    
    $s = "call delete_tree($this->id_)";
    $r = $dh->executeQuery($s);
    
    if ($r["error"]) {
      $jd->set("error", "Error attempting to delete tree" . "..." . $r["error"]);
    }//else just return empty json data
    
    return $jd;
  }
    
  
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "tree_id":
        case "id":
          if (is_numeric($val)) { //don't want to cast null to int
            $this->id_ = (int) $val;
          }
          break;        
        case "taxon_id":
          if (is_numeric($val)) {
            $this->taxonId_ = (int) $val;
          }
          break;        
        case "dbh":
          if (is_numeric($val)) {
            $this->dbh_ = (int) $val;
          }
          break;        
        case "lat":
          if (is_numeric($val)) {
            $this->lat_ = (float) $val;
          }
          break;        
        case "lng":
          if (is_numeric($val)) {
            $this->lng_ = (float) $val;
          }
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
    $attr["taxonId"] = $this->taxonId_;
    $attr["dbh"] = $this->dbh_;
    $attr["lat"] = $this->lat_;
    $attr["lng"] = $this->lng_;
    
    return $attr;
  }

  
} //end Tree class



?>