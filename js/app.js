(function (d) {
    oo.define({
        "viewportSelector": "#viewport"
    });

    oo.createController('IndexController', {
        indexAction : function indexAction(params){
            var v = this.getViewport(), slide = (params.slide || 0), mainStage = v._stages.main.panels;

            if (!mainStage || slide > mainStage.length - 1) {
                oo.createPanelClass({
                    id: oo.generateId(),
                    init: function init () {
                        this.setTemplate(d.querySelector("#" + data[slide].tpl).text);
                        this.setData(data[slide].data);
                    }
                }, {stage: 'main'});
                mainStage = v._stages.main.panels;
            }
            v.switchPanel(mainStage[slide]);
        }
    });

    oo.bootstrap(function (oo) {
        var r = oo.getRouter(), baseUrl = 'index/index/slide/'; r.init();

        function getCurrentSlide() {
            return parseInt(d.location.hash.replace('#' + baseUrl, ''), 10) || 0;
        }
        function goNext() {
            r.load(baseUrl+ (getCurrentSlide() + 1));
        }
        function goPrevious() {
            r.load(baseUrl+ (getCurrentSlide() - 1));
        }

        oo.createElement('button', { el: '#next', onrelease: goNext });
        oo.createElement('button', { el: '#prev', onrelease: goPrevious });

        d.addEventListener('keyup', function (e) {
            if (e.keyCode == 37)
                goPrevious();
            else if (e.keyCode == 39)
                goNext();
        });
    });
})(document);