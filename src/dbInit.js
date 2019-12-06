export function dbInit() {
  // Initialize Firebase
  return fetch("./firebaseConfig.json").then(res => res.json())
}

export function dbAuthChange (dbLoginId, closeId, loginId, callback) {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        user = firebase.auth().currentUser;
        const userId = user.uid;
        console.log(`successfully logged in user ${user}, ${userId}`)
        if (window.location.hash != "#edit") {
          window.location.hash = "#" + closeId
        }
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
    firebase.auth().signInWithEmailAndPassword(inputs[0].value,inputs[1].value).catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      alert("Wrong username or password, continuing as a Viewer Only. Refresh the page to try logging in again.");
      console.error(errorCode, errorMessage);
    })
    // .then(function() {
    //   console.log(firebase.auth().currentUser)
    //   return firebase.auth().currentUser
    // })
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
    //edit feature
    var db = firebase.database().ref().child(layer + '/' + key);
    console.log(db)
    db.set(feature, callback)
  }else{
    var db = firebase.database().ref().child(layer);
    //create new feature
    var newFeature = db.push();
    feature.p.k = newFeature.key;
    newFeature.set(feature, callback)
  }
}