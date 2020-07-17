import {
  dbGet,
  dbWriteGeoJSON,
  dbToGeoJSON,
  dbWriteNewProject
} from "./dbInit.js";

import {
  layerControl,
  gpsAccuracyControl
} from "./mapHelpers.js"

import {
  Toast
} from "./uiHelpers.js"

export function initProject(userId, projectId, map) {

  const toast = new Toast();

  getProject(userId, projectId, map)

  function getProject(userId, projectId) {
    dbGet("users/" + userId)
      .then(function (data) {
        console.log(data);
        var projects = Object.keys(data.projects)
        if (projects.indexOf(projectId) > -1) {
          getProjectData(userId, projectId)
        } else {
          dbWriteNewProject(userId, projectId)
        }
      })
  }

  function getProjectData(id, projectName) {
    dbGet("projects/" + id + "/" + projectName + "/data")
      .then(data => {
        mapAddLayersAndControls(map, id, projectName, data)
      })
      .catch(err => {
        console.log(err)
      })
  }

  function mapAddLayersAndControls(map, id, project, data) {

    console.log(data)

    var map = map;

    const mapLayers = [];

    const pointFirebaseString = "projects/" + id + "/" + project + "/data/points";
    const lineFirebaseString = "projects/" + id + "/" + project + "/data/lines";

    var points = (!data || !data.points) ? turf.featureCollection([]) : dbToGeoJSON(data.points);
    var lines = (!data || !data.lines) ? turf.featureCollection([]) : dbToGeoJSON(data.lines);

    var featureSelected = {};
    var featureAdded = false;

    const pointFeatureFields = {
      "a": {
        "title": "Accuracy",
        "hidden": true
      },
      "t": {
        "title": "Title",
      },
      "n": {
        "title": "Notes",
        "textarea": true
      },
      "e": {
        "title": "Last Edit",
        "hidden": true
      },
      "k": {
        "title": "Unique ID",
        "hidden": true
      },
      "rtk": {
        "title": "RTK Fixed Position",
        "hidden": true
      }
    }

    const lineFeatureFields = {
      "t": {
        "title": "Name",
      },
      "c": {
        "title": "Class",
        "options": ["Main", "Lateral", "Ditch", "Open Channel"]
      },
      "d": {
        "title": "Diameter",
        "min": 1,
        "max": 60,
        "value": 10
      },
      "s": {
        "title": "Sub Class",
        "options": ["A"]
      },
      "e": {
        "title": "Last Edit",
        "hidden": true
      },
      "k": {
        "title": "Unique ID",
        "hidden": true
      }
    }

    const subClasses = {
      "Manhole": [],
      "Outfall": [],
      "Fitting": [],
      "Inlet": []
    }

    ///

    // ef9a9a
    // f48fb1
    // ce93d8
    // b39ddb
    // b39ddb
    // 90caf9
    // 81d4fa
    // 00e5ff
    // 80cbc4
    // a5d6a7
    // c5e1a5
    // e6ee9c
    // fff59d
    // ffe082
    // ffcc80
    // ffab91
    // Red
    // Pink
    // Purple
    // Deep Purple
    // Indigo
    // Blue
    // Light Blue
    // Cyan
    // Teal
    // Green
    // Light Green
    // Lime
    // Yellow
    // Amber
    // Orange
    // Deep Orange  

    var blank = {
      "type": "FeatureCollection",
      "features": []
    };

    map.addSource("benchmarks", {
      type: "geojson",
      data: "/geojson/bm_wgs84_geo.json"
    });

    map.addSource("projectPoints", {
      type: "geojson",
      data: points
    });

    map.addSource("projectLines", {
      type: "geojson",
      data: lines
    });

    map.addSource("highlight", {
      type: "geojson",
      data: {
        "type": "FeatureCollection",
        "features": []
      }
    });

    // 
    //GET DATA FOR EVERY CHANGE
    // 

    function featuresGetData(database, source) {
      map.getSource("highlight").setData(turf.featureCollection([]))
      dbGet(database)
        .then(function (data) {
          var geojson = dbToGeoJSON(data)
          map.getSource(source).setData(geojson)
          if (document.getElementById("loading")) document.getElementById("loading").style.display = "none";
        })
    }


    //FIREBASE DATA LISTENERS

    var dbListener = firebase.database().ref("projects/" + id + "/" + project + "/data/points");

    dbListener.on("value", function () {
      console.log('point data has changed')
      featuresGetData("projects/" + id + "/" + project + "/data/points", "projectPoints")
    })

    dbListener.limitToLast(1).on("child_added", function (snapshot) {
      console.log("child_added fired")
      if (featureAdded === true) {

        console.log("new point added")
        var firebasePoint = snapshot.val();
        console.log(firebasePoint)
        var tempPoint = turf.point(firebasePoint.xy);
        tempPoint.properties = firebasePoint.p;
        console.log(window.location.hash)
        // setTimeout(function() {
        //   loaders[1].style.display = "none";
        //   featureEditFormBuilder(tempPoint);
        // }, 500);
      }
    });

    var dbListener2 = firebase.database().ref("projects/" + id + "/" + project + "/data/lines");

    dbListener2.on("value", function () {
      console.log('line data has changed')
      featuresGetData("projects/" + id + "/" + project + "/data/lines", "projectLines")
    });

    dbListener2.limitToLast(1).on("child_added", function (snapshot) {
      console.log("child_added fired")
      if (featureAdded === true) {
        // loaders[1].style.display = "block";
        console.log("new line added")
        var firebaseLine = snapshot.val();
        console.log(firebaseLine)
        var tempLine = turf.lineString([
          [firebaseLine.xy[0], firebaseLine.xy[1]],
          [firebaseLine.xy[2], firebaseLine.xy[3]]
        ]);
        tempLine.properties = firebaseLine.p;
        console.log(window.location.hash)
        // setTimeout(function() {
        //   loaders[1].style.display = "none";
        //   featureEditFormBuilder(tempLine);
        // }, 500);
      }
    });

    // #18ff8c sewers

    var layers = [{
        "id": "referenceLinesCase",
        "type": "line",
        "source": {
          "type": "geojson",
          "data": "https://311.coz.org/data/geojson/utl_sanitary_lines.geojson"
        },
        "name": "Reference Lines Case",
        "minzoom": 12,
        "paint": {
          "line-color": "white",
          "line-opacity": 1,
          "line-width": {
            "stops": [
              [12, 7],
              [22, 9]
            ]
          }
        },
        "layout": {
          "visibility": "visible"
        }
      },
      {
        "id": "referenceLines",
        "type": "line",
        "source": {
          "type": "geojson",
          "data": "https://311.coz.org/data/geojson/utl_sanitary_lines.geojson"
        },
        "name": "Reference Lines",
        "minzoom": 12,
        "paint": {
          "line-color": "green",
          "line-opacity": 1,
          "line-width": {
            "stops": [
              [12, 4],
              [22, 6]
            ]
          }
        },
        "layout": {
          "visibility": "visible"
        }
      },
      {
        "id": "referencePoints",
        "type": "circle",
        "source": {
          "type": "geojson",
          "data": "https://311.coz.org/data/geojson/utl_sanitary_points.geojson"
        },
        "name": "Reference Points",
        "minzoom": 12,
        "paint": {
          "circle-color": "green",
          "circle-radius": {
            "stops": [
              [12, 3],
              [22, 9]
            ]
          },
          "circle-stroke-color": "#fff",
          "circle-stroke-width": {
            "stops": [
              [12, 2],
              [22, 4]
            ]
          },
          "circle-stroke-opacity": 0.6,
          "circle-blur": 0
        },
        "layout": {
          "visibility": "visible"
        }
      },
      {
        "id": "benchmarks",
        "type": "circle",
        "name": "Benchmarks",
        "source": "benchmarks",
        "minzoom": 10,
        "paint": {
          "circle-color": "red",
          "circle-radius": {
            "stops": [
              [12, 3],
              [22, 9]
            ]
          },
          "circle-stroke-color": "yellow",
          "circle-stroke-width": {
            "stops": [
              [12, 2],
              [22, 4]
            ]
          },
          "circle-stroke-opacity": 0.6,
          "circle-blur": 0
        },
        "layout": {
          "visibility": "visible"
        }
      },
      {
        "id": "linesCasing",
        "type": "line",
        "source": "projectLines",
        "name": "Digitized Lines Casing",
        "minzoom": 12,
        "paint": {
          "line-color": "#fff",
          "line-opacity": 0.6,
          "line-width": {
            "stops": [
              [12, 6],
              [22, 8]
            ]
          }
        },
        "layout": {
          "visibility": "visible"
        }
      },
      {
        "id": "projectLines",
        "type": "line",
        "source": "projectLines",
        "name": "Digitized Lines",
        "minzoom": 4,
        "paint": {
          "line-color": "#ff5bff",
          "line-opacity": 1,
          "line-width": {
            "stops": [
              [12, 2],
              [22, 4]
            ]
          }
        },
        "layout": {
          "visibility": "visible"
        }
      },
      {
        "id": "projectPoints",
        "type": "circle",
        "source": "projectPoints",
        "minzoom": 4,
        "paint": {
          "circle-color": [
            "match",
            ["get", "name"],
            "benchmark", "#ffff00",
            "#9e00c5"
          ],
          "circle-radius": {
            "stops": [
              [12, 3],
              [22, 9]
            ]
          },
          "circle-stroke-color": "#fff",
          "circle-stroke-width": {
            "stops": [
              [12, 2],
              [22, 4]
            ]
          },
          "circle-stroke-opacity": 0.6,
          "circle-blur": 0
        },
        "layout": {
          "visibility": "visible"
        }
      }
    ]

    new layerControl(map, "layerControl", layers)

    layers.map(l => {
      mapLayers.push(l.id)
    })

    map.addLayer({
      "id": "highlight-line",
      "type": "line",
      "source": "highlight",
      "minzoom": 4,
      "paint": {
        "line-color": "gold",
        "line-width": {
          "stops": [
            [12, 2],
            [22, 6]
          ]
        },
        "line-opacity": 0.6,
      }
    });

    map.addLayer({
      "id": "highlight-circle",
      "type": "circle",
      "source": "highlight",
      "minzoom": 4,
      "paint": {
        "circle-color": "transparent",
        "circle-radius": {
          "stops": [
            [12, 3],
            [22, 9]
          ]
        },
        "circle-stroke-color": "gold",
        "circle-stroke-width": {
          "stops": [
            [12, 2],
            [22, 6]
          ]
        },
        "circle-stroke-opacity": 0.6,
      }
    });

    var gps = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      maxZoom: 22
    });
    map.addControl(gps)

    document.getElementById("mapToolbarBottom").appendChild((new locationControl()).onAdd(map));
    document.getElementById("mapToolbarBottom").appendChild((new addPointControl()).onAdd(map));
    document.getElementById("mapToolbarBottom").appendChild((new pointConnectControl()).onAdd(map));

    var accuracyControl = new gpsAccuracyControl()
    map.addControl(accuracyControl, "top-left");
    map.addControl(new dataDownloadControl());

    var gpsAccuracy = document.getElementById("position");

    var accuracy = 10;
    var coords = [
      -83.5997023,
      39.6890376
    ];

    gps.on("geolocate", function (data) {
      console.log(data)

      accuracy = (data.coords.accuracy * 3.28084).toFixed(2)

      accuracyControl.update(accuracy)

      coords = [Number(data.coords.longitude), Number(data.coords.latitude)];

      if (accuracy > 20 && !gpsAccuracy.classList.contains("text-error")) {
        gpsAccuracy.classList.add("text-error")
        document.getElementById("locationControl").children[0].style.backgroundColor = "orange"
      }
      if (accuracy < 10) {
        gpsAccuracy.classList.remove('text-error')
        document.getElementById("locationControl").children[0].style.backgroundColor = "orange"
      }
      if (accuracy < 2) {
        gpsAccuracy.classList.remove('text-error')
        document.getElementById("locationControl").children[0].style.backgroundColor = "lime"
      }
      gpsAccuracy.innerHTML = `Accuracy: ${accuracy} ft&nbsp;&nbsp; ${coords[0]},${coords[1]}`;
    });

    gps.on('trackuserlocationend', function () {
      console.log('stopped tracking location');
      gpsAccuracy.classList.remove('text-error')
      gpsAccuracy.innerHTML = "";
      document.getElementById("locationControl").children[0].style.backgroundColor = "lightgray";
      accuracyControl.reset()
    })

    map.on('click', mapGetInfo)

    function mapGetInfo(e) {
      featureSelected = blank;

      map.getSource("highlight").setData(featureSelected)

      var features = map.queryRenderedFeatures(e.point, {
        layers: mapLayers
      });

      if (features.length > 0) {

        /////////////
        //HIGHLIGHT//
        featureSelected = features[0];
        console.log(features)
        map.getSource("highlight").setData(featureSelected)
        /////////////

        if (featureSelected.source != "projectPoints") {
          let html = "";
          for (let p in featureSelected.properties) {
            html += `<strong>${p}</strong>&nbsp;&nbsp;${featureSelected.properties[p]}<br>`
          }
          new mapboxgl.Popup({
              closeOnClick: true
            })
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map);
        } else {
          featureEditFormBuilder(featureSelected)
        }
        // var featureType = (features[0].layer.id === "projectPoints") ? "Expand to View Point Properties" : "Expand to View Line Properties";
        // var html = `<h5>${featureType}</h5>`;
        // for (let property in features[0].properties) {
        //   html += `<strong>${property}</strong><br>${features[0].properties[property]}<br>`
        // }
        // toast.children[2].innerHTML = html;
        // toast.classList.add("toast-popup");
        // toast.classList.add("toast-active");
      } else {
        dbCreatePoint(e);
        toast.remove()
      }
    }

    function dbCreatePoint(position) {
      console.log(position)

      var coords = (position.coords) ? [position.coords.longitude, position.coords.latitude] : (position.lngLat) ? [position.lngLat.lng, position.lngLat.lat] : false;
      document.getElementById("position").innerText = JSON.stringify(coords);

      if (!coords) return

      var positionAccuracy = (!position.coords) ? 9999 : (position.coords.accuracy * 3.28084).toFixed(2);
      if (document.getElementById("loading")) document.getElementById("loading").style.display = "none";
      if (positionAccuracy > 0 && positionAccuracy < 20000) {
        var date = Date.now();
        var isoDateEdited = new Date(date).toISOString();
        var properties = {
          "a": positionAccuracy,
          "e": isoDateEdited
        };

        //TODO CHANGE TO CONFIG SETTING//
        if (positionAccuracy < 4) {
          coords = rtkTransform(coords);
          properties.rtk = "true"
        } else {
          properties.rtk = "false"
        }

        var newFeature = {
          "type": "Feature",
          "layer": "projectPoints",
          "properties": properties,
          "geometry": {
            "type": "Point",
            "coordinates": coords
          }
        };


        featureEditFormBuilder(newFeature);

        // dbWriteGeoJSON(pointFirebaseString, firebaseGeoJSON, null, dbWriteCallback)
      } else {
        alert(positionAccuracy)
      }
    }

    function rtkTransform(point) {
      var nad83ITRF00 = "+proj=longLat +ellps=GRS80 +towgs84=-0.9956,1.9013,0.5215,0.025915,0.009246,0.011599,-0.00062 +units=degrees +no_defs";

      var nad83NoTransform = "+proj=longLat +ellps=GRS80 +towgs84=0,0,0 +units=degrees +no_defs";

      var pointInNAD83 = proj4(nad83NoTransform, point);

      return proj4(nad83ITRF00, 'WGS84', pointInNAD83)
    }

    function dataDownloadControl() {
      this.onAdd = function (m) {
        this._btn = document.createElement('button');
        this._btn.type = 'button';
        this._btn['aria-label'] = 'Download Data';
        this._btn.title = "Download Data"
        this._btn.innerHTML = "<img src='/vendor/file-download.svg'>";
        this._btn.onclick = function () {
          var fileName = 'firebasePointsCollection.geojson';

          var fileToSave = new Blob([JSON.stringify(points)], {
            type: 'application/json',
            name: fileName
          });

          saveAs(fileToSave, fileName);
        }
        this._container = document.createElement('div');
        this._container.id = "dataDownloadControl";
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        this._container.appendChild(this._btn);
        return this._container;
      }
      this.onRemove = function () {
        this._container.parentNode.removeChild(this._container);
      }
    }

    function pointConnectControl() {

      this.onAdd = function (m) {
        this._btn = document.createElement('button');
        this._btn.type = 'button';
        this._btn['aria-label'] = 'Connect Assets';
        this._btn.title = "Connect Assets";
        this._btn.classList = "btn btn-primary btn-action btn-lg";
        this._btn.innerHTML = '<i class="icon icon-link"></i>';
        // this._btn.innerHTML = "<img src='https://icongr.am/material/plus-network.svg'>";
        this._btn.onclick = function () {
          map.off("click", mapGetInfo)
          featureSelected = blank;
          map.getSource("highlight").setData(featureSelected)
          if (!this.classList.contains("active")) {
            this.classList.add("active")
            this.style.backgroundColor = "orangered";
            this.children[0].src = 'https://icongr.am/material/close-network.svg';
            pointConnect(lines, points)
          } else {
            this.classList.remove("active");
            this.children[0].src = 'https://icongr.am/material/plus-network.svg';

            toast.remove()

            this.style.backgroundColor = "";
            map.off("click", getUpstreamFeature);
            map.off("click", getDownstreamFeature);
            map.on("click", mapGetInfo)
          }
        }
        this._container = document.createElement('span');
        this._container.id = "pointConnectControl";
        // this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        this._container.appendChild(this._btn);
        return this._container;
      }
      this.onRemove = function () {
        this._container.parentNode.removeChild(this._container);
      }
    }

    function pointConnect(linesGeojson, pointsGeojson, a) {
      var pointConnection = {};

      if (!linesGeojson || !pointsGeojson) {
        alert('no geojson objects specified')
        return
      }

      if (a) {
        console.log("asking for downstream feature")
        // toast.show("Click on the downstream asset.");
        map.once('click', getDownstreamFeature)
      } else {
        console.log("getting upstream feature")
        // toast.classList.remove("toast-popup");
        // toast.classList.add("toast-active");
        // toast.children[2].innerHTML = "Click on the upstream asset.";
        map.once('click', getUpstreamFeature)
      }
    }

    function getUpstreamFeature(e) {
      let features = map.queryRenderedFeatures(e.point, {
        layers: ["projectPoints", "referencePoints"]
      });
      if (features.length > 0) {
        featureSelected = features[0];
        map.getSource("highlight").setData(featureSelected)
        console.log(featureSelected)
        pointConnect(lines, points, featureSelected.geometry.coordinates);
      } else {
        map.once('click', getUpstreamFeature)
      }
    }

    function getDownstreamFeature(e) {
      var features = map.queryRenderedFeatures(e.point, {
        layers: ["projectPoints", "referencePoints"]
      });
      if (features.length > 0) {
        var b = features[0].geometry.coordinates;
        var pointConnection = [featureSelected.geometry.coordinates, b]
        console.log(pointConnection);
        var feature = turf.lineString(pointConnection);
        feature.properties.e = new Date(Date.now()).toISOString();
        var firebaseGeoJSON = {
          xy: (featureSelected.geometry.coordinates).concat(b),
          p: feature.properties
        }
        console.log(firebaseGeoJSON)
        dbWriteGeoJSON(lineFirebaseString, firebaseGeoJSON, null, dbWriteCallback)
        toast.remove()
        document.getElementById("pointConnectControl").children[0].click();
      } else {
        map.once('click', getUpstreamFeature)
      }
    }

    document.querySelector(".btn-clear").addEventListener("click", function () {
      this.parentElement.children[2].innerHTML = "";
      this.parentElement.classList.remove("toast-active");
      this.parentElement.classList.remove("toast-full");
      if (document.getElementById("pointConnectControl") && document.getElementById("pointConnectControl").children[0].classList.contains("active")) {
        document.getElementById("pointConnectControl").children[0].click();
      }
    })

    document.querySelector(".btn-expand").addEventListener("click", function () {
      this.parentElement.classList.add("toast-full");
    })


    function featureEditFormBuilder(feature) {
      var fields = feature.properties;
      var geometry = feature.geometry.coordinates;
      var deleteFeature = false;
      // var layer = (feature.layer.id === "lines") ? "test-lines2": "test-points2";

      document.getElementById("edit").querySelector(".content").children[0].remove()

      var form = document.createElement("form");

      var fieldSchema = (feature.layer.type === "line") ? lineFeatureFields : pointFeatureFields

      for (let field in fieldSchema) {
        var entry = fieldSchema[field];
        var value = (!fields[field]) ? "" : fields[field]

        if (entry.hidden === true) {
          form.innerHTML += `<div class="form-group">
            <label class="form-label" for="${entry.title}">${entry.title}</label>
            <input class="form-input" type="text" readonly="readonly" value="${value}" name="${field}">
          </div>`
        }
        if (entry.min) {
          form.innerHTML += `<label class="form-label" for="${entry.title}">${entry.title}</label>
          <input class="slider tooltip" type="range" min="${entry.min}" max="${entry.max}" value="${entry.value}" oninput="this.setAttribute('value', this.value);">`
        }

        if (fieldSchema[field].textarea) {
          form.innerHTML += `<div class="form-group">
            <label class="form-label" for="${entry.title}">${entry.title}</label>
            <textarea rows="3" class="form-input" placeholder="${entry.title}" name="${field}">${value}</textarea>
          </div>`
        }

        if (fieldSchema[field].hidden != true && !fieldSchema[field].options && !fieldSchema[field].textarea) {
          form.innerHTML += `<div class="form-group">
            <label class="form-label" for="${entry.title}">${entry.title}</label>
            <input class="form-input" type="text" value="${value}" placeholder="${entry.title}" name="${field}">
          </div>`
        }
        if (fieldSchema[field].hidden != true && fieldSchema[field].options) {
          form.innerHTML += `<div class="form-group">
            <label class="form-label" for="${entry.title}">${entry.title}</label>
            <select class="form-select" name="${field}" value="${value}">
            ${(fieldSchema[field].options).map((item,i) => `
              <option ${item === value ? 'selected="selected"' : '' }>${item}</option> `
              ).join("")}
            </select>
            </div>`
        }

      }

      var button = document.createElement("button");
      button.classList = "btn btn-outline form-input";
      button.type = "button"
      button.innerHTML = '<i class="icon icon-plus"></i>';
      button.style.marginTop = "20px"

      form.appendChild(button);

      form.innerHTML += `<br><input class="form-input btn btn-success float-left" style="width:30%" type="submit" value="Submit"><a href="#close"><input class="form-input btn btn-outline float-right" style="width:30%" type="button" value="Cancel"></a></div>`

      form.innerHTML += `<br><br><input class="form-input btn btn-sm btn-error float-left" type="submit" value="Delete Feature"></input>`

      form.onsubmit = function (e) {
        e.preventDefault();
        // if (deleteFeature) {
        //   var areusure = confirm("Are you sure you want to delete the feature?")
        //   if (areusure != true) {
        //     window.location.hash = "close"
        //     return
        //   }
        // }

        var properties = {};
        var data = new URLSearchParams(new FormData(this))
        var keys = [...data.keys()];
        var values = [...data.values()];
        for (var i = 0; i < keys.length; i++) {
          properties[keys[i]] = values[i]
        }

        //CHECK IF EDITS HAVE BEEN MADE, IF NOT WHEN CLICKING SUBMIT SIMPLY RETURN AND DO NOT EDIT SAVE THE NON EDITS
        if (!deleteFeature && propertiesCompare(featureSelected.properties, properties)) {
          window.location.hash = "close"
          return
        }

        var key = (!properties.k) ? null : properties.k;
        if (feature.layer.id === "projectLines") {
          geometry = [geometry[0][0], geometry[0][1], geometry[1][0], geometry[1][1]]
        }
        console.log(geometry)
        var firebaseGeoJSON = {
          xy: geometry,
          p: properties
        }
        if (deleteFeature) firebaseGeoJSON.delete = true;
        console.log(firebaseGeoJSON)
        dbWriteGeoJSON(pointFirebaseString, firebaseGeoJSON, key, dbWriteCallback)
      };

      form.addEventListener("click", function (e) {
        if (e.target.type === "button" || e.target.classList.contains("icon-plus")) {
          var x = this.children.length - 2;
          var input = document.createElement("div");
          input.classList = "form-group";
          input.innerHTML = `
            <label class="form-label" for="custom_field_${x}">Custom Field ${x}</label>
            <input class="form-input" type="text" value="" placeholder="" name="custom_field_${x}">
          `
          this.insertBefore(input, this.childNodes[this.children.length - 3])
        }
        if (e.target.type === "submit" && e.target.value === "Delete Feature") {
          deleteFeature = true
        }
      })

      document.getElementById("edit").querySelector(".content").appendChild(form);
      window.location.hash = "#edit";
    }

    // FIREBASE SUCCESS ERROR CALLBACK 

    function dbWriteCallback(error) {
      if (error) {
        console.log("error:", error);
        window.location.hash = "#close";
        alert("Either the GPS did is off or something went wrong. Please try again. If the problem persosts stop using this application and contact the administrator.", error)
      } else {
        featureAdded = true;
        console.log("write complete");
        if (document.getElementById("loading")) document.getElementById("loading").style.display = "none";
        window.location.hash = "#success";
        toast.show("Feature Saved");
        toast.success();
      }
    }

    function propertiesCompare(a, b) {
      if (!a || !b) {
        return false
      }
      let equal = true
      for (let i in a) {
        if (b[i] && a[i] != b[i]) {
          equal = false
        }
      }
      return equal
    };

    function addPointControl() {

      this.onAdd = function (m) {
        this._btn = document.createElement('button');
        this._btn.type = 'button';
        this._btn['aria-label'] = 'Add Feature';
        this._btn.title = "Add Feature"
        this._btn.classList = "btn btn-primary btn-action btn-lg";
        this._btn.style = 'width:2.4rem;height:2.4rem;'
        this._btn.innerHTML = '<i class="icon icon-plus"></i>'
        this._btn.onclick = function () {
          if (document.getElementById("loading")) document.getElementById("loading").style.display = "block";

          getLocation();

          function getLocation() {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(dbCreatePoint, locationError, {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
              });
            } else {
              alert("Geolocation is turned off or not supported by this browser.");
            }
          }

          function locationError(error) {
            if (document.getElementById("loading")) document.getElementById("loading").style.display = "none";
            console.log(error)
          }

        }
        this._container = document.createElement('span');
        this._container.appendChild(this._btn);
        return this._container;
      }
      this.onRemove = function () {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
      }
    }


    function locationControl() {
      this.onAdd = function (m) {
        this._btn = document.createElement('button');
        this._btn.type = 'button';
        this._btn['aria-label'] = 'Location Control';
        this._btn.title = "Toggle GPS";
        this._btn.classList = "btn btn-primary btn-action btn-lg";
        this._btn.style.backgroundColor = "lightgray"
        this._btn.innerHTML = '<i class="icon icon-location"></i>';
        // this._btn.innerHTML = "<img src='https://icongr.am/material/plus-network.svg'>";
        this._btn.onclick = function () {
          gps.trigger();
        }
        this._container = document.createElement('span');
        this._container.id = "locationControl";
        // this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        this._container.appendChild(this._btn);
        return this._container;
      }
      this.onRemove = function () {
        this._container.parentNode.removeChild(this._container);
      }
    }


  }

}