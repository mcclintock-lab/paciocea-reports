ReportTab = require 'reportTab'
ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'

partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class CurrentStateTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Current State'
  className: 'currentstate'
  timeout: 120000
  template: templates.currentstate
  dependencies: [
    'Size'
    'DeepSea'
  ]

  render: () ->

    size = @recordSet('Size', 'Size').float('SIZE_IN_KM')
    new_size =  @addCommas size

    mining = @recordSet('DeepSea', 'Mining').toArray()
    mining = @processMiningData mining

    seamounts = @recordSet('DeepSea', 'Seamounts').toArray()
    console.log("seamounts are ", seamounts)
    num_seamounts = @getNumSeamounts seamounts
    avg_depth_seamounts = @getAvgDepthSeamounts seamounts

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
      size: new_size
      num_seamounts: num_seamounts
      avg_depth_seamounts: avg_depth_seamounts
      isCollection: isCollection
      mining:mining

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

  getNumSeamounts: (seamounts) =>
    for sm in seamounts
      return sm.NUMBER

  getAvgDepthSeamounts: (seamounts) =>
    for sm in seamounts
      return sm.AVG_DEPTH

  processMiningData: (mining_data) =>
    new_mining_data = []
    for md in mining_data
      name = md.TYPE
      size = @addCommas md.SIZE_SQKM
      perc = md.PERC_TOT
      if perc < 0.1
        perc = "< 0.1"
      new_mining_data.push {TYPE:name, SIZE_SQKM:size,PERC_TOT:perc}

    return new_mining_data

  addCommas: (num_str) =>
    num_str += ''
    x = num_str.split('.')
    x1 = x[0]
    x2 = if x.length > 1 then '.' + x[1] else ''
    rgx = /(\d+)(\d{3})/
    while rgx.test(x1)
      x1 = x1.replace(rgx, '$1' + ',' + '$2')
    return x1 + x2

module.exports = CurrentStateTab