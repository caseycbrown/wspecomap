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
  this.panels.message = new wsp.MessagePanel("message-panel");
  //this.treePanel = $("#tree-info-panel"); //returns jquery object

  //set up marker clusterer
  this.markerClusterer = new MarkerClusterer(wspApp.baseMap, null, 
    {maxZoom: 19,
    gridSize: 40,
    styles: [
      {url: "images/tree-icon-32.png", height: 32, width: 32},
      {url: "images/tree-icon-48.png", height: 48, width: 48}
      ]
    });
  
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
                        data: {verb: "get", noun: "tree", dbhmin: 0},
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
      //map: wspApp.baseMap,
      position: this.position,
      title: this.taxonId + " (" + this.dbh + " inches!)",
      icon: "images/tree-icon-b.png",
      //easy way for marker to know about tree when it is clicked on - avoids
      //need to change context later on
      tree: this
    });
    
    //TO-DO: change marker stuff - this is just to test clusterer
    wspApp.map.markerClusterer.addMarker(this.marker);
    
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


/*
  a custom control that centers map on user.  Geolocation relies on HTML5 and
  no attempt is made for workarounds if not supported by browser
*/
wsp.LocationControl = function(map) {
  if (navigator && navigator.geolocation) {

    var controlUI = $("<div></div>").addClass("lc-content ui-corner-all")
      .prepend('<img src="images/target-40.png" />');
  
    var containerDiv = $("<div></div>")
      .addClass("lc-container")
      .attr("index", 1)
      .append(controlUI);

    //add to map's set of controls
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(containerDiv[0]);

    this.userSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: .4,
      fillColor: "blue",
      strokeOpacity: 1.0,
      strokeColor: "blue",
      strokeWeight: 1.0,
      scale: 10.0
    };
    
    this.userLocation = new google.maps.Marker({
      clickable: false,
      icon: this.userSymbol
    });

/*    
    this.userLocation = new google.maps.Circle({
      //will set map and position once we know position
      clickable: false,
      fillColor: "#0000ff",
      strokeColor: "#00ff00",
      strokeWeight: 4, //pixels
      strokeOpacity: 0.5,
      fillOpacity: 0.4,
      radius: 5 //meters
    });
*/    

    //calling watchPosition (which happens automatically) will cause
    //onPositionError to be called if user
    //has denied location sharing for this site.  Don't want it popping up error
    //message in that case, but want the ability to later enable messages if user
    //does something deliberate that requires location
    this.suppressErrorMessage = true;
    
    
    /*another note about watchPosition: if the location sharing setting for the
    page is "always ask" and the user selects "don't share now" then
    watchPosition does not call either callback - either success or
    error (at least on Firefox 24 in Windows 7.  I need to check more cases).
    the function still returns a watchId.  Because I need some way of knowing
    if it's actually regularly updating position, I have this boolean which I
    set myself after it first hits success callback
    */
    this.isWatching = false;


    this.geoOpts = {enableHighAccuracy: true, maximumAge: 100};
    // Setup click event listener
    $(controlUI).click($.proxy(function() {
      this.suppressErrorMessage = false; //want user to get possible error message
      navigator.geolocation.getCurrentPosition(
        $.proxy(this.jumpToUser, this),
        $.proxy(this.onPositionError, this),
        this.geoOpts);
      }, this));
    
    this.startWatching();
  
    
  } else {
    //TODO: alert user that browser doesn't support geolocation
    wspApp.map.panels.message.open({error: "Your browser doesn't support geolocation"});
  }
};


wsp.LocationControl.prototype.startWatching = function() {
  //start this control listening for position changes
    this.watchID = navigator.geolocation.watchPosition(
      $.proxy(this.onPositionUpdate, this),
      $.proxy(this.onPositionError, this),
      this.geoOpts
    );
};

wsp.LocationControl.prototype.jumpToUser = function(position) {
  console.log("jumptouser '" + this.watchID + "'");
  this.suppressErrorMessage = true;
  //relies on HTML5
  var pos = new google.maps.LatLng(position.coords.latitude,
                                    position.coords.longitude);
    wspApp.baseMap.setCenter(pos);
    
  this.setUserLocation({
    position: {lat: position.coords.latitude,
              lng: position.coords.longitude},
    moveMap: true
    });
    
    if (!this.isWatching) {
      this.startWatching();
    }
  
    
};

wsp.LocationControl.prototype.setUserLocation = function (opts) {
  opts = opts || {};
  if (opts.position) {
    this.userLocation.setPosition(opts.position);
    //TODO: re-arrange setMap so it only needs to be called once
    this.userLocation.setMap(wspApp.baseMap);
    
    if (opts.moveMap) {
      wspApp.baseMap.setCenter(opts.position);
    }
  }
  
  
};

wsp.LocationControl.prototype.onPositionUpdate = function (position) {
  var s = "watch position: " + position.coords.latitude + "," + position.coords.longitude;
  console.log(s);
  this.isWatching = true;
  
  this.setUserLocation({position: {lat: position.coords.latitude,
    lng: position.coords.longitude}});
    
};

wsp.LocationControl.prototype.onPositionError = function (error) {
  var msg = "";
  switch(error.code) {
    case error.PERMISSION_DENIED:
      msg = "It appears that you have denied permission for this " +
      "site to access your location.  If you would like to change this, please " +
      "change your settings to allow your browser to share location for this site.";
      break;
    case error.POSITION_UNAVAILABLE:
      msg ="Sorry, this device is having (hopefully temporary) trouble finding " +
        "your location.  Please try again later.";
      break;
    case error.TIMEOUT:
      msg = "The request to get user location timed out." + error.message;
      break;
    default:
      msg = "An unknown error occurred." + error.message;
      break;
  }
  
  console.log(msg);
  if (!this.suppressErrorMessage) {
    wspApp.map.panels.message.open({error: msg});
    this.suppressErrorMessage = true;
  }
  
  
};