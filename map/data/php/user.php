<?php

include_once "./php/utility.php";
include_once "./php/password_hash.php"; //as of PHP v5.5, won't need anymore

/**
  Simple object that handles database actions for a user
 */
class UserManager {

  //at the moment, nothing interesting in constructor/destructor
  
  /*
    Determines what to do based on request parameters
  */
  public function processRequest($dh) {
    $verb = $dh->getParameter("verb");
    $jd = new JsonData();
    switch ($verb) {
      //some actions require that a user be logged in

      case "add":
      case "update":
      case "logout":
      case "modify": //this is modifying a user other than self
        $loggedInUser = $this->getLoggedInUser();
        
/* temp just to test adding a user       
        $loggedInUser = new User();
        $loggedInUser->setAttributes(array("privileges" => "1"));
*/      
        
        if ($loggedInUser === null) {
          $jd->set("error", "Could not proceed: user not logged in");
        } else {
          //proceed
          switch ($verb) {
            case "add":
              $newUser = new User();
              $attr = array();
              $attr["username"] = $dh->getParameter("username");
              $attr["displayName"] = $dh->getParameter("display_name");
              $attr["privileges"] = $dh->getParameter("privileges");
              $newUser->setAttributes($attr);
              
              $jd = $loggedInUser->add($dh, $newUser, $dh->getParameter("password"));
              
              break;
            case "logout":
              $this->removeSessionUser();
              break;
            case "update":
              break;
            case "modify":
              break;
          }
        }
        break;      
      case "login":
        //see if user provided valid credentials
        $user = new User();
        $user->setAttributes(array("username" => $dh->getParameter("username")));
          if ($user->checkPassword($dh, $dh->getParameter("password"))) {
            $user->loadFromDb($dh);
            $this->saveToSession($user);
            $jd->set("user", $user->getAttributes());
          } else {
            $jd->set("error", "Invalid user credentials");
          }          
        
        break;
      case "forgot":
        break;
      default:
        $jd->set("error", "Invalid verb given");
    }

    return $jd;
    
  }

  /*
    saves the given user to session
  */
  private function saveToSession($user) {
    $_SESSION[Constants::USER_SESSION_VAR] = $user->getAttributes();
  }

  /*
    unsets the given session variable
  */  
  private function removeSessionUser() {        
    unset($_SESSION[Constants::USER_SESSION_VAR]);
  }
  
  /*
    returns a new user if values for one were saved.
    returns null otherwise
  */
  public function getLoggedInUser() {
    $user = null;
    if (isset($_SESSION[Constants::USER_SESSION_VAR])) {
      $user = new User();
      $user->setAttributes($_SESSION[Constants::USER_SESSION_VAR]);
    }
    return $user;
  }
  
  
} //end UserManager class


//used to approximate an enum.
//add to this as we need to add permisisons.
//needs to match codes in database table of privileges
abstract class UserPrivilege
{
    const ADD_USER = 1;     //add new users
    const MODIFY_USER = 2;  //modify users other than self
    const DELETE_USER = 3;  //delete users other than self
    const ADD_TREE = 4;
    const UPDATE_TREE = 5;
    const DELETE_TREE = 6;
    const ADD_TAXON = 7;
    const UPDATE_TAXON = 8;
    const DELETE_TAXON = 9;
    const ADD_OBSERVATION = 10;
    const UPDATE_OBSERVATION = 11; //update observation not created by self
    const DELETE_OBSERVATION = 12; //delete observation not created by self
    
}

/*provide a way for constants without too much clutter*/
abstract class Constants {
  const USER_SESSION_VAR = "loggedinuser";
}


/**
   relatively simple object that represents a user
 */
class User {
  private $id_;
  private $username_;
  private $displayName_;
  private $privileges_; //array of privileges user has
  
  public function __construct() {
    //set defaults
    $this->clear();
  }
  
  private function clear() {
    $this->id_ = null;
    $this->username_ = null;
    $this->displayName_ = null;
    
    if (isset($this->privileges_)) {
      unset($this->privileges_);
    }
    $this->privileges_ = array();  
  }
  
  /*helper function that calls get_user and returns an object with 
    either user attributes or an error message
  */
  private function getDbInfo($dh, $includePw = false) {
    $toReturn = array("error" => null, "user" => null);
    
    //at least one of username or id must be set
    $id = $this->id_;
    $username = $this->username_;
    if (($id === null) && ($username === null)) {
      $toReturn["error"] = "Username or id must be specified";
    } else {
      $id = ($id === null) ? "null" : $id;
      $username = ($username === null) ? "null" : "'$username'";
          
      $r = $dh->executeQuery("call get_user($id, $username)");
      if ($r["result"]) {
        //should only be one row.
        if ($r["result"]->num_rows === 1) {
          $curRow = $r["result"]->fetch_assoc();
          $toReturn["user"] = array();
          $toReturn["user"]["id"] = (int) $curRow["user_id"];
          $toReturn["user"]["displayName"] = $curRow["display_name"];
          $toReturn["user"]["username"] = $curRow["email"];        
          
          if ($includePw) {
            $toReturn["user"]["password"] = $curRow["password"];
          }
          
        } else {
          $toReturn["error"] = "Unable to get user information";
        }
      } else {
        $toReturn["error"] = "Get user error: " . $r["error"];
      }
    }
    
    return $toReturn;
  }
  
  /*loads database privileges */
  public function loadPrivileges($dh) {
    $toReturn = array("error" => null, "user" => null);
    
    //user_id must be set
    if ($this->id_ === null) {
      $toReturn["error"] = "User id must be specified";
    } else {
          
      $r = $dh->executeQuery("call get_user_privilege($this->id_)");
      if ($r["result"]) {
        //need to clear privileges first
        unset($this->privileges_);
        $this->privileges_ = array();
        
        while ($curRow = $r["result"]->fetch_assoc()) {
          //$this->privileges_[(int) $curRow["privilege_code"]] = 1;
          $this->privileges_[] = (int) $curRow["privilege_code"];
        }

      } else {
        $toReturn["error"] = "Privilege error: " . $r["error"];
      }
    }
    
    return $toReturn;  
  }
  
  
  /*
    loads info from database to this user.*/
  public function loadFromDb($dh) {    
    $info = $this->getDbInfo($dh);
    $this->clear(); //might we only want this to run if fail to get dbinfo?
    if ($info["user"]) {
      $this->setAttributes($info["user"]);
      //then load privileges
      $this->loadPrivileges($dh);
      
      //$this->id = $info["user"]["id"];
      //$this->displayName = $info["user"]["displayName"];
      //$this->username = $info["user"]["username"];
    }
  }
  
  /*returns an array with the attributes - this can then be, say,
  serialized to json.
  */
  public function getAttributes() {
    $toReturn = array();
    $toReturn["id"] = $this->id_;
    $toReturn["username"] = $this->username_;
    $toReturn["displayName"] = $this->displayName_;
    $toReturn["privileges"] = $this->privileges_;
    return $toReturn;
  }
  
  /*takes an array and sets attributes to corresponding values*/
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "id":
        case "user_id":
          $this->id_ = $val;
          break;        
        case "username":
          $this->username_ = $val;
          break;        
        case "displayName":
          $this->displayName_ = $val;
          break;        
        case "privileges":
          //might be a string of comma-separated numbers, or an array
          if (is_array($val)) {
            $this->privileges_ = $val;
          } else {
            //clear array first
            unset($this->privileges_);
            $this->privileges_ = array();
            $tmp = explode(",", $val);
            foreach($tmp as $v){
              if (is_numeric($v)) {
                //$this->privileges_[(int) $v] = 1;
                $this->privileges_[] = (int) $v;
              }
            }
          
          }
          break;

        default:
          //ignore any others
      }
    }
  }
  
  /*returns true if given password is correct; false otherwise*/
  public function checkPassword($dh, $pw) {
    $toReturn = false;
    $info = $this->getDbInfo($dh, true);
    
    if ($info["user"]) {
      $hasher = new PasswordHash();
      
      $dbPw = $info["user"]["password"];
      
      if ($dbPw !== "") {//hashing woudl probably fail anyway without this step
        //password hasher creates a new hash from the new password given, and
        //checks to see if that matches the hash that's stored in the database.
        //(note that it uses the same salt which is stored in the same field
        //as the hashed pw to create the new hash)
        
        $toReturn = $hasher->CheckPassword($pw, $dbPw);
      }
    }    
    return $toReturn;
  }
  
  /*called to update info about user.  Any of the given params may be null.
    note: pass lockPw as true and pw will be set to empty string in db,
    which means login will fail
      if pwIsToken is true, assumption is that curPw is reset token
  */
  public function CHECKupdate($curPw, $newPw, $username, $displayName,
    $lockPw = false, $pwIsToken = false) {
    $rd = new ReturnData();
    $rd->json_ = array("user" => array(), "error" => null);

    $userId = $this->id;
    $hash = ($lockPw) ? "''" : "null";//will be changed if user wants to change pw
    
    //$un = ($username === null) ? "null" : "'$username'";
    //TODO: allow user to change username (email).  This should include sending
    //a verification email so that they don't lock themselves out if they
    //provide a bad email and then subsequently forget password
    $un = "null";
    $dn = ($displayName === null) ? "null" : "'$displayName'";
    
    //in order to change password, old password must be given.  other
    //fields can be changed without password being given    
    if (($curPw !== null) && (!$lockPw)) {
      $pwValid = false;
      //want to check that the given curPw is correct for this user.      
      if ($pwIsToken) {
        $pwValid = ($curPw === $this->getPasswordToken());
      } else {
        $pwValid = $this->checkPassword($curPw);
      }
            
      if ($pwValid) {
        //if new password is null, do not update
        if ($newPw !== null) {
          $hasher = new PasswordHash();
          $hash = "'" . $hasher->HashPassword($newPw) . "'";
        }
      } else {
        $rd->json_["error"] = "Given password is incorrect";
      }
    }

    if($rd->json_["error"] === null) {
      //the null is for admin - can't update that by one's self
      $s = "call update_user($userId, $un, $dn, $hash, null)";
      $r = $this->dbh_->executeQuery($s);      
      if ($r["result"]) {        
        
        //update own attributes. it's a little overkill to loadFromDb, but
        //in case any attributes are out of date, it's easiest way
        $this->loadFromDb();        
        
        $rd->json_["user"] = $this->getAttributes();
      } else {
        $rd->json_["error"] = "Update not successful";        
      }
    }
    
    return $rd;
  }  
  
  
  /*
    returns true if user has the given privilege
  */
  public function hasPrivilege($priv) {    
    return in_array($priv, $this->privileges_);    
  }
  
  /*
    Adds given user to database.
    This user must have privileges to do so

    note: passing a null password will save an empty string in database, which
    will then later require that user to reset password (once that feature is built!)
  
  */
  public function add($dh, $user, $pw) {
    $jd = new JsonData();
    $jd->set("error", null);
    $jd->set("user", null);
    
    if ($this->hasPrivilege(UserPrivilege::ADD_USER)) {
      
      //TODO: check that username is valid email.  displayname not null?      
      $attr = $user->getAttributes();
      $username = $attr["username"];
      $displayName = $attr["displayName"];
      $hash = "";
      
      if (($username === null) || ($displayName === null)) {
        $jd->set("error", "Must specify username and display name");
      } else {
      
        if ($pw !== null) {
          $hasher = new PasswordHash();
          $hash = $hasher->HashPassword($pw);
        }
              
        $s = "call add_user('$username', '$displayName', '$hash')";
        $r = $dh->executeQuery($s);
        
        if ($r["result"]) {
          //should be only one row - it will contain the newly-added user id.        
          $curRow = $r["result"]->fetch_assoc();
          
          $user->setAttributes(array("id" => (int) $curRow["user_id"]));
          
          //now add privileges
          $user->savePrivilegesToDb($dh);
          
          //$user->loadFromDb($dh);
          $jd->set("user", $user->getAttributes());
                  
        } else {
          $jd->set("error", "Unable to add user to database");
        }
        
      }
      
      
    } else {
      $jd->set("error", "Current user does not have authority to add a new user");
    }
    return $jd;
  }  
  
  /*helper function that saves current privileges to database*/
  private function savePrivilegesToDb($dh) {
    //easiest to first remove all privileges then add current ones back
    $s = "call delete_user_privilege($this->id_)";
    $dh->executeQuery($s);

    foreach($this->privileges_ as $key => $val) {
      //$r["result"]->free();
      $s = "call add_user_privilege($this->id_, $key)";
      $r = $dh->executeQuery($s);
    }
  
  }

  
  /*called when user has forgotten password.  generates a token and also resets
  password in user database.  returns token on success or error message on failure*/
  public function CHECKresetPassword() {
    $toReturn = array("error" => null, "token" => null);
    //first need to load self from db, as it's likely that the only known
    //attribute is username, and need user_id to update
    $this->loadFromDb();
    if ($this->id) {
      $rd = $this->update(null, null, null, null, true); //reset password
      
      if (!$rd->json_["error"]) {
        //get rid of previous tokens.  Is this desired behavior?  Could consider
        //preventing user from making another request?  Or return existing token?
        $this->deletePasswordToken();
        
        $hasher = new PasswordHash();
        $token = bin2hex($hasher->get_random_bytes(32));
        $id = $this->id;

        $s = "call add_password_token($id, '$token')";
        $r = $this->dbh_->executeQuery($s);
        //want to make sure it worked
        if ($r["error"]) {
          $toReturn["error"] = "Error generating token: " . $r["error"];
        } else {
          $toReturn["token"] = $token;
        }
        
      
      } else {
        $toReturn["error"] = "Unable to reset user password";
      }
      
      
    } else {
      $toReturn["error"] = "Unable to reset password";
    }
    
    return $toReturn;
  }
  
  /*returns temporary password token for user on success or null on failure*/
  private function CHECKgetPasswordToken() {
    $token = null;
    
    $id = $this->id;
    $s = "call get_password_token($id)";
    $r = $this->dbh_->executeQuery($s);
    if ($r["result"]) {
      $curRow = $r["result"]->fetch_assoc();
      $token = $curRow["token"]; //may be null      
    }
    
    return $token;
  }
  
  /*attempts to delete password token from database.  returns true on success
  and false otherwise*/
  public function CHECKdeletePasswordToken() {    
    $s = "call delete_password_token('" . $this->id . "')";
    $r = $this->dbh_->executeQuery($s);
    return ($r["error"] === null);
    
  }
  
      
}  //end User class

?>