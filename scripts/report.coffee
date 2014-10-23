CurrentStateTab = require './currentstate.coffee'

window.app.registerReport (report) ->
  report.tabs [CurrentStateTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
