BaseReportTab = require 'baseReportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'

partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class EconomyTab extends BaseReportTab
  # this is the name that will be displayed in the Tab
  name: 'Sustainable Economy'
  className: 'economy'
  timeout: 120000
  template: templates.economy

  dependencies: [
    'CoastalCatch'
    'Size'
    'DeepSea'
    'Fisheries'
    'PacioceaAquaculture'
    'Tourism'
    'Energy'
  ]


  render: () ->
    msg = @recordSet("CoastalCatch", "ResultMsg")
    
    coastal_catch = @recordSet("CoastalCatch", "CoastalCatchTable").toArray()
    commercial_catch = @recordSet("CoastalCatch", "CommercialTable").toArray()
    subsistence_catch = @recordSet("CoastalCatch", "SubsistenceTable").toArray()
    ocean_catch = @recordSet("CoastalCatch", "OceanTable").toArray()
    renewable_energy = @recordSet("Energy", "RenewableEnergy").toArray()

    if renewable_energy?.length > 0
      has_renewable_energy = true
      avg_renewable_energy = renewable_energy[0].AVG
    else

      has_renewable_energy = false

    fuel_import = @recordSet("Energy", "FuelImport").toArray()
    if fuel_import?.length > 0
      has_fuel_import = true
      avg_fuel_import = fuel_import[0].AVG
    else 
      has fuel_import = false

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
    aqua = @recordSet("PacioceaAquaculture", "aq").toArray()

    #this feels gross. in order to not have to add another record set in the gp, each row in
    #the table has the avg/total added to it. so if its a single row table, get the value,
    #otherwise get the first one. better way to do this?
    avg_fisheries_coastal_catch = @recordSet("Fisheries", "FisheriesTable").float('CST_AVG')
    if avg_fisheries_coastal_catch?.length > 1
      avg_fisheries_coastal_catch = avg_fisheries_coastal_catch[0]

    tot_fisheries_coastal_catch = @recordSet("Fisheries", "FisheriesTable").float('CST_TOT')
    if tot_fisheries_coastal_catch?.length > 1
      tot_fisheries_coastal_catch = tot_fisheries_coastal_catch[0]

    avg_fisheries_aqua_catch = @recordSet("Fisheries", "FisheriesTable").float('AQUA_AVG')
    if avg_fisheries_aqua_catch?.length > 1
      avg_fisheries_aqua_catch = avg_fisheries_aqua_catch[0]
    tot_fisheries_aqua_catch = @recordSet("Fisheries", "FisheriesTable").float('AQUA_TOT')
    if tot_fisheries_aqua_catch?.length > 1
      tot_fisheries_aqua_catch = tot_fisheries_aqua_catch[0]

    avg_fisheries_domestic_catch = @recordSet("Fisheries", "FisheriesTable").float('DOM_AVG')
    if avg_fisheries_domestic_catch?.length > 1
      avg_fisheries_domestic_catch = avg_fisheries_domestic_catch[0]
    tot_fisheries_domestic_catch = @recordSet("Fisheries", "FisheriesTable").float('DOM_TOT')
    if tot_fisheries_domestic_catch?.length > 1
      tot_fisheries_domestic_catch = tot_fisheries_domestic_catch[0]

    avg_fisheries_foreign_catch = @recordSet("Fisheries", "FisheriesTable").float('FRN_AVG')
    if avg_fisheries_foreign_catch?.length > 1
      avg_fisheries_foreign_catch = avg_fisheries_foreign_catch[0]
    tot_fisheries_foreign_catch = @recordSet("Fisheries", "FisheriesTable").float('FRN_TOT')   
    if tot_fisheries_foreign_catch?.length > 1
      tot_fisheries_foreign_catch = tot_fisheries_foreign_catch[0]

    gdp_value = @recordSet("Fisheries", "GDPTable").toArray() 
    export_value = @recordSet("Fisheries", "ExportTable").toArray() 

    size = @recordSet('Size', 'Size').float('SIZE_IN_KM')
    new_size =  @addCommas size

    mining = @recordSet('DeepSea', 'Mining').toArray()
    mining = @processMiningData mining

    seamounts = @recordSet('DeepSea', 'Seamounts').toArray()
    tourist_arrivals = @recordSet('Tourism', 'TouristArrivals').toArray()
    tourist_pop = @recordSet('Tourism', 'TouristPopulation').toArray()
    gdp_percent = @recordSet('Tourism', 'GDPPercent').float('GDP')
    if gdp_percent > 0.1
      gdp_percent = gdp_percent.toFixed(1)

    intl_tourist_arrival_total = @recordSet('Tourism', 'InternationalArrivals').float('Arrivals')
    has_international_tourists = intl_tourist_arrival_total > 0
    if has_international_tourists
      intl_tourist_arrival_total = @addCommas intl_tourist_arrival_total
      
    intl_tourist_arrival_perc = @recordSet('Tourism', 'InternationalArrivals').float('IA_PERC')
    if intl_tourist_arrival_perc > 0.1
      intl_tourist_arrival_perc = intl_tourist_arrival_perc.toFixed(1)
      
    cruise_ships = @recordSet('Tourism', 'Cruiseships').float('Ports')
    has_cruiseship_visits = cruise_ships > 0
    cruise_ships_perc = @recordSet('Tourism', 'Cruiseships').float('CR_PERC')
    if cruise_ships_perc > 0.1
      cruise_ships_perc = cruise_ships_perc.toFixed(1)

    num_seamounts = @getNumSeamounts seamounts

    has_seamounts = num_seamounts > 1
    avg_depth_seamounts = @getAvgDepthSeamounts seamounts
    avg_depth_seamounts = @addCommas avg_depth_seamounts

    avg_dist_seamounts = @getAvgDistSeamounts seamounts
    avg_dist_seamounts = @addCommas(Math.round(avg_dist_seamounts))


    isCollection = @model.isCollection()

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
      aqua:aqua

      tourist_arrivals:tourist_arrivals
      tourist_pop:tourist_pop

      renewable_energy: renewable_energy
      avg_renewable_energy: avg_renewable_energy
      has_renewable_energy: has_renewable_energy
      fuel_import: fuel_import
      avg_fuel_import: avg_fuel_import
      has_fuel_import: has_fuel_import
      gdp_percent: gdp_percent
      intl_tourist_arrival_total: intl_tourist_arrival_total
      intl_tourist_arrival_perc: intl_tourist_arrival_perc
      has_international_tourists: has_international_tourists
      cruise_ships: cruise_ships
      cruise_ships_perc: cruise_ships_perc
      has_cruiseship_visits: has_cruiseship_visits

    @$el.html @template.render(context, partials)
    col_values = {'catch_country':"COUNTRY", 'catch_in_eez':"TOT_TONS", 'catch_perc':"PERC_TOT"}
    @setupTableSorting(coastal_catch, '.coastal_catch_values', '.coastal_catch_table', col_values, 'coastal-catch-row', 'catch')
    @enableLayerTogglers()

module.exports = EconomyTab