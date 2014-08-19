/*jslint browser:true */
/*global  wsp, google, console*/
"use strict";


wsp.Map = function () {

  //following are the private variables for Map
  this.dataUrl = "data/";
       
  var that = this;
  function selfInit() {
    //set up default visibilities
    var sm = that.storageManager;
    var val = sm.get(sm.keys.showLocation);
    //if val is null, go with default, which is true
    val = (val === null) ? true : val;
    that.setUserLocationDisplay(val);
    
    //do the same for minetta creek, though the default is false
    val = sm.get(sm.keys.showMinetta);
    val = (val === null) ? false : val;
    that.setCreekDisplay(val);

    val = sm.get(sm.keys.user);
    //what will have been saved is the attributes, not functions.  easier to
    //just create a new user than to bother serializing the function
    if (val) {
      that.setUser(new wsp.User({dbUser: {id: val.id,
        displayName: val.displayName,
        username: val.username,
        privileges: val.privileges}}));
    }
    
  };

  this.locationControl = null;
  this.symbolManager = new wsp.SymbolManager();
  this.storageManager = new wsp.StorageManager();
  //this.trees = [];
  //this.taxa = {}; //want "hashtable" not array
  this.taxa = new wsp.TaxonList(); //want "hashtable" not array
  this.user = null; //set if user logs in
  
  this.panels = {};
  this.panels.settings = new wsp.SettingsPanel("settings-panel");
  this.panels.displayTree = new wsp.DisplayTreePanel("tree-info-panel");
  this.panels.editTree = new wsp.EditTreePanel("tree-edit-panel");
  this.panels.login = new wsp.LoginPanel("login-panel");
  this.panels.message = new wsp.MessagePanel("message-panel");
  this.panels.addTaxon = new wsp.AddTaxonPanel("add-taxon-panel");

  //set up location control this after panels are set up
  this.locationControl = new wsp.LocationControl(this);

  
  //set up marker clusterer
  this.markerClusterer = new MarkerClusterer(wspApp.baseMap, null, 
    {maxZoom: 19,
    gridSize: 40,
    styles: [
      {url: "images/cluster-24.png", height: 24, width: 24},
      {url: "images/cluster-32.png", height: 32, width: 32},
      {url: "images/cluster-48.png", height: 48, width: 48}
      //{url: "images/tree-icon-32.png", height: 32, width: 32},
      //{url: "images/tree-icon-48.png", height: 48, width: 48}
      ]
    });
  
  $("#user-settings").click($.proxy(function(){
    this.panels.settings.open();    
  }, this));

  this.listener = new wsp.TapholdListener(wspApp.baseMap, {context: this});
  google.maps.event.addListener(this, "taphold", function(e) {
    //a taphold by a user with privilege allows a tree to be added.
    //note that we add the tree on the mouseup following the taphold because
    //adding it in the taphold event caused some funky issues on the ensuing
    //mouseup (the newly-created marker would receive the mouseup and for some
    //reason the mouse would be stuck over it until another click would free it)
    //I suspect this has something to do with timing and google events.  Can
    //look into it more later when I have more time...for now, the following
    //mouseup workaround is okay
    
    //called when user does a taphold on the map
    this.hadTap = this.user && this.user.hasPrivilege(wsp.UserPrivilege.ADD_TREE);
    
  });
  google.maps.event.addListener(this, "mouseup", function(e) {
    //called when user does a taphold on the map
    
    if(this.hadTap) {
      console.log("adding tree on mouse up");
      var t = new wsp.Tree({
        position: {lat: e.latLng.lat(), lng: e.latLng.lng()},
        map: wspApp.baseMap,
        taxonId: 1, //should be unknown
        dbh: 0
      });
      t.save();

      //this.trees.push(t);
      t.onMouseUp(); //open info panel
      
      
    }
    
    this.hadTap = false;
  });
  
  this.requestTrees = function () {
    //var jqxhr = $.ajax({url: googleDocUrl.replace("[WORKSHEETID]", treeWorksheetId),
    var jqxhr = $.ajax({url: this.dataUrl,
                        data: {verb: "get", noun: "tree", dbhmin: 0, dbhmax: 100},
                        dataType: "json",
                        context: this})    
        .done(function(data){
          var i = 0;
          var marker  = null;
          var tree = null;
          for (i = 0; i < data.trees.length; i++) {
            tree = data.trees[i];

            var t = new wsp.Tree({
              position: {lat: tree.lat, lng: tree.lng},
              map: wspApp.baseMap,
              taxonId: tree.taxonId,
              dbh: tree.dbh,
              id: tree.id              
            });
            
            //this.trees.push(t);
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
          var t = null;
          for (i = 0; i < data.taxa.length; i++) {
            //this.taxa[data.taxa[i].id] = new wsp.Taxon({dbTaxon: data.taxa[i]});
            t = new wsp.Taxon({dbTaxon: data.taxa[i]});
            this.taxa.addTaxon(t);
            this.symbolManager.updateSymbols(t);
          }
          
          this.taxa.sort(); //after all have been added
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
            console.log("Error: " + jqXHR.responseJSON.error);
          } else {
            console.log("Error: " + errorThrown);
          }
                    
          
        });
    
  };

  /*call to set visibility of user location*/
  this.setUserLocationDisplay = function(displayUser) {
    this.locationControl.setVisibility(displayUser);
  };
  
  /*call to set visibility of Minetta Creek overlay*/
  this.setCreekDisplay = function(displayCreek) {
    console.log("need to set creek display to " + displayCreek);
  };

  /*Call to update the logged-in user*/
  this.setUser = function(user) {
    this.storageManager.set(this.storageManager.keys.user, user);
    this.user = user;
  };
  
  selfInit();
}; //wsp.Map


/*Gets and sets info from localStorage */

wsp.StorageManager = function () {
  //use these keys instead of the same string sprinkled throughout code
  this.keys = {
    showLocation: {name: "show-location"},
    showMinetta: {name: "show-minetta"},
    user: {name: "logged-in-user", session: true} //save user in session, not local
    };
};

/*saves data to storage
example: set(storageManager.keys.showLocation, "true")
*/
wsp.StorageManager.prototype.set = function(key, obj) {
  var storage = (key.session) ? window.sessionStorage : window.localStorage;
  
  if (storage) {
    storage.setItem(key.name, JSON.stringify(obj));
  }
};

/*gets data from storage
*/
wsp.StorageManager.prototype.get = function(key) {
  var obj = null;
  var storage = (key.session) ? window.sessionStorage : window.localStorage;
  if (storage) {
    obj = JSON.parse(storage.getItem(key.name));
  }
  
  return obj;
};



wsp.SymbolManager = function () {
  var symbols_  = {};
  
  /*
    returns symbol for given tree based on taxon and dbh.  
    Creates a new symbol if one doesn't already exist
    */
  this.getSymbol = function(tree) {
    //first check to see if we've already stored that taxon
    var t = symbols_[tree.taxonId] || {};
    
    //color might be set to null or to 0, but if it's undefined need to look up
    if (t.color === undefined) {
      symbols_[tree.taxonId] = t;
      var tax = wspApp.map.taxa.getTaxon(tree.taxonId);
      //taxon may not yet be defined;
      t.color = (tax) ? tax.color : null; //set to a default
      
    }
  
    t.symbols = t.symbols || {};
  
    //don't need a new symbol for each separate dbh.  group dbh by adjusting
    //it a little.
    var dbh = tree.dbh + 1; //in case of zero, still want to display
    dbh = Math.ceil(dbh / 5); //group into intervals.  play with this number
  
    var symbol = t.symbols[dbh]; //may be undefined
    
    //add new
    if (!symbol) {
      
      //if color is null, draw a black circle with no fill
      var fo = (t.color === null) ? 0 : 1;
      var c = (t.color === null) ? "black" : "#" + t.color;
      
      symbol = {
        trees: [], //will store the trees that use symbol
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: fo,
        fillColor: c,
        strokeOpacity: 1.0,
        strokeColor: c,
        strokeWeight: 1.0,
        scale: dbh + 2
      };

      t.symbols[dbh] = symbol;
      
    }
    //TODO: remove tree from symbol.trees if it exists
    
    //symbol knows which trees use it in case need to update if symbol changes
    symbol.trees.push(tree); 

    
    return symbol;
    
  };
  
  /*
    Should have taxon info before we get info about trees (and thus, need to
    display markers for them).  However, it's possible that tree info will arrive
    back from server first.  Instead of waiting, will draw default symbols for
    those taxa.  When taxon then arrives, want to update to appropriate colors
  */
  this.updateSymbols = function(taxon) {
    //if this taxon has not been used for any symbols, no need to update
    var t = symbols_[taxon.id];
    if (t) {
      
      t.color = taxon.color;
      
      var syms = t.symbols;
      var i = 0;
      var s = null;
      var prop = null;
      var c = null;
      for (prop in syms) {
        if (syms.hasOwnProperty(prop)) {
          s = syms[prop];
          
          c = (t.color === null) ? "black" : "#" + t.color;
          s.fillOpacity = 1;
          s.fillColor = c;
          s.strokeColor = c;          
          
          for (i=0; i < s.trees.length; i++) {
            s.trees[i].marker.setIcon(s);
          }

        }
      }

    }
    
  };
  
};

wsp.Tree = function (opts) {
  opts = opts || {};
  this.id = opts.id || -1;
  this.taxonId = opts.taxonId || "unknown";
  this.dbh = opts.dbh || 0 ; //if null, change to 0
  this.position = opts.position;
  this.isMovable = false;
  
  if (this.position) {
    //must create a marker on the map for the tree
    var symbol = wspApp.map.symbolManager.getSymbol(this);
    this.marker = new google.maps.Marker({
      //map: wspApp.baseMap,
      position: this.position,
      title: this.taxonId + " (" + this.dbh + " inches!)",
      //icon: "images/tree-icon-b.png",
      icon: symbol,
      draggable: false,
      
      //easy way for marker to know about tree when it is clicked on - avoids
      //need to change context later on
      tree: this
    });
        
    //TO-DO: change marker stuff - this is just to test clusterer
    wspApp.map.markerClusterer.addMarker(this.marker);
        
  }
  
  this.title = "Tree: " + this.taxonId; //tmp
  
  this.listener = new wsp.TapholdListener(this.marker, {context: this});
  google.maps.event.addListener(this, "taphold", this.onTapHold);
  google.maps.event.addListener(this, "mouseup", this.onMouseUp);
  
};

/*indicates whether a tree can be dragged or not*/
wsp.Tree.prototype.setMovable = function (isMovable) {
  if (this.marker) {
    var icon = (isMovable) ? null : wspApp.map.symbolManager.getSymbol(this);
    this.isMovable = isMovable;
    this.marker.setDraggable(isMovable);
    this.marker.setIcon(icon); //want default marker
    //then, after it drags, change it back and save it
  
  }

};

/*
  Called when user clicks on a tree's marker or when user let's go of dragged marker
*/
wsp.Tree.prototype.onMouseUp = function () {
    
  //if not movable, then open display panel
  //if movable, then save, update (and open?)
  if (this.isMovable) {
    this.setMovable(false);
    var newVals = {};
    var pos = this.marker.getPosition();
    newVals.position = {lat: pos.lat(), lng: pos.lng()};
    this.save(newVals)
      .fail(function(){
        //need to move marker back to position
        this.marker.setPosition(this.position);
      });
  } else {
    wspApp.map.panels.displayTree.open({base: this});
  }
};
/*
  Called when user taps and holds (long clicks) on a tree's marker
*/
wsp.Tree.prototype.onTapHold = function () {
  var user = wspApp.map.user;
  if (!this.isMovable && user && user.hasPrivilege(wsp.UserPrivilege.UPDATE_TREE)) {
    this.setMovable(true);
  } else if (this.isMovable && user && user.hasPrivilege(wsp.UserPrivilege.DELETE_TREE)) {
    //ask if user wants to delete
    //at this point we have a small issue to contend with, which is that the map
    //has decided to start dragging the marker, which it will begin doing as soon
    //as user releases mouse.  can set draggable to false, but doing so at this
    //point can fix the icon but make the map behave as if it is still dragging
    //it (the mouse pointer is a closed hand, and it's fixed near the icon as
    //if it were dragging it, but of course the marker can't move).
    //one solution would be to delete on a double click (or something other event)
    //for now, the solution is simply to set the map to null, which seems to
    //get around the dragging problem.  Then put it back after if user cancels
    
    this.marker.setMap(null);
    
    if (confirm("Are you sure you wish to delete this tree?")) {
      this.remove();
      
    } else {
      this.marker.setMap(wspApp.baseMap);
    }
  }
  
  
};

/*Saves current self to database.  returns jqXHR object
  input parameter is new values to save to - may differ from current values.
  On success, tree will update self to those values
*/
wsp.Tree.prototype.save = function(vals) {
  vals = vals || {};
  vals.position = vals.position || {}
  //dbh = 0 will return false, so special check it.  other vals won't be 0
  vals.dbh = (vals.dbh === undefined) ? this.dbh : vals.dbh;
  //if tree doesn't have an id, want to add a new tree
  var verb = (this.id === -1) ? "add" : "update";
  var jqxhr = $.ajax({url: wspApp.map.dataUrl,
                      data: {verb: verb, noun: "tree",
                      treeid: this.id,
                      taxonid: vals.taxonId || this.taxonId,
                      dbh: vals.dbh || this.dbh,
                      lat: vals.position.lat || this.position.lat,
                      lng: vals.position.lng || this.position.lng},
                      dataType: "json",
                      context: this})
    .done(function(data) {
      //update self to data
      this.id = data.tree.id;
      this.taxonId = data.tree.taxonId;
      this.dbh = data.tree.dbh;
      this.position = {lat: data.tree.lat, lng: data.tree.lng};  
      
      //symbol may well neet to be changed
      this.marker.setIcon(wspApp.map.symbolManager.getSymbol(this));

      
    });
  return jqxhr;

};


/*
  Deletes given tree from database.  "delete" is keyword, so use this instead
*/
wsp.Tree.prototype.remove = function () {
  var user = wspApp.map.user;
  if (user && user.hasPrivilege(wsp.UserPrivilege.DELETE_TREE)) {
    $.ajax({url: wspApp.map.dataUrl,
          data: {verb: "delete", noun: "tree",
            treeid: this.id},
          dataType: "json",
          context: this})    
    .done(function(data){
      google.maps.event.clearInstanceListeners(this);
      this.listener.remove();
      this.listener = null;
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      console.log("TODO: display error message for deleted tree!");
    });

  }
};



/*Class representing a taxon.*/
wsp.Taxon = function (opts) {
  opts = opts || {};
  opts.dbTaxon = opts.dbTaxon || {};
  this.id = opts.dbTaxon.id || -1;
  this.genus = opts.dbTaxon.genus || null;
  this.species = opts.dbTaxon.species || null;
  this.common = opts.dbTaxon.common || "*unknown*";
  this.color = opts.dbTaxon.color;
  
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

/*
  class that allows taxa to be accessed either by id or sorted by name
*/
wsp.TaxonList = function () {
  this.dataHash = {};
  this.dataArray = [];
};

wsp.TaxonList.prototype.addTaxon = function(t, opts) {
  opts = opts || {};
  
  this.dataHash[t.id] = t;
  this.dataArray.push(t);
  
  if (opts.sort) {    
    this.sort();
  }
};

/*
  Returns taxon with given id.  May return null or undefined
*/
wsp.TaxonList.prototype.getTaxon = function(id) {
  return this.dataHash[id];
};

/*
  Sorts internal array of taxon
*/
wsp.TaxonList.prototype.sort = function() {
  this.dataArray.sort(function (a,b) {
    //if a comes first, return -1
    //if b comes first, return 1
    //if equal return 0
    var r = 0;
    
    if (a.sciName < b.sciName) {
      r = -1;
    } else if (b.sciName < a.sciName) {
      r = 1;
    }
    
    return r;
    
  });
  

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
  DELETE_TAXON: 9,
  ADD_COMMENT: 10,
  UPDATE_COMMENT: 11,
  DELETE_COMMENT: 12
};


/*
  a custom control that centers map on user.  Geolocation relies on HTML5 and
  no attempt is made for workarounds if not supported by browser
*/
wsp.LocationControl = function(map) {
  this.map = map;
  this.baseMap = wspApp.baseMap;

  if (window.navigator && navigator.geolocation) {
    this.indexInMap = -1; //where in google map's control array this control is
    this.geoOpts = {enableHighAccuracy: true, maximumAge: 100, timeout: 4000};

    var controlUI = $("<div></div>").addClass("lc-content ui-corner-all")
      .prepend('<img src="images/target-40.png" />')
      .click($.proxy(function() {
        this.suppressErrorMessage = false; //want user to get possible error message
        navigator.geolocation.getCurrentPosition(
          $.proxy(this.jumpToUser, this),
          $.proxy(this.onPositionError, this),
          this.geoOpts);
      }, this));
  
  
    this.containerDiv = $("<div></div>")
      .addClass("lc-container")
      .attr("index", 1)
      .append(controlUI);
      
    
    this.userSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: .75,
      fillColor: "blue",
      strokeOpacity: 1.0,
      strokeColor: "blue",
      strokeWeight: 1.0,
      scale: 5.0
    };
    
    this.userLocation = new google.maps.Marker({
      clickable: false,
      icon: this.userSymbol
    });

    
    this.accuracyCircle = new google.maps.Circle({
      //will set map and position once we know position
      clickable: false,
      fillColor: "blue",
      strokeColor: "blue",
      strokeWeight: .5, //pixels
      strokeOpacity: 0.5,
      fillOpacity: 0.09,
      radius: 10 //meters - will be changed on updates
    });
    

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

    
    this.startWatching();
  
    
  } else {
    //TODO: alert user that browser doesn't support geolocation
    var s = "Your browser doesn't support geolocation.  You can still use this map" +
      " but you won't be able to see where you are located.";
    this.map.panels.message.open({error: s});
  }
};

/*set whether or not can see this control (user dot and control icon)*/
wsp.LocationControl.prototype.setVisibility = function (isVisible) {
  this.baseMap = (isVisible) ? wspApp.baseMap : null;
  this.userLocation.setMap(this.baseMap);
  this.accuracyCircle.setMap(this.baseMap);
  
  //add or remove display div from map's set of controls
  if (isVisible && (this.indexInMap) === -1) {
    //pushign returns the length of array; subtract one to get index
    this.indexInMap =
      wspApp.baseMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.containerDiv[0]) -1;
  } else if (!isVisible && (this.indexInMap > -1)) {
    //want to hide.  use wspApp.baseMap b/c this.baseMap is null at this point
    wspApp.baseMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].removeAt(this.indexInMap);
    this.indexInMap = -1;
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
    this.accuracyCircle.setCenter(opts.position);
    this.accuracyCircle.setRadius(opts.accuracy);
    //TODO: re-arrange setMap so it only needs to be called once
    //this.userLocation.setMap(this.baseMap);
    //this.accuracyCircle.setMap(this.baseMap);
    
    if (opts.moveMap && this.baseMap) { //basemap may be null, so don't jump
      this.baseMap.panTo(opts.position);
    }
  }
  
  
};

wsp.LocationControl.prototype.onPositionUpdate = function (position) {
  var s = "watch position: " + position.coords.latitude + "," + position.coords.longitude;
  console.log(s);
  
  this.isWatching = true;
  
  this.setUserLocation({position: {lat: position.coords.latitude,
    lng: position.coords.longitude}, accuracy: position.coords.accuracy});
    
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
  
  //console.log(msg);
  if (!this.suppressErrorMessage) {
    this.map.panels.message.open({error: msg});
    this.suppressErrorMessage = true;
  }
  
  
};


/*
  Handles comments.  Does ajax work instead of having comment objects do it
  panel is panel that holds the manager
*/
wsp.CommentManager = function(panel) {
  this.comments = [];
  this.panel = panel;
  this.commentDiv = this.panel.domPanel.find(".comments"); //save so not always getting
  this.curTree = null;
  
  //this is an input comment that always displays at beginning of comment list
  //if current user has permission to add comment
  this.newComment = null;
  
};

/*
  Called to create a new comment or update an existing one.
  
*/
wsp.CommentManager.prototype.saveComment = function (comment) {
  
  if (comment.text) {
    //adding or updating depends on whether comment has an id
    var verb = (comment.id) ? "update" : "add";
    var uid = (wspApp.map.user) ? wspApp.map.user.id : -1;
    
    $.ajax({url: wspApp.map.dataUrl,
            data: {verb: verb, noun: "observation",
              observationid: comment.id, //will be null for add
              comments: comment.text,
              treeid: comment.treeId || this.curTree.id},
            dataType: "json",
            context: this})    
    .done(function(data){
    
      if (verb === "add") {
        this.add(new wsp.Comment(this, {dbComment: data.observation}));
        
      } else {
        comment.refresh(); //just update back to display
      }
      
      //reset new comment in case we just added a new comment
      this.newComment.text = null;
      this.newComment.refresh();
      //$("#map-page").trigger("create");
       	

      
    
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      this.panel.ajaxFail(jqXHR, textStatus, errorThrown);
    });
  
  } else {
    this.panel.ajaxFail(null, null, "Please add a comment before saving");
  }
  
};

/*
  Deletes given comment from database
*/
wsp.CommentManager.prototype.deleteComment = function (comment) {
  $.ajax({url: wspApp.map.dataUrl,
        data: {verb: "delete", noun: "observation",
        observationid: comment.id},
        dataType: "json",
        context: this})    
  .done(function(data){
    this.remove(comment);
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    this.panel.ajaxFail(jqXHR, textStatus, errorThrown);
  });

  
};

/*
  Requests comments for given tree and loads to internal list
*/
wsp.CommentManager.prototype.load = function (tree) {
  
  //only need to request comments from database if this is a new tree - otherwise,
  //have already made the request.
  if (!this.curTree || (this.curTree.id !== tree.id)) {  
    this.curTree = tree;
    this.clear(); //first remove existing

    this.newComment = new wsp.Comment(this);
    this.add(this.newComment);
    
    
    $.ajax({url: wspApp.map.dataUrl,
            data: {verb: "get", noun: "observation",
            treeid: tree.id},
            dataType: "json",
            context: this})    
    .done(function(data){
    
      var i = 0;
      for (i = 0; i < data.observations.length; i++) {
        this.add(new wsp.Comment(this, {dbComment: data.observations[i]}));
      }
    
      //for whatever reason, just calling refresh on the listview doesn't
      //seem to enhance newly-added list items.  Need to trigger the whole page
      $("#map-page").trigger("create");
    
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      this.panel.ajaxFail(jqXHR, textStatus, errorThrown);
    });

    
  }
};

/*
  Removes existing comments and listeners
*/
wsp.CommentManager.prototype.clear = function () {
  var i = 0,
    l = this.comments.length;
  for (i=0; i < l; i++) {
    this.comments[i].remove();
  }
  this.comments = [];
  
  //this.panel.domPanel.find(".comments").empty();
};


/*
  Adds given comment to internal list
*/
wsp.CommentManager.prototype.add = function (comment) {
  this.comments.push(comment);
  
  if (this.commentDiv.children().length > 0 ) {
    //have already put in the first "make new comment" comment, so add after it
    this.commentDiv.children().first().after(comment.refresh());
  } else {
    this.commentDiv.append(comment.refresh());
  }
  
  //this.panel.domPanel.find(".comments").prepend(comment.refresh());  
  
};

/*
  Removes given comment and listeners from internal list
*/
wsp.CommentManager.prototype.remove = function (comment) {
  //look through internal list for comment
  var i = 0, l = this.comments.length;
  for (i=0; i < l; i++) {
    if (this.comments[i].id === comment.id) {
      this.comments.splice(i, 1);
      i = l;//break from loop
    }
  }
  
  comment.remove();
};


/*
  An object that knows how to draw itself based on its state
*/
wsp.Comment = function(manager, opts) {
    //now the variables where we will save dom elements that get added/removed
   var display = {dom: null, user: null, date: null, text: null},
    edit = {dom: null, textDom: null, buttons: null};
    
  this.$li = null; //item that will hold display dom elements
  
  opts = opts || {};
  opts.dbComment = opts.dbComment || {};
  this.id = opts.dbComment.id || null;
  this.text = opts.dbComment.comments || null;
  this.date = opts.dbComment.dateCreated || null;
  this.treeId = opts.dbComment.treeId || null;
  //need both name and id because name is used for display and id is used for uniqueness
  //both refer to user who created comment
  this.username = opts.dbComment.username || null;
  this.userId = opts.dbComment.userId || null;

  /*
    updates self in DOM.   returns $li 
  */
  this.refresh = function(opts) {
    opts = opts || {};
    
    var allowEdit = opts.allowEdit || (this.id === null); //can edit a new comment
    if (!this.$li) {
      //need to create
      this.$li = $("<li>");

    }    
    
    //first remove children of li.  detach retains listeners and classes (as
    //opposed to .empty() which removes some of them) and appears to be able
    //to be called even if element is not currently part of dom.  if that
    //proves not to be the case, will need to check first before calling detach
    if (edit.dom) {
      edit.dom.detach();
    }
    if (display.dom) {
      display.dom.detach();
    }
    
    //now determine what type to display
    if (allowEdit) {
      //want an input box and submit/cancel (and maybe delete) buttons
      if (!edit.dom) {
        edit.dom = $("<div>")
          .addClass("comment-edit");
        
        edit.textDom = $("<textarea>")
          .addClass("comments")
          .attr("type", "text")
          .attr("placeholder", "Add a comment");

        edit.buttons = $("<div>")
          .addClass("ui-corner-all ui-mini")
          .attr("data-role", "controlgroup")
          .attr("data-type", "horizontal");

        edit.buttons.remove = $("<button>") //delete is a keyword
          .addClass("delete")
          .html("Delete")
          .on("click", $.proxy(function(){
            manager.deleteComment(this);
          }, this));

        
        edit.buttons.save = $("<button>")
          .addClass("save")
          .html("Save")
          .on("click", $.proxy(function(){
            //update text field
            this.text = edit.textDom.val();
            manager.saveComment(this);
          }, this));
          
        edit.buttons.cancel = $("<button>")
          .addClass("cancel")
          .html("Cancel")
          .on("click", $.proxy(function(){
            //want to go from editing to regular display
            this.refresh({allowEdit: false});
          }, this));

        
        //will always have submit.  not necessarily cancel and delete
        edit.buttons.append(edit.buttons.save);
                
        //now add them appropriately
        edit.dom.append(edit.textDom)
          .append(edit.buttons);
        
      }

      //at this point, dom elements exist and can add/remove/modify them as needed
      edit.textDom.val(this.text);
      
      //if comment isn't new, want to allow user to cancel editing and possibly delete
      var user = wspApp.map.user;
      var showCancel = this.id;
      
      var showDelete = showCancel && user &&
          ((user.id === this.userId) || (user.hasPrivilege(wsp.UserPrivilege.DELETE_COMMENT)));
      
      this.displayButton(edit.buttons.cancel, showCancel);
      this.displayButton(edit.buttons.remove, showDelete);
      
      this.$li.append(edit.dom);
      
    } else {
      //want to display info
      if (!display.dom) {
        display.dom = $("<div>")
          .addClass("comment-display")          
          .on("click", $.proxy(function(){
            //only open to allow edit if user has permissions
            var user = wspApp.map.user;
            if (user && ((user.id === this.userId) ||
                         (user.hasPrivilege(wsp.UserPrivilege.DELETE_COMMENT)))) {
              this.refresh({allowEdit: true});  
            }

            
            
          }, this));
        
        display.text = $("<div>")
          .addClass("comments");
        display.date = $("<div>")
          .addClass("date");
        display.user = $("<div>")
          .addClass("user");
      
        display.dom.append(display.user);
        display.dom.append(display.date);
        display.dom.append(display.text);
      }
      
      display.text.text(this.text);
      display.date.text(this.date);      
      display.user.text(this.username || "Anonymous");
      
      this.$li.append(display.dom);
      
    }
    
    if (!opts.suppressCreate) {
      $("#map-page").trigger("create");
    }
    
    return this.$li;
  };
    
  
  /*called to remove this comment from DOM*/
  this.remove = function () {
    if (this.$li) {
      this.$li.remove();
    }
  };
  
  /*takes a button and a boolean whether to display it or not and adds to
  dom or removes accordingly*/
  this.displayButton = function (button, display) {
    if (display && (!$.contains(edit.buttons[0], button))) {
      //add
      //edit.buttons.append(button);
      edit.buttons.controlgroup().controlgroup("container").append(button);
    } else if (!display && ($.contains(edit.buttons[0], button))) {
      //remove
      edit.buttons.detach(button);
    }
    
  };
  
}; //end of Comment

/*
  A class that detects a taphold (or longclick).  Adapted from code on stackoverflow
  object is the item that can be clicked (e.g. marker or map)
  opts are optional options
*/
wsp.TapholdListener = function (object, opts) {
  this.opts = opts || {};
  this.opts.context = opts.context || object; //can change context for triggered events
  var that = this;
  this.time = opts.time || 1000; //milliseconds
  this.timeoutId = null;
  this.exceededTime = false;
  this.object = object;
  //add listenere
  google.maps.event.addListener(object, "mousedown", function(e) {
    that.onMouseDown(e);
  });
  google.maps.event.addListener(object, "mouseup", function(e) {
    that.onMouseUp(e);
  });
  google.maps.event.addListener(object, "drag", function(e) {
    that.onDrag(e);
  });
  
};

wsp.TapholdListener.prototype.onMouseDown = function(e) {
 //clear timeout, then start a new one
  this.exceededTime = false;
  clearTimeout(this.timeoutId);  
  this.timeoutId = setTimeout($.proxy(function() {
    this.exceededTime = true;
    google.maps.event.trigger(this.opts.context, "taphold", e);
  }, this), this.time);
};
wsp.TapholdListener.prototype.onMouseUp = function(e) {
  //clear timeout and check if we had a simple click
  clearTimeout(this.timeoutId);
  google.maps.event.trigger(this.opts.context, "mouseup", e);
  
};
wsp.TapholdListener.prototype.onDrag = function(e) {
  //clear timeout - don't want drag to be part of long click
  clearTimeout(this.timeoutId);
};

/*clears listeners and tidies up*/
wsp.TapholdListener.prototype.remove = function () {
  clearTimeout(this.timeoutId);
  google.maps.event.clearInstanceListeners(this.object);
  this.object = null;
};