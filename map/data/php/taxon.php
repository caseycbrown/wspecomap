<?php

include_once "./config/config.php"; //db access info.  path is relative to root
include_once "./php/utility.php";

/**
  Simple object that handles database actions for a taxon
 */
class TaxonManager {
  
  private $dbh_;
  private $urlHelper_;  
  
  public function __construct($dbh, $urlHelper) {
    $this->dbh_ = $dbh;
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
    $taxa = array();
    
    //there are a number of optional parameters to pass which must be the
    //string 'null' if they are not given in url
    $id = $this->urlHelper_->getParameter("id", true);
    $genus = $this->urlHelper_->getParameter("genus");
    $species = $this->urlHelper_->getParameter("species");
    $common = $this->urlHelper_->getParameter("common");
    
    $genus = ($genus === null) ? "null" : "'$genus'";
    $species = ($species === null) ? "null" : "'$species'";
    $common = ($common === null) ? "null" : "'$common'";
    
    $s = "call get_taxon($id, $genus, $species, $common)";
    
    $r = $this->dbh_->executeQuery($s);
    if ($r["error"]) {
      $jd->set("error", $r["error"]);
    } else {    
      while ($curRow = $r["result"]->fetch_assoc()) {
        $taxon = new Taxon($this->dbh_, $curRow);
        $taxa[] = $taxon;            
      }
      
      //now get out the attributes for json return.  This might seem like an
      //extra step - see comment in TreeManager class for explanation
      $output = array();
      foreach($taxa as $taxon) {
        $output[] = $taxon->getAttributes();
      }
      
      $jd->set("taxa", $output);
      
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
  
    
} //end TaxonManager class


/**
   relatively simple object that represents a taxon.  For now, this is only
   species and genus...could eventually be more, but I don't foresee that for
   this project
 */
class Taxon {

  private $dbHelper_;

  //now the attributes
  private $id_;
  private $genus_;
  private $species_;
  private $common_;
  
  public function __construct($dbh, $attrs) {
    $this->dbHelper_ = $dbh;
    
    //set default values
    $this->id_ = null;
    $this->genus_ = null;
    $this->species_ = null;
    $this->common_ = null;
    
    $this->setAttributes($attrs);
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
    
    return $attr;
  }

  
} //end Taxon class



?>