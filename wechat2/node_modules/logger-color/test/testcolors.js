var colors = require('colors');

var txt = `black
red
green
yellow
blue
magenta
cyan
white
gray
grey`;

var txts = txt.split('\n');
console.log('\n\n\n');
txts.forEach(function (txt) {
    console.log(colors[txt]('      This Color Is: ',txt));
});
console.log('\n\n\n');
