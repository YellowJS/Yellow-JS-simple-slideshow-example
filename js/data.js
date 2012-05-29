var data = [{
    "tpl": "tpl-title",
    "data": {"title": "Hello <img src=\"assets/logo.png\">"}
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'Who am I ?',
        'bullets':[{
            'statement': 'Work at Octave & Octave (<a href="http://octaveoctave.com">http://octaveoctave.com</a>)'
        },{
            'statement': 'In charge of the frontdev / mobile dev team'
        },{
            'statement': 'Contact me : <a href="mailto:md@octaveoctave.com">md@octaveoctave.com</a> | <a href="http://twitter.com/freakdev">@freakdev</a>'
        }]
    }
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'A (bit more than a) year ago at ParisJS #5,',
        'bullets':[{
            'statement': 'feedback about Sencha Touch (1.0)'
        },{
            'statement': 'full-stack framework are hard to customize'
        },{
            'statement': 'several micro libraries can lead to insconsistency'
        }]
    }
},{
    "tpl": "tpl-statement",
    "data": {
        "intro": "WE WANT",
        "statement": "100% custom <br><span class=\"bold\">mobile design<span>"
    }
},{
    "tpl": "tpl-statement",
    "data": {
        "intro": "WE WANT",
        "statement": "<span class=\"bold\">Reusable</span> code<br />and easily <span class=\"bold\">maintainable</span> apps"
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'YellowJS is a',
        'statement': 'Highly <span class="bold">customizable</span> <br><span class="bold">mobile</span> framework'
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': '',
        'statement': 'Let‘s write some code'
    }
},/*{
    "tpl": "tpl-statement",
    "data": {
        "intro": "WE WANT",
        "statement": "to <span class=\"bold\">code less</span><br/> but support <br/><span class=\"bold\">several devices</span>"
    }
},{
    "tpl": "tpl-statement-pic",
    "data": {
        'intro': 'Design should be',
        'statement': 'Responsive',
        'picSrc': 'assets/family-pic.png'
    }
},{
    "tpl": "tpl-statement-pic",
    "data": {
        'intro': 'Technology should be',
        'statement': 'Open Source',
        'picSrc': 'assets/open-source.png'
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'Custom design is offered by',
        'statement': 'Templating',
        'picSrc': ''
    }
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'Custom design...',
        'bullets':[{
            'statement': 'requires a custom markup'
        },{
            'statement': 'can hardly be generated fully automatically'
        },{
            'statement': 'with <span class="bold">templating</span>, concerns are properly separated'
        }]
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'strongs concepts',
        'statement': 'Easily handleable',
        'picSrc': ''
    }
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'How we simplify robust concept?',
        'bullets':[{
            'statement': 'Mainly works with configuration objects'
        },{
            'statement': 'Underlying class structure is clean and <span class="bold">extendable<span><br /><img class="content-pic" src="assets/code/ajax-provider.png">'
        },{
            'statement': '<span class="bold">Event Model</span> / MVC / Mixins ensure <span class="bold">flexibility</span> and are known by everyone'
        }/ *,{
            'statement': 'YellowJS is good for quick developments but also for complex applications'
        }* /]
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'many "micro libraries" are well coded ;)',
        'statement': 'Why don\'t use some',
        'picSrc': ''
    }
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'Which library, why, what for?',
        'bullets':[{
            'statement': 'We choose <span class="bold">elegent libraries</span>, according to us'
        },{
            'statement': 'Lawnchair / Mustache / my.Class ...'
        },{
            'statement': 'But you can easily implement the ones <span class="bold">you</span> have chosen<br /><img class="content-pic" src="assets/code/create-model.png">'
        }]
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'What we can do',
        'statement': 'What we have done'
    }
},{
    //"tpl": "tpl-statement-big-pic",
    "tpl": "tpl-list-pic-left",
    "data": {
        'intro': 'This slideshow "engine"',
        'bullets': [{
            'statement': 'Cross platform (smartphone, tablet, computers)'
        },{
            'statement': 'Use url hash to ensure deep linking'
        },{
            'statement': 'Only 50 lines of code'
        },{
            'statement': 'Sources available on <a href="https://github.com/YellowJS/Yellow-JS-simple-slideshow-example">GitHub</a>'
        }],
        'picSrc': 'assets/yellowjs-prez.png'
    }
},{
    // "tpl": "tpl-statement-big-pic",
    "tpl": "tpl-list-pic-left",
    "data": {
        'intro': 'Memento App - Ministère de la culture',
        'bullets': [{
            'statement': 'Cross device (iOS / Android)'
        },{
            'statement': 'App build with PhoneGap'
        },{
            'statement': 'Let the user consult articles offline (for those marked as "favorite")'
        }],
        'picSrc': 'assets/memento-app.png'
    }
},*/{
    // "tpl": "tpl-statement-big-pic",
    "tpl": "tpl-list-pic-left",
    "data": {
        'intro': 'RA Altarea Cogedim - LIGARIS',
        'bullets': [{
            'statement': 'Build with PhoneGap'
        },{
            'statement': 'Custom design'
        },{
            'statement': 'Modern navigation paradigm'
        }],
        'picSrc': 'assets/altarea.png'
    }
},/*{
    "tpl": "tpl-statement-big-pic",
    "data": {
        'intro': 'LVMH MAG - Groupe LVMH',
        'statement': '',
        'picSrc': 'assets/lvmh.png'
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'YellowJS is...',
        'statement': '<span style="font-size: .6em;">inspiration to move <span style="font-weight: bold;">beyond</span> the <span style="font-weight: bold;">actual limit</span> <span style="font-size: 0.5em;">(we hope so)</span></span>'
    }
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'YellowJS is...',
        'bullets':[{
            'statement': 'not for developping games :('
        },{
            'statement': 'still missing some features yet, and still in beta'
        },{
            'statement': 'inspiration to move beyond the actual limit (we hope so)'
        }]
    }
},*/{
    "tpl": "tpl-list",
    "data": {
        'title': 'How? Where? When?',
        'bullets':[{
            'statement': 'YellowJS is published under the <span class="bold">New BSD</span> License and is supported by Octave & Octave team'
        },{
            'statement': 'You can get it from github : <a href="https://github.com/YellowJs/yellowjs-framework">https://github.com/YellowJs/yellowjs-framework</a>'
        },{
            'statement': 'Still in beta mainly because it still lacks some funny features that i wanted to integrate<br />but in fact, already ready for production'
        }]
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'Thanks for listening',
        'statement': 'Questions ?'
    }
}];