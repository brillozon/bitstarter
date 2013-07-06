#!/usr/bin/env node

/* Automatically grade files. */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if(!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
}

var cheerioLoadFile = function(htmlfile) {
  return cheerio.load(fs.readFileSync(htmlfile));
}

var cheerioLoadUrl = function(html) {
  return cheerio.load(html);
}

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
}

var generateOutput = function(result) {
  var resultOutput = JSON.stringify(result, null, 4);
  console.log(resultOutput);
}

var checkHtml = function(htmlfile, checksfile, htmlloader) {
  $ = htmlloader(htmlfile);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
}

if(require.main == module) {
  program.option('-c, --checks <file>', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
         .option('-u,  --url [url]', 'URL of index.html')
         .option('-f,  --file [file]', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
         .parse(process.argv);

  var resultJson;
  if( program.url) {
    rest.get(program.url.toString()).on('complete', function(result) {
      if( result instanceof Error) {
        console.log("Failed to fetch URL: " + program.url);
        process.exit(1);
      }
      // This is asynchronous, so we can't simplly fall out and finish.
      resultJson = checkHtml(result, program.checks, cheerioLoadUrl);
      generateOutput(resultJson);
    });

  } else {
    resultJson = checkHtml(program.file, program.checks, cheerioLoadFile);
    generateOutput(resultJson);
  }

} else {
  exports.checkHtmlFile = function(htmlfile, checksfile) {
      return checkHtml(htmlfile, checksfile, cheerioLoadFile);
    };
}

