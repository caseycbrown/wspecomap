/*jslint browser:true */
/*global  wsp, google, console*/
"use strict";

/*Application is what is running and holds map, pages, etc.
  It's a little ugly right now because of how the code evolved - would be ideal
  to have map be initialized right away but instead it waits until the 
  google map loads and then map is set elsewhere.  Should change that around someday
  But the map is so tightly integrated with the google map that it can't do
  much without it

*/
wsp.Application = function () {
  this.map = null;
  this.user = null;

  //set init val for user
  var val = this.getSetting(this.Settings.user);
  //what will have been saved is the attributes, not functions.  easier to
  //just create a new user than to bother serializing the functions
  if (val) {
    this.user = new wsp.User({dbUser: {id: val.id,
      username: val.username,
      email: val.email,
      displayName: val.displayName,
      firstName: val.firstName,
      lastName: val.lastName,
      postalCode: val.postalCode,
      privileges: val.privileges}});
  }
  
};

wsp.Application.prototype.Settings = {
  showLocation: {name: "show-location"},
  showMinetta: {name: "show-minetta"},
  showViele: {name: "show-viele"},
  showHistoricWSP: {name: "show-historic-wsp"},
  user: {name: "logged-in-user", session: true}, //save user in session, not local
  layers: {name: "visible-layers"} //save the ids that are to be visible
};

wsp.Application.prototype.Constants = {
  DEFAULT_LAYER_ID: 1, //unlikely to change in database, but possible
  DATA_URL : "data/" //for ajax requests
};


/*
  returns setting indicated by key
*/
wsp.Application.prototype.getSetting = function (setting) {
  var obj = null;
  var storage = (setting.session) ? window.sessionStorage : window.localStorage;
  if (storage) {
    obj = JSON.parse(storage.getItem(setting.name));
  }
  return obj;

};

/*
  Saves given object in setting (a wsp.Application.Settings) .
  stores in storage and may also take additional action
*/
wsp.Application.prototype.setSetting = function (setting, obj) {
  var storage = (setting.session) ? window.sessionStorage : window.localStorage;
  
  if (storage) {
    storage.setItem(setting.name, JSON.stringify(obj));
  }
  //now take additional action to update current state of program
  switch (setting) {
    case this.Settings.showLocation:
      if (this.map) {
        this.map.locationControl.setVisibility(obj);
      }
      break;
    case this.Settings.showMinetta:
      if (this.map) {
        this.map.minettaOverlay.setVisibility(obj);
      }
      break;
    case this.Settings.showViele:
      if (this.map) {
        //set map to basemap or to null
        this.map.vieleOverlay.setMap(obj ? this.map.baseMap : null);
      }
      break;
    case this.Settings.showHistoricWSP:
      if (this.map) {
        //set map to basemap or to null
        this.map.historicParkOverlay.setMap(obj ? this.map.baseMap : null);
      }
      break;
    case this.Settings.user:
      this.user = obj;
      if (this.map) {
        this.map.optionMenu.onLoginChange(this.user);
      }
      break;
    case this.Settings.layers:
      if (this.map) {
        this.map.layerManager.setVisibleLayers(obj);
      }
      break;
    default:
      //do nothing
  }
  
};

/*Create a new map, passing a google maps baseMap*/
wsp.Map = function (baseMap) {
  wspApp.map = this; //this is a little hokey but quick and dirty way for
  
  this.baseMap = baseMap;
  var that = this;
  function selfInit() {
    //set up default settings.
    var settings = wspApp.Settings;
    var val = wspApp.getSetting(settings.showLocation);
    val = (val === null) ? true : val; //show location by default
    wspApp.setSetting(settings.showLocation, val); //set in case it wasn't
    
    //do the same for minetta brook and viele historical, though the default is false
    val = wspApp.getSetting(settings.showMinetta);
    val = (val === null) ? false : val;
    wspApp.setSetting(settings.showMinetta, val);

    val = wspApp.getSetting(settings.showViele);
    val = (val === null) ? false : val;
    wspApp.setSetting(settings.showViele, val);
    val = wspApp.getSetting(settings.showHistoricWSP);
    val = (val === null) ? false : val;
    wspApp.setSetting(settings.showHistoricWSP, val);

    that.optionMenu.onLoginChange(wspApp.user); //update menu
    
    //set visible layers.  by default, turn on only default layer
    val = wspApp.getSetting(settings.layers) || [wspApp.Constants.DEFAULT_LAYER_ID];
    
    wspApp.setSetting(settings.layers, val);
    
  };
  
  this.locationControl = null;
  this.symbolManager = new wsp.SymbolManager();
  //this.settings = {};
  //this.storageManager = new wsp.StorageManager();
  this.taxa = new wsp.TaxonList();
  this.layerManager = new wsp.LayerManager();
  this.user = null; //set if user logs in
  
  this.panels = {};
  this.panels.settings = new wsp.SettingsPanel("settings-panel");
  this.panels.displayTree = new wsp.DisplayTreePanel("tree-info-panel");
  this.panels.editTree = new wsp.EditTreePanel("tree-edit-panel");
  this.panels.login = new wsp.LoginPanel("login-panel");
  this.panels.forgot = new wsp.ForgotPasswordPanel("forgot-panel");
  this.panels.register = new wsp.RegisterPanel("register-panel");
  this.panels.message = new wsp.MessagePanel("message-panel");
  this.panels.addTaxon = new wsp.AddTaxonPanel("add-taxon-panel");
  
  this.optionMenu = new wsp.OptionMenu(this.panels.login);
  
  this.minettaOverlay = new wsp.MinettaOverlay(this, this.panels.message);
  
  //sw and ne lat lng for bounds
  var b = new google.maps.LatLngBounds(new google.maps.LatLng(40.720906, -74.01543),
    new google.maps.LatLng(40.745824, -73.98689));
  
  this.vieleOverlay = new google.maps.GroundOverlay("images/viele-overlay.png", b, {
      map: that.baseMap,
      opacity: 1
  });

  b = new google.maps.LatLngBounds(new google.maps.LatLng(40.729582, -73.999625),
    new google.maps.LatLng(40.732208, -73.995613));
  
  this.historicParkOverlay = new google.maps.GroundOverlay("images/historic-wsp.png", b, {
      map: that.baseMap,
      opacity: 1
  });

  //settings panel needs to know when layers have arrived from server
  google.maps.event.addListener(this.layerManager, "layersloaded", function(layers){
    that.panels.settings.onLayersLoaded(layers);
  });
  
  //set up location control this after panels are set up
  this.locationControl = new wsp.LocationControl(this);

  
  //set up marker clusterer
  this.markerClusterer = new MarkerClusterer(this.baseMap, null, 
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
  
    
  this.listener = new wsp.TapholdListener(this.baseMap, {context: this});
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
    this.hadTap = wspApp.user && wspApp.user.hasPrivilege(wsp.UserPrivilege.ADD_TREE);
    
  });
  google.maps.event.addListener(this, "mouseup", function(e) {
    //called when user does a taphold on the map
    
    if(this.hadTap) {
      var t = new wsp.Tree({
        position: {lat: e.latLng.lat(), lng: e.latLng.lng()},
        map: this.baseMap,
        taxonId: 1, //should be unknown
        dbh: 0,
        layers: wspApp.getSetting(wspApp.Settings.layers) //belong to currently-visible layers
      });
      t.save()
        .fail(function(jqXHR, textStatus, errorThrown) {
          wspApp.map.panels.displayTree.ajaxFail(jqXHR, textStatus, errorThrown);
          wspApp.map.markerClusterer.removeMarker(t.marker);
          t.remove();
        });

      //this.trees.push(t);
      t.onMouseUp(); //open info panel
      
    }
    
    this.hadTap = false;
  });
  
  /*called to get trees, taxon, and layer info to start*/
  this.requestInitialData = function () {
    var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                        data: {verb: "get", noun: "initial-data", dbhmin: 13},
                        dataType: "json",
                        context: this})    
        .done(function(data){

  
          //trees should be loaded last because they use taxa and are added to layers
        
          this.taxa.onTaxaReceived(data.taxa);                    
          this.layerManager.onLayersReceived(data.layers);

          var that = this;
          //now load trees
          $.each(data.trees, function(index, tree) {
            var t = new wsp.Tree({
              position: {lat: tree.lat, lng: tree.lng},
              map: that.baseMap,
              taxonId: tree.taxonId,
              dbh: tree.dbh,
              id: tree.id,
              layers: tree.layers
            });
            
            that.layerManager.addTree(t);
          });

          //after trees are loaded, need to set which are visible
          this.layerManager.setVisibleLayers(wspApp.getSetting(wspApp.Settings.layers));
                    
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


/*class that lets map interact with layers*/
wsp.LayerManager = function () {
  this.layers = {};
  this.queuedTrees = [];
};

wsp.LayerManager.prototype.addLayer = function(layer) {
  this.layers[layer.id] = layer;
};


/*
  Takes an array of integers representing the ids of each layer that should
  be visible
*/
wsp.LayerManager.prototype.setVisibleLayers = function(visibleIds) {
  //simply pass the buck along to each layer
  $.each(this.layers, function(layerId, layer) {
    layer.setVisibility(visibleIds);
  });
  
  //may get called before map is fully loaded
  if (wspApp.map) {
    wspApp.map.markerClusterer.repaint();
  }
};


/*
  called when layers have been received from database
*/
wsp.LayerManager.prototype.onLayersReceived = function(jsonLayers) {  
  
  var that = this;
  $.each(jsonLayers, function(id, layer) {
    that.addLayer(new wsp.Layer({dbLayer: layer}));
  });
    
  //take all trees waiting to be added, and add them
  var i = 0;  
  for (i=0; i < this.queuedTrees.length; i++) {
    this.parseTree(this.queuedTrees[i], true);
  }
  
  //delete queue
  this.queuedTrees = null;
  
  //let any interested parties know that layers have been received
  google.maps.event.trigger(this, "layersloaded", this.layers);
};

/*
  called when trees have been received from database.  At setup all trees
  are retrieved from database and passed here.  It is the manager's job to sort
  them into appropriate layers
*/
wsp.LayerManager.prototype.addTree = function(tree) {
  if (this.queuedTrees) {
    this.queuedTrees.push(tree);
  } else {
    this.parseTree(tree, true);
  }
};

/*
  called when a tree has been deleted.  Need to remove from all layers that
  contain tree
*/
wsp.LayerManager.prototype.removeTree = function(tree) {
  this.parseTree(tree, false);
};

/*
  called when a tree's layers have changed.  Need to update which layers it
  belongs to
*/
wsp.LayerManager.prototype.updateTree = function(tree) {
  //simplest thing to do is first remove from all then add back in
  this.removeTree(tree);
  this.addTree(tree);
  tree.setVisibility(wspApp.getSetting(wspApp.Settings.layers));
  wspApp.map.markerClusterer.repaint();
};



/*
  takes a tree and adds or removes it from all layers that contain it or need to
*/
wsp.LayerManager.prototype.parseTree = function(tree, isAdd) {
  var i = 0;
  var layer = null;
  for (i=0; i < tree.layers.length; i++) {
    layer = this.layers[tree.layers[i]];
    if (layer) {
      if (isAdd) {
        layer.addTree(tree);
      } else {
        layer.removeTree(tree);
      }
    }
  }
  
};




/*object that represents some number of trees that are shown or hidden as a group*/
wsp.Layer = function (opts) {
  opts = opts || {};
  this.id = opts.dbLayer.id || -1;
  this.name = opts.dbLayer.name || "unknown";
  this.description = opts.dbLayer.description || "unknown";
  this.trees = {};
  this.isVisible = false;
};

/*adds a tree to layer*/
wsp.Layer.prototype.addTree = function(tree) {
  this.trees[tree.id] = tree;  
};

/*removes a tree from layer*/
wsp.Layer.prototype.removeTree = function(tree) {
  if (this.trees[tree.id]) {
    delete this.trees[tree.id];
  }
};

/*
  display or hide all trees in layer, depending on if this layer's id is
  contained in visibleIds.  The reason for using visibleIds instead of a boolean
  is because trees potentially belong to multiple layers and need to make a
  visibility determination themselves based on visibleIds - they can't be simply
  turned on or off by this layer.*/
wsp.Layer.prototype.setVisibility = function (visibleIds) {
  
  if (this.isVisible != ($.inArray(this.id, visibleIds) !== -1)) {
    
    this.isVisible = !this.isVisible;
    
    $.each(this.trees, function(treeId, tree) {
      tree.setVisibility(visibleIds);
    }); 
  }  
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
    symbols_[tree.taxonId] = t;
    t.symbols = t.symbols || {};
    
    //don't need a new symbol for each separate dbh.  group dbh by adjusting
    //it a little.
    var dbhGroup = tree.dbh + 1; //in case of zero, still want to display
    dbhGroup = Math.ceil(dbhGroup / 5); //group into intervals.  play with this number
    
    var symbol = t.symbols[dbhGroup]; //may be undefined
    if (!symbol) {
      symbol = new wsp.Symbol(tree, dbhGroup);
      t.symbols[dbhGroup] = symbol;
      t.color = symbol.color;
    }
    
    symbol.addTree(tree);
    
    return symbol;
    
  };
  
  /*removes tree from its symbol array*/
  this.removeTree = function(tree) {
    //need to first figure out which symbol contains given tree.
    var symbol = this.getSymbol(tree);
    symbol.removeTree(tree);
    
    //if there are no trees in symbol, can remove it from symbols object
    if (symbol.trees.length === 0) {
      console.log("no trees left using symbol");
      //TODO: remove.  not really a high priority
    }
    
    
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
      var s = null;
      var prop = null;
      for (prop in syms) {
        if (syms.hasOwnProperty(prop)) {
          s = syms[prop];
          s.update(taxon.color);
          
        }
      }

    }
    
  };
  
};

/*
  simple class that knows how to display a given tree
*/

wsp.Symbol = function (tree, dbhGroup) {
  this.trees = {};
  
  var tax = wspApp.map.taxa.getTaxon(tree.taxonId);
  //taxon may not yet be defined;
  this.color = (tax) ? tax.color : null; //set to a default
  
  this.dbhGroup = dbhGroup;

  //if color is null, draw a black circle with no fill
  var fo = (this.color === null) ? 0 : 1;
  var c = (this.color === null) ? "black" : "#" + this.color;
  
  this.markerSymbol = {
    path: google.maps.SymbolPath.CIRCLE,
    fillOpacity: fo,
    fillColor: c,
    strokeOpacity: 1.0,
    strokeColor: c,
    strokeWeight: 1.0,
    scale: this.dbhGroup + 2
  };

};

/*functions to add/remove a tree from a symbol allow it to keep track of 
  which trees use it in case that symbol's appearance is changed*/
wsp.Symbol.prototype.addTree = function(tree) {
  this.trees[tree.id] = tree;
};

wsp.Symbol.prototype.removeTree = function(tree) {
  if (this.trees[tree.id]) {
    delete this.trees[tree.id];
  }

};

/*called if a symbol should update self.  For now, can only update color*/
wsp.Symbol.prototype.update = function(color) {
  this.markerSymbol.fillColor = (color === null) ? "black" : "#" + color;
  this.markerSymbol.strokeColor = this.markerSymbol.fillColor;
  this.markerSymbol.fillOpacity = (color === null) ? 0 : 1;

  //now update every tree
  var trees = this.trees;
  var tid = null;
  for (tid in trees) {
    if (trees.hasOwnProperty(tid)) {
      trees[tid].setSymbol(this);
    }
  }
  
};



wsp.Tree = function (opts) {
  opts = opts || {};
  this.id = opts.id || -1;
  this.taxonId = opts.taxonId || "unknown";
  this.layers = opts.layers || [];
  this.dbh = opts.dbh || 0 ; //if null, change to 0
  this.position = opts.position;
  this.isMovable = false;
  this.isVisible = false;
    
  if (this.position) {
    //must create a marker on the map for the tree
    this.marker = new google.maps.Marker({
      position: this.position,
      icon: wspApp.map.symbolManager.getSymbol(this).markerSymbol,
      draggable: false,
      
      //easy way for marker to know about tree when it is clicked on - avoids
      //need to change context later on
      tree: this
    });
        
  }
  
  this.listener = new wsp.TapholdListener(this.marker, {context: this});
  google.maps.event.addListener(this, "taphold", this.onTapHold);
  google.maps.event.addListener(this, "mouseup", this.onMouseUp);
  
};

/*indicates whether a tree can be dragged or not*/
wsp.Tree.prototype.setMovable = function (isMovable) {
  if (this.marker) {
    var icon = (isMovable) ? null : wspApp.map.symbolManager.getSymbol(this).markerSymbol;
    this.isMovable = isMovable;
    this.marker.setDraggable(isMovable);
    this.marker.setIcon(icon); //want default marker
    //then, after it drags, change it back and save it
  
  }

};

wsp.Tree.prototype.setSymbol = function(symbol) {
  //dont' want to update marker if it's movable, because that means it is the default
  //google map icon.  it will query for latest symbol when it is moved and switches back
  if (this.marker && !this.isMovable) {
    this.marker.setIcon(symbol.markerSymbol);
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
  var user = wspApp.user;
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

    wspApp.map.markerClusterer.removeMarker(this.marker); //will set map to null

    if (confirm("Are you sure you wish to delete this tree?")) {
      this.remove();
      
    } else {
      //didn't mean to delete, so add back in
      wspApp.map.markerClusterer.addMarker(this.marker);
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
  
  //convert array to string
  vals.layers = (vals.layers === undefined) ? this.layers.toString() : vals.layers.toString();
  
  //if tree doesn't have an id, want to add a new tree
  var verb = (this.id === -1) ? "add" : "update";
  var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                      data: {verb: verb, noun: "tree",
                      treeid: this.id,
                      taxonid: vals.taxonId || this.taxonId,
                      dbh: vals.dbh,
                      layers: vals.layers,
                      lat: vals.position.lat || this.position.lat,
                      lng: vals.position.lng || this.position.lng},
                      dataType: "json",
                      context: this})
    .done(function(data) {
      //update self to data
      this.id = data.tree.id;
      this.taxonId = data.tree.taxonId;
      this.dbh = data.tree.dbh;
      this.layers = data.tree.layers;
      this.position = {lat: data.tree.lat, lng: data.tree.lng};
      
      wspApp.map.layerManager.updateTree(this);
      
      //symbol may well need to be changed
      this.marker.setIcon(wspApp.map.symbolManager.getSymbol(this).markerSymbol);

      
    });
  return jqxhr;

};


/*
  Deletes given tree from database.  "delete" is keyword, so use this instead
*/
wsp.Tree.prototype.remove = function () {
  var user = wspApp.user;
  if (user && user.hasPrivilege(wsp.UserPrivilege.DELETE_TREE)) {
    $.ajax({url: wspApp.Constants.DATA_URL,
          data: {verb: "delete", noun: "tree",
            treeid: this.id},
          dataType: "json",
          context: this})    
    .done(function(data){
      google.maps.event.clearInstanceListeners(this);
      this.listener.remove();
      this.listener = null;
      wspApp.map.symbolManager.removeTree(this);
      wspApp.map.layerManager.removeTree(this);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      //want to add marker back in
      wspApp.map.markerClusterer.addMarker(this.marker);
      console.log("TODO: display error message for deleted tree!");
    });

  }
};

/*
  display or hide tree, depending on if it belongs to a layer in visibleIds
*/
wsp.Tree.prototype.setVisibility = function (visibleIds) {
  //set visible to true of there is any overlap between tree's layers and visibleIds
  var intersect = $.map(this.layers, function(el){
    return $.inArray(el, visibleIds) < 0 ? null : el;
  });

  //if length is greater than 0, means we want to be visible
  if (this.isVisible != (intersect.length > 0)) {
    this.isVisible = !this.isVisible;
        
    if (this.isVisible) {
      wspApp.map.markerClusterer.addMarker(this.marker, true);
    } else {
      wspApp.map.markerClusterer.removeMarker(this.marker, true);
    }
    
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
  this.links = []; //will hold objects that have link info
  
  //need to have genus at least...species may be null
  var searchString = "";
  var usdaSymbol = "";
  var ufSymbol = "#";
  
  if (this.genus) {
    this.sciName = this.genus;
    searchString = this.genus;
    usdaSymbol = this.genus.substring(0,5);
    
    //now potentially add species - won't have species without genus
    if (this.species) {
      this.sciName += " " + this.species;
      searchString += "+" + this.species;
      usdaSymbol = this.genus.substring(0,2) + this.species.substring(0,2);
      
      //the uf horticulture listing has varieties differentiated starting with
      //letter "a" then "b", "c", etc.  Just use "a" for our purposes
      ufSymbol = this.genus.substring(0,3) + this.species.substring(0,3) + "a.pdf";
    }
    
    usdaSymbol = usdaSymbol.toUpperCase();

    //links need to have a name, which must match the class of the anchor
    //that uses the link in the tree info panel
    this.links.push({name: "usda-plants",
      url: "http://plants.usda.gov/core/profile?symbol=" + usdaSymbol});
    this.links.push({name: "google-image",
      url: "https://www.google.com/images?q=" + searchString});
    this.links.push({name: "wikipedia",
      url: "http://en.wikipedia.org/wiki/" + searchString.replace("+", "_")});
    //this is same link for all species
    this.links.push({name: "nyc-leaf-key",
      url: "http://www.nycgovparks.org/sub_your_park/trees_greenstreets/treescount/" +
        "2005_Census_Leaf_Key_Final.pdf"});
    //a pdf download
    this.links.push({name: "uf-hort",
      url: "http://hort.ifas.ufl.edu/database/documents/pdf/tree_fact_sheets/" +
        ufSymbol});
    
    /*some other potential link sources
    http://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?kempercode=j170
      * would need to look up kemper codes somewhere
    
    Lady Bird Johnson Native Plant Database
    http://www.wildflower.org/gallery/species.php?id_plant=QUAL
    this.links.push({name: "lbj-npd",
      url: "http://www.wildflower.org/plants/result.php?id_plant=" + usdaSymbol});

    
      * images
    this.links.push({name: "cal-photo",
      url: "http://calphotos.berkeley.edu/cgi/img_query?rel-taxon=contains&where-taxon=" +
        searchString});

      
    silvics manual
    http://www.na.fs.fed.us/spfo/pubs/silvics_manual/volume_2/acer/rubrum.htm
      * need to differentiate between conifers and hardwoods
    
    */
    
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
  
  //update any symbols that may be using that taxon
  wspApp.map.symbolManager.updateSymbols(t);
  
  if (opts.sort) {    
    this.sort();
  }
};

/*takes json data from database and builds list*/
wsp.TaxonList.prototype.onTaxaReceived = function (jsonTaxa) {

  var that = this;
  $.each(jsonTaxa, function(index, taxon) {
    that.addTaxon(new wsp.Taxon({dbTaxon: taxon}));    
  });

  this.sort(); //after all have been added
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
  this.email = opts.dbUser.email;
  this.displayName = opts.dbUser.displayName;
  this.firstName = opts.dbUser.firstName;
  this.lastName = opts.dbUser.lastName;
  this.postalCode = opts.dbUser.postalCode;
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
  MODIFY_USER: 1,  //modify users other than self
  ADD_TREE: 2,
  UPDATE_TREE: 3,
  DELETE_TREE: 4,
  ADD_TAXON: 5,
  ADD_COMMENT: 6,
  MODIFY_COMMENT: 7
};


/*
  a custom control that centers map on user.  Geolocation relies on HTML5 and
  no attempt is made for workarounds if not supported by browser
*/
wsp.LocationControl = function(map) {
  this.map = map;
  this.baseMap = map.baseMap;

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
  this.baseMap = (isVisible) ? this.map.baseMap : null;
  this.userLocation.setMap(this.baseMap);
  this.accuracyCircle.setMap(this.baseMap);
  
  //add or remove display div from map's set of controls
  if (isVisible && (this.indexInMap) === -1) {
    //pushign returns the length of array; subtract one to get index
    this.indexInMap =
      this.map.baseMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.containerDiv[0]) -1;
  } else if (!isVisible && (this.indexInMap > -1)) {
    //want to hide.  use this.map.baseMap b/c this.baseMap is null at this point
    this.map.baseMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].removeAt(this.indexInMap);
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
  //console.log("jumptouser '" + this.watchID + "'");
  
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
    
    if (opts.moveMap && this.baseMap) { //basemap may be null, so don't jump
      this.baseMap.panTo(opts.position);
    }
  }
  
  
};

wsp.LocationControl.prototype.onPositionUpdate = function (position) {
  var s = "watch position: " + position.coords.latitude + "," + position.coords.longitude;
  //console.log(s);
  
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
    var uid = (wspApp.user) ? wspApp.user.id : -1;
    
    $.ajax({url: wspApp.Constants.DATA_URL,
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
  $.ajax({url: wspApp.Constants.DATA_URL,
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
    
    
    $.ajax({url: wspApp.Constants.DATA_URL,
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
    edit = {dom: null, textArea: null, buttons: null},
    stockElements = $("#stock-elements-panel");
    
  this.$li = $("<li>"); //item that will hold display dom elements
  
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
    
    //if comment isn't new, want to allow user to cancel editing and possibly delete
    var that = this;
    var user = wspApp.user;
    var showCancel = this.id;    
    var showDelete = showCancel && user &&
        ((user.id === this.userId) || (user.hasPrivilege(wsp.UserPrivilege.MODIFY_COMMENT)));
//console.log("user is ");
//console.log(user);
//console.log("showcancel: " + showCancel + " and delete: " + showDelete);
    
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
        
        edit.dom = stockElements.find(".comment-edit").clone();
        
        edit.textArea = edit.dom.find(".comments");
        edit.buttons = edit.dom.find(".button-holder");
        
        //now get buttons for easy reference - won't need to find again
        var tmpButtons = stockElements.find(".comment-buttons").clone();
        edit.buttons.remove = tmpButtons.find(".delete");
        edit.buttons.save = tmpButtons.find(".save");
        edit.buttons.cancel = tmpButtons.find(".cancel");
                
        //update height of textarea - otherwise it is way too tall
        edit.textArea.textinput().textinput("refresh");

        //set up button click handling
        edit.buttons.remove.on("click", $.proxy(function(){
          manager.deleteComment(this);
        }, this));

        edit.buttons.save.on("click", $.proxy(function(){
          this.text = edit.textArea.val();
          manager.saveComment(this);
        }, this));

        edit.buttons.cancel.on("click", $.proxy(function(){
          //want to go from editing to regular display
          this.refresh({allowEdit: false});
        }, this));
        
      }
      
      this.$li.append(edit.dom);
      edit.textArea.val(this.text);

      this.toggleButton(edit.buttons.save, showCancel);
      this.toggleButton(edit.buttons.cancel, showCancel);
      this.toggleButton(edit.buttons.remove, showDelete);
      
      //when editing, listen for textarea input to show/hide save button
      //only for new comments, not existing ones
      if (!this.id) {
        //want to show save button when user has typed text
        edit.textArea.on("input", function(){            
          if ($(this).val().length > 0) {
            //only add save button if it isn't.  toggleButton will check, but
            //no need for the extra function calls
            if (!edit.buttons.save.isAdded) {
              that.toggleButton(edit.buttons.save, true);
            }
          } else {
            that.toggleButton(edit.buttons.save, false);
          }
        });
      } else {
        edit.textArea.off("input");
      }
      
    } else {
      //want to display info
      if (!display.dom) {
        display.dom = stockElements.find(".comment-display").clone();
      
        display.text = display.dom.find(".comments");
        display.date = display.dom.find(".date");
        display.user = display.dom.find(".user");
        
        display.dom.on("click", $.proxy(function(){
          //only open to allow edit if user has permissions
          user = wspApp.user;
          if (user && ((user.id === this.userId) ||
                       (user.hasPrivilege(wsp.UserPrivilege.MODIFY_COMMENT)))) {
            this.refresh({allowEdit: true});  
          }
        }, this));
      }
      
      this.$li.append(display.dom);
      display.text.text(this.text);
      display.date.text(this.date);      
      display.user.text(this.username || "Anonymous");
      
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
  this.toggleButton = function (button, display) {
    if (display && !button.isAdded) {
      //add
      edit.buttons.controlgroup().controlgroup("container").append(button);
      button.isAdded = true;
    } else if (!display && button.isAdded) {
      //remove
      button.detach();
      button.isAdded = false;
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

/*object that can show/hide minetta brook*/
wsp.MinettaOverlay = function (map, msgPanel) {
  this.map = map;
  this.messagePanel = msgPanel;
  this.centerPoly = null;
  this.boundaryPoly = null;
  this.walkingTour = null; //use steve duncan's walking tour
  this.centerCoords = [
    {lat: 40.73165452479978, lng: -73.99742697483407},
    {lat: 40.7315478241654, lng: -73.99759089999998},
    {lat: 40.7315029291734, lng: -73.99769070000002},
    {lat: 40.7314680108463, lng: -73.99777549999999},
    {lat: 40.7314380808516, lng: -73.99788030000002},
    {lat: 40.7313881975272, lng: -73.99795010000003},
    {lat: 40.7313283375378, lng: -73.99803989999998},
    {lat: 40.7313033958756, lng: -73.99811970000002},
    {lat: 40.7312485242187, lng: -73.99820449999999},
    {lat: 40.731218594224, lng: -73.9982943},
    {lat: 40.7311786875644, lng: -73.99836909999999},
    {lat: 40.7311437692373, lng: -73.99846389999999},
    {lat: 40.7311038625777, lng: -73.99854370000003},
    {lat: 40.7310689442506, lng: -73.9986285},
    {lat: 40.7310240492586, lng: -73.9987233},
    {lat: 40.7309791542665, lng: -73.99882309999998},
    {lat: 40.7309442359394, lng: -73.99890290000002},
    {lat: 40.730894352615, lng: -73.9989976},
    {lat: 40.7308644226203, lng: -73.99908740000001},
    {lat: 40.73079754176424, lng: -73.99925579017827},
    {lat: 40.73072391906198, lng: -73.999109663789},
    {lat: 40.7307796209687, lng: -73.9989976},
    {lat: 40.7308095509634, lng: -73.9989079},
    {lat: 40.7308594342878, lng: -73.9988131},
    {lat: 40.730894352615, lng: -73.99873330000003},
    {lat: 40.730939247607, lng: -73.99863349999998},
    {lat: 40.730984142599, lng: -73.99853869999998},
    {lat: 40.7310190609261, lng: -73.99845390000002},
    {lat: 40.7310589675857, lng: -73.99837409999998},
    {lat: 40.7310938859128, lng: -73.99827929999998},
    {lat: 40.7311337925724, lng: -73.99820449999999},
    {lat: 40.7311637225671, lng: -73.99811469999997},
    {lat: 40.731218594224, lng: -73.9980299},
    {lat: 40.7312435358862, lng: -73.99795010000003},
    {lat: 40.7313033958756, lng: -73.99786030000001},
    {lat: 40.7313532792, lng: -73.99779050000001},
    {lat: 40.7313832091947, lng: -73.99768570000003},
    {lat: 40.7314181275218, lng: -73.99760090000001},
    {lat: 40.7314630225139, lng: -73.99750110000002},
    {lat: 40.73159208082837, lng: -73.99729560059427}
  ];
  this.boundaryCoords = [
    {lat: 40.731864127525284, lng: -73.99785046256562},
    {lat: 40.7317373807984, lng: -73.99802490000002},
    {lat: 40.7316974741388, lng: -73.9981047},
    {lat: 40.731667358271125, lng: -73.99816804232785},
    {lat: 40.7316176608197, lng: -73.99824439999998},
    {lat: 40.73158089586968, lng: -73.99832224662703},
    {lat: 40.7315528124979, lng: -73.998404},
    {lat: 40.7315079175059, lng: -73.9984988},
    {lat: 40.7314630225139, lng: -73.99858360000002},
    {lat: 40.7314231158543, lng: -73.99867840000002},
    {lat: 40.7313732325298, lng: -73.99876819999997},
    {lat: 40.7313183608729, lng: -73.99884800000001},
    {lat: 40.7312734658809, lng: -73.9989577},
    {lat: 40.7312136058915, lng: -73.99903760000001},
    {lat: 40.7311587342346, lng: -73.99913730000003},
    {lat: 40.7311288042399, lng: -73.99923209999997},
    {lat: 40.7310839092479, lng: -73.99931190000001},
    {lat: 40.73095799208582, lng: -73.9995852920307},
    {lat: 40.7306249826628, lng: -73.99891780000002},
    {lat: 40.7306948193171, lng: -73.9987931},
    {lat: 40.730749690974, lng: -73.99867840000002},
    {lat: 40.7307995742985, lng: -73.99856369999998},
    {lat: 40.7308544459554, lng: -73.99842899999999},
    {lat: 40.7308993409474, lng: -73.9983492},
    {lat: 40.7309542126043, lng: -73.99822940000001},
    {lat: 40.7309891309314, lng: -73.99810969999999},
    {lat: 40.7310390142559, lng: -73.99798499999997},
    {lat: 40.7310839092479, lng: -73.99788030000002},
    {lat: 40.7311288042399, lng: -73.9977556},
    {lat: 40.7311786875644, lng: -73.99768069999999},
    {lat: 40.7312335592213, lng: -73.99759589999996},
    {lat: 40.7312784542133, lng: -73.99750110000002},
    {lat: 40.7313133725405, lng: -73.99742129999998},
    {lat: 40.7313632558649, lng: -73.99732660000001},
    {lat: 40.7314031625245, lng: -73.99723180000001},
    {lat: 40.731482703206716, lng: -73.99707189814757}
  ];
};

/*call to show or hide the overlay*/
wsp.MinettaOverlay.prototype.setVisibility = function (isVisible) {
  if (isVisible && (this.centerPoly === null)) {
    //need to create polygon
    
     // Construct the polygon.
    this.centerPoly = new google.maps.Polygon({
      clickable: false,
      editable: false,
      paths: this.centerCoords,
      strokeColor: '#0000ff',
      strokeWeight: 0,      
      fillColor: '#0000ff',
      fillOpacity: 0.25
    });

    this.boundaryPoly = new google.maps.Polygon({
      clickable: true,
      editable: false,
      paths: this.boundaryCoords,
      strokeColor: '#0000ff',
      strokeWeight: 0,
      fillColor: '#0000ff',
      fillOpacity: 0.15
    });
    
    
    this.walkingTour = new google.maps.KmlLayer({
      url: "http://localecology.org/wspecomap/kml/minetta_tour.kml",
      preserveViewport: true
    });
    
 /*   
  google.maps.event.addListener(this.boundaryPoly, "dblclick", function(e){
    console.log("hi there - double click");
    e.stop();
    var p = this.getPath();
    var s = "PRINTING COORDS: \n";
    
    p.forEach(function(element, index) {
      s += "{lat: " + element.lat() + ", lng: " + element.lng() + "},\n";
      
    });
    
    console.log(s);

  });
*/
  var that = this;
  google.maps.event.addListener(this.boundaryPoly, "click", function(e){
/*
    if (e.vertex !== undefined) {
      var p = this.getPath();
      p.removeAt(e.vertex);
    }
    e.stop();
*/
    var s = "This is the approximate path where Minetta Brook once ran.";
    that.messagePanel.open({error: s});

  });

    
  }
  
  if (this.centerPoly) {
    var map = (isVisible) ? this.map.baseMap : null;
    //this.centerPoly.setMap(map);
    //this.boundaryPoly.setMap(map);
    this.walkingTour.setMap(map);
  }
  
};


wsp.TransparentMapType = function (tileSize) {
  this.tileSize = tileSize;
}

wsp.TransparentMapType.prototype.getTile = function(coord, zoom, ownerDocument) {  

  var div = ownerDocument.createElement('div');
  div.className = "custom-tile";
  return div;

};