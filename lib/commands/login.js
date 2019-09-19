"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const axios_1 = require("axios");
const namespace_1 = require("./namespace");
const chalk_1 = require("chalk");
// @ts-ignore
const node_persist_1 = require("node-persist");
const index_1 = require("../index");
exports.isLoggedIn = false;
exports.globalFlags = { file: '', target: 'tardis.dev.galaxy-nebula.com' };
class Login extends command_1.Command {
    async run() {
        this.log('LOOOL');
        const { flags } = this.parse(Login);
        if (flags.target)
            this.log(`--endpoint is: ${flags.target}`);
        if (flags.email)
            this.log(`--email is: ${flags.email}`);
        if (flags.password)
            this.log(`--password is: ${flags.password}`);
        if (flags.ns)
            this.log(`--ns is: ${flags.ns}`);
        if (!flags.target) {
            const target = await index_1.hamdleMissingOption('endpoint', 'single', exports.globalFlags.target, null);
            flags.target = target;
        }
        if (!flags.email) {
            const email = await index_1.hamdleMissingOption('email', 'single', 'albert.louzon@darillium.io', null);
            flags.email = email;
        }
        if (!flags.password) {
            const password = await index_1.hamdleMissingOption('password', 'single', undefined, null);
            flags.password = password;
        }
        await this.login(flags.email, flags.password, flags.target);
        await node_persist_1.setItem('userData', index_1.user.data);
        await namespace_1.default.prototype.selectNamespace();
    }
    async login(email, password, endpoint) {
        console.log('wanna login to : ', email, 'with password : ', password, ' to target : ', endpoint);
        node_persist_1.setItem('target', endpoint);
        exports.globalFlags.target = endpoint;
        const body = {
            user: email,
            password: password,
        };
        console.log('trying to login to : ', `${index_1.protocol}${endpoint}/${index_1.version}/signin`);
        await axios_1.default.post(`${index_1.protocol}${endpoint}/${index_1.version}/signin`, body).then(async (res) => {
            exports.isLoggedIn = true;
            console.log('sign in OK : ', res['data']['access_token']);
            if (res['data']) {
                index_1.user.data.token = res['data']['access_token'];
                const config = {
                    headers: { 'Authorization': "bearer " + index_1.user.data.token }
                };
                await axios_1.default.get(`${index_1.protocol}${endpoint}/${index_1.version}/users/${email}/id`, config).then(async (res) => {
                    index_1.user.data.id = res['data'];
                    await axios_1.default.get(`${index_1.protocol}${endpoint}/${index_1.version}/users/${index_1.user.data.id}`, config).then(async (res) => {
                        console.log(chalk_1.default.green.bold(`Hello ${res['data']['name']} ${res['data']['familyName']} and welcome to galaxy cli`));
                        index_1.user.full = res;
                        // user.data.namespaceId = res['data']['namespaces'][0]['id'];
                        index_1.user.data.orgId = res['data']['organization']['id'];
                        const { data: users } = await axios_1.default.get('https://jsonplaceholder.typicode.com/users');
                    }).catch(error => {
                        console.log('Catched an on get user info view  : ');
                    });
                }).catch(error => {
                    console.log('Catched an error on get user Id  : ');
                });
            }
        }).catch(error => {
            // console.log('error', error, ' ############# ')
            console.log(chalk_1.default.red.bold('Attempt to login failed....', error));
            process.exit(0);
        });
    }
}
exports.default = Login;
Login.args = [];
Login.flags = {
    // force: flags.boolean({char: 'f'}),
    target: command_1.flags.string({ char: 't', description: 'provide endpoint' }),
    help: command_1.flags.help({ char: 'h' }),
    email: command_1.flags.string({ char: 'u', description: 'provide email' }),
    password: command_1.flags.string({ char: 'p', description: 'provide password' }),
    ns: command_1.flags.string({ char: 'n', description: 'provide namespace id' }),
};
Login.description = 'Log in to a galaxy cluster';
async function alreadyLoggedIn() {
    if (await node_persist_1.getItem('userData') !== null && await node_persist_1.getItem('userData') !== undefined) {
        index_1.user.full = await node_persist_1.getItem('userFull');
        index_1.user.data = await node_persist_1.getItem('userData');
        exports.globalFlags.target = await node_persist_1.getItem('target');
        // console.info(chalk.blue.bold('WELCOME BACK !!'));
        return true;
    }
    else {
        console.info('No cached user found, please login: ');
        return false;
    }
}
exports.alreadyLoggedIn = alreadyLoggedIn;
