CurrentStateTab = require './currentstate.coffee'
ScenarioOneTab = require './scenarioone.coffee'
ScenarioTwoTab = require './scenariotwo.coffee'

window.app.registerReport (report) ->
  report.tabs [CurrentStateTab, ScenarioOneTab, ScenarioTwoTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
