OverviewTab = require './overview.coffee'
EconomicTab = require './economic.coffee'
AdaptationTab = require './adaptation.coffee'
BiodiversityTab = require './biodiversity.coffee'

window.app.registerReport (report) ->
  report.tabs [OverviewTab, EconomicTab, AdaptationTab, BiodiversityTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
