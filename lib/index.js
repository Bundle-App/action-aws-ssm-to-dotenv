"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const AWS = require("aws-sdk");
const format_1 = require("./format");
const fs_1 = require("fs");
async function run() {
    const region = process.env.AWS_DEFAULT_REGION;
    const ssm = new AWS.SSM({ region });
    try {
        const ssmPath = core.getInput('ssm-path', { required: true });
        const format = core.getInput('format', { required: true });
        const output = core.getInput('output', { required: true });
        const prefix = core.getInput('prefix');
        try {
            const { Parameters } = await ssm
                .getParametersByPath({
                WithDecryption: true,
                Path: ssmPath,
                Recursive: true,
            })
                .promise();
            core.debug(`parameters length: ${Parameters.length}`);
            const envs = Parameters.map(p => ({
                Value: p.Value,
                Name: p.Name.split('/').pop(),
            }))
                .map(format_1.formatter(format)(prefix));
            if (envs.length > 0) {
                envs.push('\n');
            }
            fs_1.writeFileSync(output, envs.join('\n'));
        }
        catch (e) {
            core.error(e);
            core.setFailed(e.message);
        }
    }
    catch (e) {
        core.setFailed(e.message);
    }
}
run();
