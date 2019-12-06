/**
 * [X] TODO add properties modal dialog for lines
 * [ ] TODO Add feature form builder after adding location, then have a submit button which writes the location, instead of vice versa
 * TODO Adjust placement of buttons to not to conflict with toast
 * TODO look at adding toast at top
 * TODO hide native gps control
 * TODO incorporate into current theme
 * TODO Disable submit if no changes were made
 * TODO add all classes and sub classes
 * TODO add logic for determining which classes get put into the modal window
 * TODO add sanitary layers
 * TODO add addresses?
 * TODO change submit button to check and cancel buttons
 * [X] TODO make highlight for features or
 * [X] TODO add properties modal dialog with dropdowns for points
 * [X] TODO add edit modal on click or put in toast
 * [X] TODO Cancel out of the network connection
 * [X] TODO keep track of current feature either clicked or sent to the database
 * [X] TODO make global currently selected feature for variety of things
 * [X] TODO success alert of toast on success of writing feature
 */

import {
  dbInit,
  dbLogin,
  dbAuthChange,
  dbGet,
  dbWriteGeoJSON
} from "./dbInit.js";

import {
  layerControl
} from "./mapLayerControl.js"

// INITIALIZE FIREBASE

dbInit()
.then(config => {
  firebase.initializeApp(config)
  init()
})

function init() {

  dbLogin("dbLoginForm")

  dbAuthChange("dbLoginForm", "close", "login")

  //GLOBAL VARIABLES
  const loaders = document.getElementsByClassName('loading-background');
  const toast = document.querySelector('.toast');
  var featureSelected = {};
  var featureAdded = false;

  // const pointFeatureFields = {
  //   "a": {
  //     "title": "Accuracy",
  //     "hidden": true
  //   },
  //   "t": {
  //     "title": "Name",
  //   },
  //   "c": {
  //     "title": "Class",
  //     "options": ["Unknown", "Bend", "Cap", "Coupling", "Cross", "Expansion", "Over Under", "Reducer", "Reducing Cross", "Reducing Tee", "Sleeve", "Tee", "Transition"]
  //   },
  //   "s": {
  //     "title": "Sub Class",
  //     "options": ["A"]
  //   },
  //   "e": {
  //     "title": "Last Edit",
  //     "hidden": true
  //   },
  //   "k": {
  //     "title": "Unique ID",
  //     "hidden": true
  //   }
  // }

  const pointFeatureFields = {
    "a": {
      "title": "Accuracy",
      "hidden": true
    },
    "t": {
      "title": "Title",
    },
    "n": {
      "title": "Notes"
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

  /**
   * map
   */
  /*200 colors*/
  /*
  ef9a9a
  f48fb1
  ce93d8
  b39ddb
  b39ddb
  90caf9
  81d4fa
  00e5ff
  80cbc4
  a5d6a7
  c5e1a5
  e6ee9c
  fff59d
  ffe082
  ffcc80
  ffab91
  Red
  Pink
  Purple
  Deep Purple
  Indigo
  Blue
  Light Blue
  Cyan
  Teal
  Green
  Light Green
  Lime
  Yellow
  Amber
  Orange
  Deep Orange
  */

  var config = new URLSearchParams(window.location.search);

  var values = [...config.values()]
  var keys = [...config.keys()]
  console.log(keys, values)
  var str = "dark";
  var style = (values.indexOf(str) > -1) ? "mapbox://styles/cozgis/cjwmext6m123v1dmznevlle1p" : "mapbox://styles/cozgis/cjvpkkmf211dt1dplro55m535";
  // var featureSave = (keys.ind)
  // var colors =

  mapboxgl.accessToken = "pk.eyJ1IjoiY296Z2lzIiwiYSI6ImNqZ21lN2R5ZDFlYm8ycXQ0a3R2cmI2NWgifQ.z4GxUZe5JXAdoRR4E3mvpg";

  var map = new mapboxgl.Map({
    container: 'map',
    hash: true,
    style: style,
    center: [-82.02148, 39.940994],
    zoom: 14
  });
  
  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.FullscreenControl());

  var gps = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    maxZoom: 18
  });
  map.addControl(gps)
  // document.getElementById("right").appendChild(gps.onAdd(map));

  document.getElementById("mapToolbarBottom").appendChild((new locationControl()).onAdd(map));
  document.getElementById("mapToolbarBottom").appendChild((new pointAddControl()).onAdd(map));
  document.getElementById("mapToolbarBottom").appendChild((new pointConnectControl()).onAdd(map));
  // 
  map.addControl(new dataDownloadControl());

  /*End Blank Map*/

  var points = {
    "type": "FeatureCollection",
    "features": []
  };

  var lines = {
    "type": "FeatureCollection",
    "features": []
  };

  var blank = {
    "type": "FeatureCollection",
    "features": []
  };

  map.on('load', function () {

    map.addSource("benchmarks", {
      type: "geojson",
      data: "/geojson/bm_wgs84_geo.json"
    });

    // start location on map loaders
    gps.trigger();

    /** add map sources */
    map.addSource("points", {
      type: "geojson",
      data: points
    });

    map.addSource("lines", {
      type: "geojson",
      data: lines
    });

    map.addSource("highlight", {
      type: "geojson",
      data:   {
        "type": "FeatureCollection",
        "features": []
      }
    });

    /**
     * get data from firebase and sync for every change
     */

    function featuresGetData(database, geojson, source) {
      loaders[0].style.display = 'block';
      dbGet(database)
        .then(function (data) {
          geojson.features = [];
          for (let d in data) {
            var feature = {};
            var properties = data[d].p;
            var geom = data[d].xy;
            if (geom.length < 4) {
              feature = turf.point(geom)
            } else {
              feature = turf.lineString([
                [geom[0], geom[1]],
                [geom[2], geom[3]]
              ])
            }
            feature.properties = properties;
            geojson.features.push(feature)
          }
          console.log(geojson)
          map.getSource(source).setData(geojson)
          loaders[0].style.display = "none";
        })
    }

    /**
     * firebase data listeners
     */

    var dbListener = firebase.database().ref('test-points2');

    dbListener.on("value", function () {
      console.log('point data has changed')
      featuresGetData("test-points2", points, "points")
    })

    dbListener.limitToLast(1).on("child_added", function (snapshot) {
      console.log("child_added fired")
      if (featureAdded === true) {
        loaders[1].style.display = "block";
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

    var dbListener2 = firebase.database().ref('test-lines2');

    dbListener2.on("value", function () {
      console.log('line data has changed')
      featuresGetData("test-lines2", lines, "lines")
    });

    dbListener2.limitToLast(1).on("child_added", function (snapshot) {
      console.log("child_added fired")
      if (featureAdded === true) {
        loaders[1].style.display = "block";
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

    /*#18ff8c sewers*/

    var referenceLayers = [
      {
        "id": "referenceLines",
        "type": "line",
        "source": {
          "type": "geojson",
          "data": "https://311.coz.org/data/geojson/utl_stormwater_stm_lines.geojson"
        },
        "name": "Reference Lines",
        "minzoom": 12,
        "paint": {
          "line-color": "gray",
          "line-opacity": 1,
          "line-width": {
            "stops": [
              [12,4],
              [22,6]
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
          "data": "https://311.coz.org/data/geojson/utl_stormwater_stm_points.geojson"
        },
        "name": "Reference Points",
        "minzoom": 12,
        "paint": {
          "circle-color": "gray",
          "circle-radius": {
            "stops": [
              [12,3],
              [22,9]
            ]
          },
          "circle-stroke-color": "#fff",
          "circle-stroke-width": {
            "stops": [
              [12,2],
              [22,4]
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

    new layerControl(map, "layerControl", referenceLayers);

    var layers = [
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
              [12,3],
              [22,9]
            ]
          },
          "circle-stroke-color": "yellow",
          "circle-stroke-width": {
            "stops": [
              [12,2],
              [22,4]
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
        "source": "lines",
        "name": "Digitized Lines Casing",
        "minzoom": 12,
        "paint": {
          "line-color": "#fff",
          "line-opacity": 0.6,
          "line-width": {
            "stops": [
              [12,6],
              [22,8]
            ]
          }
        },
        "layout": {
          "visibility": "visible"
        }
      },
      {
        "id": "lines",
        "type": "line",
        "source": "lines",
        "name": "Digitized Lines",
        "minzoom": 12,
        "paint": {
          "line-color": "#ff5bff",
          "line-opacity": 1,
          "line-width": {
            "stops": [
              [12,2],
              [22,4]
            ]
          }
        },
        "layout": {
          "visibility": "visible"
        }
      }
    ]

    new layerControl(map, "layerControl", layers)

    map.addLayer({
      "id": "highlight-line",
      "type": "line",
      "source": "highlight",
      "minzoom": 12,
      "paint": {
        "line-color": "gold",
        "line-width": {
          "stops": [
            [12,2],
            [22,6]
          ]
        },
        "line-opacity": 0.6,
      }
    });

    map.addLayer({
      "id": "points",
      "type": "circle",
      "source": "points",
      "minzoom": 12,
      "paint": {
        "circle-color": [
          "match",
          ["get", "name"],
          "benchmark", "#ffff00",
          "#9e00c5"
        ],
        "circle-radius": {
          "stops": [
            [12,3],
            [22,9]
          ]
        },
        "circle-stroke-color": "#fff",
        "circle-stroke-width": {
          "stops": [
            [12,2],
            [22,4]
          ]
        },
        "circle-stroke-opacity": 0.6,
        "circle-blur": 0
      }
    });

    map.addLayer({
      "id": "highlight-circle",
      "type": "circle",
      "source": "highlight",
      "minzoom": 12,
      "paint": {
        "circle-color": "transparent",
        "circle-radius": {
          "stops": [
            [12,3],
            [22,9]
          ]
        },
        "circle-stroke-color": "gold",
        "circle-stroke-width": {
          "stops": [
            [12,2],
            [22,6]
          ]
        },
        "circle-stroke-opacity": 0.6,
      }
    });

    map.on('mouseenter', 'points', function () {
      map.getCanvas().style.cursor = 'crosshair';
    });

    map.on('mouseleave', 'points', function () {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'referencePoints', function () {
      map.getCanvas().style.cursor = 'crosshair';
    });

    map.on('mouseleave', 'referencePoints', function () {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'lines', function () {
      map.getCanvas().style.cursor = 'crosshair';
    });

    map.on('mouseleave', 'lines', function () {
      map.getCanvas().style.cursor = '';
    });

  });

  var gpsAccuracy = document.getElementById("position");

  var accuracy = 10;
  var coords = [
    -83.5997023,
    39.6890376
  ];

  gps.on("geolocate", function (data) {
    console.log(data)
    accuracy = (data.coords.accuracy * 3.28084).toFixed(2)
    coords = [Number(data.coords.longitude), Number(data.coords.latitude)];
    if (accuracy > 20 && !gpsAccuracy.classList.contains("text-error")) {
      gpsAccuracy.classList.add("text-error")
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
    document.getElementById("locationControl").children[0].style.backgroundColor = "lightgray"
  })

  map.on('click', mapGetInfo)

  function mapGetInfo(e) {
    featureSelected = blank;
    map.getSource("highlight").setData(featureSelected)
    var features = map.queryRenderedFeatures(e.point, {
      layers: ["lines", "points", "benchmarks"]
    });
    if (features.length > 0) {
      featureSelected = features[0];
      map.getSource("highlight").setData(featureSelected)
      console.log(featureSelected);
      if (featureSelected.source === "benchmarks") {
        let popup = new mapboxgl.Popup({closeOnClick: true})
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${featureSelected.properties.setting}<strong><p>${featureSelected.properties["DEC_LON"]},${featureSelected.properties["DEC_LAT"]}</p>`)
        .addTo(map);
      }else{
        featureEditFormBuilder(featureSelected)
      }
      // var featureType = (features[0].layer.id === "points") ? "Expand to View Point Properties" : "Expand to View Line Properties";
      // var html = `<h5>${featureType}</h5>`;
      // for (let property in features[0].properties) {
      //   html += `<strong>${property}</strong><br>${features[0].properties[property]}<br>`
      // }
      // toast.children[2].innerHTML = html;
      // toast.classList.add("toast-popup");
      // toast.classList.add("toast-active");
    } else {
      dbCreatePoint(e);
      toast.classList.remove("toast-active");
    }
  }

  function pointAddControl() {

    this.onAdd = function (m) {
      this._btn = document.createElement('button');
      this._btn.type = 'button';
      this._btn['aria-label'] = 'Add Feature';
      this._btn.title = "Add Feature"
      this._btn.classList = "btn btn-primary btn-action btn-lg";
      this._btn.style = 'width:2.4rem;height:2.4rem;'
      this._btn.innerHTML = '<i class="icon icon-plus"></i>'
      this._btn.onclick = function () {
        loaders[0].style.display = "block";
        featureAdded = true;
        console.log("get location")
        
        getLocation();

        function getLocation() {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(dbCreatePoint, locationError, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 200
            });
          } else {
            alert("Geolocation is turned off or not supported by this browser.");
          }
        }
        
        function locationError(error) {
          loaders[0].style.display = "none";
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

  function dbCreatePoint(position) {
    
    var coords = (position.coords) ? [position.coords.longitude,position.coords.longitude] : (position.lngLat) ? [position.lngLat.lng, position.lngLat.lat] : false;
    if (!coords) return
    console.log(coords)
    var positionAccuracy = (!position.coords) ? 9999 : (position.coords.accuracy  * 3.28084).toFixed(2);
    loaders[0].style.display = "none";
    console.log(position)
    if (positionAccuracy > 0 && positionAccuracy < 10000) {
      var date = Date.now();
      var isoDateEdited = new Date(date).toISOString();
      var properties = {
        "a": positionAccuracy,
        "e": isoDateEdited
      };
      var newFeature = {
        "type": "Feature",
        "layer": "test-points2",
        "properties": properties,
        "geometry": {
          "type": "Point",
          "coordinates": coords
        }
      };

      featureEditFormBuilder(newFeature)
      // points.features.push(newFeature)
      // m.getSource("points").setData(points)
      // var firebaseGeoJSON = {
      //   xy: coords,
      //   p: properties
      // }
      // dbWriteGeoJSON("test-points2", firebaseGeoJSON, null, dbWriteCallback)
    } else {
      alert(positionAccuracy)
    }
  }

  function dataDownloadControl() {
    this.onAdd = function (m) {
      this._btn = document.createElement('button');
      this._btn.type = 'button';
      this._btn['aria-label'] = 'Download Data';
      this._btn.title = "Download Data"
      this._btn.innerHTML = "<img src='https://icongr.am/material/file-download.svg'>";
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
          toast.children[2].innerText = "";
          toast.classList.remove("toast-active")
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

  function pointConnect(linesGeojson, pointsGeojson, a) {
    var pointConnection = {};

    if (!linesGeojson || !pointsGeojson) {
      alert('no geojson objects specified')
      return
    }

    if (a) {
      console.log("asking for downstream feature")
      toast.children[2].innerHTML = "Click on the downstream asset.";
      map.once('click', getDownstreamFeature)
    } else {
      console.log("getting upstream feature")
      toast.classList.remove("toast-popup");
      toast.classList.add("toast-active");
      toast.children[2].innerHTML = "Click on the upstream asset.";
      map.once('click', getUpstreamFeature)
    }
  }

  function getUpstreamFeature(e) {
    let features = map.queryRenderedFeatures(e.point, {
      layers: ["points", "referencePoints"]
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
      layers: ["points", "referencePoints"]
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
      dbWriteGeoJSON("test-lines2", firebaseGeoJSON, null, dbWriteCallback)
      toast.classList.remove("toast-active");
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
    var key = (feature.properties.k) ? null : feature.properties.k;
    var geometry = feature.geometry.coordinates;
    var layer = (feature.layer.id === "lines") ? "test-lines2": "test-points2";

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
      continue
      }
      if (fieldSchema[field].hidden != true && !fieldSchema[field].options) {
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

    form.addEventListener("click", function(e) {
      console.log(this.childNodes)
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
    })

    form.innerHTML += `<br><input class="form-input btn btn-primary float-left" type="submit" value="Submit"></div>`

    form.onsubmit = function (e) {
      e.preventDefault()
      var properties = {};
      var data = new URLSearchParams(new FormData(this))
      var keys = [...data.keys()];
      var values = [...data.values()];
      for (var i = 0; i < keys.length; i++) {
        properties[keys[i]] = values[i]
      }
      console.log(properties)
      featureSelected.properties = properties;
      if (feature.layer.id === "lines") {
        geometry = [geometry[0][0], geometry[0][1], geometry[1][0], geometry[1][1]]
      }
      var firebaseGeoJSON = {
        xy: geometry,
        p: properties
      }
      console.log(firebaseGeoJSON)
      dbWriteGeoJSON(layer, firebaseGeoJSON, key, dbWriteCallback)
    };

    document.getElementById("edit").querySelector(".content").appendChild(form);
    window.location.hash = "#edit";
  }

  /**FIREBASE SUCCESS ERROR CALLBACK */

  function dbWriteCallback(error) {
    if (error) {
      console.log("error:", error);
      window.location.hash = "#close";
      alert("Either the GPS did is off or something went wrong. Please try again. If the problem persosts stop using this application and contact the administrator.", error)
    } else {
      featureAdded = true;
      console.log("write complete")
      window.location.hash = "#success";
      toast.children[2].innerHTML = "Feature Saved";
      toast.classList.add("toast-active");
      toast.classList.add("toast-success");
      setTimeout(function () {
        toast.classList.remove("toast-active");
      }, 1500);
      setTimeout(function () {
        toast.classList.remove("toast-success");
      }, 1800)
    }
  }
}