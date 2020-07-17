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

/*
getProjectId or putProjectId
getProjectData
mapInit
*/

//WAIT FOR USER TO LOGIN
dbAuth("dbLoginForm", "login", init)

//INITIALIZE PROJECT WITH USERID FROM FIREBASE
function init(user) {

  //SET PROJECT TO LAST PROJECT SAVED
  if (!localStorage.getItem("oc-project")) {
    localStorage.setItem("oc-project", null);
    toast.show("Please create a project with the settings button.");
  }else{
    console.log(localStorage.getItem("oc-project"))
  }

  //LAUNCH MAP
  var projectMap = mapSetup();

  //WAIT FOR MAP TO LOAD, OPEN SETTINGS TO CONFIRM PROJECT SELECTION
  //ON FORM SAVE
  projectMap.on("load", function() {
    document.querySelector("#loading").style.display = "none";

    //TODO ADD OPTION TO SELECT PROJECTS
    //TODO ADD OPTION TO SELECT ADDITIONAL LAYERS FOR PROJECT - THESE SHOULD ALL BE DEFINED IN A LAYERS CONTROL JSON FILE

    document.querySelector("#settingsControl").children[0].click();
    document.querySelector("#ocProjectSettingsForm").addEventListener("submit", function() {
      initProject(user, this.querySelector("#name").value, projectMap);
      //TODO TURN THIS INTO MODALS.CLOSE()
      modals.close()
    })
  })

}