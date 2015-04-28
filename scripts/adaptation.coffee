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
    low_lands = @recordSet('AdPop', 'LowLands').toArray()
    
    if low_lands?.length > 0
      LL_BIN_0 = low_lands[0].value
      LL_BIN_1 = low_lands[1].value
      LL_BIN_2 = low_lands[2].value
      LL_BIN_3 = low_lands[3].value
      LL_BIN_4 = low_lands[4].value
    else
      LL_BIN_0 = 0
      LL_BIN_1 = 0
      LL_BIN_2 = 0
      LL_BIN_3 = 0
      LL_BIN_4 = 0

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
      low_lands: low_lands

      LL_BIN_0:LL_BIN_0
      LL_BIN_1:LL_BIN_1
      LL_BIN_2:LL_BIN_2
      LL_BIN_3:LL_BIN_3
      LL_BIN_4:LL_BIN_4

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

 
module.exports = AdaptationTab