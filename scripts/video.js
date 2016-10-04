//BROWSERIFY//////////////////////
//////////////////////////////////
var HELPERS = require('./helpers.js');
var R = require('ramda');
var jQuery = $ = require('jquery');
var Projector = require('./../vendor/projectorjs/dist/js/projector_edits.js');
//////////////////////////////////
//////////////////////////////////

///////////
// DATA //
/////////

var CONFIG = {
  events: '',
  options: {
    videoEnd: {
      fadeTime: 300
    }
  }
};

var VIDEOS = {};
var DATA = {};

////////////////////
// FUNCTIONALITY //
//////////////////

/*-----------

 Element = {
 type: 'video',                                             // required
 mount: '#video1',                                          // required
 src: 'http://player.vimeo.com/external/160147958.hd.mp4',  // required
 autoPlay: true,                                            // optional, will be null, handled as such
 autoProgress: false,                                       // optional, will be null, handled as such
 width: 800,                                                // optional, default 400
 style: 'opacity:0.5',                                      // optional, default ''
 overlays: []                                               // optional, wont run if undefined
 }

 Element['name'] is added via `init`
 Element['id'] is dynamically generated via `mount`

 Overlay = {
 type: 'radio',
 fade: { in: true, time: 1300 },
 pause: false,
 showAfterResponse: false,
 question: {
 title: 'How many grants have you written?',
 answers: [
 { value: 'none', text: 'None', feedback: 'This video will definitely help.' },
 { value: 'one', text: 'One', feedback: 'You should pick up a few tips.' },
 { value: 'more than one', text: 'More than one', feedback: 'Let\'s skip to discussion on priorities. Please let us know how you feel along the way with feedback.', action: { type: 'go', location: 52 } }
 ]
 },
 style: {
 main: 'padding-left:10px;padding-right:10px;',
 background: ''
 },
 location: {
 top: '0%',
 bottom: '0%',
 left: '65%',
 right: '0%'
 },
 timing: {
 start: 2,
 end: 20
 }
 }

 Videos = {
 old: Element,
 new: Element
 }

 EVENTS:

 // listening \\

 video::mount   [ Element ]
 video::unmount [ Element ]
 video::swap    [ Videos  ]
 video::play    [ Element ]
 video::pause   [ Element ]

 // sending \\

 video::mounted   [ Element, Elements ]
 video::unmounted [ Element, Elements ]
 video::playing   [ Element, Elements, boolean ]
 video::ended     [ Element, Elements, undefined || boolean ]
 video::lifecycle [ Element, 'unmounted' ]
 video::lifecycle [ Element, 'mounted' ]
 video::lifecycle [ Element, 'playing' ]
 video::lifecycle [ Element, 'play' ]
 video::lifecycle [ Element, 'seeked' ]
 video::lifecycle [ Element, 'seeking' ]
 video::lifecycle [ Element, 'pause' ]
 video::lifecycle [ Element, 'ended' ]
 video::lifecycle [ Element, 'timeupdate' ]
 video::lifecycle [ Element, 'volumechange' ]

 ------------*/

var buildHTML = function(element){

  //TODO: remove controls property, make configurable?

  var html = '<video id="' + element.id + '" class="" width="' + (element.width || 400) + '" style="' + (element.style || '') + '" controls>' +
      '<source src="' + element.src + '" type="video/mp4">' +
      '<source src="' + element.src + '" type="video/ogg">' +
      'Your browser does not support HTML5 video.' +
      '</video>';

  return html;
};

var initOverlays = function(element){

  ///////////////////////////////////////////////
  // https://github.com/adamscybot/projectorjs //
  ///////////////////////////////////////////////

  var projector = Projector.init(element.id);

  var overlayState = {};

  var branchingOverlay = function(projector, overlay){
    var id = HELPERS.generateUUID();
    var goTo = function(branchId){
      var branch = overlay['branches'][branchId];

      branch['mount'] = element['mount'];

      CONFIG.events.trigger('video::swap', [ { old: element, new: branch } ]);
    };

    var afterBeginOverlay = function(projector, currentTime, dirtyTrigger){

      var showOverlay = function(){
        return true;
      };

      if(showOverlay()){
        overlay.setup({ goTo: goTo });
        if(overlay.pause){ $('#' + element.id).get(0).pause(); }
      }

    };

    projector.addOverlay(
        Projector.HTMLBox({
          html: overlay.html
        }),
        R.merge(overlay.location, { timings: [R.assoc('afterBeginOverlay', afterBeginOverlay, overlay.timing) ] })
    );

  };

  var htmlOverlay = function(projector, overlay){
    var id = HELPERS.generateUUID();

    var afterBeginOverlay = function(projector, currentTime, dirtyTrigger){

      var showOverlay = function(){
        return true;
      };

      if(showOverlay()){
        overlay.setup({ videoElement: element.id });
        if(overlay.pause){ $('#' + element.id).get(0).pause(); }
      }

    };

    projector.addOverlay(
        Projector.HTMLBox({
          html: overlay.html
        }),
        R.merge(overlay.location, { timings: [R.assoc('afterBeginOverlay', afterBeginOverlay, overlay.timing) ] })
    );

  };

  var radioOverlay = function(projector, overlay){
    var id = HELPERS.generateUUID();
    var slug = HELPERS.slugify(overlay.question.title) + '-' + id;
    var answers = overlay.question.answers;

    var afterBeginOverlay = function(projector, currentTime, dirtyTrigger){

      var showOverlay = function(){
        if(overlay.showAfterResponse){ return true; }
        return overlayState[id] ? false : true;
      };

      if(showOverlay()){

        var radios = '<radiogroup style="font-size:12px;">' +
            overlay.question.answers.map(function(answer, answerIndex){
              return '<label for="radio-' + slug +HELPERS.slugify(answer.value) + '" style="pointer-events:all;cursor:pointer;"><input id="radio-' + slug +HELPERS.slugify(answer.value) + '" type="radio" value="' + answer.value + '" data-answer-index='+ answerIndex +' name="' + slug + '" style="cursor:pointer;">' + answer.text + '</label><br>'
            }).join('') +
            '</radiogroup>';

        var submit = '<button id="submit-overlay-' + id + '" style="pointer-events:all;cursor:pointer;">Submit</button>';

        $('#' + id).html('<div id="overlay-' + id + '-content" style="' + (overlay.fade.in ? 'display:none;' : '') + 'width:100%;height:200px;color:white;' + overlay.style.background + 'padding-left:5px;padding-right:5px;"><p style="font-size:20px;">' + overlay.question.title + '</p>' + radios + submit + '</div>')

        if(overlay.fade.in){ $('#overlay-' + id + '-content').fadeIn(overlay.fade.time, function(){}); }

        $(document).on('click', 'input[name=' + slug + ']', function(e){
          var selection = $(e.target).val();
          var answerIndex = $(e.target).attr('data-answer-index');
          var answer = answers[answerIndex];
          overlayState[id] = answer;
        });

        $(document).on('click', '#submit-overlay-' + id, function(e){
          if(!overlay.pause){ $('#' + element.id).get(0).pause(); }
          var close = '<button id="continue-overlay-' + id + '" style="pointer-events:all;cursor:pointer;">Continue Video</button>';
          $('#overlay-' + id + '-content').html('<div style="font-size:20px;"><p>You chose ' + overlayState[id].text + '</p><p>' + overlayState[id].feedback + '</p></div>' + close);
        });

        $(document).on('click', '#continue-overlay-' + id, function(){
          var answer = overlayState[id];
          if(answer.action && answer.action.type === 'go'){ $('#' + element.id).get(0).currentTime = answer.action.location; $('#' + element.id).get(0).play(); }
          $('#' + element.id).get(0).play();
          $('#' + id).html('');
        });

        if(overlay.pause){ $('#' + element.id).get(0).pause(); }

      }

    };

    projector.addOverlay(
        Projector.HTMLBox({
          html: '<div id="' + id + '" style="' + overlay.style.main + '"></div>'
        }),
        R.merge(overlay.location, { timings: [R.assoc('afterBeginOverlay', afterBeginOverlay, overlay.timing) ] })
    );
  };

  element.overlays.forEach(function(overlay){
    var type = overlay.type;

    switch(type) {
      case 'html': htmlOverlay(projector, overlay);
        break;
      case 'radio': radioOverlay(projector, overlay);
        break;
      case 'branching': branchingOverlay(projector, overlay);
        break;
      default: 'overlay default'
    }
  });

};

var mount = function(element){

  element['id'] = HELPERS.generateUUID();

  var mount = element.mount;

  $(mount).html(buildHTML(element));

  if(element.overlays){ initOverlays(element) }

  CONFIG.events.trigger('video::mounted', [ element, VIDEOS ]);

  CONFIG.events.trigger('video::lifecycle', [ element, 'mounted' ]);

  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events //
  ////////////////////////////////////////////////////////////////////////////

  $('#' + element.id).on('playing', function(event){
    // Sent when the media begins to play (either for the first time, after having been paused, after seeking or after ending and then restarting).
    CONFIG.events.trigger('video::lifecycle', [ element, VIDEOS, 'playing']);
    CONFIG.events.trigger('video::playing', [ element, VIDEOS, true ]);
  });

  $('#' + element.id).on('play', function(event){
    // Sent when playback of the media starts after having been paused; that is, when playback is resumed after a prior pause event.
    CONFIG.events.trigger('video::lifecycle', [ element, 'play' ]);
  });

  $('#' + element.id).on('seeked', function(event){
    // Sent when a seek operation completes.
    CONFIG.events.trigger('video::lifecycle', [ element, 'seeked' ]);
  });

  $('#' + element.id).on('seeking', function(event){
    // Sent when a seek operation begins.
    CONFIG.events.trigger('video::lifecycle', [ element, 'seeking' ]);
  });

  $('#' + element.id).on('pause', function(event){
    // Sent when playback is paused (manually or upon seeking).
    CONFIG.events.trigger('video::lifecycle', [ element, 'pause' ]);
    CONFIG.events.trigger('video::playing', [ element, VIDEOS, false ]);
  });

  $('#' + element.id).on('ended', function(event){
    // Sent when playback completes.
    CONFIG.events.trigger('video::lifecycle', [ element, 'ended' ]);
    CONFIG.events.trigger('video::playing', [ element, VIDEOS, false ]);
    CONFIG.events.trigger('video::ended', [ element, VIDEOS, element.autoProgress ]);
  });

  $('#' + element.id).on('timeupdate', function(event){
    // The time indicated by the element's currentTime attribute has changed.
    CONFIG.events.trigger('video::lifecycle', [ element, 'timeupdate' ]);
  });

  $('#' + element.id).on('volumechange', function(event){
    // Sent when the audio volume changes (both when the volume is set and when the muted attribute is changed).
    CONFIG.events.trigger('video::lifecycle', [ element, 'volumechange' ]);
  });

  return element;
};

var unmount = function(element){
  var mount = element.mount;

  $('#' + element.id).off('playing');
  $('#' + element.id).off('play');
  $('#' + element.id).off('seeked');
  $('#' + element.id).off('seeking');
  $('#' + element.id).off('pause');
  $('#' + element.id).off('ended');
  $('#' + element.id).off('timeupdate');
  $('#' + element.id).off('volumechange');

  $(mount).html('');

  CONFIG.events.trigger('video::lifecycle', [ element, 'unmounted' ]);

  return element;

};

var embed = function(params){
  var videoId = params['video'];
  var video = VIDEOS[videoId];

  if(video){
    mount(video);
  } else {
    throw videoId + ': No video to embed';
  }
};

var init = function(videoConfigs){
  VIDEOS = R.mapObjIndexed(function(element, name, obj){
    return R.assoc('name', name, element);
  }, videoConfigs);
};

var api = function(){

  var doMount = function(element){
    return mount(element);
  };

  var doUnmount = function(element){
    unmount(element);
    CONFIG.events.trigger('video::unmounted', [ element, VIDEOS ]);
    return element;
  };

  CONFIG.events.on('video::swap', function(event, videos){
    doUnmount(videos['old']);
    var mountedElement = doMount(videos['new']);
    CONFIG.events.trigger('video::play', [ mountedElement ]);
  });

  CONFIG.events.on('video::mount', function(event, element){
    // TODO: throw 'error' if no mount or src, dont create or register...
    doMount(element);
  });

  CONFIG.events.on('video::unmount', function(event, element){
    $(element.mount).fadeOut(CONFIG.options.videoEnd.fadeTime, function(){
      doUnmount(element);
    });
  });

  CONFIG.events.on('video::play', function(event, element){
    $('#' + element.id).get(0).play();
  });

  CONFIG.events.on('video::pause', function(event, element){
    $('#' + element.id).get(0).pause();
  });

};

var configure = function(config){
  CONFIG = R.merge(CONFIG, config);
  api();
};

//////////////
// EXPORTS //
////////////

module.exports = {
  configure: configure,
  init: init,
  embed: embed
  //onSubmission: shareSubmission
};