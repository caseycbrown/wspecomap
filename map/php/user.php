<?php

include_once "./config/config.php"; //db access info.  path is relative to root
include_once "./php/utility.php";

/**
  Simple object that handles database actions for a user
 */
class User {
  
  private $dbHelper_;
  private $urlHelper_;  
  
  public function __construct($dbh, $urlHelper) {
    $this->dbHelper_ = $dbh;
    $this->urlHelper_ = $urlHelper;
  }
  
  public function __destruct() {
  }
    
  /* 
    Adds a user to database and returns jsondata object
  */
  public function add(){    
    $jd = new JsonData();
    $jd->set("error", "Add user functionality not yet implemented");
    return $jd;
  }
  /* 
    Gets user from database and returns jsondata object
  */
  public function get(){    
    $jd = new JsonData();
    $jd->set("error", "Get user functionality not yet implemented");
    return $jd;
  }
  /* 
    Updates a user in database and returns jsondata object
  */
  public function update(){    
    $jd = new JsonData();
    $jd->set("error", "Update user functionality not yet implemented");
    return $jd;
  }
  /* 
    Deletes a user from database and returns jsondata object
  */
  public function delete(){    
    $jd = new JsonData();
    $jd->set("error", "Delete user functionality not yet implemented");
    return $jd;
  }
  
    
} //end User class

?>