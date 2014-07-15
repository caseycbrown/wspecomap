<?php

include_once "./config/config.php"; //db access info.  path is relative to root
include_once "./php/utility.php";

/**
  Simple object that handles database actions for a tree
 */
class TreeManager {
  
  private $dbh_;
  private $urlHelper_;  
  
  public function __construct($dbh, $urlHelper) {
    $this->dbh_ = $dbh;
    $this->urlHelper_ = $urlHelper;
  }
  
  public function __destruct() {
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
    Returns jsondata object containing zero or more trees
  */
  public function get(){    
    $jd = new JsonData();
    $trees = array();
    
    //there are a number of optional parameters to pass which must be the
    //string 'null' if they are not given in url
    $id = $this->urlHelper_->getParameter("id", true);
    $taxonId = $this->urlHelper_->getParameter("taxonid", true);
    $dbhmin = $this->urlHelper_->getParameter("dbhmin", true);
    $dbhmax = $this->urlHelper_->getParameter("dbhmax", true);
    $north = $this->urlHelper_->getParameter("north", true);
    $south = $this->urlHelper_->getParameter("south", true);
    $east = $this->urlHelper_->getParameter("east", true);
    $west = $this->urlHelper_->getParameter("west", true);
    
    //TODO: could check that they are proper numbers
    
    $s = "call get_tree($id, $taxonId, $dbhmin, $dbhmax, " . 
      "$north, $south, $east, $west)";
    
    $r = $this->dbh_->executeQuery($s);
    if ($r["error"]) {
      $jd->set("error", $r["error"]);
    } else {
    
      while ($curRow = $r["result"]->fetch_assoc()) {
        $tree = new Tree($this->dbh_, $curRow);
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
  /* 
    Updates a tree in database and returns jsondata object
  */
  public function update(){    
    $jd = new JsonData();
    $jd->set("error", "Update tree functionality not yet implemented");
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
  
    
} //end TreeManager class


/**
   relatively simple object that represents a tree
 */
class Tree {

  private $dbHelper_;

  //following are attributes
  private $id_;
  private $taxonId_;
  private $dbh_;
  private $lat_;
  private $lng_;
  
  public function __construct($dbh, $attrs) {
    $this->dbHelper_ = $dbh;
    
    //set default values
    $this->id_ = null;
    $this->taxonId_ = null;
    $this->dbh_ = null;
    $this->lat_ = null;
    $this->lng_ = null;
    
    $this->setAttributes($attrs);
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