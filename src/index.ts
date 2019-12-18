import * as core from '@actions/core'
import * as AWS from 'aws-sdk'
import {formatter} from './format'
import {writeFileSync} from 'fs'
import {Parameter} from 'aws-sdk/clients/ssm'


async function run() {
  const region = process.env.AWS_DEFAULT_REGION
  const ssm = new AWS.SSM({region})

  try {
    const ssmPath = core.getInput('ssm-path', {required: true})
    const format = core.getInput('format', {required: true})
    const output = core.getInput('output', {required: true})
    const prefix = core.getInput('prefix')

    try {
      const {Parameters} = await ssm
        .getParametersByPath({
          WithDecryption: true,
          Path: ssmPath,
          Recursive: true,
        })
        .promise()

      core.debug(`parameters length: ${Parameters.length}`)

      const envs = Parameters.map<Parameter>(p => ({
        Value: p.Value,
        Name: p.Name.split('/').pop(),
      }))
        .map<string>(formatter(format)(prefix))
      if (envs.length > 0) {
        envs.push('\n')
      }

      writeFileSync(output, envs.join('\n'))
    } catch (e) {
      core.error(e)
      core.setFailed(e.message)
    }
  } catch (e) {
    core.setFailed(e.message)
  }
}

run()
