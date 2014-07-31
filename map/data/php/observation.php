<?php

include_once "./php/utility.php";
include_once "./php/manager.php";

/**
  Simple object that handles database actions for an observation
 */
class ObservationManager extends Manager{

  public function __construct() {
    $this->updatePriv_ = UserPrivilege::UPDATE_OBSERVATION;
    $this->addPriv_ = UserPrivilege::ADD_OBSERVATION;
    $this->deletePriv_ = UserPrivilege::DELETE_OBSERVATION;
    $this->objName_ = "observation";
  
  }
  
 
  /*
    Returns an observation that has been created from request
  */
  protected function createObjectFromRequest($dh) {
    $attr = array();
    $attr["id"] = $dh->getParameter("observationid");
    $attr["tree_id"] = $dh->getParameter("treeid");
    $attr["comments"] = $dh->getParameter("comments");
    $attr["date_created"] = $dh->getParameter("date");
    $attr["user_id"] = $dh->getParameter("userid");
    
    return new Observation($attr);
  }
  
  /*
    Returns an Observation that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new Observation($row);
  }

  
  
  /* 
    Returns jsondata object containing zero or more observations
  */
  protected function findHelper($dh){    
    $info = array("jsonName" => "observations");

    //there are a number of optional parameters to pass which must be the
    //string 'null' if they are not given in url
    $id = $dh->getParameter("observationid", true);
    $treeId = $dh->getParameter("treeid", true);
    $userId = $dh->getParameter("userid", true);
    $startDate = $dh->getParameter("start", true);
    $endDate = $dh->getParameter("end", true);
    
    date_default_timezone_set("America/New_York");
    if ($startDate !== "null") {
      $startDate = new DateTime($startDate);
      $startDate->setTime(0,0,0);
      $startDate = "'" . $startDate->format('Y-m-d H:i:s') . "'";
    }
    if ($endDate !== "null") {
      $endDate = new DateTime($endDate);
      $endDate->setTime(0,0,0);
      $endDate = "'" . $endDate->format('Y-m-d H:i:s') . "'";
    }
    
    
    $s = "call get_observation($id, $treeId, $userId, $startDate, $endDate)";

    $info["sql"] = $s;
    return $info;
      
  }
  
} //end ObservationManager class


/**
   relatively simple object that represents an Observation
 */
class Observation {

  //following are attributes
  private $id_;
  private $treeId_;
  private $comments_;
  private $dateCreated_;
  private $dateCreatedString_;
  private $userId;
  
  public function __construct($attrs) {
    
    //set default values
    $this->id_ = null;
    $this->treeId_ = null;
    $this->comments_ = null;
    $this->dateCreated_ = null;
    $this->dateCreatedString_ = null;
    $this->userId_ = null;
    
    date_default_timezone_set("America/New_York");
    $this->setAttributes($attrs);
  }

  /* 
    Adds a tree to database and returns jsondata object
  */
  public function add($dh){    
    $jd = new JsonData();
    
    //need to replace any null values with word 'null'
    if ($this->treeId_ === null) {
      $jd->set("error", "Observation is not associated with tree and cannot be added");
    } else {
    
      $comments = ($this->comments_ === null) ? "null" : "'$this->comments_'";
      $userId = ($this->userId_ === null) ? "null" : "'$this->userId_'";
      
      $s = "call add_observation($this->treeId_, $userId, $comments)";
      
      $r = $dh->executeQuery($s);
      
      if ($r["error"]) {
        $jd->set("error", "Error attempting to add observation" . "..." . $r["error"]);
      } else { 
        //want to grab returned id
        $curRow = $r["result"]->fetch_assoc(); //should only be one row
        $this->id_ = (int) $curRow["observation_id"];
        
        //need to set date created.  could go back to database to get it, or
        //just define it right now.  It won't be exact same as database, but
        //it will be close enough...any subsequent find calls will use db value
        $this->setAttributes(array("date_created" => date("Y-m-d")));
        
        
        $jd->set("observation", $this->getAttributes());
      }

    }
    return $jd;
  }  
  
  /*
    updates self in database
  */
  public function update($dh) {
    $jd = new JsonData();
    $jd->set("error", "Update observation functionality not yet implemented");
    
    return $jd;
  }
 

  /* 
    Deletes from database and returns jsondata object
  */
  public function delete(){    
    $jd = new JsonData();
    $jd->set("error", "Delete observation functionality not yet implemented");
    return $jd;
  }
    
  
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "observation_id":
        case "id":
          if (is_numeric($val)) { //don't want to cast null to int
            $this->id_ = (int) $val;
          }
          break;        
        case "tree_id":
          if (is_numeric($val)) {
            $this->treeId_ = (int) $val;
          }
          break;        
        case "user_id":
          if (is_numeric($val)) {
            $this->userId_ = (int) $val;
          }
          break;        
        case "comments":
          $this->comments_ = $val;
          break;        
        case "date_created":
          if ($val) {            
            $this->dateCreated_ = new DateTime($val);
            $this->dateCreatedString_ = $this->dateCreated_->format("Y-m-d");
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
    $attr["treeId"] = $this->treeId_;
    $attr["comments"] = $this->comments_;
    $attr["dateCreated"] = $this->dateCreatedString_;
    $attr["userId"] = $this->userId_;
    
    return $attr;
  }

  
} //end Observation class



?>