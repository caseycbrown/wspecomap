/*jslint browser:true */
/*global  wsp, google, console*/
"use strict";


wsp.Map = function () {

  //following are the private variables for Map
  var that = this,
    dataUrl = "data/";
    
    /* no longer using google spreadsheet to store data
    treeWorksheetId = "od6",
    speciesWorksheetId = "onh134e",
    googleDocUrl = "https://spreadsheets.google.com/feeds/list/" + 
        "1foNPoqCq4qEE8CAREIuUIcexFgLlcDE6HJvQOvAkc0Y/" + 
        "[WORKSHEETID]/public/full?alt=json";
    */  
    
    //there are a few permutations that the url to the google doc spreadsheet
    //can take.  After the sheet has been published to the web, it has a key and
    //each worksheet within it has a unique worksheetId.  The urls are then
    //used to indicate which sheet and which format for the sheet.  Formats can
    //be list or cells, which basically are getting data in rows or cell-by-cell
    //can change "full" to "basic" but it will then not return each cell value
    //for the row - would need to parse them out of a single return value
    //see https://developers.google.com/google-apps/spreadsheets/ for more

    
  function selfInit() {
    console.log("wsp.Map init");
  }

  this.trees = [];
  this.taxa = [];
  this.treePanel = $("#tree-info-panel"); //returns jquery object
  
  this.requestTrees = function () {
    console.log("requesting trees");
        
    //var jqxhr = $.ajax({url: googleDocUrl.replace("[WORKSHEETID]", treeWorksheetId),
    var jqxhr = $.ajax({url: dataUrl,
                        data: {verb: "get", noun: "tree"},
                        dataType: "json",
                        context: that})    
        .done(function(data){
          console.log("trees received, my friend " + this.argh);
          var i = 0;
          var marker  = null;
          var tree = null;

/* this was for google doc json response          
          for (i = 0; i < data.feed.entry.length; i++) {
            tree = data.feed.entry[i];
            
            
            this.trees.push(new wsp.Tree({
              position: {lat: parseFloat(tree.gsx$lat.$t), lng: parseFloat(tree.gsx$lng.$t)},
              map: wspApp.baseMap,
              speciesId: tree.gsx$speciesid.$t,
              dbh: tree.gsx$dbh.$t
              
            }));
          }
*/
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
        
    var jqxhr = $.ajax({url: dataUrl,
                        data: {verb: "get", noun: "taxon"},
                        dataType: "json",
                        context: that})    
        .done(function(data){
          console.log("taxa received, my friend " + this.argh);
          var i = 0;
          for (i = 0; i < data.taxa.length; i++) {
            this.taxa[data.taxa[i].id] = data.taxa[i];
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

  this.updateTreePanel = function (tree) {
    console.log("update?");
    console.log("clicked on a tree"  + tree.title);
    
    var taxon = this.taxa[tree.taxonId] || {};
    
    var sciName = "(unknown)";
    if (taxon.genus && taxon.species) {
      sciName = taxon.genus + " " + taxon.species;
    }
    
    var query = "https://www.google.com/search?q=" + taxon.genus + "+" + taxon.species;
    
    wspApp.map.treePanel.find(".scientific").text(sciName);
    wspApp.map.treePanel.find(".common").text(taxon.common || "(unknown)");
    wspApp.map.treePanel.find(".diameter").text(tree.dbh + " inches");

    wspApp.map.treePanel.find(".moreinfo").attr("href", query);
    
    wspApp.map.treePanel.panel("open");
    
    //wspApp.map.treePanel.trigger("updatelayout");
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
    wspApp.map.updateTreePanel(this.tree);
  });
  
  
};
