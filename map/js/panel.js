/*jslint browser:true */
/*global  wsp, google, console*/
"use strict";

/*
  Provides some functionality for setting options
*/
wsp.OptionMenu = function(loginPanel) {
  this.domMenu = $("#option-menu");
  this.profileItem = this.domMenu.find("li.profile").detach();
  this.profileItem.isAdded = false;
  this.adminItem = this.domMenu.find("li.admin").detach();
  this.adminItem.isAdded = false;
  
  //set up event handler
  this.domMenu.find(".option").click($.proxy(this.onMenuOptionClick, this));
  
};

wsp.OptionMenu.prototype.onMenuOptionClick = function (event) {
  //first thing to do is close menu
  this.domMenu.popup("close");
  
  switch ($(event.currentTarget).attr("data-option")) {
    case "login":
      if (wspApp.user) {
        wspApp.map.panels.login.logout();
      } else {
        wspApp.map.panels.login.open();
      }
      
      break;
    case "settings":
      wspApp.map.panels.settings.open();
      break;
    default:
      //shouldn't get here
  }
  
};

/*called when a user logs in or out*/
wsp.OptionMenu.prototype.onLoginChange = function(user) {
  var s = "Login / Sign up";
  if (user) {
    s = "Logout, " + ((user.displayName === null) ? user.username : user.displayName);
  }
  this.domMenu.find("a.login").html(s);
  
  //now add or remove profileItem
  if (user && !this.profileItem.isAdded) {
    //want to insert it after login item
    this.domMenu.find("li.login").after(this.profileItem);
    this.profileItem.isAdded = true;
    
  } else if (!user && this.profileItem.isAdded) {
    this.profileItem.detach();
    this.profileItem.isAdded = false;
  }
  
  if (user && !this.adminItem.isAdded && (user.hasPrivilege(wsp.UserPrivilege.MODIFY_USER))) {
    this.profileItem.after(this.adminItem);
    this.adminItem.isAdded = true;    
  } else {
    //now add or remove adminItem
    this.adminItem.detach();
    this.adminItem.isAdded = false;
  }
  
};

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
  
  /*Generic panel attempts to wire a close and a submit button.  These might
  be labeled differently on forms (e.g. "cancel" or "login").  and if these
  buttons don't exist, it's no problem*/
  this.domPanel.find("button.close").click($.proxy(this.close, this));
  this.domPanel.find("button.submit").click($.proxy(this.onSubmitClick, this));

  
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
  this.setError(null); //most panels want clean error msg when opened
};

/*
  Triggered at the start of the process of closing a panel 
  subclass should override
*/
wsp.Panel.prototype.onBeforeClose = function (event, ui) {
  //override to provide functionality
};

/*
  Called by default if panel has a submit button.  override
*/
wsp.Panel.prototype.onSubmitClick = function () {
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
  //this.domPanel.find("button.close").click($.proxy(this.close, this));

  this.domPanel.find(".location").change($.proxy(this.onCheckboxChange, this));
  this.domPanel.find(".minetta").change($.proxy(this.onCheckboxChange, this));
  this.domPanel.find(".viele").change($.proxy(this.onCheckboxChange, this));
  this.domPanel.find(".historic-wsp").change($.proxy(this.onCheckboxChange, this));
  this.domPanel.find(".default-layer").change($.proxy(this.onCheckboxChange, this));
};

wsp.SettingsPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.SettingsPanel.prototype.constructor = wsp.SettingsPanel;

wsp.SettingsPanel.prototype.onBeforeOpen = function(event, ui) {
  //retreive settings from storage
  var val = wspApp.getSetting(wspApp.Settings.showLocation);
  this.domPanel.find(".location").prop("checked", val).checkboxradio("refresh");
  
  val = wspApp.getSetting(wspApp.Settings.showMinetta);
  this.domPanel.find(".minetta").prop("checked", val).checkboxradio("refresh");
  val = wspApp.getSetting(wspApp.Settings.showViele);
  this.domPanel.find(".viele").prop("checked", val).checkboxradio("refresh");
  val = wspApp.getSetting(wspApp.Settings.showHistoricWSP);
  this.domPanel.find(".historic-wsp").prop("checked", val).checkboxradio("refresh");
  
  //for default layer, need to look to see if layer 1 is displayed
  val = wspApp.getSetting(wspApp.Settings.layers);
  this.domPanel.find(".default-layer")
    .prop("checked", ($.inArray(wspApp.Constants.DEFAULT_LAYER_ID, val) !== -1))
    .attr("data-layer-id", wspApp.Constants.DEFAULT_LAYER_ID)
    .checkboxradio("refresh");
    
};


wsp.SettingsPanel.prototype.onCheckboxChange = function (event) {
  var ct = $(event.currentTarget);
  var checkVal = ct.prop("checked"); //will be a boolean value
  switch (ct.attr("data-setting")) {
    case "location":
      wspApp.setSetting(wspApp.Settings.showLocation, checkVal);
      break;
    case "minetta":
      wspApp.setSetting(wspApp.Settings.showMinetta, checkVal);
      break;
    case "viele":
      wspApp.setSetting(wspApp.Settings.showViele, checkVal);
      break;
    case "historic-wsp":
      wspApp.setSetting(wspApp.Settings.showHistoricWSP, checkVal);
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

      wspApp.setSetting(wspApp.Settings.layers, visibleIds);
      break;
    
    
    default: //do nothing
  }
}

/*called when map has loaded layers*/
wsp.SettingsPanel.prototype.onLayersLoaded = function(layers) {
  //layers will be 0 or more length array of wsp.Layers
  var i = 0;
  var layerHolder = this.domPanel.find(".tree-layers");
  var label = null;
  var input = null;
  var that = this;
  var visibleIds = wspApp.getSetting(wspApp.Settings.layers);
  
  layerHolder.empty();
  
  $.each(layers, function(layerId, layer) {
    //want to add a checkbox for each layer that is not default
    if (layer.id !== wspApp.Constants.DEFAULT_LAYER_ID) {
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
  var user = wspApp.user;
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
    var user = wspApp.user;    
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
wsp.EditTreePanel.prototype.onSubmitClick = function() {

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
  .fail(function(a,b,c){that.ajaxFail(a,b,c);});
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
wsp.AddTaxonPanel.prototype.onSubmitClick = function() {

  var genus = this.domPanel.find(".genus").val(),
    species = this.domPanel.find(".species").val(),
    common = this.domPanel.find(".common").val();
  
  var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
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
  
  //wire click events
  this.domPanel.find("a.forgot").click($.proxy(function(){
    wspApp.map.panels.forgot.open();
  }, this));
  this.domPanel.find("a.signup").click(function(){
    wspApp.map.panels.register.open();
  });
  
};

wsp.LoginPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.LoginPanel.prototype.constructor = wsp.LoginPanel;


wsp.LoginPanel.prototype.onBeforeOpen = function(event, ui) {
  //clear inputs in case they have been opened before
  this.domPanel.find(".password").val(null);
  this.setError(null); //clear any error msg from previous time
};


/*attempt to log user out */
wsp.LoginPanel.prototype.logout = function() {

  //want to logout
  var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                      data: {verb: "logout", noun: "user"},                      
                      dataType: "json",
                      context: this})    
    .always(function(){
      //do this whether or not server has success
      wspApp.setSetting(wspApp.Settings.user, null);
    })
      
};

/*
  Attempts to log user in
*/
wsp.LoginPanel.prototype.onSubmitClick = function() {

  var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                      data: {verb: "login", noun: "user",
                      username: this.domPanel.find(".username").val(),
                      password: this.domPanel.find(".password").val()},
                      dataType: "json",
                      context: this})    
    .done(function(data){
      var user = new wsp.User({dbUser: data.user});
      wspApp.setSetting(wspApp.Settings.user, user);
            
      this.close();
      
    })
    .fail(this.ajaxFail);
};
   

wsp.MessagePanel = function(name) {
  wsp.Panel.call(this, name);
};

wsp.MessagePanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
//set "constructor" property as per mozilla developer docs
wsp.MessagePanel.prototype.constructor = wsp.MessagePanel;


wsp.MessagePanel.prototype.onBeforeOpen = function(event, ui) {
  var s = this.openOpts.error || "(sorry, no message to report)";
  
  this.setError(s);
  
};

/*Panel to display when user forgets password*/
wsp.ForgotPasswordPanel = function(name) {
  wsp.Panel.call(this, name);
};

wsp.ForgotPasswordPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
wsp.ForgotPasswordPanel.prototype.constructor = wsp.ForgotPasswordPanel;


/*
  Get email address and tell server to send email
*/
wsp.ForgotPasswordPanel.prototype.onSubmitClick = function() {

  var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                      data: {verb: "resetpw", noun: "user",
                      email: this.domPanel.find(".email").val()},
                      dataType: "json",
                      context: this})    
    .done(function(data){
      this.setError(data.message);
      
    })
    .fail(this.ajaxFail);
};


/*Panel to display for a new user to register for an account*/
wsp.RegisterPanel = function(name) {
  wsp.Panel.call(this, name);
};

wsp.RegisterPanel.prototype = Object.create(wsp.Panel.prototype); //inherit from panel
wsp.RegisterPanel.prototype.constructor = wsp.RegisterPanel;


wsp.RegisterPanel.prototype.onBeforeOpen = function(event, ui) {
  //clear inputs in case they have been opened before
  this.domPanel.find(".password").val(null);
  this.domPanel.find(".password2").val(null);
  this.setError(null); //clear any error msg from previous time
};

wsp.RegisterPanel.prototype.onSubmitClick = function() {
  var error = null,
    email = this.domPanel.find(".email").val(),
    username = this.domPanel.find(".username").val();
  
  //TODO: more robust checking
  if (!email) {
    error = "Please enter your email address";
  }
  if (!username) {
    error = "Please create a username";
  }
  
  if (!error) {
    //want to logout
    var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                        data: {verb: "signup", noun: "user",
                          username: username,
                          email: email},                      
                        dataType: "json",
                        context: this})    
      .done(function(data){
        var user = new wsp.User({dbUser: data.user});
        wspApp.setSetting(wspApp.Settings.user, user);
        
        /*fire off a password reset request.  do it this way, as it's simplest
        way (for now) to send email asynchronously.  There are ways to do so
        via php, but they are a little more involved - and don't want user
        waiting the few seconds that it might take to send email*/
        $.ajax({url: wspApp.Constants.DATA_URL,
                data: {verb: "resetpw", noun: "user",
                  email: user.email},                      
                  dataType: "json",
                  context: this});
        
        
        //want to give user a message
        var s = "Account created successfully!  You may add comments now.  ";
        s += "Your comments will indicate that they were made by an unverified user.";
        s += " To verify your account, please check your email and follow the ";
        s += "link that has been sent to you.  After doing so, you will be able to ";
        s += "set up a password so that you can log in again later and also fill out ";
        s += "your profile.";
        
        wspApp.map.panels.message.open({error: s});
        
      })
      .fail(this.ajaxFail);

  }
  
  this.setError(error); //could be null
  
  
  
  
};


/*The object that contains and manages pages*/
wsp.PageContainer = function() {
  this.pages = {};
  this.pages["map-about"] = new wsp.Page("map-about"); //no extra functionality
  this.pages["admin-user"] = new wsp.AdminPage("admin-user");
  this.pages["map-page"] = new wsp.MapPage("map-page");
  this.pages["user-pw"] = new wsp.PasswordPage("user-pw");
  this.pages["user-profile"] = new wsp.ProfilePage("user-profile");
  

  var d = $(document);
  d.on("pagecontainerbeforehide", $.proxy(this.onBeforeHide, this));
  this.pc = $(":mobile-pagecontainer");
  
};

wsp.PageContainer.prototype.onBeforeHide = function(event, ui) {
  if (ui.nextPage) {
    this.pages[ui.nextPage[0].id].onBeforeShow();
  }  
};

/*Page is a class that encapsulates page functionality*/
wsp.Page = function (name) {
  name = "#" + name;
  
  this.dom = $(name); //returns jquery object
    
  $(document)
    .on("pagecreate", name, $.proxy(this.onCreate, this))
    .on("pagebeforecreate", name, $.proxy(this.onBeforeCreate, this));
  
  /*Generic page attempts to wire submit and close buttons.  Might
  be labeled differently on forms (e.g. "cancel" or "login").  and if these
  buttons don't exist, it's no problem*/
  this.dom.find("button.close").click($.proxy(this.onCloseClick, this));
  this.dom.find("button.submit").click($.proxy(this.onSubmitClick, this));
     
}; //wsp.Page

/*
  Called before page has been created. override in subclass
*/
wsp.Page.prototype.onBeforeCreate = function(event) {
};
/*
  Called when page has been created - override in subclass
*/
wsp.Page.prototype.onCreate = function(event) {
};

/*called by page container before showing this page*/
wsp.Page.prototype.onBeforeShow = function(event, ui) {
  this.setError(null);
};
/*
  Called by default if page has a submit button.  override
*/
wsp.Page.prototype.onSubmitClick = function () {
  //override to provide functionality
};
/*
  Called by default if page has a close button.  by default, navigate to home
*/
wsp.Page.prototype.onCloseClick = function () {
  //override to provide functionality
  //$("body").pagecontainer("change", "#");
  wspApp.pageContainer.pc.pagecontainer("change", "#");
};

/*
  Use to set error message on page.  Pass null to clear error
*/
wsp.Page.prototype.setError = function (msg) {
  this.dom.find(".error").text(msg);
}

/*
  Call this method when there is an error from ajax request.
  Makes the assumption that there is a .error label on the page
*/
wsp.Page.prototype.ajaxFail = function (jqXHR, textStatus, errorThrown) {
  var error = "Error: ";
  if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error) {
    error += jqXHR.responseJSON.error;
  } else {
    error += errorThrown;
  }
  
  this.setError(error);

};


/*inherits from Page and is used to show map*/
wsp.MapPage = function(name) {
  wsp.Page.call(this, name);
};

wsp.MapPage.prototype = Object.create(wsp.Page.prototype); //inherit from page
//set "constructor" property as per mozilla developer docs
wsp.MapPage.prototype.constructor = wsp.MapPage;

wsp.MapPage.prototype.onCreate = function(event) {
  var baseMap = new google.maps.Map(document.getElementById('map-canvas'),
      { zoom: 17,
        center: new google.maps.LatLng(40.731030, -73.997300),
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        streetViewControl: false,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_LEFT
        }
  });
  baseMap.setTilt(0); //don't want 45 angle

  baseMap.overlayMapTypes.insertAt(0,
    new wsp.TransparentMapType(new google.maps.Size(4096, 4096)));
      
  wspApp.map = new wsp.Map(baseMap);
  wspApp.map.requestInitialData();
  /*
  setTimeout(function(){
    wspApp.map.requestInitialData();
  }, 6500);
  */
};

/*inherits from Page and is used to show page where user can reset password*/
wsp.PasswordPage = function(name) {
  wsp.Page.call(this, name);  
  this.detachedPw = null;
  this.token = null;
  this.userId = null;
};

wsp.PasswordPage.prototype = Object.create(wsp.Page.prototype); //inherit from page
//set "constructor" property as per mozilla developer docs
wsp.PasswordPage.prototype.constructor = wsp.PasswordPage;

/*called by page container before showing this page*/
wsp.PasswordPage.prototype.onBeforeShow = function(event, ui) {
  this.checkUrl();
  //clear passwords
  this.dom.find(".password").val(null);
  this.dom.find(".password0").val(null);
  this.dom.find(".password1").val(null);
  
};
wsp.PasswordPage.prototype.onCreate = function(event) {
  this.checkUrl();
};

/*call when page opens to see if userid/token have been given*/
wsp.PasswordPage.prototype.checkUrl = function() {
  //want to find url params
  this.token = this.getURLParameter("token");
  this.userId = this.getURLParameter("userid");

  //want to remove current password if we are using a token
  if (this.token && !this.detachedPw) {
    //remove - jqm has wrapped curPw in a div, so take that out
    this.detachedPw = this.dom.find(".password").parent().detach();    
  } else if (!this.token && this.detachedPw) {
    //put it back - before parent of input in question b/c of jqm markup
    this.dom.find(".password0").parent().before(this.detachedPw);
    this.detachedPw = null;
    
  }
  
  //this.dom.enhanceWithin();
  
};

wsp.PasswordPage.prototype.getURLParameter = function(paramName) {
  var half = window.location.href.split(paramName + "=")[1];
  return (half !== undefined) ? decodeURIComponent(half.split('&')[0]) : null;
};


wsp.PasswordPage.prototype.onSubmitClick = function(event) {
  var pw0 = this.dom.find(".password0").val(),
    pw1 = this.dom.find(".password1").val(),
    pw = this.dom.find(".password").val();
  var error = null; 
  if (pw0 !== pw1) {
    error = "Passwords do not match";
  }
  //Not checking how good passwords are - nothing really to secure
  this.setError(error);
  if (!error) {
    var data = {verb: "changepw", noun: "user",
                passwordnew: pw0,
                userid: this.userId};
    //add either token or password
    if (this.token) {
      data.token = this.token;
    } else {
      data.password = pw;
    }
  
    var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                      data: data,
                      dataType: "json",
                      context: this})    
    .done(function(data) {
      var user = new wsp.User({dbUser: data.user});
      wspApp.setSetting(wspApp.Settings.user, user);

      //if user hasn't set display name, send to profile page
      if (user.displayName === null) {
        wspApp.pageContainer.pc.pagecontainer("change", "#user-profile");
      } else {
        this.setError("Password successfully updated.");
      }
      
    })
    .fail(this.ajaxFail);    
  }
  
  
};

/*inherits from Page and is used to show page where user can update profile*/
wsp.ProfilePage = function(name) {
  wsp.Page.call(this, name);
  this.user = null;
};

wsp.ProfilePage.prototype = Object.create(wsp.Page.prototype); //inherit from page
//set "constructor" property as per mozilla developer docs
wsp.ProfilePage.prototype.constructor = wsp.ProfilePage;

/*called by page container before showing this page*/
wsp.ProfilePage.prototype.onBeforeShow = function(event, ui) {
  this.initializeFields();
};
wsp.ProfilePage.prototype.onCreate = function(event, ui) {
  this.initializeFields();
};

/*sets fields according to user*/
wsp.ProfilePage.prototype.initializeFields = function () {
  this.user = wspApp.getSetting(wspApp.Settings.user) || {};
  //this page shouldn't get opened if user is null, but in case it somehow happens,
  //at least allow page to open without error
  this.dom.find(".username").text(this.user.username);
  this.dom.find(".display-name").val(this.user.displayName);
  this.dom.find(".first-name").val(this.user.firstName);
  this.dom.find(".last-name").val(this.user.lastName);
  this.dom.find(".postal-code").val(this.user.postalCode);
  this.dom.find(".email").val(this.user.email);
  
  this.setError(null);
};

wsp.ProfilePage.prototype.onSubmitClick = function(event) {
  //var privileges = this.user.privileges || [];
  var jqxhr = $.ajax({url: wspApp.Constants.DATA_URL,
                    data: {verb: "update", noun: "user",
                      userid: this.user.id,
                      displayname: this.dom.find(".display-name").val(),
                      firstname: this.dom.find(".first-name").val(),
                      lastname: this.dom.find(".last-name").val(),
                      postalcode: this.dom.find(".postal-code").val(),
                      email: this.dom.find(".email").val()
                      //privileges: privileges.toString()
                    },
                    dataType: "json",
                    context: this})    
  .done(function(data){
    this.setError("success!");
    //could update current user object, but use data returned from db
    var user = new wsp.User({dbUser: data.user});
    wspApp.setSetting(wspApp.Settings.user, user);
  })
  .fail(this.ajaxFail);
  
};

/*inherits from Page and is used to show page where user can do admin tasks*/
wsp.AdminPage = function(name) {
  wsp.Page.call(this, name);
  this.currentUser = null;
  this.dom.find("ul.user").on("filterablebeforefilter", $.proxy(this.onFilter, this));
};

wsp.AdminPage.prototype = Object.create(wsp.Page.prototype); //inherit from page
//set "constructor" property as per mozilla developer docs
wsp.AdminPage.prototype.constructor = wsp.AdminPage;

wsp.AdminPage.prototype.onCreate = function(event, ui) {
  console.log("admin page create");
  $.ajax({url: wspApp.Constants.DATA_URL,
          data: {verb: "get", noun: "privilege"},
                dataType: "json",
                context: this})
  .done(this.onPrivilegesLoaded)
  .fail(this.ajaxFail);
};


wsp.AdminPage.prototype.onFilter = function (e, data) {
  //the following code is modified from
  //http://demos.jquerymobile.com/1.4.3/listview-autocomplete-remote/
  
  var $ul = this.dom.find("ul.user"),
      q = $(data.input).val(),
      s = "",
      li = null,
      that = this;
  
  $ul.empty();
  
  if ( q && q.length > 2 ) {
      //$ul.html( "<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>" );
      $ul.listview().listview( "refresh" );
      
      $.ajax({url: wspApp.Constants.DATA_URL,
              data: {verb: "get", noun: "user",
                      q: q},
                    dataType: "json",
                    context: this})
      .done(function(data){
        if (data.users.length > 0) {
          $ul.append("<li>Username | Display Name | Email</li>");
        }
        $.each(data.users, function ( i, val ) {
          s = val.username + " | " + (val.displayName || "(undefined)") + " | " + val.email;
          li = $("<li>")
            .html(s)
            .click($.proxy(that.onFilterListClick, that));
          li[0].user = val; //save user with listitem
          $ul.append(li);
          
          //html += "<li>" + s + "</li>";
        });
        //$ul.html( html );
        $ul.listview( "refresh" );
        $ul.trigger( "updatelayout");
      })
      .fail(this.ajaxFail);
  } else {
    $ul.append("<li>Please enter at least 3 characters</li>");
  }
};

/*called when privileges have been received from database*/
wsp.AdminPage.prototype.onPrivilegesLoaded = function (data) {
  var label = null,
    input = null,
    privList = this.dom.find("ul.privileges");
  
  //go through them and add checkbox for each
  $.each(data.privileges, function(i, priv) {
    //want to add a checkbox for each privilege
    label = $("<label></label>")
      .addClass("panel-descriptor")
      .text(priv.code + "(" + priv.name + ")");
    input = $("<input>")
      .addClass("privilege-" + priv.code)
      .attr("data-privilege-code", priv.code)
      .prop("type", "checkbox")
      .prop("checked", false);
      
    label.prepend(input);
    privList.append($("<li></li>").append(label));
    
    input.checkboxradio().checkboxradio("refresh");//init/refresh
  });

};

wsp.AdminPage.prototype.onFilterListClick = function (event) {
  var input = null,
    that = this;
  
  this.currentUser = event.currentTarget.user;

  this.dom.find("span.user").text("for " + this.currentUser.username);
  this.dom.find("button.submit").html("Update User " + this.currentUser.username);
  //reset all the inputs to unchecked
  this.dom.find("ul.privileges input")
    .prop("checked", false)
    .checkboxradio().checkboxradio("refresh");
  
  //go through each of user's privileges and check the box
  $.each(this.currentUser.privileges, function(i, privCode) {
    input = that.dom.find("input.privilege-" + privCode);
    input.prop("checked", true);
    input.checkboxradio().checkboxradio("refresh");//init/refresh
  });

};


wsp.AdminPage.prototype.onSubmitClick = function(event) {
  //only proceed if we have a user
  if (this.currentUser) {
    var privileges = [];
    var elmt = null;
    this.dom.find("ul.privileges input").each(function(index, element) {
      elmt = $(element);
      if (elmt.prop("checked")){
        privileges.push(elmt.attr("data-privilege-code"));
      }
    });
  
    $.ajax({url: wspApp.Constants.DATA_URL,
            data: {verb: "update", noun: "user",
              userid: this.currentUser.id,
              privileges: privileges.toString()},
                  dataType: "json",
                  context: this})
    .done(function(data){
      this.currentUser.privileges = data.user.privileges;
      //also update if it happens to be this user
      if (wspApp.user.id === data.user.id) {
        wspApp.user.privileges = data.user.privileges;
      }
      this.setError(data.user.username + " updated successfully!");
    })
    .fail(this.ajaxFail);
  }
};

