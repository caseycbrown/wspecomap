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
  console.log("Directive to call open");
  this.openOpts = opts || {};
  this.domPanel.panel("open");
};

/*
  Closes panel
*/
wsp.Panel.prototype.close = function() {
  console.log("closing up shop");
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
  subclass should override
*/
wsp.Panel.prototype.onClose = function(event, ui) {
  //override for functionality
  console.log("onClose...");
};

/*
  Triggered at the start of the process of opening a panel 
  Gives a chance to set up the panel for visual display - subclass should override
*/
wsp.Panel.prototype.onBeforeOpen = function (event, ui) {
  //override to provide functionality
};


/*inherits from Panel and is used to display information about a tree*/
wsp.DisplayTreePanel = function(name) {
  wsp.Panel.call(this, name);
  
  //grab the edit button
  this.tmpEdit = this.domPanel.find("input").click($.proxy(function(){
    wspApp.map.openPanel("edit-tree", this.openOpts.base);
    }, this));
  
};

wsp.DisplayTreePanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.DisplayTreePanel.prototype.constructor = wsp.DisplayTreePanel;

wsp.DisplayTreePanel.prototype.onBeforeOpen = function(event, ui) {
  var tree = this.openOpts.base;
  
  console.log("DisplayTreePanel onBeforeOpen"  + tree.title);
  
  var taxon = wspApp.map.taxa[tree.taxonId] || {};
  var dbhUnit = (tree.dbh === 1) ? " inch" : " inches";
  
  this.domPanel.find(".scientific").text(taxon.sciName);
  this.domPanel.find(".common").text(taxon.common);
  this.domPanel.find(".diameter").text(tree.dbh + dbhUnit);
  this.domPanel.find("#tree-data-link").attr("href", taxon.wikiLink);

};

/*inherits from Panel and is used to display information about a tree*/
wsp.EditTreePanel = function(name) {
  wsp.Panel.call(this, name);
  
  //tell what to do when click on update
  this.domPanel.find("button.update").click($.proxy(this.update, this));
  
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
  //need to re-draw so that jqm can update selector
  
  
  //sel.selectmenu();
  sel.selectmenu().selectmenu( "refresh", true);
};

/*
  Attempts to update tree to current state
*/
wsp.EditTreePanel.prototype.update = function() {
  console.log("taxon:" + this.domPanel.find("select.taxon").text());
  console.log("dbh:" + this.domPanel.find(".diameter").val());
  
  var jqxhr = $.ajax({url: wspApp.map.dataUrl,
                      data: {verb: "update", noun: "tree"},
                      dataType: "json",
                      context: this})    
    .done(function(data){
      console.log("update received:");
      console.log(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
        console.log("Error: " + jqXHR.responseJSON.error);
      } else {
        console.log("Error: " + errorThrown);
      }
        
    });
  
};