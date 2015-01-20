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

  BiodiversityTab.prototype.dependencies = ['Biodiversity'];

  BiodiversityTab.prototype.render = function() {
    var attributes, context, coral_area, coral_perc, d3IsPresent, isCollection, mangroves_area, mangroves_perc, seagrass_area, seagrass_perc;
    coral_area = this.recordSet('Biodiversity', 'Coral').float('AREA_KM');
    coral_perc = this.recordSet('Biodiversity', 'Coral').float('AREA_PERC');
    mangroves_area = this.recordSet('Biodiversity', 'Mangroves').float('AREA_KM');
    mangroves_perc = this.recordSet('Biodiversity', 'Mangroves').float('AREA_PERC');
    seagrass_area = this.recordSet('Biodiversity', 'Seagrass').float('AREA_KM');
    seagrass_perc = this.recordSet('Biodiversity', 'Seagrass').float('AREA_PERC');
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
      isCollection: isCollection,
      coral_area: coral_area,
      coral_perc: coral_perc,
      mangroves_area: mangroves_area,
      mangroves_perc: mangroves_perc,
      seagrass_area: seagrass_area,
      seagrass_perc: seagrass_perc
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
    var aqua, attributes, avg_comm_catch, avg_depth_seamounts, avg_dist_seamounts, avg_fisheries_aqua_catch, avg_fisheries_coastal_catch, avg_fisheries_domestic_catch, avg_fisheries_foreign_catch, avg_fuel_import, avg_ocean_catch, avg_renewable_energy, avg_sub_catch, coastal_catch, col_values, commercial_catch, context, cruise_ships, cruise_ships_perc, export_value, fisheries, fuel_import, gdp_percent, gdp_value, has_comm_catch, has_cruiseship_visits, has_fuel_import, has_international_tourists, has_ocean_catch, has_renewable_energy, has_seamounts, has_subsistence_catch, intl_tourist_arrival_perc, intl_tourist_arrival_total, isCollection, mining, msg, new_size, num_seamounts, ocean_catch, renewable_energy, seamounts, size, subsistence_catch, tot_comm_catch, tot_fisheries_aqua_catch, tot_fisheries_coastal_catch, tot_fisheries_domestic_catch, tot_fisheries_foreign_catch, tot_ocean_catch, tot_sub_catch, tourist_arrivals, tourist_pop;
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
    has_international_tourists = intl_tourist_arrival_total > 0;
    if (has_international_tourists) {
      intl_tourist_arrival_total = this.addCommas(intl_tourist_arrival_total);
    }
    intl_tourist_arrival_perc = this.recordSet('Tourism', 'InternationalArrivals').float('IA_PERC');
    if (intl_tourist_arrival_perc > 0.1) {
      intl_tourist_arrival_perc = intl_tourist_arrival_perc.toFixed(1);
    }
    cruise_ships = this.recordSet('Tourism', 'Cruiseships').float('Ports');
    has_cruiseship_visits = cruise_ships > 0;
    cruise_ships_perc = this.recordSet('Tourism', 'Cruiseships').float('CR_PERC');
    if (cruise_ships_perc > 0.1) {
      cruise_ships_perc = cruise_ships_perc.toFixed(1);
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
      intl_tourist_arrival_perc: intl_tourist_arrival_perc,
      has_international_tourists: has_international_tourists,
      cruise_ships: cruise_ships,
      cruise_ships_perc: cruise_ships_perc,
      has_cruiseship_visits: has_cruiseship_visits
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
this["Templates"]["biodiversity"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Biodiversity</h4>");_.b("\n" + i);_.b("    <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</a></th>");_.b("\n" + i);_.b("        <th>Area (% of total region)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("     </thead>");_.b("\n" + i);_.b("     <tbody> ");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("  		<td>Coral</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("coral_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("coral_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("  		<td>Mangroves</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("mangroves_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("mangroves_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("       <tr>");_.b("\n" + i);_.b("  		<td>Seagrass</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("seagrass_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("seagrass_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("  	The table shows the area of the habitat type (in square kilometers) within the ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch,");_.b("\n");};_.b("  	");if(_.s(_.f("isCollection",c,p,1),c,p,0,1074,1085,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection,");});c.pop();}_.b(" as well as the percent of the total PACIOCEA habitat found within each ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch.");};_.b("\n" + i);_.b("  	");if(_.s(_.f("isCollection",c,p,1),c,p,0,1236,1247,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection.");});c.pop();}_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["economy"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This ");if(_.s(_.f("isCollection",c,p,1),c,p,0,392,402,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Deep Sea </h4>");_.b("\n" + i);_.b("  <div class=\"in-report-header\">Deep Sea Minerals: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d3\" data-visible=\"false\">show mineral layers");_.b("\n" + i);_.b("  </a></div>");_.b("\n" + i);_.b("  <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:170px;\">Type</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</a></th>");_.b("\n" + i);_.b("        <th>Area (% of total region)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);if(_.s(_.f("mining",c,p,1),c,p,0,943,1060,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SIZE_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </thead>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The deep sea resources available for extraction are divided into 4 types:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Polymetallic Nodules (Manganese, Copper, Nickel, Cobalt) - 4,000 - 6,000 m depth</li>");_.b("\n" + i);_.b("        <li>Cobalt-rich Manganese Crusts (Cobalt) - 800 - 3,000 m depth</li>");_.b("\n" + i);_.b("        <li>Sulphide Deposits (Copper) - 1,500 - 4,000 m depth</li>");_.b("\n" + i);_.b("        <li>Deep-sea mud (rare earth elements, yttrium) - 2,000 -6,000 m depth.</li>                                               ");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("          The DSM deposits are higher in mineral content than on-land deposits. Typical value of a tonne of land based ore is 50-200 USD, for sea floor deposits it’s 500-1500 USD. DSM mining in the PACIOCEA  has a strong potential.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"in-report-header\">Habitats in Seamounts: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d6\" data-visible=\"false\">show seamount layer");_.b("\n" + i);_.b("  </a></div>");_.b("\n" + i);_.b("  <p style=\"padding-top:5px;\"> The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,2172,2182,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" includes <strong>");_.b(_.v(_.f("num_seamounts",c,p,0)));_.b(" seamounts</strong> with an average depth of <strong>");_.b(_.v(_.f("avg_depth_seamounts",c,p,0)));_.b(" meters.</strong>");_.b("\n" + i);if(_.s(_.f("has_seamounts",c,p,1),c,p,0,2400,2607,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    The average distance between seamounts within the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,2473,2483,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of ");_.b("\n" + i);_.b("    interest ");};_.b(" is <strong>");_.b(_.v(_.f("avg_dist_seamounts",c,p,0)));_.b(" km</strong>.");_.b("\n");});c.pop();}_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The physical structure of some seamounts enables the formation of hydrographic features and current flows that can:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Enhance local production through upwelling </li>");_.b("\n" + i);_.b("        <li>Keep species and production processes concentrated over the seamount  </li>");_.b("\n" + i);_.b("        <li>Have a concentration of zooplankton and mesopelagic fish meaning rich feeding grounds and spawning areas for fish and higher predators, and hence fisheries. Seamounts are a hotspot for biodiverstiy but are still understudied.</li>");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Coastal Fisheries </h4>");_.b("\n" + i);_.b("\n" + i);_.b("      <div class=\"in-report-header\">Coastal Catch: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e9\" data-visible=\"false\">show coastal catch layer</a></div>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch (in tonnes)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>% of Total Catch</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("            <th>Demersal </th>");_.b("\n" + i);_.b("            <th>Pelagic  </th>");_.b("\n" + i);_.b("            <th>Invertebrate </th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("coastal_catch",c,p,1),c,p,0,3982,4227,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOT_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEM_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PEL_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("INV_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Commercial Catch:  <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9eb\" data-visible=\"false\">show commercial/subsistence catch layer</a></div>");_.b("\n" + i);if(_.s(_.f("has_comm_catch",c,p,1),c,p,0,4483,4765,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The average commercial catch across EEZs in this area of interest is <strong>");_.b(_.v(_.f("avg_comm_catch",c,p,0)));_.b(" kg per person</strong>. ");_.b("\n" + i);_.b("        The average commercial catch within the entire PACIOCEA region is <strong>");_.b(_.v(_.f("tot_comm_catch",c,p,0)));_.b(" kg per person</strong>.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Catch (kg per capita)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("commercial_catch",c,p,1),c,p,0,5000,5107,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Subsistence Catch:</div>");_.b("\n" + i);if(_.s(_.f("has_subsistence_catch",c,p,1),c,p,0,5254,5536,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The average subsistence catch across EEZs in this area of interest is <strong>");_.b(_.v(_.f("avg_sub_catch",c,p,0)));_.b(" kg per person</strong>. ");_.b("\n" + i);_.b("        The average subsistence catch within the entire PACIOCEA region is <strong>");_.b(_.v(_.f("tot_sub_catch",c,p,0)));_.b(" kg per person</strong>.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Catch (kg per capita)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("subsistence_catch",c,p,1),c,p,0,5778,5885,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Oceanic Fisheries <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e6\" data-visible=\"false\">show oceanic catch layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The average oceanic catch across EEZs in this area of interest is <strong>");_.b(_.v(_.f("avg_ocean_catch",c,p,0)));_.b(" tonnes.</strong>");_.b("\n" + i);_.b("        The total ocean catch within the entire PACIOCEA region is <strong>");_.b(_.v(_.f("tot_ocean_catch",c,p,0)));_.b(" tonnes</strong>.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Domestic Catch</th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Foreign Catch</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Total (tonnes)</th>");_.b("\n" + i);_.b("            <th>tonnes </th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("            <th>tonnes</th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("ocean_catch",c,p,1),c,p,0,6879,7118,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_DOM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DOM_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_FRN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("FRN_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Fisheries Economy<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e1\" data-visible=\"false\">");_.b("\n" + i);_.b("      show fisheries economy layers</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries economy values in each country:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch in MUSD</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Coast</th>");_.b("\n" + i);_.b("            <th>Aquaculture </th>");_.b("\n" + i);_.b("            <th>Domestic</th>");_.b("\n" + i);_.b("            <th>Foreign</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("fisheries",c,p,1),c,p,0,7848,8046,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Coast",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Aqua",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Dom",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Foreign",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Average fisheries economy values in the area of interest:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Coast</th>");_.b("\n" + i);_.b("            <th>Aquaculture</th>");_.b("\n" + i);_.b("            <th>Domestic</th>");_.b("\n" + i);_.b("            <th>Foreign</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_coastal_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_aqua_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_domestic_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("avg_fisheries_foreign_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Total fisheries economy value in PACIOCEA region:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Coast</th>");_.b("\n" + i);_.b("            <th>Aquaculture</th>");_.b("\n" + i);_.b("            <th>Domestic</th>");_.b("\n" + i);_.b("            <th>Foreign</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_coastal_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_aqua_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_domestic_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("tot_fisheries_foreign_catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of GDP:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\">Number of Countries with GDP Share:</th>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Below 5%</th>");_.b("\n" + i);_.b("            <th>Between 5% and 10%</th>");_.b("\n" + i);_.b("            <th>Average GDP Share in Area of Interest</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("gdp_value",c,p,1),c,p,0,9766,9901,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("BELOW5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("ABOVE5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AVG",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of Total Export:</strong>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"3\">Number of Countries with Export Share:</th>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Below 30%</th>");_.b("\n" + i);_.b("            <th>Between 30% and 70%</th>");_.b("\n" + i);_.b("            <th>Over 70%</th>");_.b("\n" + i);_.b("            <th>Average Export Share in Area of Interest</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("export_value",c,p,1),c,p,0,10465,10635,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("BELOW30",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("BELOW70",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("ABOVE70",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AVG",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Aquaculture <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9ee\" data-visible=\"false\">show aquaculture layer</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"6\">Species (Tonnes):</th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Total Tonnes In:</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Prawns</th>");_.b("\n" + i);_.b("            <th>Oyster</th>");_.b("\n" + i);_.b("            <th>Shrimp</th>");_.b("\n" + i);_.b("            <th>Crab</th>");_.b("\n" + i);_.b("            <th>Tilapia</th>");_.b("\n" + i);_.b("            <th>Milkfish</th>");_.b("\n" + i);_.b("            <th>Area of Interest</th>");_.b("\n" + i);_.b("            <th>PACIOCEA Region</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("aqua",c,p,1),c,p,0,11355,11656,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Prawn",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Oyster",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Shrimp",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Crab",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Tilapia",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Milkfish",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AOI_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOT_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Tourism</h4>");_.b("\n" + i);_.b("    <p class=\"large\">");_.b("\n" + i);_.b("      Tourism accounted for an average of <strong>");_.b(_.v(_.f("gdp_percent",c,p,0)));_.b("%</strong> of the GDP of the countries within the sketch. ");if(_.s(_.f("has_cruiseship_visits",c,p,1),c,p,0,11938,12122,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("This includes <strong>");_.b(_.v(_.f("cruise_ships",c,p,0)));_.b("</strong> cruise ship visits, which is <strong>");_.b("\n" + i);_.b("      ");_.b(_.v(_.f("cruise_ships_perc",c,p,0)));_.b("%</strong> of the cruise ship visits within the PACIOCEA region.");_.b("\n");});c.pop();}_.b("      ");if(!_.s(_.f("has_cruiseship_visits",c,p,1),c,p,1,0,0,"")){_.b("There were <strong>no</strong> cruiseship visits to countries within the sketch.");};_.b("\n" + i);_.b("    </p>");_.b("\n" + i);_.b("    <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("has_international_tourists",c,p,1),c,p,0,12356,12575,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      There were <strong>");_.b(_.v(_.f("intl_tourist_arrival_total",c,p,0)));_.b("</strong> international tourists, which is <strong>");_.b("\n" + i);_.b("      ");_.b(_.v(_.f("intl_tourist_arrival_perc",c,p,0)));_.b("%</strong> of the international tourists within the PACIOCEA region. ");_.b("\n");});c.pop();}_.b("      ");if(!_.s(_.f("has_international_tourists",c,p,1),c,p,1,0,0,"")){_.b(" There were <strong>no</strong> international tourists to the countries within the");_.b("\n" + i);_.b("      sketch.");};_.b("\n" + i);_.b("    </p>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Change in Tourism:</div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Decreased</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by < 100%</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by > 100%</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_arrivals",c,p,1),c,p,0,13180,13317,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("LESS100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("MORE100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("    <div class=\"in-report-header\">Tourism vs Population:</div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Number of Countries where number of Tourists visiting is Greater than Population</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_pop",c,p,1),c,p,0,13657,13733,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOUR_POP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Energy</h4>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Renewable Energy: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d2\" data-visible=\"false\">show renewable energy layer</a></div>");_.b("\n" + i);if(_.s(_.f("has_renewable_energy",c,p,1),c,p,0,14051,14807,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>Countries within the sketch generate an average of <strong>");_.b(_.v(_.f("avg_renewable_energy",c,p,0)));_.b("%</strong> of their energy from renewable sources.</p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"4\">Percentage of Energy Generated by Renewables</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th></th>");_.b("\n" + i);_.b("            <th>Less than 40%</th>");_.b("\n" + i);_.b("            <th>Between 40% and 80%</th>");_.b("\n" + i);_.b("            <th>More than 80%</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("renewable_energy",c,p,1),c,p,0,14566,14749,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>Number of Countries</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("UNDER_40",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("OVER_40",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("OVER_80",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");});c.pop();}if(!_.s(_.f("has_renewable_energy",c,p,1),c,p,1,0,0,"")){_.b("      <p class=\"large\">No Renewable Energy Data Available</p>");_.b("\n");};_.b("    <div class=\"in-report-header\">Fuel Imports: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d0\" data-visible=\"false\">show fuel import layer</a></div>");_.b("\n" + i);if(_.s(_.f("has_fuel_import",c,p,1),c,p,0,15144,15902,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <p>Countries within the sketch import an average of <strong>");_.b(_.v(_.f("avg_fuel_import",c,p,0)));_.b("%</strong> of their fuel.</p>");_.b("\n" + i);_.b("        <table>");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th colspan=\"4\">Percentage of Fuel from Imports</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("              <tr>");_.b("\n" + i);_.b("                <th></th> ");_.b("\n" + i);_.b("                <th>Less than 5%</th>");_.b("\n" + i);_.b("                <th>Between 5% and 20%</th>");_.b("\n" + i);_.b("                <th>More than 20%</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("fuel_import",c,p,1),c,p,0,15648,15843,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Number of Countries</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("UNDER_5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("OVER_5",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("OVER_20",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");});c.pop();}if(!_.s(_.f("has_fuel_import",c,p,1),c,p,1,0,0,"")){_.b("        <p class=\"large\">No Fuel Import Data Available</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvam9iSXRlbS5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy91dGlscy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvc2NyaXB0cy9hZGFwdGF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Jhc2VSZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvYmlvZGl2ZXJzaXR5LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Vjb25vbXkuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxD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aEJSOztDQUZ1Qjs7QUFrTnpCLENBM05BLEVBMk5pQixHQUFYLENBQU4sR0EzTkE7Ozs7QUNBQSxJQUFBLHNDQUFBOztBQUFBLENBQUEsRUFBYSxJQUFBLEdBQWIsUUFBYTs7QUFDYixDQURBLEVBQ2dCLElBQUEsTUFBaEIsUUFBZ0I7O0FBQ2hCLENBRkEsRUFFa0IsSUFBQSxRQUFsQixRQUFrQjs7QUFFbEIsQ0FKQSxFQUlVLEdBQUosR0FBcUIsS0FBM0I7Q0FDRSxDQUFBLEVBQUEsRUFBTSxJQUFNLEdBQUEsRUFBQTtDQUVMLEtBQUQsR0FBTixFQUFBLEdBQW1CO0NBSEs7Ozs7QUNKMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGNvbnNvbGUubG9nIEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJylcbiAgICAgICAgICBwYXlsb2FkU2l6ZSA9IE1hdGgucm91bmQoKChAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpIG9yIDApIC8gMTAyNCkgKiAxMDApIC8gMTAwXG4gICAgICAgICAgY29uc29sZS5sb2cgXCJGZWF0dXJlU2V0IHNlbnQgdG8gR1Agd2VpZ2hlZCBpbiBhdCAje3BheWxvYWRTaXplfWtiXCJcbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3JcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PlxuICAgICAgICB2LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz9bJ1NDX0lEJ10gaXMgQHNrZXRjaENsYXNzSWRcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXdcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQCQoJ1tkYXRhLWF0dHJpYnV0ZS10eXBlPVVybEZpZWxkXSAudmFsdWUsIFtkYXRhLWF0dHJpYnV0ZS10eXBlPVVwbG9hZEZpZWxkXSAudmFsdWUnKS5lYWNoICgpIC0+XG4gICAgICAgIHRleHQgPSAkKEApLnRleHQoKVxuICAgICAgICBodG1sID0gW11cbiAgICAgICAgZm9yIHVybCBpbiB0ZXh0LnNwbGl0KCcsJylcbiAgICAgICAgICBpZiB1cmwubGVuZ3RoXG4gICAgICAgICAgICBuYW1lID0gXy5sYXN0KHVybC5zcGxpdCgnLycpKVxuICAgICAgICAgICAgaHRtbC5wdXNoIFwiXCJcIjxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIje3VybH1cIj4je25hbWV9PC9hPlwiXCJcIlxuICAgICAgICAkKEApLmh0bWwgaHRtbC5qb2luKCcsICcpXG5cblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKEBtYXhFdGEgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tAbWF4RXRhICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhU2Vjb25kcycpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+XG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG5cbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKVxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsMTIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZighXy5zKF8uZihcImRvTm90RXhwb3J0XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9O30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iLCJCYXNlUmVwb3J0VGFiID0gcmVxdWlyZSAnYmFzZVJlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBBZGFwdGF0aW9uVGFiIGV4dGVuZHMgQmFzZVJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdBZGFwdGF0aW9uJ1xuICBjbGFzc05hbWU6ICdhZGFwdGF0aW9uJ1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGFwdGF0aW9uXG4gIGRlcGVuZGVuY2llczogW1xuICAgICdIYWJpdGF0J1xuICAgICdQb3B1bGF0aW9uJ1xuICBdXG5cblxuICByZW5kZXI6ICgpIC0+XG4gICAgaGFiaXRhdF9kYXRhID0gQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0UHJlc2VuY2UnKS50b0FycmF5KClcblxuICAgIGlmIGhhYml0YXRfZGF0YT8ubGVuZ3RoID4gMFxuICAgICAgaGFzX2NvcmFsID0gQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0UHJlc2VuY2UnKS5ib29sKCdDb3JhbCcpXG4gICAgICBoYXNfc2VhZ3Jhc3MgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRQcmVzZW5jZScpLmJvb2woJ1NlYWdyYXNzJylcbiAgICAgIGhhc19tYW5ncm92ZXMgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRQcmVzZW5jZScpLmJvb2woJ01hbmdyb3ZlJylcbiAgICBlbHNlXG4gICAgICBoYXNfY29yYWwgPSBmYWxzZVxuICAgICAgaGFzX3NlYWdyYXNzID0gZmFsc2VcbiAgICAgIGhhc19tYW5ncm92ZXMgPSBmYWxzZVxuICAgIGhhc19ub19oYWJpdGF0cyA9ICFoYXNfY29yYWwgYW5kICFoYXNfc2VhZ3Jhc3MgYW5kICFoYXNfbWFuZ3JvdmVzXG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBudW1wZW9wbGUgPSBAcmVjb3JkU2V0KCdQb3B1bGF0aW9uJywgJ1BvcHVsYXRpb24nKS5mbG9hdCgnUG9wdWxhdGlvbicpXG4gICAgbnVtcGVvcGxlID0gQGFkZENvbW1hcyBudW1wZW9wbGVcbiAgICBwZXJjcGVvcGxlID0gQHJlY29yZFNldCgnUG9wdWxhdGlvbicsICdQb3B1bGF0aW9uJykuZmxvYXQoJ1BFUkNfUE9QJylcbiAgICAjc2hvdyB0YWJsZXMgaW5zdGVhZCBvZiBncmFwaCBmb3IgSUVcbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIGQzSXNQcmVzZW50ID0gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGQzSXNQcmVzZW50ID0gZmFsc2VcblxuICAgIGF0dHJpYnV0ZXMgPSBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFueUF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCkubGVuZ3RoID4gMFxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBcbiAgICAgIGhhc19jb3JhbDogaGFzX2NvcmFsXG4gICAgICBoYXNfbWFuZ3JvdmVzOiBoYXNfbWFuZ3JvdmVzXG4gICAgICBoYXNfc2VhZ3Jhc3M6IGhhc19zZWFncmFzc1xuICAgICAgaGFzX25vX2hhYml0YXRzOiBoYXNfbm9faGFiaXRhdHNcbiAgICAgIG51bXBlb3BsZTogbnVtcGVvcGxlXG4gICAgICBwZXJjcGVvcGxlOiBwZXJjcGVvcGxlXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbiBcbm1vZHVsZS5leHBvcnRzID0gQWRhcHRhdGlvblRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBCYXNlUmVwb3J0VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gICMgdGhpcyBpcyB0aGUgbmFtZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBUYWJcbiAgbmFtZTogJ0Jhc2VSZXBvcnQnXG4gIGNsYXNzTmFtZTogJ2Jhc2VyZXBvcnQnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICBldmVudHM6XG4gICAgXCJjbGljayBhLmRldGFpbHNcIjogJ29uTW9yZVJlc3VsdHNDbGljaydcblxuICAjbm90IHVzZWQgeWV0XG4gIHNldHVwVGFibGVTb3J0aW5nOiAoZGF0YSwgdGJvZHlOYW1lLCB0YWJsZU5hbWUsIGRhdGFfdmFsdWUsIGNvbF92YWx1ZXMsIHJvd19uYW1lLCBzZWxlY3RlZF9jb2xfcHJlZml4KSA9PlxuICAgIGluZGV4ID0gMFxuICAgIGRlZmF1bHRfc29ydF9rZXkgPSBcIlwiXG4gICAgZGVmYXVsdF9zb3J0X2RhdGEgPSBcIlwiXG4gICAgZGVmYXVsdF9yb3dfZGF0YSA9IFwiXCJcbiAgICBkYXRhX2NvbHMgPSAodiBmb3IgaywgdiBvZiBjb2xfdmFsdWVzKVxuICAgIGZvciBrLHYgaW4gY29sX3ZhbHVlc1xuICAgICAgQCQoJy4nK2spLmNsaWNrIChldmVudCkgPT5cbiAgICAgICAgQHJlbmRlclNvcnQoaywgdGFibGVOYW1lLCBkYXRhX3ZhbHVlLCBldmVudCwgdiwgdGJvZHlOYW1lLCAoaW5kZXggPiAwKSwgXG4gICAgICAgICAgQGdldFRhYmxlUm93LCByb3dfbmFtZSwgZGF0YV9jb2xzLCBzZWxlY3RlZF9jb2xfcHJlZml4KVxuICAgICAgaWYgaW5kZXggPT0gMFxuICAgICAgICBkZWZhdWx0X3NvcnRfa2V5ID0ga1xuICAgICAgICBkZWZhdWx0X3NvcnRfZGF0YSA9IGRhdGFfdmFsdWVcbiAgICAgICAgZGVmYXVsdF9yb3dfZGF0YSA9IEBnZXRUYWJsZVJvd1xuICAgICAgaW5kZXgrPTFcblxuICAgIEByZW5kZXJTb3J0KGRlZmF1bHRfc29ydF9rZXksIHRhYmxlTmFtZSwgZGVmYXVsdF9zb3J0X2RhdGEsIHVuZGVmaW5lZCwgZGVmYXVsdF9zb3J0X2RhdGEsIHRib2R5TmFtZSwgXG4gICAgICBmYWxzZSwgZGVmYXVsdF9yb3dfZGF0YSwgcm93X25hbWUsIGRhdGFfY29scywgc2VsZWN0ZWRfY29sX3ByZWZpeClcblxuICAjZG8gdGhlIHNvcnRpbmcgLSBzaG91bGQgYmUgdGFibGUgaW5kZXBlbmRlbnRcbiAgI3NraXAgYW55IHRoYXQgYXJlIGxlc3MgdGhhbiAwLjAwXG4gIHJlbmRlclNvcnQ6IChuYW1lLCB0YWJsZU5hbWUsIHBkYXRhLCBldmVudCwgc29ydEJ5LCB0Ym9keU5hbWUsIGlzRmxvYXQsIGdldFJvd1N0cmluZ1ZhbHVlLCByb3dfbmFtZSwgZGF0YV9jb2xzLFxuICAgIHNlbGVjdGVkX2NvbF9wcmVmaXgpID0+XG4gICAgaWYgZXZlbnRcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICB0YXJnZXRDb2x1bW4gPSBAZ2V0U2VsZWN0ZWRDb2x1bW4oZXZlbnQsIG5hbWUsIHNlbGVjdGVkX2NvbF9wcmVmaXgpXG4gICAgICBzb3J0VXAgPSBAZ2V0U29ydERpcih0YXJnZXRDb2x1bW4pXG5cbiAgICAgIGlmIGlzRmxvYXRcbiAgICAgICAgZGF0YSA9IF8uc29ydEJ5IHBkYXRhLCAocm93KSAtPiAgcGFyc2VGbG9hdChyb3dbc29ydEJ5XSlcbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IF8uc29ydEJ5IHBkYXRhLCAocm93KSAtPiByb3dbc29ydEJ5XVxuXG4gICAgICAjZmxpcCBzb3J0aW5nIGlmIG5lZWRlZFxuICAgICAgaWYgc29ydFVwXG4gICAgICAgIGRhdGEucmV2ZXJzZSgpXG5cbiAgICAgIGVsID0gQCQodGJvZHlOYW1lKVswXVxuICAgICAgaGFiX2JvZHkgPSBkMy5zZWxlY3QoZWwpXG5cbiAgICAgICNyZW1vdmUgb2xkIHJvd3NcbiAgICAgIGhhYl9ib2R5LnNlbGVjdEFsbChcInRyLlwiK3Jvd19uYW1lKVxuICAgICAgICAucmVtb3ZlKClcblxuICAgICAgI2FkZCBuZXcgcm93cyAoYW5kIGRhdGEpXG4gICAgICByb3dzID0gaGFiX2JvZHkuc2VsZWN0QWxsKFwidHJcIilcbiAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAuZW50ZXIoKS5pbnNlcnQoXCJ0clwiLCBcIjpmaXJzdC1jaGlsZFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIHJvd19uYW1lKVxuXG4gICAgICBcbiAgICAgIGNlbGxzID0gcm93cy5zZWxlY3RBbGwoXCJ0ZFwiKVxuICAgICAgICAgIC5kYXRhKChyb3csIGkpIC0+ZGF0YV9jb2xzLm1hcCAoY29sdW1uKSAtPiAoY29sdW1uOiBjb2x1bW4sIHZhbHVlOiByb3dbY29sdW1uXSkpXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJ0ZFwiKS50ZXh0KChkLCBpKSAtPiBcbiAgICAgICAgICBkLnZhbHVlXG4gICAgICAgICkgICAgXG5cbiAgICAgIEBzZXROZXdTb3J0RGlyKHRhcmdldENvbHVtbiwgc29ydFVwKVxuICAgICAgQHNldFNvcnRpbmdDb2xvcihldmVudCwgdGFibGVOYW1lKVxuICAgICAgI2ZpcmUgdGhlIGV2ZW50IGZvciB0aGUgYWN0aXZlIHBhZ2UgaWYgcGFnaW5hdGlvbiBpcyBwcmVzZW50XG4gICAgICBAZmlyZVBhZ2luYXRpb24odGFibGVOYW1lKVxuICAgICAgaWYgZXZlbnRcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAjdGFibGUgcm93IGZvciBoYWJpdGF0IHJlcHJlc2VudGF0aW9uXG4gIGdldFRhYmxlUm93OiAoZCwgZGF0YV9jb2xzKSA9PlxuICAgIHJldHVybiBcIjx0ZD5cIitkW2RhdGFfY29sc1swXV0rXCI8L3RkPlwiK1wiPHRkPlwiK2RbZGF0YV9jb2xzWzFdXStcIjwvdGQ+XCIrXCI8dGQ+XCIrZFtkYXRhX2NvbHNbMl1dK1wiPC90ZD5cIlxuXG4gIHNldFNvcnRpbmdDb2xvcjogKGV2ZW50LCB0YWJsZU5hbWUpID0+XG4gICAgc29ydGluZ0NsYXNzID0gXCJzb3J0aW5nX2NvbFwiXG4gICAgaWYgZXZlbnRcbiAgICAgIHBhcmVudCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkucGFyZW50KClcbiAgICAgIG5ld1RhcmdldE5hbWUgPSBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZVxuICAgICAgdGFyZ2V0U3RyID0gdGFibGVOYW1lK1wiIHRoLnNvcnRpbmdfY29sIGFcIiAgIFxuICAgICAgaWYgQCQodGFyZ2V0U3RyKSBhbmQgQCQodGFyZ2V0U3RyKVswXVxuICAgICAgICBvbGRUYXJnZXROYW1lID0gQCQodGFyZ2V0U3RyKVswXS5jbGFzc05hbWVcbiAgICAgICAgaWYgbmV3VGFyZ2V0TmFtZSAhPSBvbGRUYXJnZXROYW1lXG4gICAgICAgICAgI3JlbW92ZSBpdCBmcm9tIG9sZCBcbiAgICAgICAgICBoZWFkZXJOYW1lID0gdGFibGVOYW1lK1wiIHRoLnNvcnRpbmdfY29sXCJcbiAgICAgICAgICBAJChoZWFkZXJOYW1lKS5yZW1vdmVDbGFzcyhzb3J0aW5nQ2xhc3MpXG4gICAgICAgICAgI2FuZCBhZGQgaXQgdG8gbmV3XG4gICAgICAgICAgcGFyZW50LmFkZENsYXNzKHNvcnRpbmdDbGFzcylcbiAgICAgXG4gIGdldFNvcnREaXI6ICh0YXJnZXRDb2x1bW4pID0+XG4gICAgIHNvcnR1cCA9IEAkKCcuJyt0YXJnZXRDb2x1bW4pLmhhc0NsYXNzKFwic29ydF91cFwiKVxuICAgICByZXR1cm4gc29ydHVwXG5cbiAgZ2V0U2VsZWN0ZWRDb2x1bW46IChldmVudCwgbmFtZSwgcHJlZml4X3N0cikgPT5cbiAgICBpZiBldmVudFxuICAgICAgI2dldCBzb3J0IG9yZGVyXG4gICAgICB0YXJnZXRDb2x1bW4gPSBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZVxuICAgICAgbXVsdGlDbGFzc2VzID0gdGFyZ2V0Q29sdW1uLnNwbGl0KCcgJylcblxuICAgICAgdGd0Q2xhc3NOYW1lID1fLmZpbmQgbXVsdGlDbGFzc2VzLCAoY2xhc3NuYW1lKSAtPiBcbiAgICAgICAgY2xhc3NuYW1lLmxhc3RJbmRleE9mKHByZWZpeF9zdHIsMCkgPT0gMFxuICAgICAgdGFyZ2V0Q29sdW1uID0gdGd0Q2xhc3NOYW1lXG4gICAgZWxzZVxuICAgICAgI3doZW4gdGhlcmUgaXMgbm8gZXZlbnQsIGZpcnN0IHRpbWUgdGFibGUgaXMgZmlsbGVkXG4gICAgICB0YXJnZXRDb2x1bW4gPSBuYW1lXG5cbiAgICByZXR1cm4gdGFyZ2V0Q29sdW1uXG5cbiAgc2V0TmV3U29ydERpcjogKHRhcmdldENvbHVtbiwgc29ydFVwKSA9PlxuICAgICNhbmQgc3dpdGNoIGl0XG4gICAgaWYgc29ydFVwXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5yZW1vdmVDbGFzcygnc29ydF91cCcpXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5hZGRDbGFzcygnc29ydF9kb3duJylcbiAgICBlbHNlXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5hZGRDbGFzcygnc29ydF91cCcpXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5yZW1vdmVDbGFzcygnc29ydF9kb3duJylcblxuICBmaXJlUGFnaW5hdGlvbjogKHRhYmxlTmFtZSkgPT5cbiAgICBlbCA9IEAkKHRhYmxlTmFtZSlbMF1cbiAgICB0Z3RfdGFibGUgPSBkMy5zZWxlY3QoZWwpXG4gICAgYWN0aXZlX3BhZ2UgPSB0Z3RfdGFibGUuc2VsZWN0QWxsKFwiLmFjdGl2ZSBhXCIpXG4gICAgaWYgYWN0aXZlX3BhZ2UgYW5kIGFjdGl2ZV9wYWdlWzBdIGFuZCBhY3RpdmVfcGFnZVswXVswXVxuICAgICAgYWN0aXZlX3BhZ2VbMF1bMF0uY2xpY2soKVxuXG5cblxuICBnZXROdW1TZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIHNtLk5VTUJFUlxuICAgIHJldHVybiAwXG5cbiAgZ2V0QXZnRGVwdGhTZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIE1hdGgucm91bmQoc20uQVZHX0RFUFRIKVxuXG4gIGdldEF2Z0Rpc3RTZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIHNtLkNPTk5fRElTVFxuXG4gIHByb2Nlc3NNaW5pbmdEYXRhOiAobWluaW5nX2RhdGEpID0+XG4gICAgbmV3X21pbmluZ19kYXRhID0gW11cbiAgICBmb3IgbWQgaW4gbWluaW5nX2RhdGFcbiAgICAgIG5hbWUgPSBtZC5UWVBFXG4gICAgICBzaXplID0gQGFkZENvbW1hcyBtZC5TSVpFX1NRS01cbiAgICAgIHBlcmMgPSBtZC5QRVJDX1RPVFxuICAgICAgaWYgcGVyYyA8IDAuMVxuICAgICAgICBwZXJjID0gXCI8IDAuMVwiXG4gICAgICBuZXdfbWluaW5nX2RhdGEucHVzaCB7VFlQRTpuYW1lLCBTSVpFX1NRS006c2l6ZSxQRVJDX1RPVDpwZXJjfVxuXG4gICAgcmV0dXJuIG5ld19taW5pbmdfZGF0YVxuXG4gIGFkZENvbW1hczogKG51bV9zdHIpID0+XG4gICAgbnVtX3N0ciArPSAnJ1xuICAgIHggPSBudW1fc3RyLnNwbGl0KCcuJylcbiAgICB4MSA9IHhbMF1cbiAgICB4MiA9IGlmIHgubGVuZ3RoID4gMSB0aGVuICcuJyArIHhbMV0gZWxzZSAnJ1xuICAgIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgICB3aGlsZSByZ3gudGVzdCh4MSlcbiAgICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyAnLCcgKyAnJDInKVxuICAgIHJldHVybiB4MSArIHgyXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgIHRhcmdldF9saW5rID0gJChlLnRhcmdldClcbiAgICBzZWxlY3RlZCA9IHRhcmdldF9saW5rLm5leHQoKVxuICAgIHNlbGNsYXNzID0gc2VsZWN0ZWQuYXR0cihcImNsYXNzXCIpXG4gICAgaWYgc2VsY2xhc3M9PSBcImhpZGRlblwiXG4gICAgICBzZWxlY3RlZC5yZW1vdmVDbGFzcyAnaGlkZGVuJ1xuICAgICAgc2VsZWN0ZWQuYWRkQ2xhc3MgJ3Nob3duJ1xuICAgICAgdGFyZ2V0X2xpbmsudGV4dChcImhpZGUgZGV0YWlsc1wiKVxuICAgIGVsc2VcbiAgICAgIHNlbGVjdGVkLnJlbW92ZUNsYXNzICdzaG93bidcbiAgICAgIHNlbGVjdGVkLmFkZENsYXNzICdoaWRkZW4nXG4gICAgICB0YXJnZXRfbGluay50ZXh0KFwic2hvdyBkZXRhaWxzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZVJlcG9ydFRhYiIsIkJhc2VSZXBvcnRUYWIgPSByZXF1aXJlICdiYXNlUmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEJpb2RpdmVyc2l0eVRhYiBleHRlbmRzIEJhc2VSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnQmlvZGl2ZXJzaXR5J1xuICBjbGFzc05hbWU6ICdiaW9kaXZlcnNpdHknXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmJpb2RpdmVyc2l0eVxuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnQmlvZGl2ZXJzaXR5J1xuICBdXG5cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgY29yYWxfYXJlYSA9IEByZWNvcmRTZXQoJ0Jpb2RpdmVyc2l0eScsICdDb3JhbCcpLmZsb2F0KCdBUkVBX0tNJylcbiAgICBjb3JhbF9wZXJjID0gIEByZWNvcmRTZXQoJ0Jpb2RpdmVyc2l0eScsICdDb3JhbCcpLmZsb2F0KCdBUkVBX1BFUkMnKVxuXG4gICAgbWFuZ3JvdmVzX2FyZWEgPSBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnTWFuZ3JvdmVzJykuZmxvYXQoJ0FSRUFfS00nKVxuICAgIG1hbmdyb3Zlc19wZXJjID0gIEByZWNvcmRTZXQoJ0Jpb2RpdmVyc2l0eScsICdNYW5ncm92ZXMnKS5mbG9hdCgnQVJFQV9QRVJDJylcblxuICAgIHNlYWdyYXNzX2FyZWEgPSBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnU2VhZ3Jhc3MnKS5mbG9hdCgnQVJFQV9LTScpXG4gICAgc2VhZ3Jhc3NfcGVyYyA9ICBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnU2VhZ3Jhc3MnKS5mbG9hdCgnQVJFQV9QRVJDJylcblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuXG4gICAgI3Nob3cgdGFibGVzIGluc3RlYWQgb2YgZ3JhcGggZm9yIElFXG4gICAgaWYgd2luZG93LmQzXG4gICAgICBkM0lzUHJlc2VudCA9IHRydWVcbiAgICBlbHNlXG4gICAgICBkM0lzUHJlc2VudCA9IGZhbHNlXG5cbiAgICBhdHRyaWJ1dGVzID0gQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgIFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhbnlBdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpLmxlbmd0aCA+IDBcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgY29yYWxfYXJlYTogY29yYWxfYXJlYVxuICAgICAgY29yYWxfcGVyYzogY29yYWxfcGVyY1xuICAgICAgbWFuZ3JvdmVzX2FyZWE6IG1hbmdyb3Zlc19hcmVhXG4gICAgICBtYW5ncm92ZXNfcGVyYzogbWFuZ3JvdmVzX3BlcmNcbiAgICAgIHNlYWdyYXNzX2FyZWE6IHNlYWdyYXNzX2FyZWFcbiAgICAgIHNlYWdyYXNzX3BlcmM6IHNlYWdyYXNzX3BlcmNcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBCaW9kaXZlcnNpdHlUYWIiLCJCYXNlUmVwb3J0VGFiID0gcmVxdWlyZSAnYmFzZVJlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBFY29ub215VGFiIGV4dGVuZHMgQmFzZVJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdTdXN0YWluYWJsZSBFY29ub215J1xuICBjbGFzc05hbWU6ICdlY29ub215J1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lY29ub215XG5cbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0NvYXN0YWxDYXRjaCdcbiAgICAnU2l6ZSdcbiAgICAnRGVlcFNlYSdcbiAgICAnRmlzaGVyaWVzJ1xuICAgICdQYWNpb2NlYUFxdWFjdWx0dXJlJ1xuICAgICdUb3VyaXNtJ1xuICAgICdFbmVyZ3knXG4gIF1cblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBtc2cgPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiUmVzdWx0TXNnXCIpXG4gICAgXG4gICAgY29hc3RhbF9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJDb2FzdGFsQ2F0Y2hUYWJsZVwiKS50b0FycmF5KClcbiAgICBjb21tZXJjaWFsX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvbW1lcmNpYWxUYWJsZVwiKS50b0FycmF5KClcbiAgICBzdWJzaXN0ZW5jZV9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJTdWJzaXN0ZW5jZVRhYmxlXCIpLnRvQXJyYXkoKVxuICAgIG9jZWFuX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIk9jZWFuVGFibGVcIikudG9BcnJheSgpXG4gICAgcmVuZXdhYmxlX2VuZXJneSA9IEByZWNvcmRTZXQoXCJFbmVyZ3lcIiwgXCJSZW5ld2FibGVFbmVyZ3lcIikudG9BcnJheSgpXG5cbiAgICBpZiByZW5ld2FibGVfZW5lcmd5Py5sZW5ndGggPiAwXG4gICAgICBoYXNfcmVuZXdhYmxlX2VuZXJneSA9IHRydWVcbiAgICAgIGF2Z19yZW5ld2FibGVfZW5lcmd5ID0gcmVuZXdhYmxlX2VuZXJneVswXS5BVkdcbiAgICBlbHNlXG5cbiAgICAgIGhhc19yZW5ld2FibGVfZW5lcmd5ID0gZmFsc2VcblxuICAgIGZ1ZWxfaW1wb3J0ID0gQHJlY29yZFNldChcIkVuZXJneVwiLCBcIkZ1ZWxJbXBvcnRcIikudG9BcnJheSgpXG4gICAgaWYgZnVlbF9pbXBvcnQ/Lmxlbmd0aCA+IDBcbiAgICAgIGhhc19mdWVsX2ltcG9ydCA9IHRydWVcbiAgICAgIGF2Z19mdWVsX2ltcG9ydCA9IGZ1ZWxfaW1wb3J0WzBdLkFWR1xuICAgIGVsc2UgXG4gICAgICBoYXMgZnVlbF9pbXBvcnQgPSBmYWxzZVxuXG4gICAgaWYgY29tbWVyY2lhbF9jYXRjaCBhbmQgY29tbWVyY2lhbF9jYXRjaD8ubGVuZ3RoID4gMFxuICAgICAgYXZnX2NvbW1fY2F0Y2ggPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiQ29tbWVyY2lhbFRhYmxlXCIpLmZsb2F0KCdBVkdfS0dfQ0FQJylbMF1cbiAgICAgIHRvdF9jb21tX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvbW1lcmNpYWxUYWJsZVwiKS5mbG9hdCgnVE9UX0tHX0NBUCcpWzBdXG4gICAgICBoYXNfY29tbV9jYXRjaCA9IHRydWVcbiAgICBlbHNlXG4gICAgICBoYXNfY29tbV9jYXRjaCA9IGZhbHNlXG4gICAgaWYgc3Vic2lzdGVuY2VfY2F0Y2ggYW5kIHN1YnNpc3RlbmNlX2NhdGNoPy5sZW5ndGggPiAwXG4gICAgICBhdmdfc3ViX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIlN1YnNpc3RlbmNlVGFibGVcIikuZmxvYXQoJ0FWR19LR19DQVAnKVswXVxuICAgICAgdG90X3N1Yl9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJTdWJzaXN0ZW5jZVRhYmxlXCIpLmZsb2F0KCdUT1RfS0dfQ0FQJylbMF1cbiAgICAgIGhhc19zdWJzaXN0ZW5jZV9jYXRjaCA9IHRydWVcbiAgICBlbHNlXG4gICAgICBoYXNfc3Vic2lzdGVuY2VfY2F0Y2ggPSBmYWxzZVxuXG4gICAgaWYgb2NlYW5fY2F0Y2ggYW5kIG9jZWFuX2NhdGNoPy5sZW5ndGggPiAwXG4gICAgICBhdmdfb2NlYW5fY2F0Y2ggPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiT2NlYW5UYWJsZVwiKS5mbG9hdCgnU0tfQVZHJylbMF1cbiAgICAgIHRvdF9vY2Vhbl9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJPY2VhblRhYmxlXCIpLmZsb2F0KCdSR05fVE9UJylbMF1cbiAgICAgIHRvdF9vY2Vhbl9jYXRjaCA9IEBhZGRDb21tYXMgdG90X29jZWFuX2NhdGNoXG4gICAgICBoYXNfb2NlYW5fY2F0Y2ggPSB0cnVlXG4gICAgZWxzZVxuICAgICAgaGFzX29jZWFuX2NhdGNoID0gZmFsc2VcblxuICAgIGZpc2hlcmllcyA9IEByZWNvcmRTZXQoXCJGaXNoZXJpZXNcIiwgXCJGaXNoZXJpZXNUYWJsZVwiKS50b0FycmF5KClcbiAgICBhcXVhID0gQHJlY29yZFNldChcIlBhY2lvY2VhQXF1YWN1bHR1cmVcIiwgXCJhcVwiKS50b0FycmF5KClcblxuICAgICN0aGlzIGZlZWxzIGdyb3NzLiBpbiBvcmRlciB0byBub3QgaGF2ZSB0byBhZGQgYW5vdGhlciByZWNvcmQgc2V0IGluIHRoZSBncCwgZWFjaCByb3cgaW5cbiAgICAjdGhlIHRhYmxlIGhhcyB0aGUgYXZnL3RvdGFsIGFkZGVkIHRvIGl0LiBzbyBpZiBpdHMgYSBzaW5nbGUgcm93IHRhYmxlLCBnZXQgdGhlIHZhbHVlLFxuICAgICNvdGhlcndpc2UgZ2V0IHRoZSBmaXJzdCBvbmUuIGJldHRlciB3YXkgdG8gZG8gdGhpcz9cbiAgICBhdmdfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0NTVF9BVkcnKVxuICAgIGlmIGF2Z19maXNoZXJpZXNfY29hc3RhbF9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgYXZnX2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoID0gYXZnX2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoWzBdXG5cbiAgICB0b3RfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0NTVF9UT1QnKVxuICAgIGlmIHRvdF9maXNoZXJpZXNfY29hc3RhbF9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgdG90X2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoID0gdG90X2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoWzBdXG5cbiAgICBhdmdfZmlzaGVyaWVzX2FxdWFfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0FRVUFfQVZHJylcbiAgICBpZiBhdmdfZmlzaGVyaWVzX2FxdWFfY2F0Y2g/Lmxlbmd0aCA+IDFcbiAgICAgIGF2Z19maXNoZXJpZXNfYXF1YV9jYXRjaCA9IGF2Z19maXNoZXJpZXNfYXF1YV9jYXRjaFswXVxuICAgIHRvdF9maXNoZXJpZXNfYXF1YV9jYXRjaCA9IEByZWNvcmRTZXQoXCJGaXNoZXJpZXNcIiwgXCJGaXNoZXJpZXNUYWJsZVwiKS5mbG9hdCgnQVFVQV9UT1QnKVxuICAgIGlmIHRvdF9maXNoZXJpZXNfYXF1YV9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgdG90X2Zpc2hlcmllc19hcXVhX2NhdGNoID0gdG90X2Zpc2hlcmllc19hcXVhX2NhdGNoWzBdXG5cbiAgICBhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkZpc2hlcmllc1RhYmxlXCIpLmZsb2F0KCdET01fQVZHJylcbiAgICBpZiBhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoPy5sZW5ndGggPiAxXG4gICAgICBhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoID0gYXZnX2Zpc2hlcmllc19kb21lc3RpY19jYXRjaFswXVxuICAgIHRvdF9maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0RPTV9UT1QnKVxuICAgIGlmIHRvdF9maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2g/Lmxlbmd0aCA+IDFcbiAgICAgIHRvdF9maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2ggPSB0b3RfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoWzBdXG5cbiAgICBhdmdfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2ggPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRmlzaGVyaWVzVGFibGVcIikuZmxvYXQoJ0ZSTl9BVkcnKVxuICAgIGlmIGF2Z19maXNoZXJpZXNfZm9yZWlnbl9jYXRjaD8ubGVuZ3RoID4gMVxuICAgICAgYXZnX2Zpc2hlcmllc19mb3JlaWduX2NhdGNoID0gYXZnX2Zpc2hlcmllc19mb3JlaWduX2NhdGNoWzBdXG4gICAgdG90X2Zpc2hlcmllc19mb3JlaWduX2NhdGNoID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkZpc2hlcmllc1RhYmxlXCIpLmZsb2F0KCdGUk5fVE9UJykgICBcbiAgICBpZiB0b3RfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2g/Lmxlbmd0aCA+IDFcbiAgICAgIHRvdF9maXNoZXJpZXNfZm9yZWlnbl9jYXRjaCA9IHRvdF9maXNoZXJpZXNfZm9yZWlnbl9jYXRjaFswXVxuXG4gICAgZ2RwX3ZhbHVlID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkdEUFRhYmxlXCIpLnRvQXJyYXkoKSBcbiAgICBleHBvcnRfdmFsdWUgPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRXhwb3J0VGFibGVcIikudG9BcnJheSgpIFxuXG4gICAgc2l6ZSA9IEByZWNvcmRTZXQoJ1NpemUnLCAnU2l6ZScpLmZsb2F0KCdTSVpFX0lOX0tNJylcbiAgICBuZXdfc2l6ZSA9ICBAYWRkQ29tbWFzIHNpemVcblxuICAgIG1pbmluZyA9IEByZWNvcmRTZXQoJ0RlZXBTZWEnLCAnTWluaW5nJykudG9BcnJheSgpXG4gICAgbWluaW5nID0gQHByb2Nlc3NNaW5pbmdEYXRhIG1pbmluZ1xuXG4gICAgc2VhbW91bnRzID0gQHJlY29yZFNldCgnRGVlcFNlYScsICdTZWFtb3VudHMnKS50b0FycmF5KClcbiAgICB0b3VyaXN0X2Fycml2YWxzID0gQHJlY29yZFNldCgnVG91cmlzbScsICdUb3VyaXN0QXJyaXZhbHMnKS50b0FycmF5KClcbiAgICB0b3VyaXN0X3BvcCA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnVG91cmlzdFBvcHVsYXRpb24nKS50b0FycmF5KClcbiAgICBnZHBfcGVyY2VudCA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnR0RQUGVyY2VudCcpLmZsb2F0KCdHRFAnKVxuICAgIGlmIGdkcF9wZXJjZW50ID4gMC4xXG4gICAgICBnZHBfcGVyY2VudCA9IGdkcF9wZXJjZW50LnRvRml4ZWQoMSlcblxuICAgIGludGxfdG91cmlzdF9hcnJpdmFsX3RvdGFsID0gQHJlY29yZFNldCgnVG91cmlzbScsICdJbnRlcm5hdGlvbmFsQXJyaXZhbHMnKS5mbG9hdCgnQXJyaXZhbHMnKVxuICAgIGhhc19pbnRlcm5hdGlvbmFsX3RvdXJpc3RzID0gaW50bF90b3VyaXN0X2Fycml2YWxfdG90YWwgPiAwXG4gICAgaWYgaGFzX2ludGVybmF0aW9uYWxfdG91cmlzdHNcbiAgICAgIGludGxfdG91cmlzdF9hcnJpdmFsX3RvdGFsID0gQGFkZENvbW1hcyBpbnRsX3RvdXJpc3RfYXJyaXZhbF90b3RhbFxuICAgICAgXG4gICAgaW50bF90b3VyaXN0X2Fycml2YWxfcGVyYyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnSW50ZXJuYXRpb25hbEFycml2YWxzJykuZmxvYXQoJ0lBX1BFUkMnKVxuICAgIGlmIGludGxfdG91cmlzdF9hcnJpdmFsX3BlcmMgPiAwLjFcbiAgICAgIGludGxfdG91cmlzdF9hcnJpdmFsX3BlcmMgPSBpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjLnRvRml4ZWQoMSlcbiAgICAgIFxuICAgIGNydWlzZV9zaGlwcyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnQ3J1aXNlc2hpcHMnKS5mbG9hdCgnUG9ydHMnKVxuICAgIGhhc19jcnVpc2VzaGlwX3Zpc2l0cyA9IGNydWlzZV9zaGlwcyA+IDBcbiAgICBjcnVpc2Vfc2hpcHNfcGVyYyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnQ3J1aXNlc2hpcHMnKS5mbG9hdCgnQ1JfUEVSQycpXG4gICAgaWYgY3J1aXNlX3NoaXBzX3BlcmMgPiAwLjFcbiAgICAgIGNydWlzZV9zaGlwc19wZXJjID0gY3J1aXNlX3NoaXBzX3BlcmMudG9GaXhlZCgxKVxuXG4gICAgbnVtX3NlYW1vdW50cyA9IEBnZXROdW1TZWFtb3VudHMgc2VhbW91bnRzXG5cbiAgICBoYXNfc2VhbW91bnRzID0gbnVtX3NlYW1vdW50cyA+IDFcbiAgICBhdmdfZGVwdGhfc2VhbW91bnRzID0gQGdldEF2Z0RlcHRoU2VhbW91bnRzIHNlYW1vdW50c1xuICAgIGF2Z19kZXB0aF9zZWFtb3VudHMgPSBAYWRkQ29tbWFzIGF2Z19kZXB0aF9zZWFtb3VudHNcblxuICAgIGF2Z19kaXN0X3NlYW1vdW50cyA9IEBnZXRBdmdEaXN0U2VhbW91bnRzIHNlYW1vdW50c1xuICAgIGF2Z19kaXN0X3NlYW1vdW50cyA9IEBhZGRDb21tYXMoTWF0aC5yb3VuZChhdmdfZGlzdF9zZWFtb3VudHMpKVxuXG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcblxuICAgIGF0dHJpYnV0ZXMgPSBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFueUF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCkubGVuZ3RoID4gMFxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIHNpemU6IG5ld19zaXplXG4gICAgICBoYXNfc2VhbW91bnRzOiBoYXNfc2VhbW91bnRzXG4gICAgICBudW1fc2VhbW91bnRzOiBudW1fc2VhbW91bnRzXG4gICAgICBhdmdfZGVwdGhfc2VhbW91bnRzOiBhdmdfZGVwdGhfc2VhbW91bnRzXG4gICAgICBhdmdfZGlzdF9zZWFtb3VudHM6IGF2Z19kaXN0X3NlYW1vdW50c1xuICAgICAgY29hc3RhbF9jYXRjaDogY29hc3RhbF9jYXRjaFxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIG1pbmluZzptaW5pbmdcbiAgICAgIGNvbW1lcmNpYWxfY2F0Y2g6IGNvbW1lcmNpYWxfY2F0Y2hcbiAgICAgIGhhc19jb21tX2NhdGNoOiBoYXNfY29tbV9jYXRjaFxuICAgICAgYXZnX2NvbW1fY2F0Y2g6IGF2Z19jb21tX2NhdGNoXG4gICAgICB0b3RfY29tbV9jYXRjaDogdG90X2NvbW1fY2F0Y2hcblxuICAgICAgc3Vic2lzdGVuY2VfY2F0Y2g6IHN1YnNpc3RlbmNlX2NhdGNoXG4gICAgICBoYXNfc3Vic2lzdGVuY2VfY2F0Y2g6IGhhc19zdWJzaXN0ZW5jZV9jYXRjaFxuICAgICAgYXZnX3N1Yl9jYXRjaDogYXZnX3N1Yl9jYXRjaFxuICAgICAgdG90X3N1Yl9jYXRjaDogdG90X3N1Yl9jYXRjaFxuXG4gICAgICBoYXNfb2NlYW5fY2F0Y2g6IGhhc19vY2Vhbl9jYXRjaFxuICAgICAgb2NlYW5fY2F0Y2g6IG9jZWFuX2NhdGNoXG4gICAgICBhdmdfb2NlYW5fY2F0Y2g6IGF2Z19vY2Vhbl9jYXRjaFxuICAgICAgdG90X29jZWFuX2NhdGNoOiB0b3Rfb2NlYW5fY2F0Y2hcblxuICAgICAgZmlzaGVyaWVzOiBmaXNoZXJpZXNcbiAgICAgIGF2Z19maXNoZXJpZXNfY29hc3RhbF9jYXRjaDphdmdfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2hcbiAgICAgIHRvdF9maXNoZXJpZXNfY29hc3RhbF9jYXRjaDp0b3RfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2hcblxuICAgICAgYXZnX2Zpc2hlcmllc19hcXVhX2NhdGNoOmF2Z19maXNoZXJpZXNfYXF1YV9jYXRjaFxuICAgICAgdG90X2Zpc2hlcmllc19hcXVhX2NhdGNoOnRvdF9maXNoZXJpZXNfYXF1YV9jYXRjaFxuXG4gICAgICBhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoOmF2Z19maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2hcbiAgICAgIHRvdF9maXNoZXJpZXNfZG9tZXN0aWNfY2F0Y2g6dG90X2Zpc2hlcmllc19kb21lc3RpY19jYXRjaFxuXG4gICAgICBhdmdfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2g6YXZnX2Zpc2hlcmllc19mb3JlaWduX2NhdGNoXG4gICAgICB0b3RfZmlzaGVyaWVzX2ZvcmVpZ25fY2F0Y2g6dG90X2Zpc2hlcmllc19mb3JlaWduX2NhdGNoXG5cbiAgICAgIGV4cG9ydF92YWx1ZTogZXhwb3J0X3ZhbHVlXG4gICAgICBnZHBfdmFsdWU6IGdkcF92YWx1ZVxuICAgICAgYXF1YTphcXVhXG5cbiAgICAgIHRvdXJpc3RfYXJyaXZhbHM6dG91cmlzdF9hcnJpdmFsc1xuICAgICAgdG91cmlzdF9wb3A6dG91cmlzdF9wb3BcblxuICAgICAgcmVuZXdhYmxlX2VuZXJneTogcmVuZXdhYmxlX2VuZXJneVxuICAgICAgYXZnX3JlbmV3YWJsZV9lbmVyZ3k6IGF2Z19yZW5ld2FibGVfZW5lcmd5XG4gICAgICBoYXNfcmVuZXdhYmxlX2VuZXJneTogaGFzX3JlbmV3YWJsZV9lbmVyZ3lcbiAgICAgIGZ1ZWxfaW1wb3J0OiBmdWVsX2ltcG9ydFxuICAgICAgYXZnX2Z1ZWxfaW1wb3J0OiBhdmdfZnVlbF9pbXBvcnRcbiAgICAgIGhhc19mdWVsX2ltcG9ydDogaGFzX2Z1ZWxfaW1wb3J0XG4gICAgICBnZHBfcGVyY2VudDogZ2RwX3BlcmNlbnRcbiAgICAgIGludGxfdG91cmlzdF9hcnJpdmFsX3RvdGFsOiBpbnRsX3RvdXJpc3RfYXJyaXZhbF90b3RhbFxuICAgICAgaW50bF90b3VyaXN0X2Fycml2YWxfcGVyYzogaW50bF90b3VyaXN0X2Fycml2YWxfcGVyY1xuICAgICAgaGFzX2ludGVybmF0aW9uYWxfdG91cmlzdHM6IGhhc19pbnRlcm5hdGlvbmFsX3RvdXJpc3RzXG4gICAgICBjcnVpc2Vfc2hpcHM6IGNydWlzZV9zaGlwc1xuICAgICAgY3J1aXNlX3NoaXBzX3BlcmM6IGNydWlzZV9zaGlwc19wZXJjXG4gICAgICBoYXNfY3J1aXNlc2hpcF92aXNpdHM6IGhhc19jcnVpc2VzaGlwX3Zpc2l0c1xuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgcGFydGlhbHMpXG4gICAgY29sX3ZhbHVlcyA9IHsnY2F0Y2hfY291bnRyeSc6XCJDT1VOVFJZXCIsICdjYXRjaF9pbl9lZXonOlwiVE9UX1RPTlNcIiwgJ2NhdGNoX3BlcmMnOlwiUEVSQ19UT1RcIn1cbiAgICBAc2V0dXBUYWJsZVNvcnRpbmcoY29hc3RhbF9jYXRjaCwgJy5jb2FzdGFsX2NhdGNoX3ZhbHVlcycsICcuY29hc3RhbF9jYXRjaF90YWJsZScsIGNvbF92YWx1ZXMsICdjb2FzdGFsLWNhdGNoLXJvdycsICdjYXRjaCcpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVjb25vbXlUYWIiLCJFY29ub215VGFiID0gcmVxdWlyZSAnLi9lY29ub215LmNvZmZlZSdcbkFkYXB0YXRpb25UYWIgPSByZXF1aXJlICcuL2FkYXB0YXRpb24uY29mZmVlJ1xuQmlvZGl2ZXJzaXR5VGFiID0gcmVxdWlyZSAnLi9iaW9kaXZlcnNpdHkuY29mZmVlJ1xuXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtFY29ub215VGFiLCBBZGFwdGF0aW9uVGFiLCBCaW9kaXZlcnNpdHlUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhZGFwdGF0aW9uXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNfY29yYWxcIixjLHAsMSksYyxwLDAsMzYwLDYwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+VGhlIGFyZWEgb2YgaW50ZXJlc3QgaW5jbHVkZXMgPHN0cm9uZz5jb3JhbCByZWVmczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjUwcHg7XFxcIj48YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwOTYwYTRlYjU4MGYxM2MwMmM4ZmRcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgY29yYWwgcmVlZiBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNfc2VhZ3Jhc3NcIixjLHAsMSksYyxwLDAsNjM4LDg3NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+VGhlIGFyZWEgb2YgaW50ZXJlc3QgaW5jbHVkZXMgPHN0cm9uZz5zZWFncmFzczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjUwcHg7XFxcIj48YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwOTYwYTRlYjU4MGYxM2MwMmM4ZmJcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgc2VhZ3Jhc3MgbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzX21hbmdyb3Zlc1wiLGMscCwxKSxjLHAsMCw5MTUsMTE1NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+VGhlIGFyZWEgb2YgaW50ZXJlc3QgaW5jbHVkZXMgPHN0cm9uZz5tYW5ncm92ZXM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IHN0eWxlPVxcXCJtYXJnaW4tbGVmdDo1MHB4O1xcXCI+PGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MDk2MGE0ZWI1ODBmMTNjMDJjOGY5XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IG1hbmdyb3ZlIGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc19ub19oYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwxMTk2LDEzMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlRoZXJlIGFyZSBubyA8c3Ryb25nPm1hbmdyb3Zlcywgc2VhZ3Jhc3MsIG9yIGNvcmFsIGhhYml0YXRzPC9zdHJvbmc+IHdpdGhpbiB0aGUgYXJlYSBvZiBpbnRlcmVzdC48L3A+IFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Qb3B1bGF0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+VGhlIHRvdGFsIHBvcHVsYXRpb24gb2YgdGhlIGNvdW50cmllcyB3aXRoaW4gdGhlIHNrZXRjaCBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bXBlb3BsZVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiwgd2hpY2ggaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjcGVvcGxlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgcG9wdWxhdGlvbiB3aXRoaW4gdGhlIFBBQ0lPQ0VBIHJlZ2lvbi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYmlvZGl2ZXJzaXR5XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5CaW9kaXZlcnNpdHk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGFibGU+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgKHNxLiBrbSk8L2E+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhICglIG9mIHRvdGFsIHJlZ2lvbik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgPHRib2R5PiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0PHRkPkNvcmFsPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJjb3JhbF9hcmVhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJjb3JhbF9wZXJjXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8dGQ+TWFuZ3JvdmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJtYW5ncm92ZXNfYXJlYVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwibWFuZ3JvdmVzX3BlcmNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8dGQ+U2VhZ3Jhc3M8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInNlYWdyYXNzX2FyZWFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInNlYWdyYXNzX3BlcmNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0VGhlIHRhYmxlIHNob3dzIHRoZSBhcmVhIG9mIHRoZSBoYWJpdGF0IHR5cGUgKGluIHNxdWFyZSBraWxvbWV0ZXJzKSB3aXRoaW4gdGhlIFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNrZXRjaCxcIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICBcdFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEwNzQsMTA4NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvbixcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGFzIHdlbGwgYXMgdGhlIHBlcmNlbnQgb2YgdGhlIHRvdGFsIFBBQ0lPQ0VBIGhhYml0YXQgZm91bmQgd2l0aGluIGVhY2ggXCIpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoLlwiKTt9O18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEyMzYsMTI0NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvbi5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZWNvbm9teVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzkyLDQwMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiBhcmVhIG9mIGludGVyZXN0IFwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNpemVcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIGtpbG9tZXRlcnM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EZWVwIFNlYSA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+RGVlcCBTZWEgTWluZXJhbHM6IDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzlkM1xcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBtaW5lcmFsIGxheWVyc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MTcwcHg7XFxcIj5UeXBlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhIChzcS4ga20pPC9hPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSAoJSBvZiB0b3RhbCByZWdpb24pPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtaW5pbmdcIixjLHAsMSksYyxwLDAsOTQzLDEwNjAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTSVpFX1NRS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfVE9UXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJoaWRkZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcImxpc3QtaGVhZGVyXFxcIj5UaGUgZGVlcCBzZWEgcmVzb3VyY2VzIGF2YWlsYWJsZSBmb3IgZXh0cmFjdGlvbiBhcmUgZGl2aWRlZCBpbnRvIDQgdHlwZXM6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPG9sPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPlBvbHltZXRhbGxpYyBOb2R1bGVzIChNYW5nYW5lc2UsIENvcHBlciwgTmlja2VsLCBDb2JhbHQpIC0gNCwwMDAgLSA2LDAwMCBtIGRlcHRoPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5Db2JhbHQtcmljaCBNYW5nYW5lc2UgQ3J1c3RzIChDb2JhbHQpIC0gODAwIC0gMywwMDAgbSBkZXB0aDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+U3VscGhpZGUgRGVwb3NpdHMgKENvcHBlcikgLSAxLDUwMCAtIDQsMDAwIG0gZGVwdGg8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPkRlZXAtc2VhIG11ZCAocmFyZSBlYXJ0aCBlbGVtZW50cywgeXR0cml1bSkgLSAyLDAwMCAtNiwwMDAgbSBkZXB0aC48L2xpPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9vbD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgVGhlIERTTSBkZXBvc2l0cyBhcmUgaGlnaGVyIGluIG1pbmVyYWwgY29udGVudCB0aGFuIG9uLWxhbmQgZGVwb3NpdHMuIFR5cGljYWwgdmFsdWUgb2YgYSB0b25uZSBvZiBsYW5kIGJhc2VkIG9yZSBpcyA1MC0yMDAgVVNELCBmb3Igc2VhIGZsb29yIGRlcG9zaXRzIGl04oCZcyA1MDAtMTUwMCBVU0QuIERTTSBtaW5pbmcgaW4gdGhlIFBBQ0lPQ0VBICBoYXMgYSBzdHJvbmcgcG90ZW50aWFsLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkhhYml0YXRzIGluIFNlYW1vdW50czogPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IHNlYW1vdW50IGxheWVyXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBzdHlsZT1cXFwicGFkZGluZy10b3A6NXB4O1xcXCI+IFRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwyMTcyLDIxODIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgYXJlYSBvZiBpbnRlcmVzdCBcIik7fTtfLmIoXCIgaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1fc2VhbW91bnRzXCIsYyxwLDApKSk7Xy5iKFwiIHNlYW1vdW50czwvc3Ryb25nPiB3aXRoIGFuIGF2ZXJhZ2UgZGVwdGggb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhdmdfZGVwdGhfc2VhbW91bnRzXCIsYyxwLDApKSk7Xy5iKFwiIG1ldGVycy48L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzX3NlYW1vdW50c1wiLGMscCwxKSxjLHAsMCwyNDAwLDI2MDcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBUaGUgYXZlcmFnZSBkaXN0YW5jZSBiZXR3ZWVuIHNlYW1vdW50cyB3aXRoaW4gdGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDI0NzMsMjQ4MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiBhcmVhIG9mIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbnRlcmVzdCBcIik7fTtfLmIoXCIgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhdmdfZGlzdF9zZWFtb3VudHNcIixjLHAsMCkpKTtfLmIoXCIga208L3N0cm9uZz4uXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJsaXN0LWhlYWRlclxcXCI+VGhlIHBoeXNpY2FsIHN0cnVjdHVyZSBvZiBzb21lIHNlYW1vdW50cyBlbmFibGVzIHRoZSBmb3JtYXRpb24gb2YgaHlkcm9ncmFwaGljIGZlYXR1cmVzIGFuZCBjdXJyZW50IGZsb3dzIHRoYXQgY2FuOjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxvbD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5FbmhhbmNlIGxvY2FsIHByb2R1Y3Rpb24gdGhyb3VnaCB1cHdlbGxpbmcgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5LZWVwIHNwZWNpZXMgYW5kIHByb2R1Y3Rpb24gcHJvY2Vzc2VzIGNvbmNlbnRyYXRlZCBvdmVyIHRoZSBzZWFtb3VudCAgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5IYXZlIGEgY29uY2VudHJhdGlvbiBvZiB6b29wbGFua3RvbiBhbmQgbWVzb3BlbGFnaWMgZmlzaCBtZWFuaW5nIHJpY2ggZmVlZGluZyBncm91bmRzIGFuZCBzcGF3bmluZyBhcmVhcyBmb3IgZmlzaCBhbmQgaGlnaGVyIHByZWRhdG9ycywgYW5kIGhlbmNlIGZpc2hlcmllcy4gU2VhbW91bnRzIGFyZSBhIGhvdHNwb3QgZm9yIGJpb2RpdmVyc3RpeSBidXQgYXJlIHN0aWxsIHVuZGVyc3R1ZGllZC48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvb2w+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Db2FzdGFsIEZpc2hlcmllcyA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+Q29hc3RhbCBDYXRjaDogPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWU5XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGNvYXN0YWwgY2F0Y2ggbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiNFxcXCI+Q2F0Y2ggKGluIHRvbm5lcyk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD4lIG9mIFRvdGFsIENhdGNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+VG90YWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5EZW1lcnNhbCA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5QZWxhZ2ljICA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5JbnZlcnRlYnJhdGUgPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNvYXN0YWxfY2F0Y2hcIixjLHAsMSksYyxwLDAsMzk4Miw0MjI3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFJZXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19UT1RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUT1RfVE9OU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRFTV9UT05TXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVMX1RPTlNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJJTlZfVE9OU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+Q29tbWVyY2lhbCBDYXRjaDogIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzllYlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBjb21tZXJjaWFsL3N1YnNpc3RlbmNlIGNhdGNoIGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNfY29tbV9jYXRjaFwiLGMscCwxKSxjLHAsMCw0NDgzLDQ3NjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIGF2ZXJhZ2UgY29tbWVyY2lhbCBjYXRjaCBhY3Jvc3MgRUVacyBpbiB0aGlzIGFyZWEgb2YgaW50ZXJlc3QgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhdmdfY29tbV9jYXRjaFwiLGMscCwwKSkpO18uYihcIiBrZyBwZXIgcGVyc29uPC9zdHJvbmc+LiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSBhdmVyYWdlIGNvbW1lcmNpYWwgY2F0Y2ggd2l0aGluIHRoZSBlbnRpcmUgUEFDSU9DRUEgcmVnaW9uIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwidG90X2NvbW1fY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCIga2cgcGVyIHBlcnNvbjwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5DYXRjaCAoa2cgcGVyIGNhcGl0YSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29tbWVyY2lhbF9jYXRjaFwiLGMscCwxKSxjLHAsMCw1MDAwLDUxMDcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UUllcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJLR19DQVBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+U3Vic2lzdGVuY2UgQ2F0Y2g6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc19zdWJzaXN0ZW5jZV9jYXRjaFwiLGMscCwxKSxjLHAsMCw1MjU0LDU1MzYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIGF2ZXJhZ2Ugc3Vic2lzdGVuY2UgY2F0Y2ggYWNyb3NzIEVFWnMgaW4gdGhpcyBhcmVhIG9mIGludGVyZXN0IGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXZnX3N1Yl9jYXRjaFwiLGMscCwwKSkpO18uYihcIiBrZyBwZXIgcGVyc29uPC9zdHJvbmc+LiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSBhdmVyYWdlIHN1YnNpc3RlbmNlIGNhdGNoIHdpdGhpbiB0aGUgZW50aXJlIFBBQ0lPQ0VBIHJlZ2lvbiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInRvdF9zdWJfY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCIga2cgcGVyIHBlcnNvbjwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q2F0Y2ggKGtnIHBlciBjYXBpdGEpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInN1YnNpc3RlbmNlX2NhdGNoXCIsYyxwLDEpLGMscCwwLDU3NzgsNTg4NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRSWVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIktHX0NBUFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk9jZWFuaWMgRmlzaGVyaWVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzllNlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBvY2VhbmljIGNhdGNoIGxheWVyczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgYXZlcmFnZSBvY2VhbmljIGNhdGNoIGFjcm9zcyBFRVpzIGluIHRoaXMgYXJlYSBvZiBpbnRlcmVzdCBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImF2Z19vY2Vhbl9jYXRjaFwiLGMscCwwKSkpO18uYihcIiB0b25uZXMuPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgdG90YWwgb2NlYW4gY2F0Y2ggd2l0aGluIHRoZSBlbnRpcmUgUEFDSU9DRUEgcmVnaW9uIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwidG90X29jZWFuX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiIHRvbm5lczwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+RG9tZXN0aWMgQ2F0Y2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj5Gb3JlaWduIENhdGNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+VG90YWwgKHRvbm5lcyk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD50b25uZXMgPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+JSBvZiBjYXRjaCBpbiBFRVo8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD50b25uZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD4lIG9mIGNhdGNoIGluIEVFWjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJvY2Vhbl9jYXRjaFwiLGMscCwxKSxjLHAsMCw2ODc5LDcxMTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UUllcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTS19UT1RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTS19ET01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJET01fUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNLX0ZSTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkZSTl9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGVyaWVzIEVjb25vbXk8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZTFcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIHNob3cgZmlzaGVyaWVzIGVjb25vbXkgbGF5ZXJzPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPkZpc2hlcmllcyBlY29ub215IHZhbHVlcyBpbiBlYWNoIGNvdW50cnk6PC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjFcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjRcXFwiPkNhdGNoIGluIE1VU0Q8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db2FzdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFxdWFjdWx0dXJlIDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkRvbWVzdGljPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Rm9yZWlnbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoZXJpZXNcIixjLHAsMSksYyxwLDAsNzg0OCw4MDQ2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb3VudHJ5XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ29hc3RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBcXVhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRG9tXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRm9yZWlnblwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzdHJvbmc+QXZlcmFnZSBmaXNoZXJpZXMgZWNvbm9teSB2YWx1ZXMgaW4gdGhlIGFyZWEgb2YgaW50ZXJlc3Q6PC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvYXN0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXF1YWN1bHR1cmU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Eb21lc3RpYzwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkZvcmVpZ248L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJhdmdfZmlzaGVyaWVzX2NvYXN0YWxfY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJhdmdfZmlzaGVyaWVzX2FxdWFfY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJhdmdfZmlzaGVyaWVzX2RvbWVzdGljX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiYXZnX2Zpc2hlcmllc19mb3JlaWduX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzdHJvbmc+VG90YWwgZmlzaGVyaWVzIGVjb25vbXkgdmFsdWUgaW4gUEFDSU9DRUEgcmVnaW9uOjwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db2FzdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFxdWFjdWx0dXJlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+RG9tZXN0aWM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Gb3JlaWduPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidG90X2Zpc2hlcmllc19jb2FzdGFsX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidG90X2Zpc2hlcmllc19hcXVhX2NhdGNoXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidG90X2Zpc2hlcmllc19kb21lc3RpY19jYXRjaFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInRvdF9maXNoZXJpZXNfZm9yZWlnbl9jYXRjaFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPkZpc2hlcmllcyBhbmQgQXF1YWN1bHR1cmUgc2hhcmUgb2YgR0RQOjwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+TnVtYmVyIG9mIENvdW50cmllcyB3aXRoIEdEUCBTaGFyZTo8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIxXFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkJlbG93IDUlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QmV0d2VlbiA1JSBhbmQgMTAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXZlcmFnZSBHRFAgU2hhcmUgaW4gQXJlYSBvZiBJbnRlcmVzdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJnZHBfdmFsdWVcIixjLHAsMSksYyxwLDAsOTc2Niw5OTAxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJCRUxPVzVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBQk9WRTVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBVkdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPkZpc2hlcmllcyBhbmQgQXF1YWN1bHR1cmUgc2hhcmUgb2YgVG90YWwgRXhwb3J0Ojwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiM1xcXCI+TnVtYmVyIG9mIENvdW50cmllcyB3aXRoIEV4cG9ydCBTaGFyZTo8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIxXFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkJlbG93IDMwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkJldHdlZW4gMzAlIGFuZCA3MCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5PdmVyIDcwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkF2ZXJhZ2UgRXhwb3J0IFNoYXJlIGluIEFyZWEgb2YgSW50ZXJlc3Q8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZXhwb3J0X3ZhbHVlXCIsYyxwLDEpLGMscCwwLDEwNDY1LDEwNjM1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJCRUxPVzMwXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQkVMT1c3MFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFCT1ZFNzBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBVkdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5BcXVhY3VsdHVyZSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZWVcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgYXF1YWN1bHR1cmUgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCI2XFxcIj5TcGVjaWVzIChUb25uZXMpOjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjJcXFwiPlRvdGFsIFRvbm5lcyBJbjo8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlByYXduczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk95c3RlcjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlNocmltcDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNyYWI8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5UaWxhcGlhPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWlsa2Zpc2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5BcmVhIG9mIEludGVyZXN0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+UEFDSU9DRUEgUmVnaW9uPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFxdWFcIixjLHAsMSksYyxwLDAsMTEzNTUsMTE2NTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlByYXduXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiT3lzdGVyXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU2hyaW1wXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ3JhYlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRpbGFwaWFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJNaWxrZmlzaFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFPSV9UT1RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUT1RfVE9OU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Ub3VyaXNtPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUb3VyaXNtIGFjY291bnRlZCBmb3IgYW4gYXZlcmFnZSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImdkcF9wZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgR0RQIG9mIHRoZSBjb3VudHJpZXMgd2l0aGluIHRoZSBza2V0Y2guIFwiKTtpZihfLnMoXy5mKFwiaGFzX2NydWlzZXNoaXBfdmlzaXRzXCIsYyxwLDEpLGMscCwwLDExOTM4LDEyMTIyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJUaGlzIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiY3J1aXNlX3NoaXBzXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGNydWlzZSBzaGlwIHZpc2l0cywgd2hpY2ggaXMgPHN0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBcIik7Xy5iKF8udihfLmYoXCJjcnVpc2Vfc2hpcHNfcGVyY1wiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIGNydWlzZSBzaGlwIHZpc2l0cyB3aXRoaW4gdGhlIFBBQ0lPQ0VBIHJlZ2lvbi5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIFwiKTtpZighXy5zKF8uZihcImhhc19jcnVpc2VzaGlwX3Zpc2l0c1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlRoZXJlIHdlcmUgPHN0cm9uZz5ubzwvc3Ryb25nPiBjcnVpc2VzaGlwIHZpc2l0cyB0byBjb3VudHJpZXMgd2l0aGluIHRoZSBza2V0Y2guXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNfaW50ZXJuYXRpb25hbF90b3VyaXN0c1wiLGMscCwxKSxjLHAsMCwxMjM1NiwxMjU3NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgVGhlcmUgd2VyZSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImludGxfdG91cmlzdF9hcnJpdmFsX3RvdGFsXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGludGVybmF0aW9uYWwgdG91cmlzdHMsIHdoaWNoIGlzIDxzdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgXCIpO18uYihfLnYoXy5mKFwiaW50bF90b3VyaXN0X2Fycml2YWxfcGVyY1wiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIGludGVybmF0aW9uYWwgdG91cmlzdHMgd2l0aGluIHRoZSBQQUNJT0NFQSByZWdpb24uIFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgXCIpO2lmKCFfLnMoXy5mKFwiaGFzX2ludGVybmF0aW9uYWxfdG91cmlzdHNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgVGhlcmUgd2VyZSA8c3Ryb25nPm5vPC9zdHJvbmc+IGludGVybmF0aW9uYWwgdG91cmlzdHMgdG8gdGhlIGNvdW50cmllcyB3aXRoaW4gdGhlXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgc2tldGNoLlwiKTt9O18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+Q2hhbmdlIGluIFRvdXJpc206PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk51bWJlciBvZiBDb3VudHJpZXMgd2hlcmUgVG91cmlzbSBEZWNyZWFzZWQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5OdW1iZXIgb2YgQ291bnRyaWVzIHdoZXJlIFRvdXJpc20gSW5jcmVhc2VkIGJ5IDwgMTAwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk51bWJlciBvZiBDb3VudHJpZXMgd2hlcmUgVG91cmlzbSBJbmNyZWFzZWQgYnkgPiAxMDAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInRvdXJpc3RfYXJyaXZhbHNcIixjLHAsMSksYyxwLDAsMTMxODAsMTMzMTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRFQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkxFU1MxMDBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJNT1JFMTAwXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPlRvdXJpc20gdnMgUG9wdWxhdGlvbjo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TnVtYmVyIG9mIENvdW50cmllcyB3aGVyZSBudW1iZXIgb2YgVG91cmlzdHMgdmlzaXRpbmcgaXMgR3JlYXRlciB0aGFuIFBvcHVsYXRpb248L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwidG91cmlzdF9wb3BcIixjLHAsMSksYyxwLDAsMTM2NTcsMTM3MzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRPVVJfUE9QXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkVuZXJneTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPlJlbmV3YWJsZSBFbmVyZ3k6ICZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWQyXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IHJlbmV3YWJsZSBlbmVyZ3kgbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc19yZW5ld2FibGVfZW5lcmd5XCIsYyxwLDEpLGMscCwwLDE0MDUxLDE0ODA3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8cD5Db3VudHJpZXMgd2l0aGluIHRoZSBza2V0Y2ggZ2VuZXJhdGUgYW4gYXZlcmFnZSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImF2Z19yZW5ld2FibGVfZW5lcmd5XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGVpciBlbmVyZ3kgZnJvbSByZW5ld2FibGUgc291cmNlcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjRcXFwiPlBlcmNlbnRhZ2Ugb2YgRW5lcmd5IEdlbmVyYXRlZCBieSBSZW5ld2FibGVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5MZXNzIHRoYW4gNDAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QmV0d2VlbiA0MCUgYW5kIDgwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1vcmUgdGhhbiA4MCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVuZXdhYmxlX2VuZXJneVwiLGMscCwxKSxjLHAsMCwxNDU2NiwxNDc0OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+TnVtYmVyIG9mIENvdW50cmllczwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlVOREVSXzQwXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiT1ZFUl80MFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk9WRVJfODBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc19yZW5ld2FibGVfZW5lcmd5XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5ObyBSZW5ld2FibGUgRW5lcmd5IERhdGEgQXZhaWxhYmxlPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+RnVlbCBJbXBvcnRzOiAmbmJzcDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzlkMFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBmdWVsIGltcG9ydCBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzX2Z1ZWxfaW1wb3J0XCIsYyxwLDEpLGMscCwwLDE1MTQ0LDE1OTAyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxwPkNvdW50cmllcyB3aXRoaW4gdGhlIHNrZXRjaCBpbXBvcnQgYW4gYXZlcmFnZSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImF2Z19mdWVsX2ltcG9ydFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlaXIgZnVlbC48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiNFxcXCI+UGVyY2VudGFnZSBvZiBGdWVsIGZyb20gSW1wb3J0czwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRoPjwvdGg+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGg+TGVzcyB0aGFuIDUlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRoPkJldHdlZW4gNSUgYW5kIDIwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0aD5Nb3JlIHRoYW4gMjAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZ1ZWxfaW1wb3J0XCIsYyxwLDEpLGMscCwwLDE1NjQ4LDE1ODQzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+TnVtYmVyIG9mIENvdW50cmllczwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVU5ERVJfNVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiT1ZFUl81XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJPVkVSXzIwXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJoYXNfZnVlbF9pbXBvcnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+Tm8gRnVlbCBJbXBvcnQgRGF0YSBBdmFpbGFibGU8L3A+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
