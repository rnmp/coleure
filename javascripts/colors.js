(function() {

  define(['./goodies'], function(_) {
    return {
      _display: function(settings) {
        var color, colors, content, template, _i, _len, html;
        colors = settings.colors;
        template = settings.template;
        content = '';
        var sectionSize = 84;
        for (_i = 0, _len = colors.length; _i < _len; _i++) {
          color = colors[_i];
          color.mixed = "false";
          color.origin = "library";
          color.id = null;
          content += template(color);
        }
        if (_.id('colors') != null){
          return _.id('colors').innerHTML = content;
        };
      },
      load: function(sources) {
        var _this = this;
        _.async(this, '_display', 2);
        _.json(sources.colors, function(colors) {
          return _this._display({
            colors: colors
          });
        });

        return _.template(sources.template, function(template) {
          return _this._display({
            template: template
          });
        });
      }
    };
  });

}).call(this);
