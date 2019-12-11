
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