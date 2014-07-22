/*jslint browser:true */
/*global  wsp, google, console*/
"use strict";

/*Panel is a class that displays info to user.  */
wsp.Panel = function (name) {
  this.domPanel = $("#" + name); //returns jquery object
  this.openOpts = null;
  
  this.blah = name;
  
  this.domPanel.panel({
    beforeopen: $.proxy(this.onBeforeOpen, this),
    open: $.proxy(this.onOpen, this),
    close: $.proxy(this.onClose, this)
  });
  
}; //wsp.Panel


/*
  Displays the panel on the site.  Accepts an object which is used to 
  initialize variables.  This object depends on the type of panel - could be
  a tree or a taxon or a user
*/
wsp.Panel.prototype.open = function(opts) {
  this.openOpts = opts || {};
  this.domPanel.panel("open");
};

/*
  Closes panel
*/
wsp.Panel.prototype.close = function() {
  console.log("closing up shop..." + this.blah);
  this.domPanel.panel("close");
};

/*
  Triggered when the process (and animation) of opening a panel is finished 
  subclass should override
*/
wsp.Panel.prototype.onOpen = function(event, ui) {
  //override for functionality
};

/*
  Triggered when the process (and animation) of closing a panel is finished 
  subclass could override
*/
wsp.Panel.prototype.onClose = function(event, ui) {
  console.log("onClose called..." + this.blah);
  //override for functionality
  if (this.openOpts.prevPanel) {
    var prevPanel = this.openOpts.prevPanel;    
    this.openOpts.prevPanel = null; //don't want it to be opened again
    
    console.log("in onclose, trying to open " + prevPanel.blah);
    prevPanel.open(this.openOpts);
  }
};

/*
  Triggered at the start of the process of opening a panel 
  Gives a chance to set up the panel for visual display - subclass should override
*/
wsp.Panel.prototype.onBeforeOpen = function (event, ui) {
  //override to provide functionality
};

/*
  Call this method when there is an error from ajax request.
  Makes the assumption that there is a .error label on the panel
*/
wsp.Panel.prototype.onAjaxFail = function (jqXHR, textStatus, errorThrown) {
  console.log("onAjaxFail " + this.blah);
  console.log(this);
  var error = "Error: ";
  if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
    error += jqXHR.responseJSON.error;
  } else {
    error += errorThrown;
  }
  
  this.domPanel.find(".error").text(error);  

};


/*inherits from Panel and is used to display information about a tree*/
wsp.DisplayTreePanel = function(name) {
  wsp.Panel.call(this, name);
  
  //grab the edit button
  this.tmpEdit = this.domPanel.find("input").click($.proxy(function(){
    wspApp.map.panels.editTree.open({base: this.openOpts.base, prevPanel: this});
    
    //wspApp.map.openPanel("edit-tree", {base: this.openOpts.base,
    //  prevPanel: name});
      
      
    }, this));
  
};

wsp.DisplayTreePanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.DisplayTreePanel.prototype.constructor = wsp.DisplayTreePanel;

wsp.DisplayTreePanel.prototype.onBeforeOpen = function(event, ui) {
  var tree = this.openOpts.base;
  
  var taxon = wspApp.map.taxa[tree.taxonId] || {};
  var dbhUnit = (tree.dbh === 1) ? " inch" : " inches";
  
  this.domPanel.find(".scientific").text(taxon.sciName);
  this.domPanel.find(".common").text(taxon.common);
  this.domPanel.find(".diameter").text(tree.dbh + dbhUnit);
  this.domPanel.find("#tree-data-link").attr("href", taxon.wikiLink);

};

/*inherits from Panel and is used to edit information about a tree*/
wsp.EditTreePanel = function(name) {
  wsp.Panel.call(this, name);
  
  //tell what to do when click on update
  this.domPanel.find("button.update").click($.proxy(this.update, this));
  this.domPanel.find("button.cancel").click($.proxy(this.close, this));
  
};

wsp.EditTreePanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.EditTreePanel.prototype.constructor = wsp.EditTreePanel;

wsp.EditTreePanel.prototype.onBeforeOpen = function(event, ui) {
  var tree = this.openOpts.base;
  
  //clear out all the options from the select, then add each species
  var sel = this.domPanel.find("select.taxon"); //save in variable for convenience
  sel.empty();
  
  if (wspApp.map.taxa.length === 0) {
    sel.append("<option value='-1'>Unable to load taxon</option>");
  } else {
    var prop = null;
    var taxon = null;
    var s = "";
    console.log(wspApp.map.taxa);
    
    var obj = wspApp.map.taxa;
    for (prop in wspApp.map.taxa) {
      if (wspApp.map.taxa.hasOwnProperty(prop)) {
        taxon = wspApp.map.taxa[prop];
        s = "<option value='" + taxon.id + "'";
        s += (taxon.id === tree.taxonId) ? " selected" : "";
        s += ">" + taxon.sciName + " | " + taxon.common + "</option>";
        sel.append(s);  
      }
    }
  }

  this.domPanel.find(".diameter").val(tree.dbh);
  this.domPanel.find(".error").text(null); //clear any error msg from previous time

  
  //need to re-draw so that jqm can update selector
  sel.selectmenu().selectmenu( "refresh", true);
};

/*
  Attempts to update tree to current state
*/
wsp.EditTreePanel.prototype.update = function() {

  var tree = this.openOpts.base;
  
  //update tree
  var newTaxonId = parseInt(this.domPanel.find("select.taxon option:selected").val());
  var newDbh = parseInt(this.domPanel.find(".diameter").val());
  
  var jqxhr = $.ajax({url: wspApp.map.dataUrl,
                      data: {verb: "update", noun: "tree",
                      treeid: tree.id,
                      taxonid: newTaxonId,
                      dbh: newDbh,
                      lat: tree.position.lat,
                      lng: tree.position.lng},
                      dataType: "json",
                      context: this})    
    .done(function(data){
    
      //update tree that other panel uses...if this is done before sending the
      //request, would need to undo it on failure.
      tree.taxonId = newTaxonId;
      tree.dbh = newDbh;
    
      this.close();
    })
    .fail(this.onAjaxFail);
};

 
/*
  panel where user can login
*/ 
wsp.LoginPanel = function(name) {
  wsp.Panel.call(this, name);
  
  //tell what to do when click on update
  this.domPanel.find("button.login").click($.proxy(this.login, this));
  this.domPanel.find("button.cancel").click($.proxy(this.close, this));
  
};

wsp.LoginPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.LoginPanel.prototype.constructor = wsp.LoginPanel;

/*
  Attempts to log user in
*/
wsp.LoginPanel.prototype.login = function() {

  var jqxhr = $.ajax({url: wspApp.map.dataUrl,
                      data: {verb: "login", noun: "user",
                      username: this.domPanel.find(".username").val(),
                      password: this.domPanel.find(".password").val()},
                      dataType: "json",
                      context: this})    
    .done(function(data){
      var user = new wsp.User({dbUser: data.user});
      //want to switch to user panel
      wspApp.map.panels.user.open({base: user});
      
    })
    .fail(this.onAjaxFail);
};
    
wsp.UserPanel = function(name) {
  wsp.Panel.call(this, name);

  this.user = null;
  
  //tell what to do when click on update
  this.domPanel.find("button.logout").click($.proxy(this.logout, this));
  this.domPanel.find("button.close").click($.proxy(this.close, this));
  
};

wsp.UserPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.UserPanel.prototype.constructor = wsp.UserPanel;


wsp.UserPanel.prototype.onOpen = function(event, ui) {
  this.user = this.openOpts.base; //keep for convenience
  var s = "No user logged in";
  if (this.user) {
    s = this.user.displayName;
  }
  
  this.domPanel.find(".display-name").text(s);
  
};


/*
  Attempts to log user in
*/

wsp.UserPanel.prototype.logout = function() {

  var jqxhr = $.ajax({url: wspApp.map.dataUrl,
                      data: {verb: "logout", noun: "user"},                      
                      dataType: "json",
                      context: this})    
    .done(function(data){
      this.user = null;
      this.close();
    })
    .fail(this.onAjaxFail);
  
};
