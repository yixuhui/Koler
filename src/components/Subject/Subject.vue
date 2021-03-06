<template>
  <div class="subject C-subject" v-if="state">
    <v-jumbotron v-if="details.length === 0">
      <h1>Sorry</h1>
      <p>您还没有创建任何的题目</p>
      <el-button type="primary" size="large" @click="toggleDialog('create')">点我创建</el-button>
    </v-jumbotron>
    <div v-else>
      <v-jumbotron class="create-subject">
        <div class="pw-operation">
          <el-button type="text" @click="toggleDialog('create')">创建题库</el-button>
          <el-button type="text" @click="pageTurn('last')" :disabled="checkLastPage">上一页</el-button>
          <el-button type="text" @click="pageTurn('next')" :disabled="checkNextPage">下一页</el-button>
          <el-button type="text" @click="showAllSubject()" :disabled="checkShowAllSubject">显示全部题目</el-button>
        </div>
      </v-jumbotron>
      <br><br>
      <div>
        <el-card class="box-card" v-for="(subject, id) in details" :key="subject.id">
          <div slot="header" class="clearfix">
            <span class="subject-header">
              <el-checkbox class="test-checkbox" v-if='toggleTestCheckbox' :data-id=subject._id :checked='isChecked(subject._id)' @change.native="addSubjectToTest"></el-checkbox>
              <span>{{id+1}}、{{subject.name}}</span>
            </span>
            <div class="subject-info">
              <div class="tag">
                <el-tag class="tag-item" v-for="tag in subject.category" :key="tag">{{tag}}</el-tag>
              </div>
              <b>分值：{{subject.score}}</b>
            </div>
          </div>
          <div class="item">
            <v-markdown class="subject-content" :value="subject.content" :configs="subjectSimplemdeConfigs" :highlight="true" ref="subjectContent" preview-class="markdown-body"></v-markdown>
          </div>
          <div class="card-foot">
            <el-button type="info" class="note" @click="showAnswerOrNote('note', subject.note)"  size="small" icon="el-icon-document">显示备注</el-button>
            <el-button type="info" class="answer" @click="showAnswerOrNote('answer', subject.answer)"  size="small" icon="el-icon-tickets">显示答案</el-button>
            <el-button type="danger" @click="deleteSubject(subject._id)"  size="small" icon="el-icon-delete"> 删 除 </el-button>
          </div>
        </el-card>
      </div>
    </div>
    <el-dialog
      :title="dialog.title"
      :visible.sync="dialog.state"
      width="40%">
      <div v-if="dialog.model === 'create'">
        <el-form :model="create" :rules="rules.create" ref="create" label-position="top" label-width="100px">
          <el-form-item label="题目标题" prop="title">
            <el-input v-model="create.title" :autofocus="true" size="medium"></el-input>
          </el-form-item>
          <el-form-item label="题目内容" prop="content">
            <v-markdown v-model="create.content" :configs="simplemdeConfigs" :highlight="true" preview-class="markdown-body" ref="createSimplemdeContent"></v-markdown>
          </el-form-item>
          <el-form-item label="题目备注" prop="note">
            <v-markdown v-model="create.note" :configs="simplemdeConfigs" :highlight="true" preview-class="markdown-body" ref="createSimplemdeNote"></v-markdown>
          </el-form-item>
          <el-form-item label="题目答案" prop="answer">
            <v-markdown v-model="create.answer" :configs="simplemdeConfigs" :highlight="true" preview-class="markdown-body" ref="createSimplemdeAnswer"></v-markdown>
          </el-form-item>
          <el-form-item label="题目分值" prop="score">
            <el-input-number v-model="create.score" size="small" :min="1" :max="1000"></el-input-number>
          </el-form-item>
          <el-form-item label="题目标签" prop="tags">
            <el-tag :key="tag" v-for="tag in create.tags" closable :disable-transitions="false" @close="handleClose(tag)">
              {{tag}}
            </el-tag>
            <el-input class="input-new-tag" ref="saveTagInput" size="small" style="height: 38px;"
              :style="tagsMargin"
              v-show="create.inputVisible"
              v-model="create.inputValue"
              @keyup.enter.native="handleInputConfirm"
              @blur="handleInputConfirm">
            </el-input>
            <el-button v-show="!create.inputVisible" class="button-new-tag" size="small" @click="showInput()" :style="tagsMargin">+ 添加标签</el-button>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="toggleDialog()" size="small" icon="el-icon-close">取消</el-button>
        <el-button @click="resetForm(dialog.model)" size="small" icon="el-icon-refresh">重置</el-button>
        <el-button type="primary" @click="subjectOperation(dialog.model)" :loading="dialog.loading" size="small" icon="el-icon-check">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="题目答案"
      :visible.sync="answerDialog.state"
      width="40%">
      <v-markdown v-model="answerDialog.data" v-if="answerDialog.state" :configs="subjectSimplemdeConfigs" :highlight="true" ref="answerSimplemde" preview-class="markdown-body"></v-markdown>
    </el-dialog>
    <el-dialog
      title="题目备注"
      :visible.sync="noteDialog.state"
      width="40%">
      <v-markdown v-model="noteDialog.data" v-if="noteDialog.state" :configs="subjectSimplemdeConfigs" :highlight="true" ref="noteSimplemde" preview-class="markdown-body"></v-markdown>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Jumbotron from '~/Jumbotron'
import markdownEditor from 'vue-simplemde/src/markdown-editor'
import hljs from 'highlight.js'
window.hljs = hljs

export default {
  data () {
    return {
      name: '', // 当前题库名称
      num: '',  // 要显示题目的数量(all: 全部显示)
      state: false, // 当前题库是否有题目，如果有题目则显示，没有则显示jumbotron
      details: [],  // 题目详情信息
      testList: [], // 试卷选题列表
      simplemdeConfigs: { // simplemde配置
        spellChecker: false, // 禁用拼写检查
        status: false, // 禁用底部状态栏
        autoDownloadFontAwesome: false
      },
      subjectSimplemdeConfigs: { // simplemde配置
        spellChecker: false, // 禁用拼写检查
        status: false, // 禁用底部状态栏
        toolbar: false,
        autoDownloadFontAwesome: false
      },
      create: { // 创建题库
        title: '', // 题目标题
        content: '', // 题目内容
        note: '', // 题目备注
        answer: '',
        score: '',  // 题目分值
        tags: [],  // 题目标签
        inputVisible: false, // tags里的input是否显示
        inputValue: ''  // 添加新的tag时的值
      },
      dialog: {
        state: false, // 弹窗是否显示
        model: '',  // 当前选择的模式
        title: '' // 不同模式，不同标题
      },
      answerDialog: {
        state: false,  // 是否显示备注
        data: ''  // 显示id的答案
      },
      noteDialog: {
        state: false,  // 是否显示答案
        data: ''  // 显示id的答案
      },
      rules: {
        create: {
          title: [{
            validator: (rule, value, callback) => {
              if (!value) {
                return callback(new Error('请输入标题'))
              }
              if (value[0] === ' ' || value[value.length - 1] === ' ') {
                return callback(new Error('标题的开始处或结尾不能有空格'))
              }
              callback()
            },
            trigger: 'change'
          }],
          content: [{required: true, message: '请输入题目内容', trigger: 'blur'}]
        }
      }
    }
  },
  created () {
    this.subjectInfo()
  },
  mounted () {
    this.refreshSubjectContent()
  },
  components: {
    'v-jumbotron': Jumbotron,
    'v-markdown': markdownEditor
  },
  watch: {
    '$route': 'subjectInfo',
    'dialog.model': 'editCopyImage'
  },
  computed: {
    ...mapGetters('problemsWarehouse', [
      'getDetailsByName',
      'getProblemsWarehouseInfo'
    ]),
    ...mapGetters('test', [
      'getSituation',
      'getList'
    ]),
    tagsMargin () {
      return (this.create.tags.length === 0) && 'margin-left: 0;'
    },
    checkLastPage () {
      const pageNum = this.$route.params.num
      return (pageNum === 'all') ? true : (pageNum * 1 === 1)
    },
    checkNextPage () {
      const pageNum = this.$route.params.num
      let data = this.getProblemsWarehouseInfo[this.name].details
      if (pageNum === 'all' || data.length < 20) {
        return true
      } else {
        return (pageNum === Math.ceil(data.length / 20))
      }
    },
    checkShowAllSubject () {
      let data = this.getProblemsWarehouseInfo[this.name].details
      return (data.length < 20)
    },
    toggleTestCheckbox () {
      return (this.getSituation === 'start')
    }
  },
  methods: {
    ...mapActions('problemsWarehouse', [
      'getProblemsWarehouseList'
    ]),
    ...mapActions('test', [
      'add',
      'del'
    ]),
    subjectInfo () {
      const name = (this.name = this.$route.params.name)
      const num = (this.num = this.$route.params.num)
      if (this.getDetailsByName(this.name).state) {
        let data = this.getProblemsWarehouseInfo[name].details
        this.details = num === 'all' ? data : data.slice(num * 20 - 20, num * 20)
        this.state = true
      } else {
        this.$message.warning('不存在此题库，已返回首页')
        this.$router.push('/')
      }
    },
    pageTurn (method) {
      const pageNum = this.$route.params.num
      let data = this.getProblemsWarehouseInfo[this.name].details
      if (method === 'last') {
        if (pageNum !== 1) {
          this.$router.push({params: { num: pageNum * 1 - 1 }})
        }
      } else if (method === 'next') {
        if (pageNum !== Math.ceil(data.length / 20)) { // 4.1 => 5 && 4.9 => 5 && 4.05 => 5x
          this.$router.push({params: { num: pageNum * 1 + 1 }})
        }
      }
      this.refreshSubjectContent()
    },
    showAllSubject () {
      this.$router.push({params: { num: 'all' }})
      this.refreshSubjectContent()
    },
    refreshSubjectContent () {
      this.$nextTick(() => {
        if (this.$refs.subjectContent !== undefined) {
          this.$refs.subjectContent.forEach(content => {
            const simplemde = content.simplemde
            if (!simplemde.isPreviewActive()) {
              simplemde.togglePreview()
            }
          })
        }
      })
    },
    toggleDialog (model) {
      const dialog = this.dialog
      dialog.state = !dialog.state
      dialog.loading = false
      if (model) {
        dialog.model = model
        switch (model) {
          case 'create':
            dialog.title = '创建题目'
            break
        }
      }
    },
    showAnswerOrNote (model, data) {
      const answerOrNoteDialog = this[`${model}Dialog`]
      answerOrNoteDialog.state = !answerOrNoteDialog.state
      answerOrNoteDialog.data = data
      this.$nextTick(() => {
        const simplemde = this.$refs[`${model}Simplemde`].simplemde
        if (!simplemde.isPreviewActive()) {
          this.$refs[`${model}Simplemde`].simplemde.togglePreview()
        }
      })
    },
    sendSubjectData (model) {
      let request = {}
      switch (model) {
        case 'create':
          request = this.$http.post(`/Api/subject`, {
            name: this.name,  // 当前题库
            title: this.create.title,  // 题目标题
            content: this.create.content,  // 题目内容
            note: this.create.note, // 题目备注
            answer: this.create.answer,
            score: this.create.score, // 题目分值
            tags: this.create.tags  // 题目标签(类别)
          })
          break
      }
      return new Promise((resolve) => {
        resolve(request)
      })
    },
    subjectOperation (model) {
      const dialog = this.dialog
      dialog.loading = true
      this.sendSubjectData(model).then((res) => {
        dialog.loading = false
        const data = res.data
        this.$message[data.state ? 'success' : 'error'](data.data)
        this.toggleDialog()
        if (data.state) {
          this.getProblemsWarehouseList(() => {
            // 重新渲染组件，使之看到最新的变化，无需刷新页面
            this.subjectInfo()
            this.refreshSubjectContent()
            this.$store.dispatch('navRight/getInfoBymodel', {
              model: 'subject',
              subjectName: this.name
            })
          })
          // 当成功时重置表单，防止失败后，重新填写表单
          this.resetForm(model)
          this[model].answer = ''
          this.refreshSubjectContent()
        }
      })
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    handleClose (tag) {
      this.create.tags.splice(this.create.tags.indexOf(tag), 1)
    },
    handleInputConfirm () {
      let create = this.create
      let inputValue = create.inputValue
      if (inputValue) {
        create.tags.push(inputValue)
      }
      create.inputVisible = false
      create.inputValue = ''
    },
    showInput () {
      this.create.inputVisible = true
      this.$nextTick(() => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    deleteSubject (id) {
      this.$confirm('此操作将永久删除该题目, 是否继续?', '删除题目', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http.delete(`/Api/subject/?name=${this.name}&id=${id}`)
        .then((res) => {
          const data = res.data
          this.$message[data.state ? 'success' : 'error'](data.data)
          this.getProblemsWarehouseList(() => {
            // 重新渲染组件，使之看到最新的变化，无需刷新页面
            this.subjectInfo()
            this.$store.dispatch('navRight/getInfoBymodel', {
              model: 'subject',
              subjectName: this.name
            })
          })
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    isChecked (id) {
      return (this.getList.indexOf(id) !== -1)
    },
    addSubjectToTest (e) {
      const state = !e.currentTarget.getAttribute('aria-checked')
      const id = e.currentTarget.getAttribute('data-id')
      state ? this.add(id) : this.del(id)
    },
    editCopyImage () {
      if (this.dialog.model !== 'create') return true

      this.$nextTick(() => {
        [this.$refs.createSimplemdeContent, this.$refs.createSimplemdeNote, this.$refs.createSimplemdeAnswer].map(({simplemde}) => {  // 一共有三个编辑窗口，所以需要循环监听事件
          simplemde.codemirror.on('drop', (editor, e) => {  // 拖拽图片的触发函数
            if (!(e.dataTransfer && e.dataTransfer.files)) {
              this.$message({
                message: '该浏览器不支持操作',
                type: 'error'
              })
              return
            }
            let dataList = e.dataTransfer.files
            let imageFiles = []
            for (let i = 0; i < dataList.length; i++) {
              if (dataList[i].type.indexOf('image') === -1) {
                this.$message({
                  message: '仅支持图片拖拽',
                  type: 'error'
                })
                continue
              }
              imageFiles.push(dataList[i])
            }
            this.uploadImagesFile(simplemde.codemirror, imageFiles)
            e.preventDefault()
          })

          simplemde.codemirror.on('paste', (editor, e) => { // 粘贴图片的触发函数
            if (!(e.clipboardData && e.clipboardData.items)) {
              this.$message({
                message: '该浏览器不支持操作',
                type: 'error'
              })
              return
            }
            try {
              let dataList = e.clipboardData.items
              if (dataList[0].kind === 'file' && dataList[0].getAsFile().type.indexOf('image') !== -1) {
                this.uploadImagesFile(simplemde.codemirror, [dataList[0].getAsFile()])
              }
            } catch (e) {
              this.$message({
                message: '请确定你粘贴板是图片，而不是文件',
                type: 'error'
              })
            }
          })
        })
      })
    },
    uploadImagesFile (simplemde, files) {
      let params = files.map(file => {
        let param = new FormData()
        param.append('file', file, file.name)
        return param
      })
      let makeRequest = params => {
        return this.$http.post('/Api/subject/upload', params)
      }
      let requests = params.map(makeRequest)

      this.$http.all(requests)
        .then(this.$http.spread((...resps) => {
          for (let i = 0; i < resps.length; i++) {
            let {state, data} = resps[i].data
            if (!state) { // 如果不是图片文件，则跳过
              this.$message.error(data)
              continue
            }
            let url = `![](${location.origin + data})`  // 拼接成markdown语法
            let content = simplemde.getValue()
            simplemde.setValue(content + url + '\n')  // 和编辑框之前的内容进行拼接
          }
        }))
    }
  }
}
</script>

<style lang="less" scoped>
  .create-subject {
    padding:10px 10px 10px 30px !important;
    button {
      font-size: 16px;
    }
  }
  .box-card {
    background-color: rgba(255, 255, 255, 0.9215686274509803);
    margin-bottom: 20px;
    .clearfix {
      .test-checkbox {
        margin-right: 10px; 
      }
      .subject-header {
        line-height: 32px;
        font-size:17px;
      }
      .subject-info {
        float: right;
        .tag {
          display: inline-block;
        }
        b {
          display: inline-block;
          margin: 5px 0 0 50px;
          font-size:16px;
          color: #EB9E05;
        }
      }
    }
    .item {
      margin: 18px 0;
      font-size: 18px;
      &:first-of-type {
        margin: 0;
      }
      .subject-content {
        line-height: 1.65;
        font-size: 16px;
      }
    }
    .card-foot {
      text-align: right;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #d1dbe5;
      .answer, .note{
        float: left;
      }
      .tag {
        float: right;
        .tag-item {
          margin-right: 10px;
          &:last-child {
            margin-right: 0;
          }
        }
      }
    }
  }
</style>

<style lang="less">
.C-subject {
  @import '~simplemde/dist/simplemde.min.css';
  @import '~github-markdown-css';
  @import '~highlight.js/styles/github.css';
  @import '~font-awesome/css/font-awesome.min.css';

  textarea {
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "\5FAE\8F6F\96C5\9ED1", Arial,sans-serif !important;
    height: 150px;
  }
  .el-tag + .el-tag {
    margin-left: 10px;
  }
  .button-new-tag {
    margin-left: 10px;
    height: 32px;
    line-height: 30px;
    padding-top: 0;
    padding-bottom: 0;
  }
  .input-new-tag {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
  }
  .el-card__header {
    padding: 10px 20px;
  }
  .el-card__body {
    padding-top: 0;
    padding-bottom: 10px;
  }
  .markdown-editor {
    .editor-toolbar {
      line-height: normal;
    }
    .CodeMirror-line {
      font-size: 16px;
      line-height: normal;
    }
    .cm-comment {
      background: none !important;
    }
    pre code {
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
  .subject-content {
    .CodeMirror-wrap {
      min-height: auto;
      border: none;
      background-color: rgba(255, 255, 255, 0);
      .CodeMirror-sizer {
        display: none;
      }
      .CodeMirror-scroll {
        opacity: 0;
        min-height: auto;
        .CodeMirror-code {
          opacity: 0;
        }
      }
      .editor-preview {
        position: static;
      }
      .markdown-body {
        background-color: rgba(255, 255, 255, 0);
        overflow: hidden;
      }
    }
  }
  .el-form-item {
    .el-form-item__content {
      margin-left: 0 !important;
    }
  }
}
</style>