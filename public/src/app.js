//TODO ADD CLEAR OLD PROJECT DATA AND LOAD NEW PROJECT DATA WHEN CHANGING PROJECT IN SETTINGS BUTTON
//TODO ADD LOCATION MARKER IN CORRECT PLACE IF RTK
//TODO ADD EDIT LINE FEATURES
//TODO ADD OPTION TO ADD PHOTO OR PHOTOS

import {
  dbInit,
  dbLogin,
  dbAuth,
  dbGet,
  dbWriteGeoJSON,
  dbCheckUser,
  getJSON,
  dbToGeoJSON,
  dbWriteNewProject
} from "./dbInit.js";

import {
  layerControl,
  mapChangeCursorOnHover,
  appSettingsControl,
  gpsAccuracyControl,
  mapSetup
} from "./mapHelpers.js"

import {
  initProject
} from "./temp.js"

import {
  Modals,
  Toast
} from "./uiHelpers.js"

var modals = new Modals();
var toast = new Toast();
toast.create();

//WAIT FOR USER TO LOGIN
dbAuth("dbLoginForm", "login", init)

//INITIALIZE PROJECT WITH USERID FROM FIREBASE
function init(user) {

  //LAUNCH MAP
  var projectMap = mapSetup();

  //ADD LISTENER TO LOAD A DIFFERENT PROJECT
  projectMap.on("load", function() {

    //TODO ADD OPTION TO SELECT PROJECTS
    //TODO ADD OPTION TO SELECT ADDITIONAL LAYERS FOR PROJECT - THESE SHOULD ALL BE DEFINED IN A LAYERS CONTROL JSON FILE

    if (!localStorage.getItem("oc-project")) {
      document.querySelector("#settingsControl").children[0].click();
    }else{
      initProject(user, localStorage.getItem("oc-project"), projectMap);
    }
  })

}