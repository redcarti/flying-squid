const { supportedVersions } = require('../version')

const Vec3 = require('vec3').Vec3

module.exports.server = function (serv, { version }) {
  serv.emitParticle = (particle, world, position, { whitelist, blacklist = [], radius = 32, longDistance = true, size = new Vec3(1, 1, 1), count = 1 } = {}) => {
    const players = (typeof whitelist !== 'undefined'
      ? (whitelist instanceof Array ? whitelist : [whitelist])
      : serv.getNearby({
        world: world,
        position: position,
        radius: radius
      }))

    serv._writeArray('world_particles', {
      particleId: particle,
      longDistance: longDistance,
      x: position.x,
      y: position.y,
      z: position.z,
      offsetX: size.x,
      offsetY: size.y,
      offsetZ: size.z,
      particleData: 1.0,
      particles: count,
      data: []
    }, players.filter(p => blacklist.indexOf(p) === -1))
  }

  serv.commands.add({
    base: 'particle',
    info: 'emit a particle at a position',
    usage: '/particle <id> [amount] [<sizeX> <sizeY> <sizeZ>]',
    onlyPlayer: true,
    op: true,
    parse (str) {
      const results = str.match(/(\d+)(?: (\d+))?(?: (\d+))?(?: (\d+))?(?: (\d+))?(?: (\d+))?/)
      if (!results) return false
      return {
        particle: parseInt(results[1]),
        amount: results[2] ? parseInt(results[2]) : 1,
        size: results[5] ? new Vec3(parseInt(results[3]), parseInt(results[4]), parseInt(results[5])) : new Vec3(1, 1, 1)
      }
    },
    action ({ particle, amount, size }, ctx) {
      if (amount >= 100000) {
        let tooBig
        if (supportedVersions.indexOf(version) < 5) {
          tooBig = {
            translate: 'commands.generic.num.tooBig',
            with: [ String(amount), String(100000) ]
          }
        } else {
          tooBig = {
            translate: 'argument.integer.big',
            with: [ String(100000), String(amount) ]
          }
        }
        ctx.player.chat(tooBig)
        return
      }

      let successMsg = {
        translate: 'commands.particle.success',
        with: [ String(particle), supportedVersions.indexOf(version) < 5 ? amount : '' ]
      }

      ctx.player.chat(successMsg)
      serv.emitParticle(particle, ctx.player.world, ctx.player.position, { count: amount, size: size })
    }
  })
}
