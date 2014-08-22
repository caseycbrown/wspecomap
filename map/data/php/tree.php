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
    $attr["layers"] = $dh->getParameter("layers");
    
    return new Tree($attr);
  }
  
  /*
    Returns a tree that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new Tree($row);
  }

  /* 
    Need to override generic version of this function because format of data
    coming back for trees is a little different.  There can be multiple rows
    for each tree, where each row differs only by layer id.  This describes
    the different layers a tree has, and the looping through of the results
    therefore differs for trees
  */
  protected function find($dh, $info){    
    $jd = new JsonData();
        
    $r = $dh->executeQuery($info["sql"]);
    if ($r["error"]) {
      $jd->set("error", $r["error"]);
    } else {
    
      $objects = array();
      $curId = null;
      $prevId = null;
      $layers = array();
      $tree = null;
      while ($curRow = $r["result"]->fetch_assoc()) {
        $curId = $curRow["tree_id"];
        if ($curId !== $prevId) {
          //we have come to a new tree.  first set the previous tree's layer
          //attribute, then create a new tree
          if ($tree) {
            $tree->setAttributes(array("layers" => $layers));
          }
          
          $tree = $this->createObjectFromRow($curRow);
          $objects[] = $tree;
          $layers = array();
          $prevId = $curId;
          
        }
        
        //in any case, add layer to layers array
        if ($curRow["layer_id"] !== null) {
          $layers[] = (int) $curRow["layer_id"];
        }
        
      }
      //after the while loop, the last remaining tree needs its layers set
      if ($tree) {
        $tree->setAttributes(array("layers" => $layers));
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
    
    $s = "call get_tree($id, $taxonId, null, $dbhmin, $dbhmax, " . 
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
  private $layers_;
  
  public function __construct($attrs) {
    
    //set default values
    $this->id_ = null;
    $this->taxonId_ = null;
    $this->dbh_ = null;
    $this->lat_ = null;
    $this->lng_ = null;
    $this->layers_ = array();
    
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
      
      $jd = $this->updateLayers($dh);
      if (!$jd->get("error")) {
        $jd->set("tree", $this->getAttributes());
      }
    }
    
    return $jd;
  }  
  
  /*a helper function that updates layers*/
  private function updateLayers($dh) {
    $jd = new JsonData();
  
    //easiest thing to do is just delete all and then add back in the ones in
    //layers array.
    $s = "call delete_tree_layer($this->id_, null)";    
    $r = $dh->executeQuery($s);
    
    if ($r["error"]) {
      $jd->set("error", "Error attempting to delete tree layers" . "..." . $r["error"]);
    } else { 
      foreach($this->layers_ as $layerId){
        $s = "call add_tree_layer($this->id_, $layerId)";
        $r = $dh->executeQuery($s);
        
        if ($r["error"]) {
          $jd->set("error", "Error adding tree layer" . "..." . $r["error"]);
        }
        
      }
    
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
    
      $jd = $this->updateLayers($dh);
      if (!$jd->get("error")) {
        $jd->set("tree", $this->getAttributes());
      }
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
        case "layers":
          //might be a string of comma-separated numbers, or an array
          if (is_array($val)) {
            $this->layers_ = $val;
          } else {
            //clear array first
            unset($this->layers_);
            $this->layers_ = array();
            $tmp = explode(",", $val);
            foreach($tmp as $v){
              if (is_numeric($v)) {
                $this->layers_[] = (int) $v;
              }
            }
          
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
    $attr["layers"] = $this->layers_;
    
    return $attr;
  }

  
} //end Tree class



?>