// ****** This module implements Behaviors, which are the basic units of functionality for creatures, items, and features
HTomb = (function(HTomb) {
  "use strict";
  var LEVELW = HTomb.Constants.LEVELW;
  var LEVELH = HTomb.Constants.LEVELH;
  var coord = HTomb.coord;

  HTomb.Things.defineBehavior({
    template: "Player",
    name: "player",
    onAdd: function() {
      HTomb.Player = this.entity;
    }
  });
  // The Sight behavior allows a creature to see
  HTomb.Things.defineBehavior({
    template: "Sight",
    name: "sight",
    range: 10,
    onAdd: function(options) {
      options = options || {};
      if (options.range) {
        this.range = options.range;
      }
    }
  });

  // The Inventory behavior allows a creature to carry things
  HTomb.Things.defineBehavior({
    template: "Inventory",
    name: "inventory",
    capacity: 10,
    onAdd: function() {this.items = [];},
    pickup: function(item) {
      var e = this.entity;
      item.remove();
      this.add(item);
      HTomb.GUI.sensoryEvent(this.entity.describe() + " picks up " + item.describe(),e.x,e.y,e.z);
      this.entity.ai.acted = true;
    },
    drop: function(item) {
      var e = this.entity;
      this.remove(item);
      item.place(e.x,e.y,e.z);
      HTomb.GUI.sensoryEvent(this.entity.describe() + " drops " + item.describe(),e.x,e.y,e.z);
      this.entity.ai.acted = true;
    },
    add: function(item) {
      if (this.items.length>=this.capacity) {
        HTomb.GUI.pushMessage("Can't pick that up.");
      } else if (item.item.stackable) {
        item.item.stackInto(this.items);
      } else {
        this.items.push(item);
      }
    },
    remove: function(item) {
        var indx = this.items.indexOf(item);
        if (indx===-1) {
          HTomb.GUI.pushMessage("Can't remove that");
        } else {
          this.items.splice(indx,1);
        }
    }
  });

  // Not yet functional
  HTomb.Things.defineBehavior({
    template: "Attacker",
    name: "attack"
  });
  // The Minion behavior allows a creature to serve a master and take orders
  HTomb.Things.defineBehavior({
    template: "Minion",
    name: "minion",
    master: null,
    task: null,
    each: ["master","task"],
    setMaster: function(cr) {
      this.master = cr;
    },
    onAssign: function(tsk) {
      this.task = tsk;
      HTomb.Debug.pushMessage(this.entity.describe() + " was assigned " + tsk.describe());
    },
    unassign: function() {
      HTomb.Debug.pushMessage(this.entity.describe() + " was unassigned from " + this.task.describe());
      this.task = null;
    }
  });

  // The Master behavior maintains a list of minions and assignable tasks
  HTomb.Things.defineBehavior({
    template: "Master",
    name: "master",
    minions: null,
    taskList: null,
    each: ["minions","tasks","taskList"],
    onCreate: function(options) {
      options = options || {};
      options.tasks = options.tasks || [];
      this.tasks = options.tasks;
      this.minions = [];
      this.taskList = [];
    },
    addMinion: function(cr) {
      this.minions.push(cr);
    },
    removeMinion: function(cr) {
      this.minions.splice(this.minions.indexOf(cr,1));
    },
    designate: function(tsk) {
      tsk.designate(this);
    },
    assignTasks: function() {
      for(var i=0; i<this.taskList.length; i++) {
        var tsk = this.taskList[i];
        if (tsk.assignee!==null) {
          continue;
        }
        var master = this.entity;
        var minions = this.minions;
        // maybe should shuffle this only once per turn?
        //minions = minions.randomize(); //this randomization function erases the original
        for (var j=0; j<minions.length; j++) {
          if (minions[j].minion.task!==null) {
            continue;
          }
          if (minions[j].worker===undefined) {
            continue;
          }
          if (minions[j].worker.allowedTasks.indexOf(tsk.template)===-1 && minions[j].worker.allowedTasks.indexOf(tsk.fakeAs)===-1) {
            console.log(tsk.template);
            continue;
          }
          console.log("trying at least");
          var assigned = tsk.tryAssign(minions[j]);
          if (assigned) {
            break;
          }
        }
      }
    },
    listTasks: function() {
      var tasks = [];
      for (var i=0; i<this.tasks.length; i++) {
        tasks.push(HTomb.Things.templates[this.tasks[i]]);
      }
      return tasks;
    }
  });

  // The Stackable behavior allows items to be stacked into piles


  // The SpellCaster behavior maintains a list of castable spells
  HTomb.Things.defineBehavior({
    template: "SpellCaster",
    name: "caster",
    onCreate: function(options) {
      options = options || {};
      options.spells = options.spells || [];
      this.spells = options.spells;
    },
    cast: function(sp) {
      sp.cast(this);
    },
    listSpells: function() {
      var spells = [];
      for (var i=0; i<this.spells.length; i++) {
        spells.push(HTomb.Things.templates[this.spells[i]]);
      }
      return spells;
    }
  });

  HTomb.Things.defineBehavior({
    template: "Worker",
    name: "worker",
    allowedTasks: ["DigTask","BuildTask","PatrolTask","BuildDoor"]
  });

  return HTomb;
})(HTomb);