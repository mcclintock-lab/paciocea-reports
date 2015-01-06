EconomyTab = require './economy.coffee'
AdaptationTab = require './adaptation.coffee'
BiodiversityTab = require './biodiversity.coffee'

window.app.registerReport (report) ->
  report.tabs [EconomyTab, AdaptationTab, BiodiversityTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
