#!/usr/bin/env node
var Avrgirl = require('avrgirl-arduino');
var path = require('path');
var supportedBoards = require('../boards.js').byName;
var _ = require('underscore');
var keypress = require('keypress');
var argv = require('minimist')(process.argv.slice(2), opts = {
  boolean: ['party', 'debug', 'help']
});

var debugMode = argv.debug;
var partyMode = argv.party;
var helpMsg = `usage: firmata-party [<arduino name> | <command>] [--party] [--debug]

firmata-party list # list all supported boards
firmata-party uno # flash Standard Firmata to an Arduino Uno
firmata-party uno --debug # show debug info
firmata-party uno --party # keep flashing firmata on new arduinos until you quit the program with ctrl+c!
firmata-party help # show usage info
`;
var supported = _.keys(supportedBoards).join(', ');

function showHelp() {
  console.log(helpMsg);
}

function showSupported() {
  console.log('supported board flags: \n' + supported);
}

handleArgs(argv);

function handleArgs(argv) {
  var board = argv._[0];
  var args = argv._;
  if (!argv || args.length == 0 || args.indexOf('help') > -1 || args.indexOf('man') > -1) {
    var status = board ? 0 : 1;
    showHelp();
    return process.exit(status);
  } else if (args.indexOf('list') > -1) {
    showSupported();
    return process.exit(0);
  } else {

    var options = {board: board, debug: debugMode};

    if (args.length > 1) {
      options["port"] = args[1]
    }
    
    if (partyMode) {
      party(options);
    } else {
      flashAndQuit(options);
    }
  }
}

function flash(options, callback) {
  var avrgirl = new Avrgirl(options);

  var hexFile = supportedBoards[options.board].hexFile
  if (hexFile === undefined) {
    hexFile = 'StandardFirmata.cpp.hex';
  }
  
  var filepath = path.resolve(__dirname, '..', 'node_modules', 'avrgirl-arduino', 'junk', 'hex', options.board, hexFile);
  avrgirl.flash(filepath, callback);
}

function flashAndQuit(options) {
  flash(options, function(error) {
    if (error) {
      console.error(error);
      return process.exit(1);
    } else {
      return process.exit();
    }
  });
}

function party(options) {
  var boardsFlashed = 0;
  keypress(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  var flashing = false;

  console.log("Press any key to start the party! or q to go home!");

  process.stdin.on('keypress', function (ch, key) {
    if (!key ) { return; }
    if ((key.ctrl && key.name == 'c') || key.name == 'q') {
      return process.exit();
    }

    if (flashing) { return; }

    flashing = true;
    console.log('Starting the Party!');
    flash(options, function(error) {
      if (error) {
        console.error("Oh no! Party foul!", error);
      } else{
        console.error("Success! Party legend! Press any key to keep partying!");
      }
      flashing = false;
    });
  });
}
