try {
  var tokens = require('./secrets.json');
} catch(e) {
  console.log("You need to enter your token in ./secrets.json! (See an example in secrets_example.json)");
  return;
}

try {
  var Discord = require('discord.io');
  var exec = require('child_process').exec;
  var lxc = require('lxc')();
} catch(e) {
  console.log("You need to run `npm i` first!");
  return;
}
var bot = new Discord.Client({
  autorun: true,
  token: tokens.discord
});

let resetting = false;

bot.on('disconnect', function(err, code) {
  console.warn("Jake attempted to kick me off Discord with error number: " + code + " (" + err + ")! Attempting reconneciton :D");
  bot.connect();
});

bot.on('ready', function() {
  console.log("Successfully connected: " + bot.username + " - (" + bot.id + ")");
  lxc.start('b1nzy', function(msg, msg2, msg3) {
    say("Bot ready :+1:", 294737039054733312); // #bots
  });
});

let timers = {};

bot.on('message', function (user, userID, channelID, message, event) {
  let t = message.split(" ")[0];
  let c = channelID;
  let a = message.split(" ");
  a.shift();
  if(t == "<eval" || t == ">eval") {
    if(timers[userID]) {
        if(new Date().getTime() - timers[userID] < 0 * 1000) {
            say("Rate limited", c);
            return false;
        }
    }
    timers[userID] = new Date().getTime();
    let cmd = message.split(" ");
    cmd.shift();
    for(let key in cmd) {
      if(cmd[key] == "install" && (cmd[key-1] == "apt" || cmd[key-1] == "apt-get")) {
        cmd[key] = cmd[key].replace("install", "install -y");
        say("[WARN] Adding `-y` to APT... Remember this won't happen on the real thing!", c);
      }
    }
    let cmd2 = cmd.join(" ");
    let begin = new Date().getTime(); // More accurate reading this way ;)
    lxc.attach('b1nzy', "bash -c '" + cmd2 + "'", function(out, out2, out3) {
      say("```\n" + out2 + "```" + String(new Date().getTime() - begin) + "MS", c);
    });
  }
  if(t == "<reset" || t == "<respawn" || t == ">respawn" || t == ">reset") {
    if(resetting) {
      say("Nope! Nice try Jake! You can't run 2 resets at once!", c);
      return false;
    }
    say(":ok_hand: Please wait a moment while the VM shuts down **AND GETS BOMBARDED WITH THE CONCENTRATED ESSENCE OF JAKE** :boom:", c);
    lxc.stop("b1nzy", function() {
      exec("lxc-snapshot -n b1nzy -r snap0", function(err, stdout, stderr) { // Weird bug in the lib makes us use exec... Idk why tho...
        lxc.start("b1nzy", function(err,resp) {
          console.log(err, resp, "started");
          say("Done causing irreperable damage! :wink:", c);
          resetting = false;
        });
      });
    })
  }
  if(t == "<reboot" || t == ">reboot") {
    say(":alarm_clock: Deleting Jake-limits... Just a sec...", c);
    lxc.stop("b1nzy", function(err, resp) {
      lxc.start("b1nzy", function(err1, resp1) {
        say(":boom: Exploded Jake-limits and in the process restarted the VM.", c);
      });
    });
  }
  if(t == "<ping" || t == ">ping") {
    say("http://takeb1nzyto.space", c);
  }
  if(t == "<ip" || t == ">ip") {
    say("You can reach any HTTP service that runs on port 80 here: http://osjs.strodl.tk", c);
  }
  if(t == "<help" || t == ">help") {
    say(":wave: I'm ~~a slave which you run experiments on~~ a bot that's designed to act similarly to B1nzy's bot (With a few key differences including an intentional lack of rate-limits, support for forking, and multiple processes running concurrently :smiley:\n\
    These are my commands. You can use `>` or `<` to prefix them:\n\
    `eval` - runs a given program on the VM\n\
    `respawn` / `reset` - resets the VM to a fresh copy\n\
    `reboot` - reboots the VM\n\
    `ip` - gives the link to the VM's public facing HTTP server\n\
    `ping` - ????", c);
  }
});

function say(msg, c) {
  bot.sendMessage({
    to: c,
    message: msg
  });
}
