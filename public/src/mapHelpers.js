
export class layerControl {
  constructor(map, id, layers) {
    var lcMap = map;
    var lc = document.getElementById(id);
    for (var i = 0; i < layers.length; i++) {
      lcMap.addLayer(layers[i]);

      mapChangeCursorOnHover(lcMap, layers[i].id)

      var div = document.createElement("div");
      var label = document.createElement("label");
      var input = document.createElement("input");
      div.classList = "form-group";
      label.classList = "form-checkbox";
      input.type = "checkbox";
      input.name = layers[i].id;
      if (layers[i].layout.visibility === "visible") {
        input.setAttribute("checked", "checked");
      }
      label.onchange = function () {
        if (this.children[0].checked === true) {
          console.log("on");
          lcMap.setLayoutProperty(this.children[0].name, "visibility", "visible");
        }
        else {
          lcMap.setLayoutProperty(this.children[0].name, "visibility", "none");
          console.log("off");
        }
      };
      label.appendChild(input);
      label.innerHTML += `<i class="form-icon"></i> ${layers[i].name}`;
      div.appendChild(label);
      lc.appendChild(div);
    }
  }
}

export function mapChangeCursorOnHover(m,layer) {
  m.on('mouseenter', layer, function () {
    this.getCanvas().style.cursor = 'crosshair';
  });
  m.on('mouseleave', layer, function () {
    this.getCanvas().style.cursor = '';
  });
}

export class gpsAccuracyControl {
  constructor () {
    this.onAdd = function (m) {
      this._btn = document.createElement('button');
      this._btn.type = 'button';
      this._btn['aria-label'] = 'Accuracy Meter';
      this._btn.title = "Accuracy Meter"
      this._btn.innerText = "0.00";
      this._btn.style.minWidth = "36px"
      this._btn.style.width = "auto";
      this._btn.style.padding = "0 5px"
      this._btn.onclick = function () {
        return
      }
      this._container = document.createElement('div');
      this._container.id = "accuracyControl";
      this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      this._container.appendChild(this._btn);
      return this._container;
    }
    this.onRemove = function (text) {
      this._container.parentNode.removeChild(this._container);
    }
    this.update = function(accuracy) {
      if (accuracy < 2) {
        this._btn.style.backgroundColor = "line"
      }else{
        this._btn.style.backgroundColor = "white"
      }
      this._btn.innerText = "+- " + accuracy + " ft";
    }
    this.reset = function() {
      this._btn.style.backgroundColor = "white"
      this._btn.innerText = "0.00";
    }
  }
}

export class appSettingsControl {
  constructor() {
    this.onAdd = function (m) {
      this._btn = document.createElement('button');
      this._btn.type = 'button';
      this._btn['aria-label'] = 'App Settings';
      this._btn.title = "App Settings";
      this._btn.innerHTML = "<img src='/vendor/cog.svg'>";
      this._btn.style.paddingTop = "2px";
      this._btn.onclick = function () {
        if (!document.getElementById("settingsModal")) {
          var settingsModal = document.createElement("div");
          settingsModal.id = "settingsModal";
          settingsModal.classList = "modal";
          settingsModal.innerHTML = `
            <a href="#close" class="modal-overlay" aria-label="Close"></a>
            <div class="modal-container">
              <div class="modal-header">
                <a href="#close" class="btn btn-clear float-right" aria-label="Close"></a>
                <div class="modal-title h5">Project Settings</div>
              </div>
              <div class="modal-body">
                <div class="content">
                <form id="ocProjectSettingsForm">
                  <div class="form-group">
                    <label class="form-label" for="name">Project Name</label>
                    <input class="form-input" id="name" type="text" name="name" placeholder="Name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">External GPS Use RTK Correction</label>
                    <label class="form-radio form-inline">
                      <input type="radio" name="rtk" checked=""><i class="form-icon"></i> Yes
                    </label>
                    <label class="form-radio form-inline">
                      <input type="radio" name="rtk"><i class="form-icon"></i> No
                    </label>
                  </div>
                  <div class="form-group">
                    <button class="btn btn-primary" type="submit" style="width:100%">Launch Project</button>
                  </div>
                </form>
                </div>
              </div>
              <div class="modal-footer">
              </div>
            </div>`;
          document.body.appendChild(settingsModal);
          if (localStorage.getItem("oc-project")) {
           document.querySelector("#name").value = localStorage.getItem("oc-project")   
          }
          document.querySelector("#ocProjectSettingsForm").addEventListener("submit", function(e) {
            e.preventDefault();
            
            var settings = new FormData(document.getElementById("ocProjectSettingsForm"))
            console.log(settings.get("name"), settings.get("rtk"))
            //TODO RELOAD MAP IF PROJECT NAME IS NOT THE ONE SAVED IN LOCALSTORAGE
            localStorage.setItem("oc-project", settings.get("name"))
          })
        }
        window.location.hash = "settingsModal";
      };
      this._container = document.createElement('div');
      this._container.id = "settingsControl";
      this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      this._container.appendChild(this._btn);
      return this._container;
    };
    this.onRemove = function (text) {
      this._container.parentNode.removeChild(this._container);
    };
  }
}



export function mapSetup() {
  var config = new URLSearchParams(window.location.search);
  var values = [...config.values()]
  var keys = [...config.keys()]
  console.log(keys, values)
  var str = "dark";
  var style = (values.indexOf(str) > -1) ? "mapbox://styles/cozgis/cjwmext6m123v1dmznevlle1p" : "mapbox://styles/cozgis/cjvpkkmf211dt1dplro55m535";

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
  map.addControl(new appSettingsControl(), 'bottom-right');

  return map
}

