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

    renewable_energy = @recordSet("Energy", "RenewableEnergy").toArray()
    fuel_import = @recordSet("Energy", "FuelImport").toArray()

    comm_sub_catch = @recordSet("CoastalCatch", "CommercialSubTable").toArray()
    ocean_catch = @recordSet("CoastalCatch", "OceanTable").toArray()

    fisheries = @recordSet("Fisheries", "FisheriesTable").toArray()
    aqua = @recordSet("PacioceaAquaculture", "aq").toArray()

    gdp_value = @recordSet("Fisheries", "GDPTable").toArray() 
    export_value = @recordSet("Fisheries", "ExportTable").toArray() 

    size = @recordSet('Size', 'Size').float('SIZE_IN_KM')
    new_size =  @addCommas size

    mining = @recordSet('DeepSea', 'Mining').toArray()
    mining = @processMiningData mining

    
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



    isCollection = @model.isCollection()

    attributes = @model.getAttributes()
    
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      size: new_size


      coastal_catch: coastal_catch
      isCollection: isCollection
      mining:mining
      comm_sub_catch: comm_sub_catch
      ocean_catch: ocean_catch

      fisheries: fisheries
      export_value: export_value
      gdp_value: gdp_value
      aqua:aqua

      tourist_arrivals:tourist_arrivals
      tourist_pop:tourist_pop

      renewable_energy: renewable_energy
      fuel_import: fuel_import
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