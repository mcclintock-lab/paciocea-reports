ScenarioOneTab = require './scenarioone.coffee'
ScenarioTwoTab = require './scenariotwo.coffee'

window.app.registerReport (report) ->
  report.tabs [ScenarioOneTab, ScenarioTwoTab]
  # path must be relative to dist/
  report.stylesheets ['./scenario.css']

