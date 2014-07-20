<?php

include_once "./config/config.php"; //db access info.  path is relative to root


/**
   object that represents the return information to user
 */
class JsonData {

  private $data_;
  
  public function __construct() {
    
    $this->data_ = array();
    
  }
  
  public function __destruct() {
  }

  //used for json
  public function set($key, $val) {
    $this->data_[$key] = $val;
  }

  public function get($key) {
    $val = null;
    if (isset($this->data_[$key])) {
      $val = $this->data_[$key];
    }
    return $val;
  }
  
  /*Sets headers, content type, and echos data*/
  public function echoSelf() {
      
    if ($this->get("error") !== null) {
      header("HTTP/1.1 500 " . "Unable to complete request");
    }
        
    header("Content-type: application/json"); 
    echo json_encode($this->data_);

  }
    
    
} //end JsonData class


/**
  DataHelper handles interactions with database - just provides some
  simple functionality so that rest of code doesn't need to worry about it
  
  Also can read URL get request data, which is a little bit of a stretch to have
  included in this class...but because escaping strings requires a db connection
  I'm including it here
 */
class DataHelper {
  
  private $connection_;
  private $dbc_;
  private $parameters_;
  
  public function __construct() {
    $this->dbc_ = new Config();
    
    $this->parameters_ = array_merge($_GET, $_POST, $_FILES);
    
    $ci = $this->dbc_->defaultConnection;

    $this->connection_ = new mysqli($ci["host"], $ci["username"],
      $ci["password"], $ci["database"]);
      
    if ($this->connection_->connect_errno) {
      $msg = "Error connecting to database";
      if ($this->dbc_->defaultConnection["displayErrorMessages"]) {          
        $msg = $this->connection_->connect_error;
      }
      throw new Exception($msg);
    } 
  }
  
  public function __destruct() {  
    //close connection to database, if it is open
    if ($this->connection_) {    
      $this->connection_->close();
    }  
  }
        

  /*escapes sql characters in a string*/
  public function escapeString($s){
    return $this->connection_->escape_string($s);
  }
  
  
  /*This function executes the given query.
    Makes no attempt to examine query for issues like sql injection.
    
    query: the statement to execute.
    
    returns an array with two parts; an error message and a result.
    error: will be non-null if there was an error
    result: for select queries will be the mysqli_result object, for others
      will be true or false
  
  returns an array with */
  public function executeQuery($query) {
    $toReturn = array("error" => null, "result" => null);
    
    while ($this->connection_->more_results()) {
      //clear the deck for successive stored procedures
      $this->getNextResult();
    }
      
    $toReturn["result"] = $this->connection_->query($query);

    //check if we had an error.  depending on config, either display it
    //or a generic message.
    if (!$toReturn["result"]) {
      if ($this->dbc_->defaultConnection["displayErrorMessages"]) {          
        $toReturn["error"] = $this->connection_->error;
      } else {
        $toReturn["error"] = "Error: Unable to execute query.";
      }
    }
 
    return $toReturn;
  }

  /*returns the next result set, if any exists*/
  public function getNextResult() {
    $toReturn = array("error" => null, "result" => null);    
    if ($this->connection_->more_results()) {    
      $this->connection_->next_result();
      $toReturn["result"] = $this->connection_->store_result();
    } else {
      $toReturn["error"] = "No next result";
    }
    return $toReturn;
  }

  
  /* 
    Returns parameter if it exists; null otherwise.
    Set nullStringReplace to true if you wish to replace null
    values with the string 'null'.  This is generally done because when
    values are passed to stored procedures, the null value will mess up the
    parameters to the stored procedure
  */
  public function getParameter($paramName, $nullStringReplace = false){
    $toReturn = null;
    //check both post and get params
    if(isset($this->parameters_[$paramName])) {
      $toReturn = $this->escapeString($this->parameters_[$paramName]);      
    }
    
    if (($toReturn === null) && ($nullStringReplace)) {
      $toReturn = "null";
    }
    
    return $toReturn;
  }

    
} //end DBHelper class

?>