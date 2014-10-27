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
    'CoastalCatch'
    'Size'
    'DeepSea'
    'Fisheries'
  ]

  events:
    "click a.details": 'onMoreResultsClick'

  render: () ->
    msg = @recordSet("CoastalCatch", "ResultMsg")

    coastal_catch = @recordSet("CoastalCatch", "CoastalCatchTable").toArray()
    commercial_catch = @recordSet("CoastalCatch", "CommercialTable").toArray()
    subsistence_catch = @recordSet("CoastalCatch", "SubsistenceTable").toArray()
    ocean_catch = @recordSet("CoastalCatch", "OceanTable").toArray()

    if commercial_catch and commercial_catch?.length > 0
      avg_comm_catch = @recordSet("CoastalCatch", "CommercialTable").float('AVG_KG_CAP')[0]
      tot_comm_catch = @recordSet("CoastalCatch", "CommercialTable").float('TOT_KG_CAP')[0]
      has_comm_catch = true
    else
      has_comm_catch = false
    if subsistence_catch and subsistence_catch?.length > 0
      avg_sub_catch = @recordSet("CoastalCatch", "SubsistenceTable").float('AVG_KG_CAP')[0]
      tot_sub_catch = @recordSet("CoastalCatch", "SubsistenceTable").float('TOT_KG_CAP')[0]
      has_subsistence_catch = true
    else
      has_subsistence_catch = false

    if ocean_catch and ocean_catch?.length > 0
      avg_ocean_catch = @recordSet("CoastalCatch", "OceanTable").float('SK_AVG')[0]
      tot_ocean_catch = @recordSet("CoastalCatch", "OceanTable").float('RGN_TOT')[0]
      tot_ocean_catch = @addCommas tot_ocean_catch
      has_ocean_catch = true
    else
      has_ocean_catch = false

    fisheries = @recordSet("Fisheries", "FisheriesTable").toArray()

    avg_fisheries_coastal_catch = @recordSet("Fisheries", "FisheriesTable").float('CST_AVG')[0]
    tot_fisheries_coastal_catch = @recordSet("Fisheries", "FisheriesTable").float('CST_TOT')[0]

    avg_fisheries_aqua_catch = @recordSet("Fisheries", "FisheriesTable").float('AQUA_AVG')[0]
    tot_fisheries_aqua_catch = @recordSet("Fisheries", "FisheriesTable").float('AQUA_TOT')[0]

    avg_fisheries_domestic_catch = @recordSet("Fisheries", "FisheriesTable").float('DOM_AVG')[0]
    tot_fisheries_domestic_catch = @recordSet("Fisheries", "FisheriesTable").float('DOM_TOT')[0]

    avg_fisheries_foreign_catch = @recordSet("Fisheries", "FisheriesTable").float('FRN_AVG')[0]
    tot_fisheries_foreign_catch = @recordSet("Fisheries", "FisheriesTable").float('FRN_TOT')[0]    

    gdp_value = @recordSet("Fisheries", "GDPTable").toArray() 
    export_value = @recordSet("Fisheries", "ExportTable").toArray() 


    size = @recordSet('Size', 'Size').float('SIZE_IN_KM')
    new_size =  @addCommas size

    mining = @recordSet('DeepSea', 'Mining').toArray()
    mining = @processMiningData mining


    seamounts = @recordSet('DeepSea', 'Seamounts').toArray()
    
    num_seamounts = @getNumSeamounts seamounts
    has_seamounts = num_seamounts > 1
    avg_depth_seamounts = @getAvgDepthSeamounts seamounts
    avg_depth_seamounts = @addCommas avg_depth_seamounts

    avg_dist_seamounts = @getAvgDistSeamounts seamounts
    avg_dist_seamounts = @addCommas(Math.round(avg_dist_seamounts))

    isCollection = @model.isCollection()

    #show tables instead of graph for IE
    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false

    d3IsPresent = false
    attributes = @model.getAttributes()
    
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      size: new_size
      has_seamounts: has_seamounts
      num_seamounts: num_seamounts
      avg_depth_seamounts: avg_depth_seamounts
      avg_dist_seamounts: avg_dist_seamounts
      coastal_catch: coastal_catch
      isCollection: isCollection
      mining:mining
      commercial_catch: commercial_catch
      has_comm_catch: has_comm_catch
      avg_comm_catch: avg_comm_catch
      tot_comm_catch: tot_comm_catch

      subsistence_catch: subsistence_catch
      has_subsistence_catch: has_subsistence_catch
      avg_sub_catch: avg_sub_catch
      tot_sub_catch: tot_sub_catch

      has_ocean_catch: has_ocean_catch
      ocean_catch: ocean_catch
      avg_ocean_catch: avg_ocean_catch
      tot_ocean_catch: tot_ocean_catch
      d3IsPresent: d3IsPresent

      fisheries: fisheries
      avg_fisheries_coastal_catch:avg_fisheries_coastal_catch
      tot_fisheries_coastal_catch:tot_fisheries_coastal_catch

      avg_fisheries_aqua_catch:avg_fisheries_aqua_catch
      tot_fisheries_aqua_catch:tot_fisheries_aqua_catch

      avg_fisheries_domestic_catch:avg_fisheries_domestic_catch
      tot_fisheries_domestic_catch:tot_fisheries_domestic_catch

      avg_fisheries_foreign_catch:avg_fisheries_foreign_catch
      tot_fisheries_foreign_catch:tot_fisheries_foreign_catch

      export_value: export_value
      gdp_value: gdp_value

    @$el.html @template.render(context, partials)
    col_values = {'catch_country':"COUNTRY", 'catch_in_eez':"TOT_TONS", 'catch_perc':"PERC_TOT"}
    @setupTableSorting(coastal_catch, '.coastal_catch_values', '.coastal_catch_table', col_values, 'coastal-catch-row', 'catch')
    @enableLayerTogglers()

  setupTableSorting: (data, tbodyName, tableName, data_value, col_values, row_name, selected_col_prefix) =>
    index = 0
    default_sort_key = ""
    default_sort_data = ""
    default_row_data = ""
    data_cols = (v for k, v of col_values)
    for k,v in col_values
      @$('.'+k).click (event) =>
        @renderSort(k, tableName, data_value, event, v, tbodyName, (index > 0), 
          @getTableRow, row_name, data_cols, selected_col_prefix)
      if index == 0
        default_sort_key = k
        default_sort_data = data_value
        default_row_data = @getTableRow
      index+=1

    @renderSort(default_sort_key, tableName, default_sort_data, undefined, default_sort_data, tbodyName, 
      false, default_row_data, row_name, data_cols, selected_col_prefix)

  #do the sorting - should be table independent
  #skip any that are less than 0.00
  renderSort: (name, tableName, pdata, event, sortBy, tbodyName, isFloat, getRowStringValue, row_name, data_cols,
    selected_col_prefix) =>
    if event
      event.preventDefault()


    if window.d3
      targetColumn = @getSelectedColumn(event, name, selected_col_prefix)
      sortUp = @getSortDir(targetColumn)

      if isFloat
        data = _.sortBy pdata, (row) ->  parseFloat(row[sortBy])
      else
        data = _.sortBy pdata, (row) -> row[sortBy]

      #flip sorting if needed
      if sortUp
        data.reverse()

      el = @$(tbodyName)[0]
      hab_body = d3.select(el)

      #remove old rows
      hab_body.selectAll("tr."+row_name)
        .remove()

      #add new rows (and data)
      rows = hab_body.selectAll("tr")
          .data(data)
        .enter().insert("tr", ":first-child")
        .attr("class", row_name)

      
      cells = rows.selectAll("td")
          .data((row, i) ->data_cols.map (column) -> (column: column, value: row[column]))
        .enter()
        .append("td").text((d, i) -> 
          d.value
        )    

      @setNewSortDir(targetColumn, sortUp)
      @setSortingColor(event, tableName)
      #fire the event for the active page if pagination is present
      @firePagination(tableName)
      if event
        event.stopPropagation()

  #table row for habitat representation
  getTableRow: (d, data_cols) =>
    return "<td>"+d[data_cols[0]]+"</td>"+"<td>"+d[data_cols[1]]+"</td>"+"<td>"+d[data_cols[2]]+"</td>"

  setSortingColor: (event, tableName) =>
    sortingClass = "sorting_col"
    if event
      parent = $(event.currentTarget).parent()
      newTargetName = event.currentTarget.className
      targetStr = tableName+" th.sorting_col a"   
      if @$(targetStr) and @$(targetStr)[0]
        oldTargetName = @$(targetStr)[0].className
        if newTargetName != oldTargetName
          #remove it from old 
          headerName = tableName+" th.sorting_col"
          @$(headerName).removeClass(sortingClass)
          #and add it to new
          parent.addClass(sortingClass)
     
  getSortDir: (targetColumn) =>
     sortup = @$('.'+targetColumn).hasClass("sort_up")
     return sortup

  getSelectedColumn: (event, name, prefix_str) =>
    if event
      #get sort order
      targetColumn = event.currentTarget.className
      multiClasses = targetColumn.split(' ')

      tgtClassName =_.find multiClasses, (classname) -> 
        classname.lastIndexOf(prefix_str,0) == 0
      targetColumn = tgtClassName
    else
      #when there is no event, first time table is filled
      targetColumn = name

    return targetColumn

  setNewSortDir: (targetColumn, sortUp) =>
    #and switch it
    if sortUp
      @$('.'+targetColumn).removeClass('sort_up')
      @$('.'+targetColumn).addClass('sort_down')
    else
      @$('.'+targetColumn).addClass('sort_up')
      @$('.'+targetColumn).removeClass('sort_down')

  firePagination: (tableName) =>
    el = @$(tableName)[0]
    tgt_table = d3.select(el)
    active_page = tgt_table.selectAll(".active a")
    if active_page and active_page[0] and active_page[0][0]
      active_page[0][0].click()

  getNumSeamounts: (seamounts) =>
    for sm in seamounts
      return sm.NUMBER

  getAvgDepthSeamounts: (seamounts) =>
    for sm in seamounts
      return sm.AVG_DEPTH

  getAvgDistSeamounts: (seamounts) =>
    for sm in seamounts
      return sm.CONN_DIST

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

  onMoreResultsClick: (e) =>
    e?.preventDefault?()
    target_link = $(e.target)
    selected = target_link.next()
    selclass = selected.attr("class")
    if selclass== "hidden"
      selected.removeClass 'hidden'
      selected.addClass 'shown'
      target_link.text("hide details")
    else
      selected.removeClass 'shown'
      selected.addClass 'hidden'
      target_link.text("show details")

module.exports = CurrentStateTab