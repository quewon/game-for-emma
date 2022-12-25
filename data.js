var SHEETS = ["events", "titles", "locations"];

var DATA = {
  retrieve: function(location, phase, day, hasPriority, characters) {
    var events = [];
    
    location = location == null ? -1 : location;
    phase = phase == null ? -1 : phase;
    day = day == null ? -1 : day;
    
    for (let e of DATA.events) {
      if (location != -1 && e.LOCATION != location) continue;
      if (phase != -1 && e.PHASE != phase) continue;
      if (day != -1 && e.DAY != day) continue;
      if (hasPriority && e.PRIORITY == -1) continue;
      
      if (characters) {
        if (e.CHARACTERS == undefined) continue;
        
        var missingCharacter = false;
        for (let name of characters) {
          if (!e.CHARACTERS.includes(name)) {
            missingCharacter = true;
            break;
          }
        }
        
        if (missingCharacter) continue;
        
        // var containsIrrelevantCharacter = false;
        // for (let name of e.CHARACTERS.split(", ")) {
        //   if (!characters.includes(name)) {
        //     containsIrrelevantCharacter = true;
        //     break;
        //   }
        // }
        // 
        // if (containsIrrelevantCharacter) continue;
      }
      
      events.push(e);
    }
    
    events = DATA.sort(events, "PRIORITY");
    events = DATA.sort(events, "LOCATION");
    events = DATA.sort(events, "PHASE");
    events = DATA.sort(events, "DAY");
    events = events.sort((a,b) => a.pulled - b.pulled);
    
    return events;
  },
  retrieveInclusive: function(location, phase, day) { //used in-game... events that are not tied to a specific requirement are included
    var events = [];
    
    location = location == null ? -1 : location;
    phase = phase == null ? -1 : phase;
    day = day == null ? -1 : day;
    
    for (let e of DATA.events) {
      if (location != -1 && e.LOCATION != -1 && e.LOCATION != location) continue;
      if (phase != -1 && e.PHASE != -1 && e.PHASE != phase) continue;
      if (day != -1 && e.DAY != -1 && e.DAY != day) continue;
      
      events.push(e);
    }
    
    // sort
    
    events = DATA.sort(events, "pulled");
    var minPulled = events[0].pulled;
    events = events.filter((e) => {
      return e.pulled <= minPulled;
    });
    
    events = DATA.sort(events, "PRIORITY");
    var topPriority = events[0].PRIORITY;
    events = events.filter((e) => {
      return e.PRIORITY <= topPriority;
    });
    
    events = DATA.sort(events, "LOCATION");
    var topLocation = events[events.length - 1].LOCATION;
    events = events.filter((e) => {
      return e.LOCATION >= topLocation;
    });
    
    events = DATA.sort(events, "PHASE");
    var topPhase = events[events.length - 1].PHASE;
    events = events.filter((e) => {
      return e.PHASE >= topPhase;
    });
    
    events = DATA.sort(events, "DAY");
    var topDay = events[events.length - 1].DAY;
    events = events.filter((e) => {
      return e.DAY >= topDay;
    });
    
    return events;
  },
  sort: function(events, property) {
    return events.sort((a,b) => b[property] < a[property] );
  },
  pull: function(events, markEvent) {
    var e = events[events.length * Math.random() | 0];
    if (markEvent) e.pulled += 1;
    return e;
  },
};

const API_KEY = "AIzaSyAm47kRXdo7Umk0e7TkVwdGwAq10vNEEyE";
const SHEET_ID = "12LRk-GIPdW4VH__u2xkyaCEBtbDq6UDpVR8cWgReOSo";

function SHEET_URL(sheetName) {
  return "https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/"+sheetName+"/?key="+API_KEY
}

function SheetArrayToObjects(array) {
  const keys = array[0];
  const output = [];
  
  for (let i=1; i<array.length; i++) {
    var entry = {};
    for (let x=0; x<keys.length; x++) {
      var value = array[i][x];
      
      switch (value) {
        case "TRUE":
          value = true;
          break;
        case "FALSE":
          value = false;
          break;
        case "":
          value = undefined;
          break;
      }
      
      if (
        keys[x] == "PRIORITY" || 
        keys[x] == "PHASE" || 
        keys[x] == "DAY" || 
        keys[x] == "LOCATION" || 
        keys[x] == "choice" || 
        keys[x] == "pulled"
      ) {
        if (!value) value = -1;
        value = parseInt(value);
      }
      
      entry[keys[x]] = value;
    }
    
    output.push(entry);
  }
  
  return output;
}

for (let sheetName of SHEETS) { //load data
  fetch(SHEET_URL(sheetName))
  .then((response) => response.json())
  .then((data) => updateData(sheetName, data));
}

function updateData(sheetName, data) {
  console.log(sheetName+" data loaded.");
  DATA[sheetName] = SheetArrayToObjects(data.values);
  for (let sheetName of SHEETS) {
    if (!(sheetName in DATA)) return;
  }
  
  // refine data
  
  const defaultEvent = DATA.events[0];
  for (let i=1; i<DATA.events.length; i++) {
    var e = DATA.events[i];
    for (let property in e) {
      if (e[property] == undefined) e[property] = defaultEvent[property];
    }
  }
  
  DATA.events.shift(0);
  
  DATA.titlesByCharacter = {};
  for (let title of DATA.titles) {
    if (!(title.CHARACTER in DATA.titlesByCharacter)) {
      DATA.titlesByCharacter[title.CHARACTER] = [];
    }
    
    DATA.titlesByCharacter[title.CHARACTER].push(title);
  }
  
  on_data_loaded();
}