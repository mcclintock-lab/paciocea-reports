BaseReportTab = require 'baseReportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'

partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class BiodiversityTab extends BaseReportTab
  # this is the name that will be displayed in the Tab
  name: 'Biodiversity'
  className: 'biodiversity'
  timeout: 120000
  template: templates.biodiversity
  dependencies: [
    'Biodiversity'
  ]

  render: () ->

    coral_area = @recordSet('Biodiversity', 'Coral').float('AREA_KM')
    coral_perc =  @recordSet('Biodiversity', 'Coral').float('AREA_PERC')

    mangroves_area = @recordSet('Biodiversity', 'Mangroves').float('AREA_KM')
    mangroves_perc =  @recordSet('Biodiversity', 'Mangroves').float('AREA_PERC')

    seagrass_area = @recordSet('Biodiversity', 'Seagrass').float('AREA_KM')
    seagrass_perc =  @recordSet('Biodiversity', 'Seagrass').float('AREA_PERC')

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
      coral_area: coral_area
      coral_perc: coral_perc
      mangroves_area: mangroves_area
      mangroves_perc: mangroves_perc
      seagrass_area: seagrass_area
      seagrass_perc: seagrass_perc

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = BiodiversityTab