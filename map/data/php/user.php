<?php

include_once "./php/utility.php";
include_once "./php/manager.php";
include_once "./php/mailer.php";
include_once "./php/password_hash.php"; //as of PHP v5.5, won't need anymore

/**
  Simple object that handles database actions for a user
 */
class UserManager extends Manager{

  public function __construct() {
    $this->updatePriv_ = UserPrivilege::MODIFY_USER;
    //for now, set to values that don't exist in database so that these can't happen
    $this->addPriv_ = -1; //UserPrivilege::ADD_USER;
    $this->deletePriv_ = -1; //UserPrivilege::DELETE_USER;
    $this->objName_ = "user";
  
  }
  
  /*
    For handling the actions that are unique to users
  */
  protected function processOtherVerbs ($dh) {
    $jd = new JsonData();
    $user = $this->createObjectFromRequest($dh);
    $verb = $dh->getParameter("verb");
    switch ($verb) {
      //some actions require that a user be logged in
      case "logout":
      case "modify": //this is modifying a user other than self
        $loggedInUser = $this->getLoggedInUser();
        
        if ($loggedInUser === null) {
          $jd->set("error", "Could not proceed: user not logged in");
        } else {
          //proceed
          switch ($verb) {
            case "logout":
              $this->removeSessionUser();
              break;
            case "modify":
              break;
          }
        }
        break;      
      case "login":
        //see if user provided valid credentials
        if ($user->checkPassword($dh, $dh->getParameter("password"))) {
          $user->loadFromDb($dh);
          $this->saveToSession($user);
          $jd->set("user", $user->getAttributes());
        } else {
          $jd->set("error", "Invalid user credentials");
        }          
        
        break;
      case "resetpw":
        //verify that we have email
        if ($user->getAttributes()["email"]) {
          
          $reset = $user->resetPassword($dh);
          if ($reset["error"]) {
            $jd->set("error", $reset["error"]);
            
          } else {
            $msg = "Forgot your WSP Eco Map password?  No problem! ";
            $msg .= "<br><br>\r\n\r\nPlease use on the following link to reset your password.";
            $linkText = "Reset Password";
            
            if ($user->isNewUser($dh)) {
              $msg = "Welcome to the WSP Eco Map!  Please use the following link";
              $msg .= " to set up your password and profile.";
              $linkText = "Complete Registration";
            }
            
            $attr = $user->getAttributes();
            $config = new Config();
            $link = $config->email["resetUrl"] . "?token=" . $reset["token"] .
              "&userid=" . $attr["id"];
            $link = "<a href='$link'>$linkText</a>";
                        
            $msg .= "<br><br>\r\n\r\n" . $link;
            
            $mailer = new Mailer();
            $sent = $mailer->send($attr["email"], "WSP Eco Map $linkText", $msg);
            
            if (!$sent) {
              $jd->set("error", "Sending email failed");
              //try to delete token
              $user->deletePasswordToken($dh);
            } else {
              $jd->set("message", "Success.  Please check your email for a link " .
                "to complete the process");
              }
          }
          
        } else {
          $jd->set("error", "Cannot reset password - no email provided");
        }
                
        break;
      case "signup":
        $jd = $user->add($dh, $dh->getParameter("password"));
        //want to consider this user as logged-in
        $this->saveToSession($user);
        break;
      case "changepw":
        //user either needs to be logged in or must provide token
        $token = $dh->getParameter("token");
        $curPw = $dh->getParameter("password");
        $newPw= $dh->getParameter("passwordnew");
        
        if (!$token) {
          $user = $this->getLoggedInUser();
        }
        
        if ($user) {
          $jd = $user->update($dh, $newPw, $curPw, false, $token);        
          
          if (!$jd->get("error")) {
            $user->loadFromDb($dh); //to get actual attributes
            $this->saveToSession($user); //consider user logged-in
            $jd->set("user", $user->getAttributes());
            $user->deletePasswordToken($dh);
          }
          
        } else {
          $jd->set("error", "Unable to change password");
        }

        break;
      default:
        $jd->set("error", "Invalid verb given");
    }

    return $jd;
  }

  
  /*
    Returns a user that has been created from request
  */
  protected function createObjectFromRequest($dh) {
    $attr = array();
    $attr["id"] = $dh->getParameter("userid");
    $attr["username"] = $dh->getParameter("username");
    $attr["email"] = $dh->getParameter("email");
    $attr["displayName"] = $dh->getParameter("displayname");
    $attr["firstName"] = $dh->getParameter("firstname");
    $attr["lastName"] = $dh->getParameter("lastname");
    $attr["postalCode"] = $dh->getParameter("postalcode");
    $attr["privileges"] = $dh->getParameter("privileges");
    
    return new User($attr);
  }
  
  /*
    Returns a user that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new User($row);
  }

  /* 
    must be defined to extend Manager, but does nothing
  */
  protected function findHelper($dh) {    
    return array("error" => "Cannot find users");    
  }
  /*
    override find functionality - do not want to be able to search
    unless have proper permissions
  */
  protected function find($dh, $info) {
    $jd = new JsonData();
    $user = $this->getLoggedInUser($dh);
    if ($user && $user->hasPrivilege(UserPrivilege::MODIFY_USER)) {
      $q = $dh->getParameter("q");
      
      $r = $dh->executeQuery("call find_user('$q')");
      
      if ($r["error"]) {
        $jd->set("error", $r["error"]);
      } else {
      
        $objects = array();
        while ($curRow = $r["result"]->fetch_assoc()) {
          $obj = $this->createObjectFromRow($curRow);
          $obj->loadPrivileges($dh);
          $objects[] = $obj;            
        }
        
        //now get out the attributes for json return.  This extra step of
        //creating the object by giving it attributes and then calling getAttributes
        //seems redundant but allows the object to control just which 
        //attributes get make public (along with their names, etc)
        $output = array();
        foreach($objects as $obj) {
          $output[] = $obj->getAttributes();
        }
        
        $jd->set("users", $output);
        
      }
      
    } else {
      $jd->set("error", "Cannot find users");
    }
    
    return $jd;
  }

  /*don't add a user - sign up instead.  adding an object requires being logged in*/
  protected function add($dh, $obj, $user) {
    $jd = new JsonData();
    $jd->set("error", "Error adding user.  Try verb 'signup'");
    return $jd;
  }

  /*a little different than generic manager update.  allowed to proceed if
    the logged-in user either has modify_user permissions (which means it can
    modify any user) or is the same as the user object created from request, which
    means a user is updating itself.  Also, must be verified to update
    */
  protected function update($dh, $obj, $user) {
    $jd = new JsonData();
    $updateSelf = ($user->getAttributes()["id"] === $obj->getAttributes()["id"]);
    if ($user->hasPrivilege($this->updatePriv_) || $updateSelf  ) {
      
      if ($user->getAttributes()["isVerified"]) {
        $jd = $obj->update($dh);
        //if the updated user was the logged-in user, need to update session
        if ($updateSelf) {
          $this->saveToSession($obj);
        }      
      } else {
        $jd->set("error", "You must verify your account before you can update your profile.");
      }
      
    } else {
      $jd->set("error", "User does not have permission to update $this->objName_");
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
    
  
} //end UserManager class


//used to approximate an enum.
//add to this as we need to add permisisons.
//needs to match codes in database table of privileges
abstract class UserPrivilege
{
    const MODIFY_USER = 1;  //modify users other than self
    const ADD_TREE = 2;
    const UPDATE_TREE = 3;
    const DELETE_TREE = 4;
    const ADD_TAXON = 5;
    const ADD_OBSERVATION = 6;
    const MODIFY_OBSERVATION = 7; //modify or delete observation not created by self
    
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
  private $email_;
  private $displayName_;
  private $firstName_;
  private $lastName_;
  private $postalCode_;
  private $privileges_; //array of privileges user has
  private $isVerified_;
  
  public function __construct($attrs) {
    //set defaults
    $this->clear();
    $this->setAttributes($attrs);
  }
  
  private function clear() {
    $this->id_ = null;
    $this->username_ = null;
    $this->email_ = null;
    $this->displayName_ = null;
    $this->firstName_ = null;
    $this->lastName_ = null;
    $this->postalCode_ = null;
    $this->isVerified_ = null;
    
    //if (isset($this->privileges_)) {
    unset($this->privileges_);
    //}
    $this->privileges_ = null;  
  }
  
  /*helper function that calls get_user and returns an object with 
    either user attributes or an error message
  */
  private function getDbInfo($dh, $includePw = false) {
    $toReturn = array("error" => null, "user" => null);
    
    //at least one of username or id must be set
    $id = $this->id_;
    $username = $this->username_;
    $email = $this->email_;
    if (($id === null) && ($username === null) && ($email === null)) {
      $toReturn["error"] = "Username, email, or id must be specified";
    } else {
      $id = ($id === null) ? "null" : $id;
      $username = ($username === null) ? "null" : "'$username'";
      $email = ($email === null) ? "null" : "'$email'";
          
      $r = $dh->executeQuery("call get_user($id, $username, $email)");
      if ($r["result"]) {
        //should only be one row.
        if ($r["result"]->num_rows === 1) {
          $curRow = $r["result"]->fetch_assoc();
          $toReturn["user"] = array();
          $toReturn["user"]["id"] = (int) $curRow["user_id"];
          $toReturn["user"]["displayName"] = $curRow["display_name"];
          $toReturn["user"]["username"] = $curRow["username"];
          $toReturn["user"]["email"] = $curRow["email"];
          $toReturn["user"]["firstName"] = $curRow["first_name"];
          $toReturn["user"]["lastName"] = $curRow["last_name"];
          $toReturn["user"]["postalCode"] = $curRow["postal_code"];
          $toReturn["user"]["isVerified"] = (int) $curRow["is_verified"];
          
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
  
  /*
    returns true if this user exists in db, false otherwise.  "Exists" is defined
    as a database user that matches userId, username, and email.  Leaving any
    blank (for example, just create a user and set username) will check if
    whether only those exist in database
  */
  public function existsInDb($dh) {
    $info = $this->getDbInfo($dh);
    return isset($info["user"]);
  }
  
  /*
    Simple function that returns whether a user has just signed up or not    
  */
  public function isNewUser($dh) {
    //perhaps at some point this will be a flag in the database...for now it's
    //just a matter of if password has ever been set or not
    $info = $this->getDbInfo($dh, true);
    return ($info["user"]["password"] === "");
    //note that right now this will return false if there is an error returned
    //from getDbInfo
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
      
    }
  }
  
  /*returns an array with the attributes - this can then be, say,
  serialized to json.
  */
  public function getAttributes() {
    $toReturn = array();
    $toReturn["id"] = $this->id_;
    $toReturn["username"] = $this->username_;
    $toReturn["email"] = $this->email_;
    $toReturn["displayName"] = $this->displayName_;
    $toReturn["firstName"] = $this->firstName_;
    $toReturn["lastName"] = $this->lastName_;
    $toReturn["postalCode"] = $this->postalCode_;
    if ($this->privileges_ !== null) {
      $toReturn["privileges"] = $this->privileges_;
    } else {
      $toReturn["privileges"] = array();
    }
    
    $toReturn["isVerified"] = $this->isVerified_;
    return $toReturn;
  }
  
  /*takes an array and sets attributes to corresponding values*/
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "id":
        case "user_id":
          //casting null to int will return 0; don't want that
          if ($val !== null) {
            $this->id_ = (int) $val;
          }
          break;        
        case "username":
          $this->username_ = $val;
          break;        
        case "email":
          $this->email_ = $val;
          break;        
        case "displayName":
        case "display_name":
          $this->displayName_ = $val;
          break;        
        case "firstName":
        case "first_name":
          $this->firstName_ = $val;
          break;        
        case "lastName":
        case "last_name":
          $this->lastName_ = $val;
          break;        
        case "postalCode":
        case "postal_code":
          $this->postalCode_ = $val;
          break;        
        case "isVerified":
        case "is_verified":
          $this->isVerified_ = (int) $val;
          break;        
        case "privileges":
          //might be a string of comma-separated numbers, or an array
          if (is_array($val)) {
            $this->privileges_ = $val;
          } else if ($val !== null) {
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
    Use scenarios:
    * if lockPw is true, will set password in database to empty string
    * if newPw is given, will set password in database to it, provided that either
      curPw is given and is correct OR token is given and is correct
    * if neither lockPw nor newPw is given, will update other attribute fields
      
  */
  public function update($dh, $newPw = null, $curPw = null,
    $lockPw = false, $token = null) {
    
    $jd = new JsonData();
    $jd->set("user", array());
    $jd->set("error", null);
    
    $hash = ($lockPw) ? "''" : "null";//will be changed if user wants to change pw
        
    //in order to change password, old password must be given.  other
    //fields can be changed without password being given    
    if ((!$lockPw) && ($newPw !== null)) {
      $pwValid = false;
      //want to check that the given curPw is correct for this user.      
      if ($token !== null) {
        $pwValid = ($token === $this->getPasswordToken($dh));
      } else {
        $pwValid = $this->checkPassword($dh, $curPw);
      }
            
      if ($pwValid) {
        $hasher = new PasswordHash();
        $hash = "'" . $hasher->HashPassword($newPw) . "'";
      } else {
        //give message according to use case
        $jd->set("error", "Given password is incorrect");
        if ($token !== null) {
          $s = "Unable to set password - link may have expired.  " .
            "Please request a new reset link and try again.";
          $jd->set("error", $s);
        }
      }
    }

    if($jd->get("error") === null) {
      $userId = $this->id_;

      if ($lockPw) {
        $s = "call update_user($userId, null, null, '', null, null, null, null, null)";
      } else {
        $username = ($this->username_ === null) ? "null" : "'$this->username_'";      
        $email = ($this->email_ === null) ? "null" : "'$this->email_'";      
        $dn = ($this->displayName_ === null) ? "null" : "'$this->displayName_'";      
        $fn = ($this->firstName_ === null) ? "null" : "'$this->firstName_'";      
        $ln = ($this->lastName_ === null) ? "null" : "'$this->lastName_'";      
        $pc = ($this->postalCode_ === null) ? "null" : "'$this->postalCode_'";      
        $iv = ($this->isVerified_ === null) ? "null" : "'$this->isVerified_'";
        //automatically verify users if token is passed and is valid
        $iv = ($token !== null) ? 1 : $iv;
        
        $s = "call update_user($userId, $username, $email, $hash, $dn, $fn, $ln, $pc, $iv)";      
      }

      $r = $dh->executeQuery($s);      
      if ($r["result"]) {
        //first update privileges
        $this->savePrivilegesToDb($dh);
        
        
        //need to loadfromdb because it's possible that only one or two
        //attribute have been updated (and are the only ones defined in 'this'
        //object.  want to return the full user.
        $this->loadFromDb($dh);      
        $jd->set("user", $this->getAttributes());
      } else {
        $jd->set("error", "Update not successful");
      }
    }
    
    return $jd;
  }  
  
  
  /*
    returns true if user has the given privilege
  */
  public function hasPrivilege($priv) {    
    $toReturn = false;
    if ($this->privileges_ !== null) {
      $toReturn = in_array($priv, $this->privileges_);
    }
    return $toReturn;
  }
  
  /*
    Adds given user to database.
    note: passing a null password will save an empty string in database
  
  */
  public function add($dh, $pw) {
    $jd = new JsonData();
    $jd->set("error", null);
    $jd->set("user", null);
    
    $username = $this->username_;
    $email = $this->email_;
    $hash = "";
    
    $emailCheck = new User(array("email" => $email));
    $usernameCheck = new User(array("username" => $username));
    
    if (($username === null) || ($email === null)) {
      $jd->set("error", "Must specify username and email");
    } else if ($usernameCheck->existsInDb($dh) || ($emailCheck->existsInDb($dh))) {
      $jd->set("error", "Username or email already in use");
    }
    else {
    
      if ($pw !== null) {
        $hasher = new PasswordHash();
        $hash = $hasher->HashPassword($pw);
      }
            
      $s = "call add_user('$username', '$email', '$hash')";
      $r = $dh->executeQuery($s);
      
      if ($r["result"]) {
        //should be only one row - it will contain the newly-added user id.        
        $curRow = $r["result"]->fetch_assoc();

        //the only privilege a new user has is to add a comment
        $this->setAttributes(array(
          "id" => (int) $curRow["user_id"],
          "privileges" => array(UserPrivilege::ADD_OBSERVATION)));

        $this->savePrivilegesToDb($dh);
        
        $jd->set("user", $this->getAttributes());
                
      } else {
        $jd->set("error", "Unable to add user to database");
      }
      
    }
    return $jd;
  }  
  
  /*helper function that saves current privileges to database*/
  private function savePrivilegesToDb($dh) {
    //easiest to first remove all privileges then add current ones back
    //only do this if privileges has actually been set
    if ($this->privileges_ !== null) {
      $s = "call delete_user_privilege($this->id_, null)";
      $dh->executeQuery($s);
      foreach($this->privileges_ as $key => $val) {
        $s = "call add_user_privilege($this->id_, $val)";
        $r = $dh->executeQuery($s);
      }
    }
  }

  
  /*called when user has forgotten password or when user is first created.
  generates a token and resets
  password in user database.  returns token on success or error message on failure*/
  public function resetPassword($dh) {
    $toReturn = array("error" => null, "token" => null);
    //first need to load self from db, as it's likely that the only known
    //attribute is email, and need user_id to update
    $this->loadFromDb($dh);
    
    if ($this->id_) {
      $jd = $this->update($dh, null, null, true, null); //lock password
      
      if (!$jd->get("error")) {
        //remove previous tokens
        $this->deletePasswordToken($dh);
        
        $hasher = new PasswordHash();
        $token = bin2hex($hasher->get_random_bytes(32));

        $s = "call add_pwtoken($this->id_, '$token')";
        $r = $dh->executeQuery($s);
        if ($r["error"]) {
          $toReturn["error"] = "Error generating token: " . $r["error"];
        } else {
          $toReturn["token"] = $token;
        }
      
      } else {
        $toReturn["error"] = "Unable to reset user password";
      }
      
    } else {
      $toReturn["error"] = "Unable to reset password - no associated account";
    }
    
    return $toReturn;
  }
  
  /*returns temporary password token for user on success or null on failure*/
  private function getPasswordToken($dh) {
    $token = null;
    
    $s = "call get_pwtoken($this->id_)";
    $r = $dh->executeQuery($s);
    if ($r["result"]) {
      $curRow = $r["result"]->fetch_assoc();
      $token = $curRow["token"]; //may be null      
    }
    
    return $token;
  }
  
  /*attempts to delete password token from database.  returns true on success
  and false otherwise*/
  public function deletePasswordToken($dh) {    
    $s = "call delete_pwtoken($this->id_)";
    $r = $dh->executeQuery($s);
    return ($r["error"] === null);
    
  }
  
      
}  //end User class

?>