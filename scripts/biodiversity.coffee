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
    'DeepSea',
    'ThreatenedSpecies'
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
    
    coral_threats = @recordSet('Biodiversity', 'CoralThreats').toArray()
    if coral_threats?.length > 0
      for ct in coral_threats
        if ct.THREAT == "Low"
          CORAL_THREAT_LOW = ct.PERC
        else if ct.THREAT == "Medium"
          CORAL_THREAT_MEDIUM = ct.PERC
        else if ct.THREAT == "High"
          CORAL_THREAT_HIGH = ct.PERC
        else
          CORAL_THREAT_VHIGH = ct.PERC
    else
      CORAL_THREAT_LOW = 0
      CORAL_THREAT_MEDIUM = 0
      CORAL_THREAT_HIGH = 0
      CORAL_THREAT_VHIGH = 0
    threatened_species = @recordSet('ThreatenedSpecies', 'Threat').toArray()
    RF_BIN1 = 0
    RF_BIN2 = 0
    RF_BIN3 = 0
    RF_BIN4 = 0
    reef_fish = @recordSet('ThreatenedSpecies', 'RFish').toArray()
    if reef_fish?.length > 0
      for rf in reef_fish
        sensitivity = rf.SENSTV
        if sensitivity == "less than 0.48"
          RF_BIN1 = rf.AREA_PERC
        else if sensitivity == "0.48 - 0.55"
          RF_BIN2 = rf.AREA_PERC
        else if sensitivity == "0.55 - 0.63"
          RF_BIN3 = rf.AREA_PERC
        else
          RF_BIN4 = rf.AREA_PERC

    bathyal_seamounts = @recordSet('ThreatenedSpecies', 'BSeamounts').toArray()
    BIOREGION_5 = 0
    BIOREGION_6 = 0
    BIOREGION_12 = 0
    BIOREGION_14 = 0

    if bathyal_seamounts?.length > 0
      for bs in bathyal_seamounts
        name = bs.province
        if name.indexOf("5") >= 0
          BIOREGION_5 = bs.COUNT
        else if name.indexOf("6") >= 0
          BIOREGION_6 = bs.COUNT
        else if name.indexOf("12") >= 0
          BIOREGION_12 = bs.COUNT
        else if name.indexOf("14") >= 0
          BIOREGION_14 = bs.COUNT

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
      threatened_species: threatened_species
      RF_BIN1: RF_BIN1
      RF_BIN2: RF_BIN2
      RF_BIN3: RF_BIN3
      RF_BIN4: RF_BIN1
      coral_threats: coral_threats

      CORAL_THREAT_LOW:CORAL_THREAT_LOW
      CORAL_THREAT_MEDIUM:CORAL_THREAT_MEDIUM
      CORAL_THREAT_HIGH:CORAL_THREAT_HIGH
      CORAL_THREAT_VHIGH:CORAL_THREAT_VHIGH

      BIOREGION_5: BIOREGION_5
      BIOREGION_6: BIOREGION_6
      BIOREGION_12: BIOREGION_12
      BIOREGION_14: BIOREGION_14

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = BiodiversityTab