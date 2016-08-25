// The lowest-level GUI functionality, interacting with the DOM directly or through ROT.js.
HTomb = (function(HTomb) {
  "use strict";
  // break out constants
  var SCREENW = HTomb.Constants.SCREENW;
  var SCREENH = HTomb.Constants.SCREENH;
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var NLEVELS = HTomb.Constants.NLEVELS;
  var SCROLLH = HTomb.Constants.SCROLLH;
  var SCROLLW = HTomb.Constants.SCROLLW;
  var MENUW = HTomb.Constants.MENUW;
  var MENUH = HTomb.Constants.MENUH;
  var STATUSH = HTomb.Constants.STATUSH;
  var FONTSIZE = HTomb.Constants.FONTSIZE;
  var UNIBLOCK = HTomb.Constants.UNIBLOCK;
  var EARTHTONE = HTomb.Constants.EARTHTONE;
  var SHADOW = HTomb.Constants.SHADOW;
  var FONTFAMILY = HTomb.Constants.FONTFAMILY;
  var CHARHEIGHT = HTomb.Constants.CHARHEIGHT;
  var CHARWIDTH = HTomb.Constants.CHARWIDTH;
  var TEXTFONT = HTomb.Constants.TEXTFONT;
  var TEXTSIZE = HTomb.Constants.TEXTSIZE;
  var XSKEW = HTomb.Constants.XSKEW;
  var YSKEW = HTomb.Constants.YSKEW;
  var TEXTSPACING = HTomb.Constants.TEXTSPACING;
  var TEXTWIDTH = HTomb.Constants.TEXTWIDTH;
  var coord = HTomb.Utils.coord;
  // set up GUI and display
  var GUI = HTomb.GUI;

  let Panels = GUI.Panels;
  let gameScreen = Panels.gameScreen;
  let menu = Panels.menu;
  let scroll = Panels.scroll;
  let status = Panels.status;
  let overlay = Panels.overlay;

  // Basic rendering of panels
  // Keep track of how many tiles it is offset from 0, 0
  gameScreen.xoffset = 0;
  gameScreen.yoffset = 0;
  // Keep track of which Z level it is on
  gameScreen.z = 1;
  gameScreen.render = function() {
    var z = gameScreen.z;
    var xoffset = gameScreen.xoffset;
    var yoffset = gameScreen.yoffset;
    for (var x = xoffset; x < xoffset+SCREENW; x++) {
      for (var y = yoffset; y < yoffset+SCREENH; y++) {
        if (gameScreen.z===undefined) {
          alert("wtf!");
        }
        // Draw every symbol in the right
        var sym = HTomb.Tiles.getSymbol(x,y,z);
        display.draw(this.x0+x-xoffset,this.y0+y-yoffset, sym[0], sym[1], sym[2]);
      }
    }
    Main.renderParticles();
  };
  var oldSquares;
  Main.renderParticles = function() {
    var squares = {};
    var p,c,x,y,z;
    // collect the particles
    for (var j=0; j<HTomb.Particles.emitters.length; j++) {
      var emitter = HTomb.Particles.emitters[j];
      for (var i=0; i<emitter.particles.length; i++) {
        p = emitter.particles[i];
        // don't collect particles that aren't on the screen
        x = Math.round(p.x);
        if (x<gameScreen.xoffset || x>=gameScreen.xoffset+SCREENW || x>=LEVELW-1) {
          continue;
        }
        y = Math.round(p.y);
        if (y<gameScreen.yoffset || y>=gameScreen.yoffset+SCREENH || y>=LEVELH-1) {
          continue;
        }
        z = Math.round(p.z);
        // only bother with particles on the same level for now...or maybe within one level?
        //if (z!==gameScreen.z) {
        //  continue;
        //}
        c = coord(x,y,z);
        if (squares[c]===undefined) {
          squares[c] = [];
        }
        squares[c].push(p);
      }
    }
    // process the particles
    for (var s in squares) {
      if (oldSquares[s]) {
        delete oldSquares[s];
      }
      c = HTomb.Utils.decoord(s);
      x = c[0];
      y = c[1];
      z = c[2];
      var particles = squares[s];
      HTomb.Utils.shuffle(particles);
      var ch, fg;
      // if there are ever invisible particles we may need to handle this differently
      fg = HTomb.Tiles.getGlyph(x,y,z)[1];
      fg = ROT.Color.fromString(fg);
      for (var k=0; k<particles.length; k++) {
        var pfg = particles[k].fg;
        pfg[0] = Math.min(255,Math.max(pfg[0],0));
        pfg[1] = Math.min(255,Math.max(pfg[1],0));
        pfg[2] = Math.min(255,Math.max(pfg[2],0));
        //fg = HTomb.Utils.alphaHex(pfg, fg, particles[k].alpha);
        fg = HTomb.Utils.alphaHex(pfg, fg, particles[k].alpha);
      }
      fg[0] = Math.round(fg[0]);
      fg[1] = Math.round(fg[1]);
      fg[2] = Math.round(fg[2]);
      fg = ROT.Color.toHex(fg);
      ch = particles[particles.length-1].symbol;
      Main.drawGlyph(x,y,ch,fg);
    }
    // clean up expired particles
    for (var o in oldSquares) {
      c = HTomb.Utils.decoord(o);
      x = c[0];
      y = c[1];
      Main.refreshTile(x,y);
    }
    oldSquares = squares;
  };

  status.render = function() {
    //black out the entire line with solid blocks
    var cursor = 0;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"%c{black}"+(UNIBLOCK.repeat(SCROLLW-2)));
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Mana:" + HTomb.Player.caster.mana + "/" + HTomb.Player.caster.maxmana);
    cursor+=12;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"X:" + HTomb.Player.x);
    cursor+=6;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Y:" + HTomb.Player.y);
    cursor+=6;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Z:" + gameScreen.z);
    cursor+=7;
    scrollDisplay.drawText(this.x0+cursor,this.y0+1,
      HTomb.Time.dailyCycle.getPhase().symbol + " "
      + HTomb.Time.dailyCycle.day + ":"
      + HTomb.Time.dailyCycle.hour + ":"
      + HTomb.Time.dailyCycle.minute);
    cursor+=11;
    if (HTomb.Time.isPaused()===true) {
      scrollDisplay.drawText(this.x0+cursor,this.y0+1,"Paused");
    }
  };
  scroll.buffer = [];
  scroll.render = function() {
    for (var s=0; s<this.buffer.length; s++) {
      //black out the entire line with solid blocks
      scrollDisplay.drawText(this.x0,this.y0+s+1,"%c{black}"+(UNIBLOCK.repeat(SCREENW+MENUW-2)));
      scrollDisplay.drawText(this.x0,this.y0+s+1,this.buffer[s]);
    }
  };
  menu.render = function() {
    for (var i=0; i<SCREENH+SCROLLH; i++) {
      menuDisplay.drawText(this.x0, this.y0+i, "%c{black}"+(UNIBLOCK.repeat(MENUW-2)));
      if (menu.text[i]) {
        var j = 0;
        if (menu.text[i].charAt(0)===" ") {
          for (j=0; j<menu.text[i].length; j++) {
            if (menu.text[i].charAt(j)!==" ") {
              break;
            }
          }
        }
        menuDisplay.drawText(this.x0+j, this.y0+i, menu.text[i]);
      }
    }
  };

  let Main = GUI.Main = {};

  GUI.reset = function() {
    if (overlay.active) {
      overlay.hide();
    }
    GUI.Contexts.active = GUI.Contexts.main;
    // This shoudl probably be handled a bit differently?
    GUI.updateMenu(); // menu.refresh();
    GUI.recenter(); // gameScreen.recenter();
    GUI.render(); // Actions.render();
  };
  // This should probably be an Event, not a GUI method
  GUI.sensoryEvent = function(strng,x,y,z) {
    if (HTomb.World.visible[HTomb.Utils.coord(x,y,z)]) {
      GUI.pushMessage(strng);
    }
  };
  GUI.pushMessage = function(strng) {
    scroll.buffer.push(strng);
    if (scroll.buffer.length>=SCROLLH) {
      scroll.buffer.shift();
    }
    // Render the message immediatey if the scroll is visible
    if (GUI.panels.bottom===scroll) {
      scroll.render();
    }
  };
  HTomb.Debug.pushMessage = function(msg) {
    if (HTomb.Debug.messages===true) {
      HTomb.GUI.pushMessage(msg);
      console.log(msg);
    }
  };

  // Render all four default panels
  Main.render = function() {
    gameScreen.render();
    status.render();
    scroll.render();
    menu.render();
  };

  // **** Set default controls
  // By default, clicking resets the GUI
  Contexts.default.clickAt = function() {
    GUI.reset();
  };
  Contexts.default.rightClickTile = function(x,y) {
    this.clickTile(x,y);
  };
  Contexts.default.clickTile = function() {
    GUI.reset();
  };
  // By default, dragging the mouse outside the game screen resets the game screen
  // This clears out highlighted tiles from hovering, for example
  var oldCursor = null;
  Contexts.default.mouseOver = function() {
    if (oldCursor!==null) {
      Main.refreshTile(oldCursor[0],oldCursor[1]);
    }
    oldCursor = null;
  };

  Contexts.default.mouseTile = function(x,y) {
    if (oldCursor!==null) {
      Main.refreshTile(oldCursor[0],oldCursor[1]);
    }
    Main.highlightTile(x,y,"#0000FF");
    oldCursor = [x,y];
    var z = gameScreen.z;
    var txt = examineSquare(x,y,z); // Not sure yet what to do here
    var myText = this.menuText || getDefaultText(); // Not sure yet what to do here
    GUI.displayMenu(myText.concat(" ").concat(txt)); // Not sure yet what to do here
  };
  Main.getDefaultText = function() { // Not sure yet what to do here
    if (HTomb.Debug.tutorial.active!==true) {
      return defaultText;
    } else {
      let tutorialText = defaultText.concat([" ","TUTORIAL:",HTomb.Debug.tutorial.getText()]);
      return tutorialText;
    }
  }
  var defaultText = [
    "Movement: NumPad / Arrows.",
    "(Shift+Arrows for diagonal.)",
    "J: Assign Job, Z: Cast Spell.",
    "G: Pick Up, D: Drop, I: Inventory.",
    "Space: Wait, Tab: Survey Mode.",
    "PageUp / PageDown to change speed.",
    "Hover mouse to examine a square.",
    "Click to pause or unpause.",
    "Right click for detailed view.",
    "Escape for summary view."
  ];
  //******end defaults


  // *** Drawing on the game screen *****
  Main.refreshTile = function(x,y) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    var z = gameScreen.z;
    var sym = HTomb.Tiles.getSymbol(x,y,z);
    display.draw(
      x-xoffset,
      y-yoffset,
      sym[0],
      sym[1],
      sym[2]
    );
  };
  // Draw a character at the appropriate X and Y tile
  Main.drawTile = function(x,y,ch,fg,bg) {
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

  Main.drawGlyph = function(x,y,ch,fg) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    fg = fg || "white";
    var z = gameScreen.z;
    var bg = HTomb.Tiles.getBackground(x,y,z);
    display.draw(
      x-xoffset,
      y-yoffset,
      ch,
      fg,
      bg
    );
  };

  // Change the background color of the appropriate X and Y tile
  Main.highlightTile = function(x,y,bg) {
    var xoffset = gameScreen.xoffset || 0;
    var yoffset = gameScreen.yoffset || 0;
    var z = gameScreen.z;
    var sym = HTomb.Tiles.getGlyph(x,y,z);
    display.draw(
      x-xoffset,
      y-yoffset,
      sym[0],
      sym[1],
      bg
    );
  };

  // **** Selection and targeting methods
  Main.selectSquareZone = function(z, callb, options) {
    options = options || {};
    GUI.pushMessage("Select the first corner.");
    var context = Object.create(survey);
    context.menuText = ["Use movement keys to navigate.","Comma go down.","Period to go up.","Escape to exit."];
    if (options.message) {
      context.menuText.unshift("");
      context.menuText.unshift(options.message);
    }
    Contexts.active = context;
    Main.updateMenu();
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    context.clickTile = function (x,y) {
      GUI.pushMessage("Select the second corner.");
      var context2 = Contexts.new({VK_ESCAPE: GUI.reset});
      Contexts.active = context2;
      context2.menuText = context.menuText;
      context2.clickTile = secondSquare(x,y);
      context2.mouseTile = drawSquareBox(x,y);
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
                squares.push([xs[x],ys[y],gameScreen.z]);
              }
            } else {
              squares.push([xs[x],ys[y],gameScreen.z]);
            }
          }
        }
        for (var k =0; k<squares.length; k++) {
          var coord = squares[k];
          Main.highlightTile(coord[0],coord[1],bg);
        }
        var txt = examineSquare(x1,y1,gameScreen.z);
        var myText = Contexts.active.menuText;
        Main.displayMenu(myText.concat(" ").concat(txt));
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
                squares.push([xs[x],ys[y],gameScreen.z]);
              }
            } else {
              squares.push([xs[x],ys[y],gameScreen.z]);
            }
          }
        }
        // Invoke the callback function on the squares selected
        callb(squares, options);
        if (options.reset!==false) {
          GUI.reset();
        }
      };
    };
  };

  Main.selectBox = function(width, height, z, callb, options) {
    options = options || {};
    var gameScreen = gameScreen;
    GUI.pushMessage("Select a square.");
    var context = Object.create(survey);
    context.menuText = ["Use movement keys to navigate.","Comma go down.","Period to go up.","Escape to exit."];
    context.mouseTile = function(x0,y0) {
      var bg = options.bg || "#550000";
      gameScreen.render();
      var squares = [];
      for (var x=0; x<width; x++) {
        for (var y=0; y<height; y++) {
          squares.push([x0+x,y0+y,gameScreen.z]);
        }
      }
      for (var k =0; k<squares.length; k++) {
        var coord = squares[k];
        Main.highlightTile(coord[0],coord[1],bg);
      }
      var txt = Main.examineSquare(x0,y0,gameScreen.z);
      var myText = Contexts.active.menuText;
      Main.displayMenu(myText.concat(" ").concat(txt));
    };
    Contexts.active = context;
    if (options.message) {
      context.menuText.unshift("");
      context.menuText.unshift(options.message);
    }
    Main.updateMenu();
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    context.clickTile = function(x0,y0) {
      var squares = [];
      for (var y=0; y<height; y++) {
        for (var x=0; x<width; x++) {
          squares.push([x0+x,y0+y,gameScreen.z]);
        }
      }
      callb(squares,options);
      GUI.reset();
    };
  };

  // Display a menu of letter-bound choices
  Main.choosingMenu = function(s, arr, func) {
    var alpha = "abcdefghijklmnopqrstuvwxyz";
    var contrls = {};
    var choices = [s];
    // there is probably a huge danger of memory leaks here
    for (var i=0; i<arr.length; i++) {
      var desc = (arr[i].onList!==undefined) ? arr[i].onList() : arr[i];
      var choice = arr[i];
      // Bind a callback function and its closure to each keystroke
      contrls["VK_" + alpha[i].toUpperCase()] = func(choice);
      choices.push(alpha[i]+") " + desc);
    }
    contrls.VK_ESCAPE = GUI.reset;
    choices.push("Esc to cancel");
    Contexts.active = Contexts.new();
    Contexts.active.menuText = choices;
    Main.updateMenu(); // change this
  };

  // Select a single square with the mouse
  Main.selectSquare = function(z, callb, options) {
    options = options || {};
    GUI.pushMessage("Select a square.");
    var context = Object.create(survey);
    context.menuText = ["Use movement keys to navigate.","Comma go down.","Period to go up.","Escape to exit."];
    Contexts.active = context;
    if (options.message) {
      context.menuText.unshift("");
      context.menuText.unshift(options.message);
    }
    Main.updateMenu();
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    context.clickTile = function(x,y) {
      callb(x,y,gameScreen.z,options);
      GUI.reset();
    };
    if (options.line!==undefined) {
      var x0 = options.line.x || HTomb.Player.x;
      var y0 = options.line.y || HTomb.Player.y;
      var bg = options.line.bg || "#550000";
      context.mouseTile = function(x,y) {
        gameScreen.render();
        var line = HTomb.Path.line(x0,y0,x,y);
        for (var i in line) {
          var sq = line[i];
          Main.highlightSquare(sq[0],sq[1],bg);
        }
        var txt = Main.examineSquare(x1,y1,gameScreen.z);
        var myText = Contexts.active.menuText;
        Main.displayMenu(myText.concat(" ").concat(txt));
      };
    }
  };

  // ***** I'm not sure how to categorize this one yet...
  Main.examineSquare(x,y,z) {
    var square = HTomb.Tiles.getSquare(x,y,z);
    var below = HTomb.Tiles.getSquare(x,y,z-1);
    var above = HTomb.Tiles.getSquare(x,y,z+1);
    var text = ["Coord: " + square.x +"," + square.y + "," + square.z];
    var next;
    var listLines, i;
    if(square.explored || HTomb.Debug.explored) {
      next = "Terrain: "+square.terrain.name;
      text.push(next);
      next = "Creature: ";
      if (square.creature && (square.visible || HTomb.Debug.visible)) {
        next+=square.creature.describe();
        text.push(next);
      }
      next = "Items: ";
      if (square.items && (square.visible || HTomb.Debug.visible)) {
        for (i=0; i<square.items.length; i++) {
          next+=square.items[i].describe();
          text.push(next);
          next = "       ";
        }
      }
      next = "Feature: ";
      if (square.feature) {
        next+=square.feature.describe();
      }
      text.push(next);
      next = "Zone: ";
      if (square.zone) {
        next+=square.zone.describe();
      }
      text.
      push(next);
      next = "Cover: ";
      if (square.cover) {
        next+=square.cover.describe();
      }
      text.push(next);
      next = "Lighting: ";
      next+=Math.round(HTomb.World.lit[z][x][y]);
      text.push(next);
      text.push(" ");
    }
    if (square.exploredAbove) {
      next = "Above: "+above.terrain.name;
      text.push(next);
      next = "Creature: ";
      if (above.creature && square.visibleAbove) {
        next+=above.creature.describe();
        text.push(next);
      }
      next = "Items: ";
      if (above.items && square.visibleAbove) {
        for (i=0; i<above.items.length; i++) {
          next+=above.items[i].describe();
          text.push(next);
          next = "       ";
        }
      }
      next = "Feature: ";
      if (above.feature) {
        next+=above.feature.describe();
      }
      text.push(next);
      next = "Zone: ";
      if (above.zone) {
        next+=above.zone.describe();
      }
      text.push(next);
      next = "Cover: ";
      if (above.cover) {
        next+=above.cover.describe();
      }
      text.push(next);
      next = "Lighting: ";
      next+=Math.round(HTomb.World.lit[z+1][x][y]);
      text.push(next);
      text.push(" ");
    }
    if (square.exploredBelow) {
      next = "Below: "+below.terrain.name;
      text.push(next);
      next = "Creature: ";
      if (below.creature && square.visibleBelow) {
        next+=below.creature.describe();
        text.push(next);
      }
      next = "Items: ";
      if (below.items && square.visibleBelow) {
        for (i=0; i<below.items.length; i++) {
          next+=below.items[i].describe();
          text.push(next);
          next = "       ";
        }
      }
      next = "Feature: ";
      if (below.feature) {
        next+=below.feature.describe();
      }
      text.push(next);
      next = "Zone: ";
      if (below.zone) {
        next+=below.zone.describe();
      }
      text.push(next);
      next = "Cover: ";
      if (below.cover) {
        next+=below.cover.describe();
      }
      text.push(next);
      next = "Lighting: ";
      next+=Math.round(HTomb.World.lit[z][x][y]);
      text.push(next);
    }
    return text;
  }
  // ***** Main control context ******
  // These are the default controls
  var main = Contexts.main = Contexts.new({
    // bind number pad movement
    VK_LEFT: Commands.tryMoveWest,
    VK_RIGHT: Commands.tryMoveEast,
    VK_UP: Commands.tryMoveNorth,
    VK_DOWN: Commands.tryMoveSouth,
    // bind keyboard movement
    VK_A: Commands.act,
    VK_NUMPAD7: Commands.tryMoveNorthWest,
    VK_NUMPAD8: Commands.tryMoveNorth,
    VK_NUMPAD9: Commands.tryMoveNorthEast,
    VK_NUMPAD4: Commands.tryMoveWest,
    VK_NUMPAD5: Commands.wait,
    VK_NUMPAD6: Commands.tryMoveEast,
    VK_NUMPAD1: Commands.tryMoveSouthWest,
    VK_NUMPAD2: Commands.tryMoveSouth,
    VK_NUMPAD3: Commands.tryMoveSouthEast,
    VK_PERIOD: Commands.tryMoveDown,
    VK_COMMA: Commands.tryMoveUp,
    VK_G: Commands.pickup,
    VK_D: Commands.drop,
    VK_I: Commands.inventory,
    VK_J: Commands.showJobs,
    VK_Z: Commands.showSpells,
    VK_TAB: Main.surveyMode,
    VK_SPACE: Commands.wait,
    VK_ENTER: HTomb.Time.toggleTime,
    //VK_ESCAPE: HTomb.Time.stopTime,
    VK_TILDE: Main.summaryView,
    VK_ESCAPE: Main.systemView,
    VK_PAGE_UP: function() {
      HTomb.Time.setSpeed(HTomb.Time.getSpeed()/1.25);
      HTomb.GUI.pushMessage("Speed set to " + parseInt(HTomb.Time.getSpeed()) + ".");
      HTomb.Time.startTime();
    },
    VK_PAGE_DOWN: function() {
      HTomb.Time.setSpeed(HTomb.Time.getSpeed()*1.25);
      HTomb.GUI.pushMessage("Speed set to " + parseInt(HTomb.Time.getSpeed()) + ".");
    }
  });

  // Clicking outside the game screen does nothing
  main.clickAt = function(x,y) {
    HTomb.Time.toggleTime();
  };
  main.rightClickTile = function(x,y) {
    let p = HTomb.Player;
    if (x===p.x && y===p.y && gameScreen.z===p.z) {
      summaryView();
      return;
    }
    let f = HTomb.World.features[coord(x,y,gameScreen.z)];
    if (f && f.workshop && f.workshop.active && HTomb.World.creatures[coord(x,y,gameScreen.z)]===undefined) {
      workshopView(f.workshop);
      return;
    }
    detailsView(x,y,gameScreen.z);
  }
  main.clickTile = function(x,y) {
    HTomb.Time.toggleTime();
  };

  // ***** Survey mode *********
  Main.surveyMode = function() {
    Contexts.active = survey;
    survey.saveX = gameScreen.xoffset;
    survey.saveY = gameScreen.yoffset;
    survey.saveZ = gameScreen.z;
    Main.updateMenu();
  };
  // Enter survey mode and save the screen's current position
  Main.surveyMove = function(dx,dy,dz) {
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
      Main.render();
    };
    // Actually this returns a custom function for each type of movement
    return f;
  };

  HTomb.Debug.zoomTo = function(x,y,z) {
    if (typeof(x)==="object") {
      z = x.z;
      y = x.y;
      x = x.x;
    }
    Main.surveyMode();
    HTomb.Debug.explored = true;
    HTomb.Debug.visible = true;
    survey.z = z;
    if (x >= survey.xoffset+SCREENW-2) {
      survey.xoffset = x-SCREENW+2;
    } else if (x <= survey.xoffset) {
      survey.xoffset = x-1;
    }
    if (y >= survey.yoffset+SCREENH-2) {
      survey.yoffset = y-SCREENH+2;
    } else if (y <= survey.yoffset) {
      survey.yoffset = y-1;
    }
    gameScreen.render();
  };
  // The control context for surveying
  var survey = Contexts.survey = Contexts.new({
    VK_LEFT: Main.surveyMove(-1,0,0),
    VK_RIGHT: Main.surveyMove(+1,0,0),
    VK_UP: Main.surveyMove(0,-1,0),
    VK_DOWN: Main.surveyMove(0,+1,0),
    // bind keyboard movement
    VK_PERIOD: Main.surveyMove(0,0,-1),
    VK_COMMA: Main.surveyMove(0,0,+1),
    VK_NUMPAD7: Main.surveyMove(-1,-1,0),
    VK_NUMPAD8: Main.surveyMove(0,-1,0),
    VK_NUMPAD9: Main.surveyMove(+1,-1,0),
    VK_NUMPAD4: Main.surveyMove(-1,0,0),
    VK_NUMPAD6: Main.surveyMove(+1,0,0),
    VK_NUMPAD1: Main.surveyMove(-1,+1,0),
    VK_NUMPAD2: Main.surveyMove(0,+1,0),
    VK_NUMPAD3: Main.surveyMove(+1,+1,0),
    // Exit survey mode and return to the original position
    VK_ESCAPE: function() {
      //gameScreen.xoffset = survey.saveX;
      //gameScreen.yoffset = survey.saveY;
      gameScreen.z = survey.saveZ;
      Main.recenter();
      GUI.reset();
    }
  });
  survey.menuText = ["You are now in survey mode.","Use movement keys to navigate.","Comma go down.","Period to go up.","Escape to exit."];
  survey.clickTile = main.clickTile;
  survey.rightClickTile = main.rightClickTile;





  return HTomb;
})(HTomb);
