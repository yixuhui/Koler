const fun = {
  navRightModeltoggle: (self) => {
    const routerName = self.$router.history.current.name
    const model = (routerName === 'Main')
      ? 'userInfo'
      : (routerName === 'problemsWarehouse')
      ? 'subject'
      : (routerName === 'Exam')
      ? 'exem'
      : 'userInfo'
    const subjectName = (model === 'subject')
      ? self.$router.history.current.params.name
      : ''
    self.$store.dispatch('getInfoBymodel', {
      model: model,
      subjectName: subjectName
    })
  }
}

exports.install = function (Vue, options) {
  Vue.prototype.fun = fun
}
