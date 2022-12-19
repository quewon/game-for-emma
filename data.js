var SHEETS = ["events", "titles", "locations"];

var DATA = {
  retrieve: function(location, phase, day, hasPriority) {
    var events = [];
    
    location = location || "-1";
    phase = phase || "-1";
    day = day || "-1";
    
    for (let e of DATA.events) {
      if (location != "-1" && e.LOCATION != location) continue;
      if (phase != "-1" && e.PHASE != phase) continue;
      if (day != "-1" && e.DAY != day) continue;
      if (hasPriority && e.PRIORITY == "-1") continue;
      
      events.push(e);
    }
    
    return events;
  },
  sortPriority: function(events) {
    return events.sort((a,b) => a.PRIORITY - b.PRIORITY);
  },
  random: function(events) {
    return events[events.length * Math.random() | 0];
  }
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
  
  DATA.titlesByCharacter = {};
  
  for (let title of DATA.titles) {
    if (!(title.CHARACTER in DATA.titlesByCharacter)) {
      DATA.titlesByCharacter[title.CHARACTER] = [];
      
      let option = document.createElement("option");
      option.innerHTML = title.CHARACTER;
      characterElement.appendChild(option);
    }
    
    DATA.titlesByCharacter[title.CHARACTER].push(title);
  }
  
  on_data_loaded();
}