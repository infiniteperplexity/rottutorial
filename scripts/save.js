// This submodule handles saving the game
HTomb = (function(HTomb) {
  "use strict";
  let LEVELW = HTomb.Constants.LEVELW;
  let LEVELH = HTomb.Constants.LEVELH;
  let NLEVELS = HTomb.Constants.NLEVELS;

  // Global value for the name of the current game
  HTomb.Save.currentGame = "test";
  // Main game-saving function
    // Takes name and, implicitly, game state
    // Encodes as JSON and then posts data to server
  HTomb.Save.saveGame = function(name) {
    HTomb.Time.lockTime();
    console.time("save game");
    name = name || HTomb.Save.currentGame;
    let totalN = HTomb.World.things.length;
    batchMap(function(v, i, a) {
        return HTomb.Save.stringifyThing(v, true);
      }, HTomb.World.things,
    {
        splitby: 1000,
        progress: function(i) {
          console.log(parseInt(100*i/totalN).toString() + "% complete (" + i + " entities.)");
          HTomb.GUI.Views.progressView(["Saving game:",parseInt(100*i/totalN).toString() + "% complete"]);
        },
        then: function(rslt) {
          HTomb.GUI.pushMessage("Finished saving " + rslt.length + " entities.");
          console.timeEnd("save game");
          let things = rslt.join(',');
          things = '['.concat(things,']');
          let tiles = HTomb.Save.stringifyThing(HTomb.World.tiles, false);
          let explored = HTomb.Save.stringifyThing(HTomb.World.explored, false);
          let covers = HTomb.Save.stringifyThing(HTomb.World.covers, false);
          let lights = HTomb.Save.stringifyThing(HTomb.World.lights, false);
          let cycle = HTomb.Save.stringifyThing(HTomb.Time.dailyCycle, false);
          let json = '{'.concat(
            '"things": ', things, ", ",
            '"tiles": ', tiles, ", ",
            '"explored": ', explored, ", ",
            '"covers": ', covers, ", ",
            '"lights": ', lights, ", ",
            '"cycle": ', cycle,
            '}'
          );
          //console.time("complex parse");
          //HTomb.Save.restoreGame(json);
          //console.timeEnd("complex parse");
          postData(name, json);
          HTomb.GUI.splash(["Finished saving "+"'"+name+"'."]);
        }
      }
    );
  };
  // Send the XMLHTTP POST request to save game
  function postData(name, json) {
    var file = 'saves/' + name + '.json';
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", file, true);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(json);
    console.log("probably should have success/fail message...");
    HTomb.Time.unlockTime();
  }
  // Helper function to split job and unlock DOM
  function batchMap(func, arr, options) {
    options = options || {};
    let splitby = options.splitby || 1;
    let then = options.then || function() {};
    let progress = options.progress || function(i) {console.log(i);};
    let retn = [];
    let count = 0;
    let recurse = function() {
      for (; count<arr.length; count++) {
        retn.push(func(arr[count], count, arr));
        if (count>=arr.length-1) {
          then(retn);
        }
        if (count>0 && count%splitby===0) {
          progress(count);
          count++;
          setTimeout(recurse);
          break;
        }
      }
    };
    recurse();
  }
  // Custom JSON encoding
  HTomb.Save.stringifyThing = function(obj, topLevel) {
    let json = JSON.stringify(obj, function(key, val) {
      if (val===undefined) {
        //console.log("why is val undefined?");
        return undefined;
      } else if (val===null) {
        //console.log("could I just do null normally?");
        return null;
      }
      // if it has special instructions, use those to stringify
      if (val.stringify) {
        return val.stringify();
        // if it's from the global things table, stringify it normally
      } else if (topLevel===true && val.thingId!==undefined) {
        if (val.template==="Player") {
          console.log("hit the player.");
        }
        topLevel = false;
        let dummy = {};
        let template = HTomb.Things.templates[val.template];
        for (let p in val) {
          if (p==="template" || val[p]!==template[p]) {
            dummy[p] = val[p];
          }
        }
        if (dummy.thingId) {
          delete dummy.thingId;
        }
        return dummy;
      // if it's on the global things table, stringify its ID
      } else if (val.thingId!==undefined) {
        return {tid: val.thingId};
      } else {
        return val;
      }
    }," ");
    return json;
  };
  // End code for saving games

  // Code for listing saved games in directory
  HTomb.Save.getDir = function(callback) {
    getDir(callback);
  };
  function getDir(callback) {
    console.time("get request");
    var file = '/saves/';
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.status == 200) {
          console.log("Got our JSON, now we should do something with it.");
          console.log(xhttp.responseText);
          callback(xhttp.responseText);
          console.timeEnd("get request");
        } else if (xhttp.status == 400) {
          console.log("There was an error 400");
        } else {
          console.log("Something other than 200 was returned.");
        }
        HTomb.Time.unlockTime();
      }
    };
    xhttp.open("GET", file, true);
    xhttp.send();
  }
  // End code for listing directory contents

  // Code for restoring games
  HTomb.Save.getData = function(name, callback) {
    HTomb.Time.lockTime();
    HTomb.GUI.Views.progressView(["Restoring '" + name + "'..."]);
    getData(name, callback);
  };
  //function getData(file) {
  function getData(name, callback) {
    name = name || currentGame;
    console.time("get request");
    var file = 'saves/'+ name + '.json';
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.status == 200) {
          console.log("Got our JSON, now we should do something with it.");
          console.log(xhttp.responseText.length);
          callback(xhttp.responseText);
          //let json = JSON.parse(xhttp.responseText);
          console.timeEnd("get request");
        } else if (xhttp.status == 400) {
          console.log("There was an error 400");
        } else {
          console.log("Something other than 200 was returned.");
        }
        HTomb.Time.unlockTime();
      }
    };
    xhttp.open("GET", file, true);
    xhttp.send();
  }

  HTomb.Save.restoreGame = function(json) {
    let tids = [];
    //let templates = [];
    let player = null;
    // parse while keeping a list of references to thingIds
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...parsing JSON..."
    ]);
    let saveGame = JSON.parse(json, function (key, val) {
      if (val===null) {
        return null;
      } else if (val.tid) {
        tids.push([this,key,val]);
        return undefined;
      } else if (val.ItemContainer) {
        let ic = new HTomb.ItemContainer();
        ic.parent = this;
        for (let i=0; i<val.ItemContainer.length; i++) {
          // length somehow gets really messed up here...
          if (val.ItemContainer[i]===undefined) {
            continue;
          }
          ic.push(val.ItemContainer[i]);
        }
        return ic;
      } else if (val.template) {
        let template = HTomb.Things.templates[val.template];
        let dummy = Object.create(template);
        for (let p in val) {
          if (p!=="template" || val[p]!==template[p]) {
            dummy[p] = val[p];
          }
        }
        if (val.template==="Player") {
          console.log("found player");
          player = val;
        }
      }
      return val;
    });
    // swap all thingId references for their thing
    for (let i=0; i<tids.length; i++) {
      let tid = tids[i];
      tid[0][tid[1]] = saveGame.things[tid[2].tid];
    }
    //HTomb.Player = player.entity;
    fillListFrom(saveGame.things, HTomb.World.things);
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding map..."
    ]);
    fillGrid3dFrom(saveGame.tiles, HTomb.World.tiles, HTomb.Types.parseTile);
    fillGrid3dFrom(saveGame.explored, HTomb.World.explored);
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding entity lists..."
    ]);
    fillListFrom(saveGame.creatures, HTomb.World.creatures);
    fillListFrom(saveGame.items, HTomb.World.items);
    fillListFrom(saveGame.features, HTomb.World.features);
    fillListFrom(saveGame.zones, HTomb.World.zones);
    console.log("filled entities");
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding liquids and ground cover..."
    ]);
    //fillListFrom(saveGame.covers, HTomb.World.covers, HTomb.Types.parseCover);
    HTomb.GUI.Views.progressView([
      "Restoring game:",
      "...rebuilding time cycle and visibility..."
    ]);
    HTomb.Time.dailyCycle.turn = saveGame.cycle.turn;
    HTomb.Time.dailyCycle.minute = saveGame.cycle.minute;
    HTomb.Time.dailyCycle.hour = saveGame.cycle.hour;
    HTomb.Time.dailyCycle.day = saveGame.cycle.day;
    HTomb.FOV.resetVisible();
    if (HTomb.Player.sight) {
      HTomb.FOV.findVisible(HTomb.Player.x, HTomb.Player.y, HTomb.Player.z, HTomb.Player.sight.range);
    }
    HTomb.GUI.Panels.gameScreen.recenter();
    console.log("refreshed visibility");
    HTomb.Time.unlockTime();
    HTomb.GUI.splash(["Game restored."]);
  };

  function fillListFrom(fromList, toList, callb) {
    // default callback is to return self
    callb = callb || function(x) {return x;};

    // if fromList is an array
    if (Array.isArray(fromList) && Array.isArray(toList)) {
      while(toList.length>0) {
        toList.pop();
      }
      for (let i=0; i<fromList.length; i++) {
        toList.push(callb(fromList[i]));
      }
    // if fromList is an associative array
    } else {
      for (let t in toList) {
        delete toList[t];
      }
      for (let f in fromList) {
        toList[f] = callb(fromList[f]);
      }
    }
  };

  function fillGrid3dFrom(fromGrid, toGrid, callb) {
  // default callback is to return self
    callb = callb || function(x) {return x;};
    // pull all elements from old grid
    for (let z=0; z<NLEVELS; z++) {
      for (let x=0; x<LEVELW; x++) {
        for (let y=0; y<LEVELH; y++) {
          toGrid[z][x][y] = callb(fromGrid[z][x][y]);
        }
      }
    }
  };

  return HTomb;

})(HTomb);
