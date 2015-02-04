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

  BiodiversityTab.prototype.dependencies = ['Biodiversity', 'DeepSea'];

  BiodiversityTab.prototype.render = function() {
    var attributes, avg_depth_seamounts, avg_dist_seamounts, context, coral_area, coral_perc, d3IsPresent, hasMPAs, has_seamounts, isCollection, mangroves_area, mangroves_perc, mpa_cats, num_seamounts, seagrass_area, seagrass_perc, seamounts;
    coral_area = this.recordSet('Biodiversity', 'Coral').float('AREA_KM');
    coral_perc = this.recordSet('Biodiversity', 'Coral').float('AREA_PERC');
    mangroves_area = this.recordSet('Biodiversity', 'Mangroves').float('AREA_KM');
    mangroves_perc = this.recordSet('Biodiversity', 'Mangroves').float('AREA_PERC');
    seagrass_area = this.recordSet('Biodiversity', 'Seagrass').float('AREA_KM');
    seagrass_perc = this.recordSet('Biodiversity', 'Seagrass').float('AREA_PERC');
    mpa_cats = this.recordSet('Biodiversity', 'MPACategories').toArray();
    hasMPAs = (mpa_cats != null ? mpa_cats.length : void 0) > 0;
    isCollection = this.model.isCollection();
    seamounts = this.recordSet('DeepSea', 'Seamounts').toArray();
    num_seamounts = this.getNumSeamounts(seamounts);
    has_seamounts = num_seamounts > 1;
    avg_depth_seamounts = this.getAvgDepthSeamounts(seamounts);
    avg_depth_seamounts = this.addCommas(avg_depth_seamounts);
    avg_dist_seamounts = this.getAvgDistSeamounts(seamounts);
    avg_dist_seamounts = this.addCommas(Math.round(avg_dist_seamounts));
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
      seagrass_perc: seagrass_perc,
      mpa_cats: mpa_cats,
      hasMPAs: hasMPAs,
      has_seamounts: has_seamounts,
      num_seamounts: num_seamounts,
      avg_depth_seamounts: avg_depth_seamounts,
      avg_dist_seamounts: avg_dist_seamounts
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
    var aqua, attributes, coastal_catch, col_values, comm_sub_catch, context, export_value, fisheries, fuel_import, gdp_value, intl_tourist_arrivals, isCollection, mining, msg, new_size, ocean_catch, renewable_energy, size, tourism_gdp, tourism_res, tourist_arrivals, tourist_arrivals_by_country;
    msg = this.recordSet("CoastalCatch", "ResultMsg");
    coastal_catch = this.recordSet("CoastalCatch", "CoastalCatchTable").toArray();
    renewable_energy = this.recordSet("Energy", "RenewableEnergy").toArray();
    fuel_import = this.recordSet("Energy", "FuelImport").toArray();
    comm_sub_catch = this.recordSet("CoastalCatch", "CommercialSubTable").toArray();
    ocean_catch = this.recordSet("CoastalCatch", "OceanTable").toArray();
    fisheries = this.recordSet("Fisheries", "FisheriesTable").toArray();
    aqua = this.recordSet("PacioceaAquaculture", "aq").toArray();
    gdp_value = this.recordSet("Fisheries", "GDPTable").toArray();
    export_value = this.recordSet("Fisheries", "ExportTable").toArray();
    size = this.recordSet('Size', 'Size').float('SIZE_IN_KM');
    new_size = this.addCommas(size);
    mining = this.recordSet('DeepSea', 'Mining').toArray();
    mining = this.processMiningData(mining);
    tourism_res = this.recordSet('Tourism', 'ResultMsg');
    tourist_arrivals = this.recordSet('Tourism', 'TouristArrivals').toArray();
    tourist_arrivals_by_country = this.recordSet('Tourism', 'TourismArrivalByCountry').toArray();
    intl_tourist_arrivals = this.recordSet('Tourism', 'InternationalArrivals').toArray();
    tourism_gdp = this.recordSet('Tourism', 'GDPPercent').toArray();
    'intl_tourist_arrivals = @recordSet(\'Tourism\', \'InternationalArrivals\')\n\nintl_tourist_arrival_perc = @recordSet(\'Tourism\', \'InternationalArrivals\').float(\'IA_PERC\')\nif intl_tourist_arrival_perc > 0.1\n  intl_tourist_arrival_perc = intl_tourist_arrival_perc.toFixed(1)\n  \ncruise_ships = @recordSet(\'Tourism\', \'Cruiseships\').float(\'Ports\')\nhas_cruiseship_visits = cruise_ships > 0\ncruise_ships_perc = @recordSet(\'Tourism\', \'Cruiseships\').float(\'CR_PERC\')\nif cruise_ships_perc > 0.1\n  cruise_ships_perc = cruise_ships_perc.toFixed(1)\n';
    isCollection = this.model.isCollection();
    attributes = this.model.getAttributes();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      size: new_size,
      coastal_catch: coastal_catch,
      isCollection: isCollection,
      mining: mining,
      comm_sub_catch: comm_sub_catch,
      ocean_catch: ocean_catch,
      fisheries: fisheries,
      export_value: export_value,
      gdp_value: gdp_value,
      aqua: aqua,
      tourist_arrivals: tourist_arrivals,
      tourist_arrivals_by_country: tourist_arrivals_by_country,
      tourism_gdp: tourism_gdp,
      intl_tourist_arrivals: intl_tourist_arrivals,
      renewable_energy: renewable_energy,
      fuel_import: fuel_import
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
this["Templates"]["biodiversity"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Biodiversity</h4>");_.b("\n" + i);_.b("    <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</a></th>");_.b("\n" + i);_.b("        <th>Area (% of total region)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("     </thead>");_.b("\n" + i);_.b("     <tbody> ");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("  		<td>Coral</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("coral_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("coral_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("  		<td>Mangroves</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("mangroves_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("mangroves_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("       <tr>");_.b("\n" + i);_.b("  		<td>Seagrass</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("seagrass_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("seagrass_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("  	The table shows the area of the habitat type (in square kilometers) within the ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch,");_.b("\n");};_.b("  	");if(_.s(_.f("isCollection",c,p,1),c,p,0,1074,1085,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection,");});c.pop();}_.b(" as well as the percent of the total PACIOCEA habitat found within each ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch.");};_.b("\n" + i);_.b("  	");if(_.s(_.f("isCollection",c,p,1),c,p,0,1236,1247,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection.");});c.pop();}_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Habitats in Seamounts <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d6\" data-visible=\"false\">show seamount layer");_.b("\n" + i);_.b("  </a></h4>");_.b("\n" + i);_.b("  <p style=\"padding-top:5px;\"> The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1496,1506,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" includes <strong>");_.b(_.v(_.f("num_seamounts",c,p,0)));_.b(" seamounts</strong> with an average depth of <strong>");_.b(_.v(_.f("avg_depth_seamounts",c,p,0)));_.b(" meters.");_.b("\n" + i);_.b("  </strong>");_.b("\n" + i);if(_.s(_.f("has_seamounts",c,p,1),c,p,0,1727,1934,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    The average distance between seamounts within the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1800,1810,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of ");_.b("\n" + i);_.b("    interest ");};_.b(" is <strong>");_.b(_.v(_.f("avg_dist_seamounts",c,p,0)));_.b(" km</strong>.");_.b("\n");});c.pop();}_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The physical structure of some seamounts enables the formation of hydrographic features and current flows that can:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Enhance local production through upwelling </li>");_.b("\n" + i);_.b("        <li>Keep species and production processes concentrated over the seamount  </li>");_.b("\n" + i);_.b("        <li>Have a concentration of zooplankton and mesopelagic fish meaning rich feeding grounds and spawning areas for fish and higher predators, and hence fisheries. Seamounts are a hotspot for biodiverstiy but are still understudied.</li>");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(_.s(_.f("hasMPAs",c,p,1),c,p,0,2637,3473,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Marine Protected Areas</h4>");_.b("\n" + i);_.b("    <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>IUCN Category</th>");_.b("\n" + i);_.b("        <th>Number of MPAs</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</th>");_.b("\n" + i);_.b("        <th>Area (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("     </thead>");_.b("\n" + i);if(_.s(_.f("mpa_cats",c,p,1),c,p,0,2916,3061,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CAT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NUM_MPAS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("MPA_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("MPA_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("  </table>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    The table shows the number and area of Marine Protected Areas (MPAs) for each IUCN category within the ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch,");_.b("\n");};_.b("    ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3281,3292,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection,");});c.pop();}_.b(" as well as the aerial percent of the ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b("\n" + i);_.b("    ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3409,3419,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}_.b(" within each category.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasMPAs",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marine Protected Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large\">There are <strong>no</strong> Marine Protected Areas within this ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b("\n" + i);_.b("    ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3707,3717,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");};return _.fl();;});
this["Templates"]["economy"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>A Note on Reporting</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    For the EEZ statistics, the result is for the <strong>entire EEZ</strong>, and not only the part of the EEZ contained within the area of interest.</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This ");if(_.s(_.f("isCollection",c,p,1),c,p,0,650,660,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Deep Sea </h4>");_.b("\n" + i);_.b("  <div class=\"in-report-header\">Deep Sea Minerals: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d3\" data-visible=\"false\">show mineral layers");_.b("\n" + i);_.b("  </a></div>");_.b("\n" + i);_.b("  <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:170px;\">Type</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</a></th>");_.b("\n" + i);_.b("        <th>Area (% of total region)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);if(_.s(_.f("mining",c,p,1),c,p,0,1201,1318,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SIZE_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </thead>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The deep sea resources available for extraction are divided into 4 types:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Polymetallic Nodules (Manganese, Copper, Nickel, Cobalt) - 4,000 - 6,000 m depth</li>");_.b("\n" + i);_.b("        <li>Cobalt-rich Manganese Crusts (Cobalt) - 800 - 3,000 m depth</li>");_.b("\n" + i);_.b("        <li>Sulphide Deposits (Copper) - 1,500 - 4,000 m depth</li>");_.b("\n" + i);_.b("        <li>Deep-sea mud (rare earth elements, yttrium) - 2,000 -6,000 m depth.</li>                                    ");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("          The DSM deposits are higher in mineral content than on-land deposits. Typical value of a tonne of land based ore is 50-200 USD, for sea floor deposits it’s 500-1500 USD. DSM mining in the PACIOCEA  has a strong potential.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Coastal Fisheries </h4>");_.b("\n" + i);_.b("      <p class=\"large\">");_.b("\n" + i);_.b("        The term coastal fishery resource means “any fishery, any species of fish, or any stock of fish that is broadly distributed across the coastal waters (12 nautical miles) under the jurisdiction of a country.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Coastal Catch: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e9\" data-visible=\"false\">show coastal catch layer</a></div>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch (in tonnes)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>% of Total Coastal Catch</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("            <th>Demersal </th>");_.b("\n" + i);_.b("            <th>Pelagic  </th>");_.b("\n" + i);_.b("            <th>Invertebrate </th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("coastal_catch",c,p,1),c,p,0,3151,3396,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOT_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEM_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PEL_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("INV_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("            <p>");_.b("\n" + i);_.b("                Within the PACIOCEA region, the highest catch volumes are located in Papua New Guinea, Fiji, Kiribati, Federated States of Micronesia and Solomon Islands. Demersal species dominate the catch (33% to 75%). Demersal fisheries represent an important part of the total catch explained by the presence of lagoons and local fishing techniques");_.b("\n" + i);_.b("            </p>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Coastal commercial catch vs. coastal subsistence catch</br>");_.b("\n" + i);_.b("      <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9eb\" data-visible=\"false\">show commercial/subsistence catch layer");_.b("\n" + i);_.b("      </a>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Commercial Catch (kg per capita)</th>");_.b("\n" + i);_.b("            <th>Subsistence Catch (kg per capita)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("comm_sub_catch",c,p,1),c,p,0,4468,4615,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COM_KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SUB_KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Within the PACIOCEA area, the coastal catch volume is largely dominated by subsistence fisheries. The largest per capita volume of coastal catch (both commercial and subsistence) is located over the smallest land areas. This fact can be related with the low potential of these countries to develop agriculture. Thus, coastal degradation of natural habitats and pollution increase can have repercussions on food security for smaller land area countries.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Oceanic Fisheries ");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e6\" data-visible=\"false\">show oceanic catch layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The term oceanic fishery resource means “any fishery, any species of fish, or any stock of fish that is broadly distributed across the exclusive economical zone (between 12 and 200 nautical miles) under the jurisdiction of a country.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Domestic Catch</th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Foreign Catch</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Total (tonnes)</th>");_.b("\n" + i);_.b("            <th>tonnes </th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("            <th>tonnes</th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("ocean_catch",c,p,1),c,p,0,6231,6470,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_DOM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DOM_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_FRN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("FRN_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Western and Central Pacific offshore fisheries represent more than 60% of total worldwide fisheries and 80% of the Pacific tuna catch. Oceanic fisheries represent 90% of total sea food production in the PACIOCEA area. Foreign fleets dominate Northern oceanic catches. In the south of the PACIOCEA area the domestic catch represents more than 50 % of offshore fisheries. Highest total catch volumes are produced by Papua New Guinea, Kiribati and the Federated States of Micronesia.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Aquaculture <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9ee\" data-visible=\"false\">show aquaculture layer</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Prawns</th>");_.b("\n" + i);_.b("            <th>Oyster</th>");_.b("\n" + i);_.b("            <th>Shrimp</th>");_.b("\n" + i);_.b("            <th>Crab</th>");_.b("\n" + i);_.b("            <th>Tilapia</th>");_.b("\n" + i);_.b("            <th>Milkfish</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("aqua",c,p,1),c,p,0,7674,7972,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Prawn",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Oyster",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Shrimp",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Crab",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Tilapia",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Milkfish",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Total",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Fisheries and Aquaculture Economy</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fishery and Aquaculture economic value per country:</strong>&nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e1\" data-visible=\"false\">show layer</a>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch in Million USD</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Coastal fisheries</th>");_.b("\n" + i);_.b("            <th>Aquaculture </th>");_.b("\n" + i);_.b("            <th>Domestic oceanic fisheries</th>");_.b("\n" + i);_.b("            <th>Foreign oceanic fisheries</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("fisheries",c,p,1),c,p,0,8754,8952,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Coast",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Aqua",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Dom",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Foreign",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of GDP:</strong>&nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9df\" data-visible=\"false\">show layer</a>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>GDP Value (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("gdp_value",c,p,1),c,p,0,9364,9468,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("GDP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of Total Export:</strong>&nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e3\" data-visible=\"false\">show layer</a>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Export Value (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("export_value",c,p,1),c,p,0,9895,10002,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Export",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Within the PACIOCEA area, foreign and domestic oceanic fisheries dominate the total value of production, except for New Caledonia and French Polynesia where aquaculture is significant. Coastal fishery values are usually lower than oceanic values except for Fiji, Tonga, Wallis and Futuna and Tokelau.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Tourism</h4>");_.b("\n" + i);_.b("    <p class=\"large\">");_.b("\n" + i);_.b("      Tourists in PICTs mostly come from Asian countries to Micronesia (Japan, South Korea, Taiwan and Honk-Kong represent 70 to 90% of the tourists in Micronesia) and Australia/New Zealand for the southern part of the PACIOCEA area.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);_.b("\n" + i);_.b("    <div class=\"in-report-header\">International tourist arrivals (2012):");_.b("\n" + i);_.b("    </br><a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f9\" data-visible=\"false\">show international arrival layer</a>");_.b("\n" + i);_.b("    &nbsp &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f1\" data-visible=\"false\">show population layer</a></div>");_.b("\n" + i);_.b("    <!--perc pop: 5450a05b4eb580f13c02c9f1-->");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>International tourist arrivals</th>");_.b("\n" + i);_.b("            <th>Country population</th>");_.b("\n" + i);_.b("            <th>Ratio between tourist arrivals and total population (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("intl_tourist_arrivals",c,p,1),c,p,0,11540,11718,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Arrivals",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Population",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("IA_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("    <div class=\"in-report-header\">Summary of Change in Tourism:");_.b("\n" + i);_.b("    &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f3\" data-visible=\"false\">show layer</a></div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Decreased</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by < 100%</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by > 100%</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_arrivals",c,p,1),c,p,0,12289,12426,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("LESS100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("MORE100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Change in tourism for each country:");_.b("\n" + i);_.b("        &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f7\" data-visible=\"false\">show layer</a></div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Change in tourism (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_arrivals_by_country",c,p,1),c,p,0,12871,12980,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Tour_arr",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Very different situations characterize the region, but no sub-regional tendencies can be easily identified. Are remoteness, level of infrastructures, cost of transport, etc. important driving forces for the future of touristic destinations?");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("\n" + i);_.b("      <div class=\"in-report-header\">Tourism economic impact:</div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Added value of tourism (% of GDP)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourism_gdp",c,p,1),c,p,0,13714,13818,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("GDP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Tourism’s economic impact varies in large proportions throughout the Pacific Islands region. Few populated touristic destinations or low GDP countries are likely to rely on tourism, such as Fiji and Guam.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Energy</h4>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Fuel Imports: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d0\" ");_.b("\n" + i);_.b("        data-visible=\"false\">show fuel import layer</a></div>");_.b("\n" + i);_.b("        <table>");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("              <tr>");_.b("\n" + i);_.b("                <th>Country</th>");_.b("\n" + i);_.b("                <th>% of GDP from Fuel from Imports</th>");_.b("\n" + i);_.b("              </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("fuel_import",c,p,1),c,p,0,14699,14814,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("Fuel",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Until this decade, all the countries’ energy supply depended on petroleum and in consequence relied heavily on import. Fuel import can represent from 5% of GDP (Papua New Guinea) to 28% of the GDP (Cook Islands). Changes in the demand, including for the service sector, pose an increasing threat to energy security for Pacific populations.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Renewable Energy: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d2\" ");_.b("\n" + i);_.b("      data-visible=\"false\">show renewable energy layer</a></div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>% of Electricity generated by Renewable Energy</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("renewable_energy",c,p,1),c,p,0,15762,15868,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Renew",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("        <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            The ocean could produce energy via the implementation of new technologies. Thermal technology and wave energy conversion are estimated the most fruitful potential new resources. Even if these solutions are recent and devices are still expensive, in the long term, they should offer a very competitive alternative to fossil fuel. Moreover, the Pacific could be a key region in the development of some of these solutions by allowing the industry to mature and become competitive. A Framework for Action on Energy Security in the Pacific was established under the guidance of SPC with CROP agencies.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvam9iSXRlbS5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy91dGlscy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvc2NyaXB0cy9hZGFwdGF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Jhc2VSZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvYmlvZGl2ZXJzaXR5LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Vjb25vbXkuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxD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QUFELFFBQUE7Q0FqR0YsRUFnQlE7O0NBaEJSOztDQUZ1Qjs7QUFxR3pCLENBOUdBLEVBOEdpQixHQUFYLENBQU4sR0E5R0E7Ozs7QUNBQSxJQUFBLHNDQUFBOztBQUFBLENBQUEsRUFBYSxJQUFBLEdBQWIsUUFBYTs7QUFDYixDQURBLEVBQ2dCLElBQUEsTUFBaEIsUUFBZ0I7O0FBQ2hCLENBRkEsRUFFa0IsSUFBQSxRQUFsQixRQUFrQjs7QUFFbEIsQ0FKQSxFQUlVLEdBQUosR0FBcUIsS0FBM0I7Q0FDRSxDQUFBLEVBQUEsRUFBTSxJQUFNLEdBQUEsRUFBQTtDQUVMLEtBQUQsR0FBTixFQUFBLEdBQW1CO0NBSEs7Ozs7QUNKMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGNvbnNvbGUubG9nIEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJylcbiAgICAgICAgICBwYXlsb2FkU2l6ZSA9IE1hdGgucm91bmQoKChAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpIG9yIDApIC8gMTAyNCkgKiAxMDApIC8gMTAwXG4gICAgICAgICAgY29uc29sZS5sb2cgXCJGZWF0dXJlU2V0IHNlbnQgdG8gR1Agd2VpZ2hlZCBpbiBhdCAje3BheWxvYWRTaXplfWtiXCJcbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3JcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PlxuICAgICAgICB2LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz9bJ1NDX0lEJ10gaXMgQHNrZXRjaENsYXNzSWRcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXdcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQCQoJ1tkYXRhLWF0dHJpYnV0ZS10eXBlPVVybEZpZWxkXSAudmFsdWUsIFtkYXRhLWF0dHJpYnV0ZS10eXBlPVVwbG9hZEZpZWxkXSAudmFsdWUnKS5lYWNoICgpIC0+XG4gICAgICAgIHRleHQgPSAkKEApLnRleHQoKVxuICAgICAgICBodG1sID0gW11cbiAgICAgICAgZm9yIHVybCBpbiB0ZXh0LnNwbGl0KCcsJylcbiAgICAgICAgICBpZiB1cmwubGVuZ3RoXG4gICAgICAgICAgICBuYW1lID0gXy5sYXN0KHVybC5zcGxpdCgnLycpKVxuICAgICAgICAgICAgaHRtbC5wdXNoIFwiXCJcIjxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIje3VybH1cIj4je25hbWV9PC9hPlwiXCJcIlxuICAgICAgICAkKEApLmh0bWwgaHRtbC5qb2luKCcsICcpXG5cblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKEBtYXhFdGEgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tAbWF4RXRhICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhU2Vjb25kcycpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+XG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG5cbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKVxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsMTIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZighXy5zKF8uZihcImRvTm90RXhwb3J0XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9O30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iLCJCYXNlUmVwb3J0VGFiID0gcmVxdWlyZSAnYmFzZVJlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBBZGFwdGF0aW9uVGFiIGV4dGVuZHMgQmFzZVJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdBZGFwdGF0aW9uJ1xuICBjbGFzc05hbWU6ICdhZGFwdGF0aW9uJ1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGFwdGF0aW9uXG4gIGRlcGVuZGVuY2llczogW1xuICAgICdIYWJpdGF0J1xuICAgICdQb3B1bGF0aW9uJ1xuICBdXG5cblxuICByZW5kZXI6ICgpIC0+XG4gICAgaGFiaXRhdF9kYXRhID0gQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0UHJlc2VuY2UnKS50b0FycmF5KClcblxuICAgIGlmIGhhYml0YXRfZGF0YT8ubGVuZ3RoID4gMFxuICAgICAgaGFzX2NvcmFsID0gQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0UHJlc2VuY2UnKS5ib29sKCdDb3JhbCcpXG4gICAgICBoYXNfc2VhZ3Jhc3MgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRQcmVzZW5jZScpLmJvb2woJ1NlYWdyYXNzJylcbiAgICAgIGhhc19tYW5ncm92ZXMgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRQcmVzZW5jZScpLmJvb2woJ01hbmdyb3ZlJylcbiAgICBlbHNlXG4gICAgICBoYXNfY29yYWwgPSBmYWxzZVxuICAgICAgaGFzX3NlYWdyYXNzID0gZmFsc2VcbiAgICAgIGhhc19tYW5ncm92ZXMgPSBmYWxzZVxuICAgIGhhc19ub19oYWJpdGF0cyA9ICFoYXNfY29yYWwgYW5kICFoYXNfc2VhZ3Jhc3MgYW5kICFoYXNfbWFuZ3JvdmVzXG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBudW1wZW9wbGUgPSBAcmVjb3JkU2V0KCdQb3B1bGF0aW9uJywgJ1BvcHVsYXRpb24nKS5mbG9hdCgnUG9wdWxhdGlvbicpXG4gICAgbnVtcGVvcGxlID0gQGFkZENvbW1hcyBudW1wZW9wbGVcbiAgICBwZXJjcGVvcGxlID0gQHJlY29yZFNldCgnUG9wdWxhdGlvbicsICdQb3B1bGF0aW9uJykuZmxvYXQoJ1BFUkNfUE9QJylcbiAgICAjc2hvdyB0YWJsZXMgaW5zdGVhZCBvZiBncmFwaCBmb3IgSUVcbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIGQzSXNQcmVzZW50ID0gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGQzSXNQcmVzZW50ID0gZmFsc2VcblxuICAgIGF0dHJpYnV0ZXMgPSBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFueUF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCkubGVuZ3RoID4gMFxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBcbiAgICAgIGhhc19jb3JhbDogaGFzX2NvcmFsXG4gICAgICBoYXNfbWFuZ3JvdmVzOiBoYXNfbWFuZ3JvdmVzXG4gICAgICBoYXNfc2VhZ3Jhc3M6IGhhc19zZWFncmFzc1xuICAgICAgaGFzX25vX2hhYml0YXRzOiBoYXNfbm9faGFiaXRhdHNcbiAgICAgIG51bXBlb3BsZTogbnVtcGVvcGxlXG4gICAgICBwZXJjcGVvcGxlOiBwZXJjcGVvcGxlXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbiBcbm1vZHVsZS5leHBvcnRzID0gQWRhcHRhdGlvblRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBCYXNlUmVwb3J0VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gICMgdGhpcyBpcyB0aGUgbmFtZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBUYWJcbiAgbmFtZTogJ0Jhc2VSZXBvcnQnXG4gIGNsYXNzTmFtZTogJ2Jhc2VyZXBvcnQnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICBldmVudHM6XG4gICAgXCJjbGljayBhLmRldGFpbHNcIjogJ29uTW9yZVJlc3VsdHNDbGljaydcblxuICAjbm90IHVzZWQgeWV0XG4gIHNldHVwVGFibGVTb3J0aW5nOiAoZGF0YSwgdGJvZHlOYW1lLCB0YWJsZU5hbWUsIGRhdGFfdmFsdWUsIGNvbF92YWx1ZXMsIHJvd19uYW1lLCBzZWxlY3RlZF9jb2xfcHJlZml4KSA9PlxuICAgIGluZGV4ID0gMFxuICAgIGRlZmF1bHRfc29ydF9rZXkgPSBcIlwiXG4gICAgZGVmYXVsdF9zb3J0X2RhdGEgPSBcIlwiXG4gICAgZGVmYXVsdF9yb3dfZGF0YSA9IFwiXCJcbiAgICBkYXRhX2NvbHMgPSAodiBmb3IgaywgdiBvZiBjb2xfdmFsdWVzKVxuICAgIGZvciBrLHYgaW4gY29sX3ZhbHVlc1xuICAgICAgQCQoJy4nK2spLmNsaWNrIChldmVudCkgPT5cbiAgICAgICAgQHJlbmRlclNvcnQoaywgdGFibGVOYW1lLCBkYXRhX3ZhbHVlLCBldmVudCwgdiwgdGJvZHlOYW1lLCAoaW5kZXggPiAwKSwgXG4gICAgICAgICAgQGdldFRhYmxlUm93LCByb3dfbmFtZSwgZGF0YV9jb2xzLCBzZWxlY3RlZF9jb2xfcHJlZml4KVxuICAgICAgaWYgaW5kZXggPT0gMFxuICAgICAgICBkZWZhdWx0X3NvcnRfa2V5ID0ga1xuICAgICAgICBkZWZhdWx0X3NvcnRfZGF0YSA9IGRhdGFfdmFsdWVcbiAgICAgICAgZGVmYXVsdF9yb3dfZGF0YSA9IEBnZXRUYWJsZVJvd1xuICAgICAgaW5kZXgrPTFcblxuICAgIEByZW5kZXJTb3J0KGRlZmF1bHRfc29ydF9rZXksIHRhYmxlTmFtZSwgZGVmYXVsdF9zb3J0X2RhdGEsIHVuZGVmaW5lZCwgZGVmYXVsdF9zb3J0X2RhdGEsIHRib2R5TmFtZSwgXG4gICAgICBmYWxzZSwgZGVmYXVsdF9yb3dfZGF0YSwgcm93X25hbWUsIGRhdGFfY29scywgc2VsZWN0ZWRfY29sX3ByZWZpeClcblxuICAjZG8gdGhlIHNvcnRpbmcgLSBzaG91bGQgYmUgdGFibGUgaW5kZXBlbmRlbnRcbiAgI3NraXAgYW55IHRoYXQgYXJlIGxlc3MgdGhhbiAwLjAwXG4gIHJlbmRlclNvcnQ6IChuYW1lLCB0YWJsZU5hbWUsIHBkYXRhLCBldmVudCwgc29ydEJ5LCB0Ym9keU5hbWUsIGlzRmxvYXQsIGdldFJvd1N0cmluZ1ZhbHVlLCByb3dfbmFtZSwgZGF0YV9jb2xzLFxuICAgIHNlbGVjdGVkX2NvbF9wcmVmaXgpID0+XG4gICAgaWYgZXZlbnRcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICB0YXJnZXRDb2x1bW4gPSBAZ2V0U2VsZWN0ZWRDb2x1bW4oZXZlbnQsIG5hbWUsIHNlbGVjdGVkX2NvbF9wcmVmaXgpXG4gICAgICBzb3J0VXAgPSBAZ2V0U29ydERpcih0YXJnZXRDb2x1bW4pXG5cbiAgICAgIGlmIGlzRmxvYXRcbiAgICAgICAgZGF0YSA9IF8uc29ydEJ5IHBkYXRhLCAocm93KSAtPiAgcGFyc2VGbG9hdChyb3dbc29ydEJ5XSlcbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IF8uc29ydEJ5IHBkYXRhLCAocm93KSAtPiByb3dbc29ydEJ5XVxuXG4gICAgICAjZmxpcCBzb3J0aW5nIGlmIG5lZWRlZFxuICAgICAgaWYgc29ydFVwXG4gICAgICAgIGRhdGEucmV2ZXJzZSgpXG5cbiAgICAgIGVsID0gQCQodGJvZHlOYW1lKVswXVxuICAgICAgaGFiX2JvZHkgPSBkMy5zZWxlY3QoZWwpXG5cbiAgICAgICNyZW1vdmUgb2xkIHJvd3NcbiAgICAgIGhhYl9ib2R5LnNlbGVjdEFsbChcInRyLlwiK3Jvd19uYW1lKVxuICAgICAgICAucmVtb3ZlKClcblxuICAgICAgI2FkZCBuZXcgcm93cyAoYW5kIGRhdGEpXG4gICAgICByb3dzID0gaGFiX2JvZHkuc2VsZWN0QWxsKFwidHJcIilcbiAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAuZW50ZXIoKS5pbnNlcnQoXCJ0clwiLCBcIjpmaXJzdC1jaGlsZFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIHJvd19uYW1lKVxuXG4gICAgICBcbiAgICAgIGNlbGxzID0gcm93cy5zZWxlY3RBbGwoXCJ0ZFwiKVxuICAgICAgICAgIC5kYXRhKChyb3csIGkpIC0+ZGF0YV9jb2xzLm1hcCAoY29sdW1uKSAtPiAoY29sdW1uOiBjb2x1bW4sIHZhbHVlOiByb3dbY29sdW1uXSkpXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJ0ZFwiKS50ZXh0KChkLCBpKSAtPiBcbiAgICAgICAgICBkLnZhbHVlXG4gICAgICAgICkgICAgXG5cbiAgICAgIEBzZXROZXdTb3J0RGlyKHRhcmdldENvbHVtbiwgc29ydFVwKVxuICAgICAgQHNldFNvcnRpbmdDb2xvcihldmVudCwgdGFibGVOYW1lKVxuICAgICAgI2ZpcmUgdGhlIGV2ZW50IGZvciB0aGUgYWN0aXZlIHBhZ2UgaWYgcGFnaW5hdGlvbiBpcyBwcmVzZW50XG4gICAgICBAZmlyZVBhZ2luYXRpb24odGFibGVOYW1lKVxuICAgICAgaWYgZXZlbnRcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAjdGFibGUgcm93IGZvciBoYWJpdGF0IHJlcHJlc2VudGF0aW9uXG4gIGdldFRhYmxlUm93OiAoZCwgZGF0YV9jb2xzKSA9PlxuICAgIHJldHVybiBcIjx0ZD5cIitkW2RhdGFfY29sc1swXV0rXCI8L3RkPlwiK1wiPHRkPlwiK2RbZGF0YV9jb2xzWzFdXStcIjwvdGQ+XCIrXCI8dGQ+XCIrZFtkYXRhX2NvbHNbMl1dK1wiPC90ZD5cIlxuXG4gIHNldFNvcnRpbmdDb2xvcjogKGV2ZW50LCB0YWJsZU5hbWUpID0+XG4gICAgc29ydGluZ0NsYXNzID0gXCJzb3J0aW5nX2NvbFwiXG4gICAgaWYgZXZlbnRcbiAgICAgIHBhcmVudCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkucGFyZW50KClcbiAgICAgIG5ld1RhcmdldE5hbWUgPSBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZVxuICAgICAgdGFyZ2V0U3RyID0gdGFibGVOYW1lK1wiIHRoLnNvcnRpbmdfY29sIGFcIiAgIFxuICAgICAgaWYgQCQodGFyZ2V0U3RyKSBhbmQgQCQodGFyZ2V0U3RyKVswXVxuICAgICAgICBvbGRUYXJnZXROYW1lID0gQCQodGFyZ2V0U3RyKVswXS5jbGFzc05hbWVcbiAgICAgICAgaWYgbmV3VGFyZ2V0TmFtZSAhPSBvbGRUYXJnZXROYW1lXG4gICAgICAgICAgI3JlbW92ZSBpdCBmcm9tIG9sZCBcbiAgICAgICAgICBoZWFkZXJOYW1lID0gdGFibGVOYW1lK1wiIHRoLnNvcnRpbmdfY29sXCJcbiAgICAgICAgICBAJChoZWFkZXJOYW1lKS5yZW1vdmVDbGFzcyhzb3J0aW5nQ2xhc3MpXG4gICAgICAgICAgI2FuZCBhZGQgaXQgdG8gbmV3XG4gICAgICAgICAgcGFyZW50LmFkZENsYXNzKHNvcnRpbmdDbGFzcylcbiAgICAgXG4gIGdldFNvcnREaXI6ICh0YXJnZXRDb2x1bW4pID0+XG4gICAgIHNvcnR1cCA9IEAkKCcuJyt0YXJnZXRDb2x1bW4pLmhhc0NsYXNzKFwic29ydF91cFwiKVxuICAgICByZXR1cm4gc29ydHVwXG5cbiAgZ2V0U2VsZWN0ZWRDb2x1bW46IChldmVudCwgbmFtZSwgcHJlZml4X3N0cikgPT5cbiAgICBpZiBldmVudFxuICAgICAgI2dldCBzb3J0IG9yZGVyXG4gICAgICB0YXJnZXRDb2x1bW4gPSBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZVxuICAgICAgbXVsdGlDbGFzc2VzID0gdGFyZ2V0Q29sdW1uLnNwbGl0KCcgJylcblxuICAgICAgdGd0Q2xhc3NOYW1lID1fLmZpbmQgbXVsdGlDbGFzc2VzLCAoY2xhc3NuYW1lKSAtPiBcbiAgICAgICAgY2xhc3NuYW1lLmxhc3RJbmRleE9mKHByZWZpeF9zdHIsMCkgPT0gMFxuICAgICAgdGFyZ2V0Q29sdW1uID0gdGd0Q2xhc3NOYW1lXG4gICAgZWxzZVxuICAgICAgI3doZW4gdGhlcmUgaXMgbm8gZXZlbnQsIGZpcnN0IHRpbWUgdGFibGUgaXMgZmlsbGVkXG4gICAgICB0YXJnZXRDb2x1bW4gPSBuYW1lXG5cbiAgICByZXR1cm4gdGFyZ2V0Q29sdW1uXG5cbiAgc2V0TmV3U29ydERpcjogKHRhcmdldENvbHVtbiwgc29ydFVwKSA9PlxuICAgICNhbmQgc3dpdGNoIGl0XG4gICAgaWYgc29ydFVwXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5yZW1vdmVDbGFzcygnc29ydF91cCcpXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5hZGRDbGFzcygnc29ydF9kb3duJylcbiAgICBlbHNlXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5hZGRDbGFzcygnc29ydF91cCcpXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5yZW1vdmVDbGFzcygnc29ydF9kb3duJylcblxuICBmaXJlUGFnaW5hdGlvbjogKHRhYmxlTmFtZSkgPT5cbiAgICBlbCA9IEAkKHRhYmxlTmFtZSlbMF1cbiAgICB0Z3RfdGFibGUgPSBkMy5zZWxlY3QoZWwpXG4gICAgYWN0aXZlX3BhZ2UgPSB0Z3RfdGFibGUuc2VsZWN0QWxsKFwiLmFjdGl2ZSBhXCIpXG4gICAgaWYgYWN0aXZlX3BhZ2UgYW5kIGFjdGl2ZV9wYWdlWzBdIGFuZCBhY3RpdmVfcGFnZVswXVswXVxuICAgICAgYWN0aXZlX3BhZ2VbMF1bMF0uY2xpY2soKVxuXG5cblxuICBnZXROdW1TZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIHNtLk5VTUJFUlxuICAgIHJldHVybiAwXG5cbiAgZ2V0QXZnRGVwdGhTZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIE1hdGgucm91bmQoc20uQVZHX0RFUFRIKVxuXG4gIGdldEF2Z0Rpc3RTZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIHNtLkNPTk5fRElTVFxuXG4gIHByb2Nlc3NNaW5pbmdEYXRhOiAobWluaW5nX2RhdGEpID0+XG4gICAgbmV3X21pbmluZ19kYXRhID0gW11cbiAgICBmb3IgbWQgaW4gbWluaW5nX2RhdGFcbiAgICAgIG5hbWUgPSBtZC5UWVBFXG4gICAgICBzaXplID0gQGFkZENvbW1hcyBtZC5TSVpFX1NRS01cbiAgICAgIHBlcmMgPSBtZC5QRVJDX1RPVFxuICAgICAgaWYgcGVyYyA8IDAuMVxuICAgICAgICBwZXJjID0gXCI8IDAuMVwiXG4gICAgICBuZXdfbWluaW5nX2RhdGEucHVzaCB7VFlQRTpuYW1lLCBTSVpFX1NRS006c2l6ZSxQRVJDX1RPVDpwZXJjfVxuXG4gICAgcmV0dXJuIG5ld19taW5pbmdfZGF0YVxuXG4gIGFkZENvbW1hczogKG51bV9zdHIpID0+XG4gICAgbnVtX3N0ciArPSAnJ1xuICAgIHggPSBudW1fc3RyLnNwbGl0KCcuJylcbiAgICB4MSA9IHhbMF1cbiAgICB4MiA9IGlmIHgubGVuZ3RoID4gMSB0aGVuICcuJyArIHhbMV0gZWxzZSAnJ1xuICAgIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgICB3aGlsZSByZ3gudGVzdCh4MSlcbiAgICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyAnLCcgKyAnJDInKVxuICAgIHJldHVybiB4MSArIHgyXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgIHRhcmdldF9saW5rID0gJChlLnRhcmdldClcbiAgICBzZWxlY3RlZCA9IHRhcmdldF9saW5rLm5leHQoKVxuICAgIHNlbGNsYXNzID0gc2VsZWN0ZWQuYXR0cihcImNsYXNzXCIpXG4gICAgaWYgc2VsY2xhc3M9PSBcImhpZGRlblwiXG4gICAgICBzZWxlY3RlZC5yZW1vdmVDbGFzcyAnaGlkZGVuJ1xuICAgICAgc2VsZWN0ZWQuYWRkQ2xhc3MgJ3Nob3duJ1xuICAgICAgdGFyZ2V0X2xpbmsudGV4dChcImhpZGUgZGV0YWlsc1wiKVxuICAgIGVsc2VcbiAgICAgIHNlbGVjdGVkLnJlbW92ZUNsYXNzICdzaG93bidcbiAgICAgIHNlbGVjdGVkLmFkZENsYXNzICdoaWRkZW4nXG4gICAgICB0YXJnZXRfbGluay50ZXh0KFwic2hvdyBkZXRhaWxzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZVJlcG9ydFRhYiIsIkJhc2VSZXBvcnRUYWIgPSByZXF1aXJlICdiYXNlUmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEJpb2RpdmVyc2l0eVRhYiBleHRlbmRzIEJhc2VSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnQmlvZGl2ZXJzaXR5J1xuICBjbGFzc05hbWU6ICdiaW9kaXZlcnNpdHknXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmJpb2RpdmVyc2l0eVxuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnQmlvZGl2ZXJzaXR5JyxcbiAgICAnRGVlcFNlYSdcbiAgXVxuXG4gIHJlbmRlcjogKCkgLT5cblxuICAgIGNvcmFsX2FyZWEgPSBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnQ29yYWwnKS5mbG9hdCgnQVJFQV9LTScpXG4gICAgY29yYWxfcGVyYyA9ICBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnQ29yYWwnKS5mbG9hdCgnQVJFQV9QRVJDJylcblxuICAgIG1hbmdyb3Zlc19hcmVhID0gQHJlY29yZFNldCgnQmlvZGl2ZXJzaXR5JywgJ01hbmdyb3ZlcycpLmZsb2F0KCdBUkVBX0tNJylcbiAgICBtYW5ncm92ZXNfcGVyYyA9ICBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnTWFuZ3JvdmVzJykuZmxvYXQoJ0FSRUFfUEVSQycpXG5cbiAgICBzZWFncmFzc19hcmVhID0gQHJlY29yZFNldCgnQmlvZGl2ZXJzaXR5JywgJ1NlYWdyYXNzJykuZmxvYXQoJ0FSRUFfS00nKVxuICAgIHNlYWdyYXNzX3BlcmMgPSAgQHJlY29yZFNldCgnQmlvZGl2ZXJzaXR5JywgJ1NlYWdyYXNzJykuZmxvYXQoJ0FSRUFfUEVSQycpXG5cbiAgICBtcGFfY2F0cyA9IEByZWNvcmRTZXQoJ0Jpb2RpdmVyc2l0eScsICdNUEFDYXRlZ29yaWVzJykudG9BcnJheSgpXG4gICAgaGFzTVBBcyA9IG1wYV9jYXRzPy5sZW5ndGggPiAwXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG5cblxuICAgIHNlYW1vdW50cyA9IEByZWNvcmRTZXQoJ0RlZXBTZWEnLCAnU2VhbW91bnRzJykudG9BcnJheSgpXG4gICAgbnVtX3NlYW1vdW50cyA9IEBnZXROdW1TZWFtb3VudHMgc2VhbW91bnRzXG5cbiAgICBoYXNfc2VhbW91bnRzID0gbnVtX3NlYW1vdW50cyA+IDFcbiAgICBhdmdfZGVwdGhfc2VhbW91bnRzID0gQGdldEF2Z0RlcHRoU2VhbW91bnRzIHNlYW1vdW50c1xuICAgIGF2Z19kZXB0aF9zZWFtb3VudHMgPSBAYWRkQ29tbWFzIGF2Z19kZXB0aF9zZWFtb3VudHNcblxuICAgIGF2Z19kaXN0X3NlYW1vdW50cyA9IEBnZXRBdmdEaXN0U2VhbW91bnRzIHNlYW1vdW50c1xuICAgIGF2Z19kaXN0X3NlYW1vdW50cyA9IEBhZGRDb21tYXMoTWF0aC5yb3VuZChhdmdfZGlzdF9zZWFtb3VudHMpKVxuICAgICNzaG93IHRhYmxlcyBpbnN0ZWFkIG9mIGdyYXBoIGZvciBJRVxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgZDNJc1ByZXNlbnQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgZDNJc1ByZXNlbnQgPSBmYWxzZVxuXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIGNvcmFsX2FyZWE6IGNvcmFsX2FyZWFcbiAgICAgIGNvcmFsX3BlcmM6IGNvcmFsX3BlcmNcbiAgICAgIG1hbmdyb3Zlc19hcmVhOiBtYW5ncm92ZXNfYXJlYVxuICAgICAgbWFuZ3JvdmVzX3BlcmM6IG1hbmdyb3Zlc19wZXJjXG4gICAgICBzZWFncmFzc19hcmVhOiBzZWFncmFzc19hcmVhXG4gICAgICBzZWFncmFzc19wZXJjOiBzZWFncmFzc19wZXJjXG4gICAgICBtcGFfY2F0czptcGFfY2F0c1xuICAgICAgaGFzTVBBczogaGFzTVBBc1xuICAgICAgaGFzX3NlYW1vdW50czogaGFzX3NlYW1vdW50c1xuICAgICAgbnVtX3NlYW1vdW50czogbnVtX3NlYW1vdW50c1xuICAgICAgYXZnX2RlcHRoX3NlYW1vdW50czogYXZnX2RlcHRoX3NlYW1vdW50c1xuICAgICAgYXZnX2Rpc3Rfc2VhbW91bnRzOiBhdmdfZGlzdF9zZWFtb3VudHNcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBCaW9kaXZlcnNpdHlUYWIiLCJCYXNlUmVwb3J0VGFiID0gcmVxdWlyZSAnYmFzZVJlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBFY29ub215VGFiIGV4dGVuZHMgQmFzZVJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdTdXN0YWluYWJsZSBFY29ub215J1xuICBjbGFzc05hbWU6ICdlY29ub215J1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lY29ub215XG5cbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0NvYXN0YWxDYXRjaCdcbiAgICAnU2l6ZSdcbiAgICAnRGVlcFNlYSdcbiAgICAnRmlzaGVyaWVzJ1xuICAgICdQYWNpb2NlYUFxdWFjdWx0dXJlJ1xuICAgICdUb3VyaXNtJ1xuICAgICdFbmVyZ3knXG4gIF1cblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBtc2cgPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiUmVzdWx0TXNnXCIpXG5cbiAgICBjb2FzdGFsX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvYXN0YWxDYXRjaFRhYmxlXCIpLnRvQXJyYXkoKVxuXG4gICAgcmVuZXdhYmxlX2VuZXJneSA9IEByZWNvcmRTZXQoXCJFbmVyZ3lcIiwgXCJSZW5ld2FibGVFbmVyZ3lcIikudG9BcnJheSgpXG4gICAgZnVlbF9pbXBvcnQgPSBAcmVjb3JkU2V0KFwiRW5lcmd5XCIsIFwiRnVlbEltcG9ydFwiKS50b0FycmF5KClcblxuICAgIGNvbW1fc3ViX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvbW1lcmNpYWxTdWJUYWJsZVwiKS50b0FycmF5KClcbiAgICBvY2Vhbl9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJPY2VhblRhYmxlXCIpLnRvQXJyYXkoKVxuXG4gICAgZmlzaGVyaWVzID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkZpc2hlcmllc1RhYmxlXCIpLnRvQXJyYXkoKVxuICAgIGFxdWEgPSBAcmVjb3JkU2V0KFwiUGFjaW9jZWFBcXVhY3VsdHVyZVwiLCBcImFxXCIpLnRvQXJyYXkoKVxuXG4gICAgZ2RwX3ZhbHVlID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkdEUFRhYmxlXCIpLnRvQXJyYXkoKSBcbiAgICBleHBvcnRfdmFsdWUgPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRXhwb3J0VGFibGVcIikudG9BcnJheSgpIFxuXG4gICAgc2l6ZSA9IEByZWNvcmRTZXQoJ1NpemUnLCAnU2l6ZScpLmZsb2F0KCdTSVpFX0lOX0tNJylcbiAgICBuZXdfc2l6ZSA9ICBAYWRkQ29tbWFzIHNpemVcblxuICAgIG1pbmluZyA9IEByZWNvcmRTZXQoJ0RlZXBTZWEnLCAnTWluaW5nJykudG9BcnJheSgpXG4gICAgbWluaW5nID0gQHByb2Nlc3NNaW5pbmdEYXRhIG1pbmluZ1xuICAgIFxuICAgIHRvdXJpc21fcmVzID0gQHJlY29yZFNldCgnVG91cmlzbScsICdSZXN1bHRNc2cnKVxuICAgIFxuXG4gICAgdG91cmlzdF9hcnJpdmFscyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnVG91cmlzdEFycml2YWxzJykudG9BcnJheSgpXG4gICAgdG91cmlzdF9hcnJpdmFsc19ieV9jb3VudHJ5ID0gQHJlY29yZFNldCgnVG91cmlzbScsICdUb3VyaXNtQXJyaXZhbEJ5Q291bnRyeScpLnRvQXJyYXkoKVxuICAgIGludGxfdG91cmlzdF9hcnJpdmFscyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnSW50ZXJuYXRpb25hbEFycml2YWxzJykudG9BcnJheSgpXG4gICAgdG91cmlzbV9nZHAgPSBAcmVjb3JkU2V0KCdUb3VyaXNtJywgJ0dEUFBlcmNlbnQnKS50b0FycmF5KClcblxuICAgICcnJ1xuICAgIGludGxfdG91cmlzdF9hcnJpdmFscyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnSW50ZXJuYXRpb25hbEFycml2YWxzJylcbiAgICBcbiAgICBpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjID0gQHJlY29yZFNldCgnVG91cmlzbScsICdJbnRlcm5hdGlvbmFsQXJyaXZhbHMnKS5mbG9hdCgnSUFfUEVSQycpXG4gICAgaWYgaW50bF90b3VyaXN0X2Fycml2YWxfcGVyYyA+IDAuMVxuICAgICAgaW50bF90b3VyaXN0X2Fycml2YWxfcGVyYyA9IGludGxfdG91cmlzdF9hcnJpdmFsX3BlcmMudG9GaXhlZCgxKVxuICAgICAgXG4gICAgY3J1aXNlX3NoaXBzID0gQHJlY29yZFNldCgnVG91cmlzbScsICdDcnVpc2VzaGlwcycpLmZsb2F0KCdQb3J0cycpXG4gICAgaGFzX2NydWlzZXNoaXBfdmlzaXRzID0gY3J1aXNlX3NoaXBzID4gMFxuICAgIGNydWlzZV9zaGlwc19wZXJjID0gQHJlY29yZFNldCgnVG91cmlzbScsICdDcnVpc2VzaGlwcycpLmZsb2F0KCdDUl9QRVJDJylcbiAgICBpZiBjcnVpc2Vfc2hpcHNfcGVyYyA+IDAuMVxuICAgICAgY3J1aXNlX3NoaXBzX3BlcmMgPSBjcnVpc2Vfc2hpcHNfcGVyYy50b0ZpeGVkKDEpXG5cbiAgICAnJydcblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2l6ZTogbmV3X3NpemVcblxuICAgICAgY29hc3RhbF9jYXRjaDogY29hc3RhbF9jYXRjaFxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIG1pbmluZzptaW5pbmdcbiAgICAgIGNvbW1fc3ViX2NhdGNoOiBjb21tX3N1Yl9jYXRjaFxuICAgICAgb2NlYW5fY2F0Y2g6IG9jZWFuX2NhdGNoXG5cbiAgICAgIGZpc2hlcmllczogZmlzaGVyaWVzXG4gICAgICBleHBvcnRfdmFsdWU6IGV4cG9ydF92YWx1ZVxuICAgICAgZ2RwX3ZhbHVlOiBnZHBfdmFsdWVcbiAgICAgIGFxdWE6YXF1YVxuXG4gICAgICB0b3VyaXN0X2Fycml2YWxzOnRvdXJpc3RfYXJyaXZhbHNcbiAgICAgIHRvdXJpc3RfYXJyaXZhbHNfYnlfY291bnRyeTogdG91cmlzdF9hcnJpdmFsc19ieV9jb3VudHJ5XG4gICAgICB0b3VyaXNtX2dkcDogdG91cmlzbV9nZHBcbiAgICAgIGludGxfdG91cmlzdF9hcnJpdmFsczogaW50bF90b3VyaXN0X2Fycml2YWxzXG5cbiAgICAgIHJlbmV3YWJsZV9lbmVyZ3k6IHJlbmV3YWJsZV9lbmVyZ3lcbiAgICAgIGZ1ZWxfaW1wb3J0OiBmdWVsX2ltcG9ydFxuXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBjb2xfdmFsdWVzID0geydjYXRjaF9jb3VudHJ5JzpcIkNPVU5UUllcIiwgJ2NhdGNoX2luX2Vleic6XCJUT1RfVE9OU1wiLCAnY2F0Y2hfcGVyYyc6XCJQRVJDX1RPVFwifVxuICAgIEBzZXR1cFRhYmxlU29ydGluZyhjb2FzdGFsX2NhdGNoLCAnLmNvYXN0YWxfY2F0Y2hfdmFsdWVzJywgJy5jb2FzdGFsX2NhdGNoX3RhYmxlJywgY29sX3ZhbHVlcywgJ2NvYXN0YWwtY2F0Y2gtcm93JywgJ2NhdGNoJylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbm1vZHVsZS5leHBvcnRzID0gRWNvbm9teVRhYiIsIkVjb25vbXlUYWIgPSByZXF1aXJlICcuL2Vjb25vbXkuY29mZmVlJ1xuQWRhcHRhdGlvblRhYiA9IHJlcXVpcmUgJy4vYWRhcHRhdGlvbi5jb2ZmZWUnXG5CaW9kaXZlcnNpdHlUYWIgPSByZXF1aXJlICcuL2Jpb2RpdmVyc2l0eS5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW0Vjb25vbXlUYWIsIEFkYXB0YXRpb25UYWIsIEJpb2RpdmVyc2l0eVRhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFkYXB0YXRpb25cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0czwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc19jb3JhbFwiLGMscCwxKSxjLHAsMCwzNjAsNjA0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5UaGUgYXJlYSBvZiBpbnRlcmVzdCBpbmNsdWRlcyA8c3Ryb25nPmNvcmFsIHJlZWZzPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBzdHlsZT1cXFwibWFyZ2luLWxlZnQ6NTBweDtcXFwiPjxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTA5NjBhNGViNTgwZjEzYzAyYzhmZFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBjb3JhbCByZWVmIGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc19zZWFncmFzc1wiLGMscCwxKSxjLHAsMCw2MzgsODc3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5UaGUgYXJlYSBvZiBpbnRlcmVzdCBpbmNsdWRlcyA8c3Ryb25nPnNlYWdyYXNzPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBzdHlsZT1cXFwibWFyZ2luLWxlZnQ6NTBweDtcXFwiPjxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTA5NjBhNGViNTgwZjEzYzAyYzhmYlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBzZWFncmFzcyBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNfbWFuZ3JvdmVzXCIsYyxwLDEpLGMscCwwLDkxNSwxMTU1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5UaGUgYXJlYSBvZiBpbnRlcmVzdCBpbmNsdWRlcyA8c3Ryb25nPm1hbmdyb3Zlczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjUwcHg7XFxcIj48YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwOTYwYTRlYjU4MGYxM2MwMmM4ZjlcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbWFuZ3JvdmUgbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzX25vX2hhYml0YXRzXCIsYyxwLDEpLGMscCwwLDExOTYsMTMyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+VGhlcmUgYXJlIG5vIDxzdHJvbmc+bWFuZ3JvdmVzLCBzZWFncmFzcywgb3IgY29yYWwgaGFiaXRhdHM8L3N0cm9uZz4gd2l0aGluIHRoZSBhcmVhIG9mIGludGVyZXN0LjwvcD4gXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlBvcHVsYXRpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5UaGUgdG90YWwgcG9wdWxhdGlvbiBvZiB0aGUgY291bnRyaWVzIHdpdGhpbiB0aGUgc2tldGNoIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtcGVvcGxlXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+LCB3aGljaCBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNwZW9wbGVcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSBwb3B1bGF0aW9uIHdpdGhpbiB0aGUgUEFDSU9DRUEgcmVnaW9uLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJiaW9kaXZlcnNpdHlcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkJpb2RpdmVyc2l0eTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0YWJsZT4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSAoc3EuIGttKTwvYT48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgKCUgb2YgdG90YWwgcmVnaW9uKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICA8dGJvZHk+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8dGQ+Q29yYWw8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImNvcmFsX2FyZWFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImNvcmFsX3BlcmNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdDx0ZD5NYW5ncm92ZXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIm1hbmdyb3Zlc19hcmVhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJtYW5ncm92ZXNfcGVyY1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdDx0ZD5TZWFncmFzczwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwic2VhZ3Jhc3NfYXJlYVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwic2VhZ3Jhc3NfcGVyY1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRUaGUgdGFibGUgc2hvd3MgdGhlIGFyZWEgb2YgdGhlIGhhYml0YXQgdHlwZSAoaW4gc3F1YXJlIGtpbG9tZXRlcnMpIHdpdGhpbiB0aGUgXCIpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoLFwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgIFx0XCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTA3NCwxMDg1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uLFwiKTt9KTtjLnBvcCgpO31fLmIoXCIgYXMgd2VsbCBhcyB0aGUgcGVyY2VudCBvZiB0aGUgdG90YWwgUEFDSU9DRUEgaGFiaXRhdCBmb3VuZCB3aXRoaW4gZWFjaCBcIik7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJza2V0Y2guXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTIzNiwxMjQ3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uLlwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIGluIFNlYW1vdW50cyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgc2VhbW91bnQgbGF5ZXJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgc3R5bGU9XFxcInBhZGRpbmctdG9wOjVweDtcXFwiPiBUaGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTQ5NiwxNTA2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIGFyZWEgb2YgaW50ZXJlc3QgXCIpO307Xy5iKFwiIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtX3NlYW1vdW50c1wiLGMscCwwKSkpO18uYihcIiBzZWFtb3VudHM8L3N0cm9uZz4gd2l0aCBhbiBhdmVyYWdlIGRlcHRoIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXZnX2RlcHRoX3NlYW1vdW50c1wiLGMscCwwKSkpO18uYihcIiBtZXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzX3NlYW1vdW50c1wiLGMscCwxKSxjLHAsMCwxNzI3LDE5MzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBUaGUgYXZlcmFnZSBkaXN0YW5jZSBiZXR3ZWVuIHNlYW1vdW50cyB3aXRoaW4gdGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDE4MDAsMTgxMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiBhcmVhIG9mIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbnRlcmVzdCBcIik7fTtfLmIoXCIgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhdmdfZGlzdF9zZWFtb3VudHNcIixjLHAsMCkpKTtfLmIoXCIga208L3N0cm9uZz4uXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJsaXN0LWhlYWRlclxcXCI+VGhlIHBoeXNpY2FsIHN0cnVjdHVyZSBvZiBzb21lIHNlYW1vdW50cyBlbmFibGVzIHRoZSBmb3JtYXRpb24gb2YgaHlkcm9ncmFwaGljIGZlYXR1cmVzIGFuZCBjdXJyZW50IGZsb3dzIHRoYXQgY2FuOjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxvbD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5FbmhhbmNlIGxvY2FsIHByb2R1Y3Rpb24gdGhyb3VnaCB1cHdlbGxpbmcgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5LZWVwIHNwZWNpZXMgYW5kIHByb2R1Y3Rpb24gcHJvY2Vzc2VzIGNvbmNlbnRyYXRlZCBvdmVyIHRoZSBzZWFtb3VudCAgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5IYXZlIGEgY29uY2VudHJhdGlvbiBvZiB6b29wbGFua3RvbiBhbmQgbWVzb3BlbGFnaWMgZmlzaCBtZWFuaW5nIHJpY2ggZmVlZGluZyBncm91bmRzIGFuZCBzcGF3bmluZyBhcmVhcyBmb3IgZmlzaCBhbmQgaGlnaGVyIHByZWRhdG9ycywgYW5kIGhlbmNlIGZpc2hlcmllcy4gU2VhbW91bnRzIGFyZSBhIGhvdHNwb3QgZm9yIGJpb2RpdmVyc3RpeSBidXQgYXJlIHN0aWxsIHVuZGVyc3R1ZGllZC48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvb2w+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc01QQXNcIixjLHAsMSksYyxwLDAsMjYzNywzNDczLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJpbmUgUHJvdGVjdGVkIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRhYmxlPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JVUNOIENhdGVnb3J5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgTVBBczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSAoc3EuIGttKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtcGFfY2F0c1wiLGMscCwxKSxjLHAsMCwyOTE2LDMwNjEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDQVRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5VTV9NUEFTXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJNUEFfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTVBBX1BFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgdGFibGUgc2hvd3MgdGhlIG51bWJlciBhbmQgYXJlYSBvZiBNYXJpbmUgUHJvdGVjdGVkIEFyZWFzIChNUEFzKSBmb3IgZWFjaCBJVUNOIGNhdGVnb3J5IHdpdGhpbiB0aGUgXCIpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoLFwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzI4MSwzMjkyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uLFwiKTt9KTtjLnBvcCgpO31fLmIoXCIgYXMgd2VsbCBhcyB0aGUgYWVyaWFsIHBlcmNlbnQgb2YgdGhlIFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNrZXRjaFwiKTt9O18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDM0MDksMzQxOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgd2l0aGluIGVhY2ggY2F0ZWdvcnkuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc01QQXNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJpbmUgUHJvdGVjdGVkIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+VGhlcmUgYXJlIDxzdHJvbmc+bm88L3N0cm9uZz4gTWFyaW5lIFByb3RlY3RlZCBBcmVhcyB3aXRoaW4gdGhpcyBcIik7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJza2V0Y2hcIik7fTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwzNzA3LDM3MTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZWNvbm9teVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2l6ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+QSBOb3RlIG9uIFJlcG9ydGluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBGb3IgdGhlIEVFWiBzdGF0aXN0aWNzLCB0aGUgcmVzdWx0IGlzIGZvciB0aGUgPHN0cm9uZz5lbnRpcmUgRUVaPC9zdHJvbmc+LCBhbmQgbm90IG9ubHkgdGhlIHBhcnQgb2YgdGhlIEVFWiBjb250YWluZWQgd2l0aGluIHRoZSBhcmVhIG9mIGludGVyZXN0Ljwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw2NTAsNjYwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIGFyZWEgb2YgaW50ZXJlc3QgXCIpO307Xy5iKFwiIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUga2lsb21ldGVyczwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRlZXAgU2VhIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5EZWVwIFNlYSBNaW5lcmFsczogPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWQzXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IG1pbmVyYWwgbGF5ZXJzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxNzBweDtcXFwiPlR5cGU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgKHNxLiBrbSk8L2E+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhICglIG9mIHRvdGFsIHJlZ2lvbik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1pbmluZ1wiLGMscCwxKSxjLHAsMCwxMjAxLDEzMTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTSVpFX1NRS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfVE9UXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJoaWRkZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcImxpc3QtaGVhZGVyXFxcIj5UaGUgZGVlcCBzZWEgcmVzb3VyY2VzIGF2YWlsYWJsZSBmb3IgZXh0cmFjdGlvbiBhcmUgZGl2aWRlZCBpbnRvIDQgdHlwZXM6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPG9sPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPlBvbHltZXRhbGxpYyBOb2R1bGVzIChNYW5nYW5lc2UsIENvcHBlciwgTmlja2VsLCBDb2JhbHQpIC0gNCwwMDAgLSA2LDAwMCBtIGRlcHRoPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5Db2JhbHQtcmljaCBNYW5nYW5lc2UgQ3J1c3RzIChDb2JhbHQpIC0gODAwIC0gMywwMDAgbSBkZXB0aDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+U3VscGhpZGUgRGVwb3NpdHMgKENvcHBlcikgLSAxLDUwMCAtIDQsMDAwIG0gZGVwdGg8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPkRlZXAtc2VhIG11ZCAocmFyZSBlYXJ0aCBlbGVtZW50cywgeXR0cml1bSkgLSAyLDAwMCAtNiwwMDAgbSBkZXB0aC48L2xpPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvb2w+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIFRoZSBEU00gZGVwb3NpdHMgYXJlIGhpZ2hlciBpbiBtaW5lcmFsIGNvbnRlbnQgdGhhbiBvbi1sYW5kIGRlcG9zaXRzLiBUeXBpY2FsIHZhbHVlIG9mIGEgdG9ubmUgb2YgbGFuZCBiYXNlZCBvcmUgaXMgNTAtMjAwIFVTRCwgZm9yIHNlYSBmbG9vciBkZXBvc2l0cyBpdOKAmXMgNTAwLTE1MDAgVVNELiBEU00gbWluaW5nIGluIHRoZSBQQUNJT0NFQSAgaGFzIGEgc3Ryb25nIHBvdGVudGlhbC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkNvYXN0YWwgRmlzaGVyaWVzIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSB0ZXJtIGNvYXN0YWwgZmlzaGVyeSByZXNvdXJjZSBtZWFucyDigJxhbnkgZmlzaGVyeSwgYW55IHNwZWNpZXMgb2YgZmlzaCwgb3IgYW55IHN0b2NrIG9mIGZpc2ggdGhhdCBpcyBicm9hZGx5IGRpc3RyaWJ1dGVkIGFjcm9zcyB0aGUgY29hc3RhbCB3YXRlcnMgKDEyIG5hdXRpY2FsIG1pbGVzKSB1bmRlciB0aGUganVyaXNkaWN0aW9uIG9mIGEgY291bnRyeS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+Q29hc3RhbCBDYXRjaDogPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWU5XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGNvYXN0YWwgY2F0Y2ggbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiNFxcXCI+Q2F0Y2ggKGluIHRvbm5lcyk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD4lIG9mIFRvdGFsIENvYXN0YWwgQ2F0Y2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkRlbWVyc2FsIDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlBlbGFnaWMgIDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkludmVydGVicmF0ZSA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29hc3RhbF9jYXRjaFwiLGMscCwxKSxjLHAsMCwzMTUxLDMzOTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UUllcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX1RPVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRPVF9UT05TXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiREVNX1RPTlNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRUxfVE9OU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIklOVl9UT05TXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIFdpdGhpbiB0aGUgUEFDSU9DRUEgcmVnaW9uLCB0aGUgaGlnaGVzdCBjYXRjaCB2b2x1bWVzIGFyZSBsb2NhdGVkIGluIFBhcHVhIE5ldyBHdWluZWEsIEZpamksIEtpcmliYXRpLCBGZWRlcmF0ZWQgU3RhdGVzIG9mIE1pY3JvbmVzaWEgYW5kIFNvbG9tb24gSXNsYW5kcy4gRGVtZXJzYWwgc3BlY2llcyBkb21pbmF0ZSB0aGUgY2F0Y2ggKDMzJSB0byA3NSUpLiBEZW1lcnNhbCBmaXNoZXJpZXMgcmVwcmVzZW50IGFuIGltcG9ydGFudCBwYXJ0IG9mIHRoZSB0b3RhbCBjYXRjaCBleHBsYWluZWQgYnkgdGhlIHByZXNlbmNlIG9mIGxhZ29vbnMgYW5kIGxvY2FsIGZpc2hpbmcgdGVjaG5pcXVlc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+Q29hc3RhbCBjb21tZXJjaWFsIGNhdGNoIHZzLiBjb2FzdGFsIHN1YnNpc3RlbmNlIGNhdGNoPC9icj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZWJcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgY29tbWVyY2lhbC9zdWJzaXN0ZW5jZSBjYXRjaCBsYXllclwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q29tbWVyY2lhbCBDYXRjaCAoa2cgcGVyIGNhcGl0YSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5TdWJzaXN0ZW5jZSBDYXRjaCAoa2cgcGVyIGNhcGl0YSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29tbV9zdWJfY2F0Y2hcIixjLHAsMSksYyxwLDAsNDQ2OCw0NjE1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFJZXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09NX0tHX0NBUFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNVQl9LR19DQVBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICBXaXRoaW4gdGhlIFBBQ0lPQ0VBIGFyZWEsIHRoZSBjb2FzdGFsIGNhdGNoIHZvbHVtZSBpcyBsYXJnZWx5IGRvbWluYXRlZCBieSBzdWJzaXN0ZW5jZSBmaXNoZXJpZXMuIFRoZSBsYXJnZXN0IHBlciBjYXBpdGEgdm9sdW1lIG9mIGNvYXN0YWwgY2F0Y2ggKGJvdGggY29tbWVyY2lhbCBhbmQgc3Vic2lzdGVuY2UpIGlzIGxvY2F0ZWQgb3ZlciB0aGUgc21hbGxlc3QgbGFuZCBhcmVhcy4gVGhpcyBmYWN0IGNhbiBiZSByZWxhdGVkIHdpdGggdGhlIGxvdyBwb3RlbnRpYWwgb2YgdGhlc2UgY291bnRyaWVzIHRvIGRldmVsb3AgYWdyaWN1bHR1cmUuIFRodXMsIGNvYXN0YWwgZGVncmFkYXRpb24gb2YgbmF0dXJhbCBoYWJpdGF0cyBhbmQgcG9sbHV0aW9uIGluY3JlYXNlIGNhbiBoYXZlIHJlcGVyY3Vzc2lvbnMgb24gZm9vZCBzZWN1cml0eSBmb3Igc21hbGxlciBsYW5kIGFyZWEgY291bnRyaWVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk9jZWFuaWMgRmlzaGVyaWVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZTZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgb2NlYW5pYyBjYXRjaCBsYXllcnM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIHRlcm0gb2NlYW5pYyBmaXNoZXJ5IHJlc291cmNlIG1lYW5zIOKAnGFueSBmaXNoZXJ5LCBhbnkgc3BlY2llcyBvZiBmaXNoLCBvciBhbnkgc3RvY2sgb2YgZmlzaCB0aGF0IGlzIGJyb2FkbHkgZGlzdHJpYnV0ZWQgYWNyb3NzIHRoZSBleGNsdXNpdmUgZWNvbm9taWNhbCB6b25lIChiZXR3ZWVuIDEyIGFuZCAyMDAgbmF1dGljYWwgbWlsZXMpIHVuZGVyIHRoZSBqdXJpc2RpY3Rpb24gb2YgYSBjb3VudHJ5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj5Eb21lc3RpYyBDYXRjaDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjJcXFwiPkZvcmVpZ24gQ2F0Y2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Ub3RhbCAodG9ubmVzKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPnRvbm5lcyA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD4lIG9mIGNhdGNoIGluIEVFWjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPnRvbm5lczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPiUgb2YgY2F0Y2ggaW4gRUVaPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm9jZWFuX2NhdGNoXCIsYyxwLDEpLGMscCwwLDYyMzEsNjQ3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRSWVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNLX1RPVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNLX0RPTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRPTV9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU0tfRlJOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRlJOX1BFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICBXZXN0ZXJuIGFuZCBDZW50cmFsIFBhY2lmaWMgb2Zmc2hvcmUgZmlzaGVyaWVzIHJlcHJlc2VudCBtb3JlIHRoYW4gNjAlIG9mIHRvdGFsIHdvcmxkd2lkZSBmaXNoZXJpZXMgYW5kIDgwJSBvZiB0aGUgUGFjaWZpYyB0dW5hIGNhdGNoLiBPY2VhbmljIGZpc2hlcmllcyByZXByZXNlbnQgOTAlIG9mIHRvdGFsIHNlYSBmb29kIHByb2R1Y3Rpb24gaW4gdGhlIFBBQ0lPQ0VBIGFyZWEuIEZvcmVpZ24gZmxlZXRzIGRvbWluYXRlIE5vcnRoZXJuIG9jZWFuaWMgY2F0Y2hlcy4gSW4gdGhlIHNvdXRoIG9mIHRoZSBQQUNJT0NFQSBhcmVhIHRoZSBkb21lc3RpYyBjYXRjaCByZXByZXNlbnRzIG1vcmUgdGhhbiA1MCAlIG9mIG9mZnNob3JlIGZpc2hlcmllcy4gSGlnaGVzdCB0b3RhbCBjYXRjaCB2b2x1bWVzIGFyZSBwcm9kdWNlZCBieSBQYXB1YSBOZXcgR3VpbmVhLCBLaXJpYmF0aSBhbmQgdGhlIEZlZGVyYXRlZCBTdGF0ZXMgb2YgTWljcm9uZXNpYS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+QXF1YWN1bHR1cmUgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWVlXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGFxdWFjdWx0dXJlIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlByYXduczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk95c3RlcjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlNocmltcDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNyYWI8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5UaWxhcGlhPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWlsa2Zpc2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhcXVhXCIsYyxwLDEpLGMscCwwLDc2NzQsNzk3MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRyeVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlByYXduXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiT3lzdGVyXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU2hyaW1wXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ3JhYlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRpbGFwaWFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJNaWxrZmlzaFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRvdGFsXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hlcmllcyBhbmQgQXF1YWN1bHR1cmUgRWNvbm9teTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPkZpc2hlcnkgYW5kIEFxdWFjdWx0dXJlIGVjb25vbWljIHZhbHVlIHBlciBjb3VudHJ5Ojwvc3Ryb25nPiZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWUxXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIxXFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCI0XFxcIj5DYXRjaCBpbiBNaWxsaW9uIFVTRDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvYXN0YWwgZmlzaGVyaWVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXF1YWN1bHR1cmUgPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+RG9tZXN0aWMgb2NlYW5pYyBmaXNoZXJpZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Gb3JlaWduIG9jZWFuaWMgZmlzaGVyaWVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZpc2hlcmllc1wiLGMscCwxKSxjLHAsMCw4NzU0LDg5NTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb2FzdFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFxdWFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJEb21cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGb3JlaWduXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPkZpc2hlcmllcyBhbmQgQXF1YWN1bHR1cmUgc2hhcmUgb2YgR0RQOjwvc3Ryb25nPiZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWRmXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkdEUCBWYWx1ZSAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZ2RwX3ZhbHVlXCIsYyxwLDEpLGMscCwwLDkzNjQsOTQ2OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRyeVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkdEUFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzdHJvbmc+RmlzaGVyaWVzIGFuZCBBcXVhY3VsdHVyZSBzaGFyZSBvZiBUb3RhbCBFeHBvcnQ6PC9zdHJvbmc+Jm5ic3A8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZTNcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5FeHBvcnQgVmFsdWUgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImV4cG9ydF92YWx1ZVwiLGMscCwxKSxjLHAsMCw5ODk1LDEwMDAyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb3VudHJ5XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRXhwb3J0XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgV2l0aGluIHRoZSBQQUNJT0NFQSBhcmVhLCBmb3JlaWduIGFuZCBkb21lc3RpYyBvY2VhbmljIGZpc2hlcmllcyBkb21pbmF0ZSB0aGUgdG90YWwgdmFsdWUgb2YgcHJvZHVjdGlvbiwgZXhjZXB0IGZvciBOZXcgQ2FsZWRvbmlhIGFuZCBGcmVuY2ggUG9seW5lc2lhIHdoZXJlIGFxdWFjdWx0dXJlIGlzIHNpZ25pZmljYW50LiBDb2FzdGFsIGZpc2hlcnkgdmFsdWVzIGFyZSB1c3VhbGx5IGxvd2VyIHRoYW4gb2NlYW5pYyB2YWx1ZXMgZXhjZXB0IGZvciBGaWppLCBUb25nYSwgV2FsbGlzIGFuZCBGdXR1bmEgYW5kIFRva2VsYXUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Ub3VyaXNtPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUb3VyaXN0cyBpbiBQSUNUcyBtb3N0bHkgY29tZSBmcm9tIEFzaWFuIGNvdW50cmllcyB0byBNaWNyb25lc2lhIChKYXBhbiwgU291dGggS29yZWEsIFRhaXdhbiBhbmQgSG9uay1Lb25nIHJlcHJlc2VudCA3MCB0byA5MCUgb2YgdGhlIHRvdXJpc3RzIGluIE1pY3JvbmVzaWEpIGFuZCBBdXN0cmFsaWEvTmV3IFplYWxhbmQgZm9yIHRoZSBzb3V0aGVybiBwYXJ0IG9mIHRoZSBQQUNJT0NFQSBhcmVhLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+SW50ZXJuYXRpb25hbCB0b3VyaXN0IGFycml2YWxzICgyMDEyKTpcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9icj48YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZjlcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaW50ZXJuYXRpb25hbCBhcnJpdmFsIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAmbmJzcCAmbmJzcDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzlmMVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBwb3B1bGF0aW9uIGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8IS0tcGVyYyBwb3A6IDU0NTBhMDViNGViNTgwZjEzYzAyYzlmMS0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+SW50ZXJuYXRpb25hbCB0b3VyaXN0IGFycml2YWxzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeSBwb3B1bGF0aW9uPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+UmF0aW8gYmV0d2VlbiB0b3VyaXN0IGFycml2YWxzIGFuZCB0b3RhbCBwb3B1bGF0aW9uICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbnRsX3RvdXJpc3RfYXJyaXZhbHNcIixjLHAsMSksYyxwLDAsMTE1NDAsMTE3MTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBcnJpdmFsc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBvcHVsYXRpb25cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJJQV9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPlN1bW1hcnkgb2YgQ2hhbmdlIGluIFRvdXJpc206XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWYzXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5OdW1iZXIgb2YgQ291bnRyaWVzIHdoZXJlIFRvdXJpc20gRGVjcmVhc2VkPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TnVtYmVyIG9mIENvdW50cmllcyB3aGVyZSBUb3VyaXNtIEluY3JlYXNlZCBieSA8IDEwMCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5OdW1iZXIgb2YgQ291bnRyaWVzIHdoZXJlIFRvdXJpc20gSW5jcmVhc2VkIGJ5ID4gMTAwJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ0b3VyaXN0X2Fycml2YWxzXCIsYyxwLDEpLGMscCwwLDEyMjg5LDEyNDI2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJERUNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJMRVNTMTAwXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTU9SRTEwMFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5DaGFuZ2UgaW4gdG91cmlzbSBmb3IgZWFjaCBjb3VudHJ5OlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgJm5ic3A8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZjdcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5DaGFuZ2UgaW4gdG91cmlzbSAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwidG91cmlzdF9hcnJpdmFsc19ieV9jb3VudHJ5XCIsYyxwLDEpLGMscCwwLDEyODcxLDEyOTgwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb3VudHJ5XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVG91cl9hcnJcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICBWZXJ5IGRpZmZlcmVudCBzaXR1YXRpb25zIGNoYXJhY3Rlcml6ZSB0aGUgcmVnaW9uLCBidXQgbm8gc3ViLXJlZ2lvbmFsIHRlbmRlbmNpZXMgY2FuIGJlIGVhc2lseSBpZGVudGlmaWVkLiBBcmUgcmVtb3RlbmVzcywgbGV2ZWwgb2YgaW5mcmFzdHJ1Y3R1cmVzLCBjb3N0IG9mIHRyYW5zcG9ydCwgZXRjLiBpbXBvcnRhbnQgZHJpdmluZyBmb3JjZXMgZm9yIHRoZSBmdXR1cmUgb2YgdG91cmlzdGljIGRlc3RpbmF0aW9ucz9cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5Ub3VyaXNtIGVjb25vbWljIGltcGFjdDo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFkZGVkIHZhbHVlIG9mIHRvdXJpc20gKCUgb2YgR0RQKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ0b3VyaXNtX2dkcFwiLGMscCwxKSxjLHAsMCwxMzcxNCwxMzgxOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRyeVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkdEUFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2PjxhIGNsYXNzPVxcXCJkZXRhaWxzXFxcIiBocmVmPVxcXCIjXFxcIj5zaG93IGRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJoaWRkZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIFRvdXJpc23igJlzIGVjb25vbWljIGltcGFjdCB2YXJpZXMgaW4gbGFyZ2UgcHJvcG9ydGlvbnMgdGhyb3VnaG91dCB0aGUgUGFjaWZpYyBJc2xhbmRzIHJlZ2lvbi4gRmV3IHBvcHVsYXRlZCB0b3VyaXN0aWMgZGVzdGluYXRpb25zIG9yIGxvdyBHRFAgY291bnRyaWVzIGFyZSBsaWtlbHkgdG8gcmVseSBvbiB0b3VyaXNtLCBzdWNoIGFzIEZpamkgYW5kIEd1YW0uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW5lcmd5PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5GdWVsIEltcG9ydHM6ICZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWQwXFxcIiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgZnVlbCBpbXBvcnQgbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGg+JSBvZiBHRFAgZnJvbSBGdWVsIGZyb20gSW1wb3J0czwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZ1ZWxfaW1wb3J0XCIsYyxwLDEpLGMscCwwLDE0Njk5LDE0ODE0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRyeVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRnVlbFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2PjxhIGNsYXNzPVxcXCJkZXRhaWxzXFxcIiBocmVmPVxcXCIjXFxcIj5zaG93IGRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJoaWRkZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBVbnRpbCB0aGlzIGRlY2FkZSwgYWxsIHRoZSBjb3VudHJpZXPigJkgZW5lcmd5IHN1cHBseSBkZXBlbmRlZCBvbiBwZXRyb2xldW0gYW5kIGluIGNvbnNlcXVlbmNlIHJlbGllZCBoZWF2aWx5IG9uIGltcG9ydC4gRnVlbCBpbXBvcnQgY2FuIHJlcHJlc2VudCBmcm9tIDUlIG9mIEdEUCAoUGFwdWEgTmV3IEd1aW5lYSkgdG8gMjglIG9mIHRoZSBHRFAgKENvb2sgSXNsYW5kcykuIENoYW5nZXMgaW4gdGhlIGRlbWFuZCwgaW5jbHVkaW5nIGZvciB0aGUgc2VydmljZSBzZWN0b3IsIHBvc2UgYW4gaW5jcmVhc2luZyB0aHJlYXQgdG8gZW5lcmd5IHNlY3VyaXR5IGZvciBQYWNpZmljIHBvcHVsYXRpb25zLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+UmVuZXdhYmxlIEVuZXJneTogJm5ic3A8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZDJcXFwiIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgcmVuZXdhYmxlIGVuZXJneSBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPiUgb2YgRWxlY3RyaWNpdHkgZ2VuZXJhdGVkIGJ5IFJlbmV3YWJsZSBFbmVyZ3k8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVuZXdhYmxlX2VuZXJneVwiLGMscCwxKSxjLHAsMCwxNTc2MiwxNTg2OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRyeVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlJlbmV3XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgVGhlIG9jZWFuIGNvdWxkIHByb2R1Y2UgZW5lcmd5IHZpYSB0aGUgaW1wbGVtZW50YXRpb24gb2YgbmV3IHRlY2hub2xvZ2llcy4gVGhlcm1hbCB0ZWNobm9sb2d5IGFuZCB3YXZlIGVuZXJneSBjb252ZXJzaW9uIGFyZSBlc3RpbWF0ZWQgdGhlIG1vc3QgZnJ1aXRmdWwgcG90ZW50aWFsIG5ldyByZXNvdXJjZXMuIEV2ZW4gaWYgdGhlc2Ugc29sdXRpb25zIGFyZSByZWNlbnQgYW5kIGRldmljZXMgYXJlIHN0aWxsIGV4cGVuc2l2ZSwgaW4gdGhlIGxvbmcgdGVybSwgdGhleSBzaG91bGQgb2ZmZXIgYSB2ZXJ5IGNvbXBldGl0aXZlIGFsdGVybmF0aXZlIHRvIGZvc3NpbCBmdWVsLiBNb3Jlb3ZlciwgdGhlIFBhY2lmaWMgY291bGQgYmUgYSBrZXkgcmVnaW9uIGluIHRoZSBkZXZlbG9wbWVudCBvZiBzb21lIG9mIHRoZXNlIHNvbHV0aW9ucyBieSBhbGxvd2luZyB0aGUgaW5kdXN0cnkgdG8gbWF0dXJlIGFuZCBiZWNvbWUgY29tcGV0aXRpdmUuIEEgRnJhbWV3b3JrIGZvciBBY3Rpb24gb24gRW5lcmd5IFNlY3VyaXR5IGluIHRoZSBQYWNpZmljIHdhcyBlc3RhYmxpc2hlZCB1bmRlciB0aGUgZ3VpZGFuY2Ugb2YgU1BDIHdpdGggQ1JPUCBhZ2VuY2llcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59Il19
