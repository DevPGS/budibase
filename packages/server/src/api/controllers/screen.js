const CouchDB = require("../../db")
const { getScreenParams, generateScreenID } = require("../../db/utils")
const compileStaticAssets = require("../../utilities/builder/compileStaticAssets")
const { AccessController } = require("../../utilities/security/accessLevels")

exports.fetch = async ctx => {
  const appId = ctx.user.appId
  const db = new CouchDB(appId)

  const screens = (
    await db.allDocs(
      getScreenParams(null, {
        include_docs: true,
      })
    )
  ).rows.map(element => element.doc)

  ctx.body = await new AccessController(appId).checkScreensAccess(
    screens,
    ctx.user.accessLevel._id
  )
}

exports.save = async ctx => {
  const appId = ctx.user.appId
  const db = new CouchDB(appId)
  let screen = ctx.request.body

  if (!screen._id) {
    screen._id = generateScreenID()
  }
  screen = await compileStaticAssets(ctx.user.appId, screen)
  const response = await db.put(screen)

  ctx.message = `Screen ${screen.name} saved.`
  ctx.body = response
}

exports.destroy = async ctx => {
  const db = new CouchDB(ctx.user.appId)
  await db.remove(ctx.params.screenId, ctx.params.revId)
  ctx.message = "Screen deleted successfully"
  ctx.status = 200
}
