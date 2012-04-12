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
            'statement': 'In charge of the frontdev team'
        },{
            'statement': 'Contact me : <a href="mailto:md@octaveoctave.com">md@octaveoctave.com</a> | <a href="http://twitter.com/freakdev">@freakdev</a>'
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
        "statement": "Industrial quality<br><span class=\"bold\">applications<span>"
    }
},{
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
        'intro': 'YellowJs is a',
        'statement': 'Highly <span class="bold">customizable</span> <br><span class="bold">mobile</span> framework'
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
            'statement': 'The "new" keyword is "banned" in the <span class="bold">"daily API"</span><br /><img class="content-pic" src="assets/code/create-button.png">'
        },{
            'statement': 'Underlying class structure is clean and <span class="bold">extendable<span><br /><img class="content-pic" src="assets/code/ajax-provider.png">'
        },{
            'statement': '<span class="bold">Event Model</span> / MVC / Mixins ensure <span class="bold">flexibility</span> and are known by everyone'
        },{
            'statement': 'YellowJs is good for quick developments but also for complex applications'
        }]
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
},{
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
},{
    "tpl": "tpl-statement-big-pic",
    "data": {
        'intro': 'LVMH MAG - Groupe LVMH',
        'statement': '',
        'picSrc': 'assets/lvmh.png'
    }
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'YellowJs is...',
        'bullets':[{
            'statement': 'not for developping games :('
        },{
            'statement': 'still missing some features yet, and still in beta'
        },{
            'statement': 'inspiration to move beyond the actual limit (we hope so)'
        }]
    }
},{
    "tpl": "tpl-list",
    "data": {
        'title': 'How? Where? When?',
        'bullets':[{
            'statement': 'YellowJs is published under the <span class="bold">New BSD</span> License and is supported by Octave & Octave team'
        },{
            'statement': 'You can get it from github : <a href="https://github.com/YellowJs/yellowjs-framework">https://github.com/YellowJs/yellowjs-framework</a>'
        },{
            'statement': 'Still in beta mainly because it still lacks some funny features that i wanted to integrate<br />but in fact, already ready for production'
        }]
    }
},{
    "tpl": "tpl-statement",
    "data": {
        'intro': 'Thank you for listening',
        'statement': 'Questions?'
    }
}];