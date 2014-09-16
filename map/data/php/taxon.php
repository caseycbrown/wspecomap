<?php

include_once "./php/utility.php";
include_once "./php/manager.php";

/**
  Simple object that handles database actions for a taxon
 */
class TaxonManager extends Manager{
  
  public function __construct() {
    $this->updatePriv_ = -1; //UserPrivilege::UPDATE_TAXON;
    $this->addPriv_ = UserPrivilege::ADD_TAXON;
    $this->deletePriv_ = -1; //UserPrivilege::DELETE_TAXON;
    $this->objName_ = "taxon";
  }

  
  
  /*
    Returns a taxon that has been created from request
  */
  protected function createObjectFromRequest($dh) {
    $attr = array();
    $attr["id"] = $dh->getParameter("taxonid");
    $attr["genus"] = $dh->getParameter("genus");
    $attr["species"] = $dh->getParameter("species");
    $attr["common"] = $dh->getParameter("common");
    
    return new Taxon($attr);
  }

  /*
    Returns a taxon that has been created from a database row
  */
  protected function createObjectFromRow($row) {
    return new Taxon($row);
  }
  

  
  /* 
    Gets taxon(s) from database and returns jsondata object
  */
  protected function findHelper($dh) {    
    $info = array("jsonName" => "taxa");
    
    
    //there are a number of optional parameters to pass which must be the
    //string 'null' if they are not given in url
    $id = $dh->getParameter("id", true);
    $genus = $dh->getParameter("genus");
    $species = $dh->getParameter("species");
    $common = $dh->getParameter("common");
    
    $id = ($id === null) ? "null" : $id;
    $genus = ($genus === null) ? "null" : "'$genus'";
    $species = ($species === null) ? "null" : "'$species'";
    $common = ($common === null) ? "null" : "'$common'";
    
    $s = "call get_taxon($id, $genus, $species, $common)";
    
    $info["sql"] = $s;
    return $info;
    
  }
  
    
} //end TaxonManager class


/**
   relatively simple object that represents a taxon.  For now, this is only
   species and genus...could eventually be more, but I don't foresee that for
   this project
 */
class Taxon {

  //now the attributes
  private $id_;
  private $genus_;
  private $species_;
  private $common_;
  private $color_;
  
  public function __construct($attrs) {
    //set default values
    $this->id_ = null;
    $this->genus_ = null;
    $this->species_ = null;
    $this->common_ = null;
    $this->color_ = null;
    
    $this->setAttributes($attrs);
  }

  /* 
    Adds a taxon to database and returns jsondata object
  */
  public function add($dh){    
    $jd = new JsonData();
  
    //need to replace any null values with word 'null'
    $genus = ($this->genus_ === null) ? "null" : "'$this->genus_'";
    $species = ($this->species_ === null) ? "null" : "'$this->species_'";
    $common = ($this->common_ === null) ? "null" : "'$this->common_'";
    
    $s = "call add_taxon($genus, $species, $common)";
    
    
    
    $r = $dh->executeQuery($s);
    
    if ($r["error"]) {
      $jd->set("error", "Error attempting to add taxon" . "..." . $r["error"]);
    } else { 
      //want to grab returned id
      $curRow = $r["result"]->fetch_assoc(); //should only be one row
      $this->id_ = (int) $curRow["taxon_id"];
      
      $jd->set("taxon", $this->getAttributes());
    }
    
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

  
  public function setAttributes($arr) {
    foreach($arr as $key => $val) {
      switch($key) {
        case "taxon_id":
        case "id":
          if (is_numeric($val)) { //don't want to cast null to int
            $this->id_ = (int) $val;
          }
          break;        
        case "genus":
            $this->genus_ = $val;
          break;        
        case "species":
            $this->species_ = $val;
          break;        
        case "common":
            $this->common_ = $val;
          break;        
        case "color":
            $this->color_ = $val;
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
    $attr["genus"] = $this->genus_;
    $attr["species"] = $this->species_;
    $attr["common"] = $this->common_;
    $attr["color"] = $this->color_;
    
    return $attr;
  }

  
} //end Taxon class



?>