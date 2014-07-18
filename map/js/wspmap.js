/*jslint browser:true */
/*global  wsp, google, console*/
"use strict";


wsp.Map = function () {

  //following are the private variables for Map
  this.dataUrl = "data/";
        
  function selfInit() {
    console.log("wsp.Map init");
  };

  this.trees = [];
  this.taxa = {}; //want "hashtable" not array
  this.panels = [];
  this.panels["display-tree"] = new wsp.DisplayTreePanel("tree-info-panel");
  this.panels["edit-tree"] = new wsp.EditTreePanel("tree-edit-panel");
  //this.treePanel = $("#tree-info-panel"); //returns jquery object
  
  this.requestTrees = function () {
    console.log("requesting trees");
        
    //var jqxhr = $.ajax({url: googleDocUrl.replace("[WORKSHEETID]", treeWorksheetId),
    var jqxhr = $.ajax({url: this.dataUrl,
                        data: {verb: "get", noun: "tree", dbhmin: 30},
                        dataType: "json",
                        context: this})    
        .done(function(data){
          var i = 0;
          var marker  = null;
          var tree = null;

          for (i = 0; i < data.trees.length; i++) {
            tree = data.trees[i];
            
            
            this.trees.push(new wsp.Tree({
              position: {lat: tree.lat, lng: tree.lng},
              map: wspApp.baseMap,
              taxonId: tree.taxonId,
              dbh: tree.dbh
              
            }));
          }
          
          
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
            console.log("Error: " + jqXHR.responseJSON.error);
          } else {
            console.log("Error: " + errorThrown);
          }
                    
          
        });
    
  };

  this.requestTaxa = function () {
    console.log("requesting taxa");
        
    var jqxhr = $.ajax({url: this.dataUrl,
                        data: {verb: "get", noun: "taxon"},
                        dataType: "json",
                        context: this})    
        .done(function(data){
          var i = 0;
          for (i = 0; i < data.taxa.length; i++) {
            this.taxa[data.taxa[i].id] = new wsp.Taxon({dbTaxon: data.taxa[i]});
          }
          
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
            console.log("Error: " + jqXHR.responseJSON.error);
          } else {
            console.log("Error: " + errorThrown);
          }
                    
          
        });
    
  };

  /*
    Opens named panel, passing it an object to use (tree, taxon, etc)
  */
  this.openPanel = function (name, obj) {
    //want to close any open panels
    var i = 0;
    for (i = 0; i < this.panels.length; i++) {
      this.panels[i].close();
    }
    
    this.panels[name].open({base: obj});
  };
  

  selfInit();
}; //wsp.Map

wsp.Tree = function (opts) {
  opts = opts || {};
  this.taxonId = opts.taxonId || "unknown";
  this.dbh = opts.dbh || "?";
  
  if (opts.position) {
    //must create a marker on the map for the tree
    this.marker = new google.maps.Marker({
      map: wspApp.baseMap,
      position: opts.position,
      title: this.taxonId + " (" + this.dbh + " inches!)",
      icon: "images/tree-icon-32.png",
      //easy way for marker to know about tree when it is clicked on - avoids
      //need to change context later on
      tree: this
    });
    
  }
  
  this.title = "Tree: " + this.taxonId; //tmp
  
  //google.maps.event.addListener(this.marker, 'click', $.proxy(this.updateTreePanel, this));
  google.maps.event.addListener(this.marker, 'click', function(){
    wspApp.map.openPanel("display-tree", this.tree);
  });
  
  
};


/*Class representing a taxon.*/
wsp.Taxon = function (opts) {
  opts = opts || {};
  opts.dbTaxon = opts.dbTaxon || {};
  this.id = opts.dbTaxon.id || -1;
  this.genus = opts.dbTaxon.genus || null;
  this.species = opts.dbTaxon.species || null;
  this.common = opts.dbTaxon.common || "*unknown*";
  
  //now calculate a couple of useful strings
  this.sciName = "*unknown*";
  this.wikiLink = null;
  
  //need to have genus at least...species may be null
  if (this.genus) {
    this.sciName = this.genus;
    this.wikiLink = "https://www.google.com/search?q=" + this.genus;
    //now potentially add species
    if (this.species) {
      this.sciName += " " + this.species;
      this.wikiLink += "+" + this.species;
    }
  }
  
  
  
  
  
};
