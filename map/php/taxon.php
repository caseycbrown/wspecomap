<?php

include_once "./config/config.php"; //db access info.  path is relative to root
include_once "./php/utility.php";

/**
  Simple object that handles database actions for a taxon
 */
class Taxon {
  
  private $dbHelper_;
  private $urlHelper_;  
  
  public function __construct($dbh, $urlHelper) {
    $this->dbHelper_ = $dbh;
    $this->urlHelper_ = $urlHelper;
  }
  
  public function __destruct() {
  }
    
  /* 
    Adds a taxon to database and returns jsondata object
  */
  public function add(){    
    $jd = new JsonData();
    $jd->set("error", "Add taxon functionality not yet implemented");
    return $jd;
  }
  /* 
    Gets taxon(s) from database and returns jsondata object
  */
  public function get(){    
    $jd = new JsonData();
    $jd->set("error", "Get taxon functionality not yet implemented");
    return $jd;
  }
  /* 
    Updates a taxon in database and returns jsondata object
  */
  public function update(){    
    $jd = new JsonData();
    $jd->set("error", "Update taxon functionality not yet implemented");
    return $jd;
  }
  /* 
    Deletes a taxon from database and returns jsondata object
  */
  public function delete(){    
    $jd = new JsonData();
    $jd->set("error", "Delete taxon functionality not yet implemented");
    return $jd;
  }
  
    
} //end Taxon class

?>