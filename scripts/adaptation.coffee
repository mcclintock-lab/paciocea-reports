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
    'Adaptation', 'AdPop'
  ]


  render: () ->
    isCollection = @model.isCollection()
    
    numpeople = @recordSet('AdPop', 'PopVolume').float('Population')
    numpeople = @addCommas numpeople

    percpeople = @recordSet('AdPop', 'PopVolume').float('PERC_POP')
    msg = @recordSet('AdPop', 'ResultMsg').data.value

    pop_density =  @recordSet('AdPop', 'PopDensity').toArray()
    net_migration =  @recordSet('AdPop', 'NetMig').toArray()


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

      impact_on_gdp: impact_on_gdp
      num_hazards: num_hazards
      num_affected: num_affected
      avg_damage: avg_damage

      numpeople: numpeople
      percpeople: percpeople

      pop_density: pop_density
      net_migration: net_migration

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

 
module.exports = AdaptationTab