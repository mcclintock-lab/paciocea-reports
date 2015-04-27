BaseReportTab = require 'baseReportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'

partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class AdaptationTab extends BaseReportTab
  # this is the name that will be displayed in the Tab
  name: 'Adaptation'
  className: 'adaptation'
  timeout: 120000
  template: templates.adaptation
  dependencies: [
    'Population', 'Adaptation'
  ]


  render: () ->
    isCollection = @model.isCollection()
    numpeople = @recordSet('Population', 'Population').float('Population')
    numpeople = @addCommas numpeople
    percpeople = @recordSet('Population', 'Population').float('PERC_POP')

    impact_on_gdp = @recordSet('Adaptation', 'ImpactOnGDP').toArray()
    num_hazards = @recordSet('Adaptation', 'NumberOfHazards').toArray()
    num_affected = @recordSet('Adaptation', 'NumAffected').toArray()
    avg_damage = @recordSet('Adaptation', 'AvgDamageCost').toArray()

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

      numpeople: numpeople
      percpeople: percpeople

      impact_on_gdp: impact_on_gdp
      num_hazards: num_hazards
      num_affected: num_affected
      avg_damage: avg_damage

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

 
module.exports = AdaptationTab