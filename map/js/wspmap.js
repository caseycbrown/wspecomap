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
  this.user = null; //set if user logs in
  
  this.panels = {};
  this.panels.displayTree = new wsp.DisplayTreePanel("tree-info-panel");
  this.panels.editTree = new wsp.EditTreePanel("tree-edit-panel");
  this.panels.login = new wsp.LoginPanel("login-panel");
  this.panels.user = new wsp.UserPanel("user-panel");
  //this.treePanel = $("#tree-info-panel"); //returns jquery object
  
  $("#user-settings").click($.proxy(function(){
    if (this.user) {
      wspApp.map.panels.user.open();
    } else {
      wspApp.map.panels.login.open();
    }
    
  }, this));
  
  
  this.requestTrees = function () {
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
              dbh: tree.dbh,
              id: tree.id              
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
    closes any open panels
  */
  
  /*
  this.closePanels = function () {
    
    //want to close any open panels
    var p = null;
    for (p in this.panels) {
      if (this.panels.hasOwnProperty(p)) {
        console.log("telling panel p to close" + this.panels[p].blah);
        this.panels[p].close();
      }
    }

  };
*/

  selfInit();
}; //wsp.Map

wsp.Tree = function (opts) {
  opts = opts || {};
  this.id = opts.id || -1;
  this.taxonId = opts.taxonId || "unknown";
  this.dbh = opts.dbh || "?";
  this.position = opts.position;
  
  if (this.position) {
    //must create a marker on the map for the tree
    this.marker = new google.maps.Marker({
      map: wspApp.baseMap,
      position: this.position,
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
    wspApp.map.panels.displayTree.open({base: this.tree});
    //wspApp.map.openPanel("display-tree", {base: this.tree});
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

/*Class representing a user.*/
wsp.User = function (opts) {
  opts = opts || {};
  opts.dbUser = opts.dbUser || {};
  this.id = opts.dbUser.id || -1;
  this.username = opts.dbUser.username;
  this.displayName = opts.dbUser.displayName;
  this.privileges = opts.dbUser.privileges;
  
  /*returns true if user has given privilege*/
  this.hasPrivilege = function (priv) {
    return (this.privileges.indexOf(priv) >= 0);
  };
  
};

/*
  UserPrivilege values need to match those in database
*/
wsp.UserPrivilege = {
  ADD_USER: 1,     //add new user
  MODIFY_USER: 2,  //modify users other than self
  DELETE_USER: 3,  //delete users other than self
  ADD_TREE: 4,
  UPDATE_TREE: 5,
  DELETE_TREE: 6,
  ADD_TAXON: 7,
  UPDATE_TAXON: 8,
  DELETE_TAXON: 9
};
