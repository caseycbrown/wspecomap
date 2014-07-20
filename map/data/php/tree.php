<?php

include_once "./php/utility.php";

/**
  Simple object that handles database actions for a tree
 */
class TreeManager {

  //at the moment, nothing interesting in constructor/destructor
  
  /*
    Determines what to do based on request parameters
  */
  public function processRequest($dh) {
    $tree = $this->createTreeFromRequest($dh);
    $jd = new JsonData();
    switch ($dh->getParameter("verb")) {
      case "get":
        $jd = $this->find($dh);
        break;
      case "update":
        $jd = $tree->update($dh);
        break;
      case "add":
        $jd = $tree->add();
        break;
      case "delete":
        $jd = $tree->delete();
        break;
      default:
        $jd->set("error", "Invalid verb given");
    }

    return $jd;
    
  }
  
  /*
    Returns a tree that has been created from request
  */
  private function createTreeFromRequest($dh) {
    $attr = array();
    $attr["id"] = $dh->getParameter("treeid");
    $attr["taxon_id"] = $dh->getParameter("taxonid");
    $attr["dbh"] = $dh->getParameter("dbh");
    $attr["lat"] = $dh->getParameter("lat");
    $attr["lng"] = $dh->getParameter("lng");
    
    return new Tree($attr);
  }
  
  
  /* 
    Returns jsondata object containing zero or more trees
  */
  private function find($dh){    
    $jd = new JsonData();
    $trees = array();
    
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
    
    $r = $dh->executeQuery($s);
    if ($r["error"]) {
      $jd->set("error", $r["error"]);
    } else {
    
      while ($curRow = $r["result"]->fetch_assoc()) {
        $tree = new Tree($curRow);
        $trees[] = $tree;            
      }
      
      //now get out the attributes for json return.  This extra step of
      //creating the tree by giving it attributes and then calling getAttributes
      //seems redundant but allows the Tree object to control just which 
      //attributes get make public (along with their names, etc)
      $output = array();
      foreach($trees as $tree) {
        $output[] = $tree->getAttributes();
      }
      
      $jd->set("trees", $output);
      
    }
    
    return $jd;
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
  public function add(){    
    $jd = new JsonData();
    $jd->set("error", "Add tree functionality not yet implemented");
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
  public function delete(){    
    $jd = new JsonData();
    $jd->set("error", "Delete tree functionality not yet implemented");
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