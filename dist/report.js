require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var payloadSize, problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
          console.log(_this.models[0].get('payloadSizeBytes'));
          payloadSize = Math.round(((_this.models[0].get('payloadSizeBytes') || 0) / 1024) * 100) / 100;
          console.log("FeatureSet sent to GP weighed in at " + payloadSize + "kb");
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"a21iR2":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      this.render();
      return this.$('[data-attribute-type=UrlField] .value, [data-attribute-type=UploadField] .value').each(function() {
        var html, name, text, url, _i, _len, _ref3;
        text = $(this).text();
        html = [];
        _ref3 = text.split(',');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          url = _ref3[_i];
          if (url.length) {
            name = _.last(url.split('/'));
            html.push("<a target=\"_blank\" href=\"" + url + "\">" + name + "</a>");
          }
        }
        return $(this).html(html.join(', '));
      });
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var _this = this;
    if (this.maxEta) {
      _.delay(function() {
        return _this.reportResults.poll();
      }, (this.maxEta + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (_this.maxEta + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('etaSeconds')) {
        if (!maxEta || job.get('etaSeconds') > maxEta) {
          maxEta = job.get('etaSeconds');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"CNqB+b","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"+VosKh","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('a21iR2');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('+VosKh');
},{}],"+VosKh":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"CNqB+b":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,123,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("doNotExport",c,p,1),c,p,1,0,0,"")){_.b(_.rp("attributes/attributeItem",c,p,"    "));};});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}],"api/templates":[function(require,module,exports){
module.exports=require('CNqB+b');
},{}],11:[function(require,module,exports){
var AdaptationTab, BaseReportTab, key, partials, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseReportTab = require('baseReportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

AdaptationTab = (function(_super) {
  __extends(AdaptationTab, _super);

  function AdaptationTab() {
    _ref = AdaptationTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  AdaptationTab.prototype.name = 'Adaptation';

  AdaptationTab.prototype.className = 'adaptation';

  AdaptationTab.prototype.timeout = 120000;

  AdaptationTab.prototype.template = templates.adaptation;

  AdaptationTab.prototype.dependencies = ['Habitat', 'Population'];

  AdaptationTab.prototype.render = function() {
    var attributes, context, d3IsPresent, habitat_data, has_coral, has_mangroves, has_no_habitats, has_seagrass, isCollection, numpeople, percpeople;
    habitat_data = this.recordSet('Habitat', 'HabitatPresence').toArray();
    if ((habitat_data != null ? habitat_data.length : void 0) > 0) {
      has_coral = this.recordSet('Habitat', 'HabitatPresence').bool('Coral');
      has_seagrass = this.recordSet('Habitat', 'HabitatPresence').bool('Seagrass');
      has_mangroves = this.recordSet('Habitat', 'HabitatPresence').bool('Mangrove');
    } else {
      has_coral = false;
      has_seagrass = false;
      has_mangroves = false;
    }
    has_no_habitats = !has_coral && !has_seagrass && !has_mangroves;
    isCollection = this.model.isCollection();
    numpeople = this.recordSet('Population', 'Population').float('Population');
    numpeople = this.addCommas(numpeople);
    percpeople = this.recordSet('Population', 'Population').float('PERC_POP');
    if (window.d3) {
      d3IsPresent = true;
    } else {
      d3IsPresent = false;
    }
    attributes = this.model.getAttributes();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      has_coral: has_coral,
      has_mangroves: has_mangroves,
      has_seagrass: has_seagrass,
      has_no_habitats: has_no_habitats,
      numpeople: numpeople,
      percpeople: percpeople
    };
    this.$el.html(this.template.render(context, partials));
    return this.enableLayerTogglers();
  };

  return AdaptationTab;

})(BaseReportTab);

module.exports = AdaptationTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":17,"baseReportTab":"h83kb+"}],"baseReportTab":[function(require,module,exports){
module.exports=require('h83kb+');
},{}],"h83kb+":[function(require,module,exports){
var BaseReportTab, ReportTab, key, partials, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

BaseReportTab = (function(_super) {
  __extends(BaseReportTab, _super);

  function BaseReportTab() {
    this.onMoreResultsClick = __bind(this.onMoreResultsClick, this);
    this.addCommas = __bind(this.addCommas, this);
    this.processMiningData = __bind(this.processMiningData, this);
    this.getAvgDistSeamounts = __bind(this.getAvgDistSeamounts, this);
    this.getAvgDepthSeamounts = __bind(this.getAvgDepthSeamounts, this);
    this.getNumSeamounts = __bind(this.getNumSeamounts, this);
    this.firePagination = __bind(this.firePagination, this);
    this.setNewSortDir = __bind(this.setNewSortDir, this);
    this.getSelectedColumn = __bind(this.getSelectedColumn, this);
    this.getSortDir = __bind(this.getSortDir, this);
    this.setSortingColor = __bind(this.setSortingColor, this);
    this.getTableRow = __bind(this.getTableRow, this);
    this.renderSort = __bind(this.renderSort, this);
    this.setupTableSorting = __bind(this.setupTableSorting, this);
    _ref = BaseReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  BaseReportTab.prototype.name = 'BaseReport';

  BaseReportTab.prototype.className = 'basereport';

  BaseReportTab.prototype.timeout = 120000;

  BaseReportTab.prototype.events = {
    "click a.details": 'onMoreResultsClick'
  };

  BaseReportTab.prototype.setupTableSorting = function(data, tbodyName, tableName, data_value, col_values, row_name, selected_col_prefix) {
    var data_cols, default_row_data, default_sort_data, default_sort_key, index, k, v, _i, _len,
      _this = this;
    index = 0;
    default_sort_key = "";
    default_sort_data = "";
    default_row_data = "";
    data_cols = (function() {
      var _results;
      _results = [];
      for (k in col_values) {
        v = col_values[k];
        _results.push(v);
      }
      return _results;
    })();
    for (v = _i = 0, _len = col_values.length; _i < _len; v = ++_i) {
      k = col_values[v];
      this.$('.' + k).click(function(event) {
        return _this.renderSort(k, tableName, data_value, event, v, tbodyName, index > 0, _this.getTableRow, row_name, data_cols, selected_col_prefix);
      });
      if (index === 0) {
        default_sort_key = k;
        default_sort_data = data_value;
        default_row_data = this.getTableRow;
      }
      index += 1;
    }
    return this.renderSort(default_sort_key, tableName, default_sort_data, void 0, default_sort_data, tbodyName, false, default_row_data, row_name, data_cols, selected_col_prefix);
  };

  BaseReportTab.prototype.renderSort = function(name, tableName, pdata, event, sortBy, tbodyName, isFloat, getRowStringValue, row_name, data_cols, selected_col_prefix) {
    var cells, data, el, hab_body, rows, sortUp, targetColumn;
    if (event) {
      event.preventDefault();
    }
    if (window.d3) {
      targetColumn = this.getSelectedColumn(event, name, selected_col_prefix);
      sortUp = this.getSortDir(targetColumn);
      if (isFloat) {
        data = _.sortBy(pdata, function(row) {
          return parseFloat(row[sortBy]);
        });
      } else {
        data = _.sortBy(pdata, function(row) {
          return row[sortBy];
        });
      }
      if (sortUp) {
        data.reverse();
      }
      el = this.$(tbodyName)[0];
      hab_body = d3.select(el);
      hab_body.selectAll("tr." + row_name).remove();
      rows = hab_body.selectAll("tr").data(data).enter().insert("tr", ":first-child").attr("class", row_name);
      cells = rows.selectAll("td").data(function(row, i) {
        return data_cols.map(function(column) {
          return {
            column: column,
            value: row[column]
          };
        });
      }).enter().append("td").text(function(d, i) {
        return d.value;
      });
      this.setNewSortDir(targetColumn, sortUp);
      this.setSortingColor(event, tableName);
      this.firePagination(tableName);
      if (event) {
        return event.stopPropagation();
      }
    }
  };

  BaseReportTab.prototype.getTableRow = function(d, data_cols) {
    return "<td>" + d[data_cols[0]] + "</td>" + "<td>" + d[data_cols[1]] + "</td>" + "<td>" + d[data_cols[2]] + "</td>";
  };

  BaseReportTab.prototype.setSortingColor = function(event, tableName) {
    var headerName, newTargetName, oldTargetName, parent, sortingClass, targetStr;
    sortingClass = "sorting_col";
    if (event) {
      parent = $(event.currentTarget).parent();
      newTargetName = event.currentTarget.className;
      targetStr = tableName + " th.sorting_col a";
      if (this.$(targetStr) && this.$(targetStr)[0]) {
        oldTargetName = this.$(targetStr)[0].className;
        if (newTargetName !== oldTargetName) {
          headerName = tableName + " th.sorting_col";
          this.$(headerName).removeClass(sortingClass);
          return parent.addClass(sortingClass);
        }
      }
    }
  };

  BaseReportTab.prototype.getSortDir = function(targetColumn) {
    var sortup;
    sortup = this.$('.' + targetColumn).hasClass("sort_up");
    return sortup;
  };

  BaseReportTab.prototype.getSelectedColumn = function(event, name, prefix_str) {
    var multiClasses, targetColumn, tgtClassName;
    if (event) {
      targetColumn = event.currentTarget.className;
      multiClasses = targetColumn.split(' ');
      tgtClassName = _.find(multiClasses, function(classname) {
        return classname.lastIndexOf(prefix_str, 0) === 0;
      });
      targetColumn = tgtClassName;
    } else {
      targetColumn = name;
    }
    return targetColumn;
  };

  BaseReportTab.prototype.setNewSortDir = function(targetColumn, sortUp) {
    if (sortUp) {
      this.$('.' + targetColumn).removeClass('sort_up');
      return this.$('.' + targetColumn).addClass('sort_down');
    } else {
      this.$('.' + targetColumn).addClass('sort_up');
      return this.$('.' + targetColumn).removeClass('sort_down');
    }
  };

  BaseReportTab.prototype.firePagination = function(tableName) {
    var active_page, el, tgt_table;
    el = this.$(tableName)[0];
    tgt_table = d3.select(el);
    active_page = tgt_table.selectAll(".active a");
    if (active_page && active_page[0] && active_page[0][0]) {
      return active_page[0][0].click();
    }
  };

  BaseReportTab.prototype.getNumSeamounts = function(seamounts) {
    var sm, _i, _len;
    for (_i = 0, _len = seamounts.length; _i < _len; _i++) {
      sm = seamounts[_i];
      return sm.NUMBER;
    }
    return 0;
  };

  BaseReportTab.prototype.getAvgDepthSeamounts = function(seamounts) {
    var sm, _i, _len;
    for (_i = 0, _len = seamounts.length; _i < _len; _i++) {
      sm = seamounts[_i];
      return Math.round(sm.AVG_DEPTH);
    }
  };

  BaseReportTab.prototype.getAvgDistSeamounts = function(seamounts) {
    var sm, _i, _len;
    for (_i = 0, _len = seamounts.length; _i < _len; _i++) {
      sm = seamounts[_i];
      return sm.CONN_DIST;
    }
  };

  BaseReportTab.prototype.processMiningData = function(mining_data) {
    var md, name, new_mining_data, perc, size, _i, _len;
    new_mining_data = [];
    for (_i = 0, _len = mining_data.length; _i < _len; _i++) {
      md = mining_data[_i];
      name = md.TYPE;
      size = this.addCommas(md.SIZE_SQKM);
      perc = md.PERC_TOT;
      if (perc < 0.1) {
        perc = "< 0.1";
      }
      new_mining_data.push({
        TYPE: name,
        SIZE_SQKM: size,
        PERC_TOT: perc
      });
    }
    return new_mining_data;
  };

  BaseReportTab.prototype.addCommas = function(num_str) {
    var rgx, x, x1, x2;
    num_str += '';
    x = num_str.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  };

  BaseReportTab.prototype.onMoreResultsClick = function(e) {
    var selclass, selected, target_link;
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    target_link = $(e.target);
    selected = target_link.next();
    selclass = selected.attr("class");
    if (selclass === "hidden") {
      selected.removeClass('hidden');
      selected.addClass('shown');
      return target_link.text("hide details");
    } else {
      selected.removeClass('shown');
      selected.addClass('hidden');
      return target_link.text("show details");
    }
  };

  return BaseReportTab;

})(ReportTab);

module.exports = BaseReportTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":17,"reportTab":"a21iR2"}],14:[function(require,module,exports){
var BaseReportTab, BiodiversityTab, key, partials, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseReportTab = require('baseReportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

BiodiversityTab = (function(_super) {
  __extends(BiodiversityTab, _super);

  function BiodiversityTab() {
    _ref = BiodiversityTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  BiodiversityTab.prototype.name = 'Biodiversity';

  BiodiversityTab.prototype.className = 'biodiversity';

  BiodiversityTab.prototype.timeout = 120000;

  BiodiversityTab.prototype.template = templates.biodiversity;

  BiodiversityTab.prototype.dependencies = [];

  BiodiversityTab.prototype.render = function() {
    var attributes, context, d3IsPresent, isCollection;
    isCollection = this.model.isCollection();
    if (window.d3) {
      d3IsPresent = true;
    } else {
      d3IsPresent = false;
    }
    attributes = this.model.getAttributes();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection
    };
    this.$el.html(this.template.render(context, partials));
    return this.enableLayerTogglers();
  };

  return BiodiversityTab;

})(BaseReportTab);

module.exports = BiodiversityTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":17,"baseReportTab":"h83kb+"}],15:[function(require,module,exports){
var BaseReportTab, EconomyTab, key, partials, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseReportTab = require('baseReportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

EconomyTab = (function(_super) {
  __extends(EconomyTab, _super);

  function EconomyTab() {
    _ref = EconomyTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EconomyTab.prototype.name = 'Sustainable Economy';

  EconomyTab.prototype.className = 'economy';

  EconomyTab.prototype.timeout = 120000;

  EconomyTab.prototype.template = templates.economy;

  EconomyTab.prototype.dependencies = ['CoastalCatch', 'Size', 'DeepSea', 'Fisheries', 'PacioceaAquaculture', 'Tourism', 'Energy'];

  EconomyTab.prototype.render = function() {
    var aqua, attributes, avg_comm_catch, avg_depth_seamounts, avg_dist_seamounts, avg_fisheries_aqua_catch, avg_fisheries_coastal_catch, avg_fisheries_domestic_catch, avg_fisheries_foreign_catch, avg_fuel_import, avg_ocean_catch, avg_renewable_energy, avg_sub_catch, coastal_catch, col_values, commercial_catch, context, export_value, fisheries, fuel_import, gdp_percent, gdp_value, has_comm_catch, has_fuel_import, has_ocean_catch, has_renewable_energy, has_seamounts, has_subsistence_catch, intl_tourist_arrival_perc, intl_tourist_arrival_total, isCollection, mining, msg, new_size, num_seamounts, ocean_catch, renewable_energy, seamounts, size, subsistence_catch, tot_comm_catch, tot_fisheries_aqua_catch, tot_fisheries_coastal_catch, tot_fisheries_domestic_catch, tot_fisheries_foreign_catch, tot_ocean_catch, tot_sub_catch, tourist_arrivals, tourist_pop;
    msg = this.recordSet("CoastalCatch", "ResultMsg");
    coastal_catch = this.recordSet("CoastalCatch", "CoastalCatchTable").toArray();
    commercial_catch = this.recordSet("CoastalCatch", "CommercialTable").toArray();
    subsistence_catch = this.recordSet("CoastalCatch", "SubsistenceTable").toArray();
    ocean_catch = this.recordSet("CoastalCatch", "OceanTable").toArray();
    renewable_energy = this.recordSet("Energy", "RenewableEnergy").toArray();
    if ((renewable_energy != null ? renewable_energy.length : void 0) > 0) {
      has_renewable_energy = true;
      avg_renewable_energy = renewable_energy[0].AVG;
    } else {
      has_renewable_energy = false;
    }
    fuel_import = this.recordSet("Energy", "FuelImport").toArray();
    if ((fuel_import != null ? fuel_import.length : void 0) > 0) {
      has_fuel_import = true;
      avg_fuel_import = fuel_import[0].AVG;
    } else {
      has(fuel_import = false);
    }
    if (commercial_catch && (commercial_catch != null ? commercial_catch.length : void 0) > 0) {
      avg_comm_catch = this.recordSet("CoastalCatch", "CommercialTable").float('AVG_KG_CAP')[0];
      tot_comm_catch = this.recordSet("CoastalCatch", "CommercialTable").float('TOT_KG_CAP')[0];
      has_comm_catch = true;
    } else {
      has_comm_catch = false;
    }
    if (subsistence_catch && (subsistence_catch != null ? subsistence_catch.length : void 0) > 0) {
      avg_sub_catch = this.recordSet("CoastalCatch", "SubsistenceTable").float('AVG_KG_CAP')[0];
      tot_sub_catch = this.recordSet("CoastalCatch", "SubsistenceTable").float('TOT_KG_CAP')[0];
      has_subsistence_catch = true;
    } else {
      has_subsistence_catch = false;
    }
    if (ocean_catch && (ocean_catch != null ? ocean_catch.length : void 0) > 0) {
      avg_ocean_catch = this.recordSet("CoastalCatch", "OceanTable").float('SK_AVG')[0];
      tot_ocean_catch = this.recordSet("CoastalCatch", "OceanTable").float('RGN_TOT')[0];
      tot_ocean_catch = this.addCommas(tot_ocean_catch);
      has_ocean_catch = true;
    } else {
      has_ocean_catch = false;
    }
    fisheries = this.recordSet("Fisheries", "FisheriesTable").toArray();
    aqua = this.recordSet("PacioceaAquaculture", "aq").toArray();
    avg_fisheries_coastal_catch = this.recordSet("Fisheries", "FisheriesTable").float('CST_AVG');
    if ((avg_fisheries_coastal_catch != null ? avg_fisheries_coastal_catch.length : void 0) > 1) {
      avg_fisheries_coastal_catch = avg_fisheries_coastal_catch[0];
    }
    tot_fisheries_coastal_catch = this.recordSet("Fisheries", "FisheriesTable").float('CST_TOT');
    if ((tot_fisheries_coastal_catch != null ? tot_fisheries_coastal_catch.length : void 0) > 1) {
      tot_fisheries_coastal_catch = tot_fisheries_coastal_catch[0];
    }
    avg_fisheries_aqua_catch = this.recordSet("Fisheries", "FisheriesTable").float('AQUA_AVG');
    if ((avg_fisheries_aqua_catch != null ? avg_fisheries_aqua_catch.length : void 0) > 1) {
      avg_fisheries_aqua_catch = avg_fisheries_aqua_catch[0];
    }
    tot_fisheries_aqua_catch = this.recordSet("Fisheries", "FisheriesTable").float('AQUA_TOT');
    if ((tot_fisheries_aqua_catch != null ? tot_fisheries_aqua_catch.length : void 0) > 1) {
      tot_fisheries_aqua_catch = tot_fisheries_aqua_catch[0];
    }
    avg_fisheries_domestic_catch = this.recordSet("Fisheries", "FisheriesTable").float('DOM_AVG');
    if ((avg_fisheries_domestic_catch != null ? avg_fisheries_domestic_catch.length : void 0) > 1) {
      avg_fisheries_domestic_catch = avg_fisheries_domestic_catch[0];
    }
    tot_fisheries_domestic_catch = this.recordSet("Fisheries", "FisheriesTable").float('DOM_TOT');
    if ((tot_fisheries_domestic_catch != null ? tot_fisheries_domestic_catch.length : void 0) > 1) {
      tot_fisheries_domestic_catch = tot_fisheries_domestic_catch[0];
    }
    avg_fisheries_foreign_catch = this.recordSet("Fisheries", "FisheriesTable").float('FRN_AVG');
    if ((avg_fisheries_foreign_catch != null ? avg_fisheries_foreign_catch.length : void 0) > 1) {
      avg_fisheries_foreign_catch = avg_fisheries_foreign_catch[0];
    }
    tot_fisheries_foreign_catch = this.recordSet("Fisheries", "FisheriesTable").float('FRN_TOT');
    if ((tot_fisheries_foreign_catch != null ? tot_fisheries_foreign_catch.length : void 0) > 1) {
      tot_fisheries_foreign_catch = tot_fisheries_foreign_catch[0];
    }
    gdp_value = this.recordSet("Fisheries", "GDPTable").toArray();
    export_value = this.recordSet("Fisheries", "ExportTable").toArray();
    size = this.recordSet('Size', 'Size').float('SIZE_IN_KM');
    new_size = this.addCommas(size);
    mining = this.recordSet('DeepSea', 'Mining').toArray();
    mining = this.processMiningData(mining);
    seamounts = this.recordSet('DeepSea', 'Seamounts').toArray();
    tourist_arrivals = this.recordSet('Tourism', 'TouristArrivals').toArray();
    tourist_pop = this.recordSet('Tourism', 'TouristPopulation').toArray();
    gdp_percent = this.recordSet('Tourism', 'GDPPercent').float('GDP');
    if (gdp_percent > 0.1) {
      gdp_percent = gdp_percent.toFixed(1);
    }
    intl_tourist_arrival_total = this.recordSet('Tourism', 'InternationalArrivals').float('Arrivals');
    intl_tourist_arrival_perc = this.recordSet('Tourism', 'InternationalArrivals').float('IA_PERC');
    if (intl_tourist_arrival_perc > 0.1) {
      intl_tourist_arrival_perc = intl_tourist_arrival_perc.toFixed(1);
    }
    num_seamounts = this.getNumSeamounts(seamounts);
    has_seamounts = num_seamounts > 1;
    avg_depth_seamounts = this.getAvgDepthSeamounts(seamounts);
    avg_depth_seamounts = this.addCommas(avg_depth_seamounts);
    avg_dist_seamounts = this.getAvgDistSeamounts(seamounts);
    avg_dist_seamounts = this.addCommas(Math.round(avg_dist_seamounts));
    isCollection = this.model.isCollection();
    attributes = this.model.getAttributes();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      size: new_size,
      has_seamounts: has_seamounts,
      num_seamounts: num_seamounts,
      avg_depth_seamounts: avg_depth_seamounts,
      avg_dist_seamounts: avg_dist_seamounts,
      coastal_catch: coastal_catch,
      isCollection: isCollection,
      mining: mining,
      commercial_catch: commercial_catch,
      has_comm_catch: has_comm_catch,
      avg_comm_catch: avg_comm_catch,
      tot_comm_catch: tot_comm_catch,
      subsistence_catch: subsistence_catch,
      has_subsistence_catch: has_subsistence_catch,
      avg_sub_catch: avg_sub_catch,
      tot_sub_catch: tot_sub_catch,
      has_ocean_catch: has_ocean_catch,
      ocean_catch: ocean_catch,
      avg_ocean_catch: avg_ocean_catch,
      tot_ocean_catch: tot_ocean_catch,
      fisheries: fisheries,
      avg_fisheries_coastal_catch: avg_fisheries_coastal_catch,
      tot_fisheries_coastal_catch: tot_fisheries_coastal_catch,
      avg_fisheries_aqua_catch: avg_fisheries_aqua_catch,
      tot_fisheries_aqua_catch: tot_fisheries_aqua_catch,
      avg_fisheries_domestic_catch: avg_fisheries_domestic_catch,
      tot_fisheries_domestic_catch: tot_fisheries_domestic_catch,
      avg_fisheries_foreign_catch: avg_fisheries_foreign_catch,
      tot_fisheries_foreign_catch: tot_fisheries_foreign_catch,
      export_value: export_value,
      gdp_value: gdp_value,
      aqua: aqua,
      tourist_arrivals: tourist_arrivals,
      tourist_pop: tourist_pop,
      renewable_energy: renewable_energy,
      avg_renewable_energy: avg_renewable_energy,
      has_renewable_energy: has_renewable_energy,
      fuel_import: fuel_import,
      avg_fuel_import: avg_fuel_import,
      has_fuel_import: has_fuel_import,
      gdp_percent: gdp_percent,
      intl_tourist_arrival_total: intl_tourist_arrival_total,
      intl_tourist_arrival_perc: intl_tourist_arrival_perc
    };
    this.$el.html(this.template.render(context, partials));
    col_values = {
      'catch_country': "COUNTRY",
      'catch_in_eez': "TOT_TONS",
      'catch_perc': "PERC_TOT"
    };
    this.setupTableSorting(coastal_catch, '.coastal_catch_values', '.coastal_catch_table', col_values, 'coastal-catch-row', 'catch');
    return this.enableLayerTogglers();
  };

  return EconomyTab;

})(BaseReportTab);

module.exports = EconomyTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":17,"baseReportTab":"h83kb+"}],16:[function(require,module,exports){
var AdaptationTab, BiodiversityTab, EconomyTab;

EconomyTab = require('./economy.coffee');

AdaptationTab = require('./adaptation.coffee');

BiodiversityTab = require('./biodiversity.coffee');

window.app.registerReport(function(report) {
  report.tabs([EconomyTab, AdaptationTab, BiodiversityTab]);
  return report.stylesheets(['./report.css']);
});


},{"./adaptation.coffee":11,"./biodiversity.coffee":14,"./economy.coffee":15}],17:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["adaptation"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Habitats</h4>");_.b("\n" + i);if(_.s(_.f("has_coral",c,p,1),c,p,0,360,604,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large green-check\">The area of interest includes <strong>coral reefs</strong>.</p>");_.b("\n" + i);_.b("    <div style=\"margin-left:50px;\"><a href=\"#\" data-toggle-node=\"5450960a4eb580f13c02c8fd\" data-visible=\"false\">show coral reef layer</a></div>");_.b("\n");});c.pop();}if(_.s(_.f("has_seagrass",c,p,1),c,p,0,638,877,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large green-check\">The area of interest includes <strong>seagrass</strong>.</p>");_.b("\n" + i);_.b("    <div style=\"margin-left:50px;\"><a href=\"#\" data-toggle-node=\"5450960a4eb580f13c02c8fb\" data-visible=\"false\">show seagrass layer</a></div>");_.b("\n");});c.pop();}if(_.s(_.f("has_mangroves",c,p,1),c,p,0,915,1155,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large green-check\">The area of interest includes <strong>mangroves</strong>.</p>");_.b("\n" + i);_.b("    <div style=\"margin-left:50px;\"><a href=\"#\" data-toggle-node=\"5450960a4eb580f13c02c8f9\" data-visible=\"false\">show mangrove layer</a></div>");_.b("\n");});c.pop();}if(_.s(_.f("has_no_habitats",c,p,1),c,p,0,1196,1323,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">There are no <strong>mangroves, seagrass, or coral habitats</strong> within the area of interest.</p> ");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Population</h4>");_.b("\n" + i);_.b("  <p class=\"large\">The total population of the countries within the sketch is <strong>");_.b(_.v(_.f("numpeople",c,p,0)));_.b("</strong>, which is <strong>");_.b(_.v(_.f("percpeople",c,p,0)));_.b("%</strong> of the population within the PACIOCEA region.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["biodiversity"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Biodiversity</h4>");_.b("\n" + i);_.b("  <p>TBD</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["economy"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This ");if(_.s(_.f("isCollection",c,p,1),c,p,0,392,402,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Deep Sea </h4>");_.b("\n" + i);_.b("  <div class=\"in-report-header\">Deep Sea Minerals: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d3\" data-visible=\"false\">show mineral layers");_.b("\n" + i);_.b("  </a></div>");_.b("\n" + i);_.b("  <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:170px;\">Type</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</a></th>");_.b("\n" + i);_.b("        <th>Area (% of total region)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);if(_.s(_.f("mining",c,p,1),c,p,0,943,1060,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SIZE_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </thead>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The deep sea resources available for extraction are divided into 4 types:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Polymetallic Nodules (Manganese, Copper, Nickel, Cobalt) - 4,000 - 6,000 m depth</li>");_.b("\n" + i);_.b("        <li>Cobalt-rich Manganese Crusts (Cobalt) - 800 - 3,000 m depth</li>");_.b("\n" + i);_.b("        <li>Sulphide Deposits (Copper) - 1,500 - 4,000 m depth</li>");_.b("\n" + i);_.b("        <li>Deep-sea mud (rare earth elements, yttrium) - 2,000 -6,000 m depth.</li>                                               ");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("          The DSM deposits are higher in mineral content than on-land deposits. Typical value of a tonne of land based ore is 50-200 USD, for sea floor deposits it’s 500-1500 USD. DSM mining in the PACIOCEA  has a strong potential.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"in-report-header\">Habitats in Seamounts: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d6\" data-visible=\"false\">show seamount layer");_.b("\n" + i);_.b("  </a></div>");_.b("\n" + i);_.b("  <p style=\"padding-top:5px;\"> The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,2172,2182,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" includes <strong>");_.b(_.v(_.f("num_seamounts",c,p,0)));_.b(" seamounts</strong> with an average depth of <strong>");_.b(_.v(_.f("avg_depth_seamounts",c,p,0)));_.b(" meters.</strong>");_.b("\n" + i);if(_.s(_.f("has_seamounts",c,p,1),c,p,0,2400,2607,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    The average distance between seamounts within the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,2473,2483,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of ");_.b("\n" + i);_.b("    interest ");};_.b(" is <strong>");_.b(_.v(_.f("avg_dist_seamounts",c,p,0)));_.b(" km</strong>.");_.b("\n");});c.pop();}_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The physical structure of some seamounts enables the formation of hydrographic features and current flows that can:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Enhance local production through upwelling </li>");_.b("\n" + i);_.b("        <li>Keep species and production processes concentrated over the seamount  </li>");_.b("\n" + i);_.b("        <li>Have a concentration of zooplankton and mesopelagic fish meaning rich feeding grounds and spawning areas for fish and higher predators, and hence fisheries. Seamounts are a hotspot for biodiverstiy but are still understudied.</li>");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Coastal Fisheries </h4>");_.b("\n" + i);_.b("\n" + i);_.b("      <div class=\"in-report-header\">Coastal Catch: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e9\" data-visible=\"false\">show coastal catch layer</a></div>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch (in tonnes)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>% of Total Catch</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("            <th>Demersal </th>");_.b("\n" + i);_.b("            <th>Pelagic  </th>");_.b("\n" + i);_.b("            <th>Invertebrate </th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("coastal_catch",c,p,1),c,p,0,3982,4227,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOT_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEM_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PEL_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("INV_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Commercial Catch:  <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9eb\" data-visible=\"false\">show commercial/subsistence catch layer</a></div>");_.b("\n" + i);if(_.s(_.f("has_comm_catch",c,p,1),c,p,0,4483,4765,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The average commercial catch across EEZs in this area of interest is <strong>");_.b(_.v(_.f("avg_comm_catch",c,p,0)));_.b(" kg per person</strong>. ");_.b("\n" + i);_.b("        The average commercial catch within the entire PACIOCEA region is <strong>");_.b(_.v(_.f("tot_comm_catch",c,p,0)));_.b(" kg per person</strong>.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Catch (kg per capita)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("commercial_catch",c,p,1),c,p,0,5000,5107,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Subsistence Catch:</div>");_.b("\n" + i);if(_.s(_.f("has_subsistence_catch",c,p,1),c,p,0,5254,5536,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The average subsistence catch across EEZs in this area of interest is <strong>");_.b(_.v(_.f("avg_sub_catch",c,p,0)));_.b(" kg per person</strong>. ");_.b("\n" + i);_.b("        The average subsistence catch within the entire PACIOCEA region is <strong>");_.b(_.v(_.f("tot_sub_catch",c,p,0)));_.b(" kg per person</strong>.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Catch (kg per capita)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("subsistence_catch",c,p,1),c,p,0,5778,5885,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Oceanic Fisheries <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e6\" data-visible=\"false\">show oceanic catch layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The average oceanic catch across EEZs in this area of interest is <strong>");_.b(_.v(_.f("avg_ocean_catch",c,p,0)));_.b(" tonnes.</strong>");_.b("\n" + i);_.b("        The total ocean catch within the entire PACIOCEA region is <strong>");_.b(_.v(_.f("tot_ocean_catch",c,p,0)));_.b(" tonnes</strong>.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Domestic Catch</th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Foreign Catch</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Total (tonnes)</th>");_.b("\n" + i);_.b("            <th>tonnes </th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("            <th>tonnes</th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("ocean_catch",c,p,1),c,p,0,6879,7118,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_DOM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DOM_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_FRN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("FRN_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Fisheries Economy<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e1\" data-visible=\"false\">");_.b("\n" + i);_.b("      show fisheries economy layers</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries economy values in each country:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch in MUSD</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Coast</th>");_.b("\n" + i);_.b("            <th>Aquaculture </th>");_.b("\n" + i);_.b("            <th>Domestic</th>");_.b("\n" + i);_.b("            <th>Foreign</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("fisheries",c,p,1),c,p,0,7848,8046,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Coast",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Aqua",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Dom",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Foreign",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Average fisheries economy values in the area of interest:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Coast</th>");_.b("\n" + i);_.b("            <th>Aquaculture</th>");_.b("\n" + i);_.b("            <th>Domestic</th>");_.b("\n" + i);_.b("            <th>Foreign</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_coastal_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_aqua_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_domestic_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_foreign_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Total fisheries economy value in PACIOCEA region:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Coast</th>");_.b("\n" + i);_.b("            <th>Aquaculture</th>");_.b("\n" + i);_.b("            <th>Domestic</th>");_.b("\n" + i);_.b("            <th>Foreign</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_coastal_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_aqua_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_domestic_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_foreign_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of GDP:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\">Number of Countries with GDP Share:</th>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Below 5%</th>");_.b("\n" + i);_.b("            <th>Between 5% and 10%</th>");_.b("\n" + i);_.b("            <th>Average GDP Share in Area of Interest</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("gdp_value",c,p,1),c,p,0,9766,9901,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("BELOW5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("ABOVE5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AVG",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of Total Export:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"3\">Number of Countries with Export Share:</th>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Below 30%</th>");_.b("\n" + i);_.b("            <th>Between 30% and 70%</th>");_.b("\n" + i);_.b("            <th>Over 70%</th>");_.b("\n" + i);_.b("            <th>Average Export Share in Area of Interest</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("export_value",c,p,1),c,p,0,10465,10635,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("BELOW30",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("BELOW70",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("ABOVE70",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AVG",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Aquaculture <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9ee\" data-visible=\"false\">show aquaculture layer</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"6\">Species (Tonnes):</th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Total Tonnes In:</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Prawns</th>");_.b("\n" + i);_.b("            <th>Oyster</th>");_.b("\n" + i);_.b("            <th>Shrimp</th>");_.b("\n" + i);_.b("            <th>Crab</th>");_.b("\n" + i);_.b("            <th>Tilapia</th>");_.b("\n" + i);_.b("            <th>Milkfish</th>");_.b("\n" + i);_.b("            <th>Area of Interest</th>");_.b("\n" + i);_.b("            <th>PACIOCEA Region</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("aqua",c,p,1),c,p,0,11355,11656,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Prawn",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Oyster",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Shrimp",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Crab",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Tilapia",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Milkfish",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AOI_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOT_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Tourism</h4>");_.b("\n" + i);_.b("    <p class=\"large\">");_.b("\n" + i);_.b("      Tourism accounted for an average of <strong>");_.b(_.v(_.f("gdp_percent",c,p,0)));_.b("%</strong> of the GDP of the countries within the sketch. This includes <strong>");_.b(_.v(_.f("intl_tourist_arrival_total",c,p,0)));_.b("</strong> international tourists, which is <strong>");_.b(_.v(_.f("intl_tourist_arrival_perc",c,p,0)));_.b("%</strong> of the international tourists within the PACIOCEA region.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Change in Tourism:</div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Decreased</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by < 100%</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by > 100%</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_arrivals",c,p,1),c,p,0,12522,12659,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("LESS100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("MORE100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("    <div class=\"in-report-header\">Tourism vs Population:</div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Number of Countries where number of Tourists visiting is Greater than Population</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_pop",c,p,1),c,p,0,12999,13075,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOUR_POP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Energy</h4>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Renewable Energy: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d2\" data-visible=\"false\">show renewable energy layer</a></div>");_.b("\n" + i);if(_.s(_.f("has_renewable_energy",c,p,1),c,p,0,13393,14149,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>Countries within the sketch generate an average of <strong>");_.b(_.v(_.f("avg_renewable_energy",c,p,0)));_.b("%</strong> of their energy from renewable sources.</p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"4\">Percentage of Energy Generated by Renewables</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th></th>");_.b("\n" + i);_.b("            <th>Less than 40%</th>");_.b("\n" + i);_.b("            <th>Between 40% and 80%</th>");_.b("\n" + i);_.b("            <th>More than 80%</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("renewable_energy",c,p,1),c,p,0,13908,14091,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>Number of Countries</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("UNDER_40",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("OVER_40",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("OVER_80",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");});c.pop();}if(!_.s(_.f("has_renewable_energy",c,p,1),c,p,1,0,0,"")){_.b("      <p class=\"large\">No Renewable Energy Data Available</p>");_.b("\n");};_.b("    <div class=\"in-report-header\">Fuel Imports: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d0\" data-visible=\"false\">show fuel import layer</a></div>");_.b("\n" + i);if(_.s(_.f("has_fuel_import",c,p,1),c,p,0,14486,15244,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <p>Countries within the sketch import an average of <strong>");_.b(_.v(_.f("avg_fuel_import",c,p,0)));_.b("%</strong> of their fuel.</p>");_.b("\n" + i);_.b("        <table>");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th colspan=\"4\">Percentage of Fuel from Imports</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("              <tr>");_.b("\n" + i);_.b("                <th></th> ");_.b("\n" + i);_.b("                <th>Less than 5%</th>");_.b("\n" + i);_.b("                <th>Between 5% and 20%</th>");_.b("\n" + i);_.b("                <th>More than 20%</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("fuel_import",c,p,1),c,p,0,14990,15185,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Number of Countries</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("UNDER_5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("OVER_5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("OVER_20",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");});c.pop();}if(!_.s(_.f("has_fuel_import",c,p,1),c,p,1,0,0,"")){_.b("        <p class=\"large\">No Fuel Import Data Available</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvam9iSXRlbS5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy91dGlscy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvc2NyaXB0cy9hZGFwdGF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Jhc2VSZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvYmlvZGl2ZXJzaXR5LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Vjb25vbXkuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxD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QUFiLElBQXZELEVBQXVEO0NBOUtwRSxLQUFBO0NBQUEsQ0ErS2tDLEVBQWxDLEdBQUEsR0FBQSxHQUFBLElBQUEsRUFBQSxHQUFBLENBQUE7Q0FDQyxHQUFBLE9BQUQsUUFBQTtDQWpNRixFQWdCUTs7Q0FoQlI7O0NBRnVCOztBQXFNekIsQ0E5TUEsRUE4TWlCLEdBQVgsQ0FBTixHQTlNQTs7OztBQ0FBLElBQUEsc0NBQUE7O0FBQUEsQ0FBQSxFQUFhLElBQUEsR0FBYixRQUFhOztBQUNiLENBREEsRUFDZ0IsSUFBQSxNQUFoQixRQUFnQjs7QUFDaEIsQ0FGQSxFQUVrQixJQUFBLFFBQWxCLFFBQWtCOztBQUVsQixDQUpBLEVBSVUsR0FBSixHQUFxQixLQUEzQjtDQUNFLENBQUEsRUFBQSxFQUFNLElBQU0sR0FBQSxFQUFBO0NBRUwsS0FBRCxHQUFOLEVBQUEsR0FBbUI7Q0FISzs7OztBQ0oxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAoQG1heEV0YSArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje0BtYXhFdGEgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGFTZWNvbmRzJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCwxMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiZG9Ob3RFeHBvcnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO307fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSIsIkJhc2VSZXBvcnRUYWIgPSByZXF1aXJlICdiYXNlUmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEFkYXB0YXRpb25UYWIgZXh0ZW5kcyBCYXNlUmVwb3J0VGFiXG4gICMgdGhpcyBpcyB0aGUgbmFtZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBUYWJcbiAgbmFtZTogJ0FkYXB0YXRpb24nXG4gIGNsYXNzTmFtZTogJ2FkYXB0YXRpb24nXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkYXB0YXRpb25cbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0hhYml0YXQnXG4gICAgJ1BvcHVsYXRpb24nXG4gIF1cblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBoYWJpdGF0X2RhdGEgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRQcmVzZW5jZScpLnRvQXJyYXkoKVxuXG4gICAgaWYgaGFiaXRhdF9kYXRhPy5sZW5ndGggPiAwXG4gICAgICBoYXNfY29yYWwgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRQcmVzZW5jZScpLmJvb2woJ0NvcmFsJylcbiAgICAgIGhhc19zZWFncmFzcyA9IEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnSGFiaXRhdFByZXNlbmNlJykuYm9vbCgnU2VhZ3Jhc3MnKVxuICAgICAgaGFzX21hbmdyb3ZlcyA9IEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnSGFiaXRhdFByZXNlbmNlJykuYm9vbCgnTWFuZ3JvdmUnKVxuICAgIGVsc2VcbiAgICAgIGhhc19jb3JhbCA9IGZhbHNlXG4gICAgICBoYXNfc2VhZ3Jhc3MgPSBmYWxzZVxuICAgICAgaGFzX21hbmdyb3ZlcyA9IGZhbHNlXG4gICAgaGFzX25vX2hhYml0YXRzID0gIWhhc19jb3JhbCBhbmQgIWhhc19zZWFncmFzcyBhbmQgIWhhc19tYW5ncm92ZXNcblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgIG51bXBlb3BsZSA9IEByZWNvcmRTZXQoJ1BvcHVsYXRpb24nLCAnUG9wdWxhdGlvbicpLmZsb2F0KCdQb3B1bGF0aW9uJylcbiAgICBudW1wZW9wbGUgPSBAYWRkQ29tbWFzIG51bXBlb3BsZVxuICAgIHBlcmNwZW9wbGUgPSBAcmVjb3JkU2V0KCdQb3B1bGF0aW9uJywgJ1BvcHVsYXRpb24nKS5mbG9hdCgnUEVSQ19QT1AnKVxuICAgICNzaG93IHRhYmxlcyBpbnN0ZWFkIG9mIGdyYXBoIGZvciBJRVxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgZDNJc1ByZXNlbnQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgZDNJc1ByZXNlbnQgPSBmYWxzZVxuXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIFxuICAgICAgaGFzX2NvcmFsOiBoYXNfY29yYWxcbiAgICAgIGhhc19tYW5ncm92ZXM6IGhhc19tYW5ncm92ZXNcbiAgICAgIGhhc19zZWFncmFzczogaGFzX3NlYWdyYXNzXG4gICAgICBoYXNfbm9faGFiaXRhdHM6IGhhc19ub19oYWJpdGF0c1xuICAgICAgbnVtcGVvcGxlOiBudW1wZW9wbGVcbiAgICAgIHBlcmNwZW9wbGU6IHBlcmNwZW9wbGVcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxuIFxubW9kdWxlLmV4cG9ydHMgPSBBZGFwdGF0aW9uVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEJhc2VSZXBvcnRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnQmFzZVJlcG9ydCdcbiAgY2xhc3NOYW1lOiAnYmFzZXJlcG9ydCdcbiAgdGltZW91dDogMTIwMDAwXG4gIGV2ZW50czpcbiAgICBcImNsaWNrIGEuZGV0YWlsc1wiOiAnb25Nb3JlUmVzdWx0c0NsaWNrJ1xuXG4gICNub3QgdXNlZCB5ZXRcbiAgc2V0dXBUYWJsZVNvcnRpbmc6IChkYXRhLCB0Ym9keU5hbWUsIHRhYmxlTmFtZSwgZGF0YV92YWx1ZSwgY29sX3ZhbHVlcywgcm93X25hbWUsIHNlbGVjdGVkX2NvbF9wcmVmaXgpID0+XG4gICAgaW5kZXggPSAwXG4gICAgZGVmYXVsdF9zb3J0X2tleSA9IFwiXCJcbiAgICBkZWZhdWx0X3NvcnRfZGF0YSA9IFwiXCJcbiAgICBkZWZhdWx0X3Jvd19kYXRhID0gXCJcIlxuICAgIGRhdGFfY29scyA9ICh2IGZvciBrLCB2IG9mIGNvbF92YWx1ZXMpXG4gICAgZm9yIGssdiBpbiBjb2xfdmFsdWVzXG4gICAgICBAJCgnLicraykuY2xpY2sgKGV2ZW50KSA9PlxuICAgICAgICBAcmVuZGVyU29ydChrLCB0YWJsZU5hbWUsIGRhdGFfdmFsdWUsIGV2ZW50LCB2LCB0Ym9keU5hbWUsIChpbmRleCA+IDApLCBcbiAgICAgICAgICBAZ2V0VGFibGVSb3csIHJvd19uYW1lLCBkYXRhX2NvbHMsIHNlbGVjdGVkX2NvbF9wcmVmaXgpXG4gICAgICBpZiBpbmRleCA9PSAwXG4gICAgICAgIGRlZmF1bHRfc29ydF9rZXkgPSBrXG4gICAgICAgIGRlZmF1bHRfc29ydF9kYXRhID0gZGF0YV92YWx1ZVxuICAgICAgICBkZWZhdWx0X3Jvd19kYXRhID0gQGdldFRhYmxlUm93XG4gICAgICBpbmRleCs9MVxuXG4gICAgQHJlbmRlclNvcnQoZGVmYXVsdF9zb3J0X2tleSwgdGFibGVOYW1lLCBkZWZhdWx0X3NvcnRfZGF0YSwgdW5kZWZpbmVkLCBkZWZhdWx0X3NvcnRfZGF0YSwgdGJvZHlOYW1lLCBcbiAgICAgIGZhbHNlLCBkZWZhdWx0X3Jvd19kYXRhLCByb3dfbmFtZSwgZGF0YV9jb2xzLCBzZWxlY3RlZF9jb2xfcHJlZml4KVxuXG4gICNkbyB0aGUgc29ydGluZyAtIHNob3VsZCBiZSB0YWJsZSBpbmRlcGVuZGVudFxuICAjc2tpcCBhbnkgdGhhdCBhcmUgbGVzcyB0aGFuIDAuMDBcbiAgcmVuZGVyU29ydDogKG5hbWUsIHRhYmxlTmFtZSwgcGRhdGEsIGV2ZW50LCBzb3J0QnksIHRib2R5TmFtZSwgaXNGbG9hdCwgZ2V0Um93U3RyaW5nVmFsdWUsIHJvd19uYW1lLCBkYXRhX2NvbHMsXG4gICAgc2VsZWN0ZWRfY29sX3ByZWZpeCkgPT5cbiAgICBpZiBldmVudFxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIHRhcmdldENvbHVtbiA9IEBnZXRTZWxlY3RlZENvbHVtbihldmVudCwgbmFtZSwgc2VsZWN0ZWRfY29sX3ByZWZpeClcbiAgICAgIHNvcnRVcCA9IEBnZXRTb3J0RGlyKHRhcmdldENvbHVtbilcblxuICAgICAgaWYgaXNGbG9hdFxuICAgICAgICBkYXRhID0gXy5zb3J0QnkgcGRhdGEsIChyb3cpIC0+ICBwYXJzZUZsb2F0KHJvd1tzb3J0QnldKVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gXy5zb3J0QnkgcGRhdGEsIChyb3cpIC0+IHJvd1tzb3J0QnldXG5cbiAgICAgICNmbGlwIHNvcnRpbmcgaWYgbmVlZGVkXG4gICAgICBpZiBzb3J0VXBcbiAgICAgICAgZGF0YS5yZXZlcnNlKClcblxuICAgICAgZWwgPSBAJCh0Ym9keU5hbWUpWzBdXG4gICAgICBoYWJfYm9keSA9IGQzLnNlbGVjdChlbClcblxuICAgICAgI3JlbW92ZSBvbGQgcm93c1xuICAgICAgaGFiX2JvZHkuc2VsZWN0QWxsKFwidHIuXCIrcm93X25hbWUpXG4gICAgICAgIC5yZW1vdmUoKVxuXG4gICAgICAjYWRkIG5ldyByb3dzIChhbmQgZGF0YSlcbiAgICAgIHJvd3MgPSBoYWJfYm9keS5zZWxlY3RBbGwoXCJ0clwiKVxuICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgIC5lbnRlcigpLmluc2VydChcInRyXCIsIFwiOmZpcnN0LWNoaWxkXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgcm93X25hbWUpXG5cbiAgICAgIFxuICAgICAgY2VsbHMgPSByb3dzLnNlbGVjdEFsbChcInRkXCIpXG4gICAgICAgICAgLmRhdGEoKHJvdywgaSkgLT5kYXRhX2NvbHMubWFwIChjb2x1bW4pIC0+IChjb2x1bW46IGNvbHVtbiwgdmFsdWU6IHJvd1tjb2x1bW5dKSlcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcInRkXCIpLnRleHQoKGQsIGkpIC0+IFxuICAgICAgICAgIGQudmFsdWVcbiAgICAgICAgKSAgICBcblxuICAgICAgQHNldE5ld1NvcnREaXIodGFyZ2V0Q29sdW1uLCBzb3J0VXApXG4gICAgICBAc2V0U29ydGluZ0NvbG9yKGV2ZW50LCB0YWJsZU5hbWUpXG4gICAgICAjZmlyZSB0aGUgZXZlbnQgZm9yIHRoZSBhY3RpdmUgcGFnZSBpZiBwYWdpbmF0aW9uIGlzIHByZXNlbnRcbiAgICAgIEBmaXJlUGFnaW5hdGlvbih0YWJsZU5hbWUpXG4gICAgICBpZiBldmVudFxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICN0YWJsZSByb3cgZm9yIGhhYml0YXQgcmVwcmVzZW50YXRpb25cbiAgZ2V0VGFibGVSb3c6IChkLCBkYXRhX2NvbHMpID0+XG4gICAgcmV0dXJuIFwiPHRkPlwiK2RbZGF0YV9jb2xzWzBdXStcIjwvdGQ+XCIrXCI8dGQ+XCIrZFtkYXRhX2NvbHNbMV1dK1wiPC90ZD5cIitcIjx0ZD5cIitkW2RhdGFfY29sc1syXV0rXCI8L3RkPlwiXG5cbiAgc2V0U29ydGluZ0NvbG9yOiAoZXZlbnQsIHRhYmxlTmFtZSkgPT5cbiAgICBzb3J0aW5nQ2xhc3MgPSBcInNvcnRpbmdfY29sXCJcbiAgICBpZiBldmVudFxuICAgICAgcGFyZW50ID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS5wYXJlbnQoKVxuICAgICAgbmV3VGFyZ2V0TmFtZSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NOYW1lXG4gICAgICB0YXJnZXRTdHIgPSB0YWJsZU5hbWUrXCIgdGguc29ydGluZ19jb2wgYVwiICAgXG4gICAgICBpZiBAJCh0YXJnZXRTdHIpIGFuZCBAJCh0YXJnZXRTdHIpWzBdXG4gICAgICAgIG9sZFRhcmdldE5hbWUgPSBAJCh0YXJnZXRTdHIpWzBdLmNsYXNzTmFtZVxuICAgICAgICBpZiBuZXdUYXJnZXROYW1lICE9IG9sZFRhcmdldE5hbWVcbiAgICAgICAgICAjcmVtb3ZlIGl0IGZyb20gb2xkIFxuICAgICAgICAgIGhlYWRlck5hbWUgPSB0YWJsZU5hbWUrXCIgdGguc29ydGluZ19jb2xcIlxuICAgICAgICAgIEAkKGhlYWRlck5hbWUpLnJlbW92ZUNsYXNzKHNvcnRpbmdDbGFzcylcbiAgICAgICAgICAjYW5kIGFkZCBpdCB0byBuZXdcbiAgICAgICAgICBwYXJlbnQuYWRkQ2xhc3Moc29ydGluZ0NsYXNzKVxuICAgICBcbiAgZ2V0U29ydERpcjogKHRhcmdldENvbHVtbikgPT5cbiAgICAgc29ydHVwID0gQCQoJy4nK3RhcmdldENvbHVtbikuaGFzQ2xhc3MoXCJzb3J0X3VwXCIpXG4gICAgIHJldHVybiBzb3J0dXBcblxuICBnZXRTZWxlY3RlZENvbHVtbjogKGV2ZW50LCBuYW1lLCBwcmVmaXhfc3RyKSA9PlxuICAgIGlmIGV2ZW50XG4gICAgICAjZ2V0IHNvcnQgb3JkZXJcbiAgICAgIHRhcmdldENvbHVtbiA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NOYW1lXG4gICAgICBtdWx0aUNsYXNzZXMgPSB0YXJnZXRDb2x1bW4uc3BsaXQoJyAnKVxuXG4gICAgICB0Z3RDbGFzc05hbWUgPV8uZmluZCBtdWx0aUNsYXNzZXMsIChjbGFzc25hbWUpIC0+IFxuICAgICAgICBjbGFzc25hbWUubGFzdEluZGV4T2YocHJlZml4X3N0ciwwKSA9PSAwXG4gICAgICB0YXJnZXRDb2x1bW4gPSB0Z3RDbGFzc05hbWVcbiAgICBlbHNlXG4gICAgICAjd2hlbiB0aGVyZSBpcyBubyBldmVudCwgZmlyc3QgdGltZSB0YWJsZSBpcyBmaWxsZWRcbiAgICAgIHRhcmdldENvbHVtbiA9IG5hbWVcblxuICAgIHJldHVybiB0YXJnZXRDb2x1bW5cblxuICBzZXROZXdTb3J0RGlyOiAodGFyZ2V0Q29sdW1uLCBzb3J0VXApID0+XG4gICAgI2FuZCBzd2l0Y2ggaXRcbiAgICBpZiBzb3J0VXBcbiAgICAgIEAkKCcuJyt0YXJnZXRDb2x1bW4pLnJlbW92ZUNsYXNzKCdzb3J0X3VwJylcbiAgICAgIEAkKCcuJyt0YXJnZXRDb2x1bW4pLmFkZENsYXNzKCdzb3J0X2Rvd24nKVxuICAgIGVsc2VcbiAgICAgIEAkKCcuJyt0YXJnZXRDb2x1bW4pLmFkZENsYXNzKCdzb3J0X3VwJylcbiAgICAgIEAkKCcuJyt0YXJnZXRDb2x1bW4pLnJlbW92ZUNsYXNzKCdzb3J0X2Rvd24nKVxuXG4gIGZpcmVQYWdpbmF0aW9uOiAodGFibGVOYW1lKSA9PlxuICAgIGVsID0gQCQodGFibGVOYW1lKVswXVxuICAgIHRndF90YWJsZSA9IGQzLnNlbGVjdChlbClcbiAgICBhY3RpdmVfcGFnZSA9IHRndF90YWJsZS5zZWxlY3RBbGwoXCIuYWN0aXZlIGFcIilcbiAgICBpZiBhY3RpdmVfcGFnZSBhbmQgYWN0aXZlX3BhZ2VbMF0gYW5kIGFjdGl2ZV9wYWdlWzBdWzBdXG4gICAgICBhY3RpdmVfcGFnZVswXVswXS5jbGljaygpXG5cblxuXG4gIGdldE51bVNlYW1vdW50czogKHNlYW1vdW50cykgPT5cbiAgICBmb3Igc20gaW4gc2VhbW91bnRzXG4gICAgICByZXR1cm4gc20uTlVNQkVSXG4gICAgcmV0dXJuIDBcblxuICBnZXRBdmdEZXB0aFNlYW1vdW50czogKHNlYW1vdW50cykgPT5cbiAgICBmb3Igc20gaW4gc2VhbW91bnRzXG4gICAgICByZXR1cm4gTWF0aC5yb3VuZChzbS5BVkdfREVQVEgpXG5cbiAgZ2V0QXZnRGlzdFNlYW1vdW50czogKHNlYW1vdW50cykgPT5cbiAgICBmb3Igc20gaW4gc2VhbW91bnRzXG4gICAgICByZXR1cm4gc20uQ09OTl9ESVNUXG5cbiAgcHJvY2Vzc01pbmluZ0RhdGE6IChtaW5pbmdfZGF0YSkgPT5cbiAgICBuZXdfbWluaW5nX2RhdGEgPSBbXVxuICAgIGZvciBtZCBpbiBtaW5pbmdfZGF0YVxuICAgICAgbmFtZSA9IG1kLlRZUEVcbiAgICAgIHNpemUgPSBAYWRkQ29tbWFzIG1kLlNJWkVfU1FLTVxuICAgICAgcGVyYyA9IG1kLlBFUkNfVE9UXG4gICAgICBpZiBwZXJjIDwgMC4xXG4gICAgICAgIHBlcmMgPSBcIjwgMC4xXCJcbiAgICAgIG5ld19taW5pbmdfZGF0YS5wdXNoIHtUWVBFOm5hbWUsIFNJWkVfU1FLTTpzaXplLFBFUkNfVE9UOnBlcmN9XG5cbiAgICByZXR1cm4gbmV3X21pbmluZ19kYXRhXG5cbiAgYWRkQ29tbWFzOiAobnVtX3N0cikgPT5cbiAgICBudW1fc3RyICs9ICcnXG4gICAgeCA9IG51bV9zdHIuc3BsaXQoJy4nKVxuICAgIHgxID0geFswXVxuICAgIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gICAgcmd4ID0gLyhcXGQrKShcXGR7M30pL1xuICAgIHdoaWxlIHJneC50ZXN0KHgxKVxuICAgICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArICcsJyArICckMicpXG4gICAgcmV0dXJuIHgxICsgeDJcblxuICBvbk1vcmVSZXN1bHRzQ2xpY2s6IChlKSA9PlxuICAgIGU/LnByZXZlbnREZWZhdWx0PygpXG4gICAgdGFyZ2V0X2xpbmsgPSAkKGUudGFyZ2V0KVxuICAgIHNlbGVjdGVkID0gdGFyZ2V0X2xpbmsubmV4dCgpXG4gICAgc2VsY2xhc3MgPSBzZWxlY3RlZC5hdHRyKFwiY2xhc3NcIilcbiAgICBpZiBzZWxjbGFzcz09IFwiaGlkZGVuXCJcbiAgICAgIHNlbGVjdGVkLnJlbW92ZUNsYXNzICdoaWRkZW4nXG4gICAgICBzZWxlY3RlZC5hZGRDbGFzcyAnc2hvd24nXG4gICAgICB0YXJnZXRfbGluay50ZXh0KFwiaGlkZSBkZXRhaWxzXCIpXG4gICAgZWxzZVxuICAgICAgc2VsZWN0ZWQucmVtb3ZlQ2xhc3MgJ3Nob3duJ1xuICAgICAgc2VsZWN0ZWQuYWRkQ2xhc3MgJ2hpZGRlbidcbiAgICAgIHRhcmdldF9saW5rLnRleHQoXCJzaG93IGRldGFpbHNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlUmVwb3J0VGFiIiwiQmFzZVJlcG9ydFRhYiA9IHJlcXVpcmUgJ2Jhc2VSZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgQmlvZGl2ZXJzaXR5VGFiIGV4dGVuZHMgQmFzZVJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdCaW9kaXZlcnNpdHknXG4gIGNsYXNzTmFtZTogJ2Jpb2RpdmVyc2l0eSdcbiAgdGltZW91dDogMTIwMDAwXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYmlvZGl2ZXJzaXR5XG4gIGRlcGVuZGVuY2llczogW1xuXG4gIF1cblxuICByZW5kZXI6ICgpIC0+XG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcblxuICAgICNzaG93IHRhYmxlcyBpbnN0ZWFkIG9mIGdyYXBoIGZvciBJRVxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgZDNJc1ByZXNlbnQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgZDNJc1ByZXNlbnQgPSBmYWxzZVxuXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBCaW9kaXZlcnNpdHlUYWIiLCJCYXNlUmVwb3J0VGFiID0gcmVxdWlyZSAnYmFzZVJlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBFY29ub215VGFiIGV4dGVuZHMgQmFzZVJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdTdXN0YWluYWJsZSBFY29ub215J1xuICBjbGFzc05hbWU6ICdlY29ub215J1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lY29ub215XG5cbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0NvYXN0YWxDYXRjaCdcbiAgICAnU2l6ZSdcbiAgICAnRGVlcFNlYSdcbiAgICAnRmlzaGVyaWVzJ1xuICAgICdQYWNpb2NlYUFxdWFjdWx0dXJlJ1xuICAgICdUb3VyaXNtJ1xuICAgICdFbmVyZ3knXG4gIF1cblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBtc2cgPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiUmVzdWx0TXNnXCIpXG4gICAgXG4gICAgY29hc3RhbF9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJDb2FzdGFsQ2F0Y2hUYWJsZVwiKS50b0FycmF5KClcbiAgICBjb21tZXJjaWFsX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvbW1lcmNpYWxUYWJsZVwiKS50b0FycmF5KClcbiAgICBzdWJzaXN0ZW5jZV9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJTdWJzaXN0ZW5jZVRhYmxlXCIpLnRvQXJyYXkoKVxuICAgIG9jZWFuX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIk9jZWFuVGFibGVcIikudG9BcnJheSgpXG4gICAgcmVuZXdhYmxlX2VuZXJneSA9IEByZWNvcmRTZXQoXCJFbmVyZ3lcIiwgXCJSZW5ld2FibGVFbmVyZ3lcIikudG9BcnJheSgpXG5cbiAgICBpZiByZW5ld2FibGVfZW5lcmd5Py5sZW5ndGggPiAwXG4gICAgICBoYXNfcmVuZXdhYmxlX2VuZXJneSA9IHRydWVcbiAgICAgIGF2Z19yZW5ld2FibGVfZW5lcmd5ID0gcmVuZXdhYmxlX2VuZXJneVswXS5BVkdcbiAgICBlbHNlXG5cbiAgICAgIGhhc19yZW5ld2FibGVfZW5lcmd5ID0gZmFsc2VcblxuICAgIGZ1ZWxfaW1wb3J0ID0gQHJlY29yZFNldChcIkVuZXJneVwiLCBcIkZ1ZWxJbXBvcnRcIikudG9BcnJheSgpXG4gICAgaWYgZnVlbF9pbXBvcnQ/Lmxlbmd0aCA+IDBcbiAgICAgIGhhc19mdWVsX2ltcG9ydCA9IHRydWVcbiAgICAgIGF2Z19mdWVsX2ltcG9ydCA9IGZ1ZWxfaW1wb3J0WzBdLkFWR1xuICAgIGVsc2UgXG4gICAgICBoYXMgZnVlbF9pbXBvcnQgPSBmYWxzZVxuXG4gICAgaWYgY29tbWVyY2lhbF9jYXRjaCBhbmQgY29tbWVyY2lhbF9jYXRjaD8ubGVuZ3RoID4gMFxuICAgICAgYXZnX2NvbW1fY2F0Y2ggPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiQ29tbWVyY2lhbFRhYmxlXCIpLmZsb2F0KCdBVkdfS0dfQ0FQJylbMF1cbiAgICAgIHRvdF9jb21tX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvbW1lcmNpYWxUYWJsZVwiKS5mbG9hdCgnVE9UX0tHX0NBUCcpWzBdXG4gICAgICBoYXNfY29tbV9jYXRjaCA9IHRydWVcbiAgICBlbHNlXG4gICAgICBoYXNfY29tbV9jYXRjaCA9IGZhbHNlXG4gICAgaWYgc3Vic2lzdGVuY2VfY2F0Y2ggYW5kIHN1YnNpc3RlbmNlX2NhdGNoPy5sZW5ndGggPiAwXG4gICAgICBhdmdfc3ViX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIlN1YnNpc3RlbmNlVGFibGVcIikuZmxvYXQoJ0FWR19LR19DQVAnKVswXVxuICAgICAgdG90X3N1Yl9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJTdWJzaXN0ZW5jZVRhYmxlXCIpLmZsb2F0KCdUT1RfS0dfQ0FQJylbMF1cbiAgICAgIGhhc19zdWJzaXN0ZW5jZV9jYXRjaCA9IHRydWVcbiAgICBlbHNlXG4gICAgICBoYXNfc3Vic2lzdGVuY2VfY2F0Y2ggPSBmYWxzZVxuXG4gICAgaWYgb2NlYW5fY2F0Y2ggYW5kIG9jZWFuX2NhdGNoPy5sZW5ndGggPiAwXG4gICAgICBhdmdfb2NlYW5fY2F0Y2ggPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiT2NlYW5UYWJsZVwiKS5mbG9hdCgnU0tfQVZHJylbMF1cbiAgICAgIHRvdF9vY2Vhbl9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJPY2VhblRhYmxlXCIpLmZsb2F0KCdSR05fVE9UJylbMF1cbiAgICAgIHRvdF9vY2Vhbl9jYXRjaCA9IEBhZGRDb21tYXMgdG90X29jZWFuX2NhdGNoXG4gICAgICBoYXNfb2NlYW5fY2F0Y2ggPSB0cnVlXG4gICAgZWxzZVxuICAgICAgaGFzX29jZWFuX2NhdGNoID0gZmFsc2VcblxuICAgIGZpc2hlcmllcyA9IEByZWNvcmRTZXQoXCJGaXNoZXJpZXNcIiwgXCJGaXNoZXJpZXNUYWJsZVwiKS50b0FycmF5KClcbiAgICBhcXVhID0gQHJlY29yZFNldChcIlBhY2lvY2VhQXF1YWN1bHR1cmVcIiwgXCJhcVwiKS50b0FycmF5KClcblxuICAgICN0aGlzIGZlZWxzIGdyb3NzLiBpbiBvcmRlciB0byBub3QgaGF2ZSB0byBhZGQgYW5vdGhlciByZWNvcmQgc2V0IGluIHRoZSBncCwgZWFjaCByb3cgaW5cbiAgICAjdGhlIHRhYmxlIGhhcyB0aGUgYXZnL3RvdGFsIGFkZGVkIHRvIGl0LiBzbyBpZiBpdHMgYSBzaW5nbGUgcm93IHRhYmxlLCBnZXQgdGhlIHZhbHVlLFxuICAgICNvdGhlcndpc2UgZ2V0IHRoZSBmaXJzdCBvbmUuIGJldHRlciB3YXkgdG8gZG8gdGhpcz9cbiAgICBhdmdfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0NTVF9BVkcnKVxuICAgIGlmIGF2Z19maXNoZXJpZXNfY29hc3RhbF9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgYXZnX2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoID0gYXZnX2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoWzBdXG5cbiAgICB0b3RfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0NTVF9UT1QnKVxuICAgIGlmIHRvdF9maXNoZXJpZXNfY29hc3RhbF9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgdG90X2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoID0gdG90X2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoWzBdXG5cbiAgICBhdmdfZmlzaGVyaWVzX2FxdWFfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0FRVUFfQVZHJylcbiAgICBpZiBhdmdfZmlzaGVyaWVzX2FxdWFfY2F0Y2g/Lmxlbmd0aCA+IDFcbiAgICAgIGF2Z19maXNoZXJpZXNfYXF1YV9jYXRjaCA9IGF2Z19maXNoZXJpZXNfYXF1YV9jYXRjaFswXVxuICAgIHRvdF9maXNoZXJpZXNfYXF1YV9jYXRjaCA9IEByZWNvcmRTZXQoXCJGaXNoZXJpZXNcIiwgXCJGaXNoZXJpZXNUYWJsZVwiKS5mbG9hdCgnQVFVQV9UT1QnKVxuICAgIGlmIHRvdF9maXNoZXJpZXNfYXF1YV9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgdG90X2Zpc2hlcmllc19hcXVhX2NhdGNoID0gdG90X2Zpc2hlcmllc19hcXVhX2NhdGNoWzBdXG5cbiAgICBhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkZpc2hlcmllc1RhYmxlXCIpLmZsb2F0KCdET01fQVZHJylcbiAgICBpZiBhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoPy5sZW5ndGggPiAxXG4gICAgICBhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoID0gYXZnX2Zpc2hlcmllc19kb21lc3RpY19jYXRjaFswXVxuICAgIHRvdF9maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0RPTV9UT1QnKVxuICAgIGlmIHRvdF9maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2g/Lmxlbmd0aCA+IDFcbiAgICAgIHRvdF9maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2ggPSB0b3RfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoWzBdXG5cbiAgICBhdmdfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0ZSTl9BVkcnKVxuICAgIGlmIGF2Z19maXNoZXJpZXNfZm9yZWlnbl9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgYXZnX2Zpc2hlcmllc19mb3JlaWduX2NhdGNoID0gYXZnX2Zpc2hlcmllc19mb3JlaWduX2NhdGNoWzBdXG4gICAgdG90X2Zpc2hlcmllc19mb3JlaWduX2NhdGNoID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkZpc2hlcmllc1RhYmxlXCIpLmZsb2F0KCdGUk5fVE9UJykgICBcbiAgICBpZiB0b3RfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2g/Lmxlbmd0aCA+IDFcbiAgICAgIHRvdF9maXNoZXJpZXNfZm9yZWlnbl9jYXRjaCA9IHRvdF9maXNoZXJpZXNfZm9yZWlnbl9jYXRjaFswXVxuXG4gICAgZ2RwX3ZhbHVlID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkdEUFRhYmxlXCIpLnRvQXJyYXkoKSBcbiAgICBleHBvcnRfdmFsdWUgPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRXhwb3J0VGFibGVcIikudG9BcnJheSgpIFxuXG4gICAgc2l6ZSA9IEByZWNvcmRTZXQoJ1NpemUnLCAnU2l6ZScpLmZsb2F0KCdTSVpFX0lOX0tNJylcbiAgICBuZXdfc2l6ZSA9ICBAYWRkQ29tbWFzIHNpemVcblxuICAgIG1pbmluZyA9IEByZWNvcmRTZXQoJ0RlZXBTZWEnLCAnTWluaW5nJykudG9BcnJheSgpXG4gICAgbWluaW5nID0gQHByb2Nlc3NNaW5pbmdEYXRhIG1pbmluZ1xuXG4gICAgc2VhbW91bnRzID0gQHJlY29yZFNldCgnRGVlcFNlYScsICdTZWFtb3VudHMnKS50b0FycmF5KClcbiAgICB0b3VyaXN0X2Fycml2YWxzID0gQHJlY29yZFNldCgnVG91cmlzbScsICdUb3VyaXN0QXJyaXZhbHMnKS50b0FycmF5KClcbiAgICB0b3VyaXN0X3BvcCA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnVG91cmlzdFBvcHVsYXRpb24nKS50b0FycmF5KClcbiAgICBnZHBfcGVyY2VudCA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnR0RQUGVyY2VudCcpLmZsb2F0KCdHRFAnKVxuICAgIGlmIGdkcF9wZXJjZW50ID4gMC4xXG4gICAgICBnZHBfcGVyY2VudCA9IGdkcF9wZXJjZW50LnRvRml4ZWQoMSlcblxuICAgIGludGxfdG91cmlzdF9hcnJpdmFsX3RvdGFsID0gQHJlY29yZFNldCgnVG91cmlzbScsICdJbnRlcm5hdGlvbmFsQXJyaXZhbHMnKS5mbG9hdCgnQXJyaXZhbHMnKVxuICAgIGludGxfdG91cmlzdF9hcnJpdmFsX3BlcmMgPSBAcmVjb3JkU2V0KCdUb3VyaXNtJywgJ0ludGVybmF0aW9uYWxBcnJpdmFscycpLmZsb2F0KCdJQV9QRVJDJylcbiAgICBpZiBpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjID4gMC4xXG4gICAgICBpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjID0gaW50bF90b3VyaXN0X2Fycml2YWxfcGVyYy50b0ZpeGVkKDEpXG4gICAgICBcbiAgICBudW1fc2VhbW91bnRzID0gQGdldE51bVNlYW1vdW50cyBzZWFtb3VudHNcblxuICAgIGhhc19zZWFtb3VudHMgPSBudW1fc2VhbW91bnRzID4gMVxuICAgIGF2Z19kZXB0aF9zZWFtb3VudHMgPSBAZ2V0QXZnRGVwdGhTZWFtb3VudHMgc2VhbW91bnRzXG4gICAgYXZnX2RlcHRoX3NlYW1vdW50cyA9IEBhZGRDb21tYXMgYXZnX2RlcHRoX3NlYW1vdW50c1xuXG4gICAgYXZnX2Rpc3Rfc2VhbW91bnRzID0gQGdldEF2Z0Rpc3RTZWFtb3VudHMgc2VhbW91bnRzXG4gICAgYXZnX2Rpc3Rfc2VhbW91bnRzID0gQGFkZENvbW1hcyhNYXRoLnJvdW5kKGF2Z19kaXN0X3NlYW1vdW50cykpXG5cblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2l6ZTogbmV3X3NpemVcbiAgICAgIGhhc19zZWFtb3VudHM6IGhhc19zZWFtb3VudHNcbiAgICAgIG51bV9zZWFtb3VudHM6IG51bV9zZWFtb3VudHNcbiAgICAgIGF2Z19kZXB0aF9zZWFtb3VudHM6IGF2Z19kZXB0aF9zZWFtb3VudHNcbiAgICAgIGF2Z19kaXN0X3NlYW1vdW50czogYXZnX2Rpc3Rfc2VhbW91bnRzXG4gICAgICBjb2FzdGFsX2NhdGNoOiBjb2FzdGFsX2NhdGNoXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgbWluaW5nOm1pbmluZ1xuICAgICAgY29tbWVyY2lhbF9jYXRjaDogY29tbWVyY2lhbF9jYXRjaFxuICAgICAgaGFzX2NvbW1fY2F0Y2g6IGhhc19jb21tX2NhdGNoXG4gICAgICBhdmdfY29tbV9jYXRjaDogYXZnX2NvbW1fY2F0Y2hcbiAgICAgIHRvdF9jb21tX2NhdGNoOiB0b3RfY29tbV9jYXRjaFxuXG4gICAgICBzdWJzaXN0ZW5jZV9jYXRjaDogc3Vic2lzdGVuY2VfY2F0Y2hcbiAgICAgIGhhc19zdWJzaXN0ZW5jZV9jYXRjaDogaGFzX3N1YnNpc3RlbmNlX2NhdGNoXG4gICAgICBhdmdfc3ViX2NhdGNoOiBhdmdfc3ViX2NhdGNoXG4gICAgICB0b3Rfc3ViX2NhdGNoOiB0b3Rfc3ViX2NhdGNoXG5cbiAgICAgIGhhc19vY2Vhbl9jYXRjaDogaGFzX29jZWFuX2NhdGNoXG4gICAgICBvY2Vhbl9jYXRjaDogb2NlYW5fY2F0Y2hcbiAgICAgIGF2Z19vY2Vhbl9jYXRjaDogYXZnX29jZWFuX2NhdGNoXG4gICAgICB0b3Rfb2NlYW5fY2F0Y2g6IHRvdF9vY2Vhbl9jYXRjaFxuXG4gICAgICBmaXNoZXJpZXM6IGZpc2hlcmllc1xuICAgICAgYXZnX2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoOmF2Z19maXNoZXJpZXNfY29hc3RhbF9jYXRjaFxuICAgICAgdG90X2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoOnRvdF9maXNoZXJpZXNfY29hc3RhbF9jYXRjaFxuXG4gICAgICBhdmdfZmlzaGVyaWVzX2FxdWFfY2F0Y2g6YXZnX2Zpc2hlcmllc19hcXVhX2NhdGNoXG4gICAgICB0b3RfZmlzaGVyaWVzX2FxdWFfY2F0Y2g6dG90X2Zpc2hlcmllc19hcXVhX2NhdGNoXG5cbiAgICAgIGF2Z19maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2g6YXZnX2Zpc2hlcmllc19kb21lc3RpY19jYXRjaFxuICAgICAgdG90X2Zpc2hlcmllc19kb21lc3RpY19jYXRjaDp0b3RfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoXG5cbiAgICAgIGF2Z19maXNoZXJpZXNfZm9yZWlnbl9jYXRjaDphdmdfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2hcbiAgICAgIHRvdF9maXNoZXJpZXNfZm9yZWlnbl9jYXRjaDp0b3RfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2hcblxuICAgICAgZXhwb3J0X3ZhbHVlOiBleHBvcnRfdmFsdWVcbiAgICAgIGdkcF92YWx1ZTogZ2RwX3ZhbHVlXG4gICAgICBhcXVhOmFxdWFcblxuICAgICAgdG91cmlzdF9hcnJpdmFsczp0b3VyaXN0X2Fycml2YWxzXG4gICAgICB0b3VyaXN0X3BvcDp0b3VyaXN0X3BvcFxuXG4gICAgICByZW5ld2FibGVfZW5lcmd5OiByZW5ld2FibGVfZW5lcmd5XG4gICAgICBhdmdfcmVuZXdhYmxlX2VuZXJneTogYXZnX3JlbmV3YWJsZV9lbmVyZ3lcbiAgICAgIGhhc19yZW5ld2FibGVfZW5lcmd5OiBoYXNfcmVuZXdhYmxlX2VuZXJneVxuICAgICAgZnVlbF9pbXBvcnQ6IGZ1ZWxfaW1wb3J0XG4gICAgICBhdmdfZnVlbF9pbXBvcnQ6IGF2Z19mdWVsX2ltcG9ydFxuICAgICAgaGFzX2Z1ZWxfaW1wb3J0OiBoYXNfZnVlbF9pbXBvcnRcbiAgICAgIGdkcF9wZXJjZW50OiBnZHBfcGVyY2VudFxuICAgICAgaW50bF90b3VyaXN0X2Fycml2YWxfdG90YWw6IGludGxfdG91cmlzdF9hcnJpdmFsX3RvdGFsXG4gICAgICBpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjOiBpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIGNvbF92YWx1ZXMgPSB7J2NhdGNoX2NvdW50cnknOlwiQ09VTlRSWVwiLCAnY2F0Y2hfaW5fZWV6JzpcIlRPVF9UT05TXCIsICdjYXRjaF9wZXJjJzpcIlBFUkNfVE9UXCJ9XG4gICAgQHNldHVwVGFibGVTb3J0aW5nKGNvYXN0YWxfY2F0Y2gsICcuY29hc3RhbF9jYXRjaF92YWx1ZXMnLCAnLmNvYXN0YWxfY2F0Y2hfdGFibGUnLCBjb2xfdmFsdWVzLCAnY29hc3RhbC1jYXRjaC1yb3cnLCAnY2F0Y2gnKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBFY29ub215VGFiIiwiRWNvbm9teVRhYiA9IHJlcXVpcmUgJy4vZWNvbm9teS5jb2ZmZWUnXG5BZGFwdGF0aW9uVGFiID0gcmVxdWlyZSAnLi9hZGFwdGF0aW9uLmNvZmZlZSdcbkJpb2RpdmVyc2l0eVRhYiA9IHJlcXVpcmUgJy4vYmlvZGl2ZXJzaXR5LmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbRWNvbm9teVRhYiwgQWRhcHRhdGlvblRhYiwgQmlvZGl2ZXJzaXR5VGFiXVxuICAjIHBhdGggbXVzdCBiZSByZWxhdGl2ZSB0byBkaXN0L1xuICByZXBvcnQuc3R5bGVzaGVldHMgWycuL3JlcG9ydC5jc3MnXVxuIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYWRhcHRhdGlvblwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzX2NvcmFsXCIsYyxwLDEpLGMscCwwLDM2MCw2MDQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2UgZ3JlZW4tY2hlY2tcXFwiPlRoZSBhcmVhIG9mIGludGVyZXN0IGluY2x1ZGVzIDxzdHJvbmc+Y29yYWwgcmVlZnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IHN0eWxlPVxcXCJtYXJnaW4tbGVmdDo1MHB4O1xcXCI+PGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MDk2MGE0ZWI1ODBmMTNjMDJjOGZkXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGNvcmFsIHJlZWYgbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzX3NlYWdyYXNzXCIsYyxwLDEpLGMscCwwLDYzOCw4NzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2UgZ3JlZW4tY2hlY2tcXFwiPlRoZSBhcmVhIG9mIGludGVyZXN0IGluY2x1ZGVzIDxzdHJvbmc+c2VhZ3Jhc3M8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IHN0eWxlPVxcXCJtYXJnaW4tbGVmdDo1MHB4O1xcXCI+PGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MDk2MGE0ZWI1ODBmMTNjMDJjOGZiXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IHNlYWdyYXNzIGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc19tYW5ncm92ZXNcIixjLHAsMSksYyxwLDAsOTE1LDExNTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2UgZ3JlZW4tY2hlY2tcXFwiPlRoZSBhcmVhIG9mIGludGVyZXN0IGluY2x1ZGVzIDxzdHJvbmc+bWFuZ3JvdmVzPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBzdHlsZT1cXFwibWFyZ2luLWxlZnQ6NTBweDtcXFwiPjxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTA5NjBhNGViNTgwZjEzYzAyYzhmOVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBtYW5ncm92ZSBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNfbm9faGFiaXRhdHNcIixjLHAsMSksYyxwLDAsMTE5NiwxMzIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5UaGVyZSBhcmUgbm8gPHN0cm9uZz5tYW5ncm92ZXMsIHNlYWdyYXNzLCBvciBjb3JhbCBoYWJpdGF0czwvc3Ryb25nPiB3aXRoaW4gdGhlIGFyZWEgb2YgaW50ZXJlc3QuPC9wPiBcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UG9wdWxhdGlvbjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlRoZSB0b3RhbCBwb3B1bGF0aW9uIG9mIHRoZSBjb3VudHJpZXMgd2l0aGluIHRoZSBza2V0Y2ggaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1wZW9wbGVcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4sIHdoaWNoIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY3Blb3BsZVwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIHBvcHVsYXRpb24gd2l0aGluIHRoZSBQQUNJT0NFQSByZWdpb24uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImJpb2RpdmVyc2l0eVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5CaW9kaXZlcnNpdHk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+VEJEPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlY29ub215XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwzOTIsNDAyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIGFyZWEgb2YgaW50ZXJlc3QgXCIpO307Xy5iKFwiIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUga2lsb21ldGVyczwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRlZXAgU2VhIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5EZWVwIFNlYSBNaW5lcmFsczogPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWQzXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IG1pbmVyYWwgbGF5ZXJzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxNzBweDtcXFwiPlR5cGU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgKHNxLiBrbSk8L2E+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhICglIG9mIHRvdGFsIHJlZ2lvbik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1pbmluZ1wiLGMscCwxKSxjLHAsMCw5NDMsMTA2MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNJWkVfU1FLTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19UT1RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2PjxhIGNsYXNzPVxcXCJkZXRhaWxzXFxcIiBocmVmPVxcXCIjXFxcIj5zaG93IGRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwibGlzdC1oZWFkZXJcXFwiPlRoZSBkZWVwIHNlYSByZXNvdXJjZXMgYXZhaWxhYmxlIGZvciBleHRyYWN0aW9uIGFyZSBkaXZpZGVkIGludG8gNCB0eXBlczo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8b2w+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+UG9seW1ldGFsbGljIE5vZHVsZXMgKE1hbmdhbmVzZSwgQ29wcGVyLCBOaWNrZWwsIENvYmFsdCkgLSA0LDAwMCAtIDYsMDAwIG0gZGVwdGg8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPkNvYmFsdC1yaWNoIE1hbmdhbmVzZSBDcnVzdHMgKENvYmFsdCkgLSA4MDAgLSAzLDAwMCBtIGRlcHRoPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5TdWxwaGlkZSBEZXBvc2l0cyAoQ29wcGVyKSAtIDEsNTAwIC0gNCwwMDAgbSBkZXB0aDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+RGVlcC1zZWEgbXVkIChyYXJlIGVhcnRoIGVsZW1lbnRzLCB5dHRyaXVtKSAtIDIsMDAwIC02LDAwMCBtIGRlcHRoLjwvbGk+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L29sPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBUaGUgRFNNIGRlcG9zaXRzIGFyZSBoaWdoZXIgaW4gbWluZXJhbCBjb250ZW50IHRoYW4gb24tbGFuZCBkZXBvc2l0cy4gVHlwaWNhbCB2YWx1ZSBvZiBhIHRvbm5lIG9mIGxhbmQgYmFzZWQgb3JlIGlzIDUwLTIwMCBVU0QsIGZvciBzZWEgZmxvb3IgZGVwb3NpdHMgaXTigJlzIDUwMC0xNTAwIFVTRC4gRFNNIG1pbmluZyBpbiB0aGUgUEFDSU9DRUEgIGhhcyBhIHN0cm9uZyBwb3RlbnRpYWwuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+SGFiaXRhdHMgaW4gU2VhbW91bnRzOiA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgc2VhbW91bnQgbGF5ZXJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIHN0eWxlPVxcXCJwYWRkaW5nLXRvcDo1cHg7XFxcIj4gVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDIxNzIsMjE4MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiBhcmVhIG9mIGludGVyZXN0IFwiKTt9O18uYihcIiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bV9zZWFtb3VudHNcIixjLHAsMCkpKTtfLmIoXCIgc2VhbW91bnRzPC9zdHJvbmc+IHdpdGggYW4gYXZlcmFnZSBkZXB0aCBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImF2Z19kZXB0aF9zZWFtb3VudHNcIixjLHAsMCkpKTtfLmIoXCIgbWV0ZXJzLjwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNfc2VhbW91bnRzXCIsYyxwLDEpLGMscCwwLDI0MDAsMjYwNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIFRoZSBhdmVyYWdlIGRpc3RhbmNlIGJldHdlZW4gc2VhbW91bnRzIHdpdGhpbiB0aGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMjQ3MywyNDgzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIGFyZWEgb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGludGVyZXN0IFwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImF2Z19kaXN0X3NlYW1vdW50c1wiLGMscCwwKSkpO18uYihcIiBrbTwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJoaWRkZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcImxpc3QtaGVhZGVyXFxcIj5UaGUgcGh5c2ljYWwgc3RydWN0dXJlIG9mIHNvbWUgc2VhbW91bnRzIGVuYWJsZXMgdGhlIGZvcm1hdGlvbiBvZiBoeWRyb2dyYXBoaWMgZmVhdHVyZXMgYW5kIGN1cnJlbnQgZmxvd3MgdGhhdCBjYW46PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPG9sPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPkVuaGFuY2UgbG9jYWwgcHJvZHVjdGlvbiB0aHJvdWdoIHVwd2VsbGluZyA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPktlZXAgc3BlY2llcyBhbmQgcHJvZHVjdGlvbiBwcm9jZXNzZXMgY29uY2VudHJhdGVkIG92ZXIgdGhlIHNlYW1vdW50ICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPkhhdmUgYSBjb25jZW50cmF0aW9uIG9mIHpvb3BsYW5rdG9uIGFuZCBtZXNvcGVsYWdpYyBmaXNoIG1lYW5pbmcgcmljaCBmZWVkaW5nIGdyb3VuZHMgYW5kIHNwYXduaW5nIGFyZWFzIGZvciBmaXNoIGFuZCBoaWdoZXIgcHJlZGF0b3JzLCBhbmQgaGVuY2UgZmlzaGVyaWVzLiBTZWFtb3VudHMgYXJlIGEgaG90c3BvdCBmb3IgYmlvZGl2ZXJzdGl5IGJ1dCBhcmUgc3RpbGwgdW5kZXJzdHVkaWVkLjwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9vbD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkNvYXN0YWwgRmlzaGVyaWVzIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5Db2FzdGFsIENhdGNoOiA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZTlcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgY29hc3RhbCBjYXRjaCBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCI0XFxcIj5DYXRjaCAoaW4gdG9ubmVzKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPiUgb2YgVG90YWwgQ2F0Y2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkRlbWVyc2FsIDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlBlbGFnaWMgIDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkludmVydGVicmF0ZSA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29hc3RhbF9jYXRjaFwiLGMscCwxKSxjLHAsMCwzOTgyLDQyMjcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UUllcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX1RPVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRPVF9UT05TXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiREVNX1RPTlNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRUxfVE9OU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIklOVl9UT05TXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5Db21tZXJjaWFsIENhdGNoOiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWViXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGNvbW1lcmNpYWwvc3Vic2lzdGVuY2UgY2F0Y2ggbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc19jb21tX2NhdGNoXCIsYyxwLDEpLGMscCwwLDQ0ODMsNDc2NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgYXZlcmFnZSBjb21tZXJjaWFsIGNhdGNoIGFjcm9zcyBFRVpzIGluIHRoaXMgYXJlYSBvZiBpbnRlcmVzdCBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImF2Z19jb21tX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiIGtnIHBlciBwZXJzb248L3N0cm9uZz4uIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIGF2ZXJhZ2UgY29tbWVyY2lhbCBjYXRjaCB3aXRoaW4gdGhlIGVudGlyZSBQQUNJT0NFQSByZWdpb24gaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJ0b3RfY29tbV9jYXRjaFwiLGMscCwwKSkpO18uYihcIiBrZyBwZXIgcGVyc29uPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNhdGNoIChrZyBwZXIgY2FwaXRhKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjb21tZXJjaWFsX2NhdGNoXCIsYyxwLDEpLGMscCwwLDUwMDAsNTEwNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRSWVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIktHX0NBUFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5TdWJzaXN0ZW5jZSBDYXRjaDo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzX3N1YnNpc3RlbmNlX2NhdGNoXCIsYyxwLDEpLGMscCwwLDUyNTQsNTUzNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgYXZlcmFnZSBzdWJzaXN0ZW5jZSBjYXRjaCBhY3Jvc3MgRUVacyBpbiB0aGlzIGFyZWEgb2YgaW50ZXJlc3QgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhdmdfc3ViX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiIGtnIHBlciBwZXJzb248L3N0cm9uZz4uIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIGF2ZXJhZ2Ugc3Vic2lzdGVuY2UgY2F0Y2ggd2l0aGluIHRoZSBlbnRpcmUgUEFDSU9DRUEgcmVnaW9uIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwidG90X3N1Yl9jYXRjaFwiLGMscCwwKSkpO18uYihcIiBrZyBwZXIgcGVyc29uPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5DYXRjaCAoa2cgcGVyIGNhcGl0YSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic3Vic2lzdGVuY2VfY2F0Y2hcIixjLHAsMSksYyxwLDAsNTc3OCw1ODg1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFJZXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiS0dfQ0FQXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T2NlYW5pYyBGaXNoZXJpZXMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWU2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IG9jZWFuaWMgY2F0Y2ggbGF5ZXJzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSBhdmVyYWdlIG9jZWFuaWMgY2F0Y2ggYWNyb3NzIEVFWnMgaW4gdGhpcyBhcmVhIG9mIGludGVyZXN0IGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXZnX29jZWFuX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiIHRvbm5lcy48L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSB0b3RhbCBvY2VhbiBjYXRjaCB3aXRoaW4gdGhlIGVudGlyZSBQQUNJT0NFQSByZWdpb24gaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJ0b3Rfb2NlYW5fY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCIgdG9ubmVzPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj5Eb21lc3RpYyBDYXRjaDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjJcXFwiPkZvcmVpZ24gQ2F0Y2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Ub3RhbCAodG9ubmVzKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPnRvbm5lcyA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD4lIG9mIGNhdGNoIGluIEVFWjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPnRvbm5lczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPiUgb2YgY2F0Y2ggaW4gRUVaPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm9jZWFuX2NhdGNoXCIsYyxwLDEpLGMscCwwLDY4NzksNzExOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRSWVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNLX1RPVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNLX0RPTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRPTV9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU0tfRlJOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRlJOX1BFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoZXJpZXMgRWNvbm9teTxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzllMVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgc2hvdyBmaXNoZXJpZXMgZWNvbm9teSBsYXllcnM8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzdHJvbmc+RmlzaGVyaWVzIGVjb25vbXkgdmFsdWVzIGluIGVhY2ggY291bnRyeTo8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMVxcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiNFxcXCI+Q2F0Y2ggaW4gTVVTRDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvYXN0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXF1YWN1bHR1cmUgPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+RG9tZXN0aWM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Gb3JlaWduPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZpc2hlcmllc1wiLGMscCwxKSxjLHAsMCw3ODQ4LDgwNDYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb2FzdFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFxdWFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJEb21cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGb3JlaWduXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHN0cm9uZz5BdmVyYWdlIGZpc2hlcmllcyBlY29ub215IHZhbHVlcyBpbiB0aGUgYXJlYSBvZiBpbnRlcmVzdDo8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q29hc3Q8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5BcXVhY3VsdHVyZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkRvbWVzdGljPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Rm9yZWlnbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImF2Z19maXNoZXJpZXNfY29hc3RhbF9jYXRjaFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImF2Z19maXNoZXJpZXNfYXF1YV9jYXRjaFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImF2Z19maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJhdmdfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHN0cm9uZz5Ub3RhbCBmaXNoZXJpZXMgZWNvbm9teSB2YWx1ZSBpbiBQQUNJT0NFQSByZWdpb246PC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvYXN0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXF1YWN1bHR1cmU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Eb21lc3RpYzwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkZvcmVpZ248L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJ0b3RfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJ0b3RfZmlzaGVyaWVzX2FxdWFfY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJ0b3RfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidG90X2Zpc2hlcmllc19mb3JlaWduX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzdHJvbmc+RmlzaGVyaWVzIGFuZCBBcXVhY3VsdHVyZSBzaGFyZSBvZiBHRFA6PC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj5OdW1iZXIgb2YgQ291bnRyaWVzIHdpdGggR0RQIFNoYXJlOjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjFcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QmVsb3cgNSU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5CZXR3ZWVuIDUlIGFuZCAxMCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5BdmVyYWdlIEdEUCBTaGFyZSBpbiBBcmVhIG9mIEludGVyZXN0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImdkcF92YWx1ZVwiLGMscCwxKSxjLHAsMCw5NzY2LDk5MDEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkJFTE9XNVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFCT1ZFNVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFWR1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzdHJvbmc+RmlzaGVyaWVzIGFuZCBBcXVhY3VsdHVyZSBzaGFyZSBvZiBUb3RhbCBFeHBvcnQ6PC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIzXFxcIj5OdW1iZXIgb2YgQ291bnRyaWVzIHdpdGggRXhwb3J0IFNoYXJlOjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjFcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QmVsb3cgMzAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QmV0d2VlbiAzMCUgYW5kIDcwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk92ZXIgNzAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXZlcmFnZSBFeHBvcnQgU2hhcmUgaW4gQXJlYSBvZiBJbnRlcmVzdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleHBvcnRfdmFsdWVcIixjLHAsMSksYyxwLDAsMTA0NjUsMTA2MzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkJFTE9XMzBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJCRUxPVzcwXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQUJPVkU3MFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFWR1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkFxdWFjdWx0dXJlIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzllZVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBhcXVhY3VsdHVyZSBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjZcXFwiPlNwZWNpZXMgKFRvbm5lcyk6PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+VG90YWwgVG9ubmVzIEluOjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+UHJhd25zPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+T3lzdGVyPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+U2hyaW1wPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q3JhYjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlRpbGFwaWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NaWxrZmlzaDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFyZWEgb2YgSW50ZXJlc3Q8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5QQUNJT0NFQSBSZWdpb248L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXF1YVwiLGMscCwxKSxjLHAsMCwxMTM1NSwxMTY1NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUHJhd25cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJPeXN0ZXJcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTaHJpbXBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDcmFiXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVGlsYXBpYVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk1pbGtmaXNoXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQU9JX1RPVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRPVF9UT05TXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VG91cmlzbTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVG91cmlzbSBhY2NvdW50ZWQgZm9yIGFuIGF2ZXJhZ2Ugb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJnZHBfcGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIEdEUCBvZiB0aGUgY291bnRyaWVzIHdpdGhpbiB0aGUgc2tldGNoLiBUaGlzIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiaW50bF90b3VyaXN0X2Fycml2YWxfdG90YWxcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gaW50ZXJuYXRpb25hbCB0b3VyaXN0cywgd2hpY2ggaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgaW50ZXJuYXRpb25hbCB0b3VyaXN0cyB3aXRoaW4gdGhlIFBBQ0lPQ0VBIHJlZ2lvbi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5DaGFuZ2UgaW4gVG91cmlzbTo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TnVtYmVyIG9mIENvdW50cmllcyB3aGVyZSBUb3VyaXNtIERlY3JlYXNlZDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk51bWJlciBvZiBDb3VudHJpZXMgd2hlcmUgVG91cmlzbSBJbmNyZWFzZWQgYnkgPCAxMDAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TnVtYmVyIG9mIENvdW50cmllcyB3aGVyZSBUb3VyaXNtIEluY3JlYXNlZCBieSA+IDEwMCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwidG91cmlzdF9hcnJpdmFsc1wiLGMscCwxKSxjLHAsMCwxMjUyMiwxMjY1OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiREVDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTEVTUzEwMFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk1PUkUxMDBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+VG91cmlzbSB2cyBQb3B1bGF0aW9uOjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5OdW1iZXIgb2YgQ291bnRyaWVzIHdoZXJlIG51bWJlciBvZiBUb3VyaXN0cyB2aXNpdGluZyBpcyBHcmVhdGVyIHRoYW4gUG9wdWxhdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ0b3VyaXN0X3BvcFwiLGMscCwxKSxjLHAsMCwxMjk5OSwxMzA3NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVE9VUl9QT1BcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW5lcmd5PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+UmVuZXdhYmxlIEVuZXJneTogJm5ic3A8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZDJcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgcmVuZXdhYmxlIGVuZXJneSBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzX3JlbmV3YWJsZV9lbmVyZ3lcIixjLHAsMSksYyxwLDAsMTMzOTMsMTQxNDksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPkNvdW50cmllcyB3aXRoaW4gdGhlIHNrZXRjaCBnZW5lcmF0ZSBhbiBhdmVyYWdlIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXZnX3JlbmV3YWJsZV9lbmVyZ3lcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZWlyIGVuZXJneSBmcm9tIHJlbmV3YWJsZSBzb3VyY2VzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiNFxcXCI+UGVyY2VudGFnZSBvZiBFbmVyZ3kgR2VuZXJhdGVkIGJ5IFJlbmV3YWJsZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkxlc3MgdGhhbiA0MCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5CZXR3ZWVuIDQwJSBhbmQgODAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TW9yZSB0aGFuIDgwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJyZW5ld2FibGVfZW5lcmd5XCIsYyxwLDEpLGMscCwwLDEzOTA4LDE0MDkxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5OdW1iZXIgb2YgQ291bnRyaWVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVU5ERVJfNDBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJPVkVSXzQwXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiT1ZFUl84MFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaGFzX3JlbmV3YWJsZV9lbmVyZ3lcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPk5vIFJlbmV3YWJsZSBFbmVyZ3kgRGF0YSBBdmFpbGFibGU8L3A+XCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5GdWVsIEltcG9ydHM6ICZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWQwXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGZ1ZWwgaW1wb3J0IGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNfZnVlbF9pbXBvcnRcIixjLHAsMSksYyxwLDAsMTQ0ODYsMTUyNDQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHA+Q291bnRyaWVzIHdpdGhpbiB0aGUgc2tldGNoIGltcG9ydCBhbiBhdmVyYWdlIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXZnX2Z1ZWxfaW1wb3J0XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGVpciBmdWVsLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCI0XFxcIj5QZXJjZW50YWdlIG9mIEZ1ZWwgZnJvbSBJbXBvcnRzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGg+PC90aD4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0aD5MZXNzIHRoYW4gNSU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGg+QmV0d2VlbiA1JSBhbmQgMjAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRoPk1vcmUgdGhhbiAyMCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZnVlbF9pbXBvcnRcIixjLHAsMSksYyxwLDAsMTQ5OTAsMTUxODUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5OdW1iZXIgb2YgQ291bnRyaWVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJVTkRFUl81XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJPVkVSXzVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk9WRVJfMjBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc19mdWVsX2ltcG9ydFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5ObyBGdWVsIEltcG9ydCBEYXRhIEF2YWlsYWJsZTwvcD5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSJdfQ==
