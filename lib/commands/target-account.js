"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const inquirer = require("inquirer");
const axios_1 = require("axios");
const index_1 = require("../index");
const chalk_1 = require("chalk");
const fs_1 = require("fs");
// @ts-ignore
const node_persist_1 = require("node-persist");
const login_1 = require("./login");
const child_process_1 = require("child_process");
const cli_ux_1 = require("cli-ux");
class TargetAccount extends command_1.Command {
    constructor() {
        super(...arguments);
        this.userObject = {};
        this.targetAccounts = [];
        this.selectedEntity = {};
        this.updateCache = {};
        this.userCreds = '';
    }
    async run() {
        const { args, flags } = this.parse(TargetAccount);
        if (await login_1.alreadyLoggedIn()) {
            let userChoice = {};
            if (!Object.values(args).find(a => a)) {
                userChoice = await this.localMenu();
            }
            await this.actionManager(userChoice);
        }
        else {
            this.error('you are not logged in...');
        }
    }
    async localMenu() {
        const list = {
            type: 'list',
            name: 'target-account',
            message: 'Select an action',
            choices: [
                'Create target account',
                'List target accounts',
                'Update target account',
                'Archive target account',
                'Credentials file',
                'View target account',
                'Delete target account'
            ],
            default: 'List target accounts',
        };
        // @ts-ignore
        const action = await inquirer.prompt(list);
        return action;
    }
    async actionManager(userChoice) {
        const { args, flags } = this.parse(TargetAccount);
        if (flags.file) {
            await index_1.copyFile(flags.file).then((res) => {
                this.userObject = JSON.parse(res.toString());
            });
        }
        if (args['Create/List/Update/Archive/View/Credentials/Delete'] === 'create' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('create'))) {
            if (flags.file) {
                await this.injectUserFile('create');
            }
            else {
                await this.createTarget();
            }
        }
        if (args['Create/List/Update/Archive/View/Credentials/Delete'] === 'list' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('list'))) {
            await this.listAllTargets(true);
        }
        if (args['Create/List/Update/Archive/View/Credentials/Delete'] === 'view' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('view'))) {
            if (flags.id) {
                await this.listTarget(flags.id, true);
            }
            else {
                await this.select();
                await this.listTarget(this.selectedEntity['id'], true);
            }
        }
        if (args['Create/List/Update/Archive/View/Credentials/Delete'] === 'update' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('update'))) {
            if (flags.file) {
                await this.injectUserFile('update');
            }
            else {
                if (flags.id) {
                    await this.updateTarget(flags.id);
                }
                else {
                    await this.select();
                    await this.updateTarget(this.selectedEntity['id']);
                }
            }
        }
        if (args['Create/List/Update/Archive/View/Credentials/Delete'] === 'delete' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('delete'))) {
            if (flags.id) {
                await this.deleteTarget(flags.id);
            }
            else {
                await this.select();
                await this.deleteTarget(this.selectedEntity['id']);
            }
        }
        if (args['Create/List/Update/Archive/View/Credentials/Delete'] === 'credentials' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('credentials'))) {
            if (flags.id) {
                await this.attachCredsFile(flags.id);
            }
            else {
                await this.select();
                await this.attachCredsFile(this.selectedEntity['id']);
            }
        }
        // await this.localMenu();
    }
    async attachCredsFile(targetId) {
        const { args, flags } = this.parse(TargetAccount);
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        // TODO: handle if no creds
        // let blob: Blob;
        if (flags.credentials) {
            await index_1.copyFile(flags.credentials).then((res) => {
                // blob = Uint8Array.from(buffer).buffer;
                this.userCreds = JSON.parse(res.toString());
            });
            //BROKEN
            // const json = JSON.stringify(this.userCreds);
            //  blob = new Blob([json], {
            //   type: 'application/json'
            // });
            // const data = new FormData();
            // data.append("file", blob);
            // axios({
            //   method: 'post',
            //     url: `${protocol}${globalFlags.target}/${version}/target_accounts/${targetId}/credentials/file`,
            //   data: data,
            // }).then((res) => {console.log('YES', res)}).catch((e) => console.log(e));
        }
    }
    async injectUserFile(action) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start(``);
        // console.log('check that userObject is always defined here : ', this.userObject);
        switch (action) {
            case 'create':
                await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`New workload create from custom file: OK. Its id is: ${res['data']['id']}`));
                }).catch(error => {
                    this.error('Catched error on creating new target_account from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            case 'update':
                console.log('coco ', this.userObject);
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated target account from custom file: OK`));
                }).catch(error => {
                    if (this.userObject && this.userObject['id']) {
                        this.error('Cannot update with this file because it has no ID field... ');
                    }
                    console.log('Catched error on updating target account from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            default:
                break;
        }
        cli_ux_1.cli.action.stop();
    }
    filterFields(obj, filters) {
        let filtered = {};
        for (let i in obj) {
            if (!filters.find(f => f === i)) {
                filtered[i] = obj[i];
            }
        }
        return filtered;
    }
    async showSelectedEntityMenu(answer) {
        const { args, flags } = this.parse(TargetAccount);
        const filteredFields = ['id'];
        let selected = { 'target-account': 'SEND UPDATE' };
        const choices = Object.keys(this.filterFields(this.selectedEntity, filteredFields));
        choices.push('SEND UPDATE');
        const list = {
            type: 'list',
            name: 'target-account',
            message: 'Select the field you want to update',
            choices: choices,
            default: Object.keys(this.selectedEntity)[0],
        };
        if (answer.toLowerCase() === 'i' || answer.toLowerCase() === 'interactive') {
            // @ts-ignore
            selected = await inquirer.prompt(list);
        }
        else {
            selected[list.name] = 'manual';
        }
        if (selected[list.name] === 'manual') {
            await fs_1.promises.writeFile("json-templates/edited-entity.json", JSON.stringify(this.selectedEntity, null, 2));
            const editor = process.env.EDITOR || 'vi';
            const child = child_process_1.spawn(editor, ['json-templates/edited-entity.json'], {
                stdio: 'inherit'
            });
            await child.on('exit', async (e, code) => {
                await index_1.copyFile('json-templates/edited-entity.json').then((newCode) => {
                    this.userObject = JSON.parse(newCode.toString());
                    // console.log("finished", this.userObject);
                });
                const config = {
                    headers: { 'Authorization': "bearer " + index_1.user.data.token }
                };
                // console.log('before updating app : ', this.selectedEntity);
                cli_ux_1.cli.action.start('');
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts`, Object.assign(Object.assign({}, this.userObject), { orgId: index_1.user.data.orgId }), config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated target_account from cli editor: OK`));
                    cli_ux_1.cli.action.stop();
                }).catch(error => {
                    console.log('Catched error on updating target_account from cli editor: ');
                    cli_ux_1.cli.action.stop();
                });
                return;
            });
        }
        else if (selected[list.name] === 'SEND UPDATE') {
            const config = {
                headers: { 'Authorization': "bearer " + index_1.user.data.token }
            };
            // console.log('before updating app : ', this.selectedEntity);
            cli_ux_1.cli.action.start('');
            await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts`, Object.assign(Object.assign({}, this.selectedEntity), { orgId: index_1.user.data.orgId }), config).then((res) => {
                console.log(chalk_1.default.green.bold(`Updated target_account: OK`));
                cli_ux_1.cli.action.stop();
            }).catch((e) => {
                cli_ux_1.cli.action.stop();
                this.error(chalk_1.default.green.red(`Could not update target account`));
            });
            return;
        }
        else {
            this.log(chalk_1.default.blue.bold(`Current value of ${selected[list.name]}: ${this.selectedEntity[selected[list.name]]}`));
            const newValue = await index_1.hamdleMissingOption(selected[list.name], 'single', this.selectedEntity[selected[list.name]], null);
            this.selectedEntity[selected[list.name]] = newValue;
            await this.showSelectedEntityMenu(answer);
        }
    }
    async deleteTarget(targetId) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('deleting');
        await axios_1.default.delete(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts/${targetId}`, config).then((res) => {
            this.log(chalk_1.default.green.bold(`DELETE target account: OK`));
            cli_ux_1.cli.action.stop();
        }).catch(async (error) => {
            cli_ux_1.cli.action.stop();
            console.log('Catched error on DELETING target account: ');
        });
    }
    async updateTarget(targetId) {
        const { args, flags } = this.parse(TargetAccount);
        await this.listTarget(targetId, false);
        const filteredFields = ['id'];
        if (flags.name) {
            filteredFields.push('name');
            this.selectedEntity['name'] = flags.name;
        }
        if (flags.description) {
            filteredFields.push('description');
            this.selectedEntity['description'] = flags.description;
        }
        if (flags.provider) {
            filteredFields.push('provider');
            this.selectedEntity['provider '] = flags.provider;
        }
        const question = {
            type: `single`,
            name: `mode`,
            message: `Choose a mode: manual or interactive (m/i)? `,
            default: 'manual',
        };
        const answer = await inquirer.prompt([question]);
        await this.showSelectedEntityMenu(answer[question.name].toString());
    }
    async select() {
        await this.listAllTargets(false);
        const choices = [];
        const map = {};
        if (this.targetAccounts.length > 0) {
            this.targetAccounts.forEach((ta) => {
                choices.push(ta['name'] + ' ' + ta['id']);
                map[ta['name'] + ' ' + ta['id']] = ta;
            });
            const list = {
                type: 'list',
                name: 'target-account',
                message: 'Select a target account',
                choices: choices,
                default: choices[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            this.selectedEntity = map[selected[list.name]];
            await node_persist_1.setItem('targetAccount', this.selectedEntity);
        }
        else {
            this.log(chalk_1.default.red.bold('There is no target account yet, please create one'));
            process.exit(0);
        }
    }
    async listTarget(targetId, log) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts/${targetId}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`VIEW target account: OK`));
                index_1.showSingleTable(res['data']);
            }
            this.selectedEntity = res['data'];
        }).catch(async (error) => {
            console.log(chalk_1.default.red.bold('Catched error on GETTING target account: '));
            await this.select();
        });
    }
    async listAllTargets(log) {
        this.targetAccounts = [];
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts/organizations/${index_1.user.data.orgId}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`LIST target accounts: OK`));
                const tableTA = [
                    { name: 'name', header: 'NAME', nestedField: null, subField: null },
                    { name: 'id', header: 'ID', nestedField: null, subField: null },
                    { name: 'description', header: null, nestedField: null, subField: null },
                    { name: 'platform', header: null, nestedField: null, subField: null },
                    { name: 'accountId', header: 't-account ID', nestedField: null, subField: null },
                ];
                index_1.showTable(res['data'], tableTA);
            }
            this.targetAccounts = res['data'];
        }).catch(error => {
            console.log('Catched error on LISTING all target accounts: ', error);
            return error['data'];
        });
    }
    async createTarget() {
        const { args, flags } = this.parse(TargetAccount);
        const name = flags.name || await index_1.hamdleMissingOption('name', 'single', 'myTargetAccount', null);
        const description = flags.description || await index_1.hamdleMissingOption('description', 'single', '', null);
        const accountId = await index_1.hamdleMissingOption('accountId', 'single', 'gcp_Acc3', null);
        const provider = flags.provider || await index_1.hamdleMissingOption('provider', 'single', 'gcp', null);
        const orgId = index_1.user.data.orgId;
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const body = {
            name: name,
            description: description,
            accountId: accountId,
            provider: provider,
            orgId: orgId,
            credentials: 'fakeCreds',
            platform: provider.toUpperCase(),
            type: "string"
        };
        await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/target_accounts`, body, config).then((res) => {
            console.log(chalk_1.default.green.bold(`New target account: OK`));
            console.info(res['data']);
        }).catch(error => {
            console.log('Catched error on creating new target account: ');
        });
    }
}
exports.default = TargetAccount;
TargetAccount.description = 'Actions on target accounts';
TargetAccount.flags = {
    help: command_1.flags.help({ char: 'h' }),
    id: command_1.flags.string({ char: 'i', description: 'provide a targetAccount id' }),
    file: command_1.flags.string({ char: 'f', description: 'provide a json file representing a target-account' }),
    credentials: command_1.flags.string({ char: 'c', description: 'provide a json file representing the user credentials. Depends on [Credentials]' }),
    // name: flags.string({char: 'n', description: 'name to print'}),
    name: command_1.flags.string({ char: 'n', description: 'provide a name to create/update a target account' }),
    description: command_1.flags.string({ char: 'd', description: 'provide a description to create/update a target account' }),
    provider: command_1.flags.string({ char: 'p', description: 'give a provider name to create/update a target account' })
};
TargetAccount.args = [
    { name: 'Create/List/Update/Archive/View/Credentials/Delete' },
];
