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
    'Habitat'
  ]


  render: () ->
    habitat_data = @recordSet('Habitat', 'HabitatPresence').toArray()

    if habitat_data?.length > 0
      has_coral = @recordSet('Habitat', 'HabitatPresence').bool('Coral')
      has_seagrass = @recordSet('Habitat', 'HabitatPresence').bool('Seagrass')
      has_mangroves = @recordSet('Habitat', 'HabitatPresence').bool('Mangrove')
    else
      has_coral = false
      has_seagrass = false
      has_mangroves = false
    has_no_habitats = !has_coral and !has_seagrass and !has_mangroves
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
      
      has_coral: has_coral
      has_mangroves: has_mangroves
      has_seagrass: has_seagrass
      has_no_habitats: has_no_habitats

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

 
module.exports = AdaptationTab