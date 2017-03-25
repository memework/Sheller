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
  var child = require("child");
  var fs = require("fs");
} catch (e) {
  console.log("You need to run `npm i` first!");
  return;
}

var exec = function (command, onData, onClose) {

  onData = onData || function () { }
  onClose = onClose || function () { }
  var runCommand = [];
  command.replace(/"([^"]*)"|'([^']*)'|(\S+)/g, function (g0, g1, g2, g3) { runCommand.push(g1 || g2 || g3 || '') });

  var errors = '';

  child({
    command: runCommand.slice(0, 1)[0],
    args: runCommand.slice(1),
    cbStdout: function (data) { onData('' + data) },
    cbStderr: function (data) { errors += data; onData('' + data) },
    cbClose: function (exitCode) { onClose(exitCode, errors) }
  }).start()
}

var bot = new Discord.Client({
  autorun: true,
  token: tokens.discord
});

let resetting = false;

bot.on('disconnect', function (err, code) {
  console.warn("Jake attempted to kick me off Discord with error number: " + code + " (" + err + ")! Attempting reconneciton :D");
  bot.connect();
});

bot.on('ready', function () {
  console.log("Successfully connected: " + bot.username + " - (" + bot.id + ")");
  let tmplog = "";
  exec("lxc-start -n " + vmname + " -d", function (output) { tmplog += output }, function () {
    say("Bot ready :+1:", 294737039054733312); // #bots
  });
});

let timers = {};

bot.on('message', function (user, userID, channelID, message, event) {
  if (message.charAt(0) != "<" && message.charAt(0) != ">") return false; // Ignore non-commands...
  let t = message.split(" ")[0].substr(1); // Remove 1st character
  let c = channelID;
  let a = message.split(" ");
  a.shift();
  if (t == "eval") {
    if (timers[userID]) {
      if (new Date().getTime() - timers[userID] < 0 * 1000) {
        say("Rate limited", c);
        return false;
      }
    }
    timers[userID] = new Date().getTime();
    let cmd = message.split(" ");
    cmd.shift();
    for (let key in cmd) {
      if (cmd[key] == "install" && (cmd[key - 1] == "apt" || cmd[key - 1] == "apt-get")) {
        cmd[key] = cmd[key].replace("install", "install -y");
        say("[WARN] Adding `-y` to APT... Remember this won't happen on the real thing!", c);
      }
    }

    let cmd2 = cmd.join(" ")// .replace(new RegExp('"', "gi"), "\\\"");
    // cmd2 = cmd2.replace(/\\/gi, "\\\\");
    // cmd2 = cmd2.replace(/#/gi, "\\#");
    // cmd2 = cmd2.replace(/;/gi, "\\;");
    // cmd2 = cmd2.replace(/&/gi, "\\&");
    // cmd2 = cmd2.replace(/./gi, "\\.");
    // cmd2 = cmd2.replace(/"/gi, '\\"');
    // cmd2 = cmd2.replace(/'/gi, "\\'");
    // cmd2 = cmd2.replace(/,/gi, "\\,");
    // cmd2 = cmd2.replace(/`/gi, "\\`");
    // cmd2 = cmd2.replace(/:/gi, "\\:");
    // cmd2 = cmd2.replace(/!/gi, "\\!");
    // cmd2 = cmd2.replace(/\*/gi, "\\*");
    // cmd2 = cmd2.replace(/\?/gi, "\\?");
    // cmd2 = cmd2.replace(/\$/gi, "\\$");
    // cmd2 = cmd2.replace(/\(/gi, "\\\(");
    // cmd2 = cmd2.replace(/\)/gi, "\\\)");


    console.log(cmd2);
    let begin = new Date().getTime(); // More accurate reading this way ;)
    let tmplog = "";
    say("Running `" + cmd2 + "`!", c);
    let myfile = "/tmp/sheller/sheller-" + new Date().getTime() + "-" + Math.floor(Math.random() * 10000) + ".sh";
    fs.writeFile(myfile, cmd2, function (err) { // I'm done... This isn't the most elegant solution but it seems like it's the only one that'll work without significant overhead...
      if (err) {
        say("Error writing file... ```\n" + err + "```");
        console.warn(err);
        return false;
      }
      console.log("made file " + myfile + "!");
      exec("lxc-attach -n " + vmname + " -- bash " + myfile, function (output) { tmplog += output }, function (error, stderr) {
        say("```\n" + tmplog.substring(0, 1960) + "```" + String(new Date().getTime() - begin) + "MS. Code: `" + error + "`", c);
        if (stderr) {
          say("Stderr: ```\n" + stderr + "```", c);
        }
        fs.unlink(myfile, function(err2) {
          if(err2) {
            console.warn(err2)
          }
        });
      });
    });
  }
  if (t == "snaps") {
    child_process.exec("lxc-snapshot -n " + vmname + " -L", function (error, stdout, stderrr) {
      say("Available snapshots:```\n" + stdout + "```", c);
    });
  }
  if (t == "snap") {
    exec("lxc-snapshot -n " + vmname, () => { }, function (error) {
      say(":ok_hand: Made a new snapshot!", c);
    });
  }
  if (t == "load-snap") {
    let snap = a[0];
    if (!snap) {
      say("Oh snap! You need to give me a snapshot to load goofy!", c);
    }
    exec("lxc-stop -n " + vmname, () => { }, function () {
      exec("lxc-snapshot -r " + vmname + " -r " + snap, () => { }, function (error) {
        exec("lxc-start -n " + vmname + " -d", () => { }, function () {
          say("Loaded snapshot!", c);
        });
      });
    });
  }
  if (t == "container") {
    let cmdarg = a;
    // let name = cmdarg.shift();
    let template = cmdarg.shift();
    say(":ok_hand: This may take a while! In the meantime, `eval` won't work...", c);
    child_process.exec("lxc-stop -n " + vmname, function (e_1, e_2, e_3) {
      console.log("Stopped VM");
      child_process.exec("lxc-destroy -fsn " + vmname, function (e_4, e_5, e_6) {
        console.log("Destroyed VM");
        child_process.exec("lxc-create -n " + vmname + " -t " + template + " -- " + cmdarg.join(" "), function (e_7, e_8, e_9) {
          console.log("Created new VM");
          child_process.exec("lxc-start -n " + vmname + "; lxc-attach -n " + vmname + " -- mkdir -p /tmp/sheller; lxc-stop -n " + vmname, function () {
            child_process.exec("lxc-snapshot -n " + vmname, function (e_10, e_11, e_12) {
              console.log("Created snapshot");
              child_process.exec("lxc-start -n " + vmname, function (e_13, e_14, e_15) {
                // console.log(e_1, e_2, e_3, e_4, e_5, e_6, e_7, e_8, e_9, e_10, e_11, e_12, e_13, e_14, e_15);
                console.log("Started up new VM!");
                say("Purged old container!\n\
                  Created new container using template **" + template + "** using the arguments `" + cmdarg.join(" ") + "`\n\
                  Also created the `snap0` snapshot!", c);
              });
            });
          });
        });
      });
    });
  }
  if (t == "reset" || t == "respawn") {
    if (resetting) {
      say("Nope! Nice try Jake! You can't run 2 resets at once!", c);
      return false;
    }
    say(":ok_hand: Please wait a moment while the VM shuts down **AND GETS BOMBARDED WITH THE CONCENTRATED ESSENCE OF JAKE** :boom:", c);
    let tmplog = "";
    child_process.exec("lxc-stop -n " + vmname, function (error, stdout, stderr) {
      child_process.exec("lxc-snapshot -n " + vmname + " -r snap0", function (err, stdout, stderr) { // Weird bug in the lib makes us use exec... Idk why tho...
        exec("lxc-start -n " + vmname + " -d", function (output) { tmplog += output }, function () {
          say("Done causing irreperable damage! :wink:", c);
          resetting = false;
        });
      });
    })
  }
  if (t == "reboot") {
    say(":alarm_clock: Deleting Jake-limits... Just a sec...", c);
    let tmplog = "";
    exec("lxc-stop -n " + vmname, function (output) { tmplog += output }, function () {
      exec("lxc-start -n " + vmname + " -d", function (output) { tmplog += output }, function () {
        say(":boom: Exploded Jake-limits and in the process restarted the VM.", c);
      });
    });
  }
  if (t == "ping") {
    say("http://takeb1nzyto.space", c);
  }
  if (t == "ip") {
    say("You can reach any HTTP service that runs on port 80 here: http://osjs.strodl.tk", c);
  }
  if (t == "help") {
    say(":wave: I'm ~~a slave which you run experiments on~~ a bot that's designed to act similarly to B1nzy's bot (With a few key differences including an intentional lack of rate-limits, support for forking, and multiple processes running concurrently :smiley:\n\
    These are my commands. You can use `>` or `<` to prefix them:\n\
    `eval` - runs a given program on the VM\n\
    `respawn` / `reset` - resets the VM to a fresh copy\n\
    `reboot` - reboots the VM\n\
    `ip` - gives the link to the VM's public facing HTTP server\n\
    `container` - Usage: container (Template) (ARGS) creates a new container of the given template and appends args to the command\n\
    `snap` - Creates a new snapshot\n\
    `load-snap` - Loads the given snapshot\n\
    `snaps` - Gives the list of snapshots for the given container\n\
    `ping` - ????", c);
  }
});

function say(msg, c) {
  bot.sendMessage({
    to: c,
    message: msg
  });
}
