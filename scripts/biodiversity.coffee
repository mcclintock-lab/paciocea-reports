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
    'Biodiversity',
    'DeepSea'
  ]

  render: () ->

    coral_area = @recordSet('Biodiversity', 'Coral').float('AREA_KM')
    coral_perc =  @recordSet('Biodiversity', 'Coral').float('AREA_PERC')

    mangroves_area = @recordSet('Biodiversity', 'Mangroves').float('AREA_KM')
    mangroves_perc =  @recordSet('Biodiversity', 'Mangroves').float('AREA_PERC')

    seagrass_area = @recordSet('Biodiversity', 'Seagrass').float('AREA_KM')
    seagrass_perc =  @recordSet('Biodiversity', 'Seagrass').float('AREA_PERC')

    mpa_cats = @recordSet('Biodiversity', 'MPACategories').toArray()

    deep_coral = @recordSet('Biodiversity', 'DeepCoral').toArray()
    bio_seamounts = @recordSet('Biodiversity', 'Seamounts').toArray()
    vents = @recordSet('Biodiversity', 'Vents').toArray()
    
    hasMPAs = mpa_cats?.length > 0
    isCollection = @model.isCollection()

    seamounts = @recordSet('DeepSea', 'Seamounts').toArray()
    num_seamounts = @getNumSeamounts seamounts

    has_seamounts = num_seamounts > 1
    avg_depth_seamounts = @getAvgDepthSeamounts seamounts
    avg_depth_seamounts = @addCommas avg_depth_seamounts

    avg_dist_seamounts = @getAvgDistSeamounts seamounts
    avg_dist_seamounts = @addCommas(Math.round(avg_dist_seamounts))
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
      mpa_cats:mpa_cats
      hasMPAs: hasMPAs
      has_seamounts: has_seamounts
      num_seamounts: num_seamounts
      avg_depth_seamounts: avg_depth_seamounts
      avg_dist_seamounts: avg_dist_seamounts
      deep_coral: deep_coral
      bio_seamounts: bio_seamounts
      vents: vents


    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = BiodiversityTab