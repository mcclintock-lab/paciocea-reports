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

  AdaptationTab.prototype.dependencies = ['Population'];

  AdaptationTab.prototype.render = function() {
    var attributes, context, d3IsPresent, isCollection, numpeople, percpeople;
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
this["Templates"]["adaptation"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Population</h4>");_.b("\n" + i);_.b("  <p class=\"large\">The total population of the countries within the sketch is <strong>");_.b(_.v(_.f("numpeople",c,p,0)));_.b("</strong>, which is <strong>");_.b(_.v(_.f("percpeople",c,p,0)));_.b("%</strong> of the population within the PACIOCEA region.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["biodiversity"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Biodiversity</h4>");_.b("\n" + i);_.b("    <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</a></th>");_.b("\n" + i);_.b("        <th>Area (% of total region)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("     </thead>");_.b("\n" + i);_.b("     <tbody> ");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("  		<td>Coral</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("coral_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("coral_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("  		<td>Mangroves</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("mangroves_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("mangroves_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("       <tr>");_.b("\n" + i);_.b("  		<td>Seagrass</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("seagrass_area",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("seagrass_perc",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("  	The table shows the area of the habitat type (in square kilometers) within the ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch,");_.b("\n");};_.b("  	");if(_.s(_.f("isCollection",c,p,1),c,p,0,1074,1085,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection,");});c.pop();}_.b(" as well as the percent of the total PACIOCEA habitat found within each ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch.");};_.b("\n" + i);_.b("  	");if(_.s(_.f("isCollection",c,p,1),c,p,0,1236,1247,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection.");});c.pop();}_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Habitats in Seamounts <a href=\"#\" data-toggle-node=\"54dbe1e5fa94e697759d2564\" data-visible=\"false\">show seamount layer");_.b("\n" + i);_.b("  </a></h4>");_.b("\n" + i);_.b("  <p style=\"padding-top:5px;\"> The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1496,1506,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" includes <strong>");_.b(_.v(_.f("num_seamounts",c,p,0)));_.b(" seamounts</strong> with an average depth of <strong>");_.b(_.v(_.f("avg_depth_seamounts",c,p,0)));_.b(" meters.");_.b("\n" + i);_.b("  </strong>");_.b("\n" + i);if(_.s(_.f("has_seamounts",c,p,1),c,p,0,1727,1934,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    The average distance between seamounts within the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1800,1810,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of ");_.b("\n" + i);_.b("    interest ");};_.b(" is <strong>");_.b(_.v(_.f("avg_dist_seamounts",c,p,0)));_.b(" km</strong>.");_.b("\n");});c.pop();}_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The physical structure of some seamounts enables the formation of hydrographic features and current flows that can:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Enhance local production through upwelling </li>");_.b("\n" + i);_.b("        <li>Keep species and production processes concentrated over the seamount  </li>");_.b("\n" + i);_.b("        <li>Have a concentration of zooplankton and mesopelagic fish meaning rich feeding grounds and spawning areas for fish and higher predators, and hence fisheries. Seamounts are a hotspot for biodiverstiy but are still understudied.</li>");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(_.s(_.f("hasMPAs",c,p,1),c,p,0,2637,3473,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Marine Protected Areas</h4>");_.b("\n" + i);_.b("    <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>IUCN Category</th>");_.b("\n" + i);_.b("        <th>Number of MPAs</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</th>");_.b("\n" + i);_.b("        <th>Area (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("     </thead>");_.b("\n" + i);if(_.s(_.f("mpa_cats",c,p,1),c,p,0,2916,3061,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CAT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NUM_MPAS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("MPA_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("MPA_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("  </table>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    The table shows the number and area of Marine Protected Areas (MPAs) for each IUCN category within the ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch,");_.b("\n");};_.b("    ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3281,3292,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection,");});c.pop();}_.b(" as well as the aerial percent of the ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b("\n" + i);_.b("    ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3409,3419,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}_.b(" within each category.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasMPAs",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marine Protected Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large\">There are <strong>no</strong> Marine Protected Areas within this ");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b("\n" + i);_.b("    ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3707,3717,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");};return _.fl();;});
this["Templates"]["economy"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>A Note on Reporting</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    For the EEZ statistics, the result is for the <strong>entire EEZ</strong>, and not only the part of the EEZ contained within the area of interest.</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This ");if(_.s(_.f("isCollection",c,p,1),c,p,0,650,660,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" area of interest ");};_.b(" is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Deep Sea </h4>");_.b("\n" + i);_.b("  <div class=\"in-report-header\">Deep Sea Minerals: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d3\" data-visible=\"false\">show mineral layers");_.b("\n" + i);_.b("  </a></div>");_.b("\n" + i);_.b("  <table> ");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:170px;\">Type</th>");_.b("\n" + i);_.b("        <th>Area (sq. km)</a></th>");_.b("\n" + i);_.b("        <th>Area (% of total region)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);if(_.s(_.f("mining",c,p,1),c,p,0,1201,1318,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SIZE_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </thead>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("    <div class=\"hidden\">");_.b("\n" + i);_.b("      <div class=\"list-header\">The deep sea resources available for extraction are divided into 4 types:</div>");_.b("\n" + i);_.b("      <ol>");_.b("\n" + i);_.b("        <li>Polymetallic Nodules (Manganese, Copper, Nickel, Cobalt) - 4,000 - 6,000 m depth</li>");_.b("\n" + i);_.b("        <li>Cobalt-rich Manganese Crusts (Cobalt) - 800 - 3,000 m depth</li>");_.b("\n" + i);_.b("        <li>Sulphide Deposits (Copper) - 1,500 - 4,000 m depth</li>");_.b("\n" + i);_.b("        <li>Deep-sea mud (rare earth elements, yttrium) - 2,000 -6,000 m depth.</li>                                    ");_.b("\n" + i);_.b("      </ol>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("          The DSM deposits are higher in mineral content than on-land deposits. Typical value of a tonne of land based ore is 50-200 USD, for sea floor deposits it’s 500-1500 USD. DSM mining in the PACIOCEA  has a strong potential.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Coastal Fisheries </h4>");_.b("\n" + i);_.b("      <p class=\"large\">");_.b("\n" + i);_.b("        The term coastal fishery resource means “any fishery, any species of fish, or any stock of fish that is broadly distributed across the coastal waters (12 nautical miles) under the jurisdiction of a country.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Coastal Catch: <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e9\" data-visible=\"false\">show coastal catch layer</a></div>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch (in tonnes)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>% of Total Coastal Catch</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("            <th>Demersal </th>");_.b("\n" + i);_.b("            <th>Pelagic  </th>");_.b("\n" + i);_.b("            <th>Invertebrate </th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("coastal_catch",c,p,1),c,p,0,3151,3396,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("TOT_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEM_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PEL_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("INV_TONS",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("            <p>");_.b("\n" + i);_.b("                Within the PACIOCEA region, the highest catch volumes are located in Papua New Guinea, Fiji, Kiribati, Federated States of Micronesia and Solomon Islands. Demersal species dominate the catch (33% to 75%). Demersal fisheries represent an important part of the total catch explained by the presence of lagoons and local fishing techniques");_.b("\n" + i);_.b("            </p>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Coastal commercial catch vs. coastal subsistence catch</br>");_.b("\n" + i);_.b("      <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9eb\" data-visible=\"false\">show commercial/subsistence catch layer");_.b("\n" + i);_.b("      </a>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Commercial Catch (kg per capita)</th>");_.b("\n" + i);_.b("            <th>Subsistence Catch (kg per capita)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("comm_sub_catch",c,p,1),c,p,0,4468,4615,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COM_KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SUB_KG_CAP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Within the PACIOCEA area, the coastal catch volume is largely dominated by subsistence fisheries. The largest per capita volume of coastal catch (both commercial and subsistence) is located over the smallest land areas. This fact can be related with the low potential of these countries to develop agriculture. Thus, coastal degradation of natural habitats and pollution increase can have repercussions on food security for smaller land area countries.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Oceanic Fisheries ");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e6\" data-visible=\"false\">show oceanic catch layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The term oceanic fishery resource means “any fishery, any species of fish, or any stock of fish that is broadly distributed across the exclusive economical zone (between 12 and 200 nautical miles) under the jurisdiction of a country.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"2\"></th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Domestic Catch</th>");_.b("\n" + i);_.b("            <th colspan=\"2\">Foreign Catch</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Total (tonnes)</th>");_.b("\n" + i);_.b("            <th>tonnes </th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("            <th>tonnes</th>");_.b("\n" + i);_.b("            <th>% of catch in EEZ</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("ocean_catch",c,p,1),c,p,0,6231,6470,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("COUNTRY",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_DOM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DOM_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("SK_FRN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("FRN_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Western and Central Pacific offshore fisheries represent more than 60% of total worldwide fisheries and 80% of the Pacific tuna catch. Oceanic fisheries represent 90% of total sea food production in the PACIOCEA area. Foreign fleets dominate Northern oceanic catches. In the south of the PACIOCEA area the domestic catch represents more than 50 % of offshore fisheries. Highest total catch volumes are produced by Papua New Guinea, Kiribati and the Federated States of Micronesia.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Aquaculture <a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9ee\" data-visible=\"false\">show aquaculture layer</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Prawns</th>");_.b("\n" + i);_.b("            <th>Oyster</th>");_.b("\n" + i);_.b("            <th>Shrimp</th>");_.b("\n" + i);_.b("            <th>Crab</th>");_.b("\n" + i);_.b("            <th>Tilapia</th>");_.b("\n" + i);_.b("            <th>Milkfish</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("aqua",c,p,1),c,p,0,7674,7972,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Prawn",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Oyster",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Shrimp",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Crab",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Tilapia",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Milkfish",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Total",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Fisheries and Aquaculture Economy</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fishery and Aquaculture economic value per country:</strong>&nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e1\" data-visible=\"false\">show layer</a>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th colspan=\"1\"></th>");_.b("\n" + i);_.b("            <th colspan=\"4\">Catch in Million USD</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Coastal fisheries</th>");_.b("\n" + i);_.b("            <th>Aquaculture </th>");_.b("\n" + i);_.b("            <th>Domestic oceanic fisheries</th>");_.b("\n" + i);_.b("            <th>Foreign oceanic fisheries</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("fisheries",c,p,1),c,p,0,8754,8952,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Coast",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Aqua",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Dom",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Foreign",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of GDP:</strong>&nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9df\" data-visible=\"false\">show layer</a>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>GDP Value (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("gdp_value",c,p,1),c,p,0,9364,9468,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("GDP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <strong>Fisheries and Aquaculture share of Total Export:</strong>&nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9e3\" data-visible=\"false\">show layer</a>");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Export Value (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("export_value",c,p,1),c,p,0,9895,10002,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Export",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Within the PACIOCEA area, foreign and domestic oceanic fisheries dominate the total value of production, except for New Caledonia and French Polynesia where aquaculture is significant. Coastal fishery values are usually lower than oceanic values except for Fiji, Tonga, Wallis and Futuna and Tokelau.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Tourism</h4>");_.b("\n" + i);_.b("    <p class=\"large\">");_.b("\n" + i);_.b("      Tourists in PICTs mostly come from Asian countries to Micronesia (Japan, South Korea, Taiwan and Honk-Kong represent 70 to 90% of the tourists in Micronesia) and Australia/New Zealand for the southern part of the PACIOCEA area.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);_.b("\n" + i);_.b("    <div class=\"in-report-header\">International tourist arrivals (2012):");_.b("\n" + i);_.b("    </br><a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f9\" data-visible=\"false\">show international arrival layer</a>");_.b("\n" + i);_.b("    &nbsp &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f1\" data-visible=\"false\">show population layer</a></div>");_.b("\n" + i);_.b("    <!--perc pop: 5450a05b4eb580f13c02c9f1-->");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>International tourist arrivals</th>");_.b("\n" + i);_.b("            <th>Country population</th>");_.b("\n" + i);_.b("            <th>Ratio between tourist arrivals and total population (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("intl_tourist_arrivals",c,p,1),c,p,0,11540,11718,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Arrivals",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Population",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("IA_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("\n" + i);_.b("    <div class=\"in-report-header\">Summary of Change in Tourism:");_.b("\n" + i);_.b("    &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f3\" data-visible=\"false\">show layer</a></div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Decreased</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by < 100%</th>");_.b("\n" + i);_.b("            <th>Number of Countries where Tourism Increased by > 100%</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_arrivals",c,p,1),c,p,0,12289,12426,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("DEC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("LESS100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("MORE100",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Change in tourism for each country:");_.b("\n" + i);_.b("        &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9f7\" data-visible=\"false\">show layer</a></div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Change in tourism (%)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourist_arrivals_by_country",c,p,1),c,p,0,12871,12980,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Tour_arr",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Very different situations characterize the region, but no sub-regional tendencies can be easily identified. Are remoteness, level of infrastructures, cost of transport, etc. important driving forces for the future of touristic destinations?");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("\n" + i);_.b("      <div class=\"in-report-header\">Tourism economic impact:</div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>Added value of tourism (% of GDP)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("tourism_gdp",c,p,1),c,p,0,13714,13818,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("GDP",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("              Tourism’s economic impact varies in large proportions throughout the Pacific Islands region. Few populated touristic destinations or low GDP countries are likely to rely on tourism, such as Fiji and Guam.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Energy</h4>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">Fuel Imports: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d0\" ");_.b("\n" + i);_.b("        data-visible=\"false\">show fuel import layer</a></div>");_.b("\n" + i);_.b("        <table>");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("              <tr>");_.b("\n" + i);_.b("                <th>Country</th>");_.b("\n" + i);_.b("                <th>% of GDP from Fuel from Imports</th>");_.b("\n" + i);_.b("              </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("fuel_import",c,p,1),c,p,0,14699,14814,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("Fuel",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n" + i);_.b("      <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Until this decade, all the countries’ energy supply depended on petroleum and in consequence relied heavily on import. Fuel import can represent from 5% of GDP (Papua New Guinea) to 28% of the GDP (Cook Islands). Changes in the demand, including for the service sector, pose an increasing threat to energy security for Pacific populations.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("    <div class=\"in-report-header\">Renewable Energy: &nbsp<a href=\"#\" data-toggle-node=\"5450a05b4eb580f13c02c9d2\" ");_.b("\n" + i);_.b("      data-visible=\"false\">show renewable energy layer</a></div>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Country</th>");_.b("\n" + i);_.b("            <th>% of Electricity generated by Renewable Energy</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("renewable_energy",c,p,1),c,p,0,15762,15868,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Country",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("Renew",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("        <div><a class=\"details\" href=\"#\">show details</a>");_.b("\n" + i);_.b("        <div class=\"hidden\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            The ocean could produce energy via the implementation of new technologies. Thermal technology and wave energy conversion are estimated the most fruitful potential new resources. Even if these solutions are recent and devices are still expensive, in the long term, they should offer a very competitive alternative to fossil fuel. Moreover, the Pacific could be a key region in the development of some of these solutions by allowing the industry to mature and become competitive. A Framework for Action on Energy Security in the Pacific was established under the guidance of SPC with CROP agencies.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvam9iSXRlbS5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy91dGlscy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3BhY2lvY2VhLXJlcG9ydHMvc2NyaXB0cy9hZGFwdGF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Jhc2VSZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvYmlvZGl2ZXJzaXR5LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy9zY3JpcHRzL2Vjb25vbXkuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9wYWNpb2NlYS1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvcGFjaW9jZWEtcmVwb3J0cy90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxD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V2EsSUFBYixLQUFBO0NBWEEsQ0FhVyxJQUFYLEdBQUE7Q0FiQSxDQWNjLElBQWQsTUFBQTtDQWRBLENBZVcsSUFBWCxHQUFBO0NBZkEsQ0FnQkssRUFBTCxFQUFBO0NBaEJBLENBa0JpQixJQUFqQixVQUFBO0NBbEJBLENBbUI2QixJQUE3QixxQkFBQTtDQW5CQSxDQW9CYSxJQUFiLEtBQUE7Q0FwQkEsQ0FxQnVCLElBQXZCLGVBQUE7Q0FyQkEsQ0F1QmtCLElBQWxCLFVBQUE7Q0F2QkEsQ0F3QmEsSUFBYixLQUFBO0NBMUVGLEtBQUE7Q0FBQSxDQTZFb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUztDQTdFbkIsRUE4RWEsQ0FBYixNQUFBO0NBQWEsQ0FBaUIsSUFBaEIsR0FBRCxNQUFDO0NBQUQsQ0FBMkMsSUFBZixJQUE1QixJQUE0QjtDQUE1QixDQUFvRSxJQUFiLElBQXZELEVBQXVEO0NBOUVwRSxLQUFBO0NBQUEsQ0ErRWtDLEVBQWxDLEdBQUEsR0FBQSxHQUFBLElBQUEsRUFBQSxHQUFBLENBQUE7Q0FDQyxHQUFBLE9BQUQsUUFBQTtDQWpHRixFQWdCUTs7Q0FoQlI7O0NBRnVCOztBQXFHekIsQ0E5R0EsRUE4R2lCLEdBQVgsQ0FBTixHQTlHQTs7OztBQ0FBLElBQUEsc0NBQUE7O0FBQUEsQ0FBQSxFQUFhLElBQUEsR0FBYixRQUFhOztBQUNiLENBREEsRUFDZ0IsSUFBQSxNQUFoQixRQUFnQjs7QUFDaEIsQ0FGQSxFQUVrQixJQUFBLFFBQWxCLFFBQWtCOztBQUVsQixDQUpBLEVBSVUsR0FBSixHQUFxQixLQUEzQjtDQUNFLENBQUEsRUFBQSxFQUFNLElBQU0sR0FBQSxFQUFBO0NBRUwsS0FBRCxHQUFOLEVBQUEsR0FBbUI7Q0FISzs7OztBQ0oxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAoQG1heEV0YSArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje0BtYXhFdGEgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGFTZWNvbmRzJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCwxMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiZG9Ob3RFeHBvcnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO307fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSIsIkJhc2VSZXBvcnRUYWIgPSByZXF1aXJlICdiYXNlUmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEFkYXB0YXRpb25UYWIgZXh0ZW5kcyBCYXNlUmVwb3J0VGFiXG4gICMgdGhpcyBpcyB0aGUgbmFtZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBUYWJcbiAgbmFtZTogJ0FkYXB0YXRpb24nXG4gIGNsYXNzTmFtZTogJ2FkYXB0YXRpb24nXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkYXB0YXRpb25cbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ1BvcHVsYXRpb24nXG4gIF1cblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBudW1wZW9wbGUgPSBAcmVjb3JkU2V0KCdQb3B1bGF0aW9uJywgJ1BvcHVsYXRpb24nKS5mbG9hdCgnUG9wdWxhdGlvbicpXG4gICAgbnVtcGVvcGxlID0gQGFkZENvbW1hcyBudW1wZW9wbGVcbiAgICBwZXJjcGVvcGxlID0gQHJlY29yZFNldCgnUG9wdWxhdGlvbicsICdQb3B1bGF0aW9uJykuZmxvYXQoJ1BFUkNfUE9QJylcbiAgICAjc2hvdyB0YWJsZXMgaW5zdGVhZCBvZiBncmFwaCBmb3IgSUVcbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIGQzSXNQcmVzZW50ID0gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGQzSXNQcmVzZW50ID0gZmFsc2VcblxuICAgIGF0dHJpYnV0ZXMgPSBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFueUF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCkubGVuZ3RoID4gMFxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG5cbiAgICAgIG51bXBlb3BsZTogbnVtcGVvcGxlXG4gICAgICBwZXJjcGVvcGxlOiBwZXJjcGVvcGxlXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbiBcbm1vZHVsZS5leHBvcnRzID0gQWRhcHRhdGlvblRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBCYXNlUmVwb3J0VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gICMgdGhpcyBpcyB0aGUgbmFtZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBUYWJcbiAgbmFtZTogJ0Jhc2VSZXBvcnQnXG4gIGNsYXNzTmFtZTogJ2Jhc2VyZXBvcnQnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICBldmVudHM6XG4gICAgXCJjbGljayBhLmRldGFpbHNcIjogJ29uTW9yZVJlc3VsdHNDbGljaydcblxuICAjbm90IHVzZWQgeWV0XG4gIHNldHVwVGFibGVTb3J0aW5nOiAoZGF0YSwgdGJvZHlOYW1lLCB0YWJsZU5hbWUsIGRhdGFfdmFsdWUsIGNvbF92YWx1ZXMsIHJvd19uYW1lLCBzZWxlY3RlZF9jb2xfcHJlZml4KSA9PlxuICAgIGluZGV4ID0gMFxuICAgIGRlZmF1bHRfc29ydF9rZXkgPSBcIlwiXG4gICAgZGVmYXVsdF9zb3J0X2RhdGEgPSBcIlwiXG4gICAgZGVmYXVsdF9yb3dfZGF0YSA9IFwiXCJcbiAgICBkYXRhX2NvbHMgPSAodiBmb3IgaywgdiBvZiBjb2xfdmFsdWVzKVxuICAgIGZvciBrLHYgaW4gY29sX3ZhbHVlc1xuICAgICAgQCQoJy4nK2spLmNsaWNrIChldmVudCkgPT5cbiAgICAgICAgQHJlbmRlclNvcnQoaywgdGFibGVOYW1lLCBkYXRhX3ZhbHVlLCBldmVudCwgdiwgdGJvZHlOYW1lLCAoaW5kZXggPiAwKSwgXG4gICAgICAgICAgQGdldFRhYmxlUm93LCByb3dfbmFtZSwgZGF0YV9jb2xzLCBzZWxlY3RlZF9jb2xfcHJlZml4KVxuICAgICAgaWYgaW5kZXggPT0gMFxuICAgICAgICBkZWZhdWx0X3NvcnRfa2V5ID0ga1xuICAgICAgICBkZWZhdWx0X3NvcnRfZGF0YSA9IGRhdGFfdmFsdWVcbiAgICAgICAgZGVmYXVsdF9yb3dfZGF0YSA9IEBnZXRUYWJsZVJvd1xuICAgICAgaW5kZXgrPTFcblxuICAgIEByZW5kZXJTb3J0KGRlZmF1bHRfc29ydF9rZXksIHRhYmxlTmFtZSwgZGVmYXVsdF9zb3J0X2RhdGEsIHVuZGVmaW5lZCwgZGVmYXVsdF9zb3J0X2RhdGEsIHRib2R5TmFtZSwgXG4gICAgICBmYWxzZSwgZGVmYXVsdF9yb3dfZGF0YSwgcm93X25hbWUsIGRhdGFfY29scywgc2VsZWN0ZWRfY29sX3ByZWZpeClcblxuICAjZG8gdGhlIHNvcnRpbmcgLSBzaG91bGQgYmUgdGFibGUgaW5kZXBlbmRlbnRcbiAgI3NraXAgYW55IHRoYXQgYXJlIGxlc3MgdGhhbiAwLjAwXG4gIHJlbmRlclNvcnQ6IChuYW1lLCB0YWJsZU5hbWUsIHBkYXRhLCBldmVudCwgc29ydEJ5LCB0Ym9keU5hbWUsIGlzRmxvYXQsIGdldFJvd1N0cmluZ1ZhbHVlLCByb3dfbmFtZSwgZGF0YV9jb2xzLFxuICAgIHNlbGVjdGVkX2NvbF9wcmVmaXgpID0+XG4gICAgaWYgZXZlbnRcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICB0YXJnZXRDb2x1bW4gPSBAZ2V0U2VsZWN0ZWRDb2x1bW4oZXZlbnQsIG5hbWUsIHNlbGVjdGVkX2NvbF9wcmVmaXgpXG4gICAgICBzb3J0VXAgPSBAZ2V0U29ydERpcih0YXJnZXRDb2x1bW4pXG5cbiAgICAgIGlmIGlzRmxvYXRcbiAgICAgICAgZGF0YSA9IF8uc29ydEJ5IHBkYXRhLCAocm93KSAtPiAgcGFyc2VGbG9hdChyb3dbc29ydEJ5XSlcbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IF8uc29ydEJ5IHBkYXRhLCAocm93KSAtPiByb3dbc29ydEJ5XVxuXG4gICAgICAjZmxpcCBzb3J0aW5nIGlmIG5lZWRlZFxuICAgICAgaWYgc29ydFVwXG4gICAgICAgIGRhdGEucmV2ZXJzZSgpXG5cbiAgICAgIGVsID0gQCQodGJvZHlOYW1lKVswXVxuICAgICAgaGFiX2JvZHkgPSBkMy5zZWxlY3QoZWwpXG5cbiAgICAgICNyZW1vdmUgb2xkIHJvd3NcbiAgICAgIGhhYl9ib2R5LnNlbGVjdEFsbChcInRyLlwiK3Jvd19uYW1lKVxuICAgICAgICAucmVtb3ZlKClcblxuICAgICAgI2FkZCBuZXcgcm93cyAoYW5kIGRhdGEpXG4gICAgICByb3dzID0gaGFiX2JvZHkuc2VsZWN0QWxsKFwidHJcIilcbiAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAuZW50ZXIoKS5pbnNlcnQoXCJ0clwiLCBcIjpmaXJzdC1jaGlsZFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIHJvd19uYW1lKVxuXG4gICAgICBcbiAgICAgIGNlbGxzID0gcm93cy5zZWxlY3RBbGwoXCJ0ZFwiKVxuICAgICAgICAgIC5kYXRhKChyb3csIGkpIC0+ZGF0YV9jb2xzLm1hcCAoY29sdW1uKSAtPiAoY29sdW1uOiBjb2x1bW4sIHZhbHVlOiByb3dbY29sdW1uXSkpXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJ0ZFwiKS50ZXh0KChkLCBpKSAtPiBcbiAgICAgICAgICBkLnZhbHVlXG4gICAgICAgICkgICAgXG5cbiAgICAgIEBzZXROZXdTb3J0RGlyKHRhcmdldENvbHVtbiwgc29ydFVwKVxuICAgICAgQHNldFNvcnRpbmdDb2xvcihldmVudCwgdGFibGVOYW1lKVxuICAgICAgI2ZpcmUgdGhlIGV2ZW50IGZvciB0aGUgYWN0aXZlIHBhZ2UgaWYgcGFnaW5hdGlvbiBpcyBwcmVzZW50XG4gICAgICBAZmlyZVBhZ2luYXRpb24odGFibGVOYW1lKVxuICAgICAgaWYgZXZlbnRcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAjdGFibGUgcm93IGZvciBoYWJpdGF0IHJlcHJlc2VudGF0aW9uXG4gIGdldFRhYmxlUm93OiAoZCwgZGF0YV9jb2xzKSA9PlxuICAgIHJldHVybiBcIjx0ZD5cIitkW2RhdGFfY29sc1swXV0rXCI8L3RkPlwiK1wiPHRkPlwiK2RbZGF0YV9jb2xzWzFdXStcIjwvdGQ+XCIrXCI8dGQ+XCIrZFtkYXRhX2NvbHNbMl1dK1wiPC90ZD5cIlxuXG4gIHNldFNvcnRpbmdDb2xvcjogKGV2ZW50LCB0YWJsZU5hbWUpID0+XG4gICAgc29ydGluZ0NsYXNzID0gXCJzb3J0aW5nX2NvbFwiXG4gICAgaWYgZXZlbnRcbiAgICAgIHBhcmVudCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkucGFyZW50KClcbiAgICAgIG5ld1RhcmdldE5hbWUgPSBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZVxuICAgICAgdGFyZ2V0U3RyID0gdGFibGVOYW1lK1wiIHRoLnNvcnRpbmdfY29sIGFcIiAgIFxuICAgICAgaWYgQCQodGFyZ2V0U3RyKSBhbmQgQCQodGFyZ2V0U3RyKVswXVxuICAgICAgICBvbGRUYXJnZXROYW1lID0gQCQodGFyZ2V0U3RyKVswXS5jbGFzc05hbWVcbiAgICAgICAgaWYgbmV3VGFyZ2V0TmFtZSAhPSBvbGRUYXJnZXROYW1lXG4gICAgICAgICAgI3JlbW92ZSBpdCBmcm9tIG9sZCBcbiAgICAgICAgICBoZWFkZXJOYW1lID0gdGFibGVOYW1lK1wiIHRoLnNvcnRpbmdfY29sXCJcbiAgICAgICAgICBAJChoZWFkZXJOYW1lKS5yZW1vdmVDbGFzcyhzb3J0aW5nQ2xhc3MpXG4gICAgICAgICAgI2FuZCBhZGQgaXQgdG8gbmV3XG4gICAgICAgICAgcGFyZW50LmFkZENsYXNzKHNvcnRpbmdDbGFzcylcbiAgICAgXG4gIGdldFNvcnREaXI6ICh0YXJnZXRDb2x1bW4pID0+XG4gICAgIHNvcnR1cCA9IEAkKCcuJyt0YXJnZXRDb2x1bW4pLmhhc0NsYXNzKFwic29ydF91cFwiKVxuICAgICByZXR1cm4gc29ydHVwXG5cbiAgZ2V0U2VsZWN0ZWRDb2x1bW46IChldmVudCwgbmFtZSwgcHJlZml4X3N0cikgPT5cbiAgICBpZiBldmVudFxuICAgICAgI2dldCBzb3J0IG9yZGVyXG4gICAgICB0YXJnZXRDb2x1bW4gPSBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZVxuICAgICAgbXVsdGlDbGFzc2VzID0gdGFyZ2V0Q29sdW1uLnNwbGl0KCcgJylcblxuICAgICAgdGd0Q2xhc3NOYW1lID1fLmZpbmQgbXVsdGlDbGFzc2VzLCAoY2xhc3NuYW1lKSAtPiBcbiAgICAgICAgY2xhc3NuYW1lLmxhc3RJbmRleE9mKHByZWZpeF9zdHIsMCkgPT0gMFxuICAgICAgdGFyZ2V0Q29sdW1uID0gdGd0Q2xhc3NOYW1lXG4gICAgZWxzZVxuICAgICAgI3doZW4gdGhlcmUgaXMgbm8gZXZlbnQsIGZpcnN0IHRpbWUgdGFibGUgaXMgZmlsbGVkXG4gICAgICB0YXJnZXRDb2x1bW4gPSBuYW1lXG5cbiAgICByZXR1cm4gdGFyZ2V0Q29sdW1uXG5cbiAgc2V0TmV3U29ydERpcjogKHRhcmdldENvbHVtbiwgc29ydFVwKSA9PlxuICAgICNhbmQgc3dpdGNoIGl0XG4gICAgaWYgc29ydFVwXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5yZW1vdmVDbGFzcygnc29ydF91cCcpXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5hZGRDbGFzcygnc29ydF9kb3duJylcbiAgICBlbHNlXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5hZGRDbGFzcygnc29ydF91cCcpXG4gICAgICBAJCgnLicrdGFyZ2V0Q29sdW1uKS5yZW1vdmVDbGFzcygnc29ydF9kb3duJylcblxuICBmaXJlUGFnaW5hdGlvbjogKHRhYmxlTmFtZSkgPT5cbiAgICBlbCA9IEAkKHRhYmxlTmFtZSlbMF1cbiAgICB0Z3RfdGFibGUgPSBkMy5zZWxlY3QoZWwpXG4gICAgYWN0aXZlX3BhZ2UgPSB0Z3RfdGFibGUuc2VsZWN0QWxsKFwiLmFjdGl2ZSBhXCIpXG4gICAgaWYgYWN0aXZlX3BhZ2UgYW5kIGFjdGl2ZV9wYWdlWzBdIGFuZCBhY3RpdmVfcGFnZVswXVswXVxuICAgICAgYWN0aXZlX3BhZ2VbMF1bMF0uY2xpY2soKVxuXG5cblxuICBnZXROdW1TZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIHNtLk5VTUJFUlxuICAgIHJldHVybiAwXG5cbiAgZ2V0QXZnRGVwdGhTZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIE1hdGgucm91bmQoc20uQVZHX0RFUFRIKVxuXG4gIGdldEF2Z0Rpc3RTZWFtb3VudHM6IChzZWFtb3VudHMpID0+XG4gICAgZm9yIHNtIGluIHNlYW1vdW50c1xuICAgICAgcmV0dXJuIHNtLkNPTk5fRElTVFxuXG4gIHByb2Nlc3NNaW5pbmdEYXRhOiAobWluaW5nX2RhdGEpID0+XG4gICAgbmV3X21pbmluZ19kYXRhID0gW11cbiAgICBmb3IgbWQgaW4gbWluaW5nX2RhdGFcbiAgICAgIG5hbWUgPSBtZC5UWVBFXG4gICAgICBzaXplID0gQGFkZENvbW1hcyBtZC5TSVpFX1NRS01cbiAgICAgIHBlcmMgPSBtZC5QRVJDX1RPVFxuICAgICAgaWYgcGVyYyA8IDAuMVxuICAgICAgICBwZXJjID0gXCI8IDAuMVwiXG4gICAgICBuZXdfbWluaW5nX2RhdGEucHVzaCB7VFlQRTpuYW1lLCBTSVpFX1NRS006c2l6ZSxQRVJDX1RPVDpwZXJjfVxuXG4gICAgcmV0dXJuIG5ld19taW5pbmdfZGF0YVxuXG4gIGFkZENvbW1hczogKG51bV9zdHIpID0+XG4gICAgbnVtX3N0ciArPSAnJ1xuICAgIHggPSBudW1fc3RyLnNwbGl0KCcuJylcbiAgICB4MSA9IHhbMF1cbiAgICB4MiA9IGlmIHgubGVuZ3RoID4gMSB0aGVuICcuJyArIHhbMV0gZWxzZSAnJ1xuICAgIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgICB3aGlsZSByZ3gudGVzdCh4MSlcbiAgICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyAnLCcgKyAnJDInKVxuICAgIHJldHVybiB4MSArIHgyXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgIHRhcmdldF9saW5rID0gJChlLnRhcmdldClcbiAgICBzZWxlY3RlZCA9IHRhcmdldF9saW5rLm5leHQoKVxuICAgIHNlbGNsYXNzID0gc2VsZWN0ZWQuYXR0cihcImNsYXNzXCIpXG4gICAgaWYgc2VsY2xhc3M9PSBcImhpZGRlblwiXG4gICAgICBzZWxlY3RlZC5yZW1vdmVDbGFzcyAnaGlkZGVuJ1xuICAgICAgc2VsZWN0ZWQuYWRkQ2xhc3MgJ3Nob3duJ1xuICAgICAgdGFyZ2V0X2xpbmsudGV4dChcImhpZGUgZGV0YWlsc1wiKVxuICAgIGVsc2VcbiAgICAgIHNlbGVjdGVkLnJlbW92ZUNsYXNzICdzaG93bidcbiAgICAgIHNlbGVjdGVkLmFkZENsYXNzICdoaWRkZW4nXG4gICAgICB0YXJnZXRfbGluay50ZXh0KFwic2hvdyBkZXRhaWxzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZVJlcG9ydFRhYiIsIkJhc2VSZXBvcnRUYWIgPSByZXF1aXJlICdiYXNlUmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEJpb2RpdmVyc2l0eVRhYiBleHRlbmRzIEJhc2VSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnQmlvZGl2ZXJzaXR5J1xuICBjbGFzc05hbWU6ICdiaW9kaXZlcnNpdHknXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmJpb2RpdmVyc2l0eVxuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnQmlvZGl2ZXJzaXR5JyxcbiAgICAnRGVlcFNlYSdcbiAgXVxuXG4gIHJlbmRlcjogKCkgLT5cblxuICAgIGNvcmFsX2FyZWEgPSBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnQ29yYWwnKS5mbG9hdCgnQVJFQV9LTScpXG4gICAgY29yYWxfcGVyYyA9ICBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnQ29yYWwnKS5mbG9hdCgnQVJFQV9QRVJDJylcblxuICAgIG1hbmdyb3Zlc19hcmVhID0gQHJlY29yZFNldCgnQmlvZGl2ZXJzaXR5JywgJ01hbmdyb3ZlcycpLmZsb2F0KCdBUkVBX0tNJylcbiAgICBtYW5ncm92ZXNfcGVyYyA9ICBAcmVjb3JkU2V0KCdCaW9kaXZlcnNpdHknLCAnTWFuZ3JvdmVzJykuZmxvYXQoJ0FSRUFfUEVSQycpXG5cbiAgICBzZWFncmFzc19hcmVhID0gQHJlY29yZFNldCgnQmlvZGl2ZXJzaXR5JywgJ1NlYWdyYXNzJykuZmxvYXQoJ0FSRUFfS00nKVxuICAgIHNlYWdyYXNzX3BlcmMgPSAgQHJlY29yZFNldCgnQmlvZGl2ZXJzaXR5JywgJ1NlYWdyYXNzJykuZmxvYXQoJ0FSRUFfUEVSQycpXG5cbiAgICBtcGFfY2F0cyA9IEByZWNvcmRTZXQoJ0Jpb2RpdmVyc2l0eScsICdNUEFDYXRlZ29yaWVzJykudG9BcnJheSgpXG4gICAgaGFzTVBBcyA9IG1wYV9jYXRzPy5sZW5ndGggPiAwXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG5cblxuICAgIHNlYW1vdW50cyA9IEByZWNvcmRTZXQoJ0RlZXBTZWEnLCAnU2VhbW91bnRzJykudG9BcnJheSgpXG4gICAgbnVtX3NlYW1vdW50cyA9IEBnZXROdW1TZWFtb3VudHMgc2VhbW91bnRzXG5cbiAgICBoYXNfc2VhbW91bnRzID0gbnVtX3NlYW1vdW50cyA+IDFcbiAgICBhdmdfZGVwdGhfc2VhbW91bnRzID0gQGdldEF2Z0RlcHRoU2VhbW91bnRzIHNlYW1vdW50c1xuICAgIGF2Z19kZXB0aF9zZWFtb3VudHMgPSBAYWRkQ29tbWFzIGF2Z19kZXB0aF9zZWFtb3VudHNcblxuICAgIGF2Z19kaXN0X3NlYW1vdW50cyA9IEBnZXRBdmdEaXN0U2VhbW91bnRzIHNlYW1vdW50c1xuICAgIGF2Z19kaXN0X3NlYW1vdW50cyA9IEBhZGRDb21tYXMoTWF0aC5yb3VuZChhdmdfZGlzdF9zZWFtb3VudHMpKVxuICAgICNzaG93IHRhYmxlcyBpbnN0ZWFkIG9mIGdyYXBoIGZvciBJRVxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgZDNJc1ByZXNlbnQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgZDNJc1ByZXNlbnQgPSBmYWxzZVxuXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIGNvcmFsX2FyZWE6IGNvcmFsX2FyZWFcbiAgICAgIGNvcmFsX3BlcmM6IGNvcmFsX3BlcmNcbiAgICAgIG1hbmdyb3Zlc19hcmVhOiBtYW5ncm92ZXNfYXJlYVxuICAgICAgbWFuZ3JvdmVzX3BlcmM6IG1hbmdyb3Zlc19wZXJjXG4gICAgICBzZWFncmFzc19hcmVhOiBzZWFncmFzc19hcmVhXG4gICAgICBzZWFncmFzc19wZXJjOiBzZWFncmFzc19wZXJjXG4gICAgICBtcGFfY2F0czptcGFfY2F0c1xuICAgICAgaGFzTVBBczogaGFzTVBBc1xuICAgICAgaGFzX3NlYW1vdW50czogaGFzX3NlYW1vdW50c1xuICAgICAgbnVtX3NlYW1vdW50czogbnVtX3NlYW1vdW50c1xuICAgICAgYXZnX2RlcHRoX3NlYW1vdW50czogYXZnX2RlcHRoX3NlYW1vdW50c1xuICAgICAgYXZnX2Rpc3Rfc2VhbW91bnRzOiBhdmdfZGlzdF9zZWFtb3VudHNcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBCaW9kaXZlcnNpdHlUYWIiLCJCYXNlUmVwb3J0VGFiID0gcmVxdWlyZSAnYmFzZVJlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBFY29ub215VGFiIGV4dGVuZHMgQmFzZVJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdTdXN0YWluYWJsZSBFY29ub215J1xuICBjbGFzc05hbWU6ICdlY29ub215J1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lY29ub215XG5cbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0NvYXN0YWxDYXRjaCdcbiAgICAnU2l6ZSdcbiAgICAnRGVlcFNlYSdcbiAgICAnRmlzaGVyaWVzJ1xuICAgICdQYWNpb2NlYUFxdWFjdWx0dXJlJ1xuICAgICdUb3VyaXNtJ1xuICAgICdFbmVyZ3knXG4gIF1cblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBtc2cgPSBAcmVjb3JkU2V0KFwiQ29hc3RhbENhdGNoXCIsIFwiUmVzdWx0TXNnXCIpXG5cbiAgICBjb2FzdGFsX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvYXN0YWxDYXRjaFRhYmxlXCIpLnRvQXJyYXkoKVxuXG4gICAgcmVuZXdhYmxlX2VuZXJneSA9IEByZWNvcmRTZXQoXCJFbmVyZ3lcIiwgXCJSZW5ld2FibGVFbmVyZ3lcIikudG9BcnJheSgpXG4gICAgZnVlbF9pbXBvcnQgPSBAcmVjb3JkU2V0KFwiRW5lcmd5XCIsIFwiRnVlbEltcG9ydFwiKS50b0FycmF5KClcblxuICAgIGNvbW1fc3ViX2NhdGNoID0gQHJlY29yZFNldChcIkNvYXN0YWxDYXRjaFwiLCBcIkNvbW1lcmNpYWxTdWJUYWJsZVwiKS50b0FycmF5KClcbiAgICBvY2Vhbl9jYXRjaCA9IEByZWNvcmRTZXQoXCJDb2FzdGFsQ2F0Y2hcIiwgXCJPY2VhblRhYmxlXCIpLnRvQXJyYXkoKVxuXG4gICAgZmlzaGVyaWVzID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkZpc2hlcmllc1RhYmxlXCIpLnRvQXJyYXkoKVxuICAgIGFxdWEgPSBAcmVjb3JkU2V0KFwiUGFjaW9jZWFBcXVhY3VsdHVyZVwiLCBcImFxXCIpLnRvQXJyYXkoKVxuXG4gICAgZ2RwX3ZhbHVlID0gQHJlY29yZFNldChcIkZpc2hlcmllc1wiLCBcIkdEUFRhYmxlXCIpLnRvQXJyYXkoKSBcbiAgICBleHBvcnRfdmFsdWUgPSBAcmVjb3JkU2V0KFwiRmlzaGVyaWVzXCIsIFwiRXhwb3J0VGFibGVcIikudG9BcnJheSgpIFxuXG4gICAgc2l6ZSA9IEByZWNvcmRTZXQoJ1NpemUnLCAnU2l6ZScpLmZsb2F0KCdTSVpFX0lOX0tNJylcbiAgICBuZXdfc2l6ZSA9ICBAYWRkQ29tbWFzIHNpemVcblxuICAgIG1pbmluZyA9IEByZWNvcmRTZXQoJ0RlZXBTZWEnLCAnTWluaW5nJykudG9BcnJheSgpXG4gICAgbWluaW5nID0gQHByb2Nlc3NNaW5pbmdEYXRhIG1pbmluZ1xuICAgIFxuICAgIHRvdXJpc21fcmVzID0gQHJlY29yZFNldCgnVG91cmlzbScsICdSZXN1bHRNc2cnKVxuICAgIFxuXG4gICAgdG91cmlzdF9hcnJpdmFscyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnVG91cmlzdEFycml2YWxzJykudG9BcnJheSgpXG4gICAgdG91cmlzdF9hcnJpdmFsc19ieV9jb3VudHJ5ID0gQHJlY29yZFNldCgnVG91cmlzbScsICdUb3VyaXNtQXJyaXZhbEJ5Q291bnRyeScpLnRvQXJyYXkoKVxuICAgIGludGxfdG91cmlzdF9hcnJpdmFscyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnSW50ZXJuYXRpb25hbEFycml2YWxzJykudG9BcnJheSgpXG4gICAgdG91cmlzbV9nZHAgPSBAcmVjb3JkU2V0KCdUb3VyaXNtJywgJ0dEUFBlcmNlbnQnKS50b0FycmF5KClcblxuICAgICcnJ1xuICAgIGludGxfdG91cmlzdF9hcnJpdmFscyA9IEByZWNvcmRTZXQoJ1RvdXJpc20nLCAnSW50ZXJuYXRpb25hbEFycml2YWxzJylcbiAgICBcbiAgICBpbnRsX3RvdXJpc3RfYXJyaXZhbF9wZXJjID0gQHJlY29yZFNldCgnVG91cmlzbScsICdJbnRlcm5hdGlvbmFsQXJyaXZhbHMnKS5mbG9hdCgnSUFfUEVSQycpXG4gICAgaWYgaW50bF90b3VyaXN0X2Fycml2YWxfcGVyYyA+IDAuMVxuICAgICAgaW50bF90b3VyaXN0X2Fycml2YWxfcGVyYyA9IGludGxfdG91cmlzdF9hcnJpdmFsX3BlcmMudG9GaXhlZCgxKVxuICAgICAgXG4gICAgY3J1aXNlX3NoaXBzID0gQHJlY29yZFNldCgnVG91cmlzbScsICdDcnVpc2VzaGlwcycpLmZsb2F0KCdQb3J0cycpXG4gICAgaGFzX2NydWlzZXNoaXBfdmlzaXRzID0gY3J1aXNlX3NoaXBzID4gMFxuICAgIGNydWlzZV9zaGlwc19wZXJjID0gQHJlY29yZFNldCgnVG91cmlzbScsICdDcnVpc2VzaGlwcycpLmZsb2F0KCdDUl9QRVJDJylcbiAgICBpZiBjcnVpc2Vfc2hpcHNfcGVyYyA+IDAuMVxuICAgICAgY3J1aXNlX3NoaXBzX3BlcmMgPSBjcnVpc2Vfc2hpcHNfcGVyYy50b0ZpeGVkKDEpXG5cbiAgICAnJydcblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2l6ZTogbmV3X3NpemVcblxuICAgICAgY29hc3RhbF9jYXRjaDogY29hc3RhbF9jYXRjaFxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIG1pbmluZzptaW5pbmdcbiAgICAgIGNvbW1fc3ViX2NhdGNoOiBjb21tX3N1Yl9jYXRjaFxuICAgICAgb2NlYW5fY2F0Y2g6IG9jZWFuX2NhdGNoXG5cbiAgICAgIGZpc2hlcmllczogZmlzaGVyaWVzXG4gICAgICBleHBvcnRfdmFsdWU6IGV4cG9ydF92YWx1ZVxuICAgICAgZ2RwX3ZhbHVlOiBnZHBfdmFsdWVcbiAgICAgIGFxdWE6YXF1YVxuXG4gICAgICB0b3VyaXN0X2Fycml2YWxzOnRvdXJpc3RfYXJyaXZhbHNcbiAgICAgIHRvdXJpc3RfYXJyaXZhbHNfYnlfY291bnRyeTogdG91cmlzdF9hcnJpdmFsc19ieV9jb3VudHJ5XG4gICAgICB0b3VyaXNtX2dkcDogdG91cmlzbV9nZHBcbiAgICAgIGludGxfdG91cmlzdF9hcnJpdmFsczogaW50bF90b3VyaXN0X2Fycml2YWxzXG5cbiAgICAgIHJlbmV3YWJsZV9lbmVyZ3k6IHJlbmV3YWJsZV9lbmVyZ3lcbiAgICAgIGZ1ZWxfaW1wb3J0OiBmdWVsX2ltcG9ydFxuXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBjb2xfdmFsdWVzID0geydjYXRjaF9jb3VudHJ5JzpcIkNPVU5UUllcIiwgJ2NhdGNoX2luX2Vleic6XCJUT1RfVE9OU1wiLCAnY2F0Y2hfcGVyYyc6XCJQRVJDX1RPVFwifVxuICAgIEBzZXR1cFRhYmxlU29ydGluZyhjb2FzdGFsX2NhdGNoLCAnLmNvYXN0YWxfY2F0Y2hfdmFsdWVzJywgJy5jb2FzdGFsX2NhdGNoX3RhYmxlJywgY29sX3ZhbHVlcywgJ2NvYXN0YWwtY2F0Y2gtcm93JywgJ2NhdGNoJylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbm1vZHVsZS5leHBvcnRzID0gRWNvbm9teVRhYiIsIkVjb25vbXlUYWIgPSByZXF1aXJlICcuL2Vjb25vbXkuY29mZmVlJ1xuQWRhcHRhdGlvblRhYiA9IHJlcXVpcmUgJy4vYWRhcHRhdGlvbi5jb2ZmZWUnXG5CaW9kaXZlcnNpdHlUYWIgPSByZXF1aXJlICcuL2Jpb2RpdmVyc2l0eS5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW0Vjb25vbXlUYWIsIEFkYXB0YXRpb25UYWIsIEJpb2RpdmVyc2l0eVRhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFkYXB0YXRpb25cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Qb3B1bGF0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+VGhlIHRvdGFsIHBvcHVsYXRpb24gb2YgdGhlIGNvdW50cmllcyB3aXRoaW4gdGhlIHNrZXRjaCBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bXBlb3BsZVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiwgd2hpY2ggaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjcGVvcGxlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgcG9wdWxhdGlvbiB3aXRoaW4gdGhlIFBBQ0lPQ0VBIHJlZ2lvbi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYmlvZGl2ZXJzaXR5XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5CaW9kaXZlcnNpdHk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGFibGU+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgKHNxLiBrbSk8L2E+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhICglIG9mIHRvdGFsIHJlZ2lvbik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgPHRib2R5PiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0PHRkPkNvcmFsPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJjb3JhbF9hcmVhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJjb3JhbF9wZXJjXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8dGQ+TWFuZ3JvdmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJtYW5ncm92ZXNfYXJlYVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwibWFuZ3JvdmVzX3BlcmNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8dGQ+U2VhZ3Jhc3M8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInNlYWdyYXNzX2FyZWFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInNlYWdyYXNzX3BlcmNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0VGhlIHRhYmxlIHNob3dzIHRoZSBhcmVhIG9mIHRoZSBoYWJpdGF0IHR5cGUgKGluIHNxdWFyZSBraWxvbWV0ZXJzKSB3aXRoaW4gdGhlIFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNrZXRjaCxcIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICBcdFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEwNzQsMTA4NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvbixcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGFzIHdlbGwgYXMgdGhlIHBlcmNlbnQgb2YgdGhlIHRvdGFsIFBBQ0lPQ0VBIGhhYml0YXQgZm91bmQgd2l0aGluIGVhY2ggXCIpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoLlwiKTt9O18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEyMzYsMTI0NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvbi5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyBpbiBTZWFtb3VudHMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTRkYmUxZTVmYTk0ZTY5Nzc1OWQyNTY0XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IHNlYW1vdW50IGxheWVyXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIHN0eWxlPVxcXCJwYWRkaW5nLXRvcDo1cHg7XFxcIj4gVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDE0OTYsMTUwNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiBhcmVhIG9mIGludGVyZXN0IFwiKTt9O18uYihcIiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bV9zZWFtb3VudHNcIixjLHAsMCkpKTtfLmIoXCIgc2VhbW91bnRzPC9zdHJvbmc+IHdpdGggYW4gYXZlcmFnZSBkZXB0aCBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImF2Z19kZXB0aF9zZWFtb3VudHNcIixjLHAsMCkpKTtfLmIoXCIgbWV0ZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc19zZWFtb3VudHNcIixjLHAsMSksYyxwLDAsMTcyNywxOTM0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhlIGF2ZXJhZ2UgZGlzdGFuY2UgYmV0d2VlbiBzZWFtb3VudHMgd2l0aGluIHRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwxODAwLDE4MTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgYXJlYSBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgaW50ZXJlc3QgXCIpO307Xy5iKFwiIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXZnX2Rpc3Rfc2VhbW91bnRzXCIsYyxwLDApKSk7Xy5iKFwiIGttPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8ZGl2PjxhIGNsYXNzPVxcXCJkZXRhaWxzXFxcIiBocmVmPVxcXCIjXFxcIj5zaG93IGRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwibGlzdC1oZWFkZXJcXFwiPlRoZSBwaHlzaWNhbCBzdHJ1Y3R1cmUgb2Ygc29tZSBzZWFtb3VudHMgZW5hYmxlcyB0aGUgZm9ybWF0aW9uIG9mIGh5ZHJvZ3JhcGhpYyBmZWF0dXJlcyBhbmQgY3VycmVudCBmbG93cyB0aGF0IGNhbjo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8b2w+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+RW5oYW5jZSBsb2NhbCBwcm9kdWN0aW9uIHRocm91Z2ggdXB3ZWxsaW5nIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+S2VlcCBzcGVjaWVzIGFuZCBwcm9kdWN0aW9uIHByb2Nlc3NlcyBjb25jZW50cmF0ZWQgb3ZlciB0aGUgc2VhbW91bnQgIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+SGF2ZSBhIGNvbmNlbnRyYXRpb24gb2Ygem9vcGxhbmt0b24gYW5kIG1lc29wZWxhZ2ljIGZpc2ggbWVhbmluZyByaWNoIGZlZWRpbmcgZ3JvdW5kcyBhbmQgc3Bhd25pbmcgYXJlYXMgZm9yIGZpc2ggYW5kIGhpZ2hlciBwcmVkYXRvcnMsIGFuZCBoZW5jZSBmaXNoZXJpZXMuIFNlYW1vdW50cyBhcmUgYSBob3RzcG90IGZvciBiaW9kaXZlcnN0aXkgYnV0IGFyZSBzdGlsbCB1bmRlcnN0dWRpZWQuPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L29sPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNNUEFzXCIsYyxwLDEpLGMscCwwLDI2MzcsMzQ3MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWFyaW5lIFByb3RlY3RlZCBBcmVhczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0YWJsZT4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SVVDTiBDYXRlZ29yeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIE1QQXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgKHNxLiBrbSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibXBhX2NhdHNcIixjLHAsMSksYyxwLDAsMjkxNiwzMDYxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0FUXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOVU1fTVBBU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTVBBX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk1QQV9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIHRhYmxlIHNob3dzIHRoZSBudW1iZXIgYW5kIGFyZWEgb2YgTWFyaW5lIFByb3RlY3RlZCBBcmVhcyAoTVBBcykgZm9yIGVhY2ggSVVDTiBjYXRlZ29yeSB3aXRoaW4gdGhlIFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNrZXRjaCxcIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICAgIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDMyODEsMzI5MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvbixcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGFzIHdlbGwgYXMgdGhlIGFlcmlhbCBwZXJjZW50IG9mIHRoZSBcIik7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJza2V0Y2hcIik7fTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwzNDA5LDM0MTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIHdpdGhpbiBlYWNoIGNhdGVnb3J5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJoYXNNUEFzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWFyaW5lIFByb3RlY3RlZCBBcmVhczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlRoZXJlIGFyZSA8c3Ryb25nPm5vPC9zdHJvbmc+IE1hcmluZSBQcm90ZWN0ZWQgQXJlYXMgd2l0aGluIHRoaXMgXCIpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzcwNywzNzE3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9O3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImVjb25vbXlcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkEgTm90ZSBvbiBSZXBvcnRpbmc8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgRm9yIHRoZSBFRVogc3RhdGlzdGljcywgdGhlIHJlc3VsdCBpcyBmb3IgdGhlIDxzdHJvbmc+ZW50aXJlIEVFWjwvc3Ryb25nPiwgYW5kIG5vdCBvbmx5IHRoZSBwYXJ0IG9mIHRoZSBFRVogY29udGFpbmVkIHdpdGhpbiB0aGUgYXJlYSBvZiBpbnRlcmVzdC48L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNjUwLDY2MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiBhcmVhIG9mIGludGVyZXN0IFwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNpemVcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIGtpbG9tZXRlcnM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EZWVwIFNlYSA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+RGVlcCBTZWEgTWluZXJhbHM6IDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzlkM1xcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBtaW5lcmFsIGxheWVyc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MTcwcHg7XFxcIj5UeXBlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhIChzcS4ga20pPC9hPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSAoJSBvZiB0b3RhbCByZWdpb24pPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtaW5pbmdcIixjLHAsMSksYyxwLDAsMTIwMSwxMzE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVFlQRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU0laRV9TUUtNXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX1RPVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJsaXN0LWhlYWRlclxcXCI+VGhlIGRlZXAgc2VhIHJlc291cmNlcyBhdmFpbGFibGUgZm9yIGV4dHJhY3Rpb24gYXJlIGRpdmlkZWQgaW50byA0IHR5cGVzOjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxvbD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5Qb2x5bWV0YWxsaWMgTm9kdWxlcyAoTWFuZ2FuZXNlLCBDb3BwZXIsIE5pY2tlbCwgQ29iYWx0KSAtIDQsMDAwIC0gNiwwMDAgbSBkZXB0aDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8bGk+Q29iYWx0LXJpY2ggTWFuZ2FuZXNlIENydXN0cyAoQ29iYWx0KSAtIDgwMCAtIDMsMDAwIG0gZGVwdGg8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGxpPlN1bHBoaWRlIERlcG9zaXRzIChDb3BwZXIpIC0gMSw1MDAgLSA0LDAwMCBtIGRlcHRoPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxsaT5EZWVwLXNlYSBtdWQgKHJhcmUgZWFydGggZWxlbWVudHMsIHl0dHJpdW0pIC0gMiwwMDAgLTYsMDAwIG0gZGVwdGguPC9saT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L29sPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBUaGUgRFNNIGRlcG9zaXRzIGFyZSBoaWdoZXIgaW4gbWluZXJhbCBjb250ZW50IHRoYW4gb24tbGFuZCBkZXBvc2l0cy4gVHlwaWNhbCB2YWx1ZSBvZiBhIHRvbm5lIG9mIGxhbmQgYmFzZWQgb3JlIGlzIDUwLTIwMCBVU0QsIGZvciBzZWEgZmxvb3IgZGVwb3NpdHMgaXTigJlzIDUwMC0xNTAwIFVTRC4gRFNNIG1pbmluZyBpbiB0aGUgUEFDSU9DRUEgIGhhcyBhIHN0cm9uZyBwb3RlbnRpYWwuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Db2FzdGFsIEZpc2hlcmllcyA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgdGVybSBjb2FzdGFsIGZpc2hlcnkgcmVzb3VyY2UgbWVhbnMg4oCcYW55IGZpc2hlcnksIGFueSBzcGVjaWVzIG9mIGZpc2gsIG9yIGFueSBzdG9jayBvZiBmaXNoIHRoYXQgaXMgYnJvYWRseSBkaXN0cmlidXRlZCBhY3Jvc3MgdGhlIGNvYXN0YWwgd2F0ZXJzICgxMiBuYXV0aWNhbCBtaWxlcykgdW5kZXIgdGhlIGp1cmlzZGljdGlvbiBvZiBhIGNvdW50cnkuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkNvYXN0YWwgQ2F0Y2g6IDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzllOVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBjb2FzdGFsIGNhdGNoIGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjJcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIGNvbHNwYW49XFxcIjRcXFwiPkNhdGNoIChpbiB0b25uZXMpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+JSBvZiBUb3RhbCBDb2FzdGFsIENhdGNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+VG90YWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5EZW1lcnNhbCA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5QZWxhZ2ljICA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5JbnZlcnRlYnJhdGUgPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNvYXN0YWxfY2F0Y2hcIixjLHAsMSksYyxwLDAsMzE1MSwzMzk2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFJZXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19UT1RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUT1RfVE9OU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRFTV9UT05TXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVMX1RPTlNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJJTlZfVE9OU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2PjxhIGNsYXNzPVxcXCJkZXRhaWxzXFxcIiBocmVmPVxcXCIjXFxcIj5zaG93IGRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJoaWRkZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICBXaXRoaW4gdGhlIFBBQ0lPQ0VBIHJlZ2lvbiwgdGhlIGhpZ2hlc3QgY2F0Y2ggdm9sdW1lcyBhcmUgbG9jYXRlZCBpbiBQYXB1YSBOZXcgR3VpbmVhLCBGaWppLCBLaXJpYmF0aSwgRmVkZXJhdGVkIFN0YXRlcyBvZiBNaWNyb25lc2lhIGFuZCBTb2xvbW9uIElzbGFuZHMuIERlbWVyc2FsIHNwZWNpZXMgZG9taW5hdGUgdGhlIGNhdGNoICgzMyUgdG8gNzUlKS4gRGVtZXJzYWwgZmlzaGVyaWVzIHJlcHJlc2VudCBhbiBpbXBvcnRhbnQgcGFydCBvZiB0aGUgdG90YWwgY2F0Y2ggZXhwbGFpbmVkIGJ5IHRoZSBwcmVzZW5jZSBvZiBsYWdvb25zIGFuZCBsb2NhbCBmaXNoaW5nIHRlY2huaXF1ZXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkNvYXN0YWwgY29tbWVyY2lhbCBjYXRjaCB2cy4gY29hc3RhbCBzdWJzaXN0ZW5jZSBjYXRjaDwvYnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWViXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGNvbW1lcmNpYWwvc3Vic2lzdGVuY2UgY2F0Y2ggbGF5ZXJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvbW1lcmNpYWwgQ2F0Y2ggKGtnIHBlciBjYXBpdGEpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+U3Vic2lzdGVuY2UgQ2F0Y2ggKGtnIHBlciBjYXBpdGEpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNvbW1fc3ViX2NhdGNoXCIsYyxwLDEpLGMscCwwLDQ0NjgsNDYxNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRSWVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPTV9LR19DQVBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTVUJfS0dfQ0FQXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgV2l0aGluIHRoZSBQQUNJT0NFQSBhcmVhLCB0aGUgY29hc3RhbCBjYXRjaCB2b2x1bWUgaXMgbGFyZ2VseSBkb21pbmF0ZWQgYnkgc3Vic2lzdGVuY2UgZmlzaGVyaWVzLiBUaGUgbGFyZ2VzdCBwZXIgY2FwaXRhIHZvbHVtZSBvZiBjb2FzdGFsIGNhdGNoIChib3RoIGNvbW1lcmNpYWwgYW5kIHN1YnNpc3RlbmNlKSBpcyBsb2NhdGVkIG92ZXIgdGhlIHNtYWxsZXN0IGxhbmQgYXJlYXMuIFRoaXMgZmFjdCBjYW4gYmUgcmVsYXRlZCB3aXRoIHRoZSBsb3cgcG90ZW50aWFsIG9mIHRoZXNlIGNvdW50cmllcyB0byBkZXZlbG9wIGFncmljdWx0dXJlLiBUaHVzLCBjb2FzdGFsIGRlZ3JhZGF0aW9uIG9mIG5hdHVyYWwgaGFiaXRhdHMgYW5kIHBvbGx1dGlvbiBpbmNyZWFzZSBjYW4gaGF2ZSByZXBlcmN1c3Npb25zIG9uIGZvb2Qgc2VjdXJpdHkgZm9yIHNtYWxsZXIgbGFuZCBhcmVhIGNvdW50cmllcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PY2VhbmljIEZpc2hlcmllcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWU2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IG9jZWFuaWMgY2F0Y2ggbGF5ZXJzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSB0ZXJtIG9jZWFuaWMgZmlzaGVyeSByZXNvdXJjZSBtZWFucyDigJxhbnkgZmlzaGVyeSwgYW55IHNwZWNpZXMgb2YgZmlzaCwgb3IgYW55IHN0b2NrIG9mIGZpc2ggdGhhdCBpcyBicm9hZGx5IGRpc3RyaWJ1dGVkIGFjcm9zcyB0aGUgZXhjbHVzaXZlIGVjb25vbWljYWwgem9uZSAoYmV0d2VlbiAxMiBhbmQgMjAwIG5hdXRpY2FsIG1pbGVzKSB1bmRlciB0aGUganVyaXNkaWN0aW9uIG9mIGEgY291bnRyeS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMlxcXCI+RG9tZXN0aWMgQ2F0Y2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBjb2xzcGFuPVxcXCIyXFxcIj5Gb3JlaWduIENhdGNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+VG90YWwgKHRvbm5lcyk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD50b25uZXMgPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+JSBvZiBjYXRjaCBpbiBFRVo8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD50b25uZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD4lIG9mIGNhdGNoIGluIEVFWjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJvY2Vhbl9jYXRjaFwiLGMscCwxKSxjLHAsMCw2MjMxLDY0NzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UUllcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTS19UT1RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTS19ET01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJET01fUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNLX0ZSTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkZSTl9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgV2VzdGVybiBhbmQgQ2VudHJhbCBQYWNpZmljIG9mZnNob3JlIGZpc2hlcmllcyByZXByZXNlbnQgbW9yZSB0aGFuIDYwJSBvZiB0b3RhbCB3b3JsZHdpZGUgZmlzaGVyaWVzIGFuZCA4MCUgb2YgdGhlIFBhY2lmaWMgdHVuYSBjYXRjaC4gT2NlYW5pYyBmaXNoZXJpZXMgcmVwcmVzZW50IDkwJSBvZiB0b3RhbCBzZWEgZm9vZCBwcm9kdWN0aW9uIGluIHRoZSBQQUNJT0NFQSBhcmVhLiBGb3JlaWduIGZsZWV0cyBkb21pbmF0ZSBOb3J0aGVybiBvY2VhbmljIGNhdGNoZXMuIEluIHRoZSBzb3V0aCBvZiB0aGUgUEFDSU9DRUEgYXJlYSB0aGUgZG9tZXN0aWMgY2F0Y2ggcmVwcmVzZW50cyBtb3JlIHRoYW4gNTAgJSBvZiBvZmZzaG9yZSBmaXNoZXJpZXMuIEhpZ2hlc3QgdG90YWwgY2F0Y2ggdm9sdW1lcyBhcmUgcHJvZHVjZWQgYnkgUGFwdWEgTmV3IEd1aW5lYSwgS2lyaWJhdGkgYW5kIHRoZSBGZWRlcmF0ZWQgU3RhdGVzIG9mIE1pY3JvbmVzaWEuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkFxdWFjdWx0dXJlIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzllZVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBhcXVhY3VsdHVyZSBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5QcmF3bnM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5PeXN0ZXI8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5TaHJpbXA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5DcmFiPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+VGlsYXBpYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1pbGtmaXNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+VG90YWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXF1YVwiLGMscCwxKSxjLHAsMCw3Njc0LDc5NzIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQcmF3blwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk95c3RlclwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNocmltcFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNyYWJcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUaWxhcGlhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTWlsa2Zpc2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUb3RhbFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoZXJpZXMgYW5kIEFxdWFjdWx0dXJlIEVjb25vbXk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHN0cm9uZz5GaXNoZXJ5IGFuZCBBcXVhY3VsdHVyZSBlY29ub21pYyB2YWx1ZSBwZXIgY291bnRyeTo8L3N0cm9uZz4mbmJzcDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzllMVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiMVxcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggY29sc3Bhbj1cXFwiNFxcXCI+Q2F0Y2ggaW4gTWlsbGlvbiBVU0Q8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db2FzdGFsIGZpc2hlcmllczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFxdWFjdWx0dXJlIDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkRvbWVzdGljIG9jZWFuaWMgZmlzaGVyaWVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Rm9yZWlnbiBvY2VhbmljIGZpc2hlcmllczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoZXJpZXNcIixjLHAsMSksYyxwLDAsODc1NCw4OTUyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb3VudHJ5XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ29hc3RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBcXVhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRG9tXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRm9yZWlnblwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHN0cm9uZz5GaXNoZXJpZXMgYW5kIEFxdWFjdWx0dXJlIHNoYXJlIG9mIEdEUDo8L3N0cm9uZz4mbmJzcDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzlkZlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5HRFAgVmFsdWUgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImdkcF92YWx1ZVwiLGMscCwxKSxjLHAsMCw5MzY0LDk0NjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJHRFBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPkZpc2hlcmllcyBhbmQgQXF1YWN1bHR1cmUgc2hhcmUgb2YgVG90YWwgRXhwb3J0Ojwvc3Ryb25nPiZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWUzXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+RXhwb3J0IFZhbHVlICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleHBvcnRfdmFsdWVcIixjLHAsMSksYyxwLDAsOTg5NSwxMDAwMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRyeVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkV4cG9ydFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2PjxhIGNsYXNzPVxcXCJkZXRhaWxzXFxcIiBocmVmPVxcXCIjXFxcIj5zaG93IGRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJoaWRkZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIFdpdGhpbiB0aGUgUEFDSU9DRUEgYXJlYSwgZm9yZWlnbiBhbmQgZG9tZXN0aWMgb2NlYW5pYyBmaXNoZXJpZXMgZG9taW5hdGUgdGhlIHRvdGFsIHZhbHVlIG9mIHByb2R1Y3Rpb24sIGV4Y2VwdCBmb3IgTmV3IENhbGVkb25pYSBhbmQgRnJlbmNoIFBvbHluZXNpYSB3aGVyZSBhcXVhY3VsdHVyZSBpcyBzaWduaWZpY2FudC4gQ29hc3RhbCBmaXNoZXJ5IHZhbHVlcyBhcmUgdXN1YWxseSBsb3dlciB0aGFuIG9jZWFuaWMgdmFsdWVzIGV4Y2VwdCBmb3IgRmlqaSwgVG9uZ2EsIFdhbGxpcyBhbmQgRnV0dW5hIGFuZCBUb2tlbGF1LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VG91cmlzbTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVG91cmlzdHMgaW4gUElDVHMgbW9zdGx5IGNvbWUgZnJvbSBBc2lhbiBjb3VudHJpZXMgdG8gTWljcm9uZXNpYSAoSmFwYW4sIFNvdXRoIEtvcmVhLCBUYWl3YW4gYW5kIEhvbmstS29uZyByZXByZXNlbnQgNzAgdG8gOTAlIG9mIHRoZSB0b3VyaXN0cyBpbiBNaWNyb25lc2lhKSBhbmQgQXVzdHJhbGlhL05ldyBaZWFsYW5kIGZvciB0aGUgc291dGhlcm4gcGFydCBvZiB0aGUgUEFDSU9DRUEgYXJlYS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkludGVybmF0aW9uYWwgdG91cmlzdCBhcnJpdmFscyAoMjAxMik6XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvYnI+PGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWY5XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGludGVybmF0aW9uYWwgYXJyaXZhbCBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgJm5ic3AgJm5ic3A8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZjFcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgcG9wdWxhdGlvbiBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPCEtLXBlcmMgcG9wOiA1NDUwYTA1YjRlYjU4MGYxM2MwMmM5ZjEtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q291bnRyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkludGVybmF0aW9uYWwgdG91cmlzdCBhcnJpdmFsczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnkgcG9wdWxhdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlJhdGlvIGJldHdlZW4gdG91cmlzdCBhcnJpdmFscyBhbmQgdG90YWwgcG9wdWxhdGlvbiAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaW50bF90b3VyaXN0X2Fycml2YWxzXCIsYyxwLDEpLGMscCwwLDExNTQwLDExNzE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb3VudHJ5XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQXJyaXZhbHNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQb3B1bGF0aW9uXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSUFfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5TdW1tYXJ5IG9mIENoYW5nZSBpbiBUb3VyaXNtOlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAmbmJzcDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzlmM1xcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TnVtYmVyIG9mIENvdW50cmllcyB3aGVyZSBUb3VyaXNtIERlY3JlYXNlZDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk51bWJlciBvZiBDb3VudHJpZXMgd2hlcmUgVG91cmlzbSBJbmNyZWFzZWQgYnkgPCAxMDAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TnVtYmVyIG9mIENvdW50cmllcyB3aGVyZSBUb3VyaXNtIEluY3JlYXNlZCBieSA+IDEwMCU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwidG91cmlzdF9hcnJpdmFsc1wiLGMscCwxKSxjLHAsMCwxMjI4OSwxMjQyNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiREVDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTEVTUzEwMFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk1PUkUxMDBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+Q2hhbmdlIGluIHRvdXJpc20gZm9yIGVhY2ggY291bnRyeTpcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWY3XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+Q2hhbmdlIGluIHRvdXJpc20gKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInRvdXJpc3RfYXJyaXZhbHNfYnlfY291bnRyeVwiLGMscCwxKSxjLHAsMCwxMjg3MSwxMjk4MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRyeVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRvdXJfYXJyXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgVmVyeSBkaWZmZXJlbnQgc2l0dWF0aW9ucyBjaGFyYWN0ZXJpemUgdGhlIHJlZ2lvbiwgYnV0IG5vIHN1Yi1yZWdpb25hbCB0ZW5kZW5jaWVzIGNhbiBiZSBlYXNpbHkgaWRlbnRpZmllZC4gQXJlIHJlbW90ZW5lc3MsIGxldmVsIG9mIGluZnJhc3RydWN0dXJlcywgY29zdCBvZiB0cmFuc3BvcnQsIGV0Yy4gaW1wb3J0YW50IGRyaXZpbmcgZm9yY2VzIGZvciB0aGUgZnV0dXJlIG9mIHRvdXJpc3RpYyBkZXN0aW5hdGlvbnM/XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+VG91cmlzbSBlY29ub21pYyBpbXBhY3Q6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5BZGRlZCB2YWx1ZSBvZiB0b3VyaXNtICglIG9mIEdEUCk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwidG91cmlzbV9nZHBcIixjLHAsMSksYyxwLDAsMTM3MTQsMTM4MTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJHRFBcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICBUb3VyaXNt4oCZcyBlY29ub21pYyBpbXBhY3QgdmFyaWVzIGluIGxhcmdlIHByb3BvcnRpb25zIHRocm91Z2hvdXQgdGhlIFBhY2lmaWMgSXNsYW5kcyByZWdpb24uIEZldyBwb3B1bGF0ZWQgdG91cmlzdGljIGRlc3RpbmF0aW9ucyBvciBsb3cgR0RQIGNvdW50cmllcyBhcmUgbGlrZWx5IHRvIHJlbHkgb24gdG91cmlzbSwgc3VjaCBhcyBGaWppIGFuZCBHdWFtLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkVuZXJneTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+RnVlbCBJbXBvcnRzOiAmbmJzcDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0NTBhMDViNGViNTgwZjEzYzAyYzlkMFxcXCIgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGZ1ZWwgaW1wb3J0IGxheWVyPC9hPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0aD5Db3VudHJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRoPiUgb2YgR0RQIGZyb20gRnVlbCBmcm9tIEltcG9ydHM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmdWVsX2ltcG9ydFwiLGMscCwxKSxjLHAsMCwxNDY5OSwxNDgxNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkZ1ZWxcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdj48YSBjbGFzcz1cXFwiZGV0YWlsc1xcXCIgaHJlZj1cXFwiI1xcXCI+c2hvdyBkZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaGlkZGVuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgVW50aWwgdGhpcyBkZWNhZGUsIGFsbCB0aGUgY291bnRyaWVz4oCZIGVuZXJneSBzdXBwbHkgZGVwZW5kZWQgb24gcGV0cm9sZXVtIGFuZCBpbiBjb25zZXF1ZW5jZSByZWxpZWQgaGVhdmlseSBvbiBpbXBvcnQuIEZ1ZWwgaW1wb3J0IGNhbiByZXByZXNlbnQgZnJvbSA1JSBvZiBHRFAgKFBhcHVhIE5ldyBHdWluZWEpIHRvIDI4JSBvZiB0aGUgR0RQIChDb29rIElzbGFuZHMpLiBDaGFuZ2VzIGluIHRoZSBkZW1hbmQsIGluY2x1ZGluZyBmb3IgdGhlIHNlcnZpY2Ugc2VjdG9yLCBwb3NlIGFuIGluY3JlYXNpbmcgdGhyZWF0IHRvIGVuZXJneSBzZWN1cml0eSBmb3IgUGFjaWZpYyBwb3B1bGF0aW9ucy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPlJlbmV3YWJsZSBFbmVyZ3k6ICZuYnNwPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTQ1MGEwNWI0ZWI1ODBmMTNjMDJjOWQyXFxcIiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IHJlbmV3YWJsZSBlbmVyZ3kgbGF5ZXI8L2E+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkNvdW50cnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD4lIG9mIEVsZWN0cmljaXR5IGdlbmVyYXRlZCBieSBSZW5ld2FibGUgRW5lcmd5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInJlbmV3YWJsZV9lbmVyZ3lcIixjLHAsMSksYyxwLDAsMTU3NjIsMTU4NjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50cnlcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJSZW5ld1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxkaXY+PGEgY2xhc3M9XFxcImRldGFpbHNcXFwiIGhyZWY9XFxcIiNcXFwiPnNob3cgZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxkaXYgY2xhc3M9XFxcImhpZGRlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFRoZSBvY2VhbiBjb3VsZCBwcm9kdWNlIGVuZXJneSB2aWEgdGhlIGltcGxlbWVudGF0aW9uIG9mIG5ldyB0ZWNobm9sb2dpZXMuIFRoZXJtYWwgdGVjaG5vbG9neSBhbmQgd2F2ZSBlbmVyZ3kgY29udmVyc2lvbiBhcmUgZXN0aW1hdGVkIHRoZSBtb3N0IGZydWl0ZnVsIHBvdGVudGlhbCBuZXcgcmVzb3VyY2VzLiBFdmVuIGlmIHRoZXNlIHNvbHV0aW9ucyBhcmUgcmVjZW50IGFuZCBkZXZpY2VzIGFyZSBzdGlsbCBleHBlbnNpdmUsIGluIHRoZSBsb25nIHRlcm0sIHRoZXkgc2hvdWxkIG9mZmVyIGEgdmVyeSBjb21wZXRpdGl2ZSBhbHRlcm5hdGl2ZSB0byBmb3NzaWwgZnVlbC4gTW9yZW92ZXIsIHRoZSBQYWNpZmljIGNvdWxkIGJlIGEga2V5IHJlZ2lvbiBpbiB0aGUgZGV2ZWxvcG1lbnQgb2Ygc29tZSBvZiB0aGVzZSBzb2x1dGlvbnMgYnkgYWxsb3dpbmcgdGhlIGluZHVzdHJ5IHRvIG1hdHVyZSBhbmQgYmVjb21lIGNvbXBldGl0aXZlLiBBIEZyYW1ld29yayBmb3IgQWN0aW9uIG9uIEVuZXJneSBTZWN1cml0eSBpbiB0aGUgUGFjaWZpYyB3YXMgZXN0YWJsaXNoZWQgdW5kZXIgdGhlIGd1aWRhbmNlIG9mIFNQQyB3aXRoIENST1AgYWdlbmNpZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSJdfQ==
