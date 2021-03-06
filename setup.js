const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const config = require('./src/loadConfig')
const cp = require('child_process')
const logger = require('debug')('hexo-editor:installer')

console.clear()
console.log(chalk.blue.bold(
  fs.readFileSync(
    require('path').join(__dirname, './assets/logo.art'),
    'utf8'
  )) + chalk.blue.bold.underline('/ WINWIN HEXO EDITOR ') +
  chalk.blue.bold('/\n'))
inquirer
  .prompt([
    {
      name: 'hexoRoot',
      message: 'What\'s your hexo blog path? ' + chalk.blue('The same path as your hexo _config.yml file\n'),
      prefix: chalk.blue('?'),
      default: config.hexoRoot,
      validate (v) {
        return checkIsBlog(v)
      }
    }, {
      name: 'port',
      message: 'Which port do you like your hexo-editor running at?',
      default: config.port || 5777,
      validate (v) {
        return !isNaN(v) || `number is required ${typeof v} given`
      },
      prefix: chalk.blue('?')
    },
    {
      name: 'jwtSecret',
      message: 'Secret Key?' + chalk.blue('Like a password, can be anything you like.'),
      default: config.jwtSecret || 'secret',
      prefix: chalk.blue('?')
    },
    {
      name: 'jwtExpire',
      message: 'Access token expire time ' + chalk.blue('Eg: "2 days", "10h", "7d" '),
      default: config.jwtExpire || '1h',
      prefix: chalk.blue('?')
    },
    {
      name: 'jwtRefresh',
      message: 'Refresh token expire time ' + chalk.blue('Eg: "2 days", "10h", "7d" '),
      default: config.jwtRefresh || '7d',
      prefix: chalk.blue('?')
    },
    {
      name: 'username',
      default: config.username || 'admin',
      prefix: chalk.blue('?')
    },
    {
      type: 'password',
      name: 'password',
      message: 'password ' +
        chalk.blue('default `' + (config.password || 'admin') + '`'),
      default: config.password || 'admin',
      mask: '*',
      prefix: chalk.blue('?')
    }
  ])
  .then(async answers => {
    try {
      console.clear()
      logger('answers: %O', answers)
      const userConfig = {}
      const userConfigPath = './config.user.js'
      Object.keys(config).map(key => {
        userConfig[key] = answers[key]
      })
      if (fs.existsSync(userConfigPath)) {
        fs.unlinkSync(userConfigPath)
      }
      fs.writeFileSync(userConfigPath, 'module.exports =' + JSON.stringify(userConfig).replace(',', ',\n'))
      console.clear()
      console.log(chalk.blue.bold('Saving settings'))
      await exec('npx eslint config.user.js --fix')
      console.clear()
      console.log(chalk.green.bold('Finished!'))
      console.log('Run ' + chalk.blue.bold('`npm start`') + ' to start with node')
      console.log('Run ' + chalk.blue.bold('`npm run prd`') + ' to start with pm2')
      console.log('Run ' + chalk.blue.bold('`npm run stop`') + ' to stop')
      console.log('Run ' + chalk.blue.bold('`npm run restart`') + ' to restart')
      console.log('Run ' + chalk.blue.bold('`bash ./update.sh`') + ' to update')
      console.log('Run ' + chalk.blue.bold('`bash ./setup.sh`') + ' to change settings')
      console.log(chalk.green.bold('Remember to (re)start your service manually!'))
      console.log('Have fun :p')
      console.log(chalk.grey('For uninstall:'))
      console.log(chalk.grey('1) Remove the following folder: ' + process.cwd()))
      console.log(chalk.grey('2) Stop youre service manually.'))
    } catch (err) {
      console.error(chalk.bgRed.white.bold('Failed information:'))
      console.error(err)
      console.error(chalk.bgRed.white.bold('Installation failed'))
      showFAQURL()
    }
  })
  .catch(error => {
    if (error.isTtyError) {
      console.log(chalk.redBright(error))
      // Prompt couldn't be rendered in the current environment
    } else {
      console.log(chalk.redBright(error))
      // Something else when wrong
    }
  })

function showFAQURL () {
  console.error(chalk.blue.bold('For more information please visit FAQ at ') +
    chalk.blue.bold.underline('https://winwin_2011.gitee.io/winwin-hexo-editor/support/'))
}

function checkIsBlog (blog) {
  const message = `Path \`${blog}\` isn't a hexo blog folder!`
  try {
    const file = fs.readFileSync(path.join(blog, 'package.json'))
    const packageJSON = JSON.parse(file)
    if (!packageJSON.dependencies.hexo) return message
    fs.readFileSync(path.join(blog, '_config.yml'))
    return true
  } catch (err) {
    if (err.code === 'ENOENT') {
      return message
    }
    return err.message
  }
}

function exec (command, options = { log: false, cwd: process.cwd() }) {
  if (options.log) console.log(command)

  return new Promise((resolve, reject) => {
    cp.exec(command, { ...options }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
        return
      }

      resolve({ stdout, stderr })
    })
  })
}
