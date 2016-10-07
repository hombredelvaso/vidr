### use

#### FAQ

> How do I make the video start at a specific time?

- Use a [Media Fragments URI](http://stackoverflow.com/a/5984558) in the `init` `src`

### todo
- add currentTime etc into applicable mediaevents in `mount` functions
- add ability to add preplay image uri if you want to show image before it starts

- improve video options: streaming?, non download? Captions.
  - https://github.com/videojs/video.js/
  - https://www.google.com/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=vimeo%20html5%20player
  - https://vimeo.com/player
  - https://vimeo.com/blog/post/try-our-new-html5-player
  - https://github.com/Selz/plyr
  - https://www.google.com/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=vimeo%20translations%20in%20html%205%20player
  - http://tubularinsights.com/vimeo-html5-player/
  - https://techcrunch.com/2014/01/07/vimeo-new-video-player/

- BRANCHING: when going from video to video, pass volume and other settings to continue as they are...
- improve branching by adding loop: right now you can go DOWN the tree to terminal nodes like document, but you cannot loop back around [need to have all paths available to decision, and graph like structure to traverse]
  - also try to use this structure to create UI map of where youve been and where you can go...
- *assistance*: help overlay alongside choice (answer multiple choice or get hint text)
- *devil/angel*: before or after choice you can have video in video... mouse over 2 faces for two differetn advisories, or mouse over heads of board memebers and see what they were thinking
- *state*: if you make someone go below threshold of like, they will answer differently... state matters at certain branches (story-graph)