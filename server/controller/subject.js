const M = require('../model')
let PWMolde = M('problemsWarehouse')

const resource = {
  add: (req, res, next) => {
    const {name, title, content, score, tags, note, answer} = req.body
    const email = req.$getInfo.email
    PWMolde.findByEmailAndName(email, name)
      .then(data => {
        if (data.length !== 1) {
          return Promise.reject('找不到此题库')
        }
        return PWMolde.update({
          email: email,
          name: name
        }, {
          $push: {
            details: {
              name: title,
              content: content,
              answer: answer,
              note: note,
              category: tags,
              score: score
            }
          }
        }, {
          enable: false
        })
          .catch(() => Promise.reject('添加题目失败'))
          .then(data => Promise.resolve('添加题目成功'))
      })
      .unified((state, data) => {
        res.send({
          state,
          data
        })
      })
  },
  del: (req, res, next) => {
    const { name, id } = req.query
    const email = req.$getInfo.email
    PWMolde.findByEmailAndName(email, name)
      .catch(() => Promise.reject('连接数据库出错'))
      .then(data => {
        if (data.length !== 1) {
          return Promise.reject('找不到此题库')
        }
        return PWMolde.update({
          email: email,
          name: name
        }, {
          '$pull': {
            'details': {
              _id: id
            }
          }
        })
          .catch(() => Promise.reject('删除失败'))
          .then(() => Promise.resolve('删除成功'))
      })
      .unified((state, data) => {
        res.send({
          state,
          data
        })
      })
  }
}

module.exports = resource
