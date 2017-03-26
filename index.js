let vmname = 'b1nzy-16.04';

try {
  var tokens = require('./secrets.json');
} catch (e) {
  console.log("You need to enter your token in ./secrets.json! (See an example in secrets_example.json)");
  return;
}

try {
  var Discord = require('discord.io');
  var child_process = require('child_process');
  var fs = require("fs");
  var virtualbox = require("virtualbox-soap");
  var co = require("co");
} catch (e) {
  console.log("You need to run `npm i` first!");
  return;
}

// Taken from node-virtualbox...

var codes, keys;

codes = {

  'ESCAPE': [0x01],
  'NUMBER_1': [0x02],
  'NUMBER_2': [0x03],
  'NUMBER_3': [0x04],
  'NUMBER_4': [0x05],
  'NUMBER_5': [0x06],
  'NUMBER_6': [0x07],
  'NUMBER_7': [0x08],
  'NUMBER_8': [0x09],
  'NUMBER_9': [0x0A],
  'NUMBER_0': [0x0B],
  'MINUS': [0x0C],
  '-': [0x0C],
  'EQUAL': [0x0D],
  '=': [0x0D],
  'BACKSPACE': [0x0E],
  'TAB': [0x0F],

  'Q': [0x10],
  'W': [0x11],
  'E': [0x12],
  'R': [0x13],
  'T': [0x14],
  'Y': [0x15],
  'U': [0x16],
  'I': [0x17],
  'O': [0x18],
  'P': [0x19],
  'LEFTBRACKET': [0x1A],
  '[': [0x1A],
  'RIGHTBRACKET': [0x1B],
  ']': [0x1B],
  'ENTER': [0x1C],
  'CTRL': [0x1D],
  'A': [0x1E],
  'S': [0x1F],

  'D': [0x20],
  'F': [0x21],
  'G': [0x22],
  'H': [0x23],
  'J': [0x24],
  'K': [0x25],
  'L': [0x26],
  'SEMICOLON': [0x27],
  ';': [0x27],
  'QUOTE': [0x28],
  '"': [0x28],
  'BACKQUOTE': [0x29],
  '`': [0x29],
  'SHIFT': [0x2A],
  'BACKSLASH': [0x2B],
  '\\': [0x2B],
  'Z': [0x2C],
  'X': [0x2D],
  'C': [0x2E],
  'V': [0x2F],

  'B': [0x30],
  'N': [0x31],
  'M': [0x32],
  'COMMA': [0x33],
  ',': [0x33],
  'PERIOD': [0x34],
  '.': [0x34],
  'SLASH': [0x35],
  '/': [0x35],
  'R_SHIFT': [0x36],
  'PRT_SC': [0x37],
  'ALT': [0x38],
  'SPACE': [0x39],
  ' ': [0x39],
  'CAPS_LOCK': [0x3A],
  'F1': [0x3B],
  'F2': [0x3C],
  'F3': [0x3D],
  'F4': [0x3E],
  'F5': [0x3F],

  'F6': [0x40],
  'F7': [0x41],
  'F8': [0x42],
  'F9': [0x43],
  'F10': [0x44],
  'NUM_LOCK': [0x45], // May be [0x45, 0xC5],
  'SCROLL_LOCK': [0x46],
  'NUMPAD_7': [0x47],
  'NUMPAD_8': [0x48],
  'NUMPAD_9': [0x49],
  'NUMPAD_SUBTRACT': [0x4A],
  'NUMPAD_4': [0x4B],
  'NUMPAD_5': [0x4C],
  'NUMPAD_6': [0x4D],
  'NUMPAD_ADD': [0x4E],
  'NUMPAD_1': [0x4F],

  'NUMPAD_2': [0x50],
  'NUMPAD_3': [0x51],
  'NUMPAD_0': [0x52],
  'NUMPAD_DECIMAL': [0x53],
  'F11': [0x57],
  'F12': [0x58],

  // Same as other Enter key
  // 'NUMBER_Enter'    : [0xE0, 0x1C],
  'R_CTRL': [0xE0, 0x1D],

  'NUMBER_DIVIDE': [0xE0, 0x35],
  //
  // 'NUMBER_*'        : [0xE0, 0x37],
  'R_ALT': [0xE0, 0x38],

  'HOME': [0xE0, 0x47],
  'UP': [0xE0, 0x48],
  'PAGE_UP': [0xE0, 0x49],
  'LEFT': [0xE0, 0x4B],
  'RIGHT': [0xE0, 0x4D],
  'END': [0xE0, 0x4F],

  'DOWN': [0xE0, 0x50],
  'PAGE_DOWN': [0xE0, 0x51],
  'INSERT': [0xE0, 0x52],
  'DELETE': [0xE0, 0x53],
  'WINDOW': [0xE0, 0x5B],
  'WIN': [0xE0, 0x5B],
  'LWIN': [0xE0, 0x5B],
  'R_WINDOW': [0xE0, 0x5C],
  'RWIN': [0xE0, 0x5C],
  'MENU': [0xE0, 0x5D],

  'PAUSE': [0xE1, 0x1D, 0x45, 0xE1, 0x9D, 0xC5]
};

codes.getBreakCode = function (key) {
  var makeCode = codes[key],
    breakCode;
  if (makeCode === undefined) {
    throw new Error('Undefined key: ' + key);
  }

  if (key === 'PAUSE') {
    return [];
  }

  if (makeCode[0] === 0xE0) {
    return [0xE0, makeCode[1] + 0x80];
  } else {
    return [makeCode[0] + 0x80];
  }
};

var SCAN_CODES = codes;

// End snippet...

var bot = new Discord.Client({
  autorun: true,
  token: tokens.discord
});

let resetting = false;

let serverUR;
let websessionM;
let vbox;
let machine;
let session;
let iconsole;
let mouse;
let keyboard;
let guest;

co(function* () {
  serverURL = "http://localhost:18083"; // This url is the default one, it can be omitted 
  websessionManager = yield virtualbox(serverURL);
  vbox = yield websessionManager.logon(tokens.username, tokens.password);
  machine = yield vbox.findMachine(vmname);

  session = yield websessionManager.getSessionObject(vbox);
  let prog = yield machine.launchVMProcess(session, "headless");
  yield prog.waitForCompletion(-1);
  iconsole = yield session.getConsole();
  mouse = yield iconsole.getMouse();
  keyboard = yield iconsole.getKeyboard();
  guest = yield iconsole.getGuest();
  console.log("Ready!");
}).catch(console.warn);

function mousemove(x, y) {
  mouse.putMouseEvent(x + 1, y + 1, 0, 0, 0);
}

function mousedown(btns) {
  mouse.putMouseEvent(0, 0, 0, 0, btns);
}

bot.on('disconnect', function (err, code) {
  console.warn("Jake attempted to kick me off Discord with error number: " + code + " (" + err + ")! Attempting reconnection :D");
  bot.connect();
});

bot.on('ready', function () {
  console.log("Successfully connected: " + bot.username + " - (" + bot.id + ")");
});

let timers = {};

function grabVMScreen(callback, c) {
  setTimeout(() => { // Wait a second before grabbing screenshot so that the OS has time to react to our changes
    let screenshotfile = "/tmp/sheller-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000) + ".png";
    child_process.exec("vboxmanage controlvm " + vmname + " screenshotpng " + screenshotfile, function (error, stdout, stderr) {
      if (callback) {
        callback(screenshotfile, function () {
          fs.unlink(screenshotfile, (err) => { if (err) console.warn(err) });
        });
        return;
      }
      bot.uploadFile({
        to: c,
        file: screenshotfile
      }, function () {
        setTimeout(function () {
          fs.unlink(screenshotfile, (err) => { if (err) console.warn(err) });
        }, 1000 * 30);
      });
    });
  }, 1000);
}

bot.on('message', function (user, userID, channelID, message, event) {
  if (message.charAt(0) != "<" && message.charAt(0) != ">") return false; // Ignore non-commands...
  let t = message.split(" ")[0].substr(1); // Remove 1st character
  let c = channelID;
  let a = message.split(" ");
  a.shift();

  if (c == "294666598508396546" || c == "295366503371505676") {
    return false;
  }

  console.log("[" + user + "]: " + message); // Mostly for debug...

  if (t == "restart") {
    iconsole.powerDown().then(function (prog2) {
      prog2.waitForCompletion(-1).then(function () {
        iconsole.powerUp().then(function (prog) {
          prog.waitForCompletion(-1).then(function () {
            console.log(iconsole.state);
            grabVMScreen(null, c);
          });
        });
      });
    });
  }

  if (t == "screengrab") {
    grabVMScreen(null, c);
  }

  if (t == "key") {
    let codes = [];

    let keys = a.join(" ").split("+");

    for (let k in keys) {
      keys[k] = keys[k].toUpperCase();
      if (!SCAN_CODES[keys[k]]) {
        say("The key `" + keys[k] + "` doesn't exist! Skipping...");
        continue;
      }
      let thecode = SCAN_CODES[keys[k]];
      for (let itm in thecode) {
        codes.push(thecode[itm]);
      }
    }
    for (let k in keys) {
      if (!SCAN_CODES[keys[k]]) continue;
      let thecode = SCAN_CODES.getBreakCode(keys[k]);
      for (let itm in thecode) {
        codes.push(thecode[itm]);
      }
    }

    console.log(codes);

    keyboard.putScancodes(codes).then(function () {
      grabVMScreen(null, c);
    }).catch(function (err) {
      say("Error: ```\n" + err + "```", c);
    });
  }

  if (t == "type") {
    let codes = [];

    let keystmp = a.join(" ").split("");
    let keys = [];
    for (let k in keystmp) {
      if (/[A-Z]/g.test(keystmp[k])) keys.push({ kind: "SHIFT", type: "on" });
      switch (keystmp[k]) {
        // case "{":
        // case "}":
        // case "\"":
        // case "|":
        // case ":":
        // case "!":
        // case "@":
        // case "#":
        // case "$":
        // case "%":
        // case "^":
        // case "&":
        // case "*":
        // case "(":
        // case ")":
        // case "+":
        // case "_":
        // case "~":
        // case "?":
        // case ">":
        // case "<": {
        //   keys.push("SHIFT");
        // }

        case "{": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "[", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "}": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "]", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "\"": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "'", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "|": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "\\", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case ":": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: ";", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "!": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "1", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "@": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "2", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "#": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "3", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "$": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "4", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "%": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "5", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "^": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "6", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "&": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "7", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "*": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "8", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "(": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "9", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case ")": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "0", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "+": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "=", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "_": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "-", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "~": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "`", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "?": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: "/", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case "<": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: ",", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }
        case ">": { keys.push({ kind: "SHIFT", type: "on" }); keys.push({ kind: ".", type: "tap" }); keys.push({ kind: "SHIFT", type: "off" }); break; }

        // case "{":
        // case "}":
        // case "\"":
        // case "|":
        // case ":":
        // case "!":
        // case "@":
        // case "#":
        // case "$":
        // case "%":
        // case "^":
        // case "&":
        // case "*":
        // case "(":
        // case ")":
        // case "+":
        // case "_":
        // case "~":
        // case "?":
        // case ">":
        // case "<": {
        //   break;
        // }

        default: {
          keys.push({ kind: keystmp[k], type: "tap" });
          break;
        }
      }
      if (/[A-Z]/g.test(keystmp[k])) keys.push({ kind: "SHIFT", type: "off" });
    }
    console.log(keys);

    for (let k in keys) {
      keys[k].kind = keys[k].kind.toUpperCase();
      if (!SCAN_CODES[keys[k]]) {
        say("The key `" + keys[k] + "` doesn't exist! Skipping...");
        continue;
      }

      switch (keys[k].type) {
        case "on": {
          let thecode = SCAN_CODES[keys[k].kind];
          for (let itm in thecode) {
            codes.push(thecode[itm]);
          }
          break;
        }
        case "off": {
          let breakcode = SCAN_CODES.getBreakCode([keys[k].kind]);
          for (let itm in breakcode) {
            codes.push(breakcode[itm]);
          }
          break;
        }
        case "tap":
        default: {
          let thecode = SCAN_CODES[keys[k].kind];
          let breakcode = SCAN_CODES.getBreakCode([keys[k].kind]);
          for (let itm in thecode) {
            codes.push(thecode[itm]);
          }
          for (let itm in breakcode) {
            codes.push(breakcode[itm]);
          }
          break;
        }
      }
    }

    function _sendkeys(i) {
      if (!codes[i]) {
        grabVMScreen(null, c);
        return;
      }
      keyboard.putScancode(codes[i]).then(function () {
        i++;
        _sendkeys(i);
      }).catch(function (err) {
        say("Error: ```\n" + err + "```", c);
      });
    }

    _sendkeys(0);

    // keyboard.putScancodes(codes).then(function () {
    //   grabVMScreen(null, c);
    // }).catch(function (err) {
    //   say("Error: ```\n" + err + "```", c);
    // });
  }

  if (t == "mouse") {
    co(function* () {
      yield mouse.putMouseEvent(a[0], a[1], 0, 0, 0);
      grabVMScreen(null, c);
    }).catch(function (err) {
      say("Error: ```" + err + "```", c)
    });
  }

  if (t == "click") {
    let clickmask = 0;
    if (!a || !a[0]) a = ["left"];
    switch (a[0].toLowerCase()) {
      case "right":
      case "r":
      case "1": {
        clickmask = 0x02;
        break;
      }
      case "middle":
      case "m":
      case "3": {
        clickmask = 0x04;
        break;
      }
      default: {
        clickmask = 0x01;
        break;
      }
    }
    co(function* () {
      yield mouse.putMouseEvent(1, 1, 0, 0, clickmask);
      yield mouse.putMouseEvent(1, 1, 0, 0, 0x00);
      grabVMScreen(null, c);
    }).catch(function (err) {
      say("Error: ```" + err + "```", c);
    });
  }

  // if(t == "iso") {
  //   guest.updateGuestAdditions(__dirname + "/isos").then(function(prog) { // Sorry for this hack...
  //     prog.waitForCompletion(-1).then(function() {
  //       grabVMScreen(null, c);
  //     });
  //   });
  // }

  // if (t == "reset" || t == "respawn") {
  //   oc(function* () {
  //     let snap = yield imachine.findSnapshot("mint");
  //     let progress = yield imachine.restoreSnapshot(snap);
  //     yield progress.waitForCompletion(-1);
  //     say("Okey dokey! Restored snapshot!", c);
  //   });
  // }

  if (t == "ping") {
    bot.sendMessage({
      to: c,
      message: "http://generic.sucks *Getting ping*"
    }, function (err, resp) {
      if (err) {
        console.warn(err);
        return false;
      }
      bot.editMessage({
        channelID: c,
        messageID: resp.id,
        message: "http://generic.sucks Latency: " + Math.floor(new Date(resp.timestamp).valueOf() - new Date(event.d.timestamp).valueOf()) + "ms!"
      });
    });
  }

  // if (t == "ip") {
  //   say("You can reach any HTTP service that runs on port 80 here: http://osjs.strodl.tk", c);
  // }
  if (t == "help") {
    say(":wave: I'm ~~a slave which you run experiments on~~ a bot that's designed to act similarly to B1nzy's bot (With a few key differences including an intentional lack of rate-limits, support for forking, and multiple processes running concurrently :smiley:\n\
    These are my commands. You can use `>` or `<` to prefix them:\n\
    `mouse` - Moves the mouse cursor relative to the given coordinates (Usage: `mouse X Y`)\n\
    `click` - Clicks the given mouse button (Usage: `click left/right/middle`\n\
    `key` - Presses the space seperated keys (To press the space key use `SPACE`)\n\
    `screengrab` - Sends an image of the VM's screen\n\
    `type` - Sends the given keystrokes (Usage: `type mspaint /h`)\n\
    `restart` - Restarts the VM\n\
    `ping` - ????", c);
  }
});

function say(msg, c) {
  bot.sendMessage({
    to: c,
    message: msg
  });
}

function cleanup() {
  co(function* () {
    yield session.unlockMachine();
    setTimeout(() => {
      co(function* () {
        if (yield iconsole.getPowerButtonHandled()) return;
        let progress = yield iconsole.powerDown();
        yield progress.waitForCompletion(-1);
        process.exit(0);
      });
    }, 30 * 1000);
    yield iconsole.powerButton();
    process.exit(0);
  });
};

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

