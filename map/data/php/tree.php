<?php

include_once "./config/config.php"; //db access info.  path is relative to root
include_once "./php/utility.php";

/**
  Simple object that handles database actions for a tree
 */
class Tree {
  
  private $dbHelper_;
  private $urlHelper_;  
  
  public function __construct($dbh, $urlHelper) {
    $this->dbHelper_ = $dbh;
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
    Gets tree(s) from database and returns jsondata object
  */
  public function get(){    
    $jd = new JsonData();
    
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
    
    $r = $this->dbHelper_->executeQuery($s);
    if ($r["error"]) {
      $jd->set("error", $r["error"]);
    } else {
    
      
    
      while ($curRow = $r["result"]->fetch_assoc()) {
        $obs = new PhenoObservation($this->dbh_);
        $obs->setAttributes($curRow);
        $obs->loadPhenoCodes();
        $phenos[] = $obs;            
      }
      
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
  
    
} //end Tree class

?>