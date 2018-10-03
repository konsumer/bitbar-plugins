#!/usr/local/bin/node

// <bitbar.title>Starred Gitlab CI</bitbar.title>
// <bitbar.version>v1.0</bitbar.version>
// <bitbar.author>David Konsumer</bitbar.author>
// <bitbar.author.github>konsumer</bitbar.author.github>
// <bitbar.desc>Show CI status of your started projects</bitbar.desc>
// <bitbar.dependencies>node</bitbar.dependencies>

const https = require('https')
const querystring = require('querystring')

// you can also set this to a string
const { GITLAB_KEY } = process.env

// const GITLAB_PROJECT = 'you/project'

if (!GITLAB_KEY) {
  throw new Error('GITLAB_KEY not set.')
}

if (!GITLAB_PROJECT) {
  throw new Error('GITLAB_PROJECT not set.')
}

const emojis = {
  'created': '💤',
  'pending': '💤',
  'running': '🚀',
  'failed': '❗',
  'success': '✔️',
  'skipped': '🚀',
  'manual': '👊',
  'canceled': '✖'
}

const pad = (num, places = 2, str = '0') => num.toString().padStart(places, str)

const durationToString = sec => {
  const hours = (sec / 3600) | 0
  const hourSec = hours * 3600
  const minutes = ((sec - hourSec) / 60) | 0
  const minSec = minutes * 60
  const seconds = ((sec - hourSec - minSec)) | 0
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

const api = (endpoint, args) => new Promise((resolve, reject) => {
  const url = `https://gitlab.com/api/v4/${endpoint}?private_token=${GITLAB_KEY}${args ? '&' + querystring.stringify(args) : ''}`
  https.get(url, res => {
    res.setEncoding('utf8')
    let body = ''
    res.on('data', data => {
      body += data
    })
    res.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(e)
        console.log('ERROR', url, body)
      }
    })
    res.on('error', err => {
      reject(err)
    })
  })
})

const run = async () => {
  const projects = (await api('projects', {
    membership: true,
    sort: 'desc',
    order_by: 'updated_at',
    simple: true
  })).filter(p => p.path_with_namespace === GITLAB_PROJECT)

  if (!projects) {
    console.log('no projects found')
    return
  }

  const pipelines = await Promise.all(
    projects
      .map(p => api(`projects/${p.id}/pipelines`))
  )
  await Promise.all(
    projects.map(async (project, p) => {
      project.pipelines = await Promise.all(pipelines[p].map(pipe => {
        return api(`projects/${project.id}/pipelines/${pipe.id}`)
      }))
    })
  )

  const sortedprojects = projects.map(project => {
    return {
      ...project,
      pipelines: project.pipelines
        .map(pipe => {
          return {
            ...pipe,
            icon: emojis[pipe.status] || '💀'
          }
        })
        .sort((a, b) => (
          (a.finished_at === b.finished_at)
            ? 0
            : a.finished_at < b.finished_at ? -1 : 1
        ))
    }
  })

  console.log(sortedprojects.map(project => {
    const pipe = project.pipelines && project.pipelines.length && project.pipelines[project.pipelines.length - 1]
    if (pipe) {
      return `${pipe.icon} ${project.name}
---
${pipe.status} on ${pipe.tag ? pipe.tag : 'master'} by ${pipe.user.username} in ${durationToString(pipe.duration)} | href="${pipe.web_url}"
`
    }
  }).join(' · '))
}
run()
