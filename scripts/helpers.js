var HELPERS = (function(){

  // generateUUID
  // 'unique string generator'
  // example use:

  // generateUUID() //=> "3831d0a4-5f80-419f-8be1-83bfc1fea6de"
  // TODO: add params to customize?

  var generateUUID = function(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  };

  // slugify
  // 'turn any text into slug'
  // example use:

  // slugify('**Hello My Name is**!') //=> "hello-my-name-is"

  var slugify = function(text){
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
  };

  // timer
  // 'namespaced timers'
  // example use:

  // timer.start('uniquekey') //=> { start: "2016-08-31T19:08:46.556Z", end: null, elapsed: 0 /* milliseconds */}
  // timer.stop('uniquekey') //=> { start: "2016-08-31T19:08:46.556Z", end: "2016-08-31T19:08:48.266Z", elapsed: 1710 /* milliseconds */}

  var timer = (function(){
    var timers = {};

    var _timer = (function(){
      return {
        create: function(){
          var start = null;
          var end = null;
          return {
            start: function(){
              start = new Date();
              return {
                start: start.toISOString(),
                end: null,
                elapsed: 0 //ms
              };
            },
            stop: function(){
              end = new Date();
              return {
                start: start.toISOString(),
                end: end.toISOString(),
                elapsed: (end - start) //ms
              };
            }
          }
        }
      }
    }());

    return {
      start: function(namespace){
        var existingTimer = timers[namespace];
        if(existingTimer){
          // noop
        } else {
          timers[namespace] = _timer.create();
          return timers[namespace].start();
        }
      },
      stop: function(namespace){
        var existingTimer = timers[namespace];
        if(existingTimer){
          var time = existingTimer.stop();
          delete timers[namespace];
          return time;
        } else {
          // noop
        }
      }
    }

  }());

  // log
  // 'environment aware logger'
  // example use:

  // log('message', 'local')      //=> 1472680294833>> message
  // log('message', 'production') //=> ...nothing...

  var log = function(message, env){
    if(env !== 'production'){
      console.log(Date.now() + '>> ' + message)
    }
  };

  // pipeline (create, run)
  // 'two way message abstraction'
  // example use:

  // pipeline.create('state::get', [ STATE, SESSION ]);

  // MEANWHILE, elsewhere...

  // pipeline.run('state::get', function(state, session){ /* do stuff with `state` and `session` */ })

  var create = function(message, params){
    $(document).on(message, function(event, responseMessage){
      $(document).trigger(responseMessage, params);
    });
  };

  var run = function(message, callback){
    var requester = generateUUID();

    $(document).on(requester, function(){
      var args = Array.prototype.slice.call(arguments).splice(1); // removes first arg 'event'
      callback.apply(null, args);
      $(document).off(requester);
    });

    $(document).trigger(message, [ requester ])
  };

  return {
    generateUUID: generateUUID,
    slugify: slugify,
    timer: timer,
    log: log,
    pipeline: {
      create: create,
      run: run
    }
  }

}());

module.exports = HELPERS;