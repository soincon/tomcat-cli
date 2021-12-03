#!/usr/bin/env node

import fetch from 'node-fetch';
import { createRequire } from 'module';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { Headers } from 'node-fetch';
import meow from 'meow';
import { getTomcatSettings } from './deploy/deployUtils.mjs';

const lodash = createRequire(import.meta.url)('lodash');

const cli = meow(
    `
	Usage
	  $ deploy.js <options> war

	Options
    --public-url Path where the war will be deployed (default: <name of war file>).
    --env Environment which defines the .env variables. If you pass 'dev' it will use TOMCAT_USER_DEV, TOMCAT_PASSWORD_DEV, TOMCAT_MANAGER_URL_DEV.
    --user Username to login to Tomcat.
    --password Password to Tomcat.
    --tomcat-url Custom URL of Tomcat Manager (e.g. "https://dev.emisuite.es/manager").

    Command line options overwrite .env options. 

	Examples
	  $ deploy.js --env=dev --public-url=my-app ./myapp.war
`,
    {
        importMeta: import.meta,
        flags: {
            publicUrl: {
                default: '',
                type: 'string',
            },
            env: {
                type: 'string',
                default: 'dev',
            },
        },
    }
);

const warPath = cli.input[0];
const warName = warPath.split('/').pop().split('.')[0];
const publicUrl = cli.flags.publicUrl || warName;
const { parsed: dotEnv } = config();
const env = {
    ...dotEnv,
    ...(process.env.TOMCAT_USER && { TOMCAT_USER: process.env.TOMCAT_USER }),
    ...(process.env.TOMCAT_PASSWORD && { TOMCAT_PASSWORD: process.env.TOMCAT_PASSWORD }),
    ...(process.env.TOMCAT_MANAGER_URL && { TOMCAT_MANAGER_URL: process.env.TOMCAT_MANAGER_URL }),
};

const tomcat = getTomcatSettings(env, cli);
const url = `${tomcat.url}/text/deploy?path=/${lodash.trim(publicUrl, '/')}&update=true`;
const war = path.join(process.cwd(), warPath);
const fileSizeInBytes = fs.statSync(war).size;
const fileStream = fs.createReadStream(war);
const form = new FormData();
form.append('field-name', fileStream, { knownLength: fileSizeInBytes });
const auth = 'Basic ' + Buffer.from(tomcat.user + ':' + tomcat.password).toString('base64');
const headers = new Headers({
    Authorization: auth,
});

const options = {
    method: 'PUT',
    credentials: 'include',
    body: form,
    headers,
};

fetch(url, { ...options })
    .then((res) => {
        if (res.status !== 200) {
            console.error(`The request failed with status: ${res.status}. Status text: "${res.statusText}"`);
            process.exit(1);
        }
        return res;
    })
    .catch((e) => {
        console.error(`The request failed with error: ${e.message}.`);
        process.exit(1);
    });
