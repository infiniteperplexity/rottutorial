// This submodule defines the templates for creature Entities
HTomb = (function(HTomb) {
  "use strict";

  var b = HTomb.Things;

  HTomb.Things.defineCreature({
      template: "Necromancer",
      name: "necromancer",
      symbol: "@",
      fg: "#DD66FF",
      behaviors: {
        Movement: {swims: true},
        Inventory: {},
        Sight: {},
        AI: {},
        Master: {tasks: ["DigTask","BuildTask","CraftTask","DismantleTask","PatrolTask","FarmTask","ForbidTask","HoardTask","Undesignate"]},
        SpellCaster: {spells: ["RaiseZombie"]}
      }
  });

  HTomb.Things.defineCreature({
    template: "Zombie",
    name: "zombie",
    symbol: "z",
    fg: "#99FF66",
    behaviors: {
      AI: {},
      Movement: {swims: true},
      Sight: {},
      Worker: {},
      Inventory: {capacity: 2},
      Body: {
        materials: {
          FleshMaterial: 10,
          BoneMaterial: 10
        }
      }
    }
  });

  HTomb.Things.defineCreature({
    template: "Bat",
    name: "bat",
    symbol: "b",
    fg: "#999999",
    behaviors: {
      AI: {},
      Movement: {flies: true},
      Sight: {}
    }
  });

  HTomb.Things.defineCreature({
    template: "Spider",
    name: "spider",
    symbol: "s",
    fg: "#BBBBBB",
    behaviors: {
      AI: {},
      Movement: {}
    }
  });

  HTomb.Things.defineCreature({
    template: "Fish",
    name: "fish",
    symbol: "p",
    fg: "#FF8888",
    behaviors: {
      AI: {},
      Movement: {swims: true, walks: false}
    }
  });

  return HTomb;
})(HTomb);
