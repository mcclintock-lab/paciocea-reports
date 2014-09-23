ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'

partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class ScenarioOneTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'ScenarioOne'
  className: 'scenarioone'
  timeout: 120000
  template: templates.scenarioone
  dependencies: [

  ]

  render: () ->

    isCollection = @model.isCollection()

    #show tables instead of graph for IE
    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false

    attributes = @model.getAttributes()
    
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      isCollection: isCollection

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = ScenarioOneTab