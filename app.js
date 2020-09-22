const express = require('express')
const cors = require('cors')
const logger = require('morgan')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(cors())

// catch 404 and forward to error handler
// app.use((req, res, next) => {
//   next(createError(404))
// })

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // send the error message
  res.status(err.status || 500).json({ error: err.message })
})

module.exports = app
