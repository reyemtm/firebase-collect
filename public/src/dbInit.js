export function getJSON(config) {
  return fetch(config).then(res => res.json())
}



export function dbInit(user) {

  dbInitProject(user)

  function dbInitProject(u) {
    console.log(u)
  }

}

export function dbCheckUser(callback) {
  return firebase.auth().onAuthStateChanged(callback)
}

export function dbAuth (dbLoginId, loginId, callback) {
  var currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        var userId = firebase.auth().currentUser.uid;
        console.log(`successfully logged in user ${userId}`);
        if (callback) {
          callback(userId)
        }
      } else {
        window.location.hash = "#" + loginId
        dbLogin(dbLoginId)
      }
    });
  }
}

export function dbLogin(id) {
  document.getElementById(id).addEventListener("submit", function(e) {
    e.preventDefault();
    var inputs = this.getElementsByTagName("input");
    firebase.auth().signInWithEmailAndPassword(inputs[0].value,inputs[1].value)
    .then(function() {
      window.location.hash = "close"
    })
    .catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      alert("Wrong username or password, continuing as a Viewer Only. Refresh the page to try logging in again.");
      console.error(errorCode, errorMessage);
    })
  })
}

export function dbGet(database) {
  return firebase.database().ref(database).once('value')
  .then(function (snapshot) {
    return snapshot.val();
  });
}

export function dbWritePoint(database, coordinates, props, callback) {
  console.log(coordinates, props)
  var db = firebase.database().ref().child(database);
  var key = db.push().key;
  var update = {};
  var newEntry = {
    lng: coordinates[0],
    lat: coordinates[1],
    properties: props
  }
  update[key] = newEntry;
  console.log(update);
  db.update(update);
  callback()
}

export function dbWriteGeoJSON(layer, feature, key, callback) {
  if (key) {
    var db = firebase.database().ref().child(layer + '/' + key);
    if (feature.delete) {
      console.log(feature)
      db.remove()
      callback()
    }else {
      db.set(feature, callback)
    }
  }else{
    //create new feature
    var db = firebase.database().ref().child(layer);
    var newFeature = db.push();
    feature.p.k = newFeature.key;
    newFeature.set(feature, callback)
  }
}

export function dbToGeoJSON(data) {
  var features = [];
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
    features.push(feature)
  }
  return turf.featureCollection(features)
}