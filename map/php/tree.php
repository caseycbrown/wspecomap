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
    $jd->set("error", "Get tree functionality not yet implemented");
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