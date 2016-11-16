//BROWSERIFY//////////////////////
//////////////////////////////////
var HELPERS = require('./helpers.js');
var R = require('ramda');
var jQuery = require('jquery');
var $ = jQuery;
var Projector = require('./../vendor/projectorjs/dist/js/projector_edits.js');
var d3 = require('./../vendor/d3kit-timeline/node_modules/d3kit/node_modules/d3/d3.js');
var d3KitTimeline = require('./../vendor/d3kit-timeline/dist/d3kit-timeline.js');
//////////////////////////////////
//////////////////////////////////

///////////
// DATA //
/////////

var CONFIG = {
  events: jQuery(document),
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

// data-mode: ['poster', 'playing', 'play', 'seeked', 'seeking', 'pause', 'ended' ]
// NOTE: can be used to style the video only during certain modes

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

 VIDR::swap     [ Videos ]
 VIDR::mount    [ Element ]

 video::unmount [ Element ]
 video::play    [ Element ]
 video::pause   [ Element ]

 // sending \\

 video::mounted   [ Element, Elements ]
 video::unmounted [ Element, Elements ]
 video::playing   [ Element, Elements, boolean ]
 video::ended     [ Element, Elements, undefined || boolean ]
 video::branching [ Element, Elements, { branches: [branches], from: Element, to: Element } ]
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
  var poster = (element.poster || '');
  var width = (element.width ? `width="${element.width}"` : '');
  var height = (element.width ? `height="${element.height}"` : '');
  var style = (element.style || '');
  var controls = ((element.controls === false) ? '' : 'controls');

  return `
    <video id="${element.id}" class="" data-mode="poster" style="${style}" ${width} ${height} poster="${poster}" ${controls}>
      <source src="${element.src}" type="video/mp4">
      <source src="${element.src}" type="video/ogg">
      'Your browser does not support HTML5 video.'
    </video>
  `;
};

var initTimeline = function(element){

  //var TIME_CONTROLS = (function(){
  //
  //  var video = document.getElementById("page-video");
  //  var currentTimeValue = document.getElementById("current-time-value");
  //  var timeSlider = document.getElementById("time-slider");
  //
  //  video.addEventListener('loadeddata', function() {
  //    timeSlider.max = video.duration;
  //  });
  //
  //  var updateText = function(nativeDOMElement, text){
  //    var txt = document.createTextNode(text);
  //    nativeDOMElement.innerText = txt.textContent;
  //  };
  //
  //  var createGetSetHandler = function(get, set){
  //    var throttleTimer;
  //    var blockedTimer;
  //    var blocked;
  //
  //    return {
  //      get: function(){
  //        if(blocked){ return; }
  //        return get.apply(this, arguments);
  //      },
  //      set: function(){
  //        clearTimeout(throttleTimer);
  //        clearTimeout(blockedTimer);
  //
  //        var that = this;
  //        var args = arguments;
  //        blocked = true;
  //        throttleTimer = setTimeout(function () {
  //          set.apply(that, args);
  //          blockedTimer = setTimeout(function () {
  //            blocked = false;
  //          }, 30);
  //        }, 0);
  //      }
  //    };
  //  };
  //
  //  var getSetCurrentTime = createGetSetHandler(
  //      function(){ timeSlider.value = video.currentTime; },
  //      function(){ try { video.currentTime = timeSlider.value } catch (er) {} }
  //  );
  //
  //  timeSlider.oninput = function(){
  //    getSetCurrentTime.set();
  //  };
  //
  //  video.ontimeupdate = function(){
  //    var formatTime = function(timeInSeconds){
  //      var str_pad_left = function(string, pad, length) {
  //        return (new Array(length + 1).join(pad) + string).slice(-length);
  //      };
  //      var time = Math.round(timeInSeconds);
  //      var minutes = Math.floor(time / 60);
  //      var seconds = time - minutes * 60;
  //
  //      return str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
  //    };
  //
  //    updateText(currentTimeValue, formatTime(video.currentTime));
  //    getSetCurrentTime.get();
  //
  //  };
  //}());

  //TODO: pass in mount (and its width) optional to have it somewhere else

  var secondsToPixels = function(fullWidth, fullDuration, currentTime){
    return (fullWidth * currentTime) / fullDuration;
  };
  var pixelsToSeconds = function(fullWidth, fullDuration, currentPixels){
    return (fullDuration * currentPixels) / fullWidth;
  };
  var svgClickEventToCoordinates = function(event){
    var dim = event.target.getBoundingClientRect();
    var x = event.clientX - dim.left;
    var y = event.clientY - dim.top;

    return {
      x: x,
      y: y
    }
  };

  var id = `${element.id}-timeline`;
  var video = `#${element.id}`;
  var data = R.compose(R.map(function(timelineEvent){ return R.merge({ id: HELPERS.generateUUID() }, timelineEvent) }), R.pathOr({}, ['timeline', 'data']))(element);
  var colors = R.pathOr({}, ['timeline', 'colors'], element);

  $(`<div id=${id}></div>`).insertAfter(video);

  var color = function(data){
    return R.propOr('#777', data.type, colors);
  };

  // http://stackoverflow.com/a/14002735

  var timeline = new d3KitTimeline($(`#${id}`).get(0), {
    direction: 'down',
    margin: { left: 0, right: 0 },
    initialWidth: $(video).width(),
    initialHeight: 250,
    labelBgColor: color,
    linkColor: color,
    dotColor: color,
    scale: d3.scale.linear(),
    domain: [0, parseFloat($(video).attr('data-duration'))],
    textFn: function(data){
      return data.time + ' - ' + data.name;
    }
  });

  CONFIG.events.trigger('video::timeline::mounted', [ timeline, data ]);

  // ticks is count of how many
  // thinner tickSize is 1 ? 0 is no axis, negative and 2 are thick

  timeline.axis.tickFormat(function(time){ return time + '\''; });
  timeline.axis.ticks(0);
  timeline.axis.tickSize(1);
  timeline.data(data).resizeToFit();

  $(document).on('mouseover', `#${id} .dot`, function(event){
    $(event.target).attr('r', 6);
  });

  $(document).on('mouseout', `#${id} .dot`, function(event){
    $(event.target).attr('r', 3);
  });

  timeline.on('dotMouseover', function(data, index){
    CONFIG.events.trigger('video::timeline::hover', [ data ]);
  });

  timeline.on('dotClick', function(data, index){
    var time = data.time;

    CONFIG.events.trigger('video::timeline::select', [ data ]);

    $(document).trigger('video::updateTime', [ time ]);
  });

  d3.select($(`#${id} .axis-layer`).get(0)).append("path")
    .attr("id", `${id}-background`)
    .attr("d", "M0,-20V20H1280V-20")
    .attr("opacity", 0.3)
    .attr("fill", "blue");

  $(document).on('click', `#${id}-background, #${id}-midground`, function(event){
    var nextTime = pixelsToSeconds(
      $(video).width(),
      parseFloat($(video).attr('data-duration')),
      svgClickEventToCoordinates(event)['x']
    );

    $(document).trigger('video::updateTime', [ nextTime ]);
  });

  $(document).on('mouseover', `#${id}-background, #${id}-midground`, function(event){
    //TODO: have 'indicator' bar drawn on mouseover to show where your mouse is pointing?
  });

  $(document).on('video::timeupdate', function(event, element, currentTime){

    var nextLocation = secondsToPixels(
      $(video).width(),
      parseFloat($(video).attr('data-duration')),
      currentTime
    );

    if($(`#${id}-midground`).length > 0){
      d3.select($(`#${id}-midground`).get(0)).remove();
    }

    d3.select($(`#${id} .axis-layer`).get(0)).append("path")
        .attr("id", `${id}-midground`)
        .attr("d", `M0,-20V20H${nextLocation}V-20`)
        .attr("opacity", 0.3)
        .attr("fill", "red");

    var currentTimelineEvents = data.filter(function(timelineEvent){ return timelineEvent.time === Math.round(currentTime) });

    if(R.compose(R.not, R.isEmpty)(currentTimelineEvents)){
      //TODO: this will run 2 or 3 times per second, make sure these only run once...
      CONFIG.events.trigger('video::timeline::hover', [ R.head(currentTimelineEvents) ]);
      var $currentDot = $(R.head($(`#${id} .dot`).filter(function(index, dot){ return parseInt($(dot).attr('cx')) === Math.round(nextLocation) })))

      $currentDot.attr('r', 6);
      setTimeout(function(){ $currentDot.attr('r', 3); }, 1000);
    }

  });

  $(`#${id} .label-layer`).hide();
  $(`#${id} .link-layer`).hide();

  $(`#${id} .dot`).each(function(index, element){
    var dotLocation = element.cx.baseVal.value;
    var dotFill = element.style.fill;

    d3.select($(`#${id} .axis-layer`).get(0)).append("path")
        .attr("id", `${id}-dot-indicator`)
        .attr("d", `M${dotLocation - 1},-20V20H${dotLocation}V-20`)
        .attr("opacity", 0.5)
        .attr("fill", dotFill);

    //d3.select($(`#${id} .axis-layer`).get(0)).append("rect")
    //    .attr("id", `${id}-dot-indicator`)
    //    .attr("x", location)
    //    .attr("width", 1)
    //    .attr("height", 20)
    //    .attr("fill", "black");

    $(element).css('cursor', 'pointer');
  });

  $(document).on('createDot', function(event, newData){
    var currentTime = Math.round($(video).get(0).currentTime);
    var currentData = timeline.data();

    timeline.data(R.append(newData, currentData));
  });

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

      CONFIG.events.trigger('video::branching', [ element, VIDEOS, { branches: overlay['branches'], from: element, to: branch } ]);
      $(document).trigger('VIDR::swap', [ { old: element, new: branch } ]);
    };

    var afterBeginOverlay = function(projector, currentTime, dirtyTrigger){

      var showOverlay = function(){
        return true;
      };

      if(showOverlay()){
        overlay.setup({
          overlayId: 'overlay-' + id,
          element: element.id,
          clearOverlay: function(){ $('#overlay-' + id).html(''); },
          pause: function(){ $('#' + element.id).get(0).pause(); },
          play: function(){ $('#' + element.id).get(0).play(); },
          go: function(location){ $('#' + element.id).get(0).currentTime = location; $('#' + element.id).get(0).play(); },
          goTo: goTo // TODO: refactor to goToBranch
        });

        if(overlay.pause){ $('#' + element.id).get(0).pause(); }
      }

    };

    projector.addOverlay(
        Projector.HTMLBox({
          html: '<div class="overlay-wrapper" style="pointer-events: all;" >' + overlay.html + '</div>'
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
        overlay.setup({
          overlayId: 'overlay-' + id,
          element: element.id,
          clearOverlay: function(){ $('#overlay-' + id).html(''); },
          pause: function(){ $('#' + element.id).get(0).pause(); },
          play: function(){ $('#' + element.id).get(0).play(); },
          go: function(location){ $('#' + element.id).get(0).currentTime = location; $('#' + element.id).get(0).play(); }
        });

        if(overlay.pause){ $('#' + element.id).get(0).pause(); }
      }

    };

    projector.addOverlay(
        Projector.HTMLBox({
          html: '<div class="overlay-wrapper ' + R.propOr('', 'classes', overlay) + '" style="pointer-events: all;" ><div id="overlay-' + id + '">' + R.propOr('', 'markup', overlay) + '</div></div>'
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

  var mount = element['mount'];

  $(mount).html(buildHTML(element));

  $(document).on('click', '#' + element['id'], function(event){
    var $target = $(event.target);
    var mode = $target.attr('data-mode');
    var hasPoster = $target.attr('poster');

    if(mode === 'poster' && hasPoster){
      CONFIG.events.trigger('video::play', element);
    }

  });

  $(document).on('video::updateTime', function(event, time){
    $('#' + element.id).get(0).currentTime = time;
  });

  $('#' + element.id).on('loadeddata', function(event){

    var duration = $('#' + element.id).get(0).duration;

    $('#' + element.id).attr('data-duration', duration);

    if(element.timeline){ initTimeline(element) }

  });

  if(element.overlays){ initOverlays(element) }

  CONFIG.events.trigger('video::mounted', [ element, VIDEOS ]);

  CONFIG.events.trigger('video::lifecycle', [ element, 'mounted' ]);

  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events //
  ////////////////////////////////////////////////////////////////////////////

  $('#' + element.id).on('playing', function(event){
    // Sent when the media begins to play (either for the first time, after having been paused, after seeking or after ending and then restarting).
    $('#' + element.id).attr('data-mode', 'playing');
    CONFIG.events.trigger('video::lifecycle', [ element, 'playing']);
    CONFIG.events.trigger('video::playing', [ element, VIDEOS, true ]);
  });

  $('#' + element.id).on('play', function(event){
    // Sent when playback of the media starts after having been paused; that is, when playback is resumed after a prior pause event.
    $('#' + element.id).attr('data-mode', 'play');
    CONFIG.events.trigger('video::lifecycle', [ element, 'play' ]);
  });

  $('#' + element.id).on('seeked', function(event){
    // Sent when a seek operation completes.
    $('#' + element.id).attr('data-mode', 'seeked');
    CONFIG.events.trigger('video::lifecycle', [ element, 'seeked' ]);
  });

  $('#' + element.id).on('seeking', function(event){
    // Sent when a seek operation begins.
    $('#' + element.id).attr('data-mode', 'seeking');
    CONFIG.events.trigger('video::lifecycle', [ element, 'seeking' ]);
  });

  $('#' + element.id).on('pause', function(event){
    // Sent when playback is paused (manually or upon seeking).
    $('#' + element.id).attr('data-mode', 'pause');
    CONFIG.events.trigger('video::lifecycle', [ element, 'pause' ]);
    CONFIG.events.trigger('video::playing', [ element, VIDEOS, false ]);
  });

  $('#' + element.id).on('ended', function(event){
    // Sent when playback completes.
    $('#' + element.id).attr('data-mode', 'ended');
    CONFIG.events.trigger('video::lifecycle', [ element, 'ended' ]);
    CONFIG.events.trigger('video::playing', [ element, VIDEOS, false ]);
    CONFIG.events.trigger('video::ended', [ element, VIDEOS, element.autoProgress ]);
  });

  $('#' + element.id).on('timeupdate', function(event){
    // The time indicated by the element's currentTime attribute has changed.
    var currentTime = $('#' + element.id).get(0).currentTime;
    $(document).trigger('video::timeupdate', [ element, currentTime ]);
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
  var mountSelector = params['mount'];
  var videoId = params['video'];
  var video = R.compose(
      R.assoc('mount', mountSelector)
  )(VIDEOS[videoId]);

  VIDEOS[videoId] = video;

  if(video){
    $(document).trigger('VIDR::mount', [ video ]);
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

  $(document).on('VIDR::swap', function(event, videos){
    doUnmount(videos['old']);
    var mountedElement = doMount(videos['new']);
    CONFIG.events.trigger('video::play', [ mountedElement ]);
  });

  $(document).on('VIDR::mount', function(event, element){
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
};