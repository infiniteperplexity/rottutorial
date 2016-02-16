// The ridiculously huge GUI submodule contains all the display and input functions
// There must be some logical way to split this without exposing too many properties...
HTomb = (function(HTomb) {
  "use strict";
  // break out constants
  var SCREENW = HTomb.Constants.SCREENW;
  var SCREENH = HTomb.Constants.SCREENH;
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var NLEVELS = HTomb.Constants.NLEVELS;
  var SCROLLH = HTomb.Constants.SCROLLH;
  var MENUW = HTomb.Constants.MENUW;
  var STATUSH = HTomb.Constants.STATUSH;
  var FONTSIZE = HTomb.Constants.FONTSIZE;
  var UNIBLOCK = HTomb.Constants.UNIBLOCK;
  var EARTHTONE = HTomb.Constants.EARTHTONE;
  var SHADOW = HTomb.Constants.SHADOW;

  var Controls = HTomb.Controls;
  // set up GUI and display
  var GUI = HTomb.GUI;
  GUI.panels = {};
  var Controls = HTomb.Controls;
  var Commands = HTomb.Commands;
  var display = new ROT.Display({width: SCREENW+MENUW, height: SCREENH+STATUSH+SCROLLH, fontSize: FONTSIZE, fontFamily: "Century wewGothic MS"});
  document.body.appendChild(display.getContainer());
  // Attach input events
  var keydown = function(key) {
    // Pass the keystroke to the current control context
    Controls.context.keydown(key);
  };
  var mousedown = function(click) {
    // Due to borders and such, nudge the X and Y slightly
    var xskew = +3;
    var yskew = +7;
    // Convert X and Y from pixels to characters
    var x = Math.floor((click.clientX+xskew)/HTomb.Constants.CHARWIDTH-1);
    var y = Math.floor((click.clientY+yskew)/HTomb.Constants.CHARHEIGHT-1);
    // If the click is not on the game screen, pass the actual X and Y positions
    if (GUI.panels.overlay!==null || x>=SCREENW || y>=SCREENH) {
      Controls.context.clickAt(x,y);
    // If the click is on the game screen, pass the X and Y tile coordinates
    } else {
      Controls.context.clickTile(x+gameScreen.xoffset,y+gameScreen.yoffset);
    }
  };
  var mousemove = function(move) {
    // Due to borders and such, nudge the X and Y slightly
    var xskew = +3;
    var yskew = +7;
    // Convert X and Y from pixels to characters
    var x = Math.floor((move.clientX+xskew)/HTomb.Constants.CHARWIDTH-1);
    var y = Math.floor((move.clientY+yskew)/HTomb.Constants.CHARHEIGHT-1);
    // If the hover is not on the game screen, pass the actual X and Y positions
    if (GUI.panels.overlay!==null || x>=SCREENW || y>=SCREENH) {
      Controls.context.mouseOver(x,y);
    } else {
      // If the hover is on the game screen, pass the X and Y tile coordinates
      Controls.context.mouseTile(x+gameScreen.xoffset,y+gameScreen.yoffset);
    }
  };
  // Bind a ROT.js keyboard constant to a function for a particular context
  var bindKey = function(target, key, func) {
    target.boundKeys[ROT[key]] = func;
  };
  // Set up event listeners
  window.addEventListener("keydown",keydown);
  display.getContainer().addEventListener("mousedown",mousedown);
  display.getContainer().addEventListener("mousemove",mousemove);

  // set up message buffer
  GUI.pushMessage = function(strng) {
    scroll.buffer.push(strng);
    if (scroll.buffer.length>=SCROLLH-1) {
      scroll.buffer.shift();
    }
    // Render the message immediatey if the scroll is visible
    if (GUI.panels.bottom===scroll) {
      scroll.render();
    }
  };
  // Render display panels
  GUI.render = function() {
    if (GUI.panels.overlay !== null) {
      // The overlay, if any, obscures all other panels
      // Shoudl we add one for the minimap?
      GUI.panels.overlay.render();
    } else {
      // Draw all the panels
      GUI.panels.main.render();
      GUI.panels.middle.render();
      GUI.panels.bottom.render();
      GUI.panels.right.render();
      GUI.panels.corner.render();
    }
  };
  // Draw a character at the appropriate X and Y tile
  GUI.drawTile = function(x,y,ch,fg,bg) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    fg = fg || "white"  ;
    bg = bg || "black";
    display.draw(
      x-xoffset,
      y-yoffset,
      ch,
      fg,
      bg
    );
  };
  // Change the background color of the appropriate X and Y tile
  GUI.highlightTile = function(x,y,bg) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    var z = gameScreen.z;
    var sym = HTomb.Tiles.getSymbol(x,y,z);
    display.draw(
      x-xoffset,
      y-yoffset,
      sym[0],
      sym[1],
      bg
    );
  };
  // Display a splash screen
  GUI.splash = function(txt) {
    Controls.context = new ControlContext();
    var splash = new Panel(0,0);
    splash.render = function() {
      display.drawText(splash.x0+1,splash.y0+1, txt);
    };
    GUI.panels.overlay = splash;
    GUI.render();
  };
  // Reset the GUI
  GUI.reset = function() {
    GUI.panels = {
      main: gameScreen,
      middle: status,
      bottom: scroll,
      right: menu,
      corner: hover,
      overlay: null
    };
    menu.text = defaultText;
    Controls.context = main;
    GUI.recenter();
    GUI.render();
  };

  // **************** GUI Panels ******************
  // Each panel knows where it belongs on the screen
  function Panel(leftx,topy) {
    this.x0 = leftx;
    this.y0 = topy;
  }
  Panel.prototype.render = function() {};
  // The main game screen where you see tiles
  var gameScreen = new Panel(0,0);
  // Keep track of how many tiles it is offset from 0, 0
  gameScreen.xoffset = 0;
  gameScreen.yoffset = 0;
  // Keep track of which Z level it is on
  gameScreen.z = 0;
  gameScreen.render = function() {
    var z = gameScreen.z;
    var xoffset = gameScreen.xoffset;
    var yoffset = gameScreen.yoffset;
    for (var x = xoffset; x < xoffset+SCREENW; x++) {
      for (var y = yoffset; y < yoffset+SCREENH; y++) {
        // Draw every symbol in the right place
        var sym = HTomb.Tiles.getSymbol(x,y,z);
        display.draw(this.x0+x-xoffset,this.y0+y-yoffset, sym[0], sym[1], sym[2]);
      }
    }
  };
  // Show status, currently including hit points and coordinates
  var status = new Panel(1,SCREENH);
  status.render = function() {
    //black out the entire line with solid blocks
    display.drawText(this.x0,this.y0+1,"%c{black}"+(UNIBLOCK.repeat(SCREENW-2)));
    display.drawText(this.x0,this.y0+1,"HP: " + 5 + "/" + 5);
    display.drawText(this.x0+15,this.y0+1,"X: " + HTomb.Player._x);
    display.drawText(this.x0+21,this.y0+1,"Y: " + HTomb.Player._y);
    display.drawText(this.x0+27,this.y0+1,"Elevation: " + gameScreen.z);
    display.drawText(this.x0+42,this.y0+1,
      HTomb.World.dailyCycle.hour + ":"+HTomb.World.dailyCycle.minute);
  };
  // Show messages
  var scroll = new Panel(1,SCREENH+STATUSH);
  scroll.buffer = [];
  scroll.render = function() {
    for (var s=0; s<this.buffer.length; s++) {
      //black out the entire line with solid blocks
      display.drawText(this.x0,this.y0+s+1,"%c{black}"+(UNIBLOCK.repeat(SCREENW+MENUW-2)));
      display.drawText(this.x0,this.y0+s+1,this.buffer[s]);
    }
  };
  // Provide the player with instructions
  var menu = new Panel(SCREENW+1,1);
  var defaultText = menu.text = [
    "To move use AWXD,",
    "arrows, or keypad.",
    "G to pick up,",
    "F to drop.",
    ", or . to go down or up.",
    "P to cast a spell",
    "J to assign a job",
    "Click to examine a square.",
    "Shift to enter survey mode."
  ];
  menu.render = function() {
    for (var i=0; i<SCREENH; i++) {
      display.drawText(this.x0, this.y0+i+1, "%c{black}"+(UNIBLOCK.repeat(MENUW-2)));
      if (menu.text[i]) {
        display.drawText(this.x0, this.y0+1+i, menu.text[i]);
      }
    }
  };
  // Show properties of the tile the mouse is hovering over
  var hover = new Panel(SCREENW+1,SCREENH+1);
  hover.text = [
    ["Square: ","Creature: ","Items: ","Feature: ","",""],
    ["","","","","",""]
  ];
  hover.render = function() {
    for (var i=0; i<SCROLLH; i++) {
      display.drawText(this.x0, this.y0+i, "%c{black}"+(UNIBLOCK.repeat(MENUW)));
      display.drawText(this.x0, this.y0+i, hover.text[0][i]);
      display.drawText(this.x0+hover.text[0][i].length, this.y0+i, hover.text[1][i]);
    }
  };

  // Prototype for control contexts
  function ControlContext(bindings) {
    // Pass a map of keystroke / function bindings
    if (bindings===undefined) {
      this.keydown = GUI.reset;
    } else {
      this.boundKeys = [];
      for (var b in bindings) {
        bindKey(this,b,bindings[b]);
      }
    }
  }
  ControlContext.prototype.keydown = function(key) {
    if (  this.boundKeys[key.keyCode]===undefined) {
      HTomb.Debug.pushMessage("No binding for " + key.keyCode);
    } else {
      this.boundKeys[key.keyCode]();
    }
  };
  // By default, clicking resets the GUI
  ControlContext.prototype.clickAt = function() {
    GUI.reset();
  };
  ControlContext.prototype.clickTile = function() {
    GUI.reset();
  };
  // By default, dragging the mouse outside the game screen resets the game screen
  // This clears out highlighted tiles from hovering, for example
  ControlContext.prototype.mouseOver = function() {
    if (GUI.panels.overlay===null) {
      gameScreen.render();
    }
  };
  // An odd place for this method...formats a list of items
  GUI.listItems = function(arr) {
    var mesg = "";
    for (var i = 0; i<arr.length; i++) {
      mesg = mesg + " " + arr[i].describe();
      if (i===arr.length-2) {
        mesg = mesg + ", and";
      } else if (i<arr.length-1) {
        mesg = mesg + ",";
      }
    }
    return mesg;
  };
  // By default, hovering over a tile describes its contents
  ControlContext.prototype.mouseTile = function(x,y) {
    if (GUI.panels.overlay===null) {
      GUI.panels.main.render();
    }
    var z = gameScreen.z;
    GUI.highlightTile(x,y,"#0000FF");
    var square = HTomb.Tiles.getSquare(x,y,z);
    if (square.explored===false) {
      hover.text[0][4] = "";
      hover.text[0][5] = "";
      hover.text[1] = ["","","","","",""];
      hover.render();
      return;
    }
    hover.text[1][0] = square.terrain.name + " at " + x +", " + y + ", " + z + ".";
    if (square.creature) {
      hover.text[1][1] = square.creature.describe();
    } else {
      hover.text[1][1] = "";
    }
    var mesg = "";
    var i;
    if (square.items) {
      hover.text[1][2] = GUI.listItems(square.items);
    } else {
      hover.text[1][2] = "";
    }
    if (square.feature) {
      hover.text[0][3] = "Feature: ";
      hover.text[1][3] = square.feature.describe();
    } else {
      hover.text[1][3] = "";
    }
    var vis;
    if (square.terrain.zview===+1 && z+1<NLEVELS) {
    //if (square.feature && square.feature.zView===+1 && z+1<NLEVELS) {
      hover.text[0][4] = "Above: ";
      hover.text[0][5] = "Above: ";
      vis = HTomb.Tiles.getSquare(x,y,z+1);
      if (vis.creature) {
        hover.text[1][4] = vis.creature.describe();
      } else {
        hover.text[1][4] = "";
      }
      if (vis.items) {
        hover.text[1][5] = GUI.listItems(vis.items);
      } else {
        hover.text[1][5] = "";
      }
    //} else if (square.feature && square.feature.zView===-1 && z-1>=0) {
    } else if (square.terrain.zview===-1 && z-1>=0) {
      hover.text[0][4] = "Below: ";
      hover.text[0][5] = "Below: ";
      vis = HTomb.Tiles.getSquare(x,y,z-1);
      if (vis.creature) {
        hover.text[1][4] = vis.creature.describe();
      } else {
        hover.text[1][4] = "";
      }
      if (vis.items) {
        hover.text[1][5] = GUI.listItems(vis.items);
      } else {
        hover.text[1][5] = "";
      }
      if (vis.feature && !square.feature) {
        hover.text[0][3] = "Below: ";
        hover.text[1][3] = vis.feature.describe();
      }
    } else {
      hover.text[1][4] = "";
      hover.text[1][5] = "";
      hover.text[0][4] = "";
      hover.text[0][5] = "";
    }
    hover.render();
  };

  // Survey mode lets to scan the play area independently from the player's position
  GUI.surveyMode = function() {
    Controls.context = survey;
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    GUI.updateMenu(["You are now in survey mode.","Use movement keys to navigate.","Comma go down.","Period to go up.","Escape to exit."]);
  };

  // These are the default controls
  var main = new ControlContext({
    // bind number pad movement
    VK_LEFT: Commands.tryMoveWest,
    VK_RIGHT: Commands.tryMoveEast,
    VK_UP: Commands.tryMoveNorth,
    VK_DOWN: Commands.tryMoveSouth,
    // bind keyboard movement
    VK_Z: Commands.tryMoveSouthWest,
    VK_S: Commands.wait,
    VK_X: Commands.tryMoveSouth,
    VK_C: Commands.tryMoveSouthEast,
    VK_A: Commands.tryMoveWest,
    VK_D: Commands.tryMoveEast,
    VK_Q: Commands.tryMoveNorthWest,
    VK_W: Commands.tryMoveNorth,
    VK_E: Commands.tryMoveNorthEast,
    VK_PERIOD: Commands.tryMoveDown,
    VK_COMMA: Commands.tryMoveUp,
    VK_G: Commands.pickup,
    VK_F: Commands.drop,
    VK_J: Commands.showJobs,
    VK_P: Commands.showSpells,
    VK_SHIFT: GUI.surveyMode,
    VK_SPACE: Commands.wait
  });

  // Clicking outside the game screen does nothing
  main.clickAt = function(x,y) {
    //do nothing
  };
  // Clicking a tile looks...this may be obsolete
  main.clickTile = function(x,y) {
    var square = HTomb.Tiles.getSquare(x,y,gameScreen.z);
    Commands.look(square);
  };

  // Update the right-hand menu instructions
  GUI.updateMenu = function(txt) {
    menu.text = txt;
    menu.render();
  };

  // Display a menu of letter-bound choices
  GUI.choosingMenu = function(s,arr, func) {
    var alpha = "abcdefghijklmnopqrstuvwxyz";
    var contrls = {};
    var choices = [s];
    // there is probably a huge danger of memory leaks here
    for (var i=0; i<arr.length; i++) {
      var desc = arr[i].describe();
      var choice = arr[i];
      // Bind a callback function and its closure to each keystroke
      contrls["VK_" + alpha[i].toUpperCase()] = func(choice);
      choices.push(alpha[i]+") " + arr[i].describe());
    }
    contrls.VK_ESCAPE = GUI.reset;
    choices.push("Esc to cancel");
    Controls.context = new ControlContext(contrls);
    GUI.updateMenu(choices);
  };

  // Select a single square with the mouse
  HTomb.GUI.selectSquare = function(z, callb, options) {
    options = options || {};
    HTomb.GUI.pushMessage("Select a square.");
    var context = new ControlContext({VK_ESCAPE: GUI.reset});
    HTomb.Controls.context = context;
    context.clickTile = function(x,y) {
      callb(x,y,z);
    };
    if (options.line!==undefined) {
      var x0 = options.line.x || HTomb.Player._x;
      var y0 = options.line.y || HTomb.Player._y;
      var bg = options.line.bg || "#550000";
      context.mouseTile = function(x,y) {
        gameScreen.render();
        var line = HTomb.Path.line(x0,y0,x,y);
        for (var i in line) {
          var sq = line[i];
          HTomb.GUI.highlightSquare(sq[0],sq[1],bg);
        }
      };
    }
  };

  // Select a rectangular zone using its two corners
  HTomb.GUI.selectSquareZone = function(z, callb, options) {
    options = options || {};
    HTomb.GUI.pushMessage("Select the first corner.");
    var context = new ControlContext({VK_ESCAPE: GUI.reset});
    HTomb.Controls.context = context;
    context.clickTile = function (x,y) {
      HTomb.GUI.pushMessage("Select the second corner.");
      context.clickTile = secondSquare(x,y);
      context.mouseTile = drawSquareBox(x,y);
    };
    var drawSquareBox = function(x0,y0) {
      var bg = options.bg || "#550000";
      return function(x1,y1) {
        gameScreen.render();
        var xs = [];
        var ys = [];
        for (var i=0; i<=Math.abs(x1-x0); i++) {
          xs[i] = x0+i*Math.sign(x1-x0);
        }
        for (var j=0; j<=Math.abs(y1-y0); j++) {
          ys[j] = y0+j*Math.sign(y1-y0);
        }
        var squares = [];
        for (var x=0; x<xs.length; x++) {
          for (var y=0; y<ys.length; y++) {
            if (options.outline===true) {
              if (xs[x]===x0 || xs[x]===x1 || ys[y]===y0 || ys[y]===y1) {
                squares.push([xs[x],ys[y],z]);
              }
            } else {
              squares.push([xs[x],ys[y],z]);
            }
          }
        }
        for (var k =0; k<squares.length; k++) {
          var coord = squares[k];
          GUI.highlightTile(coord[0],coord[1],bg);
        }
      };
    };
    var secondSquare = function(x0,y0) {
      return function(x1,y1) {
        var xs = [];
        var ys = [];
        for (var i=0; i<=Math.abs(x1-x0); i++) {
            xs[i] = x0+i*Math.sign(x1-x0);
          }

        for (var j=0; j<=Math.abs(y1-y0); j++) {
          ys[j] = y0+j*Math.sign(y1-y0);
        }
        var squares = [];
        for (var x=0; x<xs.length; x++) {
          for (var y=0; y<ys.length; y++) {
            // If options.outline = true, use only the outline
            if (options.outline===true) {
              if (xs[x]===x0 || xs[x]===x1 || ys[y]===y0 || ys[y]===y1) {
                squares.push([xs[x],ys[y],z]);
              }
            } else {
              squares.push([xs[x],ys[y],z]);
            }
          }
        }
        // Invoke the callback function on the squares selected
        callb(squares);
        GUI.reset();
      };
    };
  };

  // Enter survey mode and save the screen's current position
  var surveyMove = function(dx,dy,dz) {
    var f = function() {
      if (gameScreen.z+dz < NLEVELS || gameScreen.z+dz >= 0) {
        gameScreen.z+=dz;
      }
      if (gameScreen.xoffset+dx < LEVELW-SCREENW && gameScreen.xoffset+dx >= 0) {
        gameScreen.xoffset+=dx;
      }
      if (gameScreen.yoffset+dy < LEVELH-SCREENH && gameScreen.yoffset+dy >= 0) {
        gameScreen.yoffset+=dy;
      }
      GUI.render();
    };
    // Actually this returns a custom function for each type of movement
    return f;
  };

  // Recenter the game screen on the player
  GUI.recenter = function() {
    var Player = HTomb.Player;
    gameScreen.z = Player._z;
    if (Player._x >= gameScreen.xoffset+SCREENW-2) {
      gameScreen.xoffset = Player._x-SCREENW+2;
    } else if (Player._x <= gameScreen.xoffset) {
      gameScreen.xoffset = Player._x-1;
    }
    if (Player._y >= gameScreen.yoffset+SCREENH-2) {
      gameScreen.yoffset = Player._y-SCREENH+2;
    } else if (Player._y <= gameScreen.yoffset) {
      gameScreen.yoffset = Player._y-1;
    }
  };

  // The control context for surveying
  var survey = new ControlContext({
    VK_LEFT: surveyMove(-1,0,0),
    VK_RIGHT: surveyMove(+1,0,0),
    VK_UP: surveyMove(0,-1,0),
    VK_DOWN: surveyMove(0,+1,0),
    // bind keyboard movement
    VK_Z: surveyMove(-1,+1,0),
    VK_S: surveyMove(0,+1,0),
    VK_X: surveyMove(0,+1,0),
    VK_C: surveyMove(+1,+1,0),
    VK_A: surveyMove(-1,0,0),
    VK_D: surveyMove(+1,0,0),
    VK_Q: surveyMove(-1,-1,0),
    VK_W: surveyMove(0,-1,0),
    VK_E: surveyMove(+1,-1,0),
    VK_PERIOD: surveyMove(0,0,-1),
    VK_COMMA: surveyMove(0,0,+1),
    // Exit survey mode and return to the original position
    VK_ESCAPE: function() {
      gameScreen.xoffset = survey.saveX;
      gameScreen.yoffset = survey.saveY;
      gameScreen.z = survey.saveZ;
      GUI.reset();
    }
  });
  survey.clickTile = main.clickTile;

  // Currently implemented, seems slow and I don't know where to put it
  var minimap = {};
  minimap.render = function() {
    var x0 = HTomb.Constants.CHARWIDTH*SCREENW;
    var y0 = 15*HTomb.Constants.CHARHEIGHT;
    var gridSize = 1;
    var ctx = display._context;
    ctx.fillStyle = "black";
    ctx.fillRect(x0,y0,x0+LEVELW*gridSize,y0+LEVELH*gridSize);
    for (var x=0; x<LEVELW; x++) {
      for (var y=0; y<LEVELH; y++) {
        var c = HTomb.Tiles.getSymbol(x,y,gameScreen.z)[1];
        ctx.fillStyle = c;
        ctx.fillRect(x0+x*gridSize,y0+y*gridSize,gridSize,gridSize);
      }
    }
  };


  return HTomb;
})(HTomb);