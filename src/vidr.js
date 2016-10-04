//BROWSERIFY////////////////////////////////
require('./vidr.css');
var Vidr = require('./../scripts/video.js');
////////////////////////////////////////////

if(window.Vidr){
  throw 'Vidr already exists in the global namespace';
  // TODO: allow user to choose global name?
} else {
  window.Vidr = Vidr;
}