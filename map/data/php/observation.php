<?php

include_once "./php/utility.php";
include_once "./php/manager.php";

/**
  Simple object that handles database actions for an observation
 */
class ObservationManager extends Manager{

  public function __construct() {
    $this->updatePriv_ = UserPrivilege::MODIFY_OBSERVATION;
    $this->addPriv_ = UserPrivilege::ADD_OBSERVATION;
    $this->deletePriv_ = UserPrivilege::MODIFY_OBSERVATION;
    $this->objName_ = "observation";
  
  }
   
   /*add needs to include user*/
  protected function add($dh, $obj, $user) {
    $jd = new JsonData();    
    if ($user->hasPrivilege($this->addPriv_)) {
      $jd = $obj->add($dh, $user);
    } else {
      $jd->set("error", "User does not have permission to add $this->objName_");
    }
    return $jd;
  }

  /*for update and delete, check if user has privilege update anyone's observations
  or if this observation belongs to user (even if user doesn't have that privilege)
  */
  protected function update($dh, $obj, $user) {
    $jd = new JsonData();
    $canProceed = $user->hasPrivilege($this->updatePriv_);
    if (!$canProceed) {
      $obs = $this->getObservationFromDb($dh, $obj->getAttributes()["id"]);
      $canProceed = ($obs->getAttributes()["userId"] === $user->getAttributes()["id"]);
    }
    
    if ($canProceed) {
      $jd = $obj->update($dh);
    } else {
      $jd->set("error", "User does not have permission to update $this->objName_");
    }
    return $jd;
  }
  
  protected function delete($dh, $obj, $user) {
    $jd = new JsonData();    
    $canProceed = $user->hasPrivilege($this->updatePriv_);
    if (!$canProceed) {
      $obs = $this->getObservationFromDb($dh, $obj->getAttributes()["id"]);
      $canProceed = ($obs->getAttributes()["userId"] === $user->getAttributes()["id"]);
    }
    
    if ($canProceed) {
      $jd = $obj->delete($dh);
    } else {
      $jd->set("error", "User does not have permission to delete $this->objName_");
    }
    return $jd;
  }

  /*returns observation with given id*/
  private function getObservationFromDb($dh, $obsId) {
    $s = "call get_observation($obsId, null, null, null, null)";
    $test = $this->find($dh, array("sql" => $s, "jsonName" => "observation"));
    return new Observation($test->get("observation")[0]);  
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
  private $userId_;
  private $username_;
  
  public function __construct($attrs) {
    
    //set default values
    $this->id_ = null;
    $this->treeId_ = null;
    $this->comments_ = null;
    $this->dateCreated_ = null;
    $this->dateCreatedString_ = null;
    $this->userId_ = null;
    $this->username_ = null; //stored in addition to userid for display convenience
    
    date_default_timezone_set("America/New_York");
    $this->setAttributes($attrs);
  }

  /* 
    Adds a tree to database and returns jsondata object
  */
  public function add($dh, $user){    
    $jd = new JsonData();
    
    //need to replace any null values with word 'null'
    if ($this->treeId_ === null) {
      $jd->set("error", "Observation is not associated with tree and cannot be added");
    } else {
    
      $comments = ($this->comments_ === null) ? "null" : "'$this->comments_'";
      //$userId = ($this->userId_ === null) ? "null" : "'$this->userId_'";
      $userId = $user->getAttributes()["id"];
      $userId = ($userId === null) ? "null" : $userId;
      
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
        $this->setAttributes(array("user_id" => $user->getAttributes()["id"]));
        $this->setAttributes(array("username" => $user->getAttributes()["displayName"]));
        
        
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

    $comments = ($this->comments_ === null) ? "null" : "'$this->comments_'";
    $s = "call update_observation($this->id_, $comments)";
    $r = $dh->executeQuery($s);
    if ($r["error"]) {
      $jd->set("error", "Error attempting to update observation" . "..." . $r["error"]);
    } else {     
      $jd->set("observation", $this->getAttributes());
    }
    
    return $jd;
  }
 

  /* 
    Deletes from database and returns jsondata object
  */
  public function delete($dh){    
    $jd = new JsonData();
    
    $s = "call delete_observation($this->id_, null, null)";
    $r = $dh->executeQuery($s);
    
    if ($r["error"]) {
      $jd->set("error", "Error attempting to delete observation" . "..." . $r["error"]);
    }//else just return empty json data
    
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
        case "treeId":
          if (is_numeric($val)) {
            $this->treeId_ = (int) $val;
          }
          break;        
        case "user_id":
        case "userId":
          if (is_numeric($val)) {
            $this->userId_ = (int) $val;
          }
          break;        
        case "comments":
          $this->comments_ = $val;
          break;        
        case "username":
          $this->username_ = $val;
          break;        
        case "date_created":
        case "dateCreated":
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
    $attr["username"] = $this->username_;
    
    return $attr;
  }

  
} //end Observation class



?>