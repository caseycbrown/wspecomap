/*jslint browser:true */
/*global  wsp, google, console*/
"use strict";

/*Panel is a class that displays info to user.  */
wsp.Panel = function (name) {
  this.domPanel = $("#" + name); //returns jquery object
  this.openOpts = null;
  
  this.domPanel.panel({
    beforeopen: $.proxy(this.onBeforeOpen, this),
    open: $.proxy(this.onOpen, this),
    beforeclose: $.proxy(this.onBeforeClose, this),
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
  //override for functionality
  if (this.closeOpts) {
    var co = this.closeOpts;    
    this.closeOpts = null; //for next time panel is opened
    
    co.panel.open(co.openOpts);
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
  Triggered at the start of the process of closing a panel 
  subclass should override
*/
wsp.Panel.prototype.onBeforeClose = function (event, ui) {
  //override to provide functionality
};

/*
  Call this method when there is an error from ajax request.
  Makes the assumption that there is a .error label on the panel
*/
wsp.Panel.prototype.ajaxFail = function (jqXHR, textStatus, errorThrown) {
  var error = "Error: ";
  if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
    error += jqXHR.responseJSON.error;
  } else {
    error += errorThrown;
  }
  
  this.setError(error);

};

/*
  Use to set error message on panel.  Pass null to clear error
*/
wsp.Panel.prototype.setError = function (msg) {
  this.domPanel.find(".error").text(msg);
}


/*inherits from Panel and is used to show settings info*/
wsp.SettingsPanel = function(name) {
  wsp.Panel.call(this, name);
  this.domPanel.find("button.close").click($.proxy(this.close, this));
  this.domPanel.find("button.login").click($.proxy(this.onLoginClick, this));

  this.domPanel.find(".location").change($.proxy(this.onCheckboxChange, this));
  this.domPanel.find(".minetta").change($.proxy(this.onCheckboxChange, this));
  this.domPanel.find(".default-layer").change($.proxy(this.onCheckboxChange, this));
};

wsp.SettingsPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.SettingsPanel.prototype.constructor = wsp.SettingsPanel;

wsp.SettingsPanel.prototype.onBeforeOpen = function(event, ui) {
  //retreive settings from storage
  var val = wspApp.map.getSetting(wsp.Map.Setting.showLocation);
  this.domPanel.find(".location").prop("checked", val).checkboxradio("refresh");
  
  val = wspApp.map.getSetting(wsp.Map.Setting.showMinetta);
  this.domPanel.find(".minetta").prop("checked", val).checkboxradio("refresh");
  
  //for default layer, need to look to see if layer 1 is displayed
  val = wspApp.map.getSetting(wsp.Map.Setting.layers);
  this.domPanel.find(".default-layer")
    .prop("checked", ($.inArray(wspApp.constants.DEFAULT_LAYER_ID, val) !== -1))
    .attr("data-layer-id", wspApp.constants.DEFAULT_LAYER_ID)
    .checkboxradio("refresh");
  
  //also update the text of the login button
  val = "Login";
  if (wspApp.map.user) {
    val = "Logout, " + wspApp.map.user.displayName;
  }
  this.domPanel.find("button.login").html(val);
  
};


wsp.SettingsPanel.prototype.onCheckboxChange = function (event) {
  var ct = $(event.currentTarget);
  var checkVal = ct.prop("checked"); //will be a boolean value
  switch (ct.attr("data-setting")) {
    case "location":
      wspApp.map.setSetting(wsp.Map.Setting.showLocation, checkVal);
      break;
    case "minetta":
      wspApp.map.setSetting(wsp.Map.Setting.showMinetta, checkVal);
      break;

    case "layer":
      //go through all checkboxes (including default layer), compile array, and save it
      var visibleIds = [];
      this.domPanel.find("input.layer").each(function(index, element) {
        //this keyword refers to the input
        if ($(element).prop("checked")) {
          visibleIds.push(parseInt($(element).attr("data-layer-id")));
        }
      });

      wspApp.map.setSetting(wsp.Map.Setting.layers, visibleIds);
      break;
    
    
    default: //do nothing
  }
}

/*called to either log in or log out*/
wsp.SettingsPanel.prototype.onLoginClick = function (event) {
  if (wspApp.map.user) {
    //want to logout
    var jqxhr = $.ajax({url: wspApp.map.dataUrl,
                        data: {verb: "logout", noun: "user"},                      
                        dataType: "json",
                        context: this})    
      .done(function(data){
        wspApp.map.setSetting(wsp.Map.Setting.user, null);
        this.close();
      })
      .fail(this.ajaxFail);
    
  } else {
    //bring to login page
    wspApp.map.panels.login.open();
  }
};

/*called when map has loaded layers*/
wsp.SettingsPanel.prototype.onLayersLoaded = function(layers) {
  //layers will be 0 or more length array of wsp.Layers
  var i = 0;
  var layerHolder = this.domPanel.find(".tree-layers");
  var label = null;
  var input = null;
  var that = this;
  var visibleIds = wspApp.map.getSetting(wsp.Map.Setting.layers);
  
  layerHolder.empty();
  
  $.each(layers, function(layerId, layer) {
    //want to add a checkbox for each layer that is not default
    if (layer.id !== wspApp.constants.DEFAULT_LAYER_ID) {
      //now add checkboxes for each layer
      label = $("<label></label>")
        .addClass("panel-descriptor")
        .text(layer.name);
      input = $("<input>")
        .addClass("layer")
        .attr("data-layer-id", layer.id)
        .attr("data-setting", "layer")
        .prop("type", "checkbox")
        .prop("checked", ($.inArray(layer.id, visibleIds) !== -1))
        .change($.proxy(that.onCheckboxChange, that));
        
      label.prepend(input);
      layerHolder.append($("<li></li>").append(label));
      
      input.checkboxradio().checkboxradio("refresh");//init/refresh
    }
  });
  
};



/*inherits from Panel and is used to display information about a tree*/
wsp.DisplayTreePanel = function(name) {
  wsp.Panel.call(this, name);
  
  //hook up the edit button to click
  this.domPanel.find(".edit").click($.proxy(function(){
    wspApp.map.panels.editTree.open({base: this.openOpts.base});
    }, this));
  
  //for some reason removing/re-inserting button was leaving icon artifact.
  //I'm assuming this is because of some extras that JQM leaves behind...easiest
  //to wrap button in div and show/hide *that*
  this.editWrapper = this.domPanel.find(".edit-button-wrapper");
  
  this.editWrapper.isHidden = false;
  
  this.commentManager = new wsp.CommentManager(this);
};

wsp.DisplayTreePanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.DisplayTreePanel.prototype.constructor = wsp.DisplayTreePanel;

wsp.DisplayTreePanel.prototype.onBeforeOpen = function(event, ui) {
  var tree = this.openOpts.base;
  //var taxon = wspApp.map.taxa.dataHash[tree.taxonId] || {};
  var taxon = wspApp.map.taxa.getTaxon(tree.taxonId) || {};
  var dbhUnit = (tree.dbh === 1) ? " inch" : " inches";

  
  this.toggleEditWrapper(); //show or hide
  
  this.domPanel.find(".scientific").text(taxon.sciName);
  this.domPanel.find(".common").text(taxon.common);
  this.domPanel.find(".diameter").text(tree.dbh + dbhUnit);
  
  var that = this;
  //need to clear links because it's possible a tree will be opened and not
  //have a link for a particular resource...don't want to use the previous tree's
  //link in that case
  this.domPanel.find(".link-list a").attr("href", "#");
  
  $.each(taxon.links, function(index, link) {
    that.domPanel.find("." + link.name).attr("href", link.url);
  });

  this.setError(null);//clear any error msg from previous time
  
  this.commentManager.load(tree);
  
};

/*
  Removes or re-inserts edit button based on user
*/
wsp.DisplayTreePanel.prototype.toggleEditWrapper = function () {
  var user = wspApp.map.user;
  //want to show or hide edit icon depending on if user is logged in and
  //has permissions to see it
  
  var showButton = false;
  showButton = user && user.hasPrivilege(wsp.UserPrivilege.UPDATE_TREE);
  
  if (showButton && this.editWrapper.isHidden) {
    //TODO: implement permisisons
    this.editWrapper.isHidden = false;
    this.editWrapper.oldPrev.after(this.editWrapper);
    this.editWrapper.oldPrev = null;
    this.editWrapper.find(".edit").button().button("refresh"); 
    
  } else if ((!showButton) && (!this.editWrapper.isHidden)) {
    //need to hide - remember prev sibling so that we can reinsert later
    this.editWrapper.oldPrev = this.editWrapper.prev();
    this.editWrapper.detach(); //detahch instead of remove saves click handler
    this.editWrapper.isHidden = true;
    this.editWrapper.find(".edit").button().button("refresh");
  
  }
  

  
  
};

/*inherits from Panel and is used to edit information about a tree*/
wsp.EditTreePanel = function(name) {
  wsp.Panel.call(this, name);
  
  //tell what to do when click on update
  this.domPanel.find("button.update").click($.proxy(this.update, this));
  this.domPanel.find("button.cancel").click($.proxy(this.close, this));
  this.domPanel.find("select.taxon").change($.proxy(this.onSelectChange, this));
  
  this.layersNeedUpdating = true;
  
};

wsp.EditTreePanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.EditTreePanel.prototype.constructor = wsp.EditTreePanel;

/*
  want to go back to display tree panel
*/
wsp.EditTreePanel.prototype.close = function() {
  this.domPanel.panel("close");
  wspApp.map.panels.displayTree.open(wspApp.map.panels.displayTree.openOpts);
};



wsp.EditTreePanel.prototype.onBeforeOpen = function(event, ui) {
  var tree = this.openOpts.base;
  
  //clear out all the options from the select, then add each species
  var sel = this.domPanel.find("select.taxon"); //save in variable for convenience
  sel.empty();
  
  if (wspApp.map.taxa.dataArray.length === 0) {
    sel.append("<option value='-1'>Unable to load taxon</option>");
  } else {
    var prop = null;
    var taxon = null;
    var s = "";


    var i = 0,
      len = wspApp.map.taxa.dataArray.length;
    for (i = 0; i < len; i++) {
      taxon = wspApp.map.taxa.dataArray[i];
      s = "<option value='" + taxon.id + "'";
      s += (taxon.id === tree.taxonId) ? " selected" : "";
      s += ">" + taxon.sciName + " | " + taxon.common + "</option>";
      sel.append(s);  

    }
    
    //if user has permissions, pop in add new taxon option
    var user = wspApp.map.user;    
    if (user && user.hasPrivilege(wsp.UserPrivilege.ADD_TAXON)) {
      s = "<option value='addNew'>...(add new taxon)...</option>";
      sel.append(s);
    }

  }

  this.domPanel.find(".diameter").val(tree.dbh);
  this.setError(null);//clear any error msg from previous time

  
  //need to re-draw so that jqm can update selector
  sel.selectmenu().selectmenu( "refresh", true);
  
  var layers = wspApp.map.layerManager.layers;
  var layerHolder = this.domPanel.find(".layers");
  var lid = null;
  var layer = null;
  var input = null;
  var label = null;
  
  
  if (this.layersNeedUpdating) {
    //now add checkboxes for each layer
    layerHolder.empty();
    layerHolder.append($("<label></label>")
            .addClass("panel-descriptor")
            .text("Layers to belong to"));
    
    for (lid in layers) {
      if (layers.hasOwnProperty(lid)) {
        layer = layers[lid];
        
        if (this.layersNeedUpdating) {
          label = $("<label></label>")
            .addClass("panel-descriptor")
            .text(layer.name);
          input = $("<input>")
            .addClass("layer")
            .attr("data-layer-id", layer.id)
            .prop("type", "checkbox");
          
          label.prepend(input);
          
          layerHolder.append(label);
          
          input.checkboxradio();//init
          
          
        }
      }
    }

  }  
  
  this.layersNeedUpdating = false; //don't need to re-create dom next time
  
  
  //now need to set values for layer checkboxes
  this.domPanel.find("input.layer").each(function(index) {
    //called in context of current element
    lid = parseInt($(this).attr("data-layer-id"));
    
    $(this).prop("checked", ($.inArray(lid, tree.layers) !== -1));
    $(this).checkboxradio("refresh");
  });
  
  
  
  
};

/*
  Attempts to update tree to current state
*/
wsp.EditTreePanel.prototype.update = function() {

  var tree = this.openOpts.base;
  
  var newVals = {};
  //update tree
  newVals.taxonId = parseInt(this.domPanel.find("select.taxon option:selected").val());
  newVals.dbh = parseInt(this.domPanel.find(".diameter").val());
  
  //grab layer values
  newVals.layers = [];
  var layerId = null;
  this.domPanel.find("input.layer").each(function(index) {
    //called in context of current element
    if ($(this).prop("checked")) {
      newVals.layers.push($(this).attr("data-layer-id"));
    }    
  });

  
  var that = this; //context will be tree, not this panel, so save this
  tree.save(newVals)
  .done(function(data){
    that.close();
  })    
  .fail(that.ajaxFail);
};


/* fired when select menu changes.  If I use this menu elsewhere, should make
it it's own object separate from this panel*/
wsp.EditTreePanel.prototype.onSelectChange = function () {
  var val = this.domPanel.find("select.taxon option:selected").val();
  
  if (val === "addNew") {
    //open add taxon panel
    wspApp.map.panels.addTaxon.open();
    
  }
};

/*inherits from Panel and is used to add a new taxon*/
wsp.AddTaxonPanel = function(name) {
  wsp.Panel.call(this, name);
  
  //tell what to do when click on update
  this.domPanel.find("button.submit").click($.proxy(this.submit, this));
  this.domPanel.find("button.cancel").click($.proxy(this.close, this));
  
};

wsp.AddTaxonPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.AddTaxonPanel.prototype.constructor = wsp.AddTaxonPanel;

wsp.AddTaxonPanel.prototype.onBeforeOpen = function(event, ui) {
  //clear inputs in case they have been opened before
  this.domPanel.find(".genus").val(null);
  this.domPanel.find(".species").val(null);
  this.domPanel.find(".common").val(null);
  
  this.setError(null)//clear any error msg from previous time
};

/*
  want to go back to edit tree panel
*/
wsp.AddTaxonPanel.prototype.onClose = function() {
  //pass it existing openoptions
  wspApp.map.panels.editTree.open(wspApp.map.panels.editTree.openOpts);
};


/*
  Attempts to add new taxon
*/
wsp.AddTaxonPanel.prototype.submit = function() {

  var genus = this.domPanel.find(".genus").val(),
    species = this.domPanel.find(".species").val(),
    common = this.domPanel.find(".common").val();
  
  var jqxhr = $.ajax({url: wspApp.map.dataUrl,
                      data: {verb: "add", noun: "taxon",
                      genus: genus,
                      common: common,
                      species: species},
                      dataType: "json",
                      context: this})    
    .done(function(data){
    
      wspApp.map.taxa.addTaxon(new wsp.Taxon({dbTaxon: data.taxon}),
        {sort: true});
              
      this.close();
    })
    .fail(this.ajaxFail);
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


wsp.LoginPanel.prototype.onBeforeOpen = function(event, ui) {
  //clear inputs in case they have been opened before
  this.domPanel.find(".password").val(null);
  this.setError(null); //clear any error msg from previous time
};


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
      wspApp.map.setSetting(wsp.Map.Setting.user, new wsp.User({dbUser: data.user}));
      
      //want to switch to settings panel
      //wspApp.map.panels.settings.open();
      this.close();
      
    })
    .fail(this.ajaxFail);
};

/*
  want to go back to settings panel
*/
wsp.LoginPanel.prototype.onClose = function() {
  //pass it existing openoptions
  wspApp.map.panels.settings.open();
};

   

wsp.MessagePanel = function(name) {
  wsp.Panel.call(this, name);

  //tell what to do when click on update
  this.domPanel.find("button.close").click($.proxy(this.close, this));
  
};

wsp.MessagePanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.MessagePanel.prototype.constructor = wsp.MessagePanel;


wsp.MessagePanel.prototype.onBeforeOpen = function(event, ui) {
  var s = this.openOpts.error || "(sorry, no message to report)";
  
  this.setError(s);
  
};